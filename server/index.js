import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import { createRoom, joinRoom, handlePlaceTile, rooms, activePlayers } from './gameState.js';
import { GameSession } from './models/GameSession.js';
import { User } from './models/User.js';
import { updateGlicko } from './utils/glicko.js';
import { startMatchmaker, joinMatchmaking, leaveMatchmaking } from './matchmaking.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const CLIENT_ORIGIN = process.env.CLIENT_URL || 'http://localhost:5173';

const io = new Server(server, {
  cors: {
    origin: CLIENT_ORIGIN,
    credentials: true
  }
});

app.use(cors({ origin: CLIENT_ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many requests, please try again later.' }
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { error: 'Too many accounts created from this IP, please try again after an hour.' }
});

app.use('/api/auth/register', registerLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/guest', authLimiter);

const refreshLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Too many requests, please try again later.' }
});
app.use('/api/auth/refresh', refreshLimiter);

app.use('/api/auth', authRoutes);

const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'Authentication required' });
  const token = authHeader.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

app.get('/api/matches/:matchId', requireAuth, async (req, res) => {
  try {
    const match = await GameSession.findById(req.params.matchId);
    if (!match) return res.status(404).json({ error: 'Match not found' });
    res.json(match);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

mongoose.connect(process.env.MONGO_URI, {})
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

async function applyRatingUpdate(gameSession, winnerNum) {
  const p1Record = gameSession.players.find(p => p.playerNumber === 1);
  const p2Record = gameSession.players.find(p => p.playerNumber === 2);
  if (!p1Record || !p2Record) return;

  const user1 = await User.findById(p1Record.userId);
  const user2 = await User.findById(p2Record.userId);
  if (!user1 || !user2) return;

  let s1 = 0.5, s2 = 0.5;
  let u1StatsInc = { 'stats.draws': 1 };
  let u2StatsInc = { 'stats.draws': 1 };

  if (winnerNum === 1) {
    s1 = 1; s2 = 0;
    u1StatsInc = { 'stats.wins': 1 };
    u2StatsInc = { 'stats.losses': 1 };
  } else if (winnerNum === 2) {
    s1 = 0; s2 = 1;
    u1StatsInc = { 'stats.losses': 1 };
    u2StatsInc = { 'stats.wins': 1 };
  }

  const newG1 = updateGlicko(user1.glicko.rating, user1.glicko.rd, user1.glicko.vol, [{ rating: user2.glicko.rating, rd: user2.glicko.rd, score: s1 }]);
  const newG2 = updateGlicko(user2.glicko.rating, user2.glicko.rd, user2.glicko.vol, [{ rating: user1.glicko.rating, rd: user1.glicko.rd, score: s2 }]);

  await User.findByIdAndUpdate(user1._id, { $inc: u1StatsInc, $set: { glicko: newG1 } });
  await User.findByIdAndUpdate(user2._id, { $inc: u2StatsInc, $set: { glicko: newG2 } });
}

io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));
  
  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return next(new Error('Authentication error'));
    socket.user = decoded;
    next();
  });
});

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.user.username} (${socket.id})`);

  socket.on('matchmaking:join', async (data) => {
    try {
      const fullUser = await User.findById(socket.user.userId);
      if (fullUser) {
        const isRated = fullUser.role === 'guest' ? false : data?.isRated !== false;
        joinMatchmaking(fullUser, socket.id, socket, isRated);
      }
    } catch (e) {
      console.error('Matchmaking error:', e);
    }
  });

  socket.on('matchmaking:leave', () => {
    leaveMatchmaking(socket.user.userId);
  });

  socket.on('room:create', () => {
    leaveMatchmaking(socket.user.userId);
    const roomId = crypto.randomBytes(4).toString('hex').toUpperCase();
    createRoom(roomId);
    
    const result = joinRoom(roomId, socket.user, socket.id);
    if (result.error) {
      rooms.delete(roomId);
      return socket.emit('game:error', { message: result.error });
    }
    
    socket.join(roomId);
    socket.roomId = roomId;
    socket.emit('room:created', { roomId });
  });

  const handleRoomJoin = async ({ roomId }) => {
    leaveMatchmaking(socket.user.userId);
    const result = joinRoom(roomId, socket.user, socket.id);
    if (result.error) {
      return socket.emit('game:error', { message: result.error });
    }

    socket.join(roomId);
    socket.roomId = roomId;

    const { room, playerNumber, isRejoin } = result;

    if (isRejoin) {
      if (room.state.phase === 'playing') {
        socket.emit('game:start', { 
          roomId,
          gameState: room.state, 
          players: room.players.map(p => ({ username: p.username, playerNumber: p.playerNumber })) 
        });
      } else {
        socket.emit('room:joined', { roomId, playerNumber, message: 'Waiting for opponent...' });
      }
      return;
    }
    
    if (room.players.length === 2) {
      room.state.phase = 'playing';
      
      const gameSession = new GameSession({
        _id: roomId,
        mapConfig: room.state.map,
        players: room.players.map(p => ({ userId: p.userId, username: p.username, playerNumber: p.playerNumber }))
      });
      room.sessionSavePromise = gameSession.save();
      await room.sessionSavePromise;

      io.to(roomId).emit('game:start', { 
        roomId,
        gameState: room.state, 
        players: room.players.map(p => ({ username: p.username, playerNumber: p.playerNumber })) 
      });
    } else {
      socket.emit('room:joined', { roomId, playerNumber, message: 'Waiting for opponent...' });
    }
  };

  socket.on('room:join', handleRoomJoin);
  socket.on('room:rejoin', handleRoomJoin);

  socket.on('room:spectate', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return socket.emit('game:error', { message: 'Room not found' });
    
    socket.join(roomId);
    socket.emit('game:start', { 
      roomId,
      gameState: room.state, 
      players: room.players.map(p => ({ username: p.username, playerNumber: p.playerNumber })) 
    });
  });

  socket.on('tile:place', async ({ roomId, playerNumber, index, tileValue }) => {
    if (socket.roomId !== roomId) {
      return socket.emit('game:error', { message: 'Unauthorized room access' });
    }

    const result = await handlePlaceTile(roomId, playerNumber, index, tileValue, socket.id);
    if (result.error) {
      return socket.emit('game:error', { message: result.error });
    }

    const room = rooms.get(roomId);
    io.to(roomId).emit('game:state', room.state);

    if (result.isBoardFull) {
      const gameSession = await GameSession.findByIdAndUpdate(roomId, {
        status: 'completed',
        boardSnapshot: room.state.board,
        winner: room.state.winner,
        scores: room.state.scores,
        duration: Date.now() - (room.state.moves[0]?.timestamp || Date.now()),
        completedAt: new Date(),
        $push: { moves: { $each: room.state.moves.slice(-10) } }
      }, { new: true });

      if (gameSession && gameSession.isRated) {
        await applyRatingUpdate(gameSession, room.state.winner);
      }

      room.players.forEach(p => activePlayers.delete(p.userId));
      rooms.delete(roomId);
    }
  });

  socket.on('disconnect', async () => {
    console.log(`User disconnected: ${socket.id}`);
    leaveMatchmaking(socket.user?.userId);
    const roomId = socket.roomId;
    if (roomId) {
      const room = rooms.get(roomId);
      if (room) {
        // Player disconnected mid-game
        const disconnectedPlayer = room.players.find(p => p.socketId === socket.id);
        if (disconnectedPlayer && room.state.phase === 'playing') {
          const winnerNum = disconnectedPlayer.playerNumber === 1 ? 2 : 1;
          room.state.phase = 'ended';
          room.state.winner = winnerNum;
          
          if (room.sessionSavePromise) {
            try { await room.sessionSavePromise; } catch {}
          }

          io.to(roomId).emit('game:error', { message: 'Opponent disconnected. You win by forfeit!' });
          io.to(roomId).emit('game:state', room.state);

          const gameSession = await GameSession.findByIdAndUpdate(roomId, {
            status: 'forfeited',
            boardSnapshot: room.state.board,
            winner: winnerNum,
            scores: room.state.scores,
            duration: Date.now() - (room.state.moves[0]?.timestamp || Date.now()),
            completedAt: new Date()
          }, { new: true });

          if (gameSession && gameSession.isRated) {
            await applyRatingUpdate(gameSession, winnerNum);
          }

          room.players.forEach(p => activePlayers.delete(p.userId));
          rooms.delete(roomId);
        }
      }
    }
  });
});

const PORT = process.env.PORT || 3001;

startMatchmaker(io);

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
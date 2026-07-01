import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import { createRoom, joinRoom, handlePlaceTile, rooms } from './gameState.js';
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
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: { error: 'Too many accounts created from this IP, please try again after an hour.' }
});

app.use('/api/auth/register', registerLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/guest', authLimiter);

app.use('/api/auth', authRoutes);

app.get('/api/matches/:matchId', async (req, res) => {
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

// Socket Auth Middleware
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
      const fullUser = await User.findById(socket.user.id);
      if (fullUser) {
        joinMatchmaking(fullUser, socket.id, socket, data?.isRated !== false);
      }
    } catch (e) {
      console.error('Matchmaking error:', e);
    }
  });

  socket.on('matchmaking:leave', () => {
    leaveMatchmaking(socket.user.id);
  });

  socket.on('room:create', () => {
    const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    createRoom(roomId);
    
    // Atomically join the creator
    const result = joinRoom(roomId, socket.user, socket.id);
    if (!result.error) {
      socket.join(roomId);
      socket.roomId = roomId;
    }
    
    socket.emit('room:created', { roomId });
  });

  socket.on('room:join', async ({ roomId }) => {
    const result = joinRoom(roomId, socket.user, socket.id);
    if (result.error) {
      return socket.emit('game:error', { message: result.error });
    }

    socket.join(roomId);
    socket.roomId = roomId;

    const { room, playerNumber } = result;
    
    if (room.players.length === 2) {
      room.state.phase = 'playing';
      
      const gameSession = new GameSession({
        _id: roomId,
        mapConfig: room.state.map,
        players: room.players.map(p => ({ userId: p.userId, username: p.username, playerNumber: p.playerNumber }))
      });
      await gameSession.save();

      io.to(roomId).emit('game:start', { 
        roomId,
        gameState: room.state, 
        players: room.players.map(p => ({ username: p.username, playerNumber: p.playerNumber })) 
      });
    } else {
      socket.emit('room:joined', { roomId, playerNumber, message: 'Waiting for opponent...' });
    }
  });

  socket.on('room:rejoin', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room) return socket.emit('game:error', { message: 'Room not found or game ended' });
    
    const player = room.players.find(p => p.userId === socket.user.id);
    if (player) {
      player.socketId = socket.id;
      socket.join(roomId);
      socket.roomId = roomId;
      socket.emit('game:start', { 
        roomId,
        gameState: room.state, 
        players: room.players.map(p => ({ username: p.username, playerNumber: p.playerNumber })) 
      });
    } else {
      socket.emit('game:error', { message: 'You are not part of this game' });
    }
  });

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

    const result = await handlePlaceTile(roomId, playerNumber, index, tileValue);
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
        duration: Date.now() - room.state.moves[0]?.timestamp,
        completedAt: new Date(),
        $push: { moves: { $each: room.state.moves.slice(-10) } }
      }, { new: true });

      if (gameSession && gameSession.isRated) {
        const p1Id = gameSession.players.find(p => p.playerNumber === 1).userId;
        const p2Id = gameSession.players.find(p => p.playerNumber === 2).userId;
        
        const user1 = await User.findById(p1Id);
        const user2 = await User.findById(p2Id);

        if (user1 && user2) {
          let s1 = 0.5, s2 = 0.5;
          if (room.state.winner === 1) { s1 = 1; s2 = 0; user1.stats.wins++; user2.stats.losses++; }
          else if (room.state.winner === 2) { s1 = 0; s2 = 1; user1.stats.losses++; user2.stats.wins++; }
          else { user1.stats.draws++; user2.stats.draws++; }

          const newG1 = updateGlicko(user1.glicko.rating, user1.glicko.rd, user1.glicko.vol, [{ rating: user2.glicko.rating, rd: user2.glicko.rd, score: s1 }]);
          const newG2 = updateGlicko(user2.glicko.rating, user2.glicko.rd, user2.glicko.vol, [{ rating: user1.glicko.rating, rd: user1.glicko.rd, score: s2 }]);

          user1.glicko = newG1;
          user2.glicko = newG2;
          await user1.save();
          await user2.save();
        }
      }

      rooms.delete(roomId);
    }
  });

  socket.on('disconnect', async () => {
    console.log(`User disconnected: ${socket.id}`);
    leaveMatchmaking(socket.user?.id);
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
            const p1Id = gameSession.players.find(p => p.playerNumber === 1).userId;
            const p2Id = gameSession.players.find(p => p.playerNumber === 2).userId;
            
            const user1 = await User.findById(p1Id);
            const user2 = await User.findById(p2Id);

            if (user1 && user2) {
              let s1 = winnerNum === 1 ? 1 : 0;
              let s2 = winnerNum === 2 ? 1 : 0;
              
              if (winnerNum === 1) { user1.stats.wins++; user2.stats.losses++; }
              else { user1.stats.losses++; user2.stats.wins++; }

              const newG1 = updateGlicko(user1.glicko.rating, user1.glicko.rd, user1.glicko.vol, [{ rating: user2.glicko.rating, rd: user2.glicko.rd, score: s1 }]);
              const newG2 = updateGlicko(user2.glicko.rating, user2.glicko.rd, user2.glicko.vol, [{ rating: user1.glicko.rating, rd: user1.glicko.rd, score: s2 }]);

              user1.glicko = newG1;
              user2.glicko = newG2;
              await user1.save();
              await user2.save();
            }
          }
        }
        rooms.delete(roomId);
      }
    }
  });
});

const PORT = process.env.PORT || 3001;

startMatchmaker(io);

server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

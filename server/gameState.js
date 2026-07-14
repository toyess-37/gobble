import { generateMap, N, OPERATORS } from '../shared/constants.js';
import { getCellData } from '../shared/cellData.js';
import { isValidPlacement } from '../src/utils/validation.js';
import { evaluateLines } from '../shared/gameLogic.js';
import { GameSession } from './models/GameSession.js';
import { User } from './models/User.js';

export const rooms = new Map();
export const activePlayers = new Map();

export const createRoom = (roomId, isRated = true) => {
  const mapConfig = generateMap();
  const room = {
    id: roomId,
    isRated,
    lastActivityAt: Date.now(),
    players: [],
    state: {
      map: mapConfig,
      board: Array(N * N).fill(null),
      p1Rack: { numbers: 6, operators: 6 },
      p2Rack: { numbers: 6, operators: 6 },
      currentPlayer: 1,
      scores: { p1: 0, p2: 0 },
      phase: 'waiting',
      winner: null,
      moves: [],
      scoredLines: [],
      evalStep: -1,
    }
  };
  rooms.set(roomId, room);
  return room;
};

export const joinRoom = (roomId, user, socketId) => {
  const room = rooms.get(roomId);
  if (!room) return { error: 'Room not found' };

  room.lastActivityAt = Date.now();

  const resolvedId = user.id || user.userId || user._id;

  // check if user is already in the room
  const existingPlayer = room.players.find(p => p.userId === resolvedId);
  if (existingPlayer) {
    existingPlayer.socketId = socketId;
    return { room, playerNumber: existingPlayer.playerNumber, isRejoin: true };
  }

  // Prevent joining a second game while already in one
  const activeRoomId = activePlayers.get(resolvedId);
  if (activeRoomId && activeRoomId !== roomId && rooms.has(activeRoomId)) {
    return { error: 'Already in an active game' };
  }

  if (room.players.length >= 2) return { error: 'Room is full' };

  const playerNumber = room.players.length + 1;
  const player = {
    userId: resolvedId,
    username: user.username,
    playerNumber,
    socketId
  };
  
  room.players.push(player);
  activePlayers.set(resolvedId, roomId);
  return { room, playerNumber, isRejoin: false };
};

export const handlePlaceTile = async (roomId, playerNumber, index, tileValue, socketId) => {
  const room = rooms.get(roomId);
  if (!room) return { error: 'Room not found' };
  
  room.lastActivityAt = Date.now();

  const state = room.state;
  if (state.phase !== 'playing') return { error: 'Game not active' };
  if (state.currentPlayer !== playerNumber) return { error: 'Not your turn' };

  const callingPlayer = room.players.find(p => p.playerNumber === playerNumber);
  if (!callingPlayer || callingPlayer.socketId !== socketId) return { error: 'Player slot mismatch' };

  const cellData = getCellData(index, state.map);

  if (!isValidPlacement(tileValue, cellData, index, state.board, state.map) || state.board[index] !== null) {
    return { error: 'Invalid placement' };
  }

  if (state.moves.length > 0) {
    const myMoves = state.moves.filter(m => m.player === playerNumber);
    const lastOwnMove = myMoves.length > 0 ? myMoves[myMoves.length - 1] : null;
    if (lastOwnMove) {
      const timeDiff = Date.now() - lastOwnMove.timestamp;
      if (timeDiff < 750) {
        const player = room.players.find(p => p.playerNumber === playerNumber);
        if (player && player.userId) {
          User.findByIdAndUpdate(player.userId, {
            $push: {
              flags: {
                reason: `Move too fast (${timeDiff}ms)`,
                gameId: roomId,
                timestamp: new Date()
              }
            }
          }).catch(err => console.error("Error flagging user:", err));
        }
      }
    }
  }

  let isOperator = OPERATORS.includes(tileValue);
  let currentRack = playerNumber === 1 ? state.p1Rack : state.p2Rack;

  if (isOperator && currentRack.operators <= 0) return { error: 'No operator tiles remaining' };
  if (!isOperator && currentRack.numbers <= 0) return { error: 'No number tiles remaining' };

  let valueToPlace = tileValue;
  if (!isOperator && cellData.isPink) {
    const numValue = parseInt(valueToPlace, 10);
    if (numValue !== 0) valueToPlace = `-${valueToPlace}`;
  }

  state.board[index] = { value: valueToPlace, player: playerNumber };

  if (isOperator) currentRack.operators -= 1;
  else currentRack.numbers -= 1;

  state.moves.push({
    turnNumber: state.moves.length + 1,
    player: playerNumber,
    row: Math.floor(index / N),
    col: index % N,
    tile: tileValue,
    effectiveTile: valueToPlace,
    timestamp: Date.now()
  });

  const evalResult = evaluateLines(state.board, state.map, state.scores, state.scoredLines);
  state.scores = evalResult.newScores;
  state.scoredLines.push(...evalResult.newlyScoredLines);

  let placedCount = state.board.filter(c => c !== null).length;
  const totalPlayableCells = (4 * N) - 4;
  let isBoardFull = placedCount >= totalPlayableCells;

  if (isBoardFull) {
    state.phase = 'evaluating';
    if (state.scores.p1 > state.scores.p2) state.winner = 1;
    else if (state.scores.p2 > state.scores.p1) state.winner = 2;
    else state.winner = 0;
  } else {
    state.currentPlayer = state.currentPlayer === 1 ? 2 : 1;
  }

  // Periodic MongoDB push (every 10 moves)
  if (state.moves.length % 10 === 0 && !isBoardFull) {
    GameSession.findByIdAndUpdate(roomId, {
      $push: { moves: { $each: state.moves.slice(-10) } }
    }, { new: true }).catch(err => console.error('Periodic save error:', err));
  }

  return { success: true, isBoardFull };
};

// Clean up abandoned waiting rooms every minute
setInterval(() => {
  const cutoff = Date.now() - 5 * 60 * 1000; // 5 minutes ago
  for (const [roomId, room] of rooms.entries()) {
    if (room.state.phase === 'waiting' && room.lastActivityAt < cutoff) {
      room.players.forEach(p => activePlayers.delete(p.userId));
      rooms.delete(roomId);
    }
  }
}, 60 * 1000);
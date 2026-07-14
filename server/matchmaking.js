import { createRoom, joinRoom, rooms, activePlayers } from './gameState.js';
import { GameSession } from './models/GameSession.js';
import crypto from 'crypto';

let queue = [];

export const joinMatchmaking = (user, socketId, socket, isRated = true) => {
  // Prevent duplicate queue entries for the same user
  const existing = queue.find(p => p.userId === user.id);
  if (existing) return;
  
  if (activePlayers.has(user.id)) return;

  console.log(`[Matchmaking] ${user.username} joined queue (rated: ${isRated}, rating: ${user.glicko?.rating || 1500})`);

  queue.push({
    userId: user.id,
    user: user,
    socketId: socketId,
    socket: socket,
    rating: user.glicko?.rating || 1500,
    isRated: isRated,
    joinedAt: Date.now()
  });
};

export const leaveMatchmaking = (userId) => {
  const before = queue.length;
  queue = queue.filter(p => p.userId !== userId);
  if (queue.length !== before) {
    console.log(`[Matchmaking] User ${userId} left queue`);
  }
};

export const startMatchmaker = (io) => {
  setInterval(() => {
    const now = Date.now();

    // Eject anyone who has waited longer than 30 seconds
    const timedOut = queue.filter(p => now - p.joinedAt > 30000);
    for (const p of timedOut) {
      console.log(`[Matchmaking] ${p.user.username} timed out after 30s`);
      p.socket.emit('matchmaking:failed', { message: 'No opponent found. Please try again.' });
    }
    queue = queue.filter(p => now - p.joinedAt <= 30000);

    if (queue.length < 2) return;

    // Sort by join time so older players get matched first
    queue.sort((a, b) => a.joinedAt - b.joinedAt);
    const matchedIndices = new Set();

    for (let i = 0; i < queue.length; i++) {
      if (matchedIndices.has(i)) continue;

      const p1 = queue[i];
      const waitTimeP1 = Math.floor((now - p1.joinedAt) / 1000);
      const p1Range = 50 + (waitTimeP1 * 10);

      for (let j = i + 1; j < queue.length; j++) {
        if (matchedIndices.has(j)) continue;

        const p2 = queue[j];

        // Both players must want the same mode
        if (p1.isRated !== p2.isRated) continue;

        const waitTimeP2 = Math.floor((now - p2.joinedAt) / 1000);
        const p2Range = 50 + (waitTimeP2 * 10);
        const ratingDiff = Math.abs(p1.rating - p2.rating);

        // For unrated, skip rating check entirely
        if (!p1.isRated || ratingDiff <= Math.max(p1Range, p2Range)) {
          matchedIndices.add(i);
          matchedIndices.add(j);

          console.log(`[Matchmaking] Matched ${p1.user.username} vs ${p2.user.username}`);

          // Fire-and-forget the async room setup
          createMatchRoom(io, p1, p2).catch(err => {
            console.error('[Matchmaking] Failed to create match room:', err);
            p1.socket.emit('matchmaking:failed', { message: 'Failed to create match. Please try again.' });
            p2.socket.emit('matchmaking:failed', { message: 'Failed to create match. Please try again.' });
          });

          break;
        }
      }
    }

    queue = queue.filter((_, idx) => !matchedIndices.has(idx));
  }, 2000);
};

async function createMatchRoom(io, p1, p2) {
  const roomId = crypto.randomBytes(4).toString('hex').toUpperCase();
  createRoom(roomId, p1.isRated);

  const result1 = joinRoom(roomId, p1.user, p1.socketId);
  const result2 = joinRoom(roomId, p2.user, p2.socketId);

  if (result1.error || result2.error) {
    const room = rooms.get(roomId);
    if (room) {
      room.players.forEach(pl => activePlayers.delete(pl.userId));
      rooms.delete(roomId);
    }
    p1.socket.emit('matchmaking:failed', { message: 'Failed to create match. Please try again.' });
    p2.socket.emit('matchmaking:failed', { message: 'Failed to create match. Please try again.' });
    return;
  }

  p1.socket.join(roomId);
  p2.socket.join(roomId);
  p1.socket.roomId = roomId;
  p2.socket.roomId = roomId;

  const room = rooms.get(roomId);
  room.state.phase = 'playing';

  const gameSession = new GameSession({
    _id: roomId,
    isRated: p1.isRated,
    mapConfig: room.state.map,
    players: room.players.map(p => ({
      userId: p.userId,
      username: p.username,
      playerNumber: p.playerNumber
    }))
  });
  room.sessionSavePromise = gameSession.save();
  await room.sessionSavePromise;

  io.to(roomId).emit('game:start', {
    roomId,
    gameState: room.state,
    players: room.players.map(p => ({
      username: p.username,
      playerNumber: p.playerNumber
    }))
  });

  p1.socket.emit('match:found', { roomId });
  p2.socket.emit('match:found', { roomId });
}
import { createRoom, joinRoom, rooms } from './gameState.js';
import { GameSession } from './models/GameSession.js';

let queue = [];

export const joinMatchmaking = (user, socketId, socket, isRated = true) => {
  if (queue.find(p => p.userId === user.id)) return;

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
  queue = queue.filter(p => p.userId !== userId);
};

export const startMatchmaker = (io) => {
  setInterval(async () => {
    if (queue.length < 2) {
      const now = Date.now();
      queue = queue.filter(p => {
        if (now - p.joinedAt > 30000) {
          p.socket.emit('matchmaking:failed', { message: 'No opponent found. Please try again.' });
          return false;
        }
        return true;
      });
      return;
    }

    const now = Date.now();
    queue.sort((a, b) => a.joinedAt - b.joinedAt);
    let matchedIndices = new Set();

    for (let i = 0; i < queue.length; i++) {
      if (matchedIndices.has(i)) continue;
      
      const p1 = queue[i];
      const waitTimeP1 = Math.floor((now - p1.joinedAt) / 1000);
      
      if (waitTimeP1 > 30) {
        p1.socket.emit('matchmaking:failed', { message: 'No opponent found. Please try again.' });
        matchedIndices.add(i);
        continue;
      }

      const p1AcceptableDiff = 50 + (waitTimeP1 * 10);

      for (let j = i + 1; j < queue.length; j++) {
        if (matchedIndices.has(j)) continue;

        const p2 = queue[j];
        if (p1.isRated !== p2.isRated) continue;

        const waitTimeP2 = Math.floor((now - p2.joinedAt) / 1000);
        const p2AcceptableDiff = 50 + (waitTimeP2 * 10);

        const ratingDiff = Math.abs(p1.rating - p2.rating);

        if (!p1.isRated || ratingDiff <= Math.max(p1AcceptableDiff, p2AcceptableDiff)) {
          matchedIndices.add(i);
          matchedIndices.add(j);

          const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
          createRoom(roomId, p1.isRated);
          
          joinRoom(roomId, p1.user, p1.socketId);
          joinRoom(roomId, p2.user, p2.socketId);
          
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
            players: room.players.map(p => ({ userId: p.userId, username: p.username, playerNumber: p.playerNumber }))
          });
          await gameSession.save();

          io.to(roomId).emit('game:start', { 
            roomId,
            gameState: room.state, 
            players: room.players.map(p => ({ username: p.username, playerNumber: p.playerNumber })) 
          });

          p1.socket.emit('match:found', { roomId });
          p2.socket.emit('match:found', { roomId });

          break;
        }
      }
    }

    queue = queue.filter((_, idx) => !matchedIndices.has(idx));

    queue = queue.filter(p => {
      if (now - p.joinedAt > 30000) {
        p.socket.emit('matchmaking:failed', { message: 'No opponent found. Please try again.' });
        return false;
      }
      return true;
    });

  }, 2000);
};

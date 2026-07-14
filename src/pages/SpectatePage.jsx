import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Board from '../components/Board.jsx';
import Rack from '../components/Rack.jsx';
import { THEME, N } from '../utils/constants.js';
import { useSocket } from '../contexts/SocketContext.jsx';

export default function SpectatePage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();
  
  const [state, setState] = useState(null);
  const [players, setPlayers] = useState([]);
  const [gameError, setGameError] = useState('');

  // Handle Socket events
  useEffect(() => {
    if (!socket) return;

    const onGameState = (newState) => {
      setState(newState);
    };

    const onGameStart = ({ roomId: serverRoomId, gameState, players: gamePlayers }) => {
      setPlayers(gamePlayers);
      setState(gameState);
    };

    const onGameError = ({ message }) => {
      setGameError(message);
      setTimeout(() => setGameError(''), 3000);
    };

    const onConnect = () => {
      socket.emit('room:spectate', { roomId });
    };

    socket.on('game:state', onGameState);
    socket.on('game:start', onGameStart);
    socket.on('game:error', onGameError);
    socket.on('connect', onConnect);

    if (isConnected) {
      socket.emit('room:spectate', { roomId });
    }

    return () => {
      socket.off('game:state', onGameState);
      socket.off('game:start', onGameStart);
      socket.off('game:error', onGameError);
      socket.off('connect', onConnect);
    };
  }, [socket, roomId, isConnected]);

  if (!state || !state.map) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-bg text-text font-sans">
        <h2 className="mb-4 text-3xl">Spectating Room: {roomId}</h2>
        <p className="text-text-subtle text-lg">Waiting for game data...</p>
      </div>
    );
  }

  const p1Name = players.find(p => p.playerNumber === 1)?.username || "Player 1";
  const p2Name = players.find(p => p.playerNumber === 2)?.username || "Player 2";

  return (
    <div className="bg-bg min-h-screen text-text flex flex-col font-sans">
      <header className="px-6 py-4 flex justify-between items-center border-b border-border">
        <h1 className="m-0 text-2xl text-error font-bold flex items-center gap-2">
          <span className="text-sm">🔴</span> LIVE MATCH
        </h1>
        <div className="text-text-subtle text-sm">1 Viewer</div>
        <button onClick={() => navigate('/lobby')} className="px-4 py-1.5 bg-transparent text-white border border-border rounded cursor-pointer transition-colors duration-200 hover:bg-border font-sans font-medium">Exit</button>
      </header>

      <div className="bg-bg-card px-4 sm:px-6 py-3 flex justify-between items-center border-b border-border">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="w-8 h-8 rounded-md flex items-center justify-center font-bold text-sm sm:text-base" style={{ backgroundColor: THEME.red.bg, color: THEME.red.color }}>
            {p1Name[0].toUpperCase()}
          </div>
          <div className="font-bold text-base sm:text-lg">{p1Name}</div>
          <div className="text-xl sm:text-2xl font-bold" style={{ color: THEME.red.color }}>{state.scores.p1}</div>
        </div>

        <div className="text-xl sm:text-2xl font-bold text-white">00:00</div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="text-xl sm:text-2xl font-bold" style={{ color: THEME.blue.color }}>{state.scores.p2}</div>
          <div className="font-bold text-base sm:text-lg">{p2Name}</div>
          <div className="w-8 h-8 rounded-md flex items-center justify-center font-bold text-sm sm:text-base" style={{ backgroundColor: THEME.blue.bg, color: THEME.blue.color }}>
            {p2Name[0].toUpperCase()}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="pointer-events-none">
          <Board
            selectedTile={null}
            boardState={state.board}
            onCellClick={() => {}}
            gameMap={state.map}
            evalStep={-1}
          />
        </div>
        <div className="mt-8 text-text-subtle bg-bg-card px-6 py-3 rounded-lg border border-border text-center text-sm">
          You are currently spectating. You cannot interact with the board.
        </div>
      </div>
    </div>
  );
}

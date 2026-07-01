import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Board from '../components/Board.jsx';
import Rack from '../components/Rack.jsx';
import { THEME, N } from '../utils/constants.js';
import { useSocket } from '../contexts/SocketContext.jsx';
import '../styles/components.css';

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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#1a1a1a', color: '#eaeaea' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '32px' }}>Spectating Room: {roomId}</h2>
        <p style={{ color: '#aaa', fontSize: '18px' }}>Waiting for game data...</p>
      </div>
    );
  }

  const p1Name = players.find(p => p.playerNumber === 1)?.username || "Player 1";
  const p2Name = players.find(p => p.playerNumber === 2)?.username || "Player 2";

  return (
    <div style={{ backgroundColor: '#1a1a1a', minHeight: '100vh', color: '#eaeaea', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333' }}>
        <h1 style={{ margin: 0, fontSize: '24px', color: '#ff6b6b' }}>
          <span style={{ fontSize: '12px', verticalAlign: 'middle', marginRight: '8px' }}>🔴 LIVE MATCH</span>
        </h1>
        <div style={{ color: '#aaa', fontSize: '14px' }}>1 Viewer</div>
        <button onClick={() => navigate('/lobby')} style={{ padding: '6px 16px', backgroundColor: 'transparent', color: '#fff', border: '1px solid #333', borderRadius: '4px', cursor: 'pointer' }}>Exit</button>
      </header>

      <div style={{ backgroundColor: '#242424', padding: '12px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '32px', height: '32px', backgroundColor: THEME.blue.bg, color: THEME.blue.color, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
            {p1Name[0].toUpperCase()}
          </div>
          <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{p1Name}</div>
          <div style={{ color: THEME.blue.color, fontSize: '24px', fontWeight: 'bold' }}>{state.scores.p1}</div>
        </div>

        <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#fff' }}>00:00</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ color: THEME.red.color, fontSize: '24px', fontWeight: 'bold' }}>{state.scores.p2}</div>
          <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{p2Name}</div>
          <div style={{ width: '32px', height: '32px', backgroundColor: THEME.red.bg, color: THEME.red.color, borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
            {p2Name[0].toUpperCase()}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ pointerEvents: 'none' }}>
          <Board
            selectedTile={null}
            boardState={state.board}
            onCellClick={() => {}}
            gameMap={state.map}
            evalStep={-1}
          />
        </div>
        <div style={{ marginTop: '32px', color: '#aaa', backgroundColor: '#242424', padding: '12px 24px', borderRadius: '8px', border: '1px solid #333' }}>
          You are currently spectating. You cannot interact with the board.
        </div>
      </div>
    </div>
  );
}

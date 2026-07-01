import React, { useReducer, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Board from '../components/Board.jsx';
import Rack from '../components/Rack.jsx';
import { THEME, N, OPERATORS } from '../utils/constants.js';
import { getCellData } from '../../shared/cellData.js';
import { isValidPlacement } from '../utils/validation.js';
import { evaluateLines } from '../../shared/gameLogic.js';
import { useSocket } from '../contexts/SocketContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';
import '../styles/components.css';

const initGameState = () => ({
  map: null,
  board: null,
  p1Rack: null,
  p2Rack: null,
  currentPlayer: null,
  scores: null,
  phase: null,
  winner: null,
  moves: [],
  scoredLines: [],
  selectedTile: null,
  evalStep: -1,
});

function gameReducer(state, action) {
  if (action.type === 'SET_SERVER_STATE') {
    // Reconcile with server state. Overwrite entirely, preserving only local UI selection if still valid.
    return { ...initGameState(), ...action.payload, selectedTile: state.selectedTile };
  } else if (action.type === 'SELECT_TILE') {
    const { value, player } = action.payload;
    if (state.selectedTile !== null && state.selectedTile.value === value && state.selectedTile.player === player) {
      return { ...state, selectedTile: null };
    }
    return { ...state, selectedTile: { value, player } };
  } else if (action.type === 'EVAL_STEP') {
    return { ...state, evalStep: action.payload };
  } else if (action.type === 'OPTIMISTIC_MOVE') {
    // Apply move locally for instant feedback
    const { index, tileValue, playerNumber } = action.payload;
    const newBoard = [...state.board];
    
    let valueToPlace = tileValue;
    const cellData = getCellData(index, state.map);
    if (cellData.isPink) {
      const numValue = parseInt(valueToPlace, 10);
      if (numValue !== 0) valueToPlace = `-${valueToPlace}`;
    }
    
    newBoard[index] = { value: valueToPlace, player: playerNumber };
    
    const newP1Rack = { ...state.p1Rack };
    const newP2Rack = { ...state.p2Rack };
    const isOp = OPERATORS.includes(tileValue);
    
    if (playerNumber === 1) {
      if (isOp) newP1Rack.operators--;
      else newP1Rack.numbers--;
    } else {
      if (isOp) newP2Rack.operators--;
      else newP2Rack.numbers--;
    }

    const nextPlayer = state.currentPlayer === 1 ? 2 : 1;

    return { 
      ...state, 
      board: newBoard, 
      p1Rack: newP1Rack, 
      p2Rack: newP2Rack,
      currentPlayer: nextPlayer,
      selectedTile: null 
    };
  }
  return state;
}

export default function GamePage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { socket, isConnected } = useSocket();
  const { user } = useAuth();
  
  const [state, dispatch] = useReducer(gameReducer, null, initGameState);
  const [players, setPlayers] = useState([]);
  const [gameError, setGameError] = useState('');

  // Handle Socket events
  useEffect(() => {
    if (!socket) return;

    const onGameState = (newState) => {
      dispatch({ type: 'SET_SERVER_STATE', payload: newState });
    };

    const onGameStart = ({ roomId: serverRoomId, gameState, players: gamePlayers }) => {
      setPlayers(gamePlayers);
      dispatch({ type: 'SET_SERVER_STATE', payload: gameState });
    };

    const onGameError = ({ message }) => {
      setGameError(message);
      setTimeout(() => setGameError(''), 3000);
    };

    const onConnect = () => {
      // Reconnect logic
      socket.emit('room:rejoin', { roomId });
    };

    socket.on('game:state', onGameState);
    socket.on('game:start', onGameStart);
    socket.on('game:error', onGameError);
    socket.on('connect', onConnect);

    // Initial join/rejoin when mounting
    if (isConnected) {
      socket.emit('room:rejoin', { roomId }); // Backend must support room:rejoin
    }

    return () => {
      socket.off('game:state', onGameState);
      socket.off('game:start', onGameStart);
      socket.off('game:error', onGameError);
      socket.off('connect', onConnect);
    };
  }, [socket, roomId, isConnected]);

  // Post-game redirect or evaluation animation
  useEffect(() => {
    if (state.phase === 'evaluating') {
      let currentStep = 0;
      const interval = setInterval(() => {
        dispatch({ type: 'EVAL_STEP', payload: currentStep });
        currentStep++;
        if (currentStep > N) {
          clearInterval(interval);
        }
      }, 300);
      return () => clearInterval(interval);
    } else if (state.phase === 'ended') {
      setTimeout(() => {
        navigate(`/postgame/${roomId}`);
      }, 3000);
    }
  }, [state.phase, navigate, roomId]);

  const handleRackTileClick = (value, playerNum) => {
    if (playerNum !== state.currentPlayer || state.phase !== 'playing') return;
    
    let isOperator = OPERATORS.includes(value);
    let currentRack = playerNum === 1 ? state.p1Rack : state.p2Rack;

    if (isOperator && currentRack.operators <= 0) return;
    if (!isOperator && currentRack.numbers <= 0) return;
    
    dispatch({ type: 'SELECT_TILE', payload: { value, player: playerNum } });
  };

  const handleBoardCellClick = (index, cellData) => {
    if (state.selectedTile === null || state.phase !== 'playing') return;
    
    const myPlayerInfo = players.find(p => p.username === user.username);
    if (!myPlayerInfo || myPlayerInfo.playerNumber !== state.currentPlayer) return;

    if (isValidPlacement(state.selectedTile.value, cellData, index, state.board, state.map) && state.board[index] === null) {
      // Optimistic Update
      dispatch({ 
        type: 'OPTIMISTIC_MOVE', 
        payload: { index, tileValue: state.selectedTile.value, playerNumber: state.currentPlayer } 
      });

      // Send to server
      socket.emit('tile:place', { 
        roomId,
        playerNumber: state.currentPlayer,
        index,
        tileValue: state.selectedTile.value 
      });
    }
  };

  if (!state.map) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#1a1a1a', color: '#eaeaea' }}>
        <h2 style={{ marginBottom: '16px', fontSize: '32px' }}>Room: {roomId}</h2>
        <p style={{ color: '#aaa', fontSize: '18px' }}>Waiting for opponent or syncing state...</p>
      </div>
    );
  }

  let p1Selected = null;
  if (state.selectedTile !== null && state.selectedTile.player === 1) p1Selected = state.selectedTile.value;

  let p2Selected = null;
  if (state.selectedTile !== null && state.selectedTile.player === 2) p2Selected = state.selectedTile.value;

  const myPlayerInfo = players.find(p => p.username === user?.username);
  const myNumber = myPlayerInfo ? myPlayerInfo.playerNumber : null;

  let p1Inactive = state.currentPlayer !== 1 || state.phase !== 'playing' || myNumber !== 1;
  let p2Inactive = state.currentPlayer !== 2 || state.phase !== 'playing' || myNumber !== 2;

  const p1Name = players.find(p => p.playerNumber === 1)?.username || "Player 1";
  const p2Name = players.find(p => p.playerNumber === 2)?.username || "Player 2";

  // Derive postfix stack for the latest move
  let currentStackStr = "No evaluation yet";
  if (state.moves && state.moves.length > 0) {
    const lastMove = state.moves[state.moves.length - 1];
    currentStackStr = `Last placed: ${lastMove.effectiveTile} at (${lastMove.row}, ${lastMove.col})`;
    // We could build a full evaluation trace here, but keeping it simple for UI representation
  }

  return (
    <div style={{ backgroundColor: '#1a1a1a', minHeight: '100vh', color: '#eaeaea', display: 'flex', flexDirection: 'column' }}>
      <header style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #333' }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>Gobble - {roomId}</h1>
        {gameError && <div style={{ color: '#ff6b6b' }}>{gameError}</div>}
      </header>

      <div style={{ display: 'flex', flex: 1, padding: '24px', gap: '24px', overflow: 'hidden' }}>
        
        {/* Left Panel: Move Log */}
        <div style={{ width: '250px', backgroundColor: '#242424', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', border: '1px solid #333' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', textTransform: 'uppercase', color: '#888' }}>Move Log</h3>
          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {state.moves.map(m => (
              <div key={m.turnNumber} style={{ fontSize: '12px', padding: '8px', backgroundColor: '#1a1a1a', borderRadius: '4px' }}>
                <span style={{ color: m.player === 1 ? THEME.red.color : THEME.blue.color, fontWeight: 'bold' }}>
                  {m.player === 1 ? p1Name : p2Name}
                </span> placed <b>{m.effectiveTile}</b> at ({m.row}, {m.col})
              </div>
            ))}
          </div>
        </div>

        {/* Center: Board & Racks */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div className="game-layout">
            <Rack
              playerName={p1Name}
              theme={THEME.red}
              rackData={state.p1Rack}
              onTileClick={(val) => handleRackTileClick(val, 1)}
              selectedTile={p1Selected}
              isInactivePlayer={p1Inactive}
            />
            <Board
              selectedTile={state.selectedTile}
              boardState={state.board}
              onCellClick={handleBoardCellClick}
              gameMap={state.map}
              evalStep={state.evalStep}
            />
            <Rack
              playerName={p2Name}
              theme={THEME.blue}
              rackData={state.p2Rack}
              onTileClick={(val) => handleRackTileClick(val, 2)}
              selectedTile={p2Selected}
              isInactivePlayer={p2Inactive}
            />
          </div>
        </div>

        {/* Right Panel: Postfix Stack */}
        <div style={{ width: '250px', backgroundColor: '#242424', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', border: '1px solid #333' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', textTransform: 'uppercase', color: '#888' }}>Postfix Visualizer</h3>
          <div style={{ padding: '16px', backgroundColor: '#1a1a1a', borderRadius: '8px', color: '#aaa', fontSize: '14px', textAlign: 'center' }}>
            {currentStackStr}
          </div>
          <div style={{ marginTop: 'auto', textAlign: 'center' }}>
            <div style={{ color: THEME.red.color, fontSize: '32px', fontWeight: 'bold' }}>{state.scores.p1}</div>
            <div style={{ color: '#888', fontSize: '12px', marginBottom: '8px' }}>{p1Name}</div>
            <div style={{ color: THEME.blue.color, fontSize: '32px', fontWeight: 'bold' }}>{state.scores.p2}</div>
            <div style={{ color: '#888', fontSize: '12px' }}>{p2Name}</div>
          </div>
        </div>

      </div>
    </div>
  );
}

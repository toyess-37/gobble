import React, { useReducer, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Board from '../components/Board.jsx';
import Rack from '../components/Rack.jsx';
import CopyButton from '../components/CopyButton.jsx';
import { THEME, N, OPERATORS } from '../utils/constants.js';
import { getCellData } from '../../shared/cellData.js';
import { isValidPlacement } from '../utils/validation.js';
import { evaluateLines } from '../../shared/gameLogic.js';
import { useSocket } from '../contexts/SocketContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

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
      socket.emit('room:join', { roomId });
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
          setTimeout(() => {
            navigate(`/postgame/${roomId}`);
          }, 1500); // Wait 1.5s after animation finishes before redirecting
        }
      }, 700); // 700ms gives time to read the text
      return () => clearInterval(interval);
    } 
  }, [state.phase, navigate, roomId, dispatch]);

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
    const inviteLink = `${window.location.origin}/game/${roomId}`;
    
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-bg text-text font-sans p-6">
        <div className="bg-bg-card border border-border rounded-2xl p-8 sm:p-12 text-center max-w-md w-full shadow-lg">
          <h2 className="mb-6 text-2xl sm:text-3xl font-bold">Room Created</h2>
          
          <div className="mb-8">
            <p className="text-text-muted mb-2 text-sm uppercase tracking-widest font-bold">Room Code</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl sm:text-4xl font-black text-primary tracking-[0.2em]">{roomId}</span>
              <CopyButton textToCopy={roomId} label="" className="p-2 bg-transparent border-none text-text-subtle hover:text-white" />
            </div>
          </div>
          
          <div className="mb-8">
            <p className="text-text-muted mb-2 text-sm uppercase tracking-widest font-bold">Invite Link</p>
            <div className="flex items-center gap-2 bg-bg-input rounded-lg border border-border p-2">
              <input 
                type="text" 
                value={inviteLink} 
                readOnly 
                className="bg-transparent border-none text-text-subtle text-sm flex-1 outline-none truncate" 
              />
              <CopyButton textToCopy={inviteLink} />
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 text-text-subtle">
            <div className="w-4 h-4 border-2 border-t-primary border-r-transparent border-b-primary border-l-transparent rounded-full animate-spin"></div>
            <p className="text-lg font-medium">Waiting for opponent...</p>
          </div>
        </div>
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

  // Dynamic readout banner for moves and evaluation
  let currentStackStr = "Game Started - Place your first tile!";
  if (state.phase === 'evaluating') {
    if (state.evalStep >= 0 && state.evalStep < N) {
      const evaluatingLines = state.scoredLines?.filter(l => l.index === state.evalStep) || [];
      if (evaluatingLines.length > 0) {
         const descriptions = evaluatingLines.map(l => {
           const pName = l.player === 1 ? p1Name : p2Name;
           const scoreStr = l.score > 0 ? `+${l.score}` : l.score;
           return `${pName} scores ${scoreStr} on ${l.lineType}`;
         });
         currentStackStr = `Evaluating Step ${state.evalStep + 1}: ` + descriptions.join(' | ');
      } else {
         currentStackStr = `Evaluating Step ${state.evalStep + 1}... (No points scored)`;
      }
    } else if (state.evalStep >= N) {
      currentStackStr = "Evaluation Complete! Calculating final results...";
    }
  } else if (state.moves && state.moves.length > 0) {
    const lastMove = state.moves[state.moves.length - 1];
    const playerName = lastMove.player === 1 ? p1Name : p2Name;
    currentStackStr = `${playerName} placed ${lastMove.effectiveTile} at (${lastMove.row}, ${lastMove.col})`;
  }

  const isP2 = myNumber === 2;

  const leftScore = isP2 ? state.scores.p2 : state.scores.p1;
  const leftName = isP2 ? p2Name : p1Name;
  const leftColor = isP2 ? THEME.blue.color : THEME.red.color;

  const rightScore = isP2 ? state.scores.p1 : state.scores.p2;
  const rightName = isP2 ? p1Name : p2Name;
  const rightColor = isP2 ? THEME.red.color : THEME.blue.color;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen w-full overflow-hidden bg-[radial-gradient(circle_at_center,#1a1a1a_0%,#060607_100%)] p-5 font-sans text-text">
      <header className="mb-5 text-center">
        <h1 className="text-text m-0 text-2xl sm:text-3xl font-semibold">Gobble - {roomId}</h1>
        {gameError && <div className="text-error mt-2 font-semibold">{gameError}</div>}
      </header>

      <div className="w-full max-w-7xl mx-auto">
        <div className="flex flex-col items-center w-full">
          <div className="flex items-center gap-10 mb-6">
            <div className="flex flex-col items-center">
              <div className="text-5xl sm:text-6xl font-bold" style={{ color: leftColor }}>{leftScore}</div>
              <div className="text-text-muted mt-2 font-bold uppercase tracking-wider text-sm">{leftName}</div>
            </div>
            <div className="text-xl font-bold text-text-subtle">vs</div>
            <div className="flex flex-col items-center">
              <div className="text-5xl sm:text-6xl font-bold" style={{ color: rightColor }}>{rightScore}</div>
              <div className="text-text-muted mt-2 font-bold uppercase tracking-wider text-sm">{rightName}</div>
            </div>
          </div>

          <div className={`mb-8 px-6 py-3 rounded-xl border border-border font-medium text-center shadow-sm transition-all duration-300 ${state.phase === 'evaluating' ? 'bg-primary/20 border-primary text-white scale-105' : 'bg-bg-card text-text-subtle'}`}>
            {currentStackStr}
          </div>

          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 md:gap-14 w-full justify-center">
            {isP2 ? (
              <>
                <Rack
                  playerName={p2Name}
                  theme={THEME.blue}
                  rackData={state.p2Rack}
                  onTileClick={(val) => handleRackTileClick(val, 2)}
                  selectedTile={p2Selected}
                  isInactivePlayer={p2Inactive}
                />
                <Board
                  selectedTile={state.selectedTile}
                  boardState={state.board}
                  onCellClick={handleBoardCellClick}
                  gameMap={state.map}
                  evalStep={state.evalStep}
                />
                <Rack
                  playerName={p1Name}
                  theme={THEME.red}
                  rackData={state.p1Rack}
                  onTileClick={(val) => handleRackTileClick(val, 1)}
                  selectedTile={p1Selected}
                  isInactivePlayer={p1Inactive}
                />
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
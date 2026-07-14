import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';

export default function LobbyPage() {
  const { user, logout } = useAuth();
  const { socket, isConnected } = useSocket();
  const navigate = useNavigate();
  
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchTime, setSearchTime] = useState(0);

  // WARNING: The following state variables are mocked because their backend 
  // endpoints (/api/users/leaderboard, server:stats, matchmaking) do not exist yet.
  const [onlineCount, setOnlineCount] = useState(4213);
  const [liveGamesCount, setLiveGamesCount] = useState(1105);
  const [leaderboard, setLeaderboard] = useState([{ rank: 1, name: 'MathGod', elo: 2450 }]);
  const [recentGames, setRecentGames] = useState([{ id: 1, vs: 'ScrabblePro', me: 145, them: 112, change: '+12', time: '2 hours ago' }]);
  const [liveGames, setLiveGames] = useState([{ id: 1, p1: 'MathGod', p1Elo: 2450, p2: 'Terry', p2Elo: 2410, move: 14 }]);

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  React.useEffect(() => {
    if (!socket) return;
    
    const onMatchFound = ({ roomId }) => {
      setIsSearching(false);
      navigate(`/game/${roomId}`);
    };
    
    const onMatchFailed = ({ message }) => {
      setIsSearching(false);
      setError(message);
      setTimeout(() => setError(''), 5000);
    };

    const onRoomCreated = ({ roomId }) => {
      navigate(`/game/${roomId}`);
    };

    socket.on('match:found', onMatchFound);
    socket.on('matchmaking:failed', onMatchFailed);
    socket.on('room:created', onRoomCreated);

    return () => {
      socket.off('match:found', onMatchFound);
      socket.off('matchmaking:failed', onMatchFailed);
      socket.off('room:created', onRoomCreated);
    };
  }, [socket, navigate]);

  React.useEffect(() => {
    let interval;
    if (isSearching) {
      interval = setInterval(() => {
        setSearchTime(t => t + 1);
      }, 1000);
    } else {
      setSearchTime(0);
    }
    return () => clearInterval(interval);
  }, [isSearching]);

  const handlePlayRated = () => {
    if (!socket || !isConnected) return setError('Not connected to server');
    socket.emit('matchmaking:join', { isRated: true });
    setIsSearching(true);
  };

  const handleCancelSearch = () => {
    if (socket) socket.emit('matchmaking:leave');
    setIsSearching(false);
  };

  const handleCreateRoom = () => {
    if (!socket || !isConnected) return setError('Not connected to server');
    socket.emit('room:create');
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (!socket || !isConnected) return setError('Not connected to server');
    if (!joinCode) return;
    
    // In Lobby, we just navigate to /game/:id, GamePage handles the actual socket join
    navigate(`/game/${joinCode.toUpperCase()}`);
  };

  return (
    <div className="bg-bg min-h-screen text-text p-4 sm:p-6 font-sans">
      
      {/* Header */}
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-2 text-xl sm:text-2xl font-bold">
            <div className="bg-white text-bg px-2 py-1 rounded">G</div>
            GOBBLE
          </div>
          <div className="text-text-muted text-sm hidden md:flex gap-4">
            <span><span className="text-success">●</span> {onlineCount} Online</span>
            <span>{liveGamesCount} Live Games</span>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          <div className="text-right hidden sm:block">
            <div className="font-bold">{user?.username || 'Guest'}</div>
            <div className="text-text-muted text-xs">{user?.glicko?.rating || 1500} Glicko</div>
          </div>
          <div 
            onClick={() => navigate(`/profile/${user?.username}`)}
            className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center font-bold text-xl cursor-pointer transition-transform duration-200 active:scale-95 text-white"
          >
            {user?.username?.[0]?.toUpperCase() || 'G'}
          </div>
          <button onClick={handleLogout} className="bg-transparent border border-border text-text-subtle p-2 rounded cursor-pointer transition-colors duration-200 hover:bg-border hover:text-white">Logout</button>
        </div>
      </header>

      {error && <div className="text-error mb-4">{error}</div>}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-6">
        
        {/* Left Column (Actions) */}
        <div className="flex flex-col gap-4">
          
          <div onClick={handlePlayRated} className="bg-primary-lighter border border-primary rounded-xl p-6 sm:p-8 cursor-pointer relative overflow-hidden transition-colors duration-200 hover:bg-primary-light">
            <h2 className="text-2xl sm:text-3xl mb-2 text-white relative z-10">Play Rated</h2>
            <p className="text-text-subtle relative z-10">Find an opponent near your rating.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div 
              onClick={() => {
                if (!socket || !isConnected) return setError('Not connected to server');
                socket.emit('matchmaking:join', { isRated: false });
                setIsSearching(true);
              }}
              className="bg-[#1e1e1e] p-5 sm:p-6 rounded-xl cursor-pointer border border-border-dark shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_2px_4px_rgba(0,0,0,0.2)] transition-colors duration-200 hover:bg-bg-card"
            >
              <h3 className="text-lg sm:text-xl mb-2 text-white">Unrated Match</h3>
              <p className="text-text-muted text-sm">Play without rating pressure.</p>
            </div>

            <div className="bg-[#1e1e1e] p-5 sm:p-6 rounded-xl cursor-pointer border border-border-dark shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_2px_4px_rgba(0,0,0,0.2)] transition-colors duration-200 hover:bg-bg-card">
              <h3 className="text-lg sm:text-xl mb-2 text-white">Bot Practice</h3>
              <p className="text-text-muted text-sm">Train against GobbleNet.</p>
            </div>

            <div className="bg-[#1e1e1e] p-5 sm:p-6 rounded-xl cursor-pointer border border-border-dark shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_2px_4px_rgba(0,0,0,0.2)] transition-colors duration-200 hover:bg-bg-card">
              <h3 className="text-lg sm:text-xl mb-2 text-white">Play with Friend</h3>
              <p className="text-text-muted text-sm">Create or join a private room.</p>
              
              <div className="flex flex-col gap-3 mt-3">
                <button onClick={handleCreateRoom} className="w-full py-2.5 bg-primary text-white border-none rounded-md cursor-pointer font-bold transition-colors duration-200 hover:bg-primary-hover active:bg-primary-active">
                  Create Room
                </button>
                <div className="text-center text-text-muted text-xs font-bold">OR</div>
                <form onSubmit={handleJoinRoom} className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="CODE" 
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    className="w-full p-2 rounded-md border border-border bg-bg text-white uppercase outline-none focus:border-primary"
                    maxLength={8}
                  />
                  <button type="submit" className="px-4 py-2 bg-border text-white border-none rounded-md cursor-pointer font-bold transition-colors duration-200 hover:bg-border-light active:bg-border-lighter">Join</button>
                </form>
              </div>
            </div>

            <div className="bg-[#1e1e1e] p-5 sm:p-6 rounded-xl cursor-pointer border border-border-dark shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_2px_4px_rgba(0,0,0,0.2)] transition-colors duration-200 hover:bg-bg-card">
              <h3 className="text-lg sm:text-xl mb-2 text-white">Spectate</h3>
              <p className="text-text-muted text-sm">Watch high Elo games.</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-auto pt-4">
            <div className="bg-bg-input p-4 sm:p-6 rounded-xl text-center border border-border">
              <div className="text-xl sm:text-3xl font-bold mb-1">54%</div>
              <div className="text-text-muted text-[10px] sm:text-xs uppercase tracking-wider">Win Rate</div>
            </div>
            <div className="bg-bg-input p-4 sm:p-6 rounded-xl text-center border border-border">
              <div className="text-xl sm:text-3xl font-bold mb-1">4</div>
              <div className="text-text-muted text-[10px] sm:text-xs uppercase tracking-wider">Win Streak</div>
            </div>
            <div className="bg-bg-input p-4 sm:p-6 rounded-xl text-center border border-border">
              <div className="text-xl sm:text-3xl font-bold mb-1">#12k</div>
              <div className="text-text-muted text-[10px] sm:text-xs uppercase tracking-wider">Global Rank</div>
            </div>
          </div>

        </div>

        {/* Right Column (Live & Recent) */}
        <div className="flex flex-col gap-6">
          
          <div>
            <h4 className="text-text-muted text-[13px] font-semibold uppercase tracking-widest mb-4">Live Top Games</h4>
            {liveGames.map(game => (
              <div key={game.id} className="bg-bg-input px-5 py-4 rounded-xl border border-border-dark flex justify-between items-center mb-3">
                <div>
                  <div className="font-semibold mb-1 text-[15px]">{game.p1} ({game.p1Elo}) vs {game.p2} ({game.p2Elo})</div>
                  <div className="text-[13px] text-text-muted">Move {game.move} • 01:23 remaining</div>
                </div>
                <button onClick={() => navigate(`/spectate/${game.id}`)} className="p-0 bg-transparent border-none text-primary font-bold cursor-pointer text-sm hover:underline">Watch</button>
              </div>
            ))}
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-text-muted text-[13px] font-semibold uppercase tracking-widest m-0">Recent Games</h4>
              <span className="text-primary text-[13px] font-bold cursor-pointer">View All</span>
            </div>
            {recentGames.map(game => (
              <div key={game.id} className="bg-bg-input px-5 py-4 rounded-xl border border-border-dark flex justify-between items-center mb-3">
                <div>
                  <div className="font-semibold mb-1 text-[15px]">vs {game.vs}</div>
                  <div className="text-[13px] text-text-muted">Rated • {game.time}</div>
                </div>
                <div>
                  <div className={`font-bold text-[15px] ${game.change.startsWith('+') ? 'text-success' : 'text-error'}`}>
                    {game.me} - {game.them} ({game.change})
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div>
            <h4 className="text-text-muted text-[13px] font-semibold uppercase tracking-widest mb-4">Leaderboard</h4>
            <div className="flex flex-col gap-2">
              {leaderboard.map(entry => (
                <div key={entry.rank} className="bg-bg-input px-5 py-4 rounded-xl border border-border-dark flex items-center gap-4">
                  <div className="text-text-muted w-5 font-bold text-center">{entry.rank}</div>
                  <div className="w-7 h-7 bg-accent-gold rounded-md text-bg flex items-center justify-center font-bold text-[13px]">M</div>
                  <div className="font-semibold flex-1 text-[15px]">{entry.name}</div>
                  <div className="font-bold text-white">{entry.elo}</div>
                </div>
              ))}
              
              {/* Highlighted 'You' Row */}
              <div className="bg-primary-lighter border border-primary mt-1 px-5 py-4 rounded-xl flex items-center gap-4">
                <div className="text-text-muted w-5 font-bold text-center">-</div>
                <div className="w-7 h-7 bg-primary text-white rounded-md flex items-center justify-center font-bold text-[13px]">
                  {user?.username?.[0]?.toUpperCase() || 'E'}
                </div>
                <div className="font-semibold flex-1 text-[15px]">{user?.username || 'EulerFan99'} (You)</div>
                <div className="font-bold text-white">{user?.glicko?.rating || 1542}</div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {isSearching && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-bg p-8 sm:p-10 rounded-2xl border border-border text-center min-w-[300px]">
            <h2 className="text-2xl mb-2 font-bold text-white">Searching for Opponent</h2>
            <p className="text-text-muted mb-6">Wait time: {searchTime}s (Max 30s)</p>
            <button 
              onClick={handleCancelSearch}
              className="px-6 py-3 bg-transparent border border-primary text-primary rounded-lg cursor-pointer font-bold transition-colors duration-200 hover:bg-primary hover:text-white active:bg-primary-active active:border-primary-active"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

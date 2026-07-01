import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import '../styles/components.css';

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

    socket.on('match:found', onMatchFound);
    socket.on('matchmaking:failed', onMatchFailed);

    return () => {
      socket.off('match:found', onMatchFound);
      socket.off('matchmaking:failed', onMatchFailed);
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
    socket.emit('matchmaking:join');
    setIsSearching(true);
  };

  const handleCancelSearch = () => {
    if (socket) socket.emit('matchmaking:leave');
    setIsSearching(false);
  };

  const handleCreateRoom = () => {
    if (!socket || !isConnected) return setError('Not connected to server');
    socket.emit('room:create');
    socket.once('room:created', ({ roomId }) => {
      navigate(`/game/${roomId}`);
    });
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (!socket || !isConnected) return setError('Not connected to server');
    if (!joinCode) return;
    
    // In Lobby, we just navigate to /game/:id, GamePage handles the actual socket join
    navigate(`/game/${joinCode.toUpperCase()}`);
  };

  return (
    <div style={{ backgroundColor: '#1a1a1a', minHeight: '100vh', color: '#eaeaea', padding: '24px' }}>
      
      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '24px', fontWeight: 'bold' }}>
            <div style={{ backgroundColor: '#fff', color: '#1a1a1a', padding: '4px 8px', borderRadius: '4px' }}>G</div>
            GOBBLE
          </div>
          <div style={{ color: '#888', fontSize: '14px', display: 'flex', gap: '16px' }}>
            <span><span style={{ color: '#4caf50' }}>●</span> {onlineCount} Online</span>
            <span>{liveGamesCount} Live Games</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 'bold' }}>{user?.username || 'Guest'}</div>
            <div style={{ color: '#888', fontSize: '12px' }}>{user?.glicko?.rating || 1500} Glicko</div>
          </div>
          <div 
            onClick={() => navigate(`/profile/${user?.username}`)}
            style={{ width: '40px', height: '40px', backgroundColor: '#e66545', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '20px', cursor: 'pointer' }}
          >
            {user?.username?.[0]?.toUpperCase() || 'G'}
          </div>
          <button onClick={handleLogout} style={{ background: 'none', border: '1px solid #333', color: '#aaa', padding: '8px', borderRadius: '4px', cursor: 'pointer' }}>Logout</button>
        </div>
      </header>

      {error && <div style={{ color: '#ff6b6b', marginBottom: '16px' }}>{error}</div>}

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        
        {/* Left Column (Actions) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          <div 
            onClick={handlePlayRated}
            style={{ 
              backgroundColor: 'rgba(230, 101, 69, 0.05)', 
              border: '1px solid #e66545', 
              borderRadius: '12px', 
              padding: '32px', 
              cursor: 'pointer', 
              position: 'relative', 
              overflow: 'hidden',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(230, 101, 69, 0.1)'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'rgba(230, 101, 69, 0.05)'}
          >
            <h2 style={{ fontSize: '32px', marginBottom: '8px', color: '#fff', position: 'relative', zIndex: 2 }}>Play Rated</h2>
            <p style={{ color: '#aaa', position: 'relative', zIndex: 2 }}>Find an opponent near your {user?.glicko?.rating || 1542} rating.</p>
            <div style={{ position: 'absolute', right: '32px', top: '50%', transform: 'translateY(-50%)', fontSize: '100px', opacity: 0.05, zIndex: 1, pointerEvents: 'none' }}>
              ⚔️
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div 
              onClick={() => {
                if (!socket || !isConnected) return setError('Not connected to server');
                socket.emit('matchmaking:join', { isRated: false });
                setIsSearching(true);
              }}
              style={{ backgroundColor: '#141414', padding: '24px', borderRadius: '12px', cursor: 'pointer', border: '1px solid #333', transition: 'border-color 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = '#666'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = '#333'}
            >
              <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Unrated Match</h3>
              <p style={{ color: '#888', fontSize: '14px' }}>Play without rating pressure.</p>
            </div>

            <div 
              style={{ backgroundColor: '#141414', padding: '24px', borderRadius: '12px', cursor: 'pointer', border: '1px solid #333', transition: 'border-color 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = '#666'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = '#333'}
            >
              <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Bot Practice</h3>
              <p style={{ color: '#888', fontSize: '14px' }}>Train against GobbleNet.</p>
            </div>

            <div style={{ backgroundColor: '#141414', padding: '24px', borderRadius: '12px', border: '1px solid #333' }}>
              <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Join with Code</h3>
              <p style={{ color: '#888', fontSize: '14px', marginBottom: '12px' }}>Play with a friend directly.</p>
              <form onSubmit={handleJoinRoom} style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  placeholder="CODE" 
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #333', background: '#1a1a1a', color: '#fff', textTransform: 'uppercase', outline: 'none' }} 
                  maxLength={6}
                />
                <button type="submit" style={{ padding: '10px 16px', backgroundColor: '#333', border: 'none', color: '#fff', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>Join</button>
              </form>
            </div>

            <div 
              style={{ backgroundColor: '#141414', padding: '24px', borderRadius: '12px', cursor: 'pointer', border: '1px solid #333', transition: 'border-color 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.borderColor = '#666'}
              onMouseOut={(e) => e.currentTarget.style.borderColor = '#333'}
            >
              <h3 style={{ fontSize: '20px', marginBottom: '8px' }}>Spectate</h3>
              <p style={{ color: '#888', fontSize: '14px' }}>Watch high Elo games.</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginTop: 'auto' }}>
            <div style={{ backgroundColor: '#141414', padding: '24px', borderRadius: '12px', textAlign: 'center', border: '1px solid #333' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '4px' }}>54%</div>
              <div style={{ color: '#888', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Win Rate</div>
            </div>
            <div style={{ backgroundColor: '#141414', padding: '24px', borderRadius: '12px', textAlign: 'center', border: '1px solid #333' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '4px' }}>4</div>
              <div style={{ color: '#888', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Win Streak</div>
            </div>
            <div style={{ backgroundColor: '#141414', padding: '24px', borderRadius: '12px', textAlign: 'center', border: '1px solid #333' }}>
              <div style={{ fontSize: '28px', fontWeight: 'bold', marginBottom: '4px' }}>#12,402</div>
              <div style={{ color: '#888', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Global Rank</div>
            </div>
          </div>

        </div>

        {/* Right Column (Live & Recent) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div>
            <h4 style={{ color: '#888', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Live Top Games</h4>
            {liveGames.map(game => (
              <div key={game.id} style={{ backgroundColor: '#141414', padding: '16px 20px', borderRadius: '12px', border: '1px solid #2a2a2a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '4px', fontSize: '15px' }}>{game.p1} ({game.p1Elo}) vs {game.p2} ({game.p2Elo})</div>
                  <div style={{ fontSize: '13px', color: '#888' }}>Move {game.move} • 01:23 remaining</div>
                </div>
                <button onClick={() => navigate(`/spectate/${game.id}`)} style={{ padding: '0', backgroundColor: 'transparent', border: 'none', color: '#e66545', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }}>Watch</button>
              </div>
            ))}
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h4 style={{ color: '#888', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' }}>Recent Games</h4>
              <span style={{ color: '#e66545', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>View All</span>
            </div>
            {recentGames.map(game => (
              <div key={game.id} style={{ backgroundColor: '#141414', padding: '16px 20px', borderRadius: '12px', border: '1px solid #2a2a2a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '4px', fontSize: '15px' }}>vs {game.vs}</div>
                  <div style={{ fontSize: '13px', color: '#888' }}>Rated • {game.time}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '15px', color: game.change.startsWith('+') ? '#4caf50' : '#ff6b6b' }}>
                    {game.me} - {game.them} ({game.change})
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div>
            <h4 style={{ color: '#888', fontSize: '13px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>Leaderboard</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {leaderboard.map(entry => (
                <div key={entry.rank} style={{ backgroundColor: '#141414', padding: '16px 20px', borderRadius: '12px', border: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ color: '#888', width: '20px', fontWeight: 'bold' }}>{entry.rank}</div>
                  <div style={{ width: '28px', height: '28px', backgroundColor: '#e6a822', borderRadius: '6px', color: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '13px' }}>M</div>
                  <div style={{ fontWeight: '600', flex: 1, fontSize: '15px' }}>{entry.name}</div>
                  <div style={{ fontWeight: 'bold', color: '#fff' }}>{entry.elo}</div>
                </div>
              ))}
              
              {/* Highlighted 'You' Row matching the mockup */}
              <div style={{ backgroundColor: 'rgba(230, 101, 69, 0.05)', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e66545', display: 'flex', alignItems: 'center', gap: '16px', marginTop: '4px' }}>
                <div style={{ color: '#888', width: '20px', fontWeight: 'bold', textAlign: 'center' }}>-</div>
                <div style={{ width: '28px', height: '28px', backgroundColor: '#e66545', borderRadius: '6px', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '13px' }}>
                  {user?.username?.[0]?.toUpperCase() || 'E'}
                </div>
                <div style={{ fontWeight: '600', flex: 1, fontSize: '15px' }}>{user?.username || 'EulerFan99'} (You)</div>
                <div style={{ fontWeight: 'bold', color: '#fff' }}>{user?.glicko?.rating || 1542}</div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {isSearching && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#1a1a1a', padding: '40px', borderRadius: '16px', border: '1px solid #333', textAlign: 'center', minWidth: '300px' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px', animation: 'spin 2s linear infinite' }}>⚔️</div>
            <h2 style={{ fontSize: '24px', marginBottom: '8px' }}>Searching for Opponent</h2>
            <p style={{ color: '#888', marginBottom: '24px' }}>Wait time: {searchTime}s (Max 30s)</p>
            <button 
              onClick={handleCancelSearch}
              style={{ padding: '12px 24px', backgroundColor: 'transparent', border: '1px solid #e66545', color: '#e66545', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

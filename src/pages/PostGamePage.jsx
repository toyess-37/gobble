import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { THEME } from '../utils/constants';

export default function PostGamePage() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [matchData, setMatchData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchMatch = async () => {
      try {
        const res = await api.get(`/matches/${matchId}`);
        setMatchData(res.data);
      } catch (err) {
        setError('Failed to load match data');
      } finally {
        setLoading(false);
      }
    };
    fetchMatch();
  }, [matchId]);

  if (loading) return <div style={{ color: '#fff', textAlign: 'center', marginTop: '50px' }}>Loading match results...</div>;
  if (error) return <div style={{ color: '#ff6b6b', textAlign: 'center', marginTop: '50px' }}>{error}</div>;
  if (!matchData) return null;

  const { players, scores, winner } = matchData;
  const p1 = players.find(p => p.playerNumber === 1);
  const p2 = players.find(p => p.playerNumber === 2);
  
  const myPlayer = players.find(p => p.username === user?.username);
  const isWinner = myPlayer && myPlayer.playerNumber === winner;
  const isDraw = winner === 0;
  
  const titleText = isDraw ? 'DRAW' : (isWinner ? 'VICTORY' : 'DEFEAT');
  const titleColor = isDraw ? '#e6a822' : (isWinner ? '#4caf50' : '#ff6b6b');

  return (
    <div style={{ backgroundColor: '#1a1a1a', minHeight: '100vh', color: '#eaeaea', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px' }}>
      
      <h1 style={{ color: titleColor, fontSize: '64px', margin: '0 0 48px 0', textTransform: 'uppercase', letterSpacing: '4px' }}>
        {titleText}
      </h1>

      <div style={{ backgroundColor: '#242424', borderRadius: '16px', padding: '48px', width: '100%', maxWidth: '800px', border: '1px solid #333', display: 'flex', justifyContent: 'space-around', alignItems: 'center', marginBottom: '32px' }}>
        
        {/* Player 1 */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '80px', height: '80px', backgroundColor: THEME.red.bg, borderRadius: '16px', color: THEME.red.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 'bold', margin: '0 auto 16px auto', boxShadow: `0 0 20px ${THEME.red.color}40` }}>
            {p1.username[0].toUpperCase()}
          </div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>{p1.username}</div>
          <div style={{ fontSize: '64px', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>{scores.p1}</div>
          <div style={{ fontSize: '14px', color: '#888' }}>
            Rating TBA
          </div>
        </div>

        <div style={{ fontSize: '24px', color: '#888', fontWeight: 'bold' }}>VS</div>

        {/* Player 2 */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '80px', height: '80px', backgroundColor: THEME.blue.bg, borderRadius: '16px', color: THEME.blue.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: 'bold', margin: '0 auto 16px auto', boxShadow: `0 0 20px ${THEME.blue.color}40` }}>
            {p2.username[0].toUpperCase()}
          </div>
          <div style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '8px' }}>{p2.username}</div>
          <div style={{ fontSize: '64px', fontWeight: 'bold', color: '#fff', marginBottom: '8px' }}>{scores.p2}</div>
          <div style={{ fontSize: '14px', color: '#888' }}>
            Rating TBA
          </div>
        </div>

      </div>

      <div style={{ display: 'flex', gap: '16px', marginBottom: '48px' }}>
        <button 
          onClick={() => navigate('/lobby')}
          style={{ padding: '16px 32px', fontSize: '18px', fontWeight: 'bold', backgroundColor: '#e66545', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
        >
          Rematch
        </button>
        <button 
          onClick={() => navigate('/lobby')}
          style={{ padding: '16px 32px', fontSize: '18px', fontWeight: 'bold', backgroundColor: '#242424', color: '#fff', border: '1px solid #333', borderRadius: '8px', cursor: 'pointer' }}
        >
          Return to Lobby
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', width: '100%', maxWidth: '800px' }}>
        <div style={{ backgroundColor: '#242424', padding: '24px', borderRadius: '12px', border: '1px solid #333' }}>
          <h4 style={{ color: '#888', textTransform: 'uppercase', fontSize: '12px', marginBottom: '24px' }}>Match Best Move</h4>
          <div style={{ textAlign: 'center', color: '#aaa', fontStyle: 'italic' }}>
            Logic to be implemented during bot training phase.
          </div>
        </div>

        <div style={{ backgroundColor: '#242424', padding: '24px', borderRadius: '12px', border: '1px solid #333' }}>
          <h4 style={{ color: '#888', textTransform: 'uppercase', fontSize: '12px', marginBottom: '24px' }}>Rating Trend</h4>
          <div style={{ textAlign: 'center', color: '#aaa', fontStyle: 'italic' }}>
            Graph placeholder.
          </div>
        </div>
      </div>

    </div>
  );
}

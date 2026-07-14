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

  if (loading) return <div className="text-white text-center mt-12 font-sans bg-bg min-h-screen">Loading match results...</div>;
  if (error) return <div className="text-error text-center mt-12 font-sans bg-bg min-h-screen">{error}</div>;
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
    <div className="bg-bg min-h-screen text-text flex flex-col items-center py-12 px-4 sm:px-6 font-sans w-full">
      
      <h1 className="text-5xl md:text-6xl m-0 mb-8 sm:mb-12 uppercase tracking-[4px]" style={{ color: titleColor }}>
        {titleText}
      </h1>

      <div className="bg-bg-card rounded-2xl p-8 sm:p-12 w-full max-w-[800px] border border-border flex flex-col sm:flex-row justify-around items-center mb-8 gap-8 sm:gap-0">
        
        {/* Player 1 */}
        <div className="text-center flex flex-col items-center">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold mb-4 mx-auto" style={{ backgroundColor: THEME.red.bg, color: THEME.red.color }}>
            {p1.username[0].toUpperCase()}
          </div>
          <div className="text-xl font-bold mb-2">{p1.username}</div>
          <div className="text-6xl font-bold text-white mb-2">{scores.p1}</div>
        </div>

        <div className="text-2xl text-text-muted font-bold">VS</div>

        {/* Player 2 */}
        <div className="text-center flex flex-col items-center">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl font-bold mb-4 mx-auto" style={{ backgroundColor: THEME.blue.bg, color: THEME.blue.color }}>
            {p2.username[0].toUpperCase()}
          </div>
          <div className="text-xl font-bold mb-2">{p2.username}</div>
          <div className="text-6xl font-bold text-white mb-2">{scores.p2}</div>
        </div>

      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-12 w-full sm:w-auto justify-center">
        <button 
          onClick={() => navigate('/lobby')}
          className="py-3.5 px-7 text-base font-bold bg-primary text-white border-none rounded-lg cursor-pointer transition-colors duration-200 hover:bg-primary-hover active:bg-primary-active w-full sm:w-auto"
        >
          New Match
        </button>
        <button 
          onClick={() => navigate('/lobby')}
          className="py-3.5 px-7 text-base font-bold bg-bg-card text-white border border-border-light rounded-lg cursor-pointer transition-colors duration-200 hover:bg-border hover:text-white active:bg-black w-full sm:w-auto"
        >
          Return to Lobby
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-[800px]">
        <div className="bg-bg-card p-6 rounded-xl border border-border">
          <h4 className="text-text-muted uppercase text-xs mb-6">Match Best Move</h4>
          <div className="text-center text-text-subtle italic">
            Logic to be implemented during bot training phase.
          </div>
        </div>

        <div className="bg-bg-card p-6 rounded-xl border border-border">
          <h4 className="text-text-muted uppercase text-xs mb-6">Rating Trend</h4>
          <div className="text-center text-text-subtle italic">
            Graph placeholder.
          </div>
        </div>
      </div>

    </div>
  );
}

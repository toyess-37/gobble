import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function ProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();

  return (
    <div className="bg-bg min-h-screen text-text p-6 font-sans">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2 text-2xl font-bold">
          <div className="bg-white text-bg px-2 py-1 rounded">G</div>
          GOBBLE
        </div>
        <button onClick={() => navigate('/lobby')} className="bg-transparent border-none text-text-subtle cursor-pointer flex items-center gap-1.5 text-base transition-colors duration-200 hover:text-white">
          <ArrowLeft size={18} /> Back to Lobby
        </button>
      </header>
      
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <h2 className="text-3xl mb-4">{username}'s Profile</h2>
          <p className="text-text-subtle">Profile implementation pending.</p>
        </div>
      </div>
    </div>
  );
}

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function ProfilePage() {
  const { username } = useParams();
  const navigate = useNavigate();

  return (
    <div style={{ backgroundColor: '#1a1a1a', minHeight: '100vh', color: '#eaeaea', padding: '24px' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '24px', fontWeight: 'bold' }}>
          <div style={{ backgroundColor: '#fff', color: '#1a1a1a', padding: '4px 8px', borderRadius: '4px' }}>G</div>
          GOBBLE
        </div>
        <button onClick={() => navigate('/lobby')} style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '16px' }}>
          <ArrowLeft size={18} /> Back to Lobby
        </button>
      </header>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '32px', marginBottom: '16px' }}>{username}'s Profile</h2>
          <p style={{ color: '#aaa' }}>Profile implementation pending.</p>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from 'react';

const Lobby = ({ onJoinRoom, onCreateRoom, user }) => {
  const [roomId, setRoomId] = useState('');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#1a1a1a', color: '#eaeaea' }}>
      <h1 className="app-title" style={{ fontSize: '48px', marginBottom: '8px' }}>Gobble</h1>
      <p style={{ color: '#aaa', marginBottom: '32px' }}>Welcome, {user.username}! Rating: {Math.round(user.glicko?.rating || 1500)}</p>

      <div style={{ backgroundColor: '#2b2d36', padding: '32px', borderRadius: '16px', width: '300px', boxShadow: '0 8px 16px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        
        <button 
          onClick={onCreateRoom}
          style={{ padding: '16px', borderRadius: '8px', border: 'none', backgroundColor: '#eaeaea', color: '#1a1a1a', fontSize: '18px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          Create New Room
        </button>

        <div style={{ textAlign: 'center', color: '#aaa', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#444' }} />
          <span>OR</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: '#444' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <input 
            type="text" 
            placeholder="Room Code" 
            value={roomId}
            onChange={(e) => setRoomId(e.target.value.toUpperCase())}
            maxLength={6}
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: '#fff', fontSize: '20px', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '4px' }}
          />
          <button 
            onClick={() => roomId && onJoinRoom(roomId)}
            disabled={!roomId}
            style={{ padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: roomId ? '#eaeaea' : '#555', color: roomId ? '#1a1a1a' : '#888', fontSize: '16px', fontWeight: 'bold', cursor: roomId ? 'pointer' : 'not-allowed' }}
          >
            Join Room
          </button>
        </div>

      </div>
    </div>
  );
};

export default Lobby;

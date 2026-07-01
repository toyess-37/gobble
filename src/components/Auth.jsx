import React, { useState } from 'react';
import '../styles/components.css';

const Auth = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body = { username, password };
      if (!isLogin && email) body.email = email;

      const res = await fetch(`http://localhost:3001${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Authentication failed');
      
      onLogin(data.token, data.user);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleGuest = async () => {
    setError('');
    try {
      const res = await fetch('http://localhost:3001/api/auth/guest', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Guest access failed');
      onLogin(data.token, data.user);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#1a1a1a', color: '#eaeaea' }}>
      <h1 className="app-title" style={{ fontSize: '48px', marginBottom: '32px' }}>Gobble</h1>
      <div style={{ backgroundColor: '#2b2d36', padding: '32px', borderRadius: '16px', width: '300px', boxShadow: '0 8px 16px rgba(0,0,0,0.5)' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '24px' }}>{isLogin ? 'Login' : 'Register'}</h2>
        
        {error && <div style={{ color: '#ff6b6b', marginBottom: '16px', textAlign: 'center', fontSize: '14px' }}>{error}</div>}
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input 
            type="text" 
            placeholder="Username" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: '#fff', fontSize: '16px' }}
          />
          {!isLogin && (
            <input 
              type="email" 
              placeholder="Email (optional)" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ padding: '12px', borderRadius: '8px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: '#fff', fontSize: '16px' }}
            />
          )}
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ padding: '12px', borderRadius: '8px', border: '1px solid #444', backgroundColor: '#1a1a1a', color: '#fff', fontSize: '16px' }}
          />
          <button 
            type="submit"
            style={{ padding: '12px', borderRadius: '8px', border: 'none', backgroundColor: '#eaeaea', color: '#1a1a1a', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', marginTop: '8px' }}
          >
            {isLogin ? 'Enter Arena' : 'Create Account'}
          </button>
        </form>

        <button
          onClick={handleGuest}
          style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #444', backgroundColor: 'transparent', color: '#eaeaea', fontSize: '16px', cursor: 'pointer', marginTop: '16px' }}
        >
          Play as Guest
        </button>
        
        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '14px', color: '#aaa' }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span 
            onClick={() => setIsLogin(!isLogin)} 
            style={{ color: '#eaeaea', cursor: 'pointer', textDecoration: 'underline' }}
          >
            {isLogin ? 'Register' : 'Login'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Auth;

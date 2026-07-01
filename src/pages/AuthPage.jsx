import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import '../styles/components.css';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const payload = isLogin ? { username, password } : { username, email, password };
      
      const res = await api.post(endpoint, payload);
      login(res.data.token, res.data.user);
      navigate('/lobby');
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed');
    }
  };

  const handleGuest = async () => {
    try {
      const res = await api.post('/auth/guest');
      login(res.data.token, res.data.user);
      navigate('/lobby');
    } catch (err) {
      setError('Failed to enter as guest');
    }
  };

  const tileData = [
    { letter: 'G', val: '2' },
    { letter: 'O', val: '1' },
    { letter: 'B', val: '3' },
    { letter: 'B', val: '3' },
    { letter: 'L', val: '1' },
    { letter: 'E', val: '1' }
  ];

  return (
    <div className="auth-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', backgroundColor: '#1a1a1a', color: '#eaeaea', fontFamily: 'var(--sans, "Bricolage Grotesque", sans-serif)' }}>
      
      <style>
        {`
          .pressable-logo {
            display: flex;
            gap: 8px;
            margin-bottom: 12px;
            justify-content: center;
            cursor: pointer;
            transition: transform 0.15s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .pressable-logo:active {
            transform: scale(0.92);
          }
        `}
      </style>

      {/* Form Card */}
      <div style={{ width: '100%', maxWidth: '420px', backgroundColor: '#242424', borderRadius: '16px', boxShadow: '0 12px 32px rgba(0,0,0,0.4)', border: '1px solid #333', overflow: 'hidden', padding: '40px 32px' }}>
        
        {/* Logo Area (Now Inside the Box) */}
        <div className="pressable-logo" onClick={() => {}}>
          {tileData.map((t, i) => (
            <div key={i} style={{ 
              width: '44px', height: '52px', backgroundColor: '#f5f0e1', 
              borderRadius: '6px', color: '#1a1a1a', display: 'flex', 
              alignItems: 'center', justifyContent: 'center', 
              fontWeight: '900', fontSize: '24px', position: 'relative',
              boxShadow: '0 4px 0 #d1cbb0, 0 8px 16px rgba(0,0,0,0.15)'
            }}>
              {t.letter}
              <span style={{ position: 'absolute', bottom: '4px', right: '6px', fontSize: '10px', fontWeight: 'bold', color: '#666' }}>{t.val}</span>
            </div>
          ))}
        </div>
        <p style={{ color: '#888', marginBottom: '32px', fontSize: '15px', fontWeight: '500', textAlign: 'center' }}>The competitive postfix math game.</p>

        {/* Sliding Segmented Control Tabs */}
        <div style={{ position: 'relative', display: 'flex', backgroundColor: '#141414', borderRadius: '8px', padding: '4px', marginBottom: '32px', border: '1px solid #2a2a2a' }}>
          {/* Sliding Background */}
          <div style={{
            position: 'absolute', top: '4px', bottom: '4px', left: '4px',
            width: 'calc(50% - 4px)', backgroundColor: '#2c2c2c', borderRadius: '6px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            transform: isLogin ? 'translateX(0)' : 'translateX(100%)',
            transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }} />

          <button 
            style={{ 
              flex: 1, padding: '12px 0', background: 'transparent', border: 'none', 
              color: isLogin ? '#fff' : '#777', 
              cursor: 'pointer', fontWeight: '600', fontSize: '14px', transition: 'color 0.3s',
              fontFamily: 'inherit', position: 'relative', zIndex: 1
            }}
            onClick={() => { setIsLogin(true); setError(''); }}
          >
            Sign In
          </button>
          <button 
            style={{ 
              flex: 1, padding: '12px 0', background: 'transparent', border: 'none', 
              color: !isLogin ? '#fff' : '#777', 
              cursor: 'pointer', fontWeight: '600', fontSize: '14px', transition: 'color 0.3s',
              fontFamily: 'inherit', position: 'relative', zIndex: 1
            }}
            onClick={() => { setIsLogin(false); setError(''); }}
          >
            Register
          </button>
        </div>

        {/* Form Content */}
        <div>
          {error && <div style={{ color: '#ff6b6b', marginBottom: '24px', fontSize: '14px', backgroundColor: 'rgba(255, 107, 107, 0.1)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 107, 107, 0.2)' }}>{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', color: '#eaeaea', fontWeight: '500', display: 'block' }}>
                {isLogin ? 'Email or Username' : 'Username'}
              </label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ padding: '14px 16px', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#141414', color: '#fff', outline: 'none', fontSize: '15px', fontFamily: 'inherit', transition: 'border-color 0.2s' }}
                placeholder={isLogin ? 'grandmaster@gobble.io' : 'grandmaster'}
                onFocus={(e) => e.target.style.borderColor = '#e66545'}
                onBlur={(e) => e.target.style.borderColor = '#333'}
                required
              />
            </div>

            {!isLogin && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', color: '#eaeaea', fontWeight: '500', display: 'block' }}>Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ padding: '14px 16px', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#141414', color: '#fff', outline: 'none', fontSize: '15px', fontFamily: 'inherit', transition: 'border-color 0.2s' }}
                  placeholder="grandmaster@gobble.io"
                  onFocus={(e) => e.target.style.borderColor = '#e66545'}
                  onBlur={(e) => e.target.style.borderColor = '#333'}
                  required
                />
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', color: '#eaeaea', fontWeight: '500', display: 'block' }}>Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ padding: '14px 16px', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#141414', color: '#fff', outline: 'none', fontSize: '15px', fontFamily: 'inherit', letterSpacing: '2px', transition: 'border-color 0.2s' }}
                placeholder="••••••••"
                onFocus={(e) => e.target.style.borderColor = '#e66545'}
                onBlur={(e) => e.target.style.borderColor = '#333'}
                required
              />
            </div>

            <button type="submit" style={{ padding: '16px', borderRadius: '8px', backgroundColor: '#e66545', color: '#fff', border: 'none', fontWeight: '600', cursor: 'pointer', marginTop: '16px', fontSize: '16px', transition: 'background-color 0.2s', fontFamily: 'inherit' }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#d55434'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#e66545'}
            >
              {isLogin ? 'Sign In' : 'Register'}
            </button>
          </form>

        </div>

        <div style={{ textAlign: 'center', marginTop: '32px' }}>
          <button onClick={handleGuest} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '15px', fontWeight: '500', transition: 'color 0.2s', fontFamily: 'inherit' }}
            onMouseOver={(e) => e.target.style.color = '#ccc'}
            onMouseOut={(e) => e.target.style.color = '#888'}
          >
            Play as guest
          </button>
        </div>

      </div>

    </div>
  );
}

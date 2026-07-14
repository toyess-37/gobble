import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';

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
    { letter: 'G'},
    { letter: 'O'},
    { letter: 'B'},
    { letter: 'B'},
    { letter: 'L'},
    { letter: 'E'}
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-bg text-text font-sans p-4 sm:p-8">
      {/* Form Card */}
      <div className="w-full max-w-md bg-bg-card rounded-2xl shadow-2xl border border-border overflow-hidden px-6 py-8 sm:px-8 sm:py-10">
        
        {/* Logo Area */}
        <div className="flex gap-1 mb-2 justify-center cursor-pointer transition-transform duration-300 ease-out active:scale-95">
          {tileData.map((t, i) => (
            <div key={i} className="w-10 h-12 sm:w-11 sm:h-[52px] bg-accent-tile rounded-md text-text-dark font-black text-xl sm:text-2xl flex items-center justify-center shadow-[0_4px_0_#d1cbb0,0_8px_16px_rgba(0,0,0,0.15)]">
              {t.letter}
            </div>
          ))}
        </div>
        <p className="text-text-muted mb-8 text-sm sm:text-[15px] font-medium text-center">Competitive Postfix board game</p>

        {/* Sliding Segmented Control Tabs */}
        <div className="relative flex bg-bg-input rounded-lg p-1 mb-8 border border-border-dark">
          <div className={`absolute top-1 bottom-1 left-1 w-[calc(50%-4px)] bg-bg-slider rounded-md shadow-md transition-transform duration-300 ease-in-out ${!isLogin ? 'translate-x-full' : ''}`} />

          <button 
            className={`flex-1 py-3 bg-transparent border-none cursor-pointer font-semibold text-sm transition-colors duration-300 relative z-10 ${isLogin ? 'text-white' : 'text-text-muted'}`}
            onClick={() => { setIsLogin(true); setError(''); }}
          >
            Sign In
          </button>
          <button 
            className={`flex-1 py-3 bg-transparent border-none cursor-pointer font-semibold text-sm transition-colors duration-300 relative z-10 ${!isLogin ? 'text-white' : 'text-text-muted'}`}
            onClick={() => { setIsLogin(false); setError(''); }}
          >
            Register
          </button>
        </div>

        {/* Form Content */}
        <div>
          {error && <div className="text-error mb-6 text-sm bg-error-bg p-3 rounded-lg border border-error-border">{error}</div>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            
            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-text font-medium block">
                {isLogin ? 'Email or Username' : 'Username'}
              </label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="px-4 py-3.5 rounded-lg border border-border bg-bg-input text-white outline-none text-[15px] transition-colors duration-300 focus:border-primary"
                placeholder={isLogin ? 'grandmaster@gobble.io' : 'grandmaster'}
                required
              />
            </div>

            {!isLogin && (
              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-text font-medium block">Email</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="px-4 py-3.5 rounded-lg border border-border bg-bg-input text-white outline-none text-[15px] transition-colors duration-300 focus:border-primary"
                  placeholder="grandmaster@gobble.io"
                  required
                />
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-sm text-text font-medium block">Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="px-4 py-3.5 rounded-lg border border-border bg-bg-input text-white outline-none text-[15px] transition-colors duration-300 focus:border-primary tracking-widest"
                placeholder="••••••••"
                required
              />
            </div>

            <button type="submit" className="py-3.5 px-5 rounded-lg bg-primary text-white font-bold cursor-pointer mt-4 text-base transition-colors duration-200 hover:bg-primary-hover active:bg-primary-active">
              {isLogin ? 'Sign In' : 'Register'}
            </button>
          </form>

        </div>

        <div className="text-center mt-8">
          <button onClick={handleGuest} className="bg-transparent border-none text-text-muted cursor-pointer text-[15px] font-medium transition-colors duration-300 hover:text-text-subtle">
            Play as guest
          </button>
        </div>

      </div>

    </div>
  );
}

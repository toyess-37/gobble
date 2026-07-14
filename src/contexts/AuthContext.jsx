import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('gobble_token') || null);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('gobble_user')) || null);

  const login = (newToken, newUser) => {
    localStorage.setItem('gobble_token', newToken);
    localStorage.setItem('gobble_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('gobble_token');
    localStorage.removeItem('gobble_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';

import AuthPage from './pages/AuthPage';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';
import PostGamePage from './pages/PostGamePage';
import ProfilePage from './pages/ProfilePage';
import SpectatePage from './pages/SpectatePage';

// Component to protect routes requiring authentication
const ProtectedRoute = ({ children }) => {
  const { token } = useAuth();
  if (!token) {
    return <Navigate to="/auth" replace />;
  }
  return children;
};

// Component to redirect logged-in users away from /auth
const PublicOnlyRoute = ({ children }) => {
  const { token } = useAuth();
  if (token) {
    return <Navigate to="/lobby" replace />;
  }
  return children;
};

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <Routes>
            <Route 
              path="/" 
              element={<Navigate to="/lobby" replace />} 
            />
            <Route 
              path="/auth" 
              element={
                <PublicOnlyRoute>
                  <AuthPage />
                </PublicOnlyRoute>
              } 
            />
            <Route 
              path="/lobby" 
              element={
                <ProtectedRoute>
                  <LobbyPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/game/:roomId" 
              element={
                <ProtectedRoute>
                  <GamePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/postgame/:matchId" 
              element={
                <ProtectedRoute>
                  <PostGamePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/profile/:username" 
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/spectate/:roomId" 
              element={
                <ProtectedRoute>
                  <SpectatePage />
                </ProtectedRoute>
              } 
            />
            {/* Catch-all route */}
            <Route path="*" element={<Navigate to="/lobby" replace />} />
          </Routes>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

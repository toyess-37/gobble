import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { token } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (token) {
      if (!socket) {
        const newSocket = io('http://localhost:3001', {
          auth: { token },
          reconnection: true,
        });

        newSocket.on('connect', () => {
          setIsConnected(true);
        });

        newSocket.on('disconnect', () => {
          setIsConnected(false);
        });

        setSocket(newSocket);
      } else {
        socket.auth.token = token;
      }
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
      }
    }
  }, [token, socket]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);

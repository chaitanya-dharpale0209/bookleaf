import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { API_BASE_URL, getApiUrl } from '../config/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('bookleaf_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [author, setAuthor] = useState(() => {
    const saved = localStorage.getItem('bookleaf_author');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('bookleaf_token') || null);
  const [socket, setSocket] = useState(null);
  const [demoAccounts, setDemoAccounts] = useState([]);
  const [isSocketConnected, setIsSocketConnected] = useState(false);

  // Fetch demo accounts for easy switching
  useEffect(() => {
    fetch(getApiUrl('/api/auth/demo-accounts'))
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setDemoAccounts(data.data);
        }
      })
      .catch((err) => console.error('Error fetching demo accounts:', err));
  }, []);

  // Initialize Socket.io connection (pointing to API_BASE_URL if on separate domain)
  useEffect(() => {
    const newSocket = io(API_BASE_URL || window.location.origin, {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      // console.log('Socket connected:', newSocket.id);
      setIsSocketConnected(true);

      if (user) {
        newSocket.emit('join_room', {
          role: user.role,
          authorId: user.author_id
        });
      }
    });

    newSocket.on('disconnect', () => {
      setIsSocketConnected(false);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // When user changes, update room membership
  useEffect(() => {
    if (socket && user) {
      socket.emit('join_room', {
        role: user.role,
        authorId: user.author_id
      });
    }
  }, [user, socket]);

  const login = async (email, password) => {
    try {
      const res = await fetch(getApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Login failed.');
      }

      setUser(data.data.user);
      setAuthor(data.data.author);
      setToken(data.data.token);

      localStorage.setItem('bookleaf_user', JSON.stringify(data.data.user));
      localStorage.setItem('bookleaf_author', JSON.stringify(data.data.author));
      localStorage.setItem('bookleaf_token', data.data.token);

      return data.data;
    } catch (err) {
      throw err;
    }
  };

  const quickSwitch = async (email) => {
    try {
      const res = await fetch(getApiUrl('/api/auth/quick-switch'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to switch user.');
      }

      setUser(data.data.user);
      setAuthor(data.data.author);
      setToken(data.data.token);

      localStorage.setItem('bookleaf_user', JSON.stringify(data.data.user));
      localStorage.setItem('bookleaf_author', JSON.stringify(data.data.author));
      localStorage.setItem('bookleaf_token', data.data.token);

      return data.data;
    } catch (err) {
      console.error('Quick switch error:', err);
      throw err;
    }
  };

  const logout = () => {
    setUser(null);
    setAuthor(null);
    setToken(null);
    localStorage.removeItem('bookleaf_user');
    localStorage.removeItem('bookleaf_author');
    localStorage.removeItem('bookleaf_token');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        author,
        token,
        socket,
        isSocketConnected,
        demoAccounts,
        login,
        quickSwitch,
        logout,
        isAdmin: user?.role === 'admin',
        isAuthor: user?.role === 'author'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

import React, { createContext, useState, useEffect } from 'react';
import { apiFetch, setAuthToken, getAuthToken } from '../utils/api';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkSession() {
      const token = getAuthToken();
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const data = await apiFetch('/auth/me');
        setUser(data.user);
      } catch (err) {
        console.error('Session check failed:', err.message);
        setAuthToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    checkSession();
  }, []);

  const login = async (username, password) => {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });

    setAuthToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    setAuthToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

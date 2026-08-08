import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../lib/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('bbc_pos_token'));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('bbc_pos_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        try {
          const res = await api.get('/auth/me');
          setUser({
            id: res.data.id,
            username: res.data.username,
            name: res.data.name,
            tenantId: res.data.tenantId,
            shopName: res.data.tenant.name
          });
        } catch (err) {
          localStorage.removeItem('bbc_pos_token');
          localStorage.removeItem('bbc_pos_user');
          setToken(null);
          setUser(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, [token]);

  const login = async (username: string, password: string) => {
    const res = await api.post('/auth/login', { username, password });
    const { token: authToken, user: userData } = res.data;

    localStorage.setItem('bbc_pos_token', authToken);
    localStorage.setItem('bbc_pos_user', JSON.stringify(userData));

    setToken(authToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('bbc_pos_token');
    localStorage.removeItem('bbc_pos_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

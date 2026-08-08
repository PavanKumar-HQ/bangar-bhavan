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

const DEFAULT_COUNTER_USER: User = {
  id: 'counter_admin_01',
  username: 'admin',
  name: 'Bangar Bhavan Counter Operator',
  tenantId: 'bangar-bhavan-default',
  shopName: 'Bangar Bhavan Chats'
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token] = useState<string>('bangar_instant_pos_token_2026');
  const [user] = useState<User>(DEFAULT_COUNTER_USER);

  const login = async () => {};
  const logout = () => {};

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: true, isLoading: false, login, logout }}>
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

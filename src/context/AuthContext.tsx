'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string) => void;
  register: (name: string, email: string, pass: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem('zeUser');
    if (stored) {
      setUser(JSON.parse(stored));
    }
  }, []);

  const login = (email: string, pass: string) => {
    // Mock login
    const newUser = { name: email.split('@')[0], email };
    setUser(newUser);
    sessionStorage.setItem('zeUser', JSON.stringify(newUser));
  };

  const register = (name: string, email: string, pass: string) => {
    // Mock register
    const newUser = { name, email };
    setUser(newUser);
    sessionStorage.setItem('zeUser', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('zeUser');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

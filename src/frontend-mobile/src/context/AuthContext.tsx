import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { tokenManager } from '../services/api';

interface User {
  id: string;
  fullName?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  membershipLevel: string;
  preferredLanguage: string;
  trustScore?: number;
  role?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => {},
  logout: async () => {},
  updateUser: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const token = await tokenManager.getToken();
      const savedUser = await tokenManager.getUser();
      if (token && savedUser) {
        setUser(savedUser);
      }
    } catch (error) {
      console.error('[Auth] State check error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (token: string, userData: User) => {
    await tokenManager.save(token, userData);
    setUser(userData);
  };

  const logout = async () => {
    await tokenManager.clear();
    setUser(null);
  };

  const updateUser = (userData: User) => {
    setUser(userData);
    AsyncStorage.setItem('@yuanly/user_data', JSON.stringify(userData));
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
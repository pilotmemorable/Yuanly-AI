import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  User,
  authApi,
  getToken,
  setToken,
  clearToken,
  getStoredUser,
  setStoredUser,
  merchantApi,
} from '../api/client';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isMerchant: boolean;
  isAdmin: boolean;
  login: (token: string, user: User, refresh?: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
  registerMerchant: (data: {
    businessName: string;
    businessNameZh?: string;
    contactName: string;
    contactPhone: string;
    contactEmail?: string;
    city: string;
    category: string;
    description?: string;
    password: string;
  }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // On mount: try to restore session from localStorage token
  useEffect(() => {
    const restore = async () => {
      const token = getToken();
      const stored = getStoredUser();
      if (token && stored) {
        setUser(stored);
        // Verify token is still valid
        try {
          const fresh = await authApi.me();
          setUser(fresh);
          setStoredUser(fresh);
        } catch {
          // Token expired — clear it
          clearToken();
          setUser(null);
        }
      }
      setLoading(false);
    };
    restore();
  }, []);

  const login = useCallback((token: string, freshUser: User, refresh?: string) => {
    setToken(token, refresh);
    setStoredUser(freshUser);
    setUser(freshUser);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    if (!getToken()) return;
    try {
      const fresh = await authApi.me();
      setUser(fresh);
      setStoredUser(fresh);
    } catch {
      clearToken();
      setUser(null);
    }
  }, []);

  const registerMerchant = useCallback(
    async (data: {
      businessName: string;
      businessNameZh?: string;
      contactName: string;
      contactPhone: string;
      contactEmail?: string;
      city: string;
      category: string;
      description?: string;
      password: string;
    }) => {
      const result = await merchantApi.register(data);
      login(result.token, result.user);
    },
    [login]
  );

  const value: AuthContextValue = {
    user,
    loading,
    isAuthenticated: !!user,
    isMerchant: user?.role === 'merchant' || user?.role === 'admin',
    isAdmin: user?.role === 'admin',
    login,
    logout,
    refreshUser,
    registerMerchant,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
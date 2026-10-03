import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authAPI, isApiError, setApiUnauthorizedHandler } from '../services/api';
import { sessionStorage } from '../services/storage';
import { User } from '../types/api';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => undefined,
  logout: async () => undefined,
  updateUser: async () => undefined,
  refreshUser: async () => null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(async () => {
    await sessionStorage.clearSession();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const token = await sessionStorage.getToken();
    if (!token) {
      setUser(null);
      return null;
    }

    const response = await authAPI.getMe();
    setUser(response.user);
    await sessionStorage.saveSession(token, response.user);
    return response.user;
  }, []);

  useEffect(() => {
    setApiUnauthorizedHandler(clearSession);

    void (async () => {
      const token = await sessionStorage.getToken();
      const storedUser = await sessionStorage.getUser();

      if (storedUser) {
        setUser(storedUser);
      }

      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        await refreshUser();
      } catch (error) {
        if (isApiError(error) && error.status === 401) {
          await clearSession();
        }
      } finally {
        setIsLoading(false);
      }
    })();

    return () => setApiUnauthorizedHandler(null);
  }, [clearSession, refreshUser]);

  const login = useCallback(async (token: string, nextUser: User) => {
    await sessionStorage.saveSession(token, nextUser);
    setUser(nextUser);
  }, []);

  const logout = useCallback(async () => {
    await clearSession();
  }, [clearSession]);

  const updateUser = useCallback(async (nextUser: User) => {
    const token = await sessionStorage.getToken();
    if (token) {
      await sessionStorage.saveSession(token, nextUser);
    }
    setUser(nextUser);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      login,
      logout,
      updateUser,
      refreshUser,
    }),
    [isLoading, login, logout, refreshUser, updateUser, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

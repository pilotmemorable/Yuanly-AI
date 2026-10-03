import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { ApiError, api, configureApiAuth, type User } from './api';
import { useToast } from './components/ui';
import { tr } from './tr';

const TOKEN_STORAGE_KEY = 'yuanly.admin.token';

type AuthContextValue = {
  user: User | null;
  token: string | null;
  initializing: boolean;
  authNotice: string | null;
  clearAuthNotice: () => void;
  login: (email: string, password: string) => Promise<boolean>;
  logout: (notice?: string) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }): JSX.Element {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem(TOKEN_STORAGE_KEY));
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState<boolean>(() => Boolean(sessionStorage.getItem(TOKEN_STORAGE_KEY)));
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const { addToast } = useToast();

  const clearSession = useCallback(
    (notice?: string, toast = false) => {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      setToken(null);
      setUser(null);
      setAuthNotice(notice ?? null);
      if (notice && toast) {
        addToast({ title: notice, tone: 'warning' });
      }
    },
    [addToast],
  );

  useEffect(() => {
    configureApiAuth({
      getToken: () => token,
      onUnauthorized: () => clearSession(tr.auth.sessionExpired, true),
    });
  }, [clearSession, token]);

  useEffect(() => {
    let active = true;

    if (!token) {
      setInitializing(false);
      return () => {
        active = false;
      };
    }

    setInitializing(true);
    void api
      .getMe()
      .then(({ user: currentUser }) => {
        if (!active) return;
        if (currentUser.role !== 'ADMIN') {
          clearSession(tr.auth.adminOnly);
          setInitializing(false);
          return;
        }
        setUser(currentUser);
        setInitializing(false);
      })
      .catch(() => {
        if (!active) return;
        clearSession(tr.auth.sessionExpired);
        setInitializing(false);
      });

    return () => {
      active = false;
    };
  }, [clearSession, token]);

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.login({ email, password });
    if (response.user.role !== 'ADMIN') {
      clearSession(tr.auth.adminOnly);
      return false;
    }

    sessionStorage.setItem(TOKEN_STORAGE_KEY, response.token);
    setToken(response.token);
    setUser(response.user);
    setAuthNotice(null);
    return true;
  }, [clearSession]);

  const logout = useCallback(
    (notice?: string) => {
      clearSession(notice);
    },
    [clearSession],
  );

  const clearAuthNotice = useCallback(() => setAuthNotice(null), []);

  const value = useMemo(
    () => ({
      user,
      token,
      initializing,
      authNotice,
      clearAuthNotice,
      login,
      logout,
    }),
    [authNotice, clearAuthNotice, initializing, login, logout, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

export function isAuthRateLimit(error: unknown): boolean {
  return error instanceof ApiError && error.status === 429;
}

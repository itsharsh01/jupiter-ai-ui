import { useCallback, useEffect, useState } from 'react';
import {
  clearSession,
  fetchCurrentUser,
  loadStoredUser,
  login as loginRequest,
  register as registerRequest,
  type AuthUser,
} from '../api/auth';
import { getAuthToken } from '../api/config';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(() => loadStoredUser());
  const [checking, setChecking] = useState(() => Boolean(getAuthToken()));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      setChecking(false);
      return;
    }
    let cancelled = false;
    void fetchCurrentUser()
      .then((profile) => {
        if (!cancelled) setUser(profile);
      })
      .catch(() => {
        if (!cancelled) {
          clearSession();
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    const response = await loginRequest(email, password);
    setUser(response.user);
    return response;
  }, []);

  const register = useCallback(
    async (email: string, password: string, name?: string, company?: string) => {
      setError(null);
      const response = await registerRequest(email, password, name, company);
      setUser(response.user);
      return response;
    },
    [],
  );

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    setError(null);
  }, []);

  return {
    user,
    isAuthenticated: Boolean(user),
    checking,
    error,
    setError,
    login,
    register,
    logout,
  };
}

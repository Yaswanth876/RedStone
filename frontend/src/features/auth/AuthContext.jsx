import { createContext, useState, useEffect, useCallback } from 'react';
import {
  loginUser,
  registerUser,
  saveSession,
  clearSession,
  getStoredToken,
  getStoredUser,
} from './auth.service.js';

/**
 * AuthContext
 *
 * Provides:
 *   isAuthenticated  — boolean
 *   user             — { id, name, email, createdAt, ... } | null
 *   token            — string | null
 *   isLoading        — boolean (true while restoring session on first render)
 *   login(email, password)          — Promise<void>, throws ApiError on failure
 *   register(name, email, password) — Promise<void>, throws ApiError on failure
 *   logout()                        — void
 */

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  // isLoading is true only during the initial session-restore phase
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from sessionStorage on mount (supports page refresh)
  useEffect(() => {
    const storedToken = getStoredToken();
    const storedUser = getStoredUser();
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
    }
    setIsLoading(false);
  }, []);

  /** Persist and activate a session from a token + user payload. */
  const establishSession = useCallback((newToken, newUser) => {
    saveSession(newToken, newUser);
    setToken(newToken);
    setUser(newUser);
  }, []);

  /**
   * Login action.
   * @param {string} email
   * @param {string} password
   * @throws {ApiError}
   */
  const login = useCallback(async (email, password) => {
    const { token: newToken, user: newUser } = await loginUser({ email, password });
    establishSession(newToken, newUser);
  }, [establishSession]);

  /**
   * Register action. Backend returns a token directly — no separate login needed.
   * @param {string} name
   * @param {string} email
   * @param {string} password
   * @throws {ApiError}
   */
  const register = useCallback(async (name, email, password) => {
    const { token: newToken, user: newUser } = await registerUser({ name, email, password });
    establishSession(newToken, newUser);
  }, [establishSession]);

  /** Logout action — clears session and state. */
  const logout = useCallback(() => {
    clearSession();
    setToken(null);
    setUser(null);
  }, []);

  const value = {
    isAuthenticated: Boolean(token),
    user,
    token,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;

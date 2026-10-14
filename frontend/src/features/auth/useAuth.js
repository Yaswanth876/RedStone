/**
 * useAuth — hook to consume AuthContext.
 * Must be used inside <AuthProvider>.
 * Extracted to a separate file to satisfy Vite fast-refresh requirements.
 */
import { useContext } from 'react';
import AuthContext from './AuthContext.jsx';

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return ctx;
}

export default useAuth;

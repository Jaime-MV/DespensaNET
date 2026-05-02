import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

/**
 * useAuth
 * Convenience hook for consuming AuthContext.
 * Usage: const { user, login, logout, isAuthenticated } = useAuth();
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}

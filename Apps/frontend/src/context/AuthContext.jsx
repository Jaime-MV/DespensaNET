import { createContext, useState, useCallback } from 'react';

/**
 * AuthContext
 * Stores the full session object: { user, accessToken, loginAt }
 * The Axios interceptor in src/services/api.js reads the token
 * automatically from sessionStorage on every request.
 */
export const AuthContext = createContext(null);

const SESSION_KEY = 'despensanet_session';

function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(loadSession);

  /**
   * login({ accessToken, user })
   * Called by LoginCard after a successful POST /api/auth/login
   */
  const login = useCallback(({ accessToken, user }) => {
    const data = { accessToken, user, loginAt: new Date().toISOString() };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
    setSession(data);
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user:            session?.user ?? null,
        accessToken:     session?.accessToken ?? null,
        isAuthenticated: Boolean(session?.accessToken),
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

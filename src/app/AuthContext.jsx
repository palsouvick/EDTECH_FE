import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useDataSource } from './DataSourceContext';

const AuthContext = createContext(null);

/**
 * The signed-in student, from GET /auth/me on load. The session itself is an
 * httpOnly cookie, so nothing secret is kept in page storage.
 *
 * status: 'loading' | 'ready'. user: { id, name, email } | null.
 */
export function AuthProvider({ children }) {
  const source = useDataSource();
  const [state, setState] = useState({ status: 'loading', user: null });

  useEffect(() => {
    let live = true;
    source
      .getMe()
      .then(({ user }) => live && setState({ status: 'ready', user }))
      // Unreachable server: treat as signed out; pages show their own load errors.
      .catch(() => live && setState({ status: 'ready', user: null }));
    return () => {
      live = false;
    };
  }, [source]);

  const login = useCallback(async (body) => {
    const { user } = await source.login(body);
    setState({ status: 'ready', user });
    return user;
  }, [source]);

  const register = useCallback(async (body) => {
    const { user } = await source.register(body);
    setState({ status: 'ready', user });
    return user;
  }, [source]);

  const logout = useCallback(async () => {
    try {
      await source.logout();
    } finally {
      setState({ status: 'ready', user: null });
    }
  }, [source]);

  const value = useMemo(() => ({ ...state, login, register, logout }), [state, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Like useAuth, but null outside an AuthProvider (components rendered on their own, e.g. in tests). */
export function useOptionalAuth() {
  return useContext(AuthContext);
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

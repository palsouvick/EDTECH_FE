import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useDataSource } from './DataSourceContext';
import { languageStore } from '../hooks/useLanguagePreference';
import { syncLearnProgress } from '../lib/learnProgress';

const AuthContext = createContext(null);

/**
 * The signed-in student, from GET /me on load. The session itself is an
 * httpOnly cookie, so nothing secret is kept in page storage.
 *
 * status: 'loading' | 'ready'. user: { id, name, email, targetExam: { code, date, setAt } | null,
 * dailyStudyMinutes: number | null, preferredLanguage: 'en' | 'bn' | null } | null.
 *
 * A study language stored on the account wins over this device's language:
 * the server is the source of truth for a signed-in student, and the
 * language store (localStorage) follows it. The nav switcher itself stays
 * device-local — only the profile save writes the server value.
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

  /** Re-read the signed-in student (GET /me); a failed refresh keeps the user already held. */
  const refreshUser = useCallback(async () => {
    try {
      const { user } = await source.getMe();
      setState({ status: 'ready', user });
      return user;
    } catch {
      return state.user;
    }
  }, [source, state.user]);

  /** PUT /me/target-exam, then hold the returned user (examCode null clears the exam and its date). */
  const setTargetExam = useCallback(async ({ examCode, examDate, dailyStudyMinutes, preferredLanguage }) => {
    const res = await source.setTargetExam({ examCode, examDate, dailyStudyMinutes, preferredLanguage });
    if (res?.user) {
      setState({ status: 'ready', user: res.user });
      return res.user;
    }
    return refreshUser();
  }, [source, refreshUser]);

  // The account's stored study language wins over this device's language.
  const serverLanguage = state.user?.preferredLanguage;
  useEffect(() => {
    if (serverLanguage && serverLanguage !== languageStore.get()) languageStore.set(serverLanguage);
  }, [serverLanguage]);

  // Signed in: bring this device's Learn progress and the account's copy together.
  const userId = state.user?.id;
  useEffect(() => {
    if (userId) syncLearnProgress(source);
  }, [userId, source]);

  const value = useMemo(() => ({ ...state, login, register, logout, refreshUser, setTargetExam }), [state, login, register, logout, refreshUser, setTargetExam]);
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

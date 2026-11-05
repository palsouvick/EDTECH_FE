import { useEffect, useState } from 'react';
import { useDataSource } from '../../app/DataSourceContext';
import { useOptionalAuth } from '../../app/AuthContext';

/**
 * Server-side progress for one Learn subject, for signed-in students: chapter mastery
 * (GET /me/insights) and past-paper progress (GET /me/pyq-progress). Fetched fresh on
 * every visit, because both change after each quiz. Guests get { signedIn: false }.
 */
export function useLearnStatus(subject) {
  const source = useDataSource();
  const auth = useOptionalAuth();
  const user = auth?.user ?? null;
  const [state, setState] = useState({ signedIn: false, ready: false, mastery: {}, pyq: {}, mistakes: [] });

  useEffect(() => {
    if (auth && auth.status !== 'ready') return undefined;
    if (!user) {
      setState({ signedIn: false, ready: true, mastery: {}, pyq: {}, mistakes: [] });
      return undefined;
    }
    let live = true;
    Promise.allSettled([source.getInsights(), source.getPyqProgress(subject), source.getMistakes({ subject })]).then(([ins, pyq, mis]) => {
      if (!live) return;
      const mastery = {};
      if (ins.status === 'fulfilled') for (const m of ins.value.mastery || []) if (m.subject === subject) mastery[m.topic] = m;
      setState({
        signedIn: true,
        ready: true,
        mastery,
        pyq: pyq.status === 'fulfilled' ? pyq.value.topics || {} : {},
        mistakes: mis.status === 'fulfilled' ? mis.value.items || [] : [],
      });
    });
    return () => {
      live = false;
    };
  }, [source, auth, user, subject]);

  return state;
}

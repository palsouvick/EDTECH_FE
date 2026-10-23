import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useDataSource } from '../app/DataSourceContext';
import { examStore } from '../lib/examStore';
import { MOCK } from '../lib/i18n';
import { paths } from '../lib/routes';
import { createExamState } from '../features/mock/mockExamReducer';
import MockTestEngine from '../components/mock/MockTestEngine';
import TestAnalyticsDashboard from '../components/analytics/TestAnalyticsDashboard';
import { Localized } from '../components/topic-hub/Localized';
import { LoadError } from './funnel/FunnelLayout';

/**
 * /mock/:sessionId. Recovery order on load (including after an accidental refresh):
 *  1. this device's saved exam (IndexedDB): answers, marks, position; the
 *     timer restores itself from localStorage;
 *  2. otherwise the server session: an ACTIVE test continues with a fresh local
 *     view (e.g. on another device), a SUBMITTED one shows its result.
 */
export default function MockTestPage() {
  const { sessionId } = useParams();
  const source = useDataSource();
  const [view, setView] = useState({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  // Read once, then drop it: history state survives reloads, and a reload IS a restore.
  const [fresh] = useState(() => Boolean(location.state?.fresh));
  useEffect(() => {
    if (location.state?.fresh) navigate(location.pathname, { replace: true, state: null });
  }, [location, navigate]);

  useEffect(() => {
    let alive = true;
    const show = (v) => alive && setView(v);
    (async () => {
      if (!/^[a-f\d]{24}$/i.test(sessionId)) return show({ status: 'missing' });
      const saved = await examStore.get(sessionId);
      if (saved) return show({ status: 'ready', exam: saved, restored: !fresh });
      try {
        const s = await source.getMockSession(sessionId);
        if (s.status === 'SUBMITTED') return show({ status: 'result', result: s });
        const exam = createExamState(s, { examName: MOCK.mockTest });
        await examStore.put(exam);
        return show({ status: 'ready', exam, restored: true });
      } catch (error) {
        if (error.status === 404) return show({ status: 'missing' });
        if (error.code === 'SESSION_EXPIRED') return show({ status: 'expired' });
        return show({ status: 'error', error });
      }
    })();
    return () => {
      alive = false;
    };
  }, [sessionId, source, attempt]);

  if (view.status === 'missing') return <Navigate to={paths.exams()} replace />;

  if (view.status === 'ready') {
    return (
      <MockTestEngine
        key={sessionId}
        initialState={view.exam}
        source={source}
        backTo={view.exam.meta?.topicPath ?? paths.exams()}
        restored={view.restored}
      />
    );
  }

  if (view.status === 'result') return <TestAnalyticsDashboard sessionId={sessionId} source={source} backTo={paths.exams()} />;

  return (
    <div className="mx-auto mt-16 max-w-md px-4">
      {view.status === 'loading' && (
        <div aria-busy="true" aria-label="Loading" className="h-64 animate-pulse rounded-2xl bg-slate-200/70 motion-reduce:animate-none dark:bg-slate-800/70" />
      )}
      {view.status === 'expired' && (
        <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          <Localized value={MOCK.expired} as="p" className="font-semibold text-slate-900 dark:text-white" />
          <Link to={paths.exams()} className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white">
            <Localized value={MOCK.backToTopic} />
          </Link>
        </div>
      )}
      {view.status === 'error' && <LoadError error={view.error} onRetry={() => setAttempt((n) => n + 1)} />}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';
import { useDataSource } from '../app/DataSourceContext';
import { loginPath } from '../components/auth/AccountButton';
import PageShell from '../components/navigation/PageShell';
import { Localized } from '../components/topic-hub/Localized';
import { MP } from '../lib/mockPapersCopy';
import { CardGridSkeleton, LoadError } from './funnel/FunnelLayout';

const card = 'rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800';

/** /mocks — published mock papers, signed-in only. */
export default function MockPapersPage() {
  const source = useDataSource();
  const location = useLocation();
  const { status: authStatus, user } = useAuth();
  const [state, setState] = useState({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (authStatus !== 'ready' || !user) return undefined;
    let alive = true;
    setState({ status: 'loading' });
    source.listMockPapers().then(
      (data) => alive && setState({ status: 'ready', data }),
      (error) => alive && setState({ status: 'error', error }),
    );
    return () => {
      alive = false;
    };
  }, [source, authStatus, user, attempt]);

  if (authStatus === 'ready' && !user) return <Navigate to={loginPath(location)} replace />;

  const papers = state.data?.papers ?? [];

  return (
    <PageShell className="max-w-4xl space-y-5 pb-16 pt-6 sm:pt-10">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
          <span aria-hidden="true">📋 </span>
          <Localized value={MP.title} />
        </h1>
        <Localized value={MP.subtitle} as="p" className="mt-1 text-slate-600 dark:text-slate-300" />
      </header>

      {state.status === 'loading' && <CardGridSkeleton />}
      {state.status === 'error' && <LoadError error={state.error} onRetry={() => setAttempt((n) => n + 1)} />}

      {state.status === 'ready' && papers.length === 0 && (
        <section className={`${card} text-center`}>
          <Localized value={MP.emptyTitle} as="h2" className="text-lg font-extrabold text-slate-900 dark:text-white" />
          <Localized value={MP.emptyBody} as="p" className="mx-auto mt-2 max-w-lg text-slate-600 dark:text-slate-300" />
        </section>
      )}

      {state.status === 'ready' && papers.length > 0 && (
        <ul className="space-y-3">
          {papers.map((paper) => (
            <li key={paper.id}>
              <Link to={`/mocks/${paper.id}`} className={`${card} block hover:shadow-md`}>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{paper.title}</h2>
                <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">
                  <Localized value={MP.sourceLabel(paper.sourceLabel)} />
                </p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  <Localized value={MP.questionsCount(paper.questionCount)} /> · <Localized value={MP.timeCount(paper.timeLimitMin)} />
                  {paper.myAttempts && (
                    <> · <Localized value={MP.attemptsLine(paper.myAttempts.count, paper.myAttempts.bestScore)} /></>
                  )}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </PageShell>
  );
}

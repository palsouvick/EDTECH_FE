import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';
import { useDataSource } from '../app/DataSourceContext';
import { loginPath } from '../components/auth/AccountButton';
import PageShell from '../components/navigation/PageShell';
import { Localized } from '../components/topic-hub/Localized';
import { MP } from '../lib/mockPapersCopy';
import { CardGridSkeleton, LoadError } from './funnel/FunnelLayout';

const card = 'rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6 dark:bg-slate-900 dark:ring-slate-800';
const btn = 'min-h-11 rounded-xl px-5 text-sm font-semibold disabled:cursor-wait disabled:opacity-60';

/** /mocks/:paperId — one published paper, its attempts, and Start. */
export default function MockPaperDetailPage() {
  const source = useDataSource();
  const location = useLocation();
  const navigate = useNavigate();
  const { paperId } = useParams();
  const { status: authStatus, user } = useAuth();
  const [state, setState] = useState({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState(null);

  useEffect(() => {
    if (authStatus !== 'ready' || !user) return undefined;
    let alive = true;
    setState({ status: 'loading' });
    source.getMockPaper(paperId).then(
      (data) => alive && setState({ status: 'ready', data }),
      (error) => alive && setState({ status: 'error', error }),
    );
    return () => {
      alive = false;
    };
  }, [source, authStatus, user, paperId, attempt]);

  if (authStatus === 'ready' && !user) return <Navigate to={loginPath(location)} replace />;

  const start = async () => {
    setStarting(true);
    setStartError(null);
    try {
      const data = await source.startMockPaperAttempt(paperId);
      navigate(`/mocks/${paperId}/attempt/${data.attempt.id}`);
    } catch (err) {
      setStartError(err);
    } finally {
      setStarting(false);
    }
  };

  const d = state.data;
  const paper = d?.paper;
  const myAttempts = d?.myAttempts ?? [];
  const isNotFound = state.status === 'error' && state.error?.status === 404;

  return (
    <PageShell className="max-w-4xl space-y-5 pb-16 pt-6 sm:pt-10">
      <Link to="/mocks" className="text-sm font-semibold text-indigo-700 hover:underline dark:text-indigo-300">
        <Localized value={MP.backToList} />
      </Link>

      {state.status === 'loading' && <CardGridSkeleton />}

      {isNotFound && (
        <section className={`${card} text-center`}>
          <Localized value={MP.notFoundTitle} as="h1" className="text-2xl font-extrabold text-slate-900 dark:text-white" />
          <Localized value={MP.notFoundBody} as="p" className="mx-auto mt-2 max-w-lg text-slate-600 dark:text-slate-300" />
        </section>
      )}
      {state.status === 'error' && !isNotFound && <LoadError error={state.error} onRetry={() => setAttempt((n) => n + 1)} />}

      {state.status === 'ready' && paper && (
        <>
          <section className={card}>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">{paper.title}</h1>
            <p className="mt-1 text-slate-600 dark:text-slate-300">
              <Localized value={MP.sourceLabel(paper.sourceLabel)} />
            </p>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              <Localized value={MP.questionsCount(paper.questionCount)} /> · <Localized value={MP.timeCount(paper.timeLimitMin)} />
            </p>
            <button type="button" disabled={starting} onClick={start} className={`${btn} mt-4 bg-indigo-600 text-white hover:bg-indigo-500`}>
              <Localized value={starting ? MP.starting : MP.start} />
            </button>
            {startError && (
              <p role="alert" className="mt-3 text-sm text-rose-600 dark:text-rose-300">{startError.message}</p>
            )}
          </section>

          <section className={card} aria-labelledby="attempts-title">
            <h2 id="attempts-title" className="text-lg font-extrabold text-slate-900 dark:text-white">
              <Localized value={MP.attemptsTitle} />
            </h2>
            {myAttempts.length === 0 ? (
              <Localized value={MP.noAttempts} as="p" className="mt-2 text-sm text-slate-600 dark:text-slate-300" />
            ) : (
              <ul className="mt-3 space-y-2">
                {myAttempts.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span className="text-slate-700 dark:text-slate-200">
                      <Localized value={MP.attemptRow(a.score, a.total, new Date(a.startedAt).toLocaleDateString())} />
                      {' · '}
                      <Localized value={MP.attemptStatus[a.status] ?? MP.attemptStatus.ACTIVE} />
                    </span>
                    <Link
                      to={`/mocks/${paperId}/attempt/${a.id}`}
                      className="font-semibold text-indigo-700 hover:underline dark:text-indigo-300"
                    >
                      <Localized value={a.status === 'SUBMITTED' ? MP.viewResult : MP.resumeAttempt} />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </PageShell>
  );
}

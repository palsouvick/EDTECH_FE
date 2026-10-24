import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';
import { useDataSource } from '../app/DataSourceContext';
import { loginPath } from '../components/auth/AccountButton';
import PageShell from '../components/navigation/PageShell';
import { Localized } from '../components/topic-hub/Localized';
import { BOARD } from '../lib/motivationCopy';
import { LoadError } from './funnel/FunnelLayout';

const MEDALS = ['🥇', '🥈', '🥉'];

/** /leaderboard: weekly correct answers among students who opted in. */
export default function LeaderboardPage() {
  const { status: authStatus, user } = useAuth();
  const source = useDataSource();
  const location = useLocation();
  const [state, setState] = useState({ status: 'loading' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return undefined;
    let alive = true;
    source.getLeaderboard().then(
      (data) => alive && setState({ status: 'ready', data }),
      (error) => alive && setState({ status: 'error', error }),
    );
    return () => {
      alive = false;
    };
  }, [user, source]);

  if (authStatus === 'ready' && !user) return <Navigate to={loginPath(location)} replace />;

  async function toggle() {
    setBusy(true);
    try {
      setState({ status: 'ready', data: await source.setLeaderboardOptIn(!state.data.optedIn) });
    } finally {
      setBusy(false);
    }
  }

  const d = state.data;
  return (
    <PageShell className="max-w-2xl pb-16 pt-6 sm:pt-10">
      <header className="rounded-3xl bg-gradient-to-br from-sky-500 via-indigo-600 to-violet-600 p-6 text-white shadow-lg sm:p-8">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          <span aria-hidden="true">🏅 </span>
          <Localized value={BOARD.title} />
        </h1>
        <Localized value={BOARD.sub} as="p" className="mt-2 leading-relaxed text-white/95" />
        {d && (
          <button
            type="button"
            aria-pressed={d.optedIn}
            disabled={busy}
            onClick={toggle}
            className={`mt-4 min-h-11 rounded-xl px-5 font-bold disabled:opacity-60 ${d.optedIn ? 'bg-white/15 ring-1 ring-white/40 hover:bg-white/25' : 'bg-white text-indigo-700 hover:bg-indigo-50'}`}
          >
            <Localized value={d.optedIn ? BOARD.leave : BOARD.join} />
          </button>
        )}
      </header>

      <div className="mt-6">
        {state.status === 'loading' && <div className="h-64 animate-pulse rounded-2xl bg-slate-200/70 motion-reduce:animate-none dark:bg-slate-800/70" aria-busy="true" />}
        {state.status === 'error' && <LoadError error={state.error} onRetry={() => window.location.reload()} />}
        {d && !d.optedIn && <Localized value={BOARD.off} as="p" className="mb-4 rounded-xl bg-slate-100 px-4 py-3 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300" />}
        {d && (
          <ol className="divide-y divide-slate-100 overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:divide-slate-800 dark:bg-slate-900 dark:ring-slate-800">
            {d.top.length === 0 && <Localized value={BOARD.empty} as="li" className="p-6 text-center text-slate-500" />}
            {d.top.map((r) => (
              <li key={r.rank} className={`flex items-center gap-4 px-5 py-3 ${r.isMe ? 'bg-indigo-50 dark:bg-indigo-500/10' : ''}`}>
                <span className="w-8 text-center text-lg font-extrabold tabular-nums text-slate-500">{MEDALS[r.rank - 1] ?? r.rank}</span>
                <span className="min-w-0 flex-1 truncate font-semibold text-slate-900 dark:text-white">
                  {r.name}
                  {r.isMe && <Localized value={BOARD.you} className="ml-2 rounded-full bg-indigo-600 px-2 py-0.5 text-xs font-bold text-white" />}
                </span>
                <Localized value={BOARD.correct(r.correct)} className="text-sm font-bold tabular-nums text-emerald-700 dark:text-emerald-300" />
              </li>
            ))}
          </ol>
        )}
      </div>
    </PageShell>
  );
}

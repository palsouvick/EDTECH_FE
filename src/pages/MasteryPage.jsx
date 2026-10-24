import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';
import { useDataSource } from '../app/DataSourceContext';
import { loginPath } from '../components/auth/AccountButton';
import PageShell from '../components/navigation/PageShell';
import { Localized } from '../components/topic-hub/Localized';
import { MASTERY } from '../lib/motivationCopy';
import { paths } from '../lib/routes';
import { CardGridSkeleton, LoadError } from './funnel/FunnelLayout';

export const STATUS_STYLE = {
  strong: { tile: 'bg-emerald-500 text-white ring-emerald-600', dot: 'bg-emerald-500', icon: '🏆' },
  improving: { tile: 'bg-amber-400 text-amber-950 ring-amber-500', dot: 'bg-amber-400', icon: '📈' },
  weak: { tile: 'bg-rose-500 text-white ring-rose-600', dot: 'bg-rose-500', icon: '⚠️' },
  started: { tile: 'bg-sky-100 text-sky-900 ring-sky-200 dark:bg-sky-500/15 dark:text-sky-200 dark:ring-sky-500/30', dot: 'bg-sky-300', icon: '🌱' },
  not_started: { tile: 'bg-white text-slate-500 ring-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:ring-slate-700', dot: 'bg-slate-300 dark:bg-slate-600', icon: '○' },
};
const LEGEND = ['weak', 'improving', 'strong', 'started', 'not_started'];

/** /mastery: every chapter as a coloured tile, grouped by subject. */
export default function MasteryPage() {
  const { status: authStatus, user } = useAuth();
  const source = useDataSource();
  const location = useLocation();
  const [state, setState] = useState({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!user) return undefined;
    let alive = true;
    setState({ status: 'loading' });
    source.getInsights().then(
      (data) => alive && setState({ status: 'ready', data }),
      (error) => alive && setState({ status: 'error', error }),
    );
    return () => {
      alive = false;
    };
  }, [user, source, attempt]);

  if (authStatus === 'ready' && !user) return <Navigate to={loginPath(location)} replace />;

  const bySubject = [];
  for (const m of state.data?.mastery ?? []) {
    let g = bySubject.find((x) => x.subject === m.subject);
    if (!g) bySubject.push((g = { subject: m.subject, name: m.subjectName, chapters: [] }));
    g.chapters.push(m);
  }

  return (
    <PageShell className="max-w-6xl pb-16 pt-6 sm:pt-10">
      <header className="rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-6 text-white shadow-lg sm:p-8">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          <span aria-hidden="true">🗺️ </span>
          <Localized value={MASTERY.title} />
        </h1>
        <Localized value={MASTERY.sub} as="p" className="mt-2 max-w-2xl leading-relaxed text-white/95" />
        {state.data && (
          <ul className="mt-5 flex flex-wrap gap-2" aria-label="Legend">
            {LEGEND.map((s) => (
              <li key={s} className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-semibold ring-1 ring-white/25">
                <span className={`size-3 rounded-full ${STATUS_STYLE[s].dot}`} aria-hidden="true" />
                <Localized value={MASTERY.status[s]} />
                <span className="tabular-nums opacity-90">{state.data.counts[s] ?? 0}</span>
              </li>
            ))}
          </ul>
        )}
      </header>

      <div className="mt-8 space-y-8">
        {state.status === 'loading' && <CardGridSkeleton count={8} height="h-28" />}
        {state.status === 'error' && <LoadError error={state.error} onRetry={() => setAttempt((n) => n + 1)} />}
        {bySubject.map((g) => (
          <section key={g.subject} aria-labelledby={`m-${g.subject}`}>
            <h2 id={`m-${g.subject}`} className="mb-3 text-xl font-bold text-slate-900 dark:text-white">
              <Localized value={g.name} />
            </h2>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {g.chapters.map((m) => {
                const st = STATUS_STYLE[m.status];
                return (
                  <li key={m.topic}>
                    <Link
                      to={paths.topic(m.category, m.subject, m.topic)}
                      className={`flex h-full min-h-28 flex-col rounded-2xl p-3.5 ring-1 transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 motion-reduce:transition-none ${st.tile}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <Localized value={m.name} className="text-sm font-bold leading-snug" />
                        <span aria-hidden="true">{st.icon}</span>
                      </div>
                      <div className="mt-auto pt-2 text-xs font-semibold opacity-90">
                        <Localized value={MASTERY.status[m.status]} as="span" className="block" />
                        {m.accuracyPct != null && (
                          <span className="block tabular-nums">
                            <Localized value={MASTERY.accuracy(m.accuracyPct)} />
                            {m.hardAccuracyPct != null && <> · <Localized value={MASTERY.hard(m.hardAccuracyPct)} /></>}
                          </span>
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
        {state.data && (
          <aside className="rounded-2xl bg-white p-4 text-sm text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-800">
            <Localized value={MASTERY.legendTitle} className="font-bold text-slate-900 dark:text-white" />: <Localized value={MASTERY.legend} />
          </aside>
        )}
      </div>
    </PageShell>
  );
}

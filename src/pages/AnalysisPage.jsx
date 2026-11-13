import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';
import { useDataSource } from '../app/DataSourceContext';
import { loginPath } from '../components/auth/AccountButton';
import PageShell from '../components/navigation/PageShell';
import { Localized } from '../components/topic-hub/Localized';
import { useLanguagePreference } from '../hooks/useLanguagePreference';
import { BandBadge, card, FirstPlanStep, Meter, WhyList } from '../components/analysis/AnalysisParts';
import { AN } from '../lib/analysisCopy';
import { subjectSlugFromCode } from '../lib/routes';
import { CardGridSkeleton, LoadError } from './funnel/FunnelLayout';

/** /analysis: Mathematics and English learning health side by side, and the current focus. */
export default function AnalysisPage() {
  const { status: authStatus, user } = useAuth();
  const source = useDataSource();
  const location = useLocation();
  const { lang } = useLanguagePreference();
  const [state, setState] = useState({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!user) return undefined;
    let alive = true;
    setState({ status: 'loading' });
    source.getLearningOverview(lang).then(
      (data) => alive && setState({ status: 'ready', data }),
      (error) => alive && setState({ status: 'error', error }),
    );
    return () => {
      alive = false;
    };
  }, [user, source, lang, attempt]);

  if (authStatus === 'ready' && !user) return <Navigate to={loginPath(location)} replace />;
  const d = state.data;

  return (
    <PageShell className="max-w-6xl pb-16 pt-6 sm:pt-10">
      <header className="rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-6 text-white shadow-lg sm:p-8">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          <span aria-hidden="true">🧭 </span>
          <Localized value={AN.title} />
        </h1>
        <Localized value={AN.sub} as="p" className="mt-2 max-w-2xl leading-relaxed text-white/95" />
      </header>

      {state.status === 'loading' && <div className="mt-6"><CardGridSkeleton count={2} height="h-48" /></div>}
      {state.status === 'error' && <div className="mt-6"><LoadError error={state.error} onRetry={() => setAttempt((n) => n + 1)} /></div>}
      {d && (
        <div className="mt-6 space-y-6">
          <section aria-labelledby="health">
            <h2 id="health" className="sr-only"><Localized value={AN.health} /></h2>
            <ul className="grid gap-4 md:grid-cols-2">
              {d.subjects.map((s) => <SubjectCard key={s.subject} s={s} />)}
            </ul>
          </section>

          <section aria-labelledby="focus" className={card}>
            <h2 id="focus" className="text-xl font-bold text-slate-900 dark:text-white"><Localized value={AN.currentFocus} /></h2>
            <Localized value={AN.currentFocusSub} as="p" className="text-sm text-slate-600 dark:text-slate-300" />
            {!d.focus.length && <Localized value={AN.nothingToFocus} as="p" className="mt-3 text-slate-700 dark:text-slate-200" />}
            <ol className="mt-3 space-y-3">
              {d.focus.map((c, i) => (
                <li key={`${c.subject}.${c.topic}`} className="flex gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-indigo-600 font-bold text-white">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link to={`/analysis/${subjectSlugFromCode(c.subject)}`} className="font-bold text-slate-900 hover:text-indigo-700 dark:text-white dark:hover:text-indigo-300">
                        <Localized value={AN.subjects[c.subject]} /> — <Localized value={c.title} />
                      </Link>
                      <BandBadge band={c.band} score={c.score} />
                    </div>
                    <WhyList why={c.why.slice(0, 2)} />
                    <FirstPlanStep subject={c.subject} topic={c.topic} plan={c.plan} />
                  </div>
                </li>
              ))}
            </ol>
          </section>
          <Localized value={AN.loop} as="p" className="text-center text-sm text-slate-500 dark:text-slate-400" />
        </div>
      )}
    </PageShell>
  );
}

function SubjectCard({ s }) {
  const sum = s.summary;
  const slug = subjectSlugFromCode(s.subject);
  return (
    <li className={card}>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white">
        <span aria-hidden="true">{AN.subjectIcon[s.subject]} </span>
        <Localized value={AN.subjects[s.subject]} />
      </h3>
      <Localized value={AN.chaptersStarted(sum.started, sum.chapters)} as="p" className="text-sm text-slate-500 dark:text-slate-400" />
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <Meter label={AN.mastery} value={sum.masteryPct} />
          {sum.syllabusMasteryPct != null && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              <Localized value={AN.syllabus} />: <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-200">{sum.syllabusMasteryPct}%</span>
            </p>
          )}
        </div>
        <Meter label={AN.accuracy} value={sum.accuracyPct} />
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4">
        {[
          [AN.needsAttention, sum.needsAttentionChapters, null],
          [AN.incomplete, sum.incompleteChapters, null],
          [AN.openMistakes, sum.openMistakes, '/mistakes'],
          [AN.openSkips, sum.openSkips, `/analysis/${slug}#skipped`],
        ].map(([l, v, to], i) => {
          const body = (
            <>
              <Localized value={l} className="text-xs text-slate-500 dark:text-slate-400" />
              <span className="block text-lg font-extrabold tabular-nums text-slate-900 dark:text-white">{v}</span>
            </>
          );
          const cls = 'rounded-lg bg-slate-50 px-2.5 py-1.5 dark:bg-slate-800/60';
          return to && v > 0 ? (
            <Link key={i} to={to} className={`${cls} hover:bg-indigo-50 hover:ring-1 hover:ring-indigo-200 dark:hover:bg-indigo-500/10 dark:hover:ring-indigo-500/30`}>
              {body}
            </Link>
          ) : (
            <div key={i} className={cls}>{body}</div>
          );
        })}
      </div>
      {s.month.deltaPts != null && <Localized value={AN.improvement(s.month.deltaPts)} as="p" className={`mt-3 text-sm font-semibold ${s.month.deltaPts >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`} />}
      <Link to={`/analysis/${slug}`} className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
        <Localized value={AN.open(AN.subjects[s.subject])} /> →
      </Link>
    </li>
  );
}

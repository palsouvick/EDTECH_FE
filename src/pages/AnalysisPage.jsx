import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';
import { useDataSource } from '../app/DataSourceContext';
import { loginPath } from '../components/auth/AccountButton';
import PageShell from '../components/navigation/PageShell';
import { Localized } from '../components/topic-hub/Localized';
import { useLanguagePreference } from '../hooks/useLanguagePreference';
import { BandBadge, card, FirstPlanStep, MasteryBars, Meter, WeeklyTrend, WhyList } from '../components/analysis/AnalysisParts';
import { AN, formatDuration } from '../lib/analysisCopy';
import { subjectSlugFromCode } from '../lib/routes';
import { CardGridSkeleton, LoadError } from './funnel/FunnelLayout';

const DAY_MS = 86400_000;
const dateOf = (d) => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
const dateOfYear = (d) => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

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
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
          <span aria-hidden="true">🧭 </span>
          <Localized value={AN.title} />
        </h1>
        <Localized value={AN.sub} as="p" className="mt-1 max-w-3xl text-sm leading-relaxed text-slate-600 dark:text-slate-300" />
      </header>

      {state.status === 'loading' && <div className="mt-6"><CardGridSkeleton count={2} height="h-48" /></div>}
      {state.status === 'error' && <div className="mt-6"><LoadError error={state.error} onRetry={() => setAttempt((n) => n + 1)} /></div>}
      {d && (
        <div className="mt-6 space-y-6">
          <ExamStrip plan={d.plan} subjects={d.subjects} />
          <Trends subjects={d.subjects} streakDays={d.streakDays} />
          <MasterySection subjects={d.subjects} />

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
                    {c.weakestSkill && (
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        <Localized value={AN.weakestSkill(c.weakestSkill.name, c.weakestSkill.accuracy)} />
                      </p>
                    )}
                    <FirstPlanStep subject={c.subject} topic={c.topic} plan={c.plan} />
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <AllChapters subjects={d.subjects} />
          <Localized value={AN.loop} as="p" className="text-center text-sm text-slate-500 dark:text-slate-400" />
        </div>
      )}
    </PageShell>
  );
}

/** The target exam and how far along the student is towards it. */
function ExamStrip({ plan, subjects }) {
  const examDate = plan?.examDate ? new Date(`${plan.examDate}T00:00:00`) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysLeft = examDate ? Math.round((examDate.getTime() - today.getTime()) / DAY_MS) : null;
  return (
    <section aria-labelledby="exam" className={`${card} ring-indigo-200 dark:ring-indigo-500/30`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="exam" className="text-lg font-bold text-slate-900 dark:text-white"><Localized value={AN.examTitle} /></h2>
        <p className="text-sm font-semibold text-slate-900 dark:text-white">
          <Localized value={AN.examName} />
          {examDate ? (
            <>
              {' · '}<Localized value={AN.examOn(dateOfYear(examDate))} />
              {daysLeft != null && daysLeft >= 0 && (
                <> · <Localized value={AN.daysLeft(daysLeft)} /></>
              )}
            </>
          ) : (
            <>
              {' · '}<Localized value={AN.noExamDate} />{' '}
              <Link to="/plan" className="font-semibold text-indigo-700 hover:underline dark:text-indigo-300">
                <Localized value={AN.setExamDate} /> →
              </Link>
            </>
          )}
        </p>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {subjects.map((s) => (
          <div key={s.subject} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              <span aria-hidden="true">{AN.subjectIcon[s.subject]} </span>
              <Localized value={AN.subjects[s.subject]} />
            </p>
            <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
              <Localized value={AN.coverage} />: <strong className="tabular-nums">{s.summary.syllabusMasteryPct ?? 0}%</strong>
              {' · '}
              <Localized value={AN.pyqDone} />: <strong className="tabular-nums">{s.summary.pyqSolved ?? 0}/{s.summary.pyqTotal ?? 0}</strong>
            </p>
            <PaceLine sum={s.summary} />
          </div>
        ))}
      </div>
    </section>
  );
}

function PaceLine({ sum }) {
  if ((sum.remainingQuestions ?? 0) === 0) {
    return <Localized value={AN.paceDone} as="p" className="mt-1 text-sm text-slate-600 dark:text-slate-300" />;
  }
  if (sum.paceDays == null) {
    return <Localized value={AN.paceNoData} as="p" className="mt-1 text-sm text-slate-600 dark:text-slate-300" />;
  }
  const date = dateOf(new Date(Date.now() + sum.paceDays * DAY_MS));
  return <Localized value={AN.pace(sum.answersPerDay, sum.remainingQuestions, sum.paceDays, date)} as="p" className="mt-1 text-sm text-slate-600 dark:text-slate-300" />;
}

/** Weekly accuracy, the streak, and the last 7 days — one card per subject. */
function Trends({ subjects, streakDays }) {
  return (
    <section aria-labelledby="trends">
      <h2 id="trends" className="text-xl font-bold text-slate-900 dark:text-white"><Localized value={AN.trendsTitle} /></h2>
      <Localized value={AN.trendsSub} as="p" className="text-sm text-slate-600 dark:text-slate-300" />
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        {subjects.map((s) => <TrendCard key={s.subject} s={s} streakDays={streakDays} />)}
      </div>
    </section>
  );
}

function TrendCard({ s, streakDays }) {
  const sum = s.summary;
  const t = s.trend ?? {};
  const weeks = t.weeks ?? [];
  const hasWeeks = weeks.some((w) => w.answered > 0);
  return (
    <div className={card}>
      <p className="font-bold text-slate-900 dark:text-white">
        <span aria-hidden="true">{AN.subjectIcon[s.subject]} </span>
        <Localized value={AN.subjects[s.subject]} />
      </p>
      {hasWeeks ? (
        <div className="mt-3"><WeeklyTrend weeks={weeks} /></div>
      ) : (
        <Localized value={AN.notEnough} as="p" className="mt-3 text-sm text-slate-500 dark:text-slate-400" />
      )}
      {t.recentDelta != null ? (
        <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
          <span aria-hidden="true">{t.direction === 'up' ? '↗ ' : t.direction === 'down' ? '↘ ' : '→ '}</span>
          <Localized value={AN.trendDelta(t.recentDelta)} />
        </p>
      ) : (
        <Localized value={AN.notEnough} as="p" className="mt-2 text-sm text-slate-500 dark:text-slate-400" />
      )}
      <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
        <div className="rounded-lg bg-slate-50 px-2.5 py-1.5 dark:bg-slate-800/60">
          <dt><Localized value={AN.streak} className="text-xs text-slate-500 dark:text-slate-400" /></dt>
          <dd className="text-lg font-extrabold tabular-nums text-slate-900 dark:text-white">🔥 {streakDays ?? '—'}</dd>
        </div>
        <div className="rounded-lg bg-slate-50 px-2.5 py-1.5 dark:bg-slate-800/60">
          <dt><Localized value={AN.weekMinutes} className="text-xs text-slate-500 dark:text-slate-400" /></dt>
          <dd className="text-lg font-extrabold tabular-nums text-slate-900 dark:text-white">{sum.weekMinutes != null ? formatDuration(sum.weekMinutes * 60) : '—'}</dd>
        </div>
        <div className="rounded-lg bg-slate-50 px-2.5 py-1.5 dark:bg-slate-800/60">
          <dt><Localized value={AN.weekActiveDays} className="text-xs text-slate-500 dark:text-slate-400" /></dt>
          <dd className="text-lg font-extrabold tabular-nums text-slate-900 dark:text-white">{sum.weekActiveDays != null ? `${sum.weekActiveDays}/7` : '—'}</dd>
        </div>
      </dl>
    </div>
  );
}

/** Mastery bars, weakest first — the chapters that need the student most. */
function MasterySection({ subjects }) {
  const hasBars = subjects.some((s) => (s.chapters ?? []).some((c) => c.started && c.mastery != null));
  if (!hasBars) return null;
  return (
    <section aria-labelledby="mastery-bars" className={card}>
      <h2 id="mastery-bars" className="text-lg font-bold text-slate-900 dark:text-white"><Localized value={AN.masteryBars} /></h2>
      <Localized value={AN.masteryBarsSub} as="p" className="text-sm text-slate-600 dark:text-slate-300" />
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        {subjects.map((s) => (
          <div key={s.subject}>
            <p className="text-sm font-bold text-slate-900 dark:text-white">
              <span aria-hidden="true">{AN.subjectIcon[s.subject]} </span>
              <Localized value={AN.subjects[s.subject]} />
            </p>
            <div className="mt-2"><MasteryBars chapters={s.chapters} limit={5} /></div>
          </div>
        ))}
      </div>
      <a href="#all-chapters" className="mt-3 inline-block text-sm font-semibold text-indigo-700 hover:underline dark:text-indigo-300">
        <Localized value={AN.seeAllChapters} /> ↓
      </a>
    </section>
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

/** Every chapter, weakest first — collapsible per subject. */
function AllChapters({ subjects }) {
  return (
    <section aria-labelledby="all-chapters" id="all-chapters">
      <h2 id="all-chapters" className="text-xl font-bold text-slate-900 dark:text-white"><Localized value={AN.allChapters} /></h2>
      <Localized value={AN.allChaptersSub} as="p" className="text-sm text-slate-600 dark:text-slate-300" />
      <div className="mt-3 space-y-4">
        {subjects.map((s) => <SubjectChapters key={s.subject} s={s} />)}
      </div>
    </section>
  );
}

function SubjectChapters({ s }) {
  const slug = subjectSlugFromCode(s.subject);
  const sum = s.summary;
  const chapters = [...(s.chapters ?? [])].sort((a, b) => (a.band === 'not_started') - (b.band === 'not_started') || b.score - a.score);
  return (
    <details className={card} open>
      <summary className="cursor-pointer text-lg font-bold text-slate-900 dark:text-white">
        <span aria-hidden="true">{AN.subjectIcon[s.subject]} </span>
        <Localized value={AN.subjects[s.subject]} /> — <Localized value={AN.chaptersStarted(sum.started, sum.chapters)} />
      </summary>
      <ul className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
        {chapters.map((c) => (
          <li key={c.topic} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-sm">
            <Link to={`/analysis/${slug}#chapters`} className="font-semibold text-slate-900 hover:text-indigo-700 dark:text-white dark:hover:text-indigo-300">
              {c.emoji ? <span aria-hidden="true">{c.emoji} </span> : null}<Localized value={c.title} />
            </Link>
            <BandBadge band={c.band} score={c.score} />
            <span className="ml-auto tabular-nums text-slate-600 dark:text-slate-300">
              <Localized value={AN.mastery} /> {c.mastery == null ? '—' : `${c.mastery}%`} · <Localized value={AN.accuracy} /> {c.accuracy == null ? '—' : `${c.accuracy}%`}
            </span>
            {c.weakestSkill && (
              <span className="w-full text-xs text-slate-500 dark:text-slate-400">
                <Localized value={AN.weakestSkill(c.weakestSkill.name, c.weakestSkill.accuracy)} />
              </span>
            )}
          </li>
        ))}
      </ul>
    </details>
  );
}

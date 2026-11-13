import { useEffect, useState } from 'react';
import { useOptionalAuth } from '../../app/AuthContext';
import { useOptionalDataSource } from '../../app/DataSourceContext';
import { Link } from 'react-router-dom';
import { Localized } from '../topic-hub/Localized';
import { useStartCustomTest } from '../custom-test/useStartCustomTest';
import { AN } from '../../lib/analysisCopy';
import { learnPaths } from '../../lib/routes';
import { useLanguagePreference } from '../../hooks/useLanguagePreference';

/** Plain text of a localized value in the student's language (for <option>, aria-label). */
export const textOf = (value, lang) => value?.[lang] ?? value?.en ?? '';

export const card = 'rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5 dark:bg-slate-900 dark:ring-slate-800';

/** Priority bands: colour always comes with its icon and label (never colour alone). */
export const BAND_STYLE = {
  high: 'bg-rose-50 text-rose-800 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-200 dark:ring-rose-500/30',
  medium: 'bg-amber-50 text-amber-900 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/30',
  low: 'bg-yellow-50 text-yellow-900 ring-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-200 dark:ring-yellow-500/30',
  strong: 'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/30',
  not_started: 'bg-slate-50 text-slate-600 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
};

export function BandBadge({ band, score }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${BAND_STYLE[band]}`}>
      <span aria-hidden="true">{AN.bandIcon[band]}</span>
      <Localized value={AN.band[band]} />
      {score != null && band !== 'not_started' && <span className="tabular-nums">· {score}</span>}
    </span>
  );
}

/** One measure as a thin meter with its value; null = not applicable. */
export function Meter({ label, value }) {
  const na = value == null;
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <Localized value={label} className="font-semibold text-slate-600 dark:text-slate-300" />
        <span className="font-bold tabular-nums text-slate-900 dark:text-white">{na ? <Localized value={AN.notApplicable} className="font-normal text-slate-400" /> : `${value}%`}</span>
      </div>
      <div
        className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={na ? undefined : value}
        aria-label={label.en}
      >
        {!na && <div className="h-full rounded-full bg-indigo-600 dark:bg-indigo-400" style={{ width: `${Math.max(2, value)}%` }} />}
      </div>
    </div>
  );
}

export const MEASURES = ['reading', 'practice', 'pyq', 'revision', 'accuracy', 'mastery'];

export function ProgressMeters({ progress }) {
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
      {MEASURES.map((m) => <Meter key={m} label={AN.measures[m]} value={progress[m]} />)}
    </div>
  );
}

export function WhyList({ why }) {
  if (!why?.length) return null;
  return (
    <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-200">
      {why.map((r, i) => (
        <li key={i} className="flex gap-2">
          <span aria-hidden="true" className="text-slate-400">•</span>
          <Localized value={AN.why[r.key](r)} />
        </li>
      ))}
    </ul>
  );
}

const stepLink = (subject, topic, s) => {
  if (s.kind === 'read') return learnPaths.chapter(subject, topic);
  if (s.kind === 'quiz') return learnPaths.quiz(subject, topic, s.level);
  if (s.kind === 'mistakes') return '/mistakes';
  if (s.kind === 'pyq') return `/pyq?subject=${subject}&topic=${topic}`;
  return null;
};
const stepText = (s) => (s.kind === 'quiz' ? AN.step.quiz(s) : AN.step[s.kind](s));

/** The ordered action plan: every step is a link (or the Smart Quiz button). */
export function PlanSteps({ subject, topic, plan }) {
  return (
    <div>
      <ol className="space-y-1.5">
        {plan.steps.map((s, i) => {
          const to = stepLink(subject, topic, s);
          return (
            <li key={i} className="flex items-center gap-2 text-sm">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-indigo-50 text-xs font-bold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-200">{i + 1}</span>
              {to ? (
                <Link to={to} className="font-medium text-slate-800 underline-offset-2 hover:text-indigo-700 hover:underline dark:text-slate-100 dark:hover:text-indigo-300">
                  <Localized value={stepText(s)} />
                </Link>
              ) : (
                <SmartQuizButton subject={subject} topics={[topic]} count={s.count} variant="link" label={stepText(s)} />
              )}
            </li>
          );
        })}
      </ol>
      <Localized value={AN.planTotal(plan.questions, plan.minutes)} as="p" className="mt-2 text-xs text-slate-500 dark:text-slate-400" />
    </div>
  );
}

/** Starts a Smart Quiz (custom-test preset "smart") and opens it. */
export function SmartQuizButton({ subject, topics = [], count = 15, mode = 'practice', variant = 'primary', label = AN.start }) {
  const start = useStartCustomTest();
  const { lang } = useLanguagePreference();
  const [state, setState] = useState('idle');
  const go = async () => {
    setState('busy');
    try {
      await start({ subject, preset: 'smart', topics, questionCount: count, mode, language: lang });
    } catch {
      setState('error');
    }
  };
  const cls =
    variant === 'link'
      ? 'text-left font-medium text-indigo-700 underline-offset-2 hover:underline disabled:opacity-60 dark:text-indigo-300'
      : 'min-h-11 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-60';
  return (
    <span className="inline-flex flex-col">
      <button type="button" onClick={go} disabled={state === 'busy'} aria-busy={state === 'busy'} className={cls}>
        <Localized value={state === 'busy' ? AN.starting : label} />
      </button>
      {state === 'error' && <Localized value={AN.failed} as="span" role="alert" className="mt-1 text-xs text-rose-600 dark:text-rose-400" />}
    </span>
  );
}

/** "Your next Smart Quiz": what the latest test showed, the plan per chapter, and a start button. */
export function NextSmartQuizCard({ subject, quiz, compact = false }) {
  const [count, setCount] = useState(15);
  const [mode, setMode] = useState('practice');
  if (!quiz) return null;
  const b = quiz.basedOn;
  return (
    <section aria-labelledby={`smart-${subject}`} className={`${card} ring-indigo-200 dark:ring-indigo-500/30`}>
      <h2 id={`smart-${subject}`} className="text-lg font-bold text-slate-900 dark:text-white">
        <Localized value={compact ? AN.nextSmartQuiz : AN.smartTitle} />
      </h2>
      {!compact && <Localized value={AN.smartSub} as="p" className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300" />}
      {(b?.wrong?.length > 0 || b?.skipped?.length > 0 || quiz.weakestSkill) && (
        <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
          {b && <Localized value={AN.basedOnTest} as="p" className="mb-1 text-xs font-bold uppercase tracking-wide text-slate-500" />}
          <ul className="space-y-0.5">
            {b?.wrong?.slice(0, 2).map((w) => <li key={`w${w.topic}`}><Localized value={AN.gotWrong(w.count, w.title)} /></li>)}
            {b?.skipped?.slice(0, 2).map((w) => <li key={`s${w.topic}`}><Localized value={AN.skippedN(w.count, w.title)} /></li>)}
            {quiz.weakestSkill && <li><Localized value={AN.weakestSkillIs(quiz.weakestSkill.name)} /></li>}
          </ul>
        </div>
      )}
      {quiz.plan.length > 0 && (
        <>
          <Localized value={AN.therefore(quiz.count)} as="p" className="mt-3 font-bold text-slate-900 dark:text-white" />
          <ul className="mt-1 space-y-0.5 text-sm text-slate-700 dark:text-slate-200">
            {quiz.plan.map((p) => (
              <li key={p.topic} className="flex flex-wrap gap-x-1.5">
                <span className="w-6 text-right font-bold tabular-nums">{p.count}</span>
                <Localized value={p.title} className="font-medium" />
                {p.skill && <span className="text-slate-500 dark:text-slate-400">(<Localized value={p.skill} />)</span>}
                {p.role === 'retention' && <span className="text-emerald-700 dark:text-emerald-300">· <Localized value={AN.retention} /></span>}
              </li>
            ))}
          </ul>
        </>
      )}
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="text-sm">
          <Localized value={AN.size} className="mb-1 block text-xs font-semibold text-slate-600 dark:text-slate-300" />
          <select value={count} onChange={(e) => setCount(Number(e.target.value))} className="min-h-11 rounded-lg bg-white px-2 ring-1 ring-slate-300 dark:bg-slate-900 dark:ring-slate-700">
            {[10, 15, 20, 30].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <fieldset className="text-sm">
          <legend className="sr-only"><Localized value={AN.size} /></legend>
          {['practice', 'exam'].map((m) => (
            <label key={m} className="mr-3 inline-flex min-h-11 items-center gap-1.5">
              <input type="radio" name={`mode-${subject}`} value={m} checked={mode === m} onChange={() => setMode(m)} />
              <Localized value={AN.mode[m]} />
            </label>
          ))}
        </fieldset>
        <SmartQuizButton subject={subject} count={count} mode={mode} />
      </div>
    </section>
  );
}

/**
 * Weekly accuracy bars (one series, so no legend: the heading names it). Each bar has a hover
 * title, and a screen-reader table lists every week.
 */
export function WeeklyTrend({ weeks }) {
  return (
    <figure>
      <div className="flex h-32 items-end gap-1.5 border-b border-slate-200 dark:border-slate-700" aria-hidden="true">
        {weeks.map((w) => (
          <div key={w.week} className="group relative flex h-full flex-1 flex-col justify-end" title={`${w.week}: ${w.accuracyPct == null ? '—' : `${w.accuracyPct}%`} (${w.answered})`}>
            {w.accuracyPct != null ? (
              <>
                <span className="mb-0.5 text-center text-[11px] font-semibold tabular-nums text-slate-600 dark:text-slate-300">{w.accuracyPct}</span>
                <div className="rounded-t bg-indigo-600 group-hover:bg-indigo-500 dark:bg-indigo-400" style={{ height: `${Math.max(3, w.accuracyPct)}%` }} />
              </>
            ) : (
              <div className="h-px" />
            )}
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-1.5 text-[10px] text-slate-500 dark:text-slate-400" aria-hidden="true">
        {weeks.map((w) => <span key={w.week} className="flex-1 truncate text-center">{w.week.slice(5)}</span>)}
      </div>
      <table className="sr-only">
        <tbody>
          {weeks.map((w) => (
            <tr key={w.week}>
              <th scope="row">{w.week}</th>
              <td>{w.accuracyPct == null ? '—' : `${w.accuracyPct}%`}</td>
              <td>{w.answered}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

export function Stat({ label, value, sub }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
      <Localized value={label} className="block text-xs font-semibold text-slate-500 dark:text-slate-400" />
      <span className="mt-0.5 block text-2xl font-extrabold tabular-nums text-slate-900 dark:text-white">{value ?? '—'}</span>
      {sub && <Localized value={sub} className="block text-xs text-slate-500 dark:text-slate-400" />}
    </div>
  );
}

/**
 * "Your next Smart Quiz" after a test or quiz (signed-in, Mathematics / English only): reads the
 * learning analysis, which already includes the test just submitted. Renders nothing otherwise.
 */
export function NextSmartQuizAfterTest({ subject, source: given }) {
  const auth = useOptionalAuth();
  const context = useOptionalDataSource();
  const source = given ?? context;
  const { lang } = useLanguagePreference();
  const [quiz, setQuiz] = useState(null);
  const enabled = Boolean(auth?.user) && ['quant', 'english'].includes(subject) && typeof source?.getLearningAnalysis === 'function';
  useEffect(() => {
    if (!enabled) return undefined;
    let alive = true;
    source.getLearningAnalysis(subject, lang).then(
      (d) => alive && setQuiz(d.nextSmartQuiz),
      () => {},
    );
    return () => {
      alive = false;
    };
  }, [enabled, source, subject, lang]);
  if (!enabled || !quiz?.plan?.length) return null;
  return (
    <div>
      <NextSmartQuizCard subject={subject} quiz={quiz} compact />
      <Link to={`/analysis/${subject === 'quant' ? 'math' : 'english'}`} className="mt-2 inline-block text-sm font-semibold text-indigo-700 hover:underline dark:text-indigo-300">
        🧭 <Localized value={AN.openShort} /> →
      </Link>
    </div>
  );
}

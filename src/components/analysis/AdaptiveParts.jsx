import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Localized } from '../topic-hub/Localized';
import { useLanguagePreference } from '../../hooks/useLanguagePreference';
import { useStartCustomTest } from '../custom-test/useStartCustomTest';
import { AD, LEVEL, PRACTICE_TYPE, STATUS, levelOf } from '../../lib/adaptiveCopy';
import { AN, formatDuration } from '../../lib/analysisCopy';
import { learnPaths } from '../../lib/routes';
import { card } from './AnalysisParts';

const chip = 'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1';

/** Skill Map status: icon + word, so it never relies on colour alone. */
export function StatusBadge({ status }) {
  const s = STATUS[status] ?? STATUS.insufficient;
  return (
    <span className={`${chip} ${s.tone}`}>
      <span aria-hidden="true">{s.icon}</span>
      <Localized value={s.label} />
    </span>
  );
}

/** "Next: Hard" — the level of this chapter's next practice. */
export function LevelBadge({ level }) {
  const key = levelOf(level);
  if (!key) return null;
  return (
    <span className={`${chip} bg-slate-50 text-slate-800 ring-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-700`}>
      <Localized value={AD.nextLevel} />: <Localized value={LEVEL[key]} className="font-bold" />
    </span>
  );
}

/** Which kind of practice a question is (adaptive sessions label every question). */
export function PracticeTypeChip({ type }) {
  const p = PRACTICE_TYPE[type];
  if (!p) return null;
  return <span className={`${chip} ${p.tone}`}><Localized value={p.label} /></span>;
}

/** Starts adaptive practice (custom-test preset "adaptive"): every chapter at its own level. */
export function AdaptivePracticeButton({ subject, topics = [], count = 5, label = AD.startPractice, variant = 'primary', className = '' }) {
  const start = useStartCustomTest();
  const { lang } = useLanguagePreference();
  const [state, setState] = useState('idle');
  const go = async () => {
    setState('busy');
    try {
      await start({ subject, preset: 'adaptive', topics, questionCount: count, mode: 'practice', language: lang });
    } catch {
      setState('error');
    }
  };
  const cls = variant === 'secondary'
    ? 'min-h-11 rounded-xl px-4 text-sm font-semibold text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-50 dark:text-indigo-300 dark:ring-indigo-500/40 dark:hover:bg-indigo-500/10'
    : 'min-h-11 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500';
  return (
    <span className={`inline-flex flex-col ${className}`}>
      <button type="button" onClick={go} disabled={state === 'busy'} aria-busy={state === 'busy'} className={`${cls} disabled:opacity-60`}>
        <Localized value={state === 'busy' ? AD.starting : label} />
      </button>
      {state === 'error' && <Localized value={AD.failed} as="span" role="alert" className="mt-1 text-xs text-rose-600 dark:text-rose-400" />}
    </span>
  );
}

/** ▶ Continue Studying: the one best next step, chosen by the server (learn → revision → practice). */
export function ContinueStudying({ step }) {
  const big = 'inline-flex min-h-12 items-center rounded-2xl bg-indigo-600 px-6 text-base font-bold text-white shadow-md hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500';
  let why = AD.continueNothing;
  let action = null;
  if (step?.kind === 'learn') {
    why = AD.continueWhy.learn(step.title);
    action = <Link to={learnPaths.chapter(step.subject, step.topic)} className={big}><Localized value={AD.continueCta} /></Link>;
  } else if (step?.kind === 'revision') {
    why = AD.continueWhy.revision(step.count);
    action = <Link to="/revision" className={big}><Localized value={AD.continueCta} /></Link>;
  } else if (step?.kind === 'practice') {
    why = AD.continueWhy.practice(step.title, step.practice === 'review_concept' ? 'basic' : step.level);
    action = <AdaptivePracticeButton subject={step.subject} topics={[step.topic]} count={5} label={AD.continueCta} className="[&>button]:min-h-12 [&>button]:rounded-2xl [&>button]:px-6 [&>button]:text-base [&>button]:font-bold" />;
  }
  return (
    <section aria-labelledby="continue" className={`${card} flex flex-col gap-3 bg-gradient-to-br from-indigo-50 to-white ring-indigo-200 sm:flex-row sm:items-center sm:justify-between dark:from-indigo-500/10 dark:to-slate-900 dark:ring-indigo-500/30`}>
      <div className="min-w-0">
        <h2 id="continue" className="text-lg font-bold text-slate-900 dark:text-white"><Localized value={AD.continueTitle} /></h2>
        <Localized value={why} as="p" className="mt-0.5 text-sm text-slate-700 dark:text-slate-200" />
      </div>
      {action}
    </section>
  );
}

/** 📊 Four compact numbers: overall progress, PYQs, streak, this week. */
export function StatusCards({ subjects, streakDays }) {
  const progress = subjects.length ? Math.round(subjects.reduce((a, s) => a + (s.summary.syllabusMasteryPct ?? 0), 0) / subjects.length) : 0;
  const solved = subjects.reduce((a, s) => a + (s.summary.pyqSolved ?? 0), 0);
  const total = subjects.reduce((a, s) => a + (s.summary.pyqTotal ?? 0), 0);
  const minutes = subjects.reduce((a, s) => a + (s.summary.weekMinutes ?? 0), 0);
  const items = [
    [AD.overall, `${progress}%`],
    [AD.pyq, `${solved}/${total}`],
    [AD.streak, AD.days(streakDays ?? 0)],
    [AD.thisWeek, minutes ? formatDuration(minutes * 60) : '—'],
  ];
  return (
    <section aria-labelledby="status">
      <h2 id="status" className="text-lg font-bold text-slate-900 dark:text-white"><span aria-hidden="true">📊 </span><Localized value={AD.statusTitle} /></h2>
      <dl className="mt-2 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {items.map(([label, value]) => (
          <div key={label.en} className={`${card} !p-3 sm:!p-4`}>
            <dt><Localized value={label} className="text-xs font-semibold text-slate-500 dark:text-slate-400" /></dt>
            <dd className="mt-0.5 text-2xl font-extrabold tabular-nums text-slate-900 dark:text-white">{typeof value === 'string' ? value : <Localized value={value} />}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** The concept message with [Review concept] → lesson and [Try again] → basic practice of that chapter. */
function ConceptReview({ subject, topic, concept }) {
  return (
    <div className="mt-2 rounded-xl bg-rose-50 p-3 text-sm text-rose-950 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-100 dark:ring-rose-500/30">
      <Localized value={AD.conceptMsg(concept.name, concept.wrong)} as="p" />
      <div className="mt-2 flex flex-wrap gap-2">
        <Link to={learnPaths.chapter(subject, topic)} className="inline-flex min-h-10 items-center rounded-lg bg-white px-3 font-semibold text-rose-800 ring-1 ring-rose-200 hover:bg-rose-100 dark:bg-slate-900 dark:text-rose-200 dark:ring-rose-500/40">
          📖 <Localized value={AD.reviewConcept} className="ml-1" />
        </Link>
        <AdaptivePracticeButton subject={subject} topics={[topic]} count={5} label={AD.tryAgain} variant="secondary" />
      </div>
    </div>
  );
}

/** এখন কী করব? — the top 3 actions, each with mastery, level, reason and a start button. */
export function NextActions({ actions }) {
  return (
    <section aria-labelledby="now" className={card}>
      <h2 id="now" className="text-xl font-bold text-slate-900 dark:text-white"><Localized value={AD.nowTitle} /></h2>
      <Localized value={AD.nowSub} as="p" className="text-sm text-slate-600 dark:text-slate-300" />
      {!actions?.length && <Localized value={AD.nowEmpty} as="p" className="mt-3 text-slate-700 dark:text-slate-200" />}
      <ol className="mt-3 grid gap-3 lg:grid-cols-3">
        {(actions ?? []).map((a, i) => (
          <li key={`${a.subject}.${a.topic}`} className="flex flex-col rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200 dark:bg-slate-800/60 dark:ring-slate-700">
            <div className="flex items-start gap-2">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-indigo-600 text-sm font-bold text-white">{i + 1}</span>
              <div className="min-w-0">
                <p className="font-bold text-slate-900 dark:text-white">
                  <span aria-hidden="true">{STATUS[a.status]?.icon} </span>
                  <Localized value={a.title} />
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400"><Localized value={AN.subjects[a.subject]} />{a.priority && <> · <Localized value={AD.examPriority[a.priority]} /></>}</p>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <StatusBadge status={a.status} />
              {a.mastery != null && <span className="text-sm font-semibold tabular-nums text-slate-700 dark:text-slate-200"><Localized value={AN.mastery} /> {a.mastery}%</span>}
            </div>
            <Localized value={AD.doN(5, a.kind)} as="p" className="mt-2 text-sm font-semibold text-indigo-800 dark:text-indigo-300" />
            {a.level?.thin && a.level.next && <Localized value={AD.thinLevel(a.level.next)} as="p" className="mt-1 text-xs text-slate-500 dark:text-slate-400" />}
            {a.level?.concept ? (
              <ConceptReview subject={a.subject} topic={a.topic} concept={a.level.concept} />
            ) : a.kind === 'revise' ? (
              <Link to="/revision" className="mt-3 inline-flex min-h-11 w-fit items-center rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-500"><Localized value={AD.startPractice} /></Link>
            ) : (
              <AdaptivePracticeButton subject={a.subject} topics={[a.topic]} count={5} className="mt-3 w-fit" />
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}

/** "Strong 3 · Developing 5 · Needs practice 4" under a subject card, with a link to the Skill Map. */
export function SkillCounts({ map }) {
  if (!map) return null;
  return (
    <p className="mt-3 text-sm text-slate-700 dark:text-slate-200">
      <Localized value={AD.skillCounts(map.counts)} />
      {' · '}
      <a href="#skill-map" className="font-semibold text-indigo-700 hover:underline dark:text-indigo-300"><Localized value={AD.seeSkillMap} /> ↓</a>
    </p>
  );
}

/** আমার দক্ষতার মানচিত্র: per subject, chapters by status with mastery and the next practice level. */
export function SkillMap({ subjects }) {
  const order = ['strong', 'developing', 'weak', 'insufficient'];
  return (
    <section aria-labelledby="skill-map-h" id="skill-map" className="scroll-mt-24">
      <h2 id="skill-map-h" className="text-xl font-bold text-slate-900 dark:text-white"><span aria-hidden="true">🗺️ </span><Localized value={AD.skillTitle} /></h2>
      <Localized value={AD.skillSub} as="p" className="text-sm text-slate-600 dark:text-slate-300" />
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        {subjects.map((s) => (
          <div key={s.subject} className={card}>
            <p className="font-bold text-slate-900 dark:text-white"><span aria-hidden="true">{AN.subjectIcon[s.subject]} </span><Localized value={AN.subjects[s.subject]} /></p>
            {order.map((k) => {
              const list = s.skillMap?.groups?.[k] ?? [];
              if (!list.length && k === 'insufficient') return null;
              return (
                <div key={k} className="mt-3">
                  <StatusBadge status={k} />
                  {!list.length ? (
                    <Localized value={AD.emptyGroup} as="p" className="mt-1 text-xs text-slate-500 dark:text-slate-400" />
                  ) : (
                    <ul className="mt-1.5 space-y-1.5">
                      {list.map((c) => (
                        <li key={c.topic} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                          <Localized value={c.title} className="font-semibold text-slate-900 dark:text-white" />
                          <span className="tabular-nums text-slate-600 dark:text-slate-300">{c.mastery != null ? `${c.mastery}%` : <Localized value={AD.answeredN(c.answers)} />}</span>
                          <LevelBadge level={c.level} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
            {s.skillMap?.notStarted > 0 && <Localized value={AD.notStarted(s.skillMap.notStarted)} as="p" className="mt-3 text-xs text-slate-500 dark:text-slate-400" />}
          </div>
        ))}
      </div>
    </section>
  );
}

/** গত ৭ দিনে কী পরিবর্তন হয়েছে? — under the weekly chart. */
export function WeekChange({ week, subjects }) {
  if (!week) return null;
  const lines = [];
  for (const s of subjects) {
    const w = week.bySubject?.[s.subject];
    if (w?.accuracyDelta != null && w.accuracyDelta !== 0) lines.push(AD.accuracyDelta(AN.subjects[s.subject], w.accuracyDelta));
  }
  if (week.answers) lines.push(AD.answered(week.answers));
  if (week.improved) lines.push(AD.improved(week.improved));
  if (week.wrongDelta != null && week.wrongDelta !== 0) lines.push(AD.wrongDelta(week.wrongDelta));
  if (week.revisionDue) lines.push(AD.revisionDue(week.revisionDue));
  return (
    <section aria-labelledby="week-change" className={card}>
      <h2 id="week-change" className="text-lg font-bold text-slate-900 dark:text-white"><Localized value={AD.weekTitle} /></h2>
      {lines.length ? (
        <ul className="mt-2 grid gap-1.5 text-sm font-medium text-slate-800 sm:grid-cols-2 dark:text-slate-100">
          {lines.map((l) => <li key={l.en}><Localized value={l} /></li>)}
        </ul>
      ) : (
        <Localized value={AD.weekQuiet} as="p" className="mt-2 text-sm text-slate-500 dark:text-slate-400" />
      )}
    </section>
  );
}

/** Insight cards — each one from the student's own answers. */
export function Insights({ items }) {
  if (!items?.length) return null;
  const tone = {
    progress: 'ring-emerald-200 dark:ring-emerald-500/30',
    attention: 'ring-amber-200 dark:ring-amber-500/30',
    challenge: 'ring-indigo-200 dark:ring-indigo-500/30',
    review: 'ring-rose-200 dark:ring-rose-500/30',
  };
  return (
    <section aria-labelledby="insights">
      <h2 id="insights" className="text-lg font-bold text-slate-900 dark:text-white"><Localized value={AD.insightsTitle} /></h2>
      <ul className="mt-2 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((i) => {
          const c = AD.insight[i.kind]?.(i);
          if (!c) return null;
          return (
            <li key={`${i.kind}.${i.topic}`} className={`${card} !p-3 sm:!p-4 ${tone[i.kind]}`}>
              <p className="font-bold text-slate-900 dark:text-white"><span aria-hidden="true">{c.icon} </span><Localized value={c.title} /></p>
              <Localized value={c.body} as="p" className="mt-1 text-sm text-slate-700 dark:text-slate-200" />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

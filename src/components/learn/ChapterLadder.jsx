import { Link } from 'react-router-dom';
import { LADDER_COPY } from '../../lib/ladderCopy';
import { chapterFacts, ladderFor, LADDER } from '../../lib/ladder';
import { learnPaths } from '../../lib/routes';
import { Localized } from '../topic-hub/Localized';

const QUIZ_FOR = { easy: 'beginner', competitive: 'intermediate', advanced: 'advanced' };
const TONE = {
  done: 'bg-emerald-50 ring-emerald-200 dark:bg-emerald-500/10 dark:ring-emerald-500/30',
  open: 'bg-indigo-50 ring-indigo-300 dark:bg-indigo-500/10 dark:ring-indigo-500/40',
  locked: 'bg-white ring-slate-200 opacity-80 dark:bg-slate-900 dark:ring-slate-800',
  none: 'bg-slate-50 ring-slate-200 dark:bg-slate-800/50 dark:ring-slate-800',
};

/**
 * The six-level ladder for one chapter. Built from the student's existing progress
 * (lesson, quiz best scores, mastery, past-paper answers); every level stays reachable.
 *
 * @param {{ subject: string, topic: string, status: ReturnType<import('./useLearnStatus').useLearnStatus>, onMode: (mode: string) => void }} props
 */
export default function ChapterLadder({ subject, topic, status, onMode }) {
  const facts = chapterFacts(subject, topic, { mastery: status.mastery[topic], pyq: status.signedIn ? status.pyq[topic] ?? { total: 0, attempted: 0, solved: 0 } : null });
  const { steps } = ladderFor(facts);
  const pyqLink = `/pyq?${new URLSearchParams({ subject, topic })}`;

  // The level's action, as a link or a mode switch, in the given style.
  const action = (key) => {
    const label = <Localized value={LADDER_COPY.steps[key].action} />;
    if (QUIZ_FOR[key]) return (style) => <Link to={learnPaths.quiz(subject, topic, QUIZ_FOR[key])} className={style}>{label}</Link>;
    if (key === 'pyq') return (style) => <Link to={pyqLink} className={style}>{label}</Link>;
    const mode = key === 'beginner' ? 'detailed' : 'exam';
    return (style) => <button type="button" onClick={() => onMode(mode)} className={style}>{label}</button>;
  };

  return (
    <section aria-labelledby="ladder-title" className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5 dark:bg-slate-900 dark:ring-slate-800">
      <h2 id="ladder-title" className="text-lg font-bold text-slate-900 dark:text-white"><Localized value={LADDER_COPY.title} /></h2>
      <Localized value={LADDER_COPY.sub} as="p" className="mt-0.5 text-sm text-slate-600 dark:text-slate-300" />
      <ol className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((s, i) => {
          const meta = LADDER_COPY.steps[s.key];
          const quiz = QUIZ_FOR[s.key];
          const best = quiz && facts.best[quiz];
          const render = action(s.key);
          const cls = 'mt-2 inline-flex min-h-9 items-center rounded-lg px-3 text-xs font-bold';
          return (
            <li key={s.key} aria-current={s.status === 'open' ? 'step' : undefined} className={`flex flex-col rounded-xl p-3 ring-1 ${TONE[s.status]}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wide text-slate-500"><Localized value={LADDER_COPY.levelN(i + 1)} /></span>
                <span className="text-xs font-bold">
                  {s.status === 'done' && <span className="text-emerald-700 dark:text-emerald-300">✓ <Localized value={LADDER_COPY.done} /></span>}
                  {s.status === 'open' && <span className="text-indigo-700 dark:text-indigo-300">➜ <Localized value={LADDER_COPY.now} /></span>}
                  {s.status === 'locked' && <span className="text-slate-500">🔒 <Localized value={LADDER_COPY.locked} /></span>}
                </span>
              </div>
              <p className="mt-1 font-bold text-slate-900 dark:text-white"><span aria-hidden="true">{meta.icon}</span> <Localized value={meta.title} /></p>
              <Localized value={s.status === 'none' ? LADDER_COPY.none : meta.what} as="p" className="mt-0.5 text-xs text-slate-600 dark:text-slate-300" />
              {best && <Localized value={LADDER_COPY.best(best.correct, best.total)} as="p" className="mt-1 text-xs font-semibold text-slate-600" />}
              {s.key === 'pyq' && facts.pyq?.total > 0 && <Localized value={LADDER_COPY.pyqCount(facts.pyq.solved, facts.pyq.attempted, facts.pyq.total)} as="p" className="mt-1 text-xs font-semibold text-slate-600" />}
              {!status.signedIn && (s.key === 'exam' || s.key === 'pyq') && <Localized value={LADDER_COPY.signInFor} as="p" className="mt-1 text-xs text-slate-500" />}
              {s.status === 'locked' && <Localized value={LADDER_COPY.unlocksAfter(LADDER.indexOf(s.key))} as="p" className="mt-1 text-xs text-slate-500" />}
              {s.status !== 'none' && (
                <div className="mt-auto">
                  {render(s.status === 'open' ? `${cls} bg-indigo-600 text-white hover:bg-indigo-500` : `${cls} text-indigo-700 ring-1 ring-slate-300 hover:bg-indigo-50 dark:text-indigo-300 dark:ring-slate-700`)}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

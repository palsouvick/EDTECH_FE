import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDataSource } from '../../app/DataSourceContext';
import { MODES } from '../../lib/ladderCopy';
import { LEARN } from '../../lib/learnCopy';
import PracticeArena from '../practice/PracticeArena';
import GkMockDialog from '../gk/GkMockDialog';
import { Localized } from '../topic-hub/Localized';

export const MODE_KEYS = ['quick', 'detailed', 'practice', 'revision', 'exam'];
const card = 'rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5 dark:bg-slate-900 dark:ring-slate-800';
// Learn practice draws on the WBPSC question pool, the exam this app prepares for first.
const CATEGORY = 'WBPSC';

/** Quick / Detailed / Practice / Revision / Exam. Detailed is the full lesson page as it was. */
export function ModeTabs({ mode, onMode }) {
  return (
    <div role="tablist" aria-label={MODES.label.en} className="flex gap-2 overflow-x-auto pb-1">
      {MODE_KEYS.map((key) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={key === mode}
          title={MODES[key].hint.en}
          onClick={() => onMode(key)}
          className={`min-h-11 shrink-0 rounded-xl px-4 text-left text-sm ring-1 ${key === mode ? 'bg-indigo-600 text-white ring-indigo-600' : 'bg-white text-slate-700 ring-slate-200 hover:bg-indigo-50 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700'}`}
        >
          <Localized value={MODES[key].title} className="block font-bold" />
          <Localized value={MODES[key].hint} className={`block text-[11px] ${key === mode ? 'text-indigo-100' : 'text-slate-500'}`} />
        </button>
      ))}
    </div>
  );
}

function Arena({ subject, topic, title, goal }) {
  const source = useDataSource();
  const practice = useMemo(() => source.practiceSource({ category: CATEGORY, subject, topic }), [source, subject, topic]);
  return <PracticeArena source={practice} topicName={title} initialGoal={goal} />;
}

function QuickMode({ lesson, subject, topic, title, renderExample }) {
  const example = lesson?.levels.find((l) => l.level === 'basic')?.examples?.[0];
  return (
    <div className="space-y-5">
      {example && (
        <section className={card}>
          <Localized value={MODES.quickExample} as="h2" className="text-lg font-bold text-slate-900 dark:text-white" />
          <ol className="mt-3">{renderExample(example)}</ol>
        </section>
      )}
      <section>
        <Localized value={MODES.quickPractice} as="h2" className="mb-3 text-lg font-bold text-slate-900 dark:text-white" />
        <Arena subject={subject} topic={topic} title={title} goal={5} />
      </section>
    </div>
  );
}

function RevisionMode({ lesson, isMath, status, subject }) {
  const mine = status.mistakes.filter((m) => m.question?.topic === status.topic);
  return (
    <div className="space-y-5">
      {lesson && (
        <section className={card}>
          <Localized value={isMath ? LEARN.formulas : MODES.rules} as="h2" className="text-lg font-bold text-slate-900 dark:text-white" />
          <ul className="mt-3 space-y-3">
            {lesson.rules.map((rule, i) => (
              <li key={i} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                <Localized value={rule.label} as="p" className="font-semibold text-slate-900 dark:text-white" />
                {rule.latex && <Localized value={{ en: `$$${rule.latex}$$` }} markdown as="div" className="mt-1 overflow-x-auto" />}
                <Localized value={rule.explain} markdown as="div" className="mt-1 text-sm text-slate-600 dark:text-slate-300" />
              </li>
            ))}
          </ul>
        </section>
      )}
      {lesson?.tips?.length > 0 && (
        <section className="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200 sm:p-5 dark:bg-amber-500/10 dark:ring-amber-500/30">
          <Localized value={MODES.tips} as="h2" className="text-lg font-bold text-amber-900 dark:text-amber-200" />
          <ul className="mt-2 list-disc space-y-1 pl-5 text-amber-950 dark:text-amber-100">
            {lesson.tips.map((tip, i) => <li key={i}><Localized value={tip} markdown /></li>)}
          </ul>
        </section>
      )}
      <section className={card}>
        <Localized value={MODES.yourMistakes} as="h2" className="text-lg font-bold text-slate-900 dark:text-white" />
        {!status.signedIn ? (
          <Localized value={MODES.signInMistakes} as="p" className="mt-1 text-sm text-slate-500" />
        ) : mine.length === 0 ? (
          <Localized value={MODES.noMistakes} as="p" className="mt-1 text-sm text-slate-500" />
        ) : (
          <ul className="mt-3 space-y-3">
            {mine.slice(0, 10).map((m) => {
              const right = m.question.options.find((o) => o.optionId === m.correctOptionId);
              return (
                <li key={m.question.questionId} className="rounded-xl p-3 ring-1 ring-slate-200 dark:ring-slate-800">
                  <Localized value={m.question.stem} markdown as="div" className="font-medium text-slate-900 dark:text-white" />
                  {right && (
                    <p className="mt-1 text-sm text-emerald-800 dark:text-emerald-300">
                      <Localized value={MODES.correctAnswer} />: <Localized value={right.text} markdown inline />
                    </p>
                  )}
                  {m.shortcut && <Localized value={m.shortcut} markdown as="p" className="mt-1 text-sm text-slate-600 dark:text-slate-300" />}
                </li>
              );
            })}
          </ul>
        )}
        <Link to={`/mistakes?subject=${subject}`} className="mt-3 inline-flex text-sm font-semibold text-indigo-700 hover:underline dark:text-indigo-300">
          <Localized value={MODES.allMistakes} /> →
        </Link>
      </section>
    </div>
  );
}

function ExamMode({ subject, topic, title }) {
  const [open, setOpen] = useState(false);
  return (
    <section className={card}>
      <Localized value={MODES.examIntro} as="p" className="text-slate-700 dark:text-slate-200" />
      <button type="button" onClick={() => setOpen(true)} className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-rose-600 px-5 text-sm font-bold text-white hover:bg-rose-500">
        ⏱️ <Localized value={MODES.startExam} className="ml-2" />
      </button>
      {open && <GkMockDialog open onClose={() => setOpen(false)} category={CATEGORY} subject={subject} topics={[topic]} name={title} topicNames={{ [topic]: title }} />}
    </section>
  );
}

/**
 * The selected study mode's panel (everything but Detailed, which is the chapter page itself).
 * @param {{ mode: string, lesson: object|null, isMath: boolean, subject: string, topic: string, title: {en,bn}, status: object, renderExample: (example) => React.ReactNode }} props
 */
export default function ModePanel({ mode, lesson, isMath, subject, topic, title, status, renderExample }) {
  if (mode === 'quick') return <QuickMode lesson={lesson} subject={subject} topic={topic} title={title} renderExample={renderExample} />;
  if (mode === 'practice') return <Arena subject={subject} topic={topic} title={title} />;
  if (mode === 'revision') return <RevisionMode lesson={lesson} isMath={isMath} status={{ ...status, topic }} subject={subject} />;
  if (mode === 'exam') return <ExamMode subject={subject} topic={topic} title={title} />;
  return null;
}

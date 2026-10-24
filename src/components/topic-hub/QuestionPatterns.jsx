import { useEffect, useRef, useState } from 'react';
import { useInView } from '../../hooks/useInView';
import { usePersistentState } from '../../hooks/usePersistentState';
import { PATTERNS } from '../../lib/patternsCopy';
import OptionButton from '../practice/OptionButton';
import { Localized } from './Localized';
import { ArrowRightIcon, CheckIcon } from './icons';

const box = 'rounded-2xl p-4 sm:p-5';

function Steps({ steps, tone = 'indigo' }) {
  const dot = { indigo: 'bg-indigo-600', emerald: 'bg-emerald-600', slate: 'bg-slate-700 dark:bg-slate-500' }[tone];
  return (
    <ol className="space-y-2">
      {steps.map((s, i) => (
        <li key={i} className="flex gap-3">
          <span className={`grid size-6 shrink-0 place-items-center rounded-full text-xs font-bold text-white ${dot}`}>{i + 1}</span>
          <Localized value={s} markdown as="div" className="min-w-0 flex-1 text-slate-700 dark:text-slate-200" />
        </li>
      ))}
    </ol>
  );
}

/** The worked example, revealed one step at a time so the student thinks before reading on. */
function WorkedExample({ example }) {
  const [shown, setShown] = useState(0);
  const total = example.steps.length;
  return (
    <div className={`${box} bg-indigo-50/70 ring-1 ring-indigo-100 dark:bg-indigo-500/5 dark:ring-indigo-500/20`}>
      <p className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
        <span aria-hidden="true">📝 </span>
        <Localized value={PATTERNS.example} />
      </p>
      <Localized value={example.question} markdown as="div" className="mt-2 font-semibold leading-relaxed text-slate-900 dark:text-white" />
      {shown > 0 && (
        <div className="mt-3">
          <Steps steps={example.steps.slice(0, shown)} />
        </div>
      )}
      {shown < total ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShown((n) => n + 1)}
            className="min-h-10 rounded-lg bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            <Localized value={PATTERNS.nextStep(shown + 1, total)} />
          </button>
          <button
            type="button"
            onClick={() => setShown(total)}
            className="min-h-10 rounded-lg px-3 text-sm font-semibold text-indigo-700 ring-1 ring-indigo-200 hover:bg-white dark:text-indigo-300 dark:ring-indigo-500/40"
          >
            <Localized value={PATTERNS.showAll} />
          </button>
        </div>
      ) : (
        <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-2 text-emerald-900 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/30">
          <Localized value={PATTERNS.answer} className="font-bold" />: <Localized value={example.answer} markdown inline />
        </div>
      )}
    </div>
  );
}

/** "Your turn": one multiple-choice question of the same pattern, answered on the spot. */
function TryIt({ tryIt, onAnswered }) {
  const [picked, setPicked] = useState(null);
  const answered = picked != null;
  const right = picked === tryIt.correct;
  const statusOf = (i) => {
    if (!answered) return 'idle';
    if (i === picked) return right ? 'correct' : 'wrong';
    if (i === tryIt.correct) return 'answer';
    return 'dimmed';
  };
  const pick = (optionId) => {
    if (answered) return;
    const i = Number(optionId);
    setPicked(i);
    onAnswered(i === tryIt.correct);
  };
  return (
    <div className={`${box} bg-amber-50/70 ring-1 ring-amber-200 dark:bg-amber-500/5 dark:ring-amber-500/25`}>
      <p className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
        <span aria-hidden="true">🎯 </span>
        <Localized value={PATTERNS.yourTurn} />
      </p>
      <Localized value={tryIt.question} markdown as="div" className="mt-2 font-semibold leading-relaxed text-slate-900 dark:text-white" />
      <div role="radiogroup" aria-label={PATTERNS.yourTurn.en} className="mt-3 grid gap-2.5 sm:grid-cols-2">
        {tryIt.options.map((o, i) => (
          <OptionButton
            key={i}
            option={{ optionId: String(i), text: o }}
            index={i}
            status={statusOf(i)}
            checked={picked === i}
            focusable
            disabled={answered}
            onSelect={pick}
          />
        ))}
      </div>
      {answered && (
        <div className="mt-4 space-y-3" role="status">
          <Localized
            value={right ? PATTERNS.correct : PATTERNS.wrong}
            as="p"
            className={`font-bold ${right ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}
          />
          <div className="rounded-xl bg-white p-3 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
            <Localized value={PATTERNS.why} as="p" className="mb-2 text-sm font-bold text-slate-900 dark:text-white" />
            <Steps steps={tryIt.explanation} tone="emerald" />
          </div>
          {!right && (
            <button type="button" onClick={() => setPicked(null)} className="min-h-10 rounded-lg px-3 text-sm font-semibold text-amber-800 ring-1 ring-amber-300 hover:bg-white dark:text-amber-200 dark:ring-amber-500/40">
              🔁 <Localized value={PATTERNS.tryAgain} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Question patterns for one chapter: pick a pattern, learn how to spot and
 * solve it, step through a solved example, then answer a fresh one.
 * Which patterns were tried (and got right) is remembered per chapter.
 */
export default function QuestionPatterns({ subject, topic, patterns, initialPattern, onPractice, onActiveChange }) {
  const [active, setActive] = useState(() => Math.max(0, patterns.findIndex((p) => p.key === initialPattern)));
  // The page's fixed CTA bar steps aside while the student reads here, as it does for the arena.
  const ref = useRef(null);
  const inView = useInView(ref);
  useEffect(() => onActiveChange?.(inView), [inView, onActiveChange]);
  const [results, setResults] = usePersistentState(`patterns:${subject}.${topic}`, {});
  const p = patterns[active];
  const tried = patterns.filter((x) => results[x.key] != null).length;
  const isLast = active === patterns.length - 1;

  return (
    <section ref={ref} id="patterns" aria-labelledby="patterns-title" className="mx-auto max-w-3xl scroll-mt-28 px-4 pb-8">
      <div className="relative overflow-hidden rounded-t-3xl bg-gradient-to-br from-violet-600 via-indigo-600 to-sky-600 p-5 text-white sm:p-6">
        <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-8 size-32 rounded-full bg-white/10" />
        <div className="relative flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 id="patterns-title" className="text-xl font-extrabold sm:text-2xl">
              <span aria-hidden="true">🧩 </span>
              <Localized value={PATTERNS.title} />
            </h2>
            <Localized value={PATTERNS.sub} as="p" className="mt-1 max-w-xl text-sm leading-relaxed text-indigo-50" />
          </div>
          <Localized value={PATTERNS.tried(tried, patterns.length)} className="shrink-0 rounded-full bg-white/20 px-3 py-1 text-sm font-bold ring-1 ring-white/30" />
        </div>
        <div className="relative -mx-1 mt-4 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none]" role="tablist" aria-label={PATTERNS.title.en}>
          {patterns.map((x, i) => {
            const r = results[x.key];
            return (
              <button
                key={x.key}
                type="button"
                role="tab"
                aria-selected={i === active}
                onClick={() => setActive(i)}
                className={`flex min-h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition-colors ${
                  i === active ? 'bg-white text-indigo-700 shadow' : 'bg-white/15 text-white ring-1 ring-white/25 hover:bg-white/25'
                }`}
              >
                <span aria-hidden="true">{x.emoji}</span>
                <Localized value={x.name} />
                {r != null && (
                  <span className={`grid size-4 place-items-center rounded-full text-white ${r ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                    <CheckIcon width={10} height={10} strokeWidth={3.5} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <article key={p.key} className="space-y-4 rounded-b-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6 dark:bg-slate-900 dark:ring-slate-800">
        <div className="flex items-center gap-3">
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-violet-100 text-2xl dark:bg-violet-500/15" aria-hidden="true">{p.emoji}</span>
          <div className="min-w-0">
            <Localized value={PATTERNS.patternOf(active + 1, patterns.length)} as="p" className="text-xs font-bold uppercase tracking-wider text-slate-400" />
            <Localized value={p.name} as="h3" className="text-lg font-extrabold text-slate-900 sm:text-xl dark:text-white" />
          </div>
        </div>

        <div className={`${box} bg-sky-50 ring-1 ring-sky-100 dark:bg-sky-500/5 dark:ring-sky-500/20`}>
          <p className="text-xs font-bold uppercase tracking-wider text-sky-800 dark:text-sky-300">
            <span aria-hidden="true">🔍 </span>
            <Localized value={PATTERNS.spot} />
          </p>
          <Localized value={p.spot} markdown as="div" className="mt-1.5 text-slate-700 dark:text-slate-200" />
        </div>

        <div className={`${box} bg-slate-50 ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-800`}>
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
            <span aria-hidden="true">🛠️ </span>
            <Localized value={PATTERNS.method} />
          </p>
          <Steps steps={p.method} tone="slate" />
        </div>

        <WorkedExample example={p.example} />
        <TryIt tryIt={p.tryIt} onAnswered={(ok) => setResults((r) => ({ ...r, [p.key]: ok }))} />

        <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-between dark:border-slate-800">
          <button
            type="button"
            disabled={active === 0}
            onClick={() => setActive(active - 1)}
            className="min-h-11 rounded-xl px-4 font-semibold text-slate-700 ring-1 ring-slate-300 disabled:opacity-40 dark:text-slate-200 dark:ring-slate-700"
          >
            ← <Localized value={PATTERNS.prev} />
          </button>
          {isLast ? (
            <button type="button" onClick={onPractice} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 font-semibold text-white hover:bg-emerald-500">
              ✍️ <Localized value={PATTERNS.toPractice} />
              <ArrowRightIcon />
            </button>
          ) : (
            <button type="button" onClick={() => setActive(active + 1)} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 font-semibold text-white hover:bg-indigo-500">
              <Localized value={PATTERNS.next} />
              <ArrowRightIcon />
            </button>
          )}
        </div>
        {tried === patterns.length && <Localized value={PATTERNS.allDone} as="p" className="text-center font-semibold text-emerald-700 dark:text-emerald-300" />}
      </article>
    </section>
  );
}

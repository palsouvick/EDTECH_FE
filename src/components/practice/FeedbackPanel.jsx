import { forwardRef } from 'react';
import { ARENA, inARowLabel, percentCorrectLabel } from '../../lib/i18n';
import { Localized } from '../topic-hub/Localized';
import { AlertIcon, BoltIcon, CheckIcon, FlameIcon, XIcon } from '../topic-hub/icons';
import { OPTION_LETTERS } from './OptionButton';

/**
 * Shown after "Check answer". Order follows what a student needs next:
 * correct  -> confirmation, then the method (to reinforce it);
 * incorrect -> why their option was tempting, then the method.
 */
const FeedbackPanel = forwardRef(function FeedbackPanel({ result, question, inARow }, headingRef) {
  const correctIndex = question.options.findIndex((o) => o.optionId === result.correctOptionId);
  const correctOption = question.options[correctIndex];
  const steps = result.explanation?.items ?? [];
  const pct = result.stats?.percentCorrect;
  const ok = result.isCorrect;
  // Traps not tied to one option. After a wrong answer with no option-specific note,
  // the first of these explains the mistake instead of the generic advice.
  const generalTraps = (result.commonTraps ?? []).filter((t) => !t.optionId);
  const mistakeNote = ok ? null : (result.trapForSelected ?? generalTraps[0]?.note ?? null);
  const watchOut = mistakeNote && !result.trapForSelected ? generalTraps.slice(1) : generalTraps;

  return (
    <section className="arena-enter mt-5 space-y-4" aria-labelledby="arena-feedback-title">
      <div
        className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl px-4 py-3 ${
          ok
            ? 'bg-emerald-50 text-emerald-900 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-100 dark:ring-emerald-500/30'
            : 'bg-rose-50 text-rose-900 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-100 dark:ring-rose-500/30'
        }`}
      >
        <span className={`grid size-8 place-items-center rounded-full text-white ${ok ? 'bg-emerald-500' : 'bg-rose-500'}`}>
          {ok ? <CheckIcon width={18} height={18} strokeWidth={3} className="arena-check-draw" /> : <XIcon width={18} height={18} strokeWidth={3} />}
        </span>
        <h3 id="arena-feedback-title" ref={headingRef} tabIndex={-1} className="text-lg font-bold outline-none">
          <Localized value={ok ? ARENA.correct : ARENA.incorrect} />
        </h3>
        {ok && inARow >= 2 && (
          <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">
            <FlameIcon width={14} height={14} className="fill-amber-400 stroke-amber-600" />
            <Localized value={inARowLabel(inARow)} />
          </span>
        )}
        {!ok && correctOption && (
          <span className="text-sm">
            <span className="font-semibold">{OPTION_LETTERS[correctIndex]}.</span>{' '}
            <Localized value={correctOption.text} markdown inline />
          </span>
        )}
        {pct != null && (
          <Localized value={percentCorrectLabel(Math.round(pct))} className="w-full text-xs opacity-75 sm:ml-auto sm:w-auto" />
        )}
      </div>

      {!ok && (
        <div className="rounded-xl border border-rose-200 bg-white p-4 dark:border-rose-500/30 dark:bg-slate-900">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-rose-700 dark:text-rose-300">
            <AlertIcon width={16} height={16} />
            <Localized value={ARENA.mistakeTitle} />
          </h4>
          <Localized
            value={mistakeNote ?? ARENA.mistakeGeneric}
            as="div"
            markdown
            className="mt-2 text-[15px] text-slate-700 dark:text-slate-300"
          />
        </div>
      )}

      {steps.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
          <h4 className="text-sm font-semibold text-slate-900 dark:text-white">
            <Localized value={ARENA.stepByStep} />
          </h4>
          <ol className="mt-3 space-y-3">
            {steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-indigo-50 text-xs font-bold tabular-nums text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                  {i + 1}
                </span>
                <Localized value={step} as="div" markdown className="min-w-0 flex-1 text-[15px] text-slate-700 dark:text-slate-300" />
              </li>
            ))}
          </ol>
        </div>
      )}

      {result.shortcut && (
        <div className="rounded-xl bg-amber-50 p-4 ring-1 ring-amber-200 dark:bg-amber-500/5 dark:ring-amber-500/25">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
            <BoltIcon width={16} height={16} />
            <Localized value={ARENA.shortcut} />
          </h4>
          <Localized value={result.shortcut} as="div" markdown className="mt-1 text-[15px] text-slate-700 dark:text-slate-300" />
        </div>
      )}

      {watchOut.length > 0 && (
        <div className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200 dark:bg-slate-800/40 dark:ring-slate-700">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            <Localized value={ARENA.watchOut} />
          </h4>
          <ul className="mt-2 space-y-2">
            {watchOut.map((t, i) => (
              <Localized key={i} value={t.note} as="li" markdown className="text-sm text-slate-600 dark:text-slate-300" />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
});

export default FeedbackPanel;

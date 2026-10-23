import { memo } from 'react';
import { MOCK, accuracyLabel, completedOf, inARowLabel } from '../../lib/i18n';
import { Localized } from '../topic-hub/Localized';
import { FlameIcon, TimerIcon } from '../topic-hub/icons';

/**
 * "5/20 Completed | 80% Accuracy". Sticky to the bottom of the arena while it is on screen.
 * Also carries the way into a timed test: the hub's CTA bar steps aside while the arena
 * is on screen, so without this a mock test would be unreachable from the practice view.
 */
const ArenaProgressBar = memo(function ArenaProgressBar({ answered, goal, accuracy, inARow, onLaunchMock }) {
  const pct = Math.min(100, (answered / goal) * 100);
  return (
    <div className="sticky bottom-0 z-20 -mx-4 mt-6 border-t border-slate-200 bg-white/90 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/90">
      <div
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={goal}
        aria-valuenow={answered}
        aria-label={`${answered} of ${goal}`}
        className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-500 transition-[width] duration-500 ease-out motion-reduce:transition-none"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-2 flex items-center gap-2">
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 text-sm text-slate-600 dark:text-slate-300" aria-live="polite">
        <Localized value={completedOf(answered, goal)} className="font-semibold tabular-nums text-slate-900 dark:text-white" />
        <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">
          |
        </span>
        <Localized value={accuracyLabel(accuracy)} className="tabular-nums" />
        {inARow >= 2 && (
          <span className="flex items-center gap-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
            <FlameIcon width={14} height={14} className="fill-amber-400 stroke-amber-600" />
            <Localized value={inARowLabel(inARow)} />
          </span>
        )}
      </div>
      {onLaunchMock && (
        <button
          type="button"
          onClick={() => onLaunchMock()}
          className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:text-indigo-300 dark:ring-indigo-500/40 dark:hover:bg-indigo-500/10"
        >
          <TimerIcon width={16} height={16} />
          <Localized value={MOCK.mockTest} />
        </button>
      )}
      </div>
    </div>
  );
});

export default ArenaProgressBar;

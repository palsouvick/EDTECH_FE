import { forwardRef, memo } from 'react';
import { Localized } from '../topic-hub/Localized';
import { CheckIcon, XIcon } from '../topic-hub/icons';

export const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

const STYLES = {
  idle: {
    card: 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/40 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-indigo-500/50 dark:hover:bg-indigo-500/5',
    badge: 'border-slate-300 text-slate-600 dark:border-slate-600 dark:text-slate-300',
  },
  selected: {
    card: 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/20 dark:border-indigo-400 dark:bg-indigo-500/10',
    badge: 'border-indigo-600 bg-indigo-600 text-white dark:border-indigo-400 dark:bg-indigo-400 dark:text-slate-950',
  },
  correct: {
    card: 'arena-pop border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/25 dark:border-emerald-400 dark:bg-emerald-500/10',
    badge: 'border-emerald-600 bg-emerald-600 text-white dark:border-emerald-400 dark:bg-emerald-400 dark:text-slate-950',
  },
  wrong: {
    card: 'arena-shake border-rose-500 bg-rose-50 ring-2 ring-rose-500/20 dark:border-rose-400 dark:bg-rose-500/10',
    badge: 'border-rose-600 bg-rose-600 text-white dark:border-rose-400 dark:bg-rose-400 dark:text-slate-950',
  },
  // The right answer, shown after a wrong pick: present but soft, so the red one stays the focus.
  answer: {
    card: 'border-emerald-300 bg-emerald-50/70 dark:border-emerald-500/40 dark:bg-emerald-500/5',
    badge: 'border-emerald-400 text-emerald-700 dark:border-emerald-500/60 dark:text-emerald-300',
  },
  dimmed: {
    card: 'border-slate-200 bg-white opacity-55 dark:border-slate-800 dark:bg-slate-900',
    badge: 'border-slate-300 text-slate-500 dark:border-slate-700 dark:text-slate-500',
  },
};

const BURST_COLORS = ['#10b981', '#f59e0b', '#6366f1', '#ec4899', '#22d3ee'];

/** Confetti-style particles radiating from the check mark. Decorative only. */
function Burst() {
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0 grid place-items-center">
      {Array.from({ length: 10 }, (_, i) => (
        <span
          key={i}
          className="arena-burst-particle absolute size-1.5 rounded-full"
          style={{ '--angle': `${i * 36}deg`, backgroundColor: BURST_COLORS[i % BURST_COLORS.length] }}
        />
      ))}
    </span>
  );
}

/**
 * One answer choice. A radio in the ARIA sense (role="radio" inside the
 * option radiogroup), built as a button so the whole card is a 56px+ target.
 */
const OptionButton = memo(
  forwardRef(function OptionButton({ option, index, status, checked, focusable, disabled, onSelect }, ref) {
    const s = STYLES[status];
    const showTick = status === 'correct' || status === 'answer';
    return (
      <button
        ref={ref}
        type="button"
        role="radio"
        aria-checked={checked}
        aria-disabled={disabled || undefined}
        tabIndex={focusable ? 0 : -1}
        data-arena-option
        data-status={status}
        onClick={() => !disabled && onSelect(option.optionId)}
        className={`group relative flex min-h-14 w-full items-center gap-3 rounded-xl border-2 px-3.5 py-3 text-left text-base transition-[background-color,border-color,opacity,box-shadow] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 sm:text-[17px] ${s.card} ${
          disabled ? 'cursor-default' : 'cursor-pointer active:scale-[0.99]'
        }`}
      >
        <span
          className={`grid size-8 shrink-0 place-items-center rounded-lg border-2 text-sm font-bold transition-colors ${s.badge}`}
          aria-hidden="true"
        >
          {OPTION_LETTERS[index]}
        </span>

        <span className="min-w-0 flex-1 text-slate-800 dark:text-slate-100">
          <span className="sr-only">{OPTION_LETTERS[index]}. </span>
          <Localized value={option.text} markdown inline />
        </span>

        {showTick && (
          <span className="relative grid size-7 shrink-0 place-items-center rounded-full bg-emerald-500 text-white">
            <CheckIcon width={16} height={16} strokeWidth={3} className="arena-check-draw" />
            {status === 'correct' && <Burst />}
          </span>
        )}
        {status === 'wrong' && (
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-rose-500 text-white">
            <XIcon width={16} height={16} strokeWidth={3} />
          </span>
        )}
        {status === 'idle' && (
          <kbd className="hidden shrink-0 rounded border border-slate-200 px-1.5 text-[11px] font-medium text-slate-400 pointer-fine:inline dark:border-slate-700">
            {index + 1}
          </kbd>
        )}
      </button>
    );
  }),
);

export default OptionButton;

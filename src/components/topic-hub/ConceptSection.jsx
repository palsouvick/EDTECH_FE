import { memo } from 'react';
import { Localized } from './Localized';
import { ChevronIcon } from './icons';

const TONES = {
  indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300',
  amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
  rose: 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300',
};

/**
 * One accordion panel. Collapsed content stays mounted (marked inert), so
 * re-opening is instant, nothing is re-typeset, and in-page find still works.
 */
const ConceptSection = memo(function ConceptSection({ id, title, Icon, tone = 'indigo', count, open, onToggle, children }) {
  const headerId = `${id}-header`;
  const panelId = `${id}-panel`;

  return (
    <section
      id={`${id}-section`}
      data-scroll-anchor
      className="scroll-mt-28 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none"
    >
      <h2>
        <button
          id={headerId}
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => onToggle(id)}
          className="flex w-full items-center gap-3 px-4 py-3.5 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-indigo-500 sm:px-5"
        >
          <span className={`grid size-9 shrink-0 place-items-center rounded-xl ${TONES[tone]}`}>
            <Icon />
          </span>
          <span className="min-w-0 flex-1 text-[15px] font-semibold text-slate-900 sm:text-base dark:text-white">
            <Localized value={title} />
          </span>
          {count > 0 && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold tabular-nums text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              {count}
            </span>
          )}
          <ChevronIcon
            className={`shrink-0 text-slate-400 transition-transform duration-300 motion-reduce:transition-none ${open ? 'rotate-180' : ''}`}
          />
        </button>
      </h2>

      <div
        id={panelId}
        role="region"
        aria-labelledby={headerId}
        inert={!open}
        className={`grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none ${
          open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="space-y-3 border-t border-slate-100 px-4 pb-4 pt-3 sm:px-5 dark:border-slate-800">{children}</div>
        </div>
      </div>
    </section>
  );
});

export default ConceptSection;

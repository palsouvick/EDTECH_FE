import { memo, useSyncExternalStore } from 'react';
import { MOCK } from '../../lib/i18n';
import { STATUS, statusCounts, statusOf } from '../../features/mock/mockExamReducer';
import { Localized } from '../topic-hub/Localized';
import { XIcon } from '../topic-hub/icons';

/**
 * Status styling. Shape varies with status as well as colour (as on the NTA/IBPS
 * screens), so red/green colour-blind students can still tell them apart:
 *   gray square · red "shield" · green "tab" · purple circle · purple circle + green dot.
 */
const STYLE = {
  [STATUS.NOT_VISITED]: 'rounded-md bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600',
  [STATUS.NOT_ANSWERED]: 'rounded-b-2xl rounded-t-md bg-rose-500 text-white',
  [STATUS.ANSWERED]: 'rounded-t-2xl rounded-b-md bg-emerald-500 text-white',
  [STATUS.MARKED]: 'rounded-full bg-violet-600 text-white',
  [STATUS.ANSWERED_MARKED]: 'rounded-full bg-violet-600 text-white',
};

function StatusChip({ status, children, className = '' }) {
  return (
    <span className={`relative grid place-items-center font-semibold tabular-nums ${STYLE[status]} ${className}`}>
      {children}
      {status === STATUS.ANSWERED_MARKED && (
        <span
          aria-hidden="true"
          className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-emerald-400 ring-2 ring-white dark:ring-slate-900"
        />
      )}
    </span>
  );
}

const LEGEND = [STATUS.ANSWERED, STATUS.NOT_ANSWERED, STATUS.NOT_VISITED, STATUS.MARKED, STATUS.ANSWERED_MARKED];

const DESKTOP = '(min-width: 1024px)';
const subscribeDesktop = (cb) => {
  const mq = window.matchMedia?.(DESKTOP);
  mq?.addEventListener('change', cb);
  return () => mq?.removeEventListener('change', cb);
};
const isDesktop = () => window.matchMedia?.(DESKTOP).matches ?? true;

function PaletteBody({ entries, current, onSelect, linear }) {
  const counts = statusCounts(entries);
  return (
    <>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs text-slate-600 dark:text-slate-300" aria-label="Legend">
        {LEGEND.map((s) => (
          <li key={s} className={`flex items-center gap-2 ${s === STATUS.ANSWERED_MARKED ? 'col-span-2' : ''}`}>
            <StatusChip status={s} className="size-7 text-[11px]">
              {counts[s]}
            </StatusChip>
            <Localized value={MOCK[s]} />
          </li>
        ))}
      </ul>

      <div role="list" aria-label="Questions" className="mt-4 grid grid-cols-5 gap-2 sm:grid-cols-6 lg:grid-cols-5">
        {entries.map((e, i) => {
          const status = statusOf(e);
          const isCurrent = i === current;
          // Per-question mode is linear: the palette shows progress but is not for jumping.
          const disabled = e.locked || (linear && !isCurrent);
          return (
            <div role="listitem" key={i}>
              <button
                type="button"
                onClick={() => onSelect(i)}
                disabled={disabled}
                aria-current={isCurrent ? 'step' : undefined}
                aria-label={`${i + 1}: ${MOCK[status].en}${e.locked ? ' (locked)' : ''}`}
                data-status={status}
                className={`block w-full rounded-lg p-0.5 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-500 disabled:cursor-not-allowed ${
                  isCurrent ? 'ring-2 ring-indigo-500 ring-offset-2 ring-offset-white dark:ring-offset-slate-900' : ''
                }`}
              >
                <StatusChip status={status} className={`h-10 w-full text-sm ${e.locked ? 'opacity-50' : ''}`}>
                  {i + 1}
                </StatusChip>
              </button>
            </div>
          );
        })}
      </div>
    </>
  );
}

/**
 * Question status palette. A sidebar on large screens; on smaller screens a
 * slide-in drawer opened from the top bar (`open` / `onClose`).
 *
 * @param {object} props
 * @param {Array} props.entries   exam entries (see mockExamReducer)
 * @param {number} props.current
 * @param {(index: number) => void} props.onSelect
 * @param {boolean} [props.linear]  per-question timer mode: no jumping
 * @param {boolean} props.open      drawer state (ignored on large screens)
 * @param {() => void} props.onClose
 * @param {React.ReactNode} [props.footer]  e.g. the Submit button
 */
const QuestionPalette = memo(function QuestionPalette({ entries, current, onSelect, linear = false, open, onClose, footer }) {
  const desktop = useSyncExternalStore(subscribeDesktop, isDesktop, () => true);
  const select = (i) => {
    onSelect(i);
    onClose?.();
  };
  return (
    <>
      {open && (
        <div aria-hidden="true" onClick={onClose} className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[2px] lg:hidden" />
      )}
      <aside
        id="question-palette"
        aria-label="Question palette"
        // Off-screen drawer on phones: keep its buttons out of the tab order until opened.
        inert={!desktop && !open}
        className={`fixed inset-y-0 right-0 z-50 flex w-[min(20rem,88vw)] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out motion-reduce:transition-none dark:bg-slate-900 lg:sticky lg:top-[4.25rem] lg:z-auto lg:h-[calc(100dvh-5.25rem)] lg:w-72 lg:translate-x-0 lg:rounded-2xl lg:shadow-none lg:ring-1 lg:ring-slate-200 dark:lg:ring-slate-800 ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            <Localized value={MOCK.palette} />
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800"
            aria-label="Close palette"
          >
            <XIcon width={18} height={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <PaletteBody entries={entries} current={current} onSelect={select} linear={linear} />
        </div>
        {footer && <div className="border-t border-slate-100 p-4 dark:border-slate-800">{footer}</div>}
      </aside>
    </>
  );
});

export default QuestionPalette;
export { StatusChip };

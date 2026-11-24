import { STUCK } from '../../lib/i18n';
import { STUCK_REASONS } from '../../features/mock/mockExamReducer';
import { Localized } from '../topic-hub/Localized';

/**
 * Math mocks: "🆘 I'm Stuck". A learning signal, not a mark against the student: it never
 * changes the answer, the status or the score, and answering afterwards is still allowed.
 */
export function StuckButton({ stuck, disabled, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={Boolean(stuck)}
      title={STUCK.buttonHint.en}
      className={`ml-auto inline-flex min-h-10 items-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition-colors disabled:opacity-40 ${
        stuck
          ? 'bg-amber-100 text-amber-900 ring-1 ring-amber-300 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-500/40'
          : 'bg-white text-amber-800 ring-1 ring-amber-300 hover:bg-amber-50 dark:bg-slate-900 dark:text-amber-300 dark:ring-amber-500/50 dark:hover:bg-amber-500/10'
      }`}
    >
      <span aria-hidden="true">🆘</span>
      <Localized value={stuck ? STUCK.marked : STUCK.button} inline />
    </button>
  );
}

/**
 * Shown under the question once it is marked stuck. `asking`: the quick optional reason
 * chips (one tap picks and closes; "Continue" closes without a reason). Otherwise one slim line.
 */
export function StuckPanel({ stuck, asking, disabled, onReason, onContinue, onAsk, onUndo }) {
  if (!stuck) return null;
  const reasonLabel = stuck.reason && STUCK.reasons[stuck.reason];
  return (
    <div
      role="region"
      aria-label={STUCK.marked.en}
      data-testid="stuck-panel"
      className="mb-3 rounded-xl bg-amber-50 px-3 py-2.5 text-sm ring-1 ring-amber-200 dark:bg-amber-500/10 dark:ring-amber-500/30"
    >
      <Localized value={STUCK.safe} as="p" className="text-amber-900 dark:text-amber-200" />
      {asking ? (
        <>
          <Localized value={STUCK.askReason} as="p" className="mt-2 font-semibold text-amber-900 dark:text-amber-100" />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {STUCK_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                disabled={disabled}
                onClick={() => onReason(r)}
                aria-pressed={stuck.reason === r}
                className={`inline-flex min-h-9 items-center gap-1 rounded-full px-3 text-xs font-medium ring-1 disabled:opacity-40 ${
                  stuck.reason === r
                    ? 'bg-amber-600 text-white ring-amber-600'
                    : 'bg-white text-slate-700 ring-slate-300 hover:bg-amber-100 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-600 dark:hover:bg-slate-800'
                }`}
              >
                <span aria-hidden="true">{STUCK.reasonIcons[r]}</span>
                <Localized value={STUCK.reasons[r]} inline />
              </button>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onContinue}
              className="min-h-9 rounded-lg bg-amber-600 px-4 text-xs font-semibold text-white hover:bg-amber-500"
            >
              <Localized value={STUCK.continue} inline />
            </button>
            <button type="button" onClick={onUndo} disabled={disabled} className="text-xs font-medium text-amber-800 underline underline-offset-2 disabled:opacity-40 dark:text-amber-300">
              <Localized value={STUCK.undo} inline />
            </button>
          </div>
        </>
      ) : (
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          {reasonLabel && (
            <span className="font-medium text-amber-900 dark:text-amber-100">
              <span aria-hidden="true">{STUCK.reasonIcons[stuck.reason]} </span>
              <Localized value={reasonLabel} inline />
            </span>
          )}
          <button type="button" onClick={onAsk} disabled={disabled} className="font-medium text-amber-800 underline underline-offset-2 disabled:opacity-40 dark:text-amber-300">
            <Localized value={reasonLabel ? STUCK.changeReason : STUCK.askReason} inline />
          </button>
          <button type="button" onClick={onUndo} disabled={disabled} className="font-medium text-amber-800 underline underline-offset-2 disabled:opacity-40 dark:text-amber-300">
            <Localized value={STUCK.undo} inline />
          </button>
        </div>
      )}
    </div>
  );
}

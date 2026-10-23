import { memo } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';
import { UI } from '../../lib/i18n';
import { Localized } from './Localized';
import { ArrowRightIcon, TargetIcon, TimerIcon } from './icons';

const MODES = [
  { id: 'practice', label: UI.practiceMode, hint: UI.practiceHint, Icon: TargetIcon },
  { id: 'mock', label: UI.mockMode, hint: UI.mockHint, Icon: TimerIcon },
];

/**
 * Bottom action bar, fixed on every screen size (thumb reach on phones).
 * The mode persists, so a returning student lands on their last choice. In mock
 * mode the button opens the pre-test setup (count, timer, pause, language).
 * The page must leave ~8rem of bottom padding so the bar never covers content.
 * `hidden` slides it away, e.g. while the Practice Arena (with its own bottom bar) is on screen.
 */
const ModeCtaBar = memo(function ModeCtaBar({ onStartPractice, onLaunchMock, busy = false, hidden = false }) {
  const [mode, setMode] = usePersistentState('hub:mode', 'practice');
  const isMock = mode === 'mock';

  function onPrimary() {
    if (isMock) onLaunchMock?.();
    else onStartPractice?.();
  }

  return (
    <div
      inert={hidden}
      aria-hidden={hidden || undefined}
      className={`pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] transition-[translate,opacity] duration-300 ease-out motion-reduce:transition-none ${
        hidden ? 'translate-y-full opacity-0' : ''
      }`}
    >
      <div className="pointer-events-auto mx-auto max-w-3xl rounded-2xl lg:max-w-4xl border border-slate-200 bg-white/95 p-2 shadow-lg shadow-slate-900/10 backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/95 dark:shadow-black/40">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div role="radiogroup" aria-label="Study mode" className="grid flex-1 grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
            {MODES.map(({ id, label, hint, Icon }) => {
              const active = mode === id;
              return (
                <button
                  key={id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setMode(id)}
                  className={`flex min-h-11 items-center gap-2 rounded-lg px-2.5 py-1.5 text-left transition-colors focus-visible:outline-2 focus-visible:outline-indigo-500 ${
                    active
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-white'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'
                  }`}
                >
                  <Icon width={18} height={18} className={`shrink-0 ${active ? 'text-indigo-600 dark:text-indigo-400' : ''}`} />
                  <span className="min-w-0">
                    <Localized value={label} className="line-clamp-2 block text-[13px] font-semibold leading-tight" />
                    <Localized value={hint} className="hidden truncate text-[11px] leading-tight text-slate-500 lg:block dark:text-slate-400" />
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onPrimary}
              disabled={busy}
              aria-busy={busy}
              className="flex min-h-11 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 active:bg-indigo-700 disabled:cursor-wait disabled:opacity-70 sm:flex-none"
            >
              <Localized value={isMock ? UI.launchMock : UI.startPractice} />
              <ArrowRightIcon width={18} height={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default ModeCtaBar;

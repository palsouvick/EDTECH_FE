import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { MOCK, markingLabel, questionOfLabel } from '../../lib/i18n';
import { examStore } from '../../lib/examStore';
import { clearExamTimers, formatClock, useExamTimer } from '../../hooks/useExamTimer';
import { languageStore } from '../../hooks/useLanguagePreference';
import { STATUS, mockExamReducer, statusCounts, toSubmission } from '../../features/mock/mockExamReducer';
import LanguageSwitcher from '../topic-hub/LanguageSwitcher';
import { Localized } from '../topic-hub/Localized';
import { TimerIcon } from '../topic-hub/icons';
import OptionButton from '../practice/OptionButton';
import PyqBadge from '../practice/PyqBadge';
import Dialog from '../practice/Dialog';
import QuestionPalette, { StatusChip } from './QuestionPalette';
import TestAnalyticsDashboard from '../analytics/TestAnalyticsDashboard';

const OPTION_KEYS = { a: 0, b: 1, c: 2, d: 3, 1: 0, 2: 1, 3: 2, 4: 3 };
// Buffered time is moved into (persisted) state this often, so a crash loses at most ~1 s.
const FLUSH_TIME_EVERY_MS = 1000;
const PENDING_KEY = (id) => `edtech:exam-pending:${id}`;

/**
 * IndexedDB writes started during page unload often never finish, so on pagehide the
 * unflushed time goes to localStorage (synchronous) and is merged back in on load.
 */
function withRecoveredTime(state) {
  try {
    const raw = localStorage.getItem(PENDING_KEY(state.sessionId));
    localStorage.removeItem(PENDING_KEY(state.sessionId));
    const p = raw && JSON.parse(raw);
    if (!p || !Number.isFinite(p.ms) || !state.entries[p.index]) return state;
    return { ...state, entries: state.entries.map((e, i) => (i === p.index ? { ...e, timeMs: e.timeMs + p.ms } : e)) };
  } catch {
    return state;
  }
}
const say = (l) => l[languageStore.get()] || l.en;

/**
 * Full-screen CBT exam: top bar (name, live timer, pause, language, submit),
 * question + CBT actions, status palette (sidebar / mobile drawer).
 *
 * State lives in mockExamReducer and is mirrored to IndexedDB on every change;
 * the clock lives in useExamTimer (localStorage, deadline-based). A refresh
 * therefore restores answers, marks, position and the exact remaining time.
 *
 * @param {object} props
 * @param {object} props.initialState  from createExamState() or a restored record
 * @param {object} props.source        data source (submitMock)
 * @param {string} [props.backTo]      where "Back to topic" goes after the result
 * @param {boolean} [props.restored]   show a "test restored" notice
 */
export default function MockTestEngine({ initialState, source, backTo, restored = false }) {
  const [state, dispatch] = useReducer(mockExamReducer, initialState, withRecoveredTime);
  const { sessionId, config, phase, current, entries, questions } = state;
  const perQuestion = config.timerMode === 'perQuestion';
  const live = phase === 'active' || phase === 'paused' || phase === 'confirming';

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [announcement, setAnnouncement] = useState(restored ? say(MOCK.restored) : '');
  const [showRestored, setShowRestored] = useState(restored);
  useEffect(() => {
    if (!showRestored) return undefined;
    const t = setTimeout(() => setShowRestored(false), 4000);
    return () => clearTimeout(t);
  }, [showRestored]);
  const [submitAttempt, setSubmitAttempt] = useState(0);
  const stateRef = useRef(state);
  stateRef.current = state;

  // ---- Timer -----------------------------------------------------------------
  // Overall: one clock. Non-pausable tests end at the server's deadline, so a
  // student cannot win time back by reloading.
  const [overallMs] = useState(() =>
    config.allowPause
      ? config.durationSec * 1000
      : Math.max(0, Math.min(config.durationSec * 1000, Date.parse(state.expiresAt) - Date.now())),
  );
  const pendingMs = useRef(0);
  // State as it would be once buffered time is applied. dispatch() is asynchronous, so code
  // that reads state right after flushing (submit, page-hide save) must use this instead.
  const withPendingTime = useCallback(() => {
    const st = stateRef.current;
    if (pendingMs.current < 1) return st;
    return {
      ...st,
      entries: st.entries.map((e, i) => (i === st.current ? { ...e, timeMs: e.timeMs + pendingMs.current } : e)),
    };
  }, []);
  const flushTime = useCallback(() => {
    if (pendingMs.current < 1) return;
    dispatch({ type: 'TIME_SPENT', index: stateRef.current.current, ms: pendingMs.current });
    pendingMs.current = 0;
  }, []);

  const lastLeft = useRef(Infinity);
  const timer = useExamTimer({
    storageKey: perQuestion ? `mock:${sessionId}:q${current}` : `mock:${sessionId}:overall`,
    durationMs: perQuestion ? config.perQuestionSec * 1000 : overallMs,
    autoStart: phase === 'active',
    onTick: (left, elapsed) => {
      pendingMs.current += elapsed;
      if (pendingMs.current >= FLUSH_TIME_EVERY_MS) flushTime();
      if (!perQuestion) {
        if (lastLeft.current > 300_000 && left <= 300_000) setAnnouncement(say(MOCK.fiveMinutes));
        if (lastLeft.current > 60_000 && left <= 60_000) setAnnouncement(say(MOCK.oneMinute));
      }
      lastLeft.current = left;
    },
    onExpire: () => {
      flushTime();
      dispatch(perQuestion ? { type: 'QUESTION_TIME_UP' } : { type: 'SUBMIT_START' });
    },
  });

  // Expiry is also derived from state, not only the onExpire event, so a refresh
  // that lands between "clock hit zero" and "state saved" still resolves.
  useEffect(() => {
    if (timer.status !== 'expired' || phase === 'submitting' || phase === 'submitted') return;
    if (perQuestion) {
      if (!entries[current].locked) dispatch({ type: 'QUESTION_TIME_UP' });
    } else {
      dispatch({ type: 'SUBMIT_START' });
    }
  }, [timer.status, perQuestion, entries, current, phase]);

  // ---- Persistence -----------------------------------------------------------
  useEffect(() => {
    if (phase === 'submitted') return undefined;
    const t = setTimeout(() => examStore.put(stateRef.current), 250);
    return () => clearTimeout(t);
  }, [state, phase]);

  useEffect(() => {
    const save = () => {
      const st = stateRef.current;
      if (pendingMs.current >= 1) {
        try {
          localStorage.setItem(PENDING_KEY(st.sessionId), JSON.stringify({ index: st.current, ms: pendingMs.current }));
          pendingMs.current = 0;
        } catch {
          /* fall through to the async save */
        }
      }
      examStore.put(withPendingTime());
    };
    window.addEventListener('pagehide', save);
    return () => window.removeEventListener('pagehide', save);
  }, [withPendingTime]);

  // Leaving mid-test: refresh is safe (state restores), but warn anyway.
  useEffect(() => {
    if (!live) return undefined;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [live]);

  // ---- Submission --------------------------------------------------------------
  const submitting = phase === 'submitting';
  useEffect(() => {
    if (!submitting) return undefined;
    let alive = true;
    const payload = toSubmission(withPendingTime());
    flushTime();
    timer.pause();
    source.submitMock(payload).then(
      async (result) => {
        await examStore.delete(sessionId);
        clearExamTimers(`mock:${sessionId}:`);
        if (alive) dispatch({ type: 'SUBMIT_SUCCESS', result });
      },
      (error) => alive && dispatch({ type: 'SUBMIT_FAILURE', error }),
    );
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitting, submitAttempt]);

  // ---- Actions -------------------------------------------------------------------
  const act = useCallback(
    (action) => {
      flushTime();
      dispatch(action);
    },
    [flushTime],
  );
  const select = useCallback((optionId) => dispatch({ type: 'SELECT', optionId }), []);
  const goTo = useCallback((index) => act({ type: 'GOTO', index }), [act]);

  const pause = () => {
    flushTime();
    timer.pause();
    dispatch({ type: 'PAUSE' });
  };
  const resume = () => {
    timer.resume();
    dispatch({ type: 'RESUME' });
  };

  const q = questions[current];
  const entry = entries[current];

  // Keyboard: A–D / 1–4 choose, Enter = Save & Next, M = Mark for Review & Next.
  useEffect(() => {
    if (phase !== 'active') return undefined;
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.defaultPrevented) return;
      const t = e.target;
      if (t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      const key = e.key.toLowerCase();
      if (key in OPTION_KEYS) {
        const opt = q.options[OPTION_KEYS[key]];
        if (opt) {
          e.preventDefault();
          select(opt.optionId);
        }
      } else if (key === 'enter' && !(t instanceof HTMLElement && t.closest('button:not([data-arena-option]), a'))) {
        e.preventDefault();
        act({ type: 'SAVE_NEXT' });
      } else if (key === 'm' && !perQuestion) {
        e.preventDefault();
        act({ type: 'MARK_NEXT' });
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [phase, q, select, act, perQuestion]);

  // ---- Render ----------------------------------------------------------------------
  if (phase === 'submitted') return <TestAnalyticsDashboard sessionId={sessionId} source={source} meta={state.meta} backTo={backTo} />;

  const counts = statusCounts(entries);
  const lowTime = perQuestion ? timer.remainingMs < 10_000 : timer.remainingMs < 300_000;
  const last = current === entries.length - 1;

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50 dark:bg-slate-950">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
        <div className="mx-auto flex h-[4.25rem] max-w-6xl items-center gap-2 px-3 sm:gap-3 sm:px-4">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900 sm:text-base dark:text-white">
              <Localized value={state.meta?.examName ?? MOCK.mockTest} />
            </p>
            <p className="hidden truncate text-xs text-slate-500 sm:block dark:text-slate-400">
              <Localized value={markingLabel(config.marking.positive, config.marking.negative)} />
            </p>
          </div>

          <div
            role="timer"
            aria-label={`${say(perQuestion ? MOCK.questionTime : MOCK.timeLeft)} ${formatClock(timer.remainingMs)}`}
            className={`flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 font-mono text-base font-bold tabular-nums transition-colors sm:text-lg ${
              lowTime
                ? 'animate-pulse bg-rose-100 text-rose-700 ring-1 ring-rose-300 motion-reduce:animate-none dark:bg-rose-500/15 dark:text-rose-300 dark:ring-rose-500/40'
                : 'bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white'
            }`}
            data-low-time={lowTime || undefined}
          >
            <TimerIcon width={18} height={18} aria-hidden="true" />
            {formatClock(timer.remainingMs, { compact: perQuestion })}
          </div>

          {config.allowPause && (
            <button
              type="button"
              onClick={phase === 'paused' ? resume : pause}
              disabled={phase !== 'active' && phase !== 'paused'}
              className="min-h-11 rounded-xl px-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 disabled:opacity-50 dark:text-slate-200 dark:ring-slate-600 dark:hover:bg-slate-800"
            >
              <Localized value={phase === 'paused' ? MOCK.resume : MOCK.pause} />
            </button>
          )}

          <LanguageSwitcher only={['en', 'bn']} className="hidden sm:inline-flex" />

          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            aria-controls="question-palette"
            aria-expanded={paletteOpen}
            className="flex min-h-11 items-center gap-1.5 rounded-xl px-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 lg:hidden dark:text-slate-200 dark:ring-slate-600"
          >
            <StatusChip status={STATUS.ANSWERED} className="size-6 text-[11px]">
              {counts.ANSWERED + counts.ANSWERED_MARKED}
            </StatusChip>
            <span className="tabular-nums">/{entries.length}</span>
            <span className="sr-only">
              <Localized value={MOCK.palette} />
            </span>
          </button>

          <button
            type="button"
            onClick={() => act({ type: 'OPEN_SUBMIT' })}
            disabled={phase !== 'active'}
            className="hidden min-h-11 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 sm:block"
          >
            <Localized value={MOCK.submit} />
          </button>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-4 px-3 py-4 sm:px-4">
        <main className="flex min-w-0 flex-1 flex-col">
          {phase === 'paused' ? (
            <section className="arena-enter grid flex-1 place-items-center rounded-2xl bg-white p-8 text-center ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
              <div>
                <Localized value={MOCK.pausedTitle} as="h2" className="text-xl font-bold text-slate-900 dark:text-white" />
                <Localized value={MOCK.pausedHint} as="p" className="mt-1 text-sm text-slate-500 dark:text-slate-400" />
                <button type="button" onClick={resume} autoFocus className="mt-5 min-h-12 rounded-xl bg-indigo-600 px-6 text-sm font-semibold text-white hover:bg-indigo-500">
                  <Localized value={MOCK.resume} />
                </button>
              </div>
            </section>
          ) : (
            <article key={q.questionId} aria-labelledby="mock-stem" className="arena-enter flex-1 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6 dark:bg-slate-900 dark:ring-slate-800">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  <Localized value={questionOfLabel(current + 1, entries.length)} />
                </h2>
                <PyqBadge refs={q.pyq} />
              </div>
              <div id="mock-stem" className="text-lg font-medium leading-relaxed text-slate-900 sm:text-xl dark:text-white">
                <Localized value={q.stem} as="div" markdown />
              </div>
              {entry.locked && (
                <p role="status" className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">
                  <Localized value={MOCK.locked} />
                </p>
              )}
              <div role="radiogroup" aria-labelledby="mock-stem" className="mt-5 space-y-2.5">
                {q.options.map((o, i) => (
                  <OptionButton
                    key={o.optionId}
                    option={o}
                    index={i}
                    status={o.optionId === entry.draft ? 'selected' : 'idle'}
                    checked={o.optionId === entry.draft}
                    focusable={entry.draft ? o.optionId === entry.draft : i === 0}
                    disabled={phase !== 'active' || entry.locked}
                    onSelect={select}
                  />
                ))}
              </div>
            </article>
          )}

          {/* CBT actions: sticky to the bottom on phones */}
          <div className="sticky bottom-0 z-20 -mx-3 mt-3 border-t border-slate-200 bg-white/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur sm:static sm:mx-0 sm:rounded-2xl sm:border-0 sm:p-3 sm:ring-1 sm:ring-slate-200 dark:border-slate-800 dark:bg-slate-900/95 dark:sm:ring-slate-800">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => act({ type: 'CLEAR_RESPONSE' })}
                disabled={phase !== 'active' || entry.locked || (!entry.draft && !entry.answer)}
                className="min-h-12 flex-1 rounded-xl px-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 disabled:opacity-40 sm:flex-none dark:text-slate-200 dark:ring-slate-600 dark:hover:bg-slate-800"
              >
                <Localized value={MOCK.clearResponse} />
              </button>
              {!perQuestion && (
                <button
                  type="button"
                  onClick={() => act({ type: 'MARK_NEXT' })}
                  disabled={phase !== 'active'}
                  className="min-h-12 flex-1 rounded-xl px-3 text-sm font-semibold text-violet-700 ring-1 ring-violet-300 hover:bg-violet-50 disabled:opacity-40 sm:flex-none dark:text-violet-300 dark:ring-violet-500/50 dark:hover:bg-violet-500/10"
                >
                  <Localized value={MOCK.markForReview} />
                </button>
              )}
              <button
                type="button"
                onClick={() => act({ type: 'SAVE_NEXT' })}
                disabled={phase !== 'active' || entry.locked}
                className="min-h-12 w-full rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-40 sm:ml-auto sm:w-auto"
              >
                <Localized value={!perQuestion && last ? MOCK.saveFinish : MOCK.saveNext} />
              </button>
              <button
                type="button"
                onClick={() => act({ type: 'OPEN_SUBMIT' })}
                disabled={phase !== 'active'}
                className="min-h-12 w-full rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50 sm:hidden"
              >
                <Localized value={MOCK.submit} />
              </button>
            </div>
          </div>
        </main>

        <QuestionPalette
          entries={entries}
          current={current}
          onSelect={goTo}
          linear={perQuestion}
          open={paletteOpen}
          onClose={() => setPaletteOpen(false)}
          footer={
            <button
              type="button"
              onClick={() => {
                setPaletteOpen(false);
                act({ type: 'OPEN_SUBMIT' });
              }}
              disabled={phase !== 'active'}
              className="min-h-12 w-full rounded-xl bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
            >
              <Localized value={MOCK.submit} />
            </button>
          }
        />
      </div>

      {/* Submit confirmation */}
      <Dialog open={phase === 'confirming'} onClose={() => dispatch({ type: 'CANCEL_SUBMIT' })} labelledBy="submit-title">
        <h2 id="submit-title" className="text-lg font-bold text-slate-900 dark:text-white">
          <Localized value={MOCK.confirmTitle} />
        </h2>
        <Localized value={MOCK.confirmHint} as="p" className="mt-1 text-sm text-slate-500 dark:text-slate-400" />
        <ul className="mt-4 space-y-2">
          {[STATUS.ANSWERED, STATUS.ANSWERED_MARKED, STATUS.NOT_ANSWERED, STATUS.MARKED, STATUS.NOT_VISITED].map((s) => (
            <li key={s} className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300">
              <StatusChip status={s} className="size-7 text-[11px]">
                {counts[s]}
              </StatusChip>
              <Localized value={MOCK[s]} />
            </li>
          ))}
        </ul>
        <div className="mt-6 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => dispatch({ type: 'CANCEL_SUBMIT' })} autoFocus className="min-h-12 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800">
            <Localized value={MOCK.backToTest} />
          </button>
          <button type="button" onClick={() => dispatch({ type: 'SUBMIT_START' })} className="min-h-12 rounded-xl bg-emerald-600 text-sm font-semibold text-white hover:bg-emerald-500">
            <Localized value={MOCK.submit} />
          </button>
        </div>
      </Dialog>

      {/* Submitting / failure */}
      <Dialog open={submitting} onClose={() => {}} labelledBy="submitting-title">
        <div className="text-center">
          {timer.status === 'expired' && <Localized value={MOCK.timeUp} as="p" className="text-lg font-bold text-rose-600 dark:text-rose-400" />}
          {!state.submitError ? (
            <p id="submitting-title" className="mt-1 text-base font-semibold text-slate-900 dark:text-white">
              <Localized value={MOCK.submitting} />
            </p>
          ) : state.submitError.code === 'SESSION_EXPIRED' ? (
            <p id="submitting-title" className="mt-1 text-base font-semibold text-slate-900 dark:text-white">
              <Localized value={MOCK.expired} />
            </p>
          ) : (
            <>
              <p id="submitting-title" className="mt-1 text-base font-semibold text-slate-900 dark:text-white">
                <Localized value={MOCK.submitFailed} />
              </p>
              <button type="button" onClick={() => setSubmitAttempt((n) => n + 1)} className="mt-4 min-h-12 rounded-xl bg-indigo-600 px-6 text-sm font-semibold text-white hover:bg-indigo-500">
                <Localized value={MOCK.retry} />
              </button>
            </>
          )}
        </div>
      </Dialog>

      {showRestored && (
        <div aria-hidden="true" className="arena-enter fixed inset-x-0 top-20 z-40 mx-auto w-fit max-w-[90vw] rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-lg dark:bg-white dark:text-slate-900">
          <Localized value={MOCK.restored} />
        </div>
      )}

      <p aria-live="assertive" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}

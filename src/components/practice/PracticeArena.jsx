import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { usePracticeSession } from '../../hooks/usePracticeSession';
import { useArenaKeyboard } from '../../hooks/useArenaKeyboard';
import { useStudyProgress } from '../../hooks/useStudyProgress';
import { useInView } from '../../hooks/useInView';
import { languageStore } from '../../hooks/useLanguagePreference';
import { ARENA, questionNumber } from '../../lib/i18n';
import { REVISION } from '../../lib/revisionCopy';
import { Localized } from '../topic-hub/Localized';
import { ArrowRightIcon, BookmarkIcon, FlagIcon } from '../topic-hub/icons';
import ArenaProgressBar from './ArenaProgressBar';
import FeedbackPanel from './FeedbackPanel';
import MilestoneDialog from './MilestoneDialog';
import OptionButton, { OPTION_LETTERS } from './OptionButton';
import PyqBadge from './PyqBadge';
import ReportDialog from './ReportDialog';

/** Bottom edge of the sticky quick-nav, if the page has one. */
const stickyOffset = () => document.querySelector('[data-sticky-top]')?.getBoundingClientRect().bottom ?? 0;

/** Screen-reader announcement in the language the student is reading. */
const say = (localized) => localized[languageStore.get()] || localized.en;

function optionStatus(phase, optionId, selected, result) {
  if (phase !== 'revealed') return optionId === selected ? 'selected' : 'idle';
  if (optionId === selected) return result.isCorrect ? 'correct' : 'wrong';
  if (optionId === result.correctOptionId) return 'answer';
  return 'dimmed';
}

const secondaryBtn =
  'flex min-h-11 items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500';

/**
 * Practice Arena: one question at a time, instant feedback, endless feed.
 *
 * @param {object} props
 * @param {object} props.source  practice source (lib/practiceSource.js): HTTP or fixtures
 * @param {{ en?: string, bn?: string, hi?: string }} props.topicName  used in the milestone message
 * @param {(cfg: { questionCount: number, timeLimitMinutes: number }) => void} [props.onLaunchMock]
 * @param {(active: boolean) => void} [props.onActiveChange]  true while the arena is on screen
 * @param {number} [props.initialGoal]  progress-bar target (default 20)
 * @param {React.ReactNode} [props.endScreen]  replaces the "finished every question" screen
 */
export default function PracticeArena({ source, topicName, onLaunchMock, onActiveChange, initialGoal, endScreen }) {
  const progress = useStudyProgress();
  const session = usePracticeSession(source, { onAttempt: progress.recordAttempt, goal: initialGoal });
  const { state, question, accuracy, isBookmarked } = session;
  const { phase, selected, result } = state;

  const rootRef = useRef(null);
  const questionHeadingRef = useRef(null);
  const feedbackHeadingRef = useRef(null);
  const optionRefs = useRef([]);
  const [announcement, setAnnouncement] = useState('');
  const [reportOpen, setReportOpen] = useState(false);
  const [bookmarkError, setBookmarkError] = useState(false);

  const inView = useInView(rootRef);
  useEffect(() => onActiveChange?.(inView), [inView, onActiveChange]);

  const dialogOpen = reportOpen || Boolean(state.milestone);
  const locked = phase !== 'answering';

  // ---- Focus and scroll choreography -------------------------------------
  const prevPhase = useRef(phase);
  useEffect(() => {
    const was = prevPhase.current;
    prevPhase.current = phase;

    if (phase === 'revealed' && was === 'checking') {
      const heading = feedbackHeadingRef.current;
      heading?.focus({ preventScroll: true });
      heading?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' });
      const correctIdx = question.options.findIndex((o) => o.optionId === result.correctOptionId);
      setAnnouncement(
        result.isCorrect
          ? say(ARENA.correct)
          : `${say(ARENA.incorrect)}. ${OPTION_LETTERS[correctIdx]}`,
      );
    }
    if (phase === 'answering' && was === 'revealed') {
      questionHeadingRef.current?.focus({ preventScroll: true });
      // The new question is shorter than the explanation it replaces, so the browser may clamp
      // the scroll and leave its top under the sticky nav. Bring the question start back into view.
      const top = rootRef.current?.getBoundingClientRect().top ?? 0;
      const gap = 12;
      if (top < stickyOffset() + gap) {
        window.scrollBy?.({ top: top - stickyOffset() - gap, behavior: 'smooth' });
      }
    }
  }, [phase, question, result]);

  // Arrow keys move DOM focus along with the selection (roving tabindex).
  useEffect(() => {
    if (phase !== 'answering' || !selected || !question) return;
    const i = question.options.findIndex((o) => o.optionId === selected);
    const active = document.activeElement;
    if (active?.matches?.('[data-arena-option]')) optionRefs.current[i]?.focus();
  }, [selected, phase, question]);

  const toggleBookmark = useCallback(async () => {
    setBookmarkError(false);
    try {
      await session.toggleBookmark();
    } catch {
      setBookmarkError(true);
    }
  }, [session.toggleBookmark]); // eslint-disable-line react-hooks/exhaustive-deps

  useArenaKeyboard({
    enabled: inView && !dialogOpen && Boolean(question),
    phase,
    options: question?.options,
    onSelect: session.select,
    onMove: session.moveSelection,
    onCheck: session.check,
    onNext: session.next,
    onBookmark: toggleBookmark,
  });

  const launchTimedTest = () => {
    session.dismissMilestone();
    onLaunchMock?.({ questionCount: 10, timeLimitMinutes: 10 });
  };

  // ---- Render ------------------------------------------------------------
  let body;
  if (phase === 'error') {
    body = (
      <div role="alert" className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
        <Localized value={ARENA.loadFailed} as="p" className="font-semibold text-slate-900 dark:text-white" />
        <p className="mt-1 text-sm text-slate-500">{state.pageError?.message}</p>
        <button type="button" onClick={session.retryPage} className="mt-4 min-h-11 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-500">
          <Localized value={ARENA.retry} />
        </button>
      </div>
    );
  } else if (phase === 'finished' && endScreen) {
    body = endScreen;
  } else if (phase === 'finished') {
    body = (
      <div className="arena-enter rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
        <Localized value={ARENA.finishedTitle} as="p" className="text-lg font-bold text-slate-900 dark:text-white" />
        <button type="button" onClick={launchTimedTest} className="mt-5 min-h-12 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-500">
          <Localized value={ARENA.takeTimedTest} />
        </button>
      </div>
    );
  } else if (!question) {
    body = (
      <div aria-busy="true" className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <Localized value={ARENA.loading} as="p" className="sr-only" />
        {[0.5, 1, 0.8].map((w, i) => (
          <div key={i} className="mb-3 h-4 animate-pulse rounded bg-slate-200 motion-reduce:animate-none dark:bg-slate-800" style={{ width: `${w * 100}%` }} />
        ))}
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="mt-3 h-14 animate-pulse rounded-xl bg-slate-100 motion-reduce:animate-none dark:bg-slate-800/60" />
        ))}
      </div>
    );
  } else {
    const stemId = `arena-stem-${question.questionId}`;
    const focusIdx = Math.max(0, question.options.findIndex((o) => o.optionId === selected));
    body = (
      <article key={question.questionId} className="arena-enter" aria-labelledby={stemId}>
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h2
              ref={questionHeadingRef}
              tabIndex={-1}
              className="text-xs font-semibold uppercase tracking-wider text-slate-500 outline-none dark:text-slate-400"
            >
              <Localized value={questionNumber(state.index + 1)} />
            </h2>
            <PyqBadge refs={question.pyq} />
          </div>

          {/* Also the accessible name of the option group; CSS-hidden language slots are excluded from it. */}
          <div id={stemId} className="text-lg font-medium leading-relaxed text-slate-900 sm:text-xl dark:text-white">
            <Localized value={question.stem} as="div" markdown />
          </div>

          <div role="radiogroup" aria-labelledby={stemId} className="mt-5 space-y-2.5">
            {question.options.map((o, i) => (
              <OptionButton
                key={o.optionId}
                ref={(el) => (optionRefs.current[i] = el)}
                option={o}
                index={i}
                status={optionStatus(phase, o.optionId, selected, result)}
                checked={o.optionId === selected}
                focusable={i === focusIdx}
                disabled={locked}
                onSelect={session.select}
              />
            ))}
          </div>

          {state.checkError && (
            <p role="alert" className="mt-3 text-sm font-medium text-rose-600 dark:text-rose-400">
              <Localized value={ARENA.checkFailed} />
            </p>
          )}

          {phase === 'revealed' && result && (
            <FeedbackPanel ref={feedbackHeadingRef} result={result} question={question} inARow={state.inARow} />
          )}

          <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:items-center">
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <button
                type="button"
                onClick={toggleBookmark}
                aria-pressed={isBookmarked}
                className={`${secondaryBtn} ${
                  isBookmarked
                    ? 'bg-amber-50 text-amber-800 ring-1 ring-amber-300 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/40'
                    : 'text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800'
                }`}
              >
                <BookmarkIcon width={18} height={18} filled={isBookmarked} />
                <Localized value={isBookmarked ? ARENA.bookmarked : ARENA.bookmark} />
              </button>
              <button
                type="button"
                onClick={() => setReportOpen(true)}
                className={`${secondaryBtn} text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800`}
              >
                <FlagIcon width={18} height={18} />
                <Localized value={ARENA.reportError} />
              </button>
            </div>

            {phase === 'revealed' ? (
              <button
                type="button"
                onClick={session.next}
                className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 text-[15px] font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 active:bg-indigo-700 sm:ml-auto"
              >
                <Localized value={ARENA.nextQuestion} />
                <ArrowRightIcon width={18} height={18} />
              </button>
            ) : (
              <button
                type="button"
                onClick={session.check}
                disabled={!selected || phase === 'checking'}
                aria-busy={phase === 'checking'}
                className="min-h-12 rounded-xl bg-indigo-600 px-6 text-[15px] font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 active:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none sm:ml-auto dark:disabled:bg-slate-800 dark:disabled:text-slate-500"
              >
                <Localized value={phase === 'checking' ? ARENA.checking : ARENA.checkAnswer} />
              </button>
            )}
          </div>

          {bookmarkError && (
            <p role="alert" className="mt-2 text-sm text-rose-600 dark:text-rose-400">
              <Localized value={ARENA.bookmarkFailed} />
            </p>
          )}
          {isBookmarked && !bookmarkError && (
            <p className="mt-2 text-sm text-amber-800 dark:text-amber-300">
              📌 <Localized value={REVISION.savedInArena} /> ·{' '}
              <Link to="/revision" className="font-semibold underline underline-offset-2 hover:text-amber-950 dark:hover:text-amber-100">
                <Localized value={REVISION.open} />
              </Link>
            </p>
          )}

          <Localized value={ARENA.shortcutsHint} as="p" className="mt-4 hidden text-center text-xs text-slate-400 pointer-fine:block dark:text-slate-500" />
        </div>
      </article>
    );
  }

  return (
    <section ref={rootRef} aria-label="Practice" className="relative">
      {body}

      <ArenaProgressBar
        answered={state.answered}
        goal={state.goal}
        accuracy={accuracy}
        inARow={state.inARow}
        onLaunchMock={onLaunchMock && (() => onLaunchMock())}
      />

      <p aria-live="assertive" className="sr-only">
        {announcement}
      </p>

      <MilestoneDialog
        milestone={state.milestone}
        topicName={topicName}
        onKeepGoing={session.dismissMilestone}
        onTimedTest={launchTimedTest}
      />
      <ReportDialog open={reportOpen} onClose={() => setReportOpen(false)} onSubmit={session.report} />
    </section>
  );
}

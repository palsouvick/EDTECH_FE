import { useCallback, useEffect, useReducer, useRef } from 'react';
import {
  accuracyPct,
  currentQuestion,
  initialPracticeState,
  practiceReducer,
  shouldPrefetch,
} from '../features/practice/practiceReducer';
import { languageStore } from './useLanguagePreference';

const PAGE_SIZE = 5;

/**
 * Drives the Practice Arena: infinite cursor feed, instant validation,
 * optimistic bookmarks. Pass a `source` from lib/practiceSource.js.
 *
 * @param {ReturnType<import('../lib/practiceSource').createHttpPracticeSource>} source
 * @param {{ onAttempt?: (result) => void, goal?: number }} [options]  onAttempt: called once per checked answer
 */
export function usePracticeSession(source, { onAttempt, goal } = {}) {
  // `goal`: target for the progress bar, e.g. 15 from a weak-topic link or 5 for a retry.
  const [state, dispatch] = useReducer(practiceReducer, goal, (g) => (g ? { ...initialPracticeState, goal: g } : initialPracticeState));
  const stateRef = useRef(state);
  stateRef.current = state;

  // Results that arrive after unmount are dropped. Requests are not aborted,
  // which keeps StrictMode's mount/unmount/mount from cancelling the first page.
  const mounted = useRef(false);
  const pageInFlight = useRef(false);
  const shownAt = useRef(performance.now());
  const onAttemptRef = useRef(onAttempt);
  onAttemptRef.current = onAttempt;

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const loadPage = useCallback(async () => {
    if (pageInFlight.current) return;
    pageInFlight.current = true;
    dispatch({ type: 'PAGE_REQUEST' });
    try {
      // Read at fetch time: a student who switches to বাংলা gets Bengali-ready questions from the next page on.
      const page = await source.fetchPage({
        cursor: stateRef.current.cursor,
        language: languageStore.get(),
        limit: PAGE_SIZE,
      });
      if (mounted.current) dispatch({ type: 'PAGE_SUCCESS', ...page });
    } catch (error) {
      if (mounted.current) dispatch({ type: 'PAGE_FAILURE', error });
    } finally {
      pageInFlight.current = false;
    }
  }, [source]);

  // Keep a small buffer ahead of the student so "Next" never shows a spinner.
  useEffect(() => {
    if (shouldPrefetch(state) && state.phase !== 'finished') loadPage();
  }, [state, loadPage]);

  const question = currentQuestion(state);
  const questionId = question?.questionId;

  useEffect(() => {
    shownAt.current = performance.now();
  }, [questionId]);

  const check = useCallback(async () => {
    const s = stateRef.current;
    const q = currentQuestion(s);
    if (s.phase !== 'answering' || !s.selected || !q) return;
    dispatch({ type: 'CHECK_REQUEST' });
    try {
      const result = await source.verify({
        questionId: q.questionId,
        selectedOptionId: s.selected,
        timeSpentSec: Math.round((performance.now() - shownAt.current) / 100) / 10,
      });
      if (!mounted.current) return;
      dispatch({ type: 'CHECK_SUCCESS', result });
      onAttemptRef.current?.(result);
    } catch (error) {
      if (mounted.current) dispatch({ type: 'CHECK_FAILURE', error });
    }
  }, [source]);

  const toggleBookmark = useCallback(async () => {
    const q = currentQuestion(stateRef.current);
    if (!q) return;
    const next = !stateRef.current.bookmarks[q.questionId];
    dispatch({ type: 'SET_BOOKMARK', questionId: q.questionId, value: next }); // optimistic
    try {
      await source.setBookmark(q.questionId, next);
    } catch (error) {
      if (mounted.current) dispatch({ type: 'SET_BOOKMARK', questionId: q.questionId, value: !next });
      throw error;
    }
  }, [source]);

  const report = useCallback(
    (payload) => {
      const q = currentQuestion(stateRef.current);
      return source.report({ questionId: q.questionId, language: languageStore.get(), ...payload });
    },
    [source],
  );

  return {
    state,
    question,
    accuracy: accuracyPct(state),
    isBookmarked: questionId ? Boolean(state.bookmarks[questionId]) : false,
    select: useCallback((optionId) => dispatch({ type: 'SELECT', optionId }), []),
    moveSelection: useCallback((delta, from) => dispatch({ type: 'MOVE_SELECTION', delta, from }), []),
    check,
    next: useCallback(() => dispatch({ type: 'NEXT' }), []),
    retryPage: useCallback(() => {
      dispatch({ type: 'RETRY_PAGE' });
      loadPage();
    }, [loadPage]),
    dismissMilestone: useCallback(() => dispatch({ type: 'DISMISS_MILESTONE' }), []),
    toggleBookmark,
    report,
  };
}

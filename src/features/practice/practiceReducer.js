/**
 * Practice Arena state machine. Pure: every transition is unit-tested.
 *
 *   loading ──PAGE_SUCCESS──▶ answering ──SELECT──▶ answering (selected)
 *                                 │                       │
 *                                 │                 CHECK_REQUEST
 *                                 │                       ▼
 *                                 │                   checking ──CHECK_FAILURE──▶ answering (+checkError)
 *                                 │                       │
 *                                 │                 CHECK_SUCCESS
 *                                 │                       ▼
 *                             NEXT ◀──────────────── revealed
 *                                 │
 *           queue empty & hasMore ▶ loading      queue empty & !hasMore ▶ finished
 */

export const MILESTONE_EVERY = 10;
export const GOAL_STEP = 20;
export const PREFETCH_WHEN_REMAINING = 2;

export const initialPracticeState = Object.freeze({
  questions: [],
  index: 0,
  cursor: null,
  hasMore: true,
  loadingPage: false,
  pageError: null,

  phase: 'loading', // loading | answering | checking | revealed | finished | error
  selected: null,
  result: null,
  checkError: null,

  answered: 0,
  correct: 0,
  inARow: 0,
  goal: GOAL_STEP,

  pendingMilestone: null,
  milestone: null,
  bookmarks: {},
});

export const currentQuestion = (s) => s.questions[s.index] ?? null;

export const accuracyPct = (s) => (s.answered ? Math.round((s.correct / s.answered) * 100) : 0);

export const shouldPrefetch = (s) =>
  s.hasMore && !s.loadingPage && !s.pageError && s.questions.length - s.index <= PREFETCH_WHEN_REMAINING;

export function practiceReducer(s, action) {
  switch (action.type) {
    case 'PAGE_REQUEST':
      return { ...s, loadingPage: true, pageError: null };

    case 'PAGE_SUCCESS': {
      const known = new Set(s.questions.map((q) => q.questionId));
      const fresh = action.questions.filter((q) => !known.has(q.questionId));
      const bookmarks = { ...s.bookmarks };
      for (const q of fresh) if (!(q.questionId in bookmarks)) bookmarks[q.questionId] = Boolean(q.bookmarked);

      const questions = [...s.questions, ...fresh];
      const waiting = s.phase === 'loading' || s.phase === 'error';
      let phase = s.phase;
      if (waiting) phase = questions[s.index] ? 'answering' : action.hasMore ? 'loading' : 'finished';

      return {
        ...s,
        questions,
        bookmarks,
        cursor: action.nextCursor,
        hasMore: action.hasMore,
        loadingPage: false,
        phase,
      };
    }

    case 'PAGE_FAILURE':
      return {
        ...s,
        loadingPage: false,
        pageError: action.error,
        // Only blocking when there is nothing left on screen to answer.
        phase: s.phase === 'loading' ? 'error' : s.phase,
      };

    case 'RETRY_PAGE':
      return { ...s, pageError: null, phase: s.phase === 'error' ? 'loading' : s.phase };

    case 'SELECT': {
      if (s.phase !== 'answering') return s;
      const q = currentQuestion(s);
      if (!q?.options.some((o) => o.optionId === action.optionId)) return s;
      return { ...s, selected: action.optionId, checkError: null };
    }

    case 'MOVE_SELECTION': {
      if (s.phase !== 'answering') return s;
      const opts = currentQuestion(s)?.options ?? [];
      if (!opts.length) return s;
      // Move from the selection, else from the focused option (WAI-ARIA radio group behaviour).
      const i = opts.findIndex((o) => o.optionId === (s.selected ?? action.from));
      const next = i === -1 ? (action.delta > 0 ? 0 : opts.length - 1) : (i + action.delta + opts.length) % opts.length;
      return { ...s, selected: opts[next].optionId, checkError: null };
    }

    case 'CHECK_REQUEST':
      if (s.phase !== 'answering' || !s.selected) return s;
      return { ...s, phase: 'checking', checkError: null };

    case 'CHECK_SUCCESS': {
      if (s.phase !== 'checking') return s;
      const ok = Boolean(action.result.isCorrect);
      const answered = s.answered + 1;
      const correct = s.correct + (ok ? 1 : 0);
      return {
        ...s,
        phase: 'revealed',
        result: action.result,
        answered,
        correct,
        inARow: ok ? s.inARow + 1 : 0,
        // Shown on NEXT, so the student reads the explanation first.
        pendingMilestone: answered % MILESTONE_EVERY === 0 ? { count: answered, correct } : s.pendingMilestone,
      };
    }

    case 'CHECK_FAILURE':
      if (s.phase !== 'checking') return s;
      return { ...s, phase: 'answering', checkError: action.error };

    case 'NEXT': {
      if (s.phase !== 'revealed') return s;
      const index = s.index + 1;
      const phase = s.questions[index] ? 'answering' : s.hasMore ? 'loading' : 'finished';
      return {
        ...s,
        index,
        phase,
        selected: null,
        result: null,
        checkError: null,
        goal: s.answered >= s.goal ? s.goal + GOAL_STEP : s.goal,
        milestone: s.pendingMilestone ?? s.milestone,
        pendingMilestone: null,
      };
    }

    case 'DISMISS_MILESTONE':
      return { ...s, milestone: null };

    case 'SET_BOOKMARK':
      return { ...s, bookmarks: { ...s.bookmarks, [action.questionId]: action.value } };

    default:
      return s;
  }
}

/**
 * CBT exam state, following the SSC / IBPS / NTA interface conventions:
 *
 *  - Choosing an option is only a *draft*. It counts once the student presses
 *    "Save & Next" or "Mark for Review & Next". Jumping to another question
 *    from the palette discards an unsaved draft.
 *  - "Answered & Marked for Review" answers ARE evaluated; "Marked" without
 *    an answer is not.
 *  - Per-question timer mode: when a question's time runs out its draft is
 *    saved, it locks, and the next unlocked question opens. When none are
 *    left, the test submits.
 *
 *  - Custom tests only: "Check answer" (CHECKED) saves the chosen option as the answer and
 *    shows the server's verdict. A checked answer can no longer be changed or cleared (the
 *    server scores the checked option anyway), but the question can still be revisited.
 *
 *  - Math only: "I'm Stuck" (STUCK / STUCK_REASON / UNSTUCK) is a learning signal kept
 *    next to the answer, never instead of it. It does not change the question's
 *    status, its answer or the score.
 *
 * Pure: unit-tested in src/test/mockExamReducer.test.js.
 */

export const STATUS = Object.freeze({
  NOT_VISITED: 'NOT_VISITED',
  NOT_ANSWERED: 'NOT_ANSWERED',
  ANSWERED: 'ANSWERED',
  MARKED: 'MARKED',
  ANSWERED_MARKED: 'ANSWERED_MARKED',
});

export function statusOf(entry) {
  if (!entry.visited) return STATUS.NOT_VISITED;
  if (entry.marked) return entry.answer ? STATUS.ANSWERED_MARKED : STATUS.MARKED;
  return entry.answer ? STATUS.ANSWERED : STATUS.NOT_ANSWERED;
}

export function statusCounts(entries) {
  const counts = Object.fromEntries(Object.values(STATUS).map((s) => [s, 0]));
  for (const e of entries) counts[statusOf(e)] += 1;
  return counts;
}

/**
 * Why a student pressed "I'm Stuck" (optional). Order is the order the chips are shown.
 * concept: don't understand the concept · method: don't know which formula/method ·
 * calculation: calculation trouble · start: don't know how to start · forgot_rule: forgot
 * the basic rule · too_slow: understand it but it takes too long · question_unclear: don't
 * understand the question · other.
 */
export const STUCK_REASONS = Object.freeze(['concept', 'method', 'calculation', 'start', 'forgot_rule', 'too_slow', 'question_unclear', 'other']);

/** Subjects whose mocks offer "I'm Stuck". Math only for now. */
const STUCK_SUBJECTS = new Set(['quant']);

/** True when this exam offers "I'm Stuck" (a Math mock). Older saved exams fall back to meta.subject. */
export function offersStuck(s) {
  return STUCK_SUBJECTS.has(s.config?.subject ?? s.meta?.subject);
}

/** Number of questions marked stuck. */
export const stuckCount = (entries) => entries.reduce((n, e) => n + (e.stuck ? 1 : 0), 0);

// stuck: null, or { reason, timeMs, markedAt }: timeMs is the time spent on the question
// before pressing "I'm Stuck"; markedAt is when (ISO).
// checked: null, or the check response ({ selectedOptionId, isCorrect, correctOptionId, explanation, ... });
// { selectedOptionId, pending: true } when restored from the server before the verdict is fetched again.
const blankEntry = () => ({ visited: false, draft: null, answer: null, marked: false, locked: false, timeMs: 0, stuck: null, checked: null });

/**
 * Build the initial exam state from a created (or fetched) server session.
 * @param {object} session  POST /mock/create-session response (or GET /mock/session/:id)
 * @param {object} meta     { examName, category, subject, topic, names }
 */
export function createExamState(session, meta) {
  const entries = session.questions.map(blankEntry);
  entries[0].visited = true;
  // Answers already checked on the server (resumed on another device): restore them, locked.
  const checked = session.custom?.checked || {};
  session.questions.forEach((q, i) => {
    const opt = checked[q.questionId];
    if (opt) Object.assign(entries[i], { visited: true, draft: opt, answer: opt, checked: { selectedOptionId: opt, pending: true } });
  });
  const c = session.config;
  return {
    sessionId: session.sessionId,
    meta,
    config: {
      subject: c.subject ?? meta?.subject ?? null,
      questionCount: c.questionCount,
      timerMode: c.perQuestionTimer ? 'perQuestion' : 'overall',
      durationSec: c.timeLimitMinutes ? c.timeLimitMinutes * 60 : null,
      perQuestionSec: c.perQuestionLimitSec ?? null,
      allowPause: c.allowPause,
      language: c.language,
      marking: c.markingScheme,
    },
    startedAt: session.startedAt,
    expiresAt: session.expiresAt,
    questions: session.questions,
    entries,
    current: 0,
    phase: 'active', // active | paused | confirming | submitting | submitted
    submitError: null,
    result: null,
  };
}

const withEntry = (s, i, patch) => ({
  ...s,
  entries: s.entries.map((e, k) => (k === i ? { ...e, ...patch } : e)),
});

/** Move to question i: discard the unsaved draft on the one being left, mark i visited. */
function goTo(s, i) {
  if (i < 0 || i >= s.entries.length || s.entries[i].locked) return s;
  let next = withEntry(s, s.current, { draft: s.entries[s.current].answer });
  next = withEntry(next, i, { visited: true, draft: next.entries[i].answer });
  return { ...next, current: i };
}

/** Next unlocked question after `from`, wrapping around; -1 when every question is locked. */
export function nextOpenIndex(entries, from) {
  for (let k = 1; k <= entries.length; k++) {
    const i = (from + k) % entries.length;
    if (!entries[i].locked) return i;
  }
  return -1;
}

/** The answer of the current question can still change. */
const editable = (s) => s.phase === 'active' && !s.entries[s.current].locked && !s.entries[s.current].checked;
/** The student can leave the current question with Save & Next / Mark & Next. */
const advanceable = (s) => s.phase === 'active' && !s.entries[s.current].locked;

export function mockExamReducer(s, action) {
  switch (action.type) {
    case 'HYDRATE':
      return action.state;

    case 'SELECT':
      if (!editable(s)) return s;
      return withEntry(s, s.current, { draft: action.optionId });

    case 'CLEAR_RESPONSE':
      if (!editable(s)) return s;
      return withEntry(s, s.current, { draft: null, answer: null });

    case 'SAVE_NEXT':
    case 'MARK_NEXT': {
      if (!advanceable(s)) return s;
      const e = s.entries[s.current];
      if (s.config.timerMode === 'perQuestion') {
        // Linear test: a saved question is final (its clock stops), go to the next open one.
        const locked = withEntry(s, s.current, { answer: e.draft, locked: true, marked: false });
        const next = nextOpenIndex(locked.entries, s.current);
        if (next === -1) return { ...locked, phase: 'submitting', submitError: null };
        const moved = withEntry(locked, next, { visited: true, draft: locked.entries[next].answer });
        return { ...moved, current: next };
      }
      const saved = withEntry(s, s.current, {
        answer: e.draft,
        // Save & Next records a plain answer; Mark for Review & Next flags it for a second look.
        marked: action.type === 'MARK_NEXT',
      });
      const last = s.current === s.entries.length - 1;
      return last ? saved : goTo(saved, s.current + 1);
    }

    case 'GOTO':
      if (s.phase !== 'active') return s;
      // Per-question mode is linear: a student cannot hop around while the clock is per item.
      if (s.config.timerMode === 'perQuestion' && action.index !== s.current) return s;
      return goTo(s, action.index);

    case 'CHECKED': {
      // The server's verdict for question `index`; its option becomes the (final) answer.
      const i = action.index ?? s.current;
      const e = s.entries[i];
      if (!e || s.phase === 'submitting' || s.phase === 'submitted') return s;
      const opt = action.result.selectedOptionId;
      return withEntry(s, i, { visited: true, answer: opt, draft: opt, checked: action.result });
    }

    case 'TIME_SPENT':
      return withEntry(s, action.index ?? s.current, {
        timeMs: s.entries[action.index ?? s.current].timeMs + action.ms,
      });

    case 'QUESTION_TIME_UP': {
      // Per-question mode: keep the student's selection, lock, move on.
      if (s.config.timerMode !== 'perQuestion' || s.entries[s.current].locked) return s;
      const e = s.entries[s.current];
      const locked = withEntry(s, s.current, { answer: e.draft ?? e.answer, locked: true });
      const next = nextOpenIndex(locked.entries, s.current);
      if (next === -1) return { ...locked, phase: 'submitting', submitError: null };
      const moved = withEntry(locked, next, { visited: true, draft: locked.entries[next].answer });
      return { ...moved, current: next };
    }

    case 'STUCK': {
      // The current question only, while it can still be worked on. Pressing it again keeps
      // the first record (the time before the student first got stuck is what matters).
      if (!editable(s) || !offersStuck(s)) return s;
      const e = s.entries[s.current];
      if (e.stuck) return s;
      const reason = STUCK_REASONS.includes(action.reason) ? action.reason : null;
      return withEntry(s, s.current, { stuck: { reason, timeMs: e.timeMs, markedAt: action.at ?? null } });
    }

    case 'STUCK_REASON': {
      const e = s.entries[s.current];
      if (s.phase !== 'active' || !e.stuck) return s;
      const reason = STUCK_REASONS.includes(action.reason) ? action.reason : null;
      return withEntry(s, s.current, { stuck: { ...e.stuck, reason } });
    }

    case 'UNSTUCK':
      // Undo for a mis-tap.
      if (!editable(s) || !s.entries[s.current].stuck) return s;
      return withEntry(s, s.current, { stuck: null });

    case 'PAUSE':
      return s.phase === 'active' && s.config.allowPause ? { ...s, phase: 'paused' } : s;
    case 'RESUME':
      return s.phase === 'paused' ? { ...s, phase: 'active' } : s;

    case 'OPEN_SUBMIT':
      return s.phase === 'active' ? { ...s, phase: 'confirming' } : s;
    case 'CANCEL_SUBMIT':
      return s.phase === 'confirming' ? { ...s, phase: 'active' } : s;
    case 'SUBMIT_START':
      // Auto-submit (time up) can come from any live phase; never twice.
      return s.phase === 'submitting' || s.phase === 'submitted' ? s : { ...s, phase: 'submitting', submitError: null };
    case 'SUBMIT_SUCCESS':
      return { ...s, phase: 'submitted', result: action.result, submitError: null };
    case 'SUBMIT_FAILURE':
      return { ...s, phase: 'submitting', submitError: action.error };

    default:
      return s;
  }
}

const toSec = (ms) => Math.round(ms / 100) / 10;

/**
 * Responses payload for POST /mock/submit-session. Marked-only questions have no answer.
 * A question marked "I'm Stuck" also carries `stuck` (reason, time before pressing it, when);
 * the server stores it next to the scored answer and never lets it change the score.
 */
export function toSubmission(s) {
  return {
    sessionId: s.sessionId,
    responses: s.questions.map((q, i) => {
      const e = s.entries[i];
      return {
        questionId: q.questionId,
        selectedOptionId: e.answer,
        timeSpentSec: toSec(e.timeMs),
        // For the review matrix filter only; marks never change the score.
        markedForReview: e.marked,
        ...(e.stuck && { stuck: { reason: e.stuck.reason ?? null, timeBeforeSec: toSec(e.stuck.timeMs ?? 0), markedAt: e.stuck.markedAt ?? null } }),
      };
    }),
  };
}

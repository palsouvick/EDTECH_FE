import { describe, expect, it } from 'vitest';
import { STATUS, createExamState, mockExamReducer as r, offersStuck, statusCounts, statusOf, stuckCount, toSubmission } from '../features/mock/mockExamReducer';

const session = (n, { perQuestion = false, allowPause = true, timeLimitMinutes = 10 } = {}) => ({
  sessionId: 'a'.repeat(24),
  config: {
    questionCount: n,
    timeLimitMinutes,
    perQuestionTimer: perQuestion,
    perQuestionLimitSec: perQuestion ? 45 : null,
    allowPause,
    language: 'bn',
    markingScheme: { positive: 1, negative: 0.25 },
  },
  startedAt: '2026-10-14T09:00:00Z',
  expiresAt: '2026-10-14T09:10:00Z',
  questions: Array.from({ length: n }, (_, i) => ({
    questionId: String(i).padStart(24, '0'),
    options: ['a', 'b', 'c', 'd'].map((c) => ({ optionId: `opt_${i}${c}00` })),
  })),
});

const opt = (s, i, c) => s.questions[i].options['abcd'.indexOf(c)].optionId;
const statuses = (s) => s.entries.map(statusOf);

describe('mockExamReducer (CBT rules)', () => {
  it('an untimed session (timeLimitMinutes null) gets durationSec null', () => {
    const s = createExamState(session(2, { timeLimitMinutes: null }), {});
    expect(s.config.durationSec).toBeNull();
  });

  it('starts on Q1 visited, the rest not visited', () => {
    const s = createExamState(session(4), {});
    expect(statuses(s)).toEqual([STATUS.NOT_ANSWERED, STATUS.NOT_VISITED, STATUS.NOT_VISITED, STATUS.NOT_VISITED]);
    expect(s.config).toMatchObject({ timerMode: 'overall', durationSec: 600, allowPause: true, language: 'bn' });
  });

  it('a selection counts only after Save & Next', () => {
    let s = createExamState(session(3), {});
    s = r(s, { type: 'SELECT', optionId: opt(s, 0, 'b') });
    expect(statusOf(s.entries[0])).toBe(STATUS.NOT_ANSWERED);
    s = r(s, { type: 'SAVE_NEXT' });
    expect(s.current).toBe(1);
    expect(s.entries[0].answer).toBe(opt(s, 0, 'b'));
    expect(statuses(s)).toEqual([STATUS.ANSWERED, STATUS.NOT_ANSWERED, STATUS.NOT_VISITED]);
  });

  it('jumping via the palette discards an unsaved selection', () => {
    let s = createExamState(session(3), {});
    s = r(s, { type: 'SELECT', optionId: opt(s, 0, 'c') });
    s = r(s, { type: 'GOTO', index: 2 });
    expect(s.entries[0]).toMatchObject({ answer: null, draft: null });
    expect(statuses(s)).toEqual([STATUS.NOT_ANSWERED, STATUS.NOT_VISITED, STATUS.NOT_ANSWERED]);
  });

  it('Mark for Review: purple without an answer, purple+green with one (evaluated)', () => {
    let s = createExamState(session(3), {});
    s = r(s, { type: 'MARK_NEXT' }); // Q1 marked, no answer
    s = r(s, { type: 'SELECT', optionId: opt(s, 1, 'a') });
    s = r(s, { type: 'MARK_NEXT' }); // Q2 answered + marked
    expect(statuses(s)).toEqual([STATUS.MARKED, STATUS.ANSWERED_MARKED, STATUS.NOT_ANSWERED]);
    const sub = toSubmission(s);
    expect(sub.responses.map((x) => x.selectedOptionId)).toEqual([null, opt(s, 1, 'a'), null]);
  });

  it('Save & Next on a marked question clears the mark; Clear Response removes the answer', () => {
    let s = createExamState(session(2), {});
    s = r(s, { type: 'SELECT', optionId: opt(s, 0, 'a') });
    s = r(s, { type: 'MARK_NEXT' });
    s = r(s, { type: 'GOTO', index: 0 });
    s = r(s, { type: 'SAVE_NEXT' });
    expect(statusOf(s.entries[0])).toBe(STATUS.ANSWERED);
    s = r(s, { type: 'GOTO', index: 0 });
    s = r(s, { type: 'CLEAR_RESPONSE' });
    expect(statusOf(s.entries[0])).toBe(STATUS.NOT_ANSWERED);
  });

  it('Save on the last question stays there', () => {
    let s = createExamState(session(2), {});
    s = r(s, { type: 'GOTO', index: 1 });
    s = r(s, { type: 'SELECT', optionId: opt(s, 1, 'd') });
    s = r(s, { type: 'SAVE_NEXT' });
    expect(s.current).toBe(1);
    expect(statusOf(s.entries[1])).toBe(STATUS.ANSWERED);
  });

  it('pause only when allowed; nothing is editable while paused', () => {
    let s = createExamState(session(2, { allowPause: false }), {});
    expect(r(s, { type: 'PAUSE' }).phase).toBe('active');
    s = createExamState(session(2), {});
    s = r(s, { type: 'PAUSE' });
    expect(s.phase).toBe('paused');
    expect(r(s, { type: 'SELECT', optionId: opt(s, 0, 'a') }).entries[0].draft).toBeNull();
    expect(r(s, { type: 'RESUME' }).phase).toBe('active');
  });

  it('per-question mode: linear, time-up keeps the selection and locks, last one submits', () => {
    let s = createExamState(session(3, { perQuestion: true }), {});
    expect(s.config).toMatchObject({ timerMode: 'perQuestion', perQuestionSec: 45 });
    expect(r(s, { type: 'GOTO', index: 2 }).current).toBe(0); // no jumping

    s = r(s, { type: 'SELECT', optionId: opt(s, 0, 'b') });
    s = r(s, { type: 'QUESTION_TIME_UP' });
    expect(s.entries[0]).toMatchObject({ locked: true, answer: opt(s, 0, 'b') });
    expect(s.current).toBe(1);

    s = r(s, { type: 'SAVE_NEXT' }); // saving also locks in linear mode
    expect(s.entries[1].locked).toBe(true);
    expect(s.current).toBe(2);
    expect(r(s, { type: 'GOTO', index: 0 }).current).toBe(2);

    s = r(s, { type: 'QUESTION_TIME_UP' });
    expect(s.phase).toBe('submitting');
  });

  it('submission is one-way and idempotent', () => {
    let s = createExamState(session(2), {});
    s = r(s, { type: 'OPEN_SUBMIT' });
    expect(s.phase).toBe('confirming');
    s = r(s, { type: 'SUBMIT_START' });
    expect(r(s, { type: 'SUBMIT_START' })).toBe(s);
    s = r(s, { type: 'SUBMIT_SUCCESS', result: { score: 1 } });
    expect(s.phase).toBe('submitted');
    expect(r(s, { type: 'SELECT', optionId: opt(s, 0, 'a') }).entries[0].draft).toBeNull();
  });

  it('records time per question and counts statuses', () => {
    let s = createExamState(session(3), {});
    s = r(s, { type: 'TIME_SPENT', index: 0, ms: 12_340 });
    expect(toSubmission(s).responses[0].timeSpentSec).toBe(12.3);
    expect(statusCounts(s.entries)).toMatchObject({ NOT_ANSWERED: 1, NOT_VISITED: 2 });
  });
});

describe("mockExamReducer: I'm Stuck (Math only)", () => {
  const math = (n = 3, opts) => {
    const sess = session(n, opts);
    sess.config.subject = 'quant';
    return createExamState(sess, {});
  };
  const AT = '2026-11-24T10:00:00.000Z';

  it('is offered for Math (quant) only; older saved exams fall back to meta.subject', () => {
    expect(offersStuck(math())).toBe(true);
    const english = session(2);
    english.config.subject = 'english';
    expect(offersStuck(createExamState(english, {}))).toBe(false);
    expect(offersStuck({ config: {}, meta: { subject: 'quant' } })).toBe(true);
    let s = createExamState(english, {});
    s = r(s, { type: 'STUCK', at: AT });
    expect(s.entries[0].stuck).toBeNull();
  });

  it('records the time spent before getting stuck and when; keeps the first record', () => {
    let s = math();
    s = r(s, { type: 'TIME_SPENT', index: 0, ms: 42_000 });
    s = r(s, { type: 'STUCK', at: AT });
    expect(s.entries[0].stuck).toEqual({ reason: null, timeMs: 42_000, markedAt: AT });
    s = r(s, { type: 'TIME_SPENT', index: 0, ms: 10_000 });
    s = r(s, { type: 'STUCK', at: '2026-11-24T10:05:00.000Z' });
    expect(s.entries[0].stuck).toEqual({ reason: null, timeMs: 42_000, markedAt: AT });
  });

  it('is separate from the answer: status, answer and submission are unchanged, and answering is still allowed', () => {
    let s = math();
    s = r(s, { type: 'STUCK', at: AT });
    expect(statusOf(s.entries[0])).toBe(STATUS.NOT_ANSWERED);
    s = r(s, { type: 'SELECT', optionId: opt(s, 0, 'c') });
    s = r(s, { type: 'SAVE_NEXT' });
    expect(s.entries[0]).toMatchObject({ answer: opt(s, 0, 'c'), stuck: { markedAt: AT } });
    expect(statusOf(s.entries[0])).toBe(STATUS.ANSWERED);
    expect(stuckCount(s.entries)).toBe(1);
    expect(toSubmission(s).responses[0]).toEqual({
      questionId: s.questions[0].questionId,
      selectedOptionId: opt(s, 0, 'c'),
      timeSpentSec: 0,
      markedForReview: false,
      stuck: { reason: null, timeBeforeSec: 0, markedAt: AT },
    });
    expect(toSubmission(s).responses[1]).not.toHaveProperty('stuck'); // unchanged payload when not stuck
  });

  it('an optional reason can be set, changed or cleared; unknown reasons are ignored', () => {
    let s = math();
    s = r(s, { type: 'STUCK_REASON', reason: 'calculation' }); // not stuck yet: no-op
    expect(s.entries[0].stuck).toBeNull();
    s = r(s, { type: 'STUCK', at: AT, reason: 'method' });
    expect(s.entries[0].stuck.reason).toBe('method');
    s = r(s, { type: 'STUCK_REASON', reason: 'calculation' });
    expect(s.entries[0].stuck.reason).toBe('calculation');
    s = r(s, { type: 'STUCK_REASON', reason: 'hacking' });
    expect(s.entries[0].stuck.reason).toBeNull();
  });

  it('can be undone, follows the question it was set on, and is blocked while paused or locked', () => {
    let s = math();
    s = r(s, { type: 'STUCK', at: AT });
    s = r(s, { type: 'GOTO', index: 2 });
    expect(s.entries.map((e) => Boolean(e.stuck))).toEqual([true, false, false]);
    s = r(s, { type: 'GOTO', index: 0 });
    s = r(s, { type: 'UNSTUCK' });
    expect(s.entries[0].stuck).toBeNull();

    s = r(s, { type: 'PAUSE' });
    s = r(s, { type: 'STUCK', at: AT });
    expect(s.entries[0].stuck).toBeNull();

    let p = math(2, { perQuestion: true });
    p = r(p, { type: 'QUESTION_TIME_UP' }); // Q1 locks, Q2 opens
    p = r(p, { type: 'GOTO', index: 0 });
    p = r(p, { type: 'STUCK', at: AT });
    expect(p.entries[0].stuck).toBeNull();
    expect(p.entries[1].stuck).toEqual({ reason: null, timeMs: 0, markedAt: AT });
  });
});

describe('mockExamReducer: Check answer (custom tests)', () => {
  const verdict = (s, i, c, right) => ({ questionId: s.questions[i].questionId, selectedOptionId: opt(s, i, c), correctOptionId: opt(s, i, right), isCorrect: c === right, explanation: { steps: [], traps: [] } });

  it('a checked option becomes the final answer; it cannot be changed or cleared', () => {
    let s = createExamState(session(3), { custom: true });
    s = r(s, { type: 'SELECT', optionId: opt(s, 0, 'b') });
    s = r(s, { type: 'CHECKED', index: 0, result: verdict(s, 0, 'b', 'c') });
    expect(s.entries[0]).toMatchObject({ answer: opt(s, 0, 'b'), draft: opt(s, 0, 'b') });
    expect(s.entries[0].checked.isCorrect).toBe(false);
    expect(statusOf(s.entries[0])).toBe(STATUS.ANSWERED);
    expect(r(s, { type: 'SELECT', optionId: opt(s, 0, 'c') }).entries[0].draft).toBe(opt(s, 0, 'b'));
    expect(r(s, { type: 'CLEAR_RESPONSE' }).entries[0].answer).toBe(opt(s, 0, 'b'));
  });

  it('the student can still move on and come back to a checked question', () => {
    let s = createExamState(session(3), { custom: true });
    s = r(s, { type: 'SELECT', optionId: opt(s, 0, 'a') });
    s = r(s, { type: 'CHECKED', index: 0, result: verdict(s, 0, 'a', 'a') });
    s = r(s, { type: 'SAVE_NEXT' });
    expect(s.current).toBe(1);
    s = r(s, { type: 'GOTO', index: 0 });
    expect(s.current).toBe(0);
    expect(s.entries[0].answer).toBe(opt(s, 0, 'a'));
    expect(toSubmission(s).responses[0].selectedOptionId).toBe(opt(s, 0, 'a'));
  });

  it('answers checked on the server are restored, locked, waiting for their verdict', () => {
    const base = session(3);
    const s = createExamState({ ...base, custom: { checked: { [base.questions[2].questionId]: 'opt_2d00' } } }, { custom: true });
    expect(s.entries[2]).toMatchObject({ visited: true, answer: 'opt_2d00', checked: { selectedOptionId: 'opt_2d00', pending: true } });
    expect(s.entries[0].checked).toBeNull();
  });
});

import { describe, expect, it } from 'vitest';
import { STATUS, createExamState, mockExamReducer as r, statusCounts, statusOf, toSubmission } from '../features/mock/mockExamReducer';

const session = (n, { perQuestion = false, allowPause = true } = {}) => ({
  sessionId: 'a'.repeat(24),
  config: {
    questionCount: n,
    timeLimitMinutes: 10,
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

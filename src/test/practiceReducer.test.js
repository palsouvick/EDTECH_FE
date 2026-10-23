import { describe, expect, it } from 'vitest';
import {
  accuracyPct,
  initialPracticeState,
  practiceReducer as r,
  shouldPrefetch,
} from '../features/practice/practiceReducer';

const q = (id) => ({ questionId: id, options: [{ optionId: `${id}-a` }, { optionId: `${id}-b` }, { optionId: `${id}-c` }] });
const page = (ids, hasMore = true) => ({ type: 'PAGE_SUCCESS', questions: ids.map(q), nextCursor: hasMore ? 'c' : null, hasMore });

/** Answer the current question; `ok` decides the verify result. */
function answer(s, ok) {
  const cur = s.questions[s.index];
  s = r(s, { type: 'SELECT', optionId: cur.options[0].optionId });
  s = r(s, { type: 'CHECK_REQUEST' });
  return r(s, { type: 'CHECK_SUCCESS', result: { isCorrect: ok, correctOptionId: cur.options[0].optionId } });
}

const loaded = (n = 12, hasMore = false) =>
  r(r(initialPracticeState, { type: 'PAGE_REQUEST' }), page(Array.from({ length: n }, (_, i) => `q${i}`), hasMore));

describe('practiceReducer', () => {
  it('first page moves loading -> answering', () => {
    const s = loaded(3, true);
    expect(s.phase).toBe('answering');
    expect(s.loadingPage).toBe(false);
    expect(s.cursor).toBe('c');
  });

  it('only accepts selections of the current question while answering', () => {
    let s = loaded();
    s = r(s, { type: 'SELECT', optionId: 'nope' });
    expect(s.selected).toBeNull();
    s = r(s, { type: 'SELECT', optionId: 'q0-b' });
    expect(s.selected).toBe('q0-b');
    s = r(s, { type: 'CHECK_REQUEST' });
    s = r(s, { type: 'SELECT', optionId: 'q0-c' });
    expect(s.selected).toBe('q0-b'); // locked while checking
  });

  it('cannot check without a selection', () => {
    const s = r(loaded(), { type: 'CHECK_REQUEST' });
    expect(s.phase).toBe('answering');
  });

  it('arrow selection wraps around', () => {
    let s = loaded();
    s = r(s, { type: 'MOVE_SELECTION', delta: -1 });
    expect(s.selected).toBe('q0-c');
    s = r(s, { type: 'MOVE_SELECTION', delta: 1 });
    expect(s.selected).toBe('q0-a');
  });

  it('tracks answered, accuracy and the in-a-row streak', () => {
    let s = loaded();
    s = answer(s, true);
    s = r(s, { type: 'NEXT' });
    s = answer(s, true);
    expect(s.inARow).toBe(2);
    s = r(s, { type: 'NEXT' });
    s = answer(s, false);
    expect(s).toMatchObject({ answered: 3, correct: 2, inARow: 0 });
    expect(accuracyPct(s)).toBe(67);
  });

  it('a failed check returns to answering and keeps the selection', () => {
    let s = loaded();
    s = r(s, { type: 'SELECT', optionId: 'q0-a' });
    s = r(s, { type: 'CHECK_REQUEST' });
    s = r(s, { type: 'CHECK_FAILURE', error: new Error('offline') });
    expect(s).toMatchObject({ phase: 'answering', selected: 'q0-a', answered: 0 });
    expect(s.checkError).toBeInstanceOf(Error);
  });

  it('milestone after every 10th answer, shown on NEXT (after the explanation)', () => {
    let s = loaded(25, false);
    for (let i = 0; i < 10; i++) {
      s = answer(s, i !== 3);
      if (i < 9) s = r(s, { type: 'NEXT' });
    }
    expect(s.milestone).toBeNull();
    expect(s.pendingMilestone).toEqual({ count: 10, correct: 9 });
    s = r(s, { type: 'NEXT' });
    expect(s.milestone).toEqual({ count: 10, correct: 9 });
    s = r(s, { type: 'DISMISS_MILESTONE' });
    expect(s.milestone).toBeNull();
  });

  it('goal grows by 20 once reached', () => {
    let s = loaded(25, false);
    for (let i = 0; i < 20; i++) s = r(answer(s, true), { type: 'NEXT' });
    expect(s.goal).toBe(40);
  });

  it('prefetches when two or fewer questions remain, and dedupes pages', () => {
    let s = loaded(5, true);
    expect(shouldPrefetch(s)).toBe(false);
    for (let i = 0; i < 3; i++) s = r(answer(s, true), { type: 'NEXT' });
    expect(shouldPrefetch(s)).toBe(true);
    s = r(s, page(['q4', 'q5']));
    expect(s.questions.map((x) => x.questionId)).toEqual(['q0', 'q1', 'q2', 'q3', 'q4', 'q5']);
  });

  it('a page error is blocking only when nothing is left to answer', () => {
    let s = loaded(3, true);
    s = r(s, { type: 'PAGE_FAILURE', error: new Error('x') });
    expect(s.phase).toBe('answering');
    expect(r(initialPracticeState, { type: 'PAGE_FAILURE', error: new Error('x') }).phase).toBe('error');
  });

  it('finishes when the last question is done and nothing more exists', () => {
    let s = loaded(1, false);
    s = r(answer(s, true), { type: 'NEXT' });
    expect(s.phase).toBe('finished');
  });

  it('waits in loading when the buffer runs dry but more pages exist', () => {
    let s = loaded(1, true);
    s = r(answer(s, true), { type: 'NEXT' });
    expect(s.phase).toBe('loading');
    s = r(s, page(['q9'], false));
    expect(s.phase).toBe('answering');
    expect(s.questions[s.index].questionId).toBe('q9');
  });
});

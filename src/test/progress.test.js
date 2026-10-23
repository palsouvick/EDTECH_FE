import { describe, expect, it } from 'vitest';
import { EMPTY_PROGRESS, recordAttempt, viewProgress } from '../lib/progress';

describe('study progress', () => {
  it('counts attempts per day and starts a streak', () => {
    let r = recordAttempt(EMPTY_PROGRESS, '2026-10-14');
    r = recordAttempt(r, '2026-10-14');
    expect(viewProgress(r, '2026-10-14')).toEqual({ attemptedToday: 2, streak: 1, activeToday: true });
  });

  it('extends the streak on consecutive days, across month boundaries', () => {
    let r = recordAttempt(EMPTY_PROGRESS, '2026-09-30');
    r = recordAttempt(r, '2026-10-01');
    r = recordAttempt(r, '2026-10-02');
    expect(r.streak).toBe(3);
  });

  it('resets attempts at midnight but keeps the streak alive until a full day is missed', () => {
    const r = recordAttempt(EMPTY_PROGRESS, '2026-10-13');
    expect(viewProgress(r, '2026-10-14')).toEqual({ attemptedToday: 0, streak: 1, activeToday: false });
    expect(viewProgress(r, '2026-10-15').streak).toBe(0);
    expect(recordAttempt(r, '2026-10-16').streak).toBe(1);
  });
});

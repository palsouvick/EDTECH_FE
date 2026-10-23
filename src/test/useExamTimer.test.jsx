import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearExamTimers, formatClock, useExamTimer } from '../hooks/useExamTimer';

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'setTimeout', 'clearTimeout', 'Date'] });
  vi.setSystemTime(new Date('2026-10-14T09:00:00Z'));
});
afterEach(() => vi.useRealTimers());

const advance = (ms) => act(() => vi.advanceTimersByTime(ms));

describe('useExamTimer', () => {
  it('counts down once started and reports running time to onTick', () => {
    const onTick = vi.fn();
    const { result } = renderHook(() => useExamTimer({ storageKey: 't1', durationMs: 60_000, autoStart: true, onTick }));
    expect(result.current.status).toBe('running');
    advance(3000);
    expect(result.current.remainingMs).toBe(57_000);
    const elapsed = onTick.mock.calls.reduce((s, [, e]) => s + e, 0);
    expect(elapsed).toBe(3000);
  });

  it('pause freezes the clock; resume continues from the same point', () => {
    const { result } = renderHook(() => useExamTimer({ storageKey: 't2', durationMs: 60_000, autoStart: true }));
    advance(10_000);
    act(() => result.current.pause());
    advance(30_000);
    expect(result.current).toMatchObject({ status: 'paused', remainingMs: 50_000 });
    act(() => result.current.resume());
    advance(5000);
    expect(result.current.remainingMs).toBe(45_000);
  });

  it('a refresh while running resumes at the true remaining time (the clock keeps running while closed)', () => {
    const first = renderHook(() => useExamTimer({ storageKey: 't3', durationMs: 600_000, autoStart: true }));
    advance(60_000);
    first.unmount(); // "refresh"
    vi.setSystemTime(Date.now() + 20_000); // page closed for 20 s
    const second = renderHook(() => useExamTimer({ storageKey: 't3', durationMs: 600_000, autoStart: true }));
    expect(second.result.current.remainingMs).toBe(520_000);
    expect(second.result.current.status).toBe('running');
  });

  it('a refresh while paused restores the paused time exactly', () => {
    const first = renderHook(() => useExamTimer({ storageKey: 't4', durationMs: 120_000, autoStart: true }));
    advance(30_000);
    act(() => first.result.current.pause());
    first.unmount();
    vi.setSystemTime(Date.now() + 3600_000);
    const second = renderHook(() => useExamTimer({ storageKey: 't4', durationMs: 120_000, autoStart: true }));
    expect(second.result.current).toMatchObject({ status: 'paused', remainingMs: 90_000 });
  });

  it('fires onExpire exactly once, including when the deadline passed while the page was closed', () => {
    const onExpire = vi.fn();
    const first = renderHook(() => useExamTimer({ storageKey: 't5', durationMs: 5000, autoStart: true, onExpire }));
    first.unmount();
    vi.setSystemTime(Date.now() + 60_000);

    const second = renderHook(() => useExamTimer({ storageKey: 't5', durationMs: 5000, autoStart: true, onExpire }));
    expect(onExpire).toHaveBeenCalledTimes(1);
    expect(second.result.current).toMatchObject({ status: 'expired', remainingMs: 0 });
    advance(5000);
    second.unmount();

    renderHook(() => useExamTimer({ storageKey: 't5', durationMs: 5000, autoStart: true, onExpire }));
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it('switching storageKey switches countdown (per-question timers)', () => {
    let key = 'q0';
    const { result, rerender } = renderHook(() => useExamTimer({ storageKey: key, durationMs: 45_000, autoStart: true }));
    advance(10_000);
    key = 'q1';
    rerender();
    expect(result.current.remainingMs).toBe(45_000); // fresh 45 s, no flash of the old value
    advance(5000);
    expect(result.current.remainingMs).toBe(40_000);
  });

  it('clearExamTimers removes every countdown of one test', () => {
    renderHook(() => useExamTimer({ storageKey: 'mock:abc:q0', durationMs: 1000, autoStart: true }));
    renderHook(() => useExamTimer({ storageKey: 'mock:xyz:q0', durationMs: 1000, autoStart: true }));
    clearExamTimers('mock:abc:');
    expect(localStorage.getItem('edtech:timer:mock:abc:q0')).toBeNull();
    expect(localStorage.getItem('edtech:timer:mock:xyz:q0')).not.toBeNull();
  });
});

describe('formatClock', () => {
  it('formats hh:mm:ss, rounding partial seconds up', () => {
    expect(formatClock(3725_000)).toBe('01:02:05');
    expect(formatClock(299_001)).toBe('00:05:00');
    expect(formatClock(0)).toBe('00:00:00');
    expect(formatClock(45_000, { compact: true })).toBe('00:45');
  });
});

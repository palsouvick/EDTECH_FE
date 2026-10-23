import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Exam countdown that survives refreshes, tab switches and sleep.
 *
 * It is deadline-based: while running, what is stored is `endsAt` (an epoch
 * time), not "seconds left". Remaining time is always `endsAt - now`, so:
 *   - a refresh resumes at the true remaining time (time keeps running while
 *     the page is closed, as in a real exam hall);
 *   - background tabs, whose intervals browsers throttle, never drift;
 *   - reloading after the deadline expires immediately and fires onExpire.
 * While paused, `remainingMs` is stored instead and does not decrease.
 *
 * Persisted in localStorage under `storageKey` (synchronous, so the first
 * render already shows the recovered time).
 *
 * @param {object} p
 * @param {string}  p.storageKey   one key per countdown (e.g. `mock:<id>:overall`)
 * @param {number}  p.durationMs   used when nothing is stored yet
 * @param {boolean} [p.autoStart]  start on mount / key change if idle
 * @param {number}  [p.tickMs=250]
 * @param {(remainingMs: number, elapsedMs: number) => void} [p.onTick]  elapsedMs = running time since last tick
 * @param {() => void} [p.onExpire]  fires once per countdown
 */

const PREFIX = 'edtech:timer:';

function load(key) {
  try {
    const v = JSON.parse(localStorage.getItem(PREFIX + key));
    return v && typeof v === 'object' && Number.isFinite(v.durationMs) ? v : null;
  } catch {
    return null;
  }
}

function save(key, state) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(state));
  } catch {
    /* quota / private mode: the in-memory timer still works */
  }
}

/** Remove persisted countdowns. Pass a prefix ("mock:<id>:") to clear every timer of one test. */
export function clearExamTimers(keyPrefix) {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k?.startsWith(PREFIX + keyPrefix)) localStorage.removeItem(k);
    }
  } catch {
    /* ignore */
  }
}

const fresh = (durationMs) => ({ durationMs, remainingMs: durationMs, endsAt: null, started: false, expired: false });

function remainingOf(s, now = Date.now()) {
  if (s.expired) return 0;
  return s.endsAt != null ? Math.max(0, s.endsAt - now) : s.remainingMs;
}

function statusOf(s) {
  if (s.expired) return 'expired';
  if (s.endsAt != null) return 'running';
  return s.started ? 'paused' : 'idle';
}

export function useExamTimer({ storageKey, durationMs, autoStart = false, tickMs = 250, onTick, onExpire }) {
  const stateRef = useRef(null);
  const keyRef = useRef(null);
  const expiredFired = useRef(false);
  const lastTick = useRef(Date.now());
  const callbacks = useRef({ onTick, onExpire });
  callbacks.current = { onTick, onExpire };

  // (Re)load synchronously when the key changes, so the first paint is already correct.
  if (keyRef.current !== storageKey) {
    keyRef.current = storageKey;
    stateRef.current = load(storageKey) ?? fresh(durationMs);
    expiredFired.current = stateRef.current.expired;
    lastTick.current = Date.now();
  }

  const [, setVersion] = useState(0);
  const [remainingMs, setRemaining] = useState(() => remainingOf(stateRef.current));
  const rerender = () => setVersion((v) => v + 1);

  const commit = useCallback((next) => {
    stateRef.current = next;
    save(keyRef.current, next);
    setRemaining(remainingOf(next));
    rerender();
  }, []);

  const expire = useCallback(() => {
    if (expiredFired.current) return;
    expiredFired.current = true;
    commit({ ...stateRef.current, endsAt: null, remainingMs: 0, expired: true });
    callbacks.current.onExpire?.();
  }, [commit]);

  const start = useCallback(() => {
    const s = stateRef.current;
    if (s.expired || s.endsAt != null) return;
    lastTick.current = Date.now();
    commit({ ...s, started: true, endsAt: Date.now() + s.remainingMs });
  }, [commit]);

  const pause = useCallback(() => {
    const s = stateRef.current;
    if (s.endsAt == null || s.expired) return;
    commit({ ...s, remainingMs: remainingOf(s), endsAt: null });
  }, [commit]);

  const resume = start;

  const reset = useCallback(
    (nextDurationMs = durationMs) => {
      expiredFired.current = false;
      commit(fresh(nextDurationMs));
    },
    [commit, durationMs],
  );

  const tick = useCallback(() => {
    const s = stateRef.current;
    if (s.endsAt == null || s.expired) return;
    const now = Date.now();
    const left = Math.max(0, s.endsAt - now);
    const elapsed = Math.max(0, now - lastTick.current);
    lastTick.current = now;
    setRemaining(left);
    callbacks.current.onTick?.(left, elapsed);
    if (left === 0) expire();
  }, [expire]);

  // Key change: show the recovered time, catch an expiry that happened while away, auto-start.
  useEffect(() => {
    const s = stateRef.current;
    setRemaining(remainingOf(s));
    rerender();
    if (s.expired) return;
    if (s.endsAt != null && s.endsAt <= Date.now()) expire();
    else if (autoStart && statusOf(s) === 'idle') start();
  }, [storageKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const status = statusOf(stateRef.current);

  useEffect(() => {
    if (status !== 'running') return undefined;
    const id = setInterval(tick, tickMs);
    // Intervals are throttled in background tabs; re-sync the moment the tab is visible again.
    const onVisible = () => document.visibilityState === 'visible' && tick();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [status, tick, tickMs]);

  // Derived at render rather than read from state: right after a key change the
  // state still holds the previous countdown's value for one frame.
  void remainingMs; // state exists to schedule re-renders on each tick
  return { remainingMs: remainingOf(stateRef.current), status, running: status === 'running', start, pause, resume, reset };
}

/** 3725000 -> "01:02:05"; under an hour with `compact` -> "02:05". */
export function formatClock(ms, { compact = false } = {}) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return compact && h === 0 ? `${pad(m)}:${pad(s)}` : `${pad(h)}:${pad(m)}:${pad(s)}`;
}

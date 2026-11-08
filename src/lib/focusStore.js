import { useSyncExternalStore } from 'react';

/**
 * Focus Mode: while it is on, pages hide the site header and footer and show only the focus
 * bar (timer, questions solved, accuracy). Practice and plan tests report each checked answer
 * here. Kept in sessionStorage so a reload or moving between pages keeps the session.
 *
 *   { active: false } | { active: true, startedAt: ms, answered, correct }
 */
const KEY = 'edtech:focus';
const OFF = Object.freeze({ active: false });

const read = () => {
  try {
    const v = JSON.parse(sessionStorage.getItem(KEY));
    return v?.active && Number.isFinite(v.startedAt) ? v : OFF;
  } catch {
    return OFF;
  }
};

let state = read();
const listeners = new Set();
const set = (next) => {
  state = next;
  try {
    if (next.active) sessionStorage.setItem(KEY, JSON.stringify(next));
    else sessionStorage.removeItem(KEY);
  } catch {
    /* private mode: focus lasts for this page */
  }
  for (const l of listeners) l();
};

export const focusStore = {
  get: () => state,
  subscribe(l) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  start(now = Date.now()) {
    if (!state.active) set({ active: true, startedAt: now, answered: 0, correct: 0 });
  },
  /** One checked answer (ignored when Focus Mode is off). */
  record(isCorrect) {
    if (state.active) set({ ...state, answered: state.answered + 1, correct: state.correct + (isCorrect ? 1 : 0) });
  },
  /** Ends the session and returns its summary. */
  stop(now = Date.now()) {
    if (!state.active) return null;
    const { startedAt, answered, correct } = state;
    set(OFF);
    return { minutes: Math.max(0, Math.round((now - startedAt) / 60_000)), answered, correct, accuracy: answered ? Math.round((correct / answered) * 100) : null };
  },
};

export const useFocus = () => useSyncExternalStore(focusStore.subscribe, focusStore.get, focusStore.get);

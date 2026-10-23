/**
 * Daily attempts and streak, as pure functions over a small persisted record:
 *   { day: 'YYYY-MM-DD', attemptedToday: number, lastActiveDay: 'YYYY-MM-DD'|null, streak: number }
 *
 * Days are local calendar days (an IST student studying at 00:30 is on the new day).
 */

export const EMPTY_PROGRESS = Object.freeze({ day: null, attemptedToday: 0, lastActiveDay: null, streak: 0 });

/** Local-time YYYY-MM-DD. */
export function dayKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function previousDay(key) {
  const [y, m, d] = key.split('-').map(Number);
  return dayKey(new Date(y, m - 1, d - 1));
}

/** What to show right now: attempts reset at midnight, a missed day breaks the streak. */
export function viewProgress(record, today = dayKey()) {
  const r = record || EMPTY_PROGRESS;
  const attemptedToday = r.day === today ? r.attemptedToday : 0;
  const alive = r.lastActiveDay === today || r.lastActiveDay === previousDay(today);
  return { attemptedToday, streak: alive ? r.streak : 0, activeToday: r.lastActiveDay === today };
}

/** Record one answered question. The first attempt of a day extends or restarts the streak. */
export function recordAttempt(record, today = dayKey()) {
  const r = record || EMPTY_PROGRESS;
  let streak = r.streak;
  if (r.lastActiveDay !== today) {
    streak = r.lastActiveDay === previousDay(today) ? r.streak + 1 : 1;
  }
  return {
    day: today,
    attemptedToday: (r.day === today ? r.attemptedToday : 0) + 1,
    lastActiveDay: today,
    streak,
  };
}

export function isProgressRecord(v) {
  return v && typeof v === 'object' && Number.isFinite(v.attemptedToday) && Number.isFinite(v.streak);
}

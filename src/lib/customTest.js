/**
 * Pure helpers for the custom chapter test setup (unit-tested in src/test/customTest.test.jsx).
 * The server decides the final split and picks the questions; these only drive the popup.
 */

export const COUNT_CHOICES = Object.freeze([10, 20, 30, 40, 50]);
export const TIME_CHOICES = Object.freeze([10, 15, 20, 30, 45, 60]);
export const DIFFICULTY_ORDER = Object.freeze(['easy', 'moderate', 'hard', 'exam', 'mixed']);
export const MIN_Q = 5;
export const MAX_Q = 100;

/** Defaults that let a student press Start straight away: exam level, smart split, exam mode. */
export const DEFAULTS = Object.freeze({ difficulty: 'exam', distribution: 'smart', mode: 'exam', time: 'smart' });

/** 1–2 chapters -> 20 questions, 3 or more -> 30. */
export const defaultCount = (chapters) => (chapters >= 3 ? 30 : 20);

/** Minutes for n questions at the server's seconds-per-question (same rule as the backend). */
export function smartMinutes(secondsPerQuestion, difficulty, n) {
  const sec = secondsPerQuestion?.[difficulty] ?? 60;
  return Math.max(5, Math.ceil((n * sec) / 60));
}

/** A typed custom count, or null when it is not a whole number between 5 and 100. */
export function parseCount(text) {
  if (!/^\d{1,3}$/.test(String(text).trim())) return null;
  const n = Number(text);
  return n >= MIN_Q && n <= MAX_Q ? n : null;
}

/** The POST /custom-tests body for the popup state. */
export function buildRequest(subject, s, language) {
  const body = {
    subject,
    preset: s.preset ?? 'custom',
    topics: [...s.topics],
    difficulty: s.difficulty,
    distribution: s.distribution,
    mode: s.mode,
    language,
  };
  if (s.preset !== 'quick10') body.questionCount = s.count;
  if (s.time === 'unlimited') body.timeLimitMinutes = null;
  else if (typeof s.time === 'number') body.timeLimitMinutes = s.time;
  if (s.followUpOf) body.followUpOf = s.followUpOf;
  return body;
}

/** Chapters ordered for the picker: those with questions first, in Learn order. */
export const pickable = (chapters) => chapters.filter((c) => c.available?.total > 0);

export const pctBand = (n) => (n == null ? null : n >= 80 ? 'strong' : n >= 60 ? 'practice' : 'weak');

/** Same seconds-per-question as the server (customTest.logic.js), for screens without the options call. */
export const SECONDS_PER_QUESTION = Object.freeze({
  quant: { easy: 45, moderate: 70, hard: 100, exam: 75, mixed: 70 },
  english: { easy: 25, moderate: 35, hard: 50, exam: 40, mixed: 36 },
  gs: { easy: 20, moderate: 30, hard: 40, exam: 36, mixed: 30 },
});
export const MASTERY_QUESTIONS = 20;

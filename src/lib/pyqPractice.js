/**
 * Pure helpers for the subject-wise PYQ practice setup (unit-tested in
 * src/test/pyqPractice.test.jsx). The server decides the final count and picks
 * the questions; these only drive the popup.
 */

export const PYQ_SUBJECTS = Object.freeze([
  { code: 'quant', emoji: '🧮' },
  { code: 'english', emoji: '📖' },
  { code: 'gs', emoji: '🌍' },
]);

/** The only exams with real papers in the bank — never offer any other exam. */
export const PYQ_EXAMS = Object.freeze(['WBCS (Exe.) Prelims', 'WBPSC Clerkship (Part-I)', 'Industrial Development Officer']);

export const PYQ_COUNT_CHOICES = Object.freeze([10, 20, 30, 50, 75, 100]);
export const PYQ_TIME_CHOICES = Object.freeze([10, 20, 30, 45, 60]);
export const PYQ_REPEAT_MODES = Object.freeze(['all', 'unattempted', 'wrong', 'bookmarked']);
export const MIN_Q = 5;
export const MAX_Q = 100;

/** Live available counts per subject, from /pyq/filters topics[] grouped by subject. */
export function subjectCounts(topics = []) {
  const counts = { quant: 0, english: 0, gs: 0 };
  for (const t of topics) if (counts[t.subject] !== undefined) counts[t.subject] += t.count;
  return counts;
}

/** The exams the filters actually have, in canonical order (never any other exam). */
export function examOptions(filters) {
  if (!filters?.exams) return [];
  const have = new Map(filters.exams.map((e) => [e.name, e]));
  return PYQ_EXAMS.filter((name) => have.has(name)).map((name) => have.get(name));
}

/** Years available for one exam (or every exam when exam is null), newest first. */
export function yearsFor(filters, exam) {
  const exams = exam ? (filters?.exams ?? []).filter((e) => e.name === exam) : (filters?.exams ?? []);
  const years = new Set();
  for (const e of exams) for (const y of e.years ?? []) years.add(y);
  return [...years].sort((a, b) => b - a);
}

/** Minutes for n questions: at least 10 seconds per question. */
export const minMinutes = (count) => Math.ceil(count / 6);

/** A typed custom time, or null when it is not a whole number of minutes that allows 10s/question. */
export function parseMinutes(text, count) {
  if (!/^\d{1,3}$/.test(String(text).trim())) return null;
  const n = Number(text);
  return n >= 1 && n <= 300 && n >= minMinutes(count) ? n : null;
}

/** The POST /custom-tests body for the PYQ setup state. */
export function buildPyqRequest(subject, s, language) {
  const body = {
    subject,
    preset: 'pyq',
    questionCount: s.count,
    difficulty: s.difficulty,
    mode: 'exam',
    language,
    repeatMode: s.repeat,
  };
  if (s.exam) body.pyqExam = s.exam;
  if (s.yearMode === 'recent') body.pyqYear = 'recent';
  else if (s.yearMode === 'one' && s.year != null) body.pyqYear = s.year;
  else if (s.yearMode === 'range') {
    if (s.yearFrom != null) body.pyqYearFrom = s.yearFrom;
    if (s.yearTo != null) body.pyqYearTo = s.yearTo;
  }
  if (s.time === 'custom') body.timeLimitMinutes = s.customMinutes;
  else body.timeLimitMinutes = s.time;
  return body;
}

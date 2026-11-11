/**
 * Reading progress for the study books. Signed-in students' progress lives on the server (/books/:book/progress);
 * guests keep the same shape in localStorage, and it is sent to the server once they sign in.
 *
 * Shape: { depth, last: { chapter, section, at } | null, chapters: { "HIS-02": { read: [sid], last_section,
 *          practice: { best, last, attempts }, mini: { best, last, attempts }, sections: { sid: { correct, total } } } } }
 */

export const MASTERED_FROM = 70; // mini-test accuracy (%) that counts as mastered
export const WEAK_BELOW = 60; // section accuracy (%) below which a section is weak
const KEY = (book) => `edtech:book:${book}`;

export const emptyProgress = () => ({ depth: 'standard', last: null, chapters: {} });

export function readLocal(book) {
  try {
    const v = JSON.parse(localStorage.getItem(KEY(book)));
    return v && typeof v === 'object' ? { ...emptyProgress(), ...v } : emptyProgress();
  } catch {
    return emptyProgress();
  }
}

export function writeLocal(book, value) {
  try {
    localStorage.setItem(KEY(book), JSON.stringify(value));
  } catch {
    /* storage full or blocked: progress just is not kept */
  }
}

export function clearLocal(book) {
  try {
    localStorage.removeItem(KEY(book));
  } catch {
    /* ignore */
  }
}

/** Marks sections read and the place the student stopped (pure). */
export function withReading(progress, { chapter, read = [], section, depth }) {
  const cur = progress.chapters[chapter] || { read: [], sections: {} };
  const next = { ...cur, read: [...new Set([...(cur.read || []), ...read])], last_section: section ?? cur.last_section ?? null };
  return {
    ...progress,
    depth: depth || progress.depth,
    last: section !== undefined ? { chapter, section, at: new Date().toISOString() } : progress.last,
    chapters: { ...progress.chapters, [chapter]: next },
  };
}

/** Adds a finished practice session or mini test (pure; same rules as the server). */
export function withResult(progress, { chapter, mode, correct, total, bySection }) {
  const cur = progress.chapters[chapter] || { read: [], sections: {} };
  const key = mode === 'mini' ? 'mini' : 'practice';
  const prev = cur[key];
  const now = new Date().toISOString();
  const better = !prev?.best || correct / total > prev.best.correct / prev.best.total;
  const sections = { ...(cur.sections || {}) };
  for (const [sid, r] of Object.entries(bySection || {})) {
    const s = sections[sid] || { correct: 0, total: 0 };
    sections[sid] = { correct: s.correct + r.correct, total: s.total + r.total };
  }
  return {
    ...progress,
    chapters: {
      ...progress.chapters,
      [chapter]: { ...cur, [key]: { best: better ? { correct, total, at: now } : prev.best, last: { correct, total, at: now }, attempts: (prev?.attempts || 0) + 1 }, sections },
    },
  };
}

const pct = (c, t) => (t ? Math.round((100 * c) / t) : 0);

/**
 * A chapter's state: not_started → reading → read (every section) → tested (mini test taken) → mastered
 * (best mini test ≥ 70%). `percent` is the share of sections read.
 */
export function chapterStatus(chapter, entry) {
  const total = chapter.sections.length;
  const read = (entry?.read || []).filter((id) => chapter.sections.some((s) => s.id === id)).length;
  const best = entry?.mini?.best;
  let status = 'not_started';
  if (read > 0) status = 'reading';
  if (total && read >= total) status = 'read';
  if (best) status = pct(best.correct, best.total) >= MASTERED_FROM ? 'mastered' : 'tested';
  return { status, read, total, percent: pct(read, total), miniBest: best ? pct(best.correct, best.total) : null };
}

/** Whole-book summary over the chapters that can be read now, plus where to continue. */
export function bookSummary(book, progress) {
  const available = book.chapters.filter((c) => c.available);
  let read = 0;
  let total = 0;
  const statuses = {};
  for (const c of available) {
    const s = chapterStatus(c, progress.chapters[c.code]);
    statuses[c.code] = s;
    read += s.read;
    total += s.total;
  }
  const lastChapter = progress.last?.chapter && available.find((c) => c.code === progress.last.chapter);
  let resume = null;
  if (lastChapter) {
    resume = { chapter: lastChapter, section: lastChapter.sections.find((s) => s.id === progress.last.section) || null };
    // A finished chapter sends the student on to the next one that is not finished.
    if (statuses[lastChapter.code].status !== 'reading' && statuses[lastChapter.code].status !== 'not_started') {
      const next = available.find((c) => c.number > lastChapter.number && ['not_started', 'reading'].includes(statuses[c.code].status));
      if (next) resume = { chapter: next, section: null };
    }
  } else if (available.length) {
    resume = { chapter: available[0], section: null, first: true };
  }
  return {
    percent: pct(read, total),
    sectionsRead: read,
    sectionsTotal: total,
    chaptersAvailable: available.length,
    chaptersTotal: book.chapters.length,
    chaptersDone: Object.values(statuses).filter((s) => ['read', 'tested', 'mastered'].includes(s.status)).length,
    statuses,
    resume,
  };
}

/** Sections with enough answers and low accuracy, weakest first. */
export function weakSections(sectionsStats, headings, { minAnswers = 2 } = {}) {
  return Object.entries(sectionsStats || {})
    .filter(([, r]) => r.total >= minAnswers && pct(r.correct, r.total) < WEAK_BELOW)
    .map(([id, r]) => ({ id, heading: headings[id] || id, accuracy: pct(r.correct, r.total), correct: r.correct, total: r.total }))
    .sort((a, b) => a.accuracy - b.accuracy);
}

/** Per-section totals from a list of checked answers ({ section, isCorrect }). */
export function tally(checked) {
  const bySection = {};
  for (const a of checked) {
    if (!a.section) continue;
    const s = (bySection[a.section] ||= { correct: 0, total: 0 });
    s.total += 1;
    if (a.isCorrect) s.correct += 1;
  }
  return { correct: checked.filter((a) => a.isCorrect).length, total: checked.length, bySection };
}

import { preferencesAllowed } from './consent';

/**
 * Learn progress on this device, under one key:
 *   { "<subject>.<topic>.<level>": { seen: [questionId...], best: { correct, total } } }
 * `seen` is sent with the next quiz request so a repeat attempt gets new
 * questions. Kept only when the visitor allows preference storage.
 */
export const LEARN_STORAGE_KEY = 'edtech:learn';
const MAX_SEEN = 500;
const MAX_RECENT_PATTERNS = 30;

function readAll() {
  try {
    const v = JSON.parse(window.localStorage.getItem(LEARN_STORAGE_KEY));
    return v && typeof v === 'object' ? v : {};
  } catch {
    return {};
  }
}

function writeAll(all) {
  if (!preferencesAllowed()) return;
  try {
    window.localStorage.setItem(LEARN_STORAGE_KEY, JSON.stringify(all));
  } catch {
    /* storage full or blocked: progress applies to this visit only */
  }
}

const keyOf = (subject, topic, level) => `${subject}.${topic}.${level}`;

export function levelProgress(subject, topic, level) {
  const p = readAll()[keyOf(subject, topic, level)];
  return {
    seen: Array.isArray(p?.seen) ? p.seen : [],
    fingerprints: Array.isArray(p?.fingerprints) ? p.fingerprints : [],
    patterns: Array.isArray(p?.patterns) ? p.patterns : [],
    best: p?.best ?? null,
  };
}

const lessonKeyOf = (subject, topic) => `_lesson.${subject}.${topic}`;

/** Reading position, completion, and saved lesson items for one chapter. */
export function lessonProgress(subject, topic) {
  const p = readAll()[lessonKeyOf(subject, topic)];
  return {
    section: typeof p?.section === 'string' ? p.section : 'basic',
    completed: p?.completed === true,
    bookmarks: Array.isArray(p?.bookmarks) ? p.bookmarks : [],
  };
}

export function updateLessonProgress(subject, topic, patch) {
  const all = readAll();
  const key = lessonKeyOf(subject, topic);
  all[key] = { ...lessonProgress(subject, topic), ...patch };
  writeAll(all);
  return all[key];
}

export function toggleLessonBookmark(subject, topic, bookmarkId) {
  const current = lessonProgress(subject, topic).bookmarks;
  const bookmarks = current.includes(bookmarkId)
    ? current.filter((id) => id !== bookmarkId)
    : [...current, bookmarkId];
  return updateLessonProgress(subject, topic, { bookmarks });
}

/** After a quiz: remember its questions as seen (restarting the cycle if asked) and keep the best score. */
export function recordQuiz(subject, topic, level, { questionIds, fingerprints = [], patterns = [], restarted, correct, total }) {
  const all = readAll();
  const k = keyOf(subject, topic, level);
  const prev = all[k] || {};
  const seen = [...(restarted ? [] : prev.seen || []), ...questionIds].slice(-MAX_SEEN);
  const recentFingerprints = [...(restarted ? [] : prev.fingerprints || []), ...fingerprints].slice(-MAX_SEEN);
  const recentPatterns = [...(restarted ? [] : prev.patterns || []), ...patterns].slice(-MAX_RECENT_PATTERNS);
  const better = !prev.best || correct / total > prev.best.correct / prev.best.total;
  all[k] = {
    seen,
    fingerprints: recentFingerprints,
    patterns: recentPatterns,
    best: better ? { correct, total } : prev.best,
  };
  writeAll(all);
}

/** A level counts as cleared once its best score reaches this share. */
export const PASS_RATIO = 0.6;
export const levelCleared = (best) => Boolean(best) && best.correct / best.total >= PASS_RATIO;

const LAST_KEY = '_last';

/** The chapter opened most recently, for the "Continue" button on Learn Basics. */
export function rememberChapter(subject, topic, title) {
  const all = readAll();
  all[LAST_KEY] = { subject, topic, title };
  writeAll(all);
}

export function lastChapter() {
  const v = readAll()[LAST_KEY];
  return v?.subject && v?.topic ? v : null;
}

// ---- Account sync ---------------------------------------------------------
// A signed-in student's progress is also kept on the server (PUT/GET /learn/progress),
// so it follows them to another device. Merging keeps the better best score and the
// union of seen questions; the server applies the same rule.

const LEVEL_KEY_RE = /^([a-z0-9_]+)\.([a-z0-9_]+)\.(beginner|intermediate|advanced)$/;
const SYNC_BATCH = 5; // entries per request, so a request stays well under the API's body limit

const betterBest = (a, b) => {
  if (!a) return b || null;
  if (!b) return a;
  return b.correct / b.total > a.correct / a.total ? b : a;
};
const unionTail = (a = [], b = [], max) => [...new Set([...a, ...b])].slice(-max);

/** One level's local progress in the API's entry shape. */
export function entryFor(subject, topic, level) {
  const p = levelProgress(subject, topic, level);
  return { subject, topic, level, best: p.best, seen: p.seen, fingerprints: p.fingerprints, patterns: p.patterns };
}

/** Every level stored on this device, as API entries. */
export function localEntries() {
  return Object.keys(readAll())
    .map((k) => LEVEL_KEY_RE.exec(k))
    .filter(Boolean)
    .map(([, subject, topic, level]) => entryFor(subject, topic, level));
}

/** Folds the account's progress into this device's copy. */
export function mergeServerProgress(progress = {}) {
  const all = readAll();
  for (const [k, server] of Object.entries(progress)) {
    if (!LEVEL_KEY_RE.test(k)) continue;
    const local = all[k] || {};
    all[k] = {
      seen: unionTail(local.seen, server.seen, MAX_SEEN),
      fingerprints: unionTail(local.fingerprints, server.fingerprints, MAX_SEEN),
      patterns: unionTail(local.patterns, server.patterns, MAX_RECENT_PATTERNS),
      best: betterBest(local.best ?? null, server.best ?? null),
    };
  }
  writeAll(all);
}

/** Uploads this device's progress, then merges the account's copy back. Never throws. */
export async function syncLearnProgress(source) {
  if (!source?.getLearnProgress) return;
  try {
    const entries = localEntries();
    let progress = null;
    for (let i = 0; i < entries.length; i += SYNC_BATCH) {
      progress = (await source.putLearnProgress(entries.slice(i, i + SYNC_BATCH))).progress;
    }
    if (!progress) progress = (await source.getLearnProgress()).progress;
    mergeServerProgress(progress);
  } catch {
    /* offline or signed out meanwhile: this device's copy still works */
  }
}

/** After a quiz, save that level to the account (fire and forget). */
export function pushLevel(source, subject, topic, level) {
  if (!source?.putLearnProgress) return;
  source.putLearnProgress([entryFor(subject, topic, level)]).catch(() => {});
}

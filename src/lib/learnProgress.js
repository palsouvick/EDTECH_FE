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

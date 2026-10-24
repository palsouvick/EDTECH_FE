import { request } from './api';

/**
 * A practice source is what the arena talks to:
 *   fetchPage({ cursor, language, limit }) -> { questions, nextCursor, hasMore }
 *   verify({ questionId, selectedOptionId, timeSpentSec }) -> verify-answer payload
 *   setBookmark(questionId, on) -> void
 *   report({ questionId, reason, message?, language }) -> { duplicate }
 */
export function createHttpPracticeSource({ category, subject, topic, pattern }) {
  return {
    fetchPage({ cursor, language, limit }) {
      // pattern: only that question pattern ("practise successive % change").
      const qs = new URLSearchParams({ category, subject, topic, language, limit: String(limit), ...(pattern && { pattern }) });
      if (cursor) qs.set('cursor', cursor);
      return request(`/practice/questions?${qs}`);
    },
    verify(body) {
      return request('/practice/verify-answer', { method: 'POST', body: { ...body, category } });
    },
    setBookmark(questionId, on) {
      return request(`/practice/bookmarks/${questionId}`, { method: on ? 'PUT' : 'DELETE' });
    },
    report(body) {
      return request('/practice/report-error', { method: 'POST', body });
    },
  };
}

const BOOKMARKS_KEY = 'edtech:fixture-bookmarks';
const readBookmarks = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(BOOKMARKS_KEY)) || []);
  } catch {
    return new Set();
  }
};

/**
 * Offline source over fixture questions, with the same response shapes as the
 * API. `latencyMs` simulates the network so loading states can be seen.
 */
export function createFixturePracticeSource(bank, { latencyMs = 250 } = {}) {
  const wait = () => new Promise((r) => setTimeout(r, latencyMs));
  const byId = new Map(bank.map((q) => [q.questionId, q]));

  const toPublic = (q, bookmarks) => ({
    questionId: q.questionId,
    topic: q.topic,
    subtopic: null,
    languages: Object.keys(q.stem),
    stem: q.stem,
    media: [],
    options: q.options,
    pyq: q.pyq,
    bookmarked: bookmarks.has(q.questionId),
  });

  return {
    async fetchPage({ cursor, limit }) {
      await wait();
      const start = cursor ? Number(cursor) : 0;
      const bookmarks = readBookmarks();
      const slice = bank.slice(start, start + limit).map((q) => toPublic(q, bookmarks));
      const end = start + slice.length;
      return { questions: slice, nextCursor: end < bank.length ? String(end) : null, hasMore: end < bank.length };
    },

    async verify({ questionId, selectedOptionId }) {
      await wait();
      const q = byId.get(questionId);
      const isCorrect = selectedOptionId === q.correctOptionId;
      return {
        questionId,
        selectedOptionId,
        isCorrect,
        correctOptionId: q.correctOptionId,
        explanation: { languages: Object.keys(q.steps[0] || {}), items: q.steps },
        shortcut: q.shortcut ?? null,
        trapForSelected: isCorrect ? null : (q.traps?.[selectedOptionId] ?? null),
        commonTraps: [],
        stats: {
          attempts: q.stats.attempts,
          percentCorrect: Math.round((q.stats.correct / q.stats.attempts) * 1000) / 10,
          avgTimeSec: null,
        },
      };
    },

    async setBookmark(questionId, on) {
      await wait();
      const set = readBookmarks();
      if (on) set.add(questionId);
      else set.delete(questionId);
      try {
        localStorage.setItem(BOOKMARKS_KEY, JSON.stringify([...set]));
      } catch {
        /* in-memory only */
      }
    },

    async report(payload) {
      await wait();
      console.info('[fixture] report-error', payload);
      return { reportId: null, duplicate: false };
    },
  };
}

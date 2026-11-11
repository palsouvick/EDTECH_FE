import { request } from './api';

/**
 * Study books ("Learn like a book") over the API: table of contents, chapters, progress and practice.
 * `preview` asks for DRAFT chapters; the server honours it for admins only (the owner's review).
 */
const q = (preview) => (preview ? '?preview=1' : '');

export const bookApi = {
  getBook: (book, { preview = false } = {}) => request(`/books/${book}${q(preview)}`),
  getBookChapter: (book, code, { preview = false } = {}) => request(`/books/${book}/chapters/${code}${q(preview)}`),
  getBookProgress: (book) => request(`/books/${book}/progress`),
  saveBookReading: (book, body) => request(`/books/${book}/progress`, { method: 'PUT', body }),
  saveBookResult: (book, body) => request(`/books/${book}/results`, { method: 'POST', body }),
};

/**
 * Practice-arena source over one chapter's questions (mode: practice | mini | weak | pyq). Every checked answer
 * is passed to `onChecked({ questionId, section, level, isCorrect })`, which is how the chapter page builds the
 * weak-section analysis, for guests too.
 */
export function createBookPracticeSource(book, code, { mode = 'practice', sections = [], preview = false, onChecked } = {}) {
  const meta = new Map();
  const params = new URLSearchParams({ mode });
  if (sections.length) params.set('sections', sections.join(','));
  if (preview) params.set('preview', '1');
  return {
    async fetchPage() {
      const { questions } = await request(`/books/${book}/chapters/${code}/questions?${params}`);
      for (const x of questions) meta.set(x.questionId, x.book);
      return { questions, nextCursor: null, hasMore: false };
    },
    async verify(body) {
      const result = await request(`/books/${book}/chapters/${code}/verify${preview ? '?preview=1' : ''}`, { method: 'POST', body });
      const m = meta.get(body.questionId) || {};
      onChecked?.({ questionId: body.questionId, section: m.section, level: m.level, isCorrect: result.isCorrect });
      return result;
    },
    setBookmark(questionId, on) {
      return request(`/practice/bookmarks/${questionId}`, { method: on ? 'PUT' : 'DELETE' });
    },
    report(body) {
      return request('/practice/report-error', { method: 'POST', body });
    },
  };
}

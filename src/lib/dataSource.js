import { ApiError, request } from './api';
import { createFixturePracticeSource, createHttpPracticeSource } from './practiceSource';
import { catalogFixture } from '../fixtures/catalog';
import { profitLossTopic } from '../fixtures/profitLoss';
import { practiceBank } from '../fixtures/practiceQuestions';

/**
 * Everything the pages read, behind one interface, so pages never know
 * whether they talk to the API or to the offline fixtures:
 *
 *   listCategories(language)                      -> { categories }
 *   getCategory(category, language)               -> { category, subjects }
 *   getSubject(category, subject, language)       -> { category, subject, topics }
 *   getTopicSummary({ category, subject, topic }) -> summary | null (no sheet yet)
 *   getTopicPatterns({ subject, topic })          -> { patterns } question patterns ([] when none yet)
 *   practiceSource({ category, subject, topic })  -> practice source for the arena
 *   createMock(payload)                           -> mock session (questions without answers)
 *   getMockSession(sessionId)                     -> active session, or its result once submitted
 *   submitMock({ sessionId, responses })          -> result
 *   getMockAnalytics(sessionId)                   -> result + review + topics + peers + cut-offs
 *   getMe()                                       -> { user } (user is null when signed out)
 *   login({ email, password })                    -> { user }
 *   register({ name, email, password })           -> { user }
 *   logout()
 *   getPerformance()                              -> practice + mock history of the signed-in student
 *   listBookmarks({ subject?, topic?, offset })   -> revision list: { total, hasMore, groups, items }
 *   verifyAnswer({ questionId, selectedOptionId }) -> verify-answer payload (answer + explanation)
 *   setBookmark(questionId, on)                    -> bookmark / remove
 *   listLearnSubjects()                           -> { subjects }   Learn section: Math, English
 *   getLearnSubject(subject)                      -> { subject, chapters }
 *   getLearnChapter(subject, topic)               -> { subject, topic, title, lesson, levels, previous, next }
 *   createLearnQuiz({ subject, topic, level, exclude }) -> quiz (questions without answers)
 *   checkLearnQuiz({ subject, topic, answers })   -> { results, score }
 */
export function createHttpDataSource() {
  const lang = (language) => `language=${encodeURIComponent(language)}`;
  return {
    kind: 'http',
    listCategories: (language) => request(`/catalog/categories?${lang(language)}`),
    getCategory: (category, language) => request(`/catalog/categories/${category}?${lang(language)}`),
    getSubject: (category, subject, language) =>
      request(`/catalog/categories/${category}/subjects/${subject}?${lang(language)}`),
    async getTopicSummary({ category, subject, topic }) {
      const qs = new URLSearchParams({ category, subject, topic });
      try {
        return (await request(`/practice/topic-summary?${qs}`)).summary;
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) return null; // topic exists, notes not written yet
        throw err;
      }
    },
    getTopicPatterns: ({ subject, topic }) => request(`/practice/patterns?${new URLSearchParams({ subject, topic })}`),
    practiceSource: (route) => createHttpPracticeSource(route),
    createMock: (payload) => request('/mock/create-session', { method: 'POST', body: payload }),
    getMockSession: (sessionId) => request(`/mock/session/${sessionId}`),
    submitMock: (payload) => request('/mock/submit-session', { method: 'POST', body: payload }),
    getMockAnalytics: (sessionId) => request(`/mock/session/${sessionId}/analytics`),
    // The session is an httpOnly cookie set by the server; the token in the body is for non-browser clients.
    getMe: () => request('/auth/me'),
    login: (body) => request('/auth/login', { method: 'POST', body }),
    register: (body) => request('/auth/register', { method: 'POST', body }),
    logout: () => request('/auth/logout', { method: 'POST' }),
    // Minutes east of UTC, so "today" and the streak follow the student's clock.
    getPerformance: () => request(`/me/performance?tz=${-new Date().getTimezoneOffset()}`),
    listBookmarks: ({ subject, topic, offset = 0 } = {}) =>
      request(`/practice/bookmarks?${new URLSearchParams({ offset: String(offset), ...(subject && { subject }), ...(topic && { topic }) })}`),
    verifyAnswer: (body) => request('/practice/verify-answer', { method: 'POST', body }),
    setBookmark: (questionId, on) => request(`/practice/bookmarks/${questionId}`, { method: on ? 'PUT' : 'DELETE' }),
    listLearnSubjects: () => request('/learn/subjects'),
    getLearnSubject: (subject) => request(`/learn/subjects/${subject}`),
    getLearnChapter: (subject, topic) => request(`/learn/subjects/${subject}/chapters/${topic}`),
    createLearnQuiz: (body) => request('/learn/quiz', { method: 'POST', body }),
    checkLearnQuiz: (body) => request('/learn/quiz/check', { method: 'POST', body }),
  };
}

const FIXTURE_USER_KEY = 'edtech:fixture-user';

/** Offline accounts: one demo user kept in localStorage, any password of 8+ characters. */
function createFixtureAuthApi(wait) {
  const read = () => {
    try {
      return JSON.parse(localStorage.getItem(FIXTURE_USER_KEY));
    } catch {
      return null;
    }
  };
  const signIn = ({ name, email, password }) => {
    if (!password || password.length < 8) {
      return Promise.reject(new ApiError(400, 'VALIDATION_ERROR', 'Password must be at least 8 characters'));
    }
    const user = { id: 'fixture-user', name: name || email.split('@')[0], email: email.trim().toLowerCase() };
    localStorage.setItem(FIXTURE_USER_KEY, JSON.stringify(user));
    return wait({ user });
  };
  return {
    getMe: () => wait({ user: read() }),
    login: signIn,
    register: signIn,
    logout: () => {
      localStorage.removeItem(FIXTURE_USER_KEY);
      return wait({ loggedOut: true });
    },
    getPerformance: () =>
      wait({
        summary: { practiceAttempts: 0, practiceAccuracyPct: 0, mocksTaken: 0, avgMockScorePct: null, bestMockScorePct: null, attemptedToday: 0, streakDays: 0 },
        subjects: [],
        weakTopics: [],
        minAttemptsForWeak: 5,
        mockTrend: [],
        recentMocks: [],
        activity: [],
      }),
  };
}

const FIXTURE_MOCK_PREFIX = 'edtech:fixture-mock:';
const randomHex = (n) => Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join('');

/** Offline equivalent of the backend's mock create/get/submit, scored against the fixture key. */
function createFixtureMockApi(wait) {
  const read = (id) => {
    try {
      return JSON.parse(sessionStorage.getItem(FIXTURE_MOCK_PREFIX + id));
    } catch {
      return null;
    }
  };
  const write = (rec) => sessionStorage.setItem(FIXTURE_MOCK_PREFIX + rec.session.sessionId, JSON.stringify(rec));

  return {
    async createMock(p) {
      const pool = practiceBank.filter((q) => q.stem[p.language] && q.options.every((o) => o.text[p.language]));
      if (p.questionCount > pool.length) {
        await wait();
        throw new ApiError(422, 'INSUFFICIENT_QUESTIONS', `Only ${pool.length} questions match these filters; ${p.questionCount} requested`, {
          available: pool.length,
          requested: p.questionCount,
        });
      }
      const picked = [...pool].sort(() => Math.random() - 0.5).slice(0, p.questionCount);
      const timeLimitMinutes = p.timeLimitMinutes ?? Math.ceil((p.questionCount * p.perQuestionSeconds) / 60);
      const now = Date.now();
      const session = {
        sessionId: randomHex(24),
        status: 'ACTIVE',
        config: {
          category: p.category,
          subject: p.subject,
          topicIds: p.topicIds,
          language: p.language,
          questionCount: p.questionCount,
          timeLimitMinutes,
          perQuestionTimer: Boolean(p.perQuestionTimer),
          perQuestionLimitSec: p.perQuestionTimer ? p.perQuestionSeconds : null,
          allowPause: Boolean(p.allowPause),
          markingScheme: p.markingScheme,
        },
        startedAt: new Date(now).toISOString(),
        expiresAt: new Date(now + (p.allowPause ? 72 * 3600_000 : timeLimitMinutes * 60_000)).toISOString(),
        questions: picked.map((q, i) => ({
          questionId: q.questionId,
          seq: i + 1,
          topic: q.topic,
          languages: Object.keys(q.stem),
          stem: q.stem,
          media: [],
          options: q.options,
          pyq: q.pyq,
        })),
      };
      write({ session, key: Object.fromEntries(picked.map((q) => [q.questionId, q.correctOptionId])) });
      return wait(session);
    },

    async getMockSession(id) {
      const rec = read(id);
      if (!rec) throw new ApiError(404, 'SESSION_NOT_FOUND', 'Mock session not found');
      return wait(rec.result ?? rec.session);
    },

    async submitMock({ sessionId, responses }) {
      const rec = read(sessionId);
      if (!rec) throw new ApiError(404, 'SESSION_NOT_FOUND', 'Mock session not found');
      if (rec.result) return wait({ ...rec.result, alreadySubmitted: true });
      const { positive, negative } = rec.session.config.markingScheme;
      const byId = new Map(responses.map((r) => [r.questionId, r]));
      const perQuestion = rec.session.questions.map((q) => {
        const r = byId.get(q.questionId);
        const correctOptionId = rec.key[q.questionId];
        const outcome = !r?.selectedOptionId ? 'UNATTEMPTED' : r.selectedOptionId === correctOptionId ? 'CORRECT' : 'INCORRECT';
        const marks = outcome === 'CORRECT' ? positive : outcome === 'INCORRECT' ? -negative : 0;
        return { questionId: q.questionId, seq: q.seq, topic: q.topic, selectedOptionId: r?.selectedOptionId ?? null, correctOptionId, outcome, marks, timeSpentSec: r?.timeSpentSec ?? 0, markedForReview: Boolean(r?.markedForReview) };
      });
      const n = (o) => perQuestion.filter((p) => p.outcome === o).length;
      const correct = n('CORRECT');
      const incorrect = n('INCORRECT');
      const attempted = correct + incorrect;
      const round2 = (x) => Math.round(x * 100) / 100;
      const result = {
        sessionId,
        status: 'SUBMITTED',
        alreadySubmitted: false,
        submittedAt: new Date().toISOString(),
        score: round2(correct * positive - incorrect * negative),
        maxScore: round2(perQuestion.length * positive),
        accuracyPct: attempted ? round2((correct / attempted) * 100) : 0,
        attemptRatePct: round2((attempted / perQuestion.length) * 100),
        negativeMarksDeducted: round2(incorrect * negative),
        counts: { correct, incorrect, unattempted: n('UNATTEMPTED'), timedOut: 0 },
        totalTimeSec: round2(perQuestion.reduce((t, p) => t + p.timeSpentSec, 0)),
        timeAdjusted: false,
        perQuestion,
        topicBreakdown: [],
        difficultyBreakdown: [],
        strengths: [],
        weaknesses: [],
      };
      write({ ...rec, result });
      return wait(result);
    },

    /** Same shape as GET /mock/session/:id/analytics, from the fixture bank. No peers or cut-offs offline. */
    async getMockAnalytics(id) {
      const rec = read(id);
      if (!rec?.result) throw new ApiError(rec ? 409 : 404, rec ? 'SESSION_NOT_SUBMITTED' : 'SESSION_NOT_FOUND', 'Not available');
      const { positive } = rec.session.config.markingScheme;
      const bank = new Map(practiceBank.map((q) => [q.questionId, q]));
      const review = rec.result.perQuestion.map((p) => {
        const q = bank.get(p.questionId);
        const pub = rec.session.questions.find((x) => x.questionId === p.questionId);
        return {
          ...p,
          ...pub,
          expectedTimeSec: 60,
          marksLost: Math.round((positive - p.marks) * 100) / 100,
          explanation: {
            steps: q.steps,
            shortcut: q.shortcut ?? null,
            traps: Object.entries(q.traps ?? {}).map(([optionId, note]) => ({ optionId, note })),
          },
        };
      });
      const t = { topic: 'profit_loss', total: review.length, correct: 0, incorrect: 0, unattempted: 0, marksLost: 0, time: 0 };
      for (const r of review) {
        t[r.outcome === 'CORRECT' ? 'correct' : r.outcome === 'INCORRECT' ? 'incorrect' : 'unattempted'] += 1;
        t.marksLost += r.marksLost;
        t.time += r.timeSpentSec;
      }
      const attempted = t.correct + t.incorrect;
      const topic = { ...t, accuracyPct: attempted ? Math.round((t.correct / attempted) * 1000) / 10 : 0, avgTimeSec: Math.round((t.time / t.total) * 10) / 10 };
      const cat = catalogFixture.find((c) => c.code === rec.session.config.category);
      const subj = cat?.subjects.find((s) => s.code === rec.session.config.subject);
      return wait({
        sessionId: id,
        category: { code: cat?.code, name: cat?.name },
        subject: { code: subj?.code, name: subj?.name },
        topicNames: Object.fromEntries((subj?.topics ?? []).map((x) => [x.code, x.name])),
        marking: rec.session.config.markingScheme,
        result: rec.result,
        review,
        topicBreakdown: [topic],
        weakestTopic: topic.marksLost > 0 ? topic : null,
        peers: { available: false, peers: 0, minPeers: 5, basis: { category: cat?.code, subject: subj?.code, questionCount: review.length } },
        cutoffs: [],
      });
    },
  };
}

/**
 * Offline source over src/fixtures. Only Profit & Loss has content (12 en+bn
 * questions and a topic sheet), served for every category, so the whole
 * funnel can be walked without a backend. Counts follow the API's rules:
 * a question counts only in languages it is fully available in.
 */
export function createFixtureDataSource({ latencyMs = 150 } = {}) {
  const wait = (v) => new Promise((r) => setTimeout(() => r(v), latencyMs));
  const notFound = (what) => Promise.reject(new ApiError(404, 'NOT_FOUND', `${what} not found`));
  const FIXTURE_TOPIC = 'quant.profit_loss';

  const bankStats = (language) => {
    const usable = practiceBank.filter((q) => q.stem[language] && q.options.every((o) => o.text[language]));
    const n = usable.length;
    return {
      questionCount: n,
      pyqCount: usable.filter((q) => q.pyq.length).length,
      avgDifficulty: n ? Math.round((usable.reduce((s, q) => s + q.difficulty, 0) / n) * 10) / 10 : null,
    };
  };
  const level = (avg) => (avg == null ? null : avg < 2.5 ? 'EASY' : avg < 3.5 ? 'MODERATE' : 'HARD');
  const topicStats = (subject, topic, language) =>
    `${subject}.${topic}` === FIXTURE_TOPIC ? bankStats(language) : { questionCount: 0, pyqCount: 0, avgDifficulty: null };
  const subjectStats = (s, language) =>
    s.topics.reduce(
      (acc, t) => {
        const st = topicStats(s.code, t.code, language);
        return { questions: acc.questions + st.questionCount, pyqs: acc.pyqs + st.pyqCount };
      },
      { questions: 0, pyqs: 0 },
    );
  const find = (code) => catalogFixture.find((c) => c.code === code);

  // The Learn section needs the API: lessons and quizzes are not bundled offline.
  const learnOffline = () => Promise.reject(new ApiError(0, 'OFFLINE', 'Lessons and quizzes need the server (VITE_USE_FIXTURES is on).'));

  return {
    kind: 'fixture',
    getTopicPatterns: ({ subject, topic }) => wait({ subject, topic, patterns: [] }),
    // Offline fixtures keep no server-side revision list.
    listBookmarks: () => wait({ total: 0, hasMore: false, groups: [], items: [] }),
    verifyAnswer: learnOffline,
    setBookmark: () => wait({}),
    listLearnSubjects: learnOffline,
    getLearnSubject: learnOffline,
    getLearnChapter: learnOffline,
    createLearnQuiz: learnOffline,
    checkLearnQuiz: learnOffline,
    listCategories: (language) =>
      wait({
        language,
        categories: catalogFixture.map((c) => ({
          code: c.code,
          name: c.name,
          conductingBody: c.conductingBody,
          exams: c.exams,
          subjectCount: c.subjects.length,
          questionCount: c.subjects.reduce((n, s) => n + subjectStats(s, language).questions, 0),
        })),
      }),

    getCategory(code, language) {
      const c = find(code);
      if (!c) return notFound('Category');
      return wait({
        language,
        category: { code: c.code, name: c.name, conductingBody: c.conductingBody, exams: c.exams },
        subjects: c.subjects.map((s) => {
          const st = subjectStats(s, language);
          return { code: s.code, name: s.name, topicCount: s.topics.length, questionCount: st.questions, pyqCount: st.pyqs };
        }),
      });
    },

    getSubject(code, subjectCode, language) {
      const c = find(code);
      const s = c?.subjects.find((x) => x.code === subjectCode);
      if (!s) return notFound('Subject');
      return wait({
        language,
        category: { code: c.code, name: c.name },
        subject: { code: s.code, name: s.name },
        topics: s.topics.map((t) => {
          const st = topicStats(s.code, t.code, language);
          return { ...t, ...st, difficulty: level(st.avgDifficulty), hasSummary: `${s.code}.${t.code}` === FIXTURE_TOPIC };
        }),
      });
    },

    getTopicSummary: ({ subject, topic }) =>
      wait(`${subject}.${topic}` === FIXTURE_TOPIC ? profitLossTopic.summary : null),

    practiceSource: ({ subject, topic }) =>
      createFixturePracticeSource(`${subject}.${topic}` === FIXTURE_TOPIC ? practiceBank : []),

    ...createFixtureMockApi(wait),
    ...createFixtureAuthApi(wait),
  };
}

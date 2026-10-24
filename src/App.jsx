import { useMemo } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './app/AuthContext';
import { DataSourceProvider } from './app/DataSourceContext';
import { createFixtureDataSource, createHttpDataSource } from './lib/dataSource';
import CategorySelect from './pages/funnel/CategorySelect';
import SubjectSelect from './pages/funnel/SubjectSelect';
import TopicList from './pages/funnel/TopicList';
import StudyPage from './pages/StudyPage';
import MockTestPage from './pages/MockTestPage';
import RetryPracticePage from './pages/RetryPracticePage';
import AuthPage from './pages/AuthPage';
import PerformancePage from './pages/PerformancePage';
import HomePage from './pages/HomePage';
import TipsPage from './pages/TipsPage';
import PrivacyPage from './pages/PrivacyPage';
import SubjectPage from './pages/learn/SubjectPage';
import ChapterPage from './pages/learn/ChapterPage';
import QuizPage from './pages/learn/QuizPage';
import AdminPage from './pages/AdminPage';
import AdminLogin from './pages/AdminLogin';
import BookmarksPage from './pages/BookmarksPage';
import RevisePage from './pages/RevisePage';
import MistakesPage from './pages/MistakesPage';
import MasteryPage from './pages/MasteryPage';
import ChallengePage from './pages/ChallengePage';
import LeaderboardPage from './pages/LeaderboardPage';
import CookieConsent from './components/auth/CookieConsent';

const USE_FIXTURES = import.meta.env.VITE_USE_FIXTURES === 'true';

/**
 * The selection funnel. The URL is the selection state: refresh, Back/Forward
 * and shared links all land on the same step. Unknown or missing segments
 * redirect to the nearest valid step (each page guards its own params), and
 * nothing defaults to a hard-coded topic.
 *
 *   /                                       Home: pick Math or English
 *   /learn                                  Learn Basics, Math tab (same page as /learn/math)
 *   /learn/:subject                         Math | English tabs, with that subject's chapters
 *   /learn/:subject/:chapter                lesson (basic -> advanced) + level quizzes
 *   /learn/:subject/:chapter/quiz/:level    quiz (beginner | intermediate | advanced), then answer review
 *
 * Exam-category funnel (no longer in the site navigation):
 *   /exams                                  1. CategorySelect
 *   /exams/:category                        2. SubjectSelect (+ language)
 *   /exams/:category/:subject               3. TopicList
 *   /exams/:category/:subject/:topicSlug    4. StudyPage (concept hub + practice)
 *   /mock/:sessionId                        CBT mock test (survives refresh), then the analytics dashboard
 *   /mock/:sessionId/retry                  5-question retry of the test's wrong answers
 *   /login, /register                       accounts (?next= returns to the page that sent the student)
 *   /me                                     My performance (signed-in only)
 *   /revision                               My revision list: bookmarked questions (signed-in only)
 *   /revise                                 Revise today: spaced-repetition queue of mistakes + bookmarks (signed-in)
 *   /mistakes                               Mistake notebook: still wrong / fixed (signed-in)
 *   /mastery                                Mastery map: every chapter as a coloured tile (signed-in)
 *   /challenge                              Daily challenge: same 5 mixed questions for everyone
 *   /leaderboard                            Weekly leaderboard, opt-in only (signed-in)
 */
export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/tips" element={<TipsPage />} />
      <Route path="/privacy" element={<PrivacyPage />} />
      {/* Rendered directly, not redirected: a <Navigate> paints one empty frame first. */}
      <Route path="/learn" element={<SubjectPage />} />
      <Route path="/learn/:subject" element={<SubjectPage />} />
      <Route path="/learn/:subject/:chapter" element={<ChapterPage />} />
      <Route path="/learn/:subject/:chapter/quiz/:level" element={<QuizPage />} />
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin/:tab?" element={<AdminPage />} />
      <Route path="/exams">
        <Route index element={<CategorySelect />} />
        <Route path=":category" element={<SubjectSelect />} />
        <Route path=":category/:subject" element={<TopicList />} />
        <Route path=":category/:subject/:topicSlug" element={<StudyPage />} />
      </Route>
      <Route path="/mock/:sessionId" element={<MockTestPage />} />
      <Route path="/mock/:sessionId/retry" element={<RetryPracticePage />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route path="/me" element={<PerformancePage />} />
      <Route path="/revision" element={<BookmarksPage />} />
      <Route path="/revise" element={<RevisePage />} />
      <Route path="/mistakes" element={<MistakesPage />} />
      <Route path="/mastery" element={<MasteryPage />} />
      <Route path="/challenge" element={<ChallengePage />} />
      <Route path="/leaderboard" element={<LeaderboardPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  const source = useMemo(() => (USE_FIXTURES ? createFixtureDataSource() : createHttpDataSource()), []);
  return (
    <DataSourceProvider source={source}>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <CookieConsent />
        </BrowserRouter>
      </AuthProvider>
    </DataSourceProvider>
  );
}

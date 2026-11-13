import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../app/AuthContext';
import { DataSourceProvider } from '../app/DataSourceContext';
import { languageStore } from '../hooks/useLanguagePreference';
import { useStudyHeartbeat } from '../hooks/useStudyHeartbeat';
import AnalysisPage from '../pages/AnalysisPage';
import SubjectAnalysisPage from '../pages/SubjectAnalysisPage';
import { formatDuration } from '../lib/analysisCopy';

const t = (en, bn) => ({ en, bn });
const user = { id: 'u1', name: 'Riya Sen', email: 'r@example.com' };

const chapter = (topic, title, extra = {}) => ({
  topic,
  title: t(title, title),
  emoji: '📘',
  area: 'arithmetic',
  answers: 0,
  correct: 0,
  wrong: 0,
  unique: 0,
  remaining: 30,
  skipped: 0,
  openSkips: 0,
  openMistakes: 0,
  repeatedMistakes: 0,
  recentAccuracy: null,
  mastery: null,
  progress: { reading: 0, practice: 0, pyq: null, revision: null, accuracy: null, mastery: null },
  readingMasteryGap: false,
  complete: false,
  focus: { score: 20, band: 'not_started', parts: [] },
  why: [],
  plan: { steps: [{ kind: 'smart_quiz', count: 10 }], questions: 10, minutes: 13 },
  revision: { intervalDays: 2, nextAt: null, due: false },
  difficulty: { EASY: { answered: 0 }, MEDIUM: { answered: 0 }, HARD: { answered: 0 } },
  topics: [],
  skills: [],
  trend: { direction: null },
  time: { readSec: 0, practiceSec: 0, reviseSec: 0, mistakesSec: 0, totalSec: 0, avgSecPerQuestion: null, targetSec: 75 },
  ...extra,
});

const percentage = chapter('percentage', 'Percentage', {
  answers: 35,
  correct: 21,
  wrong: 14,
  recentAccuracy: 60,
  mastery: 54,
  repeatedMistakes: 3,
  progress: { reading: 100, practice: 58, pyq: 35, revision: 40, accuracy: 60, mastery: 54 },
  readingMasteryGap: true,
  focus: { score: 82, band: 'high', parts: [] },
  why: [
    { key: 'low_accuracy', wrong: 14, answered: 35, accuracy: 60 },
    { key: 'skips', skipped: 6 },
  ],
  plan: {
    steps: [
      { kind: 'read', minutes: 15 },
      { kind: 'quiz', level: 'beginner', count: 5 },
      { kind: 'smart_quiz', count: 10 },
    ],
    questions: 15,
    minutes: 34,
  },
  skills: [{ key: 'successive', name: t('Successive percentage', 'ক্রমিক শতাংশ'), answered: 10, correct: 4, wrong: 6, accuracyPct: 40, hidden: true }],
  difficulty: { EASY: { answered: 10, accuracyPct: 80 }, MEDIUM: { answered: 15, accuracyPct: 60 }, HARD: { answered: 10, accuracyPct: 40 } },
  time: { readSec: 3600, practiceSec: 12000, reviseSec: 0, mistakesSec: 0, totalSec: 15600, avgSecPerQuestion: 110, targetSec: 75 },
});
const average = chapter('average', 'Average', { answers: 30, correct: 28, wrong: 2, recentAccuracy: 93, mastery: 91, focus: { score: 12, band: 'strong', parts: [] }, progress: { reading: 100, practice: 100, pyq: 90, revision: 100, accuracy: 93, mastery: 91 }, complete: true });

const analysis = {
  subject: 'quant',
  summary: { chapters: 15, started: 2, masteryPct: 72, syllabusMasteryPct: 10, accuracyPct: 71, answered: 65, weakChapters: 1, incompleteChapters: 1, strongChapters: 1, openMistakes: 5, openSkips: 2, revisionDue: 0, totalSec: 15600 },
  trend: { weeks: [{ week: '2026-10-19', answered: 10, accuracyPct: 42 }, { week: '2026-10-26', answered: 0, accuracyPct: null }, { week: '2026-11-02', answered: 12, accuracyPct: 71 }], firstAccuracy: 42, lastAccuracy: 71, deltaPts: 29, direction: 'up' },
  month: { month: '2026-11', attempted: 420, accuracyPct: 71, lastMonth: { month: '2026-10', attempted: 300, accuracyPct: 62 }, deltaPts: 9, strongestImprovement: { topic: 'percentage', title: t('Percentage', 'শতকরা'), from: 40, to: 58, deltaPts: 18 }, needsAttention: { topic: 'time_work', title: t('Time & Work', 'সময় ও কাজ'), from: 76, to: 70, deltaPts: -6 } },
  areas: [{ key: 'arithmetic', answered: 65, accuracyPct: 71, chapters: 8, weakestTopic: { topic: 'percentage', title: t('Percentage', 'শতকরা'), accuracy: 60 } }],
  studyNow: [
    { topic: 'percentage', title: t('Percentage', 'শতকরা'), band: 'high', score: 82, mastery: 54, accuracy: 60, why: percentage.why, plan: percentage.plan, weakestSkill: { name: t('Successive percentage', 'ক্রমিক শতাংশ'), accuracy: 40 }, revision: { due: true, nextAt: '2026-11-10T00:00:00Z' } },
  ],
  nextTask: { topic: 'percentage' },
  chapters: [average, percentage],
  nextSmartQuiz: {
    basedOn: { sessionId: 's1', wrong: [{ topic: 'percentage', title: t('Percentage', 'শতকরা'), count: 6 }], skipped: [{ topic: 'time_work', title: t('Time & Work', 'সময় ও কাজ'), count: 3 }] },
    weakestSkill: { name: t('Successive percentage', 'ক্রমিক শতাংশ'), topic: 'percentage', accuracy: 40 },
    count: 15,
    plan: [
      { topic: 'percentage', title: t('Percentage', 'শতকরা'), count: 9, role: 'focus', skill: t('Successive percentage', 'ক্রমিক শতাংশ') },
      { topic: 'time_work', title: t('Time & Work', 'সময় ও কাজ'), count: 4, role: 'focus', skill: null },
      { topic: 'average', title: t('Average', 'গড়'), count: 2, role: 'retention', skill: null },
    ],
  },
  skips: {
    chapters: [{ topic: 'time_work', title: t('Time & Work', 'সময় ও কাজ'), questions: 8, open: 8, events: 9, avgTimeSec: 12, reasons: { time_pressure: 5 }, topReason: 'time_pressure', difficulty: { EASY: 1, MEDIUM: 5, HARD: 2 } }],
    patterns: [{ kind: 'last_tests', topic: 'time_work', title: t('Time & Work', 'সময় ও কাজ'), count: 8, tests: 3, action: { revise: true, practice: 10 } }],
  },
  declining: [{ topic: 'time_work', title: t('Time & Work', 'সময় ও কাজ'), from: 76, to: 61 }],
  improving: [],
  weakQuestions: [{ questionId: 'a'.repeat(24), topic: 'percentage', title: t('Percentage', 'শতকরা'), stem: { en: 'A number increases by 20%...' }, wrongCount: 3, repeated: true }],
  skippedQuestions: [{ questionId: 'b'.repeat(24), topic: 'time_work', title: t('Time & Work', 'সময় ও কাজ'), stem: { en: 'A can do a work in 10 days...' }, times: 2, timeBeforeSkipSec: 8, likelyReason: 'time_pressure', reason: null }],
};

function Where() {
  const loc = useLocation();
  return <p data-testid="where">{loc.pathname}</p>;
}

function makeSource(extra = {}) {
  return {
    kind: 'test',
    getMe: vi.fn(() => Promise.resolve({ user })),
    getLearningAnalysis: vi.fn(() => Promise.resolve(analysis)),
    getLearningOverview: vi.fn(() =>
      Promise.resolve({
        subjects: [
          { subject: 'quant', summary: analysis.summary, month: analysis.month, trend: {}, nextTask: null, areas: [] },
          { subject: 'english', summary: { ...analysis.summary, masteryPct: 74, accuracyPct: 76, weakChapters: 3, incompleteChapters: 2 }, month: { deltaPts: null }, trend: {}, nextTask: null, areas: [] },
        ],
        focus: [
          { subject: 'quant', topic: 'percentage', title: t('Percentage', 'শতকরা'), band: 'high', score: 82, why: percentage.why },
          { subject: 'english', topic: 'tenses', title: t('Tenses', 'কাল'), band: 'medium', score: 51, why: [] },
        ],
      }),
    ),
    setSkipReason: vi.fn((questionId, reason) => Promise.resolve({ questionId, reason })),
    createCustomTest: vi.fn(() => Promise.resolve({ sessionId: 'c'.repeat(24), custom: { mode: 'practice', preset: 'smart' } })),
    ...extra,
  };
}

function renderAt(route, source) {
  return render(
    <DataSourceProvider source={source}>
      <AuthProvider>
        <MemoryRouter initialEntries={[route]}>
          <Routes>
            <Route path="/analysis" element={<AnalysisPage />} />
            <Route path="/analysis/:subject" element={<SubjectAnalysisPage />} />
            <Route path="*" element={<Where />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </DataSourceProvider>,
  );
}

beforeEach(() => {
  languageStore.set('en');
});

describe('learning analysis pages', () => {
  it('overview: Mathematics and English side by side, and the current focus across them', async () => {
    const source = makeSource();
    renderAt('/analysis', source);
    expect(await screen.findByRole('heading', { name: /Mathematics/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /English/ })).toBeInTheDocument();
    const focus = screen.getByRole('region', { name: /Current focus/ });
    const items = within(focus).getAllByRole('listitem');
    expect(items[0]).toHaveTextContent(/Mathematics.*—.*Percentage/);
    expect(items[0]).toHaveTextContent('14/35 questions wrong');
    expect(screen.getByText('Improvement: +9 percentage points')).toBeInTheDocument();
    expect(source.getLearningOverview).toHaveBeenCalledWith('en');
  });

  it('subject page: what to study now, why, the plan, and the next Smart Quiz', async () => {
    const source = makeSource();
    renderAt('/analysis/math', source);
    expect(await screen.findByRole('heading', { name: /^What should I study now\?/ })).toBeInTheDocument();
    expect(source.getLearningAnalysis).toHaveBeenCalledWith('quant', 'en');
    expect(screen.getByText('Why is Percentage weak?')).toBeInTheDocument();
    expect(screen.getByText('14/35 questions wrong (60% right recently)')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^Read the concept again — 15 min/ })).toHaveAttribute('href', '/learn/math/percentage');
    expect(screen.getByRole('link', { name: /^Solve 5 basic questions/ })).toHaveAttribute('href', '/learn/math/percentage/quiz/beginner');
    expect(screen.getByText('Revision due now')).toBeInTheDocument();
    expect(screen.getByText('You got 6 Percentage questions wrong.')).toBeInTheDocument();
    expect(screen.getByText('You skipped 3 Time & Work questions.')).toBeInTheDocument();
    expect(screen.getByText('Next Smart Quiz: 15 questions')).toBeInTheDocument();
    expect(screen.getByText('to keep it fresh')).toBeInTheDocument();
  });

  it('starts a Smart Quiz with the chosen size and opens it', async () => {
    const source = makeSource();
    renderAt('/analysis/math', source);
    await screen.findByRole('heading', { name: /^What should I study now\?/ });
    await userEvent.selectOptions(screen.getByRole('combobox', { name: /^Questions/ }), '20');
    await userEvent.click(screen.getByRole('button', { name: /^Start Smart Quiz/ }));
    await waitFor(() => expect(source.createCustomTest).toHaveBeenCalledWith({ subject: 'quant', preset: 'smart', topics: [], questionCount: 20, mode: 'practice', language: 'en' }));
    expect(await screen.findByTestId('where')).toHaveTextContent(`/practice/custom/${'c'.repeat(24)}`);
  });

  it('chapters keep reading and mastery apart, and show the hidden weak skill', async () => {
    renderAt('/analysis/math', makeSource());
    await userEvent.click(await screen.findByRole('tab', { name: /Chapters/ }));
    const cards = screen.getAllByRole('listitem').filter((li) => li.querySelector('h3'));
    expect(cards[0]).toHaveTextContent('Percentage'); // highest focus first
    expect(within(cards[0]).getByRole('meter', { name: 'Reading' })).toHaveAttribute('aria-valuenow', '100');
    expect(within(cards[0]).getByRole('meter', { name: 'Mastery' })).toHaveAttribute('aria-valuenow', '54');
    expect(within(cards[0]).getByText('Read, but not mastered yet')).toBeInTheDocument();
    expect(cards[1]).toHaveTextContent('Complete');
    await userEvent.click(within(cards[0]).getByRole('button', { name: /Concept mastery/ }));
    expect(within(cards[0]).getByText('hidden weakness')).toBeInTheDocument();
  });

  it('skipped questions: the pattern, the action, and the student can give the real reason', async () => {
    const source = makeSource();
    renderAt('/analysis/math', source);
    await userEvent.click(await screen.findByRole('tab', { name: /Skipped/ }));
    expect(screen.getByText('You skipped 8 Time & Work questions in the last 3 tests.')).toBeInTheDocument();
    expect(screen.getByText('Recommended → revise Time & Work + practise 10 questions')).toBeInTheDocument();
    const reason = screen.getByRole('combobox', { name: 'Why did you skip it?' });
    await userEvent.selectOptions(reason, 'forgot_concept');
    expect(source.setSkipReason).toHaveBeenCalledWith('b'.repeat(24), 'forgot_concept');
    expect(screen.getByText('Your reason')).toBeInTheDocument();
  });

  it('weak questions, progress and time tabs', async () => {
    renderAt('/analysis/math', makeSource());
    await userEvent.click(await screen.findByRole('tab', { name: /Weak questions/ }));
    expect(screen.getByText('Attempted 35 · Correct 21 · Wrong 14')).toBeInTheDocument();
    expect(screen.getByText('wrong 3×')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: /improving/ }));
    expect(screen.getByText('From 42% to 71%: +29 points')).toBeInTheDocument();
    expect(screen.getByText('76% → 61%')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: /Time/ }));
    expect(screen.getByText('4h 20m studied → 54% mastery')).toBeInTheDocument();
    expect(screen.getByText('slow')).toBeInTheDocument();
  });

  it('only Mathematics and English have an analysis page', async () => {
    renderAt('/analysis/gk', makeSource());
    expect(await screen.findByRole('heading', { name: /My learning analysis/ })).toBeInTheDocument();
  });

  it('formats study time', () => {
    expect(formatDuration(0)).toBe('0m');
    expect(formatDuration(35 * 60)).toBe('35m');
    expect(formatDuration(4 * 3600 + 20 * 60)).toBe('4h 20m');
  });
});

describe('reading heartbeat', () => {
  afterEach(() => vi.useRealTimers());

  function Reader({ section }) {
    useStudyHeartbeat({ subject: 'quant', topic: 'percentage', section, sectionsTotal: 8 });
    return null;
  }
  const mount = (source, section) =>
    render(
      <DataSourceProvider source={source}>
        <AuthProvider>
          <Reader section={section} />
        </AuthProvider>
      </DataSourceProvider>,
    );

  it('sends visible reading time once a minute with the section, and a section left after 20 s', async () => {
    const logStudyTime = vi.fn(() => Promise.resolve({}));
    const source = makeSource({ logStudyTime });
    vi.useFakeTimers({ shouldAdvanceTime: true });
    const view = mount(source, 'basic');
    await act(async () => {}); // signed in
    await act(async () => vi.advanceTimersByTime(60_000));
    expect(logStudyTime).toHaveBeenLastCalledWith({ subject: 'quant', topic: 'percentage', seconds: 60, section: 'basic', sectionsTotal: 8 });
    await act(async () => vi.advanceTimersByTime(25_000));
    view.rerender(
      <DataSourceProvider source={source}>
        <AuthProvider>
          <Reader section="examples" />
        </AuthProvider>
      </DataSourceProvider>,
    );
    expect(logStudyTime).toHaveBeenLastCalledWith(expect.objectContaining({ section: 'basic', seconds: 25 }));
  });

  it('sends nothing for a signed-out student', async () => {
    const logStudyTime = vi.fn(() => Promise.resolve({}));
    vi.useFakeTimers({ shouldAdvanceTime: true });
    mount(makeSource({ logStudyTime, getMe: () => Promise.resolve({ user: null }) }), 'basic');
    await act(async () => vi.advanceTimersByTime(120_000));
    expect(logStudyTime).not.toHaveBeenCalled();
  });
});

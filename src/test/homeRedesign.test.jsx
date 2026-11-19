import { act, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../App';
import { AuthProvider } from '../app/AuthContext';
import { DataSourceProvider } from '../app/DataSourceContext';
import { createFixtureDataSource } from '../lib/dataSource';
import { clearResourceCache } from '../hooks/useResource';
import { languageStore } from '../hooks/useLanguagePreference';
import { lastChapter } from '../lib/learnProgress';

vi.mock('../lib/learnProgress', async (orig) => ({ ...(await orig()), lastChapter: vi.fn(() => null) }));

const t = (en, bn) => ({ en, bn });
const items = [
  { id: 'today-1', kind: 'revise', source: 'revision_due', title: t('Revise 8 questions due today', 'রিভিশন'), count: 8, minutes: 16 },
  { id: 'today-2', kind: 'learn', source: 'unfinished_priority', subject: 'quant', topic: 'interest', title: t('Learn — Simple & Compound Interest', 'শেখো'), minutes: 20 },
];
const today = {
  date: '2026-11-19',
  exam: { code: 'WBP_CONSTABLE', name: t('WBP Constable', 'WBP কনস্টেবল'), category: 'WB_POLICE' },
  plan: null,
  items,
  totalMinutes: 36,
  budgetMinutes: null,
  trimmedCount: 0,
  primary: items[0],
  topPriorities: [
    { subject: 'reasoning', topic: 'coding_decoding', name: t('Coding-Decoding', 'কোডিং'), subjectName: t('Reasoning', 'রিজনিং'), stage: 'practising', accuracy: 30, priority: 'high', action: 'practice', reason: t('30% right so far — needs work', 'x') },
    { subject: 'gs', topic: 'indian_history', name: t('Indian History', 'ইতিহাস'), subjectName: t('General Studies', 'সাধারণ জ্ঞান'), stage: 'developing', accuracy: 60, priority: 'high', action: 'practice', reason: t('Developing — keep practising', 'x') },
    { subject: 'quant', topic: 'interest', name: t('Interest', 'সুদ'), subjectName: t('Mathematics', 'গণিত'), stage: 'not_started', accuracy: null, priority: 'high', action: 'learn', reason: t('High priority in your exam, not started yet', 'x') },
  ],
};

function source() {
  return {
    ...createFixtureDataSource({ latencyMs: 0 }),
    getMe: vi.fn(async () => ({ user: { id: 'u1', name: 'Riya Sen', email: 'riya@example.com', targetExam: { code: 'WBP_CONSTABLE', date: null } } })),
    getTargetExamSyllabus: vi.fn(async () => ({
      exam: { code: 'WBP_CONSTABLE', name: t('WBP Constable', 'WBP কনস্টেবল') },
      readiness: { score: 72, components: { coverage: 60, mastery: 80, pyq: 90 }, basis: {}, note: null },
      countdown: null,
    })),
    getDiagnostic: vi.fn(async () => ({ state: 'completed', offer: false })),
    getToday: vi.fn(async () => today),
    getRevisionHub: vi.fn(async () => ({ dueToday: { total: 8, questions: 8, gkFacts: 0, vocabulary: 0 } })),
    getPerformance: vi.fn(async () => ({ summary: { practiceAttempts: 120, practiceAccuracyPct: 68, attemptedToday: 14, mocksTaken: 2, avgMockScorePct: 61 } })),
    getInsights: vi.fn(async () => ({
      mastery: [], counts: {}, stageCounts: { mastered: 1, strong: 3, developing: 4, practising: 2, learning: 0, not_started: 40 },
      weakPatterns: [], badges: [], allBadges: 9, today: { answered: 14 }, streak: { days: 5, freezes: 0, protectedDays: [], freezeEvery: 7 },
    })),
  };
}

function renderHome() {
  render(
    <DataSourceProvider source={source()}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/']}>
          <AppRoutes />
        </MemoryRouter>
      </AuthProvider>
    </DataSourceProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  clearResourceCache();
  lastChapter.mockReturnValue({ subject: 'quant', topic: 'percentage', title: t('Percentage', 'শতকরা') });
  act(() => languageStore.set('en'));
});

describe('student home (Phase 12)', () => {
  it('answers the five questions: exam, readiness, today, weak spots, progress', async () => {
    renderHome();
    // 1. What exam am I preparing for?
    const exam = (await screen.findByRole('heading', { name: /Target exam/ })).closest('section');
    expect(await within(exam).findByText('WBP Constable')).toBeInTheDocument();
    // 2. How close am I to being exam-ready?
    expect((await screen.findByTestId('home-readiness')).textContent).toBe('72%');
    // 3. What should I study today? — the primary action.
    const study = screen.getByRole('region', { name: /Today's Study/ });
    const cont = await within(study).findByRole('link', { name: /Continue Studying/ });
    expect(cont).toHaveAttribute('href', '/revise');
    // 4. What am I weak in? — Top 3 priorities, numbered, from the server.
    const prio = screen.getByRole('region', { name: /Top 3 priorities/ });
    const rows = within(prio).getAllByRole('listitem');
    expect(rows).toHaveLength(3);
    expect(rows[0].textContent).toMatch(/Reasoning.*—.*Coding-Decoding/);
    expect(within(rows[0]).getByRole('link')).toHaveAttribute('href', '/exams/wb-police/reasoning/coding-decoding');
    expect(within(rows[2]).getByRole('link')).toHaveAttribute('href', '/learn/math/interest');
    // Today's revision: one number, one place.
    expect(screen.getByRole('link', { name: /Today's revision: 8 to revise today/ })).toHaveAttribute('href', '/revision');
    // Continue learning.
    expect(within(screen.getByRole('region', { name: /Continue learning/ })).getByRole('link', { name: /Percentage/ })).toHaveAttribute('href', '/learn/math/percentage');
    // 5. How am I doing? — a few numbers, no charts.
    const perf = screen.getByTestId('home-performance');
    expect(perf.textContent).toMatch(/14 answered today/);
    expect(perf.textContent).toMatch(/68% right overall/);
    expect(perf.textContent).toMatch(/2 mocks · avg 61%/);
  });

  it('keeps study first: no leaderboard, badges or daily challenge on the dashboard', async () => {
    renderHome();
    await screen.findByTestId('home-readiness');
    expect(screen.queryByRole('link', { name: /Leaderboard/ })).toBeNull();
    expect(screen.queryByText(/badge/i)).toBeNull();
    expect(screen.queryByRole('link', { name: /challenge/i })).toBeNull();
    // Exactly one primary Continue Studying button.
    expect(screen.getAllByRole('link', { name: /Continue Studying/ })).toHaveLength(1);
  });
});

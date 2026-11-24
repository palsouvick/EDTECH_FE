import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { act } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../App';
import { AuthProvider } from '../app/AuthContext';
import { DataSourceProvider } from '../app/DataSourceContext';
import { createFixtureDataSource } from '../lib/dataSource';
import { clearResourceCache } from '../hooks/useResource';
import { languageStore } from '../hooks/useLanguagePreference';
import { StuckPracticeResult, StuckSummaryCard } from '../components/stuck/StuckParts';

const t = (en, bn) => ({ en, bn });
const PCT = t('Percentage', 'শতকরা');
const TW = t('Time & Work', 'সময় ও কাজ');

const OVERVIEW = {
  total: 3,
  events: 4,
  solvedAfterStuck: 1,
  wrongAfterStuck: 1,
  leftAfterStuck: 1,
  reasons: { calculation: 2, concept: 1 },
  chapters: [
    { topic: 'percentage', name: PCT, stuck: 2, wrong: 4, accuracy: 50, answered: 10 },
    { topic: 'time_work', name: TW, stuck: 1, wrong: 5, accuracy: 35, answered: 10 },
  ],
  gaps: [
    {
      gap: 'calculation',
      confidence: 'high',
      count: 7,
      of: 15,
      toConfirm: 0,
      evidence: [{ kind: 'signals', n: 7, of: 15 }, { kind: 'stuck', n: 4 }],
      topics: [{ topic: 'percentage', n: 5, name: PCT }],
      practice: { mode: 'calculation', topic: 'percentage', topicName: PCT },
    },
    {
      gap: 'multistep',
      confidence: 'possible',
      count: 2,
      of: 6,
      toConfirm: 3,
      evidence: [{ kind: 'signals', n: 2, of: 6 }, { kind: 'levels', topic: 'percentage', basicPct: 85, appliedPct: 42, level: 'hard' }],
      topics: [{ topic: 'percentage', n: 2, name: PCT }],
      practice: { mode: 'exam', topic: 'percentage', topicName: PCT },
    },
  ],
  improvement: [{ topic: 'percentage', name: PCT, before: 42, now: 68, change: 26, quizzes: 2 }],
  next: { kind: 'practice', gap: 'calculation', mode: 'calculation', topic: 'percentage', topicName: PCT, level: 'moderate', count: 10, confidence: 'high' },
  quizzes: [],
  items: [
    {
      questionId: 'a'.repeat(24),
      topic: 'percentage',
      topicName: PCT,
      subtopic: null,
      difficulty: 3,
      times: 2,
      lastStuckAt: '2026-11-20T10:00:00Z',
      reason: 'calculation',
      reasons: ['calculation'],
      timeBeforeSec: 95,
      outcome: 'INCORRECT',
      yourOptionId: 'opt_bbbbbb',
      correctOptionId: 'opt_aaaaaa',
      previousStuckInChapter: 1,
      later: { answered: 3, correct: 2 },
      revision: { status: 'due', dueAt: '2026-11-25T10:00:00Z' },
      concept: {
        key: 'successive_change',
        name: t('Successive percentage change', 'পরপর শতকরা পরিবর্তন'),
        emoji: '🔁',
        spot: t('Two changes one after another.', 'পরপর দুটি পরিবর্তন।'),
        formula: t('Net = a + b + ab/100', 'নিট = a + b + ab/100'),
        method: [t('Apply the formula.', 'সূত্র প্রয়োগ করো।')],
        example: { question: t('20% up then 20% down?', '২০% বৃদ্ধি তারপর ২০% হ্রাস?'), steps: [t('20 − 20 − 4 = −4', '20 − 20 − 4 = −4')], answer: t('4% loss', '৪% ক্ষতি') },
      },
      similarCount: 12,
      steps: [t('Multiply 1.2 by 0.8.', '1.2 কে 0.8 দিয়ে গুণ করো।')],
      shortcut: null,
      learn: null,
      question: {
        questionId: 'a'.repeat(24),
        stem: t('A price rises 20% and then falls 20%. Net change?', 'দাম ২০% বেড়ে ২০% কমলে নিট পরিবর্তন?'),
        options: [
          { optionId: 'opt_aaaaaa', text: t('4% decrease', '৪% হ্রাস') },
          { optionId: 'opt_bbbbbb', text: t('No change', 'কোনো পরিবর্তন নেই') },
        ],
      },
    },
  ],
  hasMore: false,
};

function stubSource(over = {}) {
  return {
    ...createFixtureDataSource({ latencyMs: 0 }),
    getMe: async () => ({ user: { id: 'u1', name: 'Riya', email: 'riya@example.com' } }),
    getStuckProblems: vi.fn(async () => OVERVIEW),
    createCustomTest: vi.fn(async () => ({ sessionId: 'c'.repeat(24), custom: { mode: 'practice', preset: 'stuck' } })),
    ...over,
  };
}

function renderAt(path, source = stubSource()) {
  const user = userEvent.setup();
  render(
    <DataSourceProvider source={source}>
      <AuthProvider>
        <MemoryRouter initialEntries={[path]}>
          <AppRoutes />
        </MemoryRouter>
      </AuthProvider>
    </DataSourceProvider>,
  );
  return { user, source };
}

beforeEach(() => {
  localStorage.clear();
  clearResourceCache();
  act(() => languageStore.set('en'));
});

describe('My Stuck Problems page', () => {
  it('shows totals, stuck by chapter, the evidence-based gaps, improvement and each stuck question', async () => {
    renderAt('/math/stuck');
    expect(await screen.findByRole('heading', { name: /My Stuck Problems/ })).toBeInTheDocument();
    expect(screen.getByText(/never change your mock score/)).toBeInTheDocument();

    const table = await screen.findByTestId('stuck-chapters');
    const rows = within(table).getAllByRole('row');
    // Cells: chapter (both languages render in jsdom), stuck, wrong, accuracy.
    const cells = (row) => within(row).getAllByRole('cell').slice(1).map((c) => c.textContent);
    expect(within(rows[1]).getAllByRole('cell')[0]).toHaveTextContent('Percentage');
    expect(cells(rows[1])).toEqual(['2', '4', '50%']);
    expect(cells(rows[2])).toEqual(['1', '5', '35%']);

    const high = screen.getByTestId('gap-calculation');
    expect(within(high).getByText('High-confidence weakness: Calculation accuracy')).toBeInTheDocument();
    expect(within(high).getByText('7 / last 15 relevant questions')).toBeInTheDocument();
    expect(within(high).getByText('Marked stuck 4 times for this')).toBeInTheDocument();

    const possible = screen.getByTestId('gap-multistep');
    expect(within(possible).getByText('Possible weakness: Multi-step problems')).toBeInTheDocument();
    expect(within(possible).getByText('Practise 3 more questions to confirm.')).toBeInTheDocument();
    expect(within(possible).getByText(/Percentage: basic questions 85% · exam-level questions 42%/)).toBeInTheDocument();

    expect(screen.getByText(/You usually know the method in Percentage, but the calculation goes wrong/)).toBeInTheDocument();
    expect(screen.getByText('Practice: Calculation Practice — Percentage · 10 questions')).toBeInTheDocument();
    expect(screen.getByText('Percentage: 42% → 68%')).toBeInTheDocument();
    expect(screen.getByText('Improved +26%')).toBeInTheDocument();

    const card = screen.getByTestId('stuck-problem');
    expect(within(card).getByText('Stuck 2 times')).toBeInTheDocument();
    expect(within(card).getByText('Then answered wrong')).toBeInTheDocument();
    expect(within(card).getByText('Calculation problem')).toBeInTheDocument();
    expect(within(card).getByText(/95s before pressing I'm Stuck/)).toBeInTheDocument();
    expect(within(card).getByRole('link', { name: /Revise this topic/ })).toHaveAttribute('href', '/learn/math/percentage');
  });

  it('opens the solution with the concept, formula, method and worked example', async () => {
    const { user } = renderAt('/math/stuck');
    const card = await screen.findByTestId('stuck-problem');
    await user.click(within(card).getByRole('button', { name: /Show solution/ }));
    expect(within(card).getByText('Concept involved')).toBeInTheDocument();
    expect(within(card).getByText('Worked example')).toBeInTheDocument();
    expect(within(card).getByText(/Net = a \+ b \+ ab\/100/)).toBeInTheDocument();
    expect(within(card).getByText(/Multiply 1.2 by 0.8/)).toBeInTheDocument();
  });

  it('starts the recommended practice as a stuck quiz at the recommended level', async () => {
    const { user, source } = renderAt('/math/stuck');
    await screen.findByTestId('stuck-problem');
    await user.click(screen.getAllByRole('button', { name: /^Start practice/ })[0]);
    expect(source.createCustomTest).toHaveBeenLastCalledWith(
      expect.objectContaining({ subject: 'quant', preset: 'stuck', stuckMode: 'calculation', stuckLevel: 'moderate', questionCount: 10, topics: ['percentage'] }),
    );
  });

  it('practise similar asks for 5 same-pattern questions in that chapter', async () => {
    const { user, source } = renderAt('/math/stuck');
    const card = await screen.findByTestId('stuck-problem');
    await user.click(within(card).getByRole('button', { name: /Practise similar questions \(12 available\)/ }));
    expect(source.createCustomTest).toHaveBeenLastCalledWith(expect.objectContaining({ preset: 'stuck', stuckMode: 'pattern', questionCount: 5, topics: ['percentage'] }));
    expect(source.createCustomTest.mock.calls.at(-1)[0]).not.toHaveProperty('stuckLevel'); // adaptive level
  });

  it('an empty state explains the button when nothing is stuck yet', async () => {
    renderAt('/math/stuck', stubSource({ getStuckProblems: vi.fn(async () => ({ ...OVERVIEW, total: 0, chapters: [], gaps: [], items: [], next: null, improvement: [] })) }));
    expect(await screen.findByText('Nothing marked as stuck yet')).toBeInTheDocument();
  });
});

describe('home card and practice result', () => {
  const wrap = (ui, source) =>
    render(
      <DataSourceProvider source={source}>
        <MemoryRouter>{ui}</MemoryRouter>
      </DataSourceProvider>,
    );

  it('home card: top problem with evidence, most stuck topics, improvement and next action', async () => {
    wrap(
      <StuckSummaryCard />,
      stubSource({
        getStuckSummary: async () => ({ total: 3, topGap: OVERVIEW.gaps[0], mostStuck: OVERVIEW.chapters, improvement: OVERVIEW.improvement, next: OVERVIEW.next }),
      }),
    );
    const card = await screen.findByTestId('stuck-summary-card');
    expect(within(card).getByText('Calculation accuracy')).toBeInTheDocument();
    expect(within(card).getByText('7 / last 15 relevant questions')).toBeInTheDocument();
    expect(within(card).getByText('Percentage: 42% → 68%')).toBeInTheDocument();
    expect(within(card).getByText('Practice: Calculation Practice — Percentage · 10 questions')).toBeInTheDocument();
  });

  it('home card stays hidden with no stuck problems', async () => {
    const getStuckSummary = vi.fn(async () => ({ total: 0, topGap: null, mostStuck: [], improvement: [], next: null }));
    wrap(<StuckSummaryCard />, stubSource({ getStuckSummary }));
    await vi.waitFor(() => expect(getStuckSummary).toHaveBeenCalled());
    expect(screen.queryByTestId('stuck-summary-card')).toBeNull();
  });

  it('after a set: previous → now, weakest / strongest pattern, and the adaptive next set', async () => {
    const user = userEvent.setup();
    const source = stubSource();
    wrap(
      <StuckPracticeResult
        data={{
          mode: 'pattern',
          level: 'basic',
          accuracy: 80,
          previous: 40,
          change: 40,
          weakestPattern: { name: t('Reverse percentage', 'উল্টো শতকরা'), accuracy: 50, total: 2 },
          strongestPattern: { name: t('Successive change', 'পরপর পরিবর্তন'), accuracy: 100, total: 3 },
          next: { level: 'moderate', action: 'up', mode: 'pattern', topics: [{ topic: 'percentage', name: PCT }] },
        }}
      />,
      source,
    );
    expect(screen.getByText('Previous: 40% → Now: 80%')).toBeInTheDocument();
    expect(screen.getByText('Improved +40%')).toBeInTheDocument();
    expect(screen.getByText('Reverse percentage')).toBeInTheDocument();
    expect(within(screen.getByTestId('stuck-next-message')).getByText(/move up to Level 2 — Application/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^Next practice set/ }));
    expect(source.createCustomTest).toHaveBeenLastCalledWith(expect.objectContaining({ preset: 'stuck', stuckMode: 'pattern', stuckLevel: 'moderate', questionCount: 5, topics: ['percentage'] }));
  });

  it('0-1 of 5 right sends the student back to the learning content first', () => {
    wrap(
      <StuckPracticeResult data={{ mode: 'concept', level: 'basic', accuracy: 20, previous: null, change: null, weakestPattern: null, strongestPattern: null, next: { level: 'basic', action: 'revise', mode: 'concept', topics: [] } }} />,
      stubSource(),
    );
    expect(screen.getByText('Accuracy: 20%')).toBeInTheDocument();
    expect(screen.getByText(/Go back to the learning content first/)).toBeInTheDocument();
  });
});

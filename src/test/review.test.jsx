import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../App';
import { AuthProvider } from '../app/AuthContext';
import { DataSourceProvider } from '../app/DataSourceContext';
import { createFixtureDataSource } from '../lib/dataSource';
import { clearResourceCache } from '../hooks/useResource';
import { languageStore } from '../hooks/useLanguagePreference';
import { lastVisitedStore } from '../lib/lastVisited';

const t = (en, bn) => ({ en, bn });
const question = (n) => ({
  questionId: `q${n}`,
  stem: t(`Revise question ${n}?`, `রিভিশন প্রশ্ন ${n}?`),
  options: [
    { optionId: `opt_a${n}aaa`, text: t(`right ${n}`, `ঠিক ${n}`) },
    { optionId: `opt_b${n}bbb`, text: t(`wrong ${n}`, `ভুল ${n}`) },
  ],
});
const PL = t('Profit & Loss', 'লাভ ও ক্ষতি');
const INSIGHTS = {
  mastery: [],
  counts: { strong: 2, improving: 3, weak: 1 },
  weakPatterns: [{ subject: 'quant', topic: 'percentage', pattern: 'successive_change', patternName: t('Successive percentage change', 'পরপর শতকরা পরিবর্তন'), emoji: '🔁', chapterName: t('Percentage', 'শতকরা'), chapterAccuracyPct: 80, category: 'SSC', answers: 8, accuracyPct: 30 }],
  badges: [],
  today: { answered: 7 },
  streak: { days: 9, freezes: 1, protectedDays: [], freezeEvery: 7 },
};

function stubSource() {
  const streaks = { q1: 1, q2: 0 };
  return {
    ...createFixtureDataSource({ latencyMs: 0 }),
    getMe: async () => ({ user: { id: 'u1', name: 'Riya', email: 'riya@example.com' } }),
    getReviewSummary: vi.fn(async () => ({ dueToday: 2, active: 3, mastered: 1, mistakesActive: 2, nextDueAt: '2026-10-27T10:00:00Z', masterAfter: 2 })),
    getReviewDue: vi.fn(async () => ({
      masterAfter: 2,
      items: [
        { reason: 'mistake', streak: 1, wrongCount: 2, topicName: PL, question: question(1) },
        { reason: 'bookmark', streak: 0, wrongCount: 0, topicName: PL, question: question(2) },
      ],
    })),
    answerReview: vi.fn(async ({ questionId, selectedOptionId }) => {
      const n = questionId.slice(1);
      const correctOptionId = `opt_a${n}aaa`;
      const isCorrect = selectedOptionId === correctOptionId;
      const streak = isCorrect ? streaks[questionId] + 1 : 0;
      return {
        questionId,
        selectedOptionId,
        isCorrect,
        correctOptionId,
        explanation: { items: [t(`Because ${n}.`, `কারণ ${n}।`)] },
        shortcut: null,
        trapForSelected: null,
        review: { status: streak >= 2 ? 'mastered' : 'active', streak, masterAfter: 2, nextDueAt: '2026-10-26T10:00:00Z' },
      };
    }),
    getMistakes: vi.fn(async ({ status }) => ({
      counts: { active: 2, mastered: 1 },
      total: 1,
      hasMore: false,
      groups: [{ subject: 'quant', topic: 'profit_loss', topicName: PL, count: 1 }],
      items: [
        {
          status,
          wrongCount: 2,
          lastWrongAt: '2026-10-20T10:00:00Z',
          source: 'mock',
          dueAt: status === 'active' ? '2026-10-24T10:00:00Z' : null,
          topicName: PL,
          yourOptionId: 'opt_b7bbb',
          correctOptionId: 'opt_a7aaa',
          steps: [t('Because seven.', 'কারণ সাত।')],
          shortcut: null,
          trapForSelected: null,
          question: question(7),
        },
      ],
    })),
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

describe('revision queue and mistake notebook', () => {
  it('a signed-in student lands on their dashboard: plan, continue, weakest spot', async () => {
    lastVisitedStore.set({ category: 'SSC', subject: 'quant', topic: 'percentage', names: { topic: t('Percentage', 'শতকরা'), category: t('SSC', 'SSC') } });
    renderAt('/', { ...stubSource(), getInsights: async () => INSIGHTS, getChallenge: async () => ({ day: '2026-10-23', questions: [question(1)], done: { correct: 4, total: 5 } }) });
    expect(await screen.findByRole('heading', { name: /^Good (morning|afternoon|evening), Riya/ })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /^Crack SSC/ })).toBeNull();

    const plan = screen.getByRole('region', { name: /Today's plan/ });
    // The greeting shows first; the plan fills in once the data arrives.
    expect(await within(plan).findByRole('link', { name: /Revise 2 questions from your queue/ })).toHaveAttribute('href', '/revise');
    expect(within(plan).getByText('Daily challenge done: 4/5')).toBeInTheDocument();
    expect(within(plan).getByRole('link', { name: /Practise 10 questions: Successive percentage change/ })).toHaveAttribute('href', '/exams/ssc/quant/percentage?pattern=successive_change&practice=10');
    expect(within(plan).getByText(/Answer 30 questions today \(7\/30\)/)).toBeInTheDocument();

    const cont = screen.getByRole('region', { name: /Continue where you left off/ });
    expect(within(cont).getByRole('link', { name: /Percentage/ })).toHaveAttribute('href', '/exams/ssc/quant/percentage');
    expect(screen.getByText('🔥 9-day streak')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /2 to revise today/ })).toHaveAttribute('href', '/revise');
  });

  it('a revision session: right twice masters, wrong comes back tomorrow, then a summary', async () => {
    const { user, source } = renderAt('/revise');
    expect(await screen.findByText('Revise question 1?')).toBeInTheDocument();
    expect(screen.getByText('1 of 2')).toBeInTheDocument();
    expect(screen.getByText('Your mistake')).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: /right 1/ }));
    await user.click(screen.getByRole('button', { name: /^Check answer/ }));
    expect(await screen.findByText(/^Mastered! It leaves your queue/)).toBeInTheDocument();
    expect(screen.getByText('Because 1.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^Next question/ }));

    expect(await screen.findByText('Revise question 2?')).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: /wrong 2/ }));
    await user.click(screen.getByRole('button', { name: /^Check answer/ }));
    expect(await screen.findByText(/^Not yet. It comes back tomorrow/)).toBeInTheDocument();
    expect(source.answerReview).toHaveBeenLastCalledWith(expect.objectContaining({ questionId: 'q2', selectedOptionId: 'opt_b2bbb' }));
    await user.click(screen.getByRole('button', { name: /^Finish/ }));

    expect(await screen.findByText(/^Revision done for today/)).toBeInTheDocument();
    expect(screen.getByText('1 mastered · 1 scheduled again')).toBeInTheDocument();
  });

  it('mistake notebook: still wrong vs fixed, your answer and the right one', async () => {
    const { user, source } = renderAt('/mistakes');
    const card = (await screen.findByText('Revise question 7?')).closest('article');
    expect(within(card).getByText('Your answer')).toBeInTheDocument();
    expect(within(card).getByText('Correct answer')).toBeInTheDocument();
    expect(within(card).getByText('Because seven.')).toBeInTheDocument();
    expect(within(card).getByText('Mock test')).toBeInTheDocument();
    // Tab names carry both languages: "Still wrong এখনও ভুল 2".
    expect(screen.getByRole('tab', { name: /Still wrong.*2/ })).toHaveAttribute('aria-selected', 'true');

    await user.click(screen.getByRole('tab', { name: /Fixed.*1/ }));
    expect(source.getMistakes).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'mastered', offset: 0 }));
  });
});

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

const t = (en, bn) => ({ en, bn });
const insights = {
  mastery: [
    { subject: 'quant', topic: 'percentage', name: t('Percentage', 'শতকরা'), subjectName: t('Quantitative Aptitude', 'পরিমাণগত দক্ষতা'), category: 'SSC', status: 'improving', answers: 20, recentAnswers: 20, accuracyPct: 70, hardAccuracyPct: 25 },
    { subject: 'quant', topic: 'algebra', name: t('Algebra', 'বীজগণিত'), subjectName: t('Quantitative Aptitude', 'পরিমাণগত দক্ষতা'), category: 'SSC', status: 'not_started', answers: 0, recentAnswers: 0, accuracyPct: null, hardAccuracyPct: null },
    { subject: 'reasoning', topic: 'series', name: t('Number & Letter Series', 'সংখ্যা ও অক্ষর শ্রেণি'), subjectName: t('Reasoning', 'যুক্তি'), category: 'SSC', status: 'strong', answers: 30, recentAnswers: 30, accuracyPct: 90, hardAccuracyPct: 80 },
  ],
  counts: { strong: 1, improving: 1, weak: 0, started: 0, not_started: 1 },
  weakPatterns: [
    { subject: 'quant', topic: 'percentage', pattern: 'successive_change', patternName: t('Successive percentage change', 'পরপর শতকরা পরিবর্তন'), emoji: '🔁', chapterName: t('Percentage', 'শতকরা'), chapterAccuracyPct: 80, category: 'SSC', answers: 8, accuracyPct: 30 },
  ],
  badges: [{ key: 'first_steps', emoji: '🌱', title: t('First steps', 'প্রথম পদক্ষেপ'), body: t('Answered your first 10 questions.', 'প্রথম 10টি প্রশ্নের উত্তর দিয়েছ।') }],
  allBadges: 9,
  streak: { days: 9, freezes: 1, protectedDays: ['2026-10-08'], freezeEvery: 7 },
};
const q = (n) => ({ questionId: `c${n}`, topic: 'percentage', stem: t(`Challenge ${n}?`, `চ্যালেঞ্জ ${n}?`), options: [{ optionId: `opt_a${n}aaa`, text: t(`right ${n}`, `ঠিক ${n}`) }, { optionId: `opt_b${n}bbb`, text: t(`wrong ${n}`, `ভুল ${n}`) }] });

function stubSource({ signedIn = true } = {}) {
  let optedIn = false;
  return {
    ...createFixtureDataSource({ latencyMs: 0 }),
    getMe: async () => ({ user: signedIn ? { id: 'u1', name: 'Riya Sen', email: 'riya@example.com' } : null }),
    getInsights: vi.fn(async () => insights),
    getChallenge: vi.fn(async () => ({ day: '2026-10-23', questions: [q(1), q(2)], done: null })),
    submitChallenge: vi.fn(async ({ answers }) => {
      const results = answers.map((a) => ({ questionId: a.questionId, selectedOptionId: a.selectedOptionId, isCorrect: a.selectedOptionId?.startsWith('opt_a'), correctOptionId: `opt_a${a.questionId.slice(1)}aaa`, steps: [t('Why.', 'কারণ।')], shortcut: null, trapForSelected: null }));
      return { day: '2026-10-23', results, score: { correct: results.filter((r) => r.isCorrect).length, total: results.length }, firstAttempt: true };
    }),
    getLeaderboard: vi.fn(async () => ({ optedIn, top: optedIn ? [{ rank: 1, name: 'Riya S.', correct: 12, isMe: true }] : [{ rank: 1, name: 'Arjun D.', correct: 30, isMe: false }], me: null, participants: 1 })),
    setLeaderboardOptIn: vi.fn(async (v) => {
      optedIn = v;
      return { optedIn, top: [{ rank: 1, name: 'Riya S.', correct: 12, isMe: true }], me: { rank: 1 }, participants: 1 };
    }),
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

describe('mastery map, weak patterns, challenge, leaderboard', () => {
  it('mastery map: every chapter as a tile with its status, linking to the chapter', async () => {
    renderAt('/mastery');
    const tile = (await screen.findByText('Percentage')).closest('a');
    expect(tile).toHaveAttribute('href', '/exams/ssc/quant/percentage');
    expect(within(tile).getByText('Improving')).toBeInTheDocument();
    expect(within(tile).getByText(/70% right/)).toBeInTheDocument();
    expect(within(screen.getByText('Algebra').closest('a')).getByText('Not started')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^Reasoning/ })).toBeInTheDocument();
  });

  it('My performance: weak pattern with learn / practise-10 links, streak freezes and badges', async () => {
    renderAt('/me');
    const row = (await screen.findByText('Successive percentage change')).closest('li');
    expect(within(row).getByText('You get 80% in Percentage, but only 30% here.')).toBeInTheDocument();
    expect(within(row).getByRole('link', { name: /Learn the pattern/ })).toHaveAttribute('href', '/exams/ssc/quant/percentage?pattern=successive_change#patterns');
    expect(within(row).getByRole('link', { name: /Practise 10/ })).toHaveAttribute('href', '/exams/ssc/quant/percentage?pattern=successive_change&practice=10');
    expect(screen.getByText('9-day streak')).toBeInTheDocument();
    expect(screen.getByText('1 streak freeze saved')).toBeInTheDocument();
    expect(screen.getByText('A freeze saved your streak on 1 day.')).toBeInTheDocument();
    expect(screen.getByText('First steps')).toBeInTheDocument();
  });

  it('daily challenge: answer, submit, see score and explanations; playable signed out', async () => {
    const { user, source } = renderAt('/challenge', stubSource({ signedIn: false }));
    await screen.findByText('Challenge 1?');
    await user.click(screen.getByRole('radio', { name: /right 1/ }));
    expect(screen.getByText('1 not answered yet')).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: /wrong 2/ }));
    await user.click(screen.getByRole('button', { name: /^Submit answers/ }));
    expect(await screen.findByText('You got 1 of 2 right')).toBeInTheDocument();
    expect(screen.getAllByText('Why.')).toHaveLength(2);
    expect(screen.getByText('Log in to keep your result and earn badges.')).toBeInTheDocument();
    expect(source.submitChallenge).toHaveBeenCalledWith({ answers: [expect.objectContaining({ questionId: 'c1', selectedOptionId: 'opt_a1aaa' }), expect.objectContaining({ questionId: 'c2', selectedOptionId: 'opt_b2bbb' })] });
    expect(JSON.parse(localStorage.getItem('edtech:challenge:2026-10-23'))).toEqual({ correct: 1, total: 2 });
  });

  it('the visitor home page shows the daily challenge card', async () => {
    renderAt('/', stubSource({ signedIn: false }));
    const card = await screen.findByRole('region', { name: 'Daily challenge' });
    expect(within(card).getByRole('link')).toHaveAttribute('href', '/challenge');
  });

  it('leaderboard is opt-in', async () => {
    const { user, source } = renderAt('/leaderboard');
    expect(await screen.findByText(/^You are not on the leaderboard/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^Show me on the leaderboard/ }));
    expect(source.setLeaderboardOptIn).toHaveBeenCalledWith(true);
    expect(await screen.findByText('Riya S.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^Hide me from the leaderboard/ })).toHaveAttribute('aria-pressed', 'true');
  });
});

import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../App';
import { AuthProvider } from '../app/AuthContext';
import { DataSourceProvider } from '../app/DataSourceContext';
import { createFixtureDataSource } from '../lib/dataSource';
import { clearResourceCache } from '../hooks/useResource';
import { languageStore } from '../hooks/useLanguagePreference';

const t = (en, bn) => ({ en, bn });
const item = (n, topic, topicName) => ({
  bookmarkedAt: '2026-10-20T10:00:00.000Z',
  subject: 'quant',
  topic,
  topicName,
  question: {
    questionId: `q${n}`,
    stem: t(`Saved question ${n}?`, `সংরক্ষিত প্রশ্ন ${n}?`),
    options: [
      { optionId: `opt_a${n}aaa`, text: t(`right ${n}`, `ঠিক ${n}`) },
      { optionId: `opt_b${n}bbb`, text: t(`wrong ${n}`, `ভুল ${n}`) },
    ],
  },
});
const PL = t('Profit & Loss', 'লাভ ও ক্ষতি');
const AGES = t('Ages', 'বয়স');

function stubSource({ signedIn = true } = {}) {
  let list = [item(1, 'profit_loss', PL), item(2, 'profit_loss', PL), item(3, 'ages', AGES)];
  const groups = () =>
    [['profit_loss', PL], ['ages', AGES]]
      .map(([topic, topicName]) => ({ subject: 'quant', topic, topicName, count: list.filter((i) => i.topic === topic).length }))
      .filter((g) => g.count);
  return {
    ...createFixtureDataSource({ latencyMs: 0 }),
    getMe: async () => ({ user: signedIn ? { id: 'u1', name: 'Riya', email: 'riya@example.com' } : null }),
    listBookmarks: vi.fn(async ({ topic } = {}) => {
      const items = list.filter((i) => !topic || i.topic === topic);
      return { total: items.length, hasMore: false, groups: groups(), items };
    }),
    verifyAnswer: vi.fn(async ({ questionId, selectedOptionId }) => {
      const n = questionId.slice(1);
      const correctOptionId = `opt_a${n}aaa`;
      return {
        questionId,
        selectedOptionId,
        isCorrect: selectedOptionId === correctOptionId,
        correctOptionId,
        explanation: { items: [t(`Because ${n}.`, `কারণ ${n}।`)] },
        shortcut: null,
        trapForSelected: null,
      };
    }),
    setBookmark: vi.fn(async (questionId, on) => {
      if (!on) list = list.filter((i) => i.question.questionId !== questionId);
      return {};
    }),
  };
}

function Location() {
  return <output data-testid="path">{useLocation().pathname}</output>;
}

function renderAt(source) {
  const user = userEvent.setup();
  render(
    <DataSourceProvider source={source}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/revision']}>
          <AppRoutes />
          <Location />
        </MemoryRouter>
      </AuthProvider>
    </DataSourceProvider>,
  );
  return user;
}

beforeEach(() => {
  localStorage.clear();
  clearResourceCache();
  act(() => languageStore.set('en'));
});

describe('revision list (bookmarks)', () => {
  it('lists bookmarks, filters by chapter, checks an answer, and ticks a learnt one off with undo', async () => {
    const source = stubSource();
    const user = renderAt(source);
    expect(await screen.findByText('Saved question 1?')).toBeInTheDocument();
    expect(screen.getByText('3 to revise')).toBeInTheDocument();

    // Filter to one chapter.
    await user.click(screen.getByRole('button', { name: /^Ages/ }));
    expect(await screen.findByText('Saved question 3?')).toBeInTheDocument();
    expect(screen.queryByText('Saved question 1?')).toBeNull();
    expect(source.listBookmarks).toHaveBeenLastCalledWith(expect.objectContaining({ subject: 'quant', topic: 'ages', offset: 0 }));
    await user.click(screen.getByRole('button', { name: /^All/ }));

    // Answer one wrong: feedback and explanation, then try again.
    const first = (await screen.findByText('Saved question 1?')).closest('article');
    await user.click(within(first).getByRole('radio', { name: /wrong 1/ }));
    await user.click(within(first).getByRole('button', { name: /^Check answer/ }));
    expect(await within(first).findByText(/^Not yet/)).toBeInTheDocument();
    expect(within(first).getByText('Because 1.')).toBeInTheDocument();
    await user.click(within(first).getByRole('button', { name: /Try again/ }));
    await user.click(within(first).getByRole('radio', { name: /right 1/ }));
    await user.click(within(first).getByRole('button', { name: /^Check answer/ }));
    expect(await within(first).findByText(/^Correct! You have learnt this one/)).toBeInTheDocument();

    // Tick it off, then undo.
    await user.click(within(first).getByRole('button', { name: /Got it, remove/ }));
    expect(screen.queryByText('Saved question 1?')).toBeNull();
    expect(source.setBookmark).toHaveBeenCalledWith('q1', false);
    expect(screen.getByText('2 to revise')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^Undo/ }));
    expect(source.setBookmark).toHaveBeenCalledWith('q1', true);
  });

  it('sends signed-out students to log in', async () => {
    renderAt(stubSource({ signedIn: false }));
    await screen.findByRole('button', { name: /^Log in/ });
    expect(screen.getByTestId('path').textContent).toBe('/login');
  });
});

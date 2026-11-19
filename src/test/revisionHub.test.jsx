import { act, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../App';
import { AuthProvider } from '../app/AuthContext';
import { DataSourceProvider } from '../app/DataSourceContext';
import { createFixtureDataSource } from '../lib/dataSource';
import { clearResourceCache } from '../hooks/useResource';
import { languageStore } from '../hooks/useLanguagePreference';

const t = (en, bn) => ({ en, bn });
const hub = {
  dueToday: { total: 4, questions: 2, gkFacts: 1, vocabulary: 1, nextDueAt: null },
  mistakes: { open: 2, repeating: 1, mastered: 1, bySubject: [{ subject: 'quant', name: t('Mathematics', 'গণিত'), open: 2, repeating: 1, mastered: 1 }] },
  bookmarked: { questions: 3, gkFacts: 1, words: 2 },
  weakTopics: [{ subject: 'english', topic: 'grammar', name: t('Grammar', 'ব্যাকরণ'), stage: 'practising', score: 18, accuracy: 25 }],
  pyq: { inQueue: 1, dueToday: 1 },
  vocabulary: { due: 1, difficult: 1, missed: 1, learned: 2, favourite: 2 },
};

function source(extra = {}) {
  return {
    ...createFixtureDataSource({ latencyMs: 0 }),
    getMe: vi.fn(async () => ({ user: { id: 'u1', name: 'Riya Sen', email: 'riya@example.com', targetExam: null } })),
    getRevisionHub: vi.fn(async () => hub),
    ...extra,
  };
}

function renderAt(at, src = source()) {
  render(
    <DataSourceProvider source={src}>
      <AuthProvider>
        <MemoryRouter initialEntries={[at]}>
          <AppRoutes />
        </MemoryRouter>
      </AuthProvider>
    </DataSourceProvider>,
  );
  return src;
}

const section = (name) => screen.getByRole('heading', { name }).closest('section');

beforeEach(() => {
  localStorage.clear();
  clearResourceCache();
  act(() => languageStore.set('en'));
});

describe('one Revision page (F13)', () => {
  it('shows the six sections, each linking to the existing revision tool', async () => {
    renderAt('/revision');
    await screen.findByText(/4 to revise today/);
    expect(screen.getByRole('link', { name: /Start revising/ })).toHaveAttribute('href', '/revise');

    const due = section(/Due today/);
    expect(within(due).getByRole('link', { name: /2 questions/ })).toHaveAttribute('href', '/revise');
    expect(within(due).getByRole('link', { name: /1 GK facts/ })).toHaveAttribute('href', '/learn/gk/revision');
    expect(within(due).getByRole('link', { name: /1 words/ })).toHaveAttribute('href', '/vocabulary?tab=review');

    const mistakes = section(/Mistakes/);
    expect(within(mistakes).getByText(/2 open · 1 repeating/)).toBeInTheDocument();
    expect(within(mistakes).getByRole('link', { name: /mistake notebook/ })).toHaveAttribute('href', '/mistakes');

    const bm = section(/Bookmarked/);
    expect(within(bm).getByRole('link', { name: /3 questions/ })).toHaveAttribute('href', '/revision/bookmarks');

    const weak = section(/Weak topics/);
    expect(within(weak).getByRole('link', { name: /Grammar/ })).toHaveAttribute('href', '/learn/english/grammar');
    expect(within(weak).getByText('Practising')).toBeInTheDocument();

    const pyq = section(/PYQ revision/);
    expect(within(pyq).getByRole('link', { name: /Revise PYQs due/ })).toHaveAttribute('href', '/revise?pyq=1');

    const vocab = section(/Vocabulary/);
    expect(within(vocab).getByText(/1 due · 1 difficult · 1 missed before/)).toBeInTheDocument();
  });

  it('the old bookmark list still opens, now at /revision/bookmarks', async () => {
    renderAt('/revision/bookmarks', source({ listBookmarks: vi.fn(async () => ({ total: 0, hasMore: false, groups: [], items: [] })) }));
    expect(await screen.findByRole('heading', { name: /My revision list/ })).toBeInTheDocument();
  });

  it('PYQ revision asks the existing queue for previous-year questions only', async () => {
    const src = renderAt('/revise?pyq=1', source({ getReviewDue: vi.fn(async () => ({ items: [], masterAfter: 2 })) }));
    await vi.waitFor(() => expect(src.getReviewDue).toHaveBeenCalledWith({ pyq: true }));
  });
});

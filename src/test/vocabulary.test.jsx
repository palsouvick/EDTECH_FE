import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppRoutes } from '../App';
import { AuthProvider } from '../app/AuthContext';
import { DataSourceProvider } from '../app/DataSourceContext';
import { clearResourceCache } from '../hooks/useResource';
import { languageStore } from '../hooks/useLanguagePreference';
import { createFixtureDataSource } from '../lib/dataSource';

function renderVocabulary(source = createFixtureDataSource({ latencyMs: 0 })) {
  const user = userEvent.setup();
  render(
    <DataSourceProvider source={source}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/vocabulary']}>
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

describe('Vocabulary Mastery', () => {
  it('labels unreviewed Bengali meanings, hides the label once reviewed, and shows related words and the CMU credit', async () => {
    const base = createFixtureDataSource({ latencyMs: 0 });
    const source = {
      ...base,
      listVocabularyWords: async (params) => {
        const result = await base.listVocabularyWords(params);
        return {
          ...result,
          words: result.words.map((w, i) => ({
            ...w,
            bengaliReview: { status: i === 0 ? 'PENDING' : 'REVIEWED', reviewedAt: i === 0 ? null : '2026-10-29T00:00:00Z' },
            ...(i === 0 && {
              pronunciation: '/əˈbʌndənt/',
              pronunciationSource: 'CMUDICT',
              nearSynonyms: ['lavish'],
              confusables: [{ word: 'Abandon', noteEn: 'Different words.', noteBn: 'আলাদা শব্দ।' }],
            }),
          })),
        };
      },
    };
    renderVocabulary(source);
    const card = (await screen.findByRole('heading', { name: 'Abundant' })).closest('article');
    expect(within(card).getByText('Bengali meaning pending review')).toBeInTheDocument();
    expect(within(card).getByText('lavish')).toBeInTheDocument();
    expect(within(card).getByText(/Often confused with Abandon/)).toBeInTheDocument();
    expect(within(card).getByText('/əˈbʌndənt/')).toHaveAttribute('title', expect.stringMatching(/CMU Pronouncing Dictionary/));
    const reviewed = screen.getByRole('heading', { name: 'Benevolent' }).closest('article');
    expect(within(reviewed).queryByText('Bengali meaning pending review')).toBeNull();
    expect(screen.getByText(/Carnegie Mellon University, BSD licence/)).toBeInTheDocument();
  }, 15000);

  it('browses and filters bilingual word cards by English word and Bengali meaning', async () => {
    const { user } = renderVocabulary();
    await screen.findByRole('heading', { name: 'Abundant' });
    expect(screen.getByText('প্রচুর; প্রাচুর্যপূর্ণ')).toBeInTheDocument();
    expect(screen.getAllByText(/not PYQ verified/i).length).toBeGreaterThan(0);

    const search = screen.getByRole('searchbox', { name: /Search word or Bengali meaning/i });
    await user.type(search, 'প্রচুর');
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Abundant' })).toBeInTheDocument());
    await waitFor(() => expect(screen.queryByRole('heading', { name: 'Benevolent' })).not.toBeInTheDocument());
  }, 15000);

  it('keeps flashcard answers hidden until the student reveals them', async () => {
    const { user } = renderVocabulary();
    await screen.findByRole('heading', { name: 'Abundant' });
    await user.click(screen.getByRole('button', { name: 'Flashcards' }));
    const flashcards = screen.getByRole('heading', { name: 'Flashcards' }).closest('section');
    expect(within(flashcards).queryByText('প্রচুর; প্রাচুর্যপূর্ণ')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Reveal flashcard answer' }));
    expect(within(flashcards).getByText('প্রচুর; প্রাচুর্যপূর্ণ')).toBeInTheDocument();
  }, 15000);

  it('checks a generated question before revealing its explanation', async () => {
    const { user } = renderVocabulary();
    await screen.findByRole('heading', { name: 'Abundant' });
    await user.click(screen.getByRole('button', { name: 'Practice', exact: true }));
    await user.click(screen.getByRole('button', { name: 'Meaning' }));
    const practiceSection = screen.getByRole('heading', { name: 'Meaning practice' }).closest('section');
    const correct = await screen.findByRole('button', { name: 'প্রচুর; প্রাচুর্যপূর্ণ' });
    await user.click(correct);
    expect(within(practiceSection).queryByText('Available in large quantities.')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Check answer' }));
    expect(await within(practiceSection).findByText('Available in large quantities.')).toBeInTheDocument();
    expect(within(practiceSection).getByText('The region has abundant natural resources.')).toBeInTheDocument();
  }, 15000);

  it('saves learned status and the selected daily goal for a signed-in learner', async () => {
    const source = createFixtureDataSource({ latencyMs: 0 });
    await source.login({ email: 'student@example.test', password: 'password123' });
    const { user } = renderVocabulary(source);
    const wordCard = (await screen.findByRole('heading', { name: 'Abundant' })).closest('article');
    await user.click(within(wordCard).getByRole('button', { name: 'Mark learned' }));
    expect(await within(wordCard).findByRole('button', { name: 'Learned ✓' })).toBeInTheDocument();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Daily word target' }), '15');
    await waitFor(() => expect(screen.getByText('1 / 15')).toBeInTheDocument());
  }, 15000);
});

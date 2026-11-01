import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../App';
import { DataSourceProvider } from '../app/DataSourceContext';
import { AuthProvider } from '../app/AuthContext';
import { createFixtureDataSource } from '../lib/dataSource';
import { clearResourceCache } from '../hooks/useResource';
import { languageStore } from '../hooks/useLanguagePreference';
import { localEntries, mergeServerProgress, levelProgress, recordQuiz, syncLearnProgress } from '../lib/learnProgress';
import SourceCheckBadge from '../components/practice/SourceCheckBadge';

const t = (en, bn) => ({ en, bn });
const card = (code, extra = {}) => ({
  code,
  emoji: '🇮🇳',
  title: t(`Card ${code}`, `বিভাগ ${code}`),
  description: t('About it', 'বিষয়ে'),
  topics: [code],
  dated: false,
  factCount: 2,
  crossListedFactCount: 0,
  bengaliPendingCount: 2,
  questionCount: 10,
  sourceVerifiedQuestionCount: 3,
  section: 'india',
  subtopics: [
    { code: 'important_firsts', title: t('Important Firsts', 'প্রথম যাঁরা'), factCount: 2, questionCount: 6, progress: null },
    { code: 'national_symbols', title: t('National Symbols', 'জাতীয় প্রতীক'), factCount: 0, questionCount: 4, progress: null },
  ],
  otherQuestions: { questionCount: 0, progress: null },
  progress: null,
  ...extra,
});

/** /gk/cards response: sections are computed from the cards, as the server does. */
const SECTION_META = {
  india: { title: t('Indian GK', 'ভারত সাধারণ জ্ঞান'), description: t('All India GK', 'সব ভারত GK') },
  west_bengal: { title: t('West Bengal GK', 'পশ্চিমবঙ্গ সাধারণ জ্ঞান'), description: t('Separate', 'আলাদা') },
};
function cardsResponse(cards, signedIn = false) {
  const sections = Object.entries(SECTION_META).map(([code, meta]) => {
    const own = cards.filter((c) => c.section === code);
    const sum = (k) => own.reduce((a, c) => a + c[k], 0);
    const progress = signedIn
      ? own.reduce((a, c) => ({ questionsAttempted: a.questionsAttempted + (c.progress?.questionsAttempted || 0), completedCorrectly: a.completedCorrectly + (c.progress?.completedCorrectly || 0), answers: 0, correctAnswers: 0, accuracy: null }), { questionsAttempted: 0, completedCorrectly: 0 })
      : null;
    return { code, ...meta, cards: own.map((c) => c.code), topics: own.flatMap((c) => c.topics), questionCount: sum('questionCount'), sourceVerifiedQuestionCount: sum('sourceVerifiedQuestionCount'), factCount: sum('factCount'), progress };
  });
  return { signedIn, sections, cards };
}
const fact = (code, extra = {}) => ({
  id: code,
  code,
  topic: 'indian_gk',
  subtopic: 'important_firsts',
  tags: [],
  factKind: 'STATIC',
  title: t(`Title ${code}`, `শিরোনাম ${code}`),
  statement: t(`Statement ${code}`, `বিবৃতি ${code}`),
  explanation: t('Why', 'কেন'),
  milestones: [{ kind: 'FOUNDATION', date: '1972-12-29', note: null }],
  dates: { eventDate: null, validFrom: null, validTo: null, reviewBy: null },
  referenceYear: null,
  difficulty: 2,
  examRelevance: ['WBPSC_CLERKSHIP'],
  sources: [{ title: 'Metro Railway history', url: 'https://mtp.indianrailways.gov.in/x', publisher: 'Metro Railway', publisherType: 'OFFICIAL', accessedAt: '2026-10-31' }],
  verification: { status: 'VERIFIED', verifiedAt: '2026-11-01' },
  bengaliReview: 'PENDING',
  questionCount: 1,
  ...extra,
});

function stubSource(overrides = {}) {
  return {
    ...createFixtureDataSource({ latencyMs: 0 }),
    getGkCards: vi.fn(async () => cardsResponse([card('indian_gk'), card('economy', { topics: ['economy', 'banking_awareness'] }), card('west_bengal_gk', { section: 'west_bengal' })])),
    countGkQuestions: vi.fn(async ({ subtopic }) => ({ count: subtopic === 'national_symbols' ? 0 : 7 })),
    listGkFacts: vi.fn(async ({ offset = 0 }) => ({
      facts: offset === 0 ? [fact('GK-IGK-001'), fact('GK-IGK-002', { bengaliReview: 'REVIEWED' })] : [fact('GK-IGK-003')],
      pagination: { offset, limit: 20, total: 3, hasMore: offset === 0 },
    })),
    getGkCurrentAffairsMonths: vi.fn(async () => ({ months: [] })),
    getLearnChapter: vi.fn(async (subject, topic) => ({
      subject: { code: 'gs' },
      topic,
      title: t(`Chapter ${topic}`, `অধ্যায় ${topic}`),
      lesson: null,
      levels: [
        { level: 'beginner', count: 30, questionCount: 10, timed: false },
        { level: 'intermediate', count: 0, questionCount: 0, timed: false },
        { level: 'advanced', count: 12, questionCount: 10, timed: true },
      ],
    })),
    ...overrides,
  };
}

function renderAt(path, source = stubSource()) {
  const user = userEvent.setup();
  render(
    <DataSourceProvider source={source}>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
      </MemoryRouter>
    </DataSourceProvider>,
  );
  return { user, source };
}

beforeEach(() => {
  localStorage.clear();
  clearResourceCache();
  act(() => languageStore.set('en'));
});

describe('GK dashboard', () => {
  it('shows real counts and no progress figures for a guest', async () => {
    renderAt('/learn/gk');
    expect(await screen.findByText('Card indian_gk')).toBeInTheDocument();
    const igk = screen.getByText('Card indian_gk').closest('a');
    expect(within(igk).getByText('2 facts')).toBeInTheDocument();
    expect(within(igk).getByText('10 questions')).toBeInTheDocument();
    expect(within(igk).getByText('3 of 10 questions source-checked')).toBeInTheDocument();
    expect(within(igk).queryByRole('progressbar')).toBeNull();
    expect(screen.getByText('Sign in to keep your progress on every device.')).toBeInTheDocument();
    const current = screen.getAllByRole('link').filter((l) => l.getAttribute('aria-current') === 'page');
    // The site navigation's Learn link is current too; one current link is the GK tab.
    expect(current.filter((l) => /\bGK\b/.test(l.textContent))).toHaveLength(1);
  });

  it('shows a signed-in student only their own recorded progress', async () => {
    const source = stubSource({
      getGkCards: vi.fn(async () => cardsResponse([
        card('indian_gk', { progress: { questionsAttempted: 4, completedCorrectly: 3, answers: 5, correctAnswers: 3, accuracy: 60 } }),
        card('economy', { progress: { questionsAttempted: 0, completedCorrectly: 0, answers: 0, correctAnswers: 0, accuracy: null } }),
      ], true)),
    });
    renderAt('/learn/gk', source);
    expect(await screen.findByText('4 questions tried · 60% correct')).toBeInTheDocument();
    expect(screen.getAllByText('3 of 10 questions answered correctly').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Not started yet')).toHaveLength(2);
  });
});

describe('GK chapter', () => {
  it('lists facts with honest labels, loads more on request, and links level quizzes', async () => {
    const { user, source } = renderAt('/learn/gk/indian-gk');
    expect(await screen.findByText('Statement GK-IGK-001')).toBeInTheDocument();
    expect(screen.getAllByText('Verified from source')).toHaveLength(2);
    expect(screen.getAllByText('Bengali translation pending review')).toHaveLength(1); // the reviewed one has none
    expect(screen.getByText('Showing 2 of 3')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Show more facts/ }));
    expect(await screen.findByText('Statement GK-IGK-003')).toBeInTheDocument();
    expect(source.listGkFacts).toHaveBeenLastCalledWith(expect.objectContaining({ card: 'indian_gk', offset: 2, limit: 20 }));

    const [first] = screen.getAllByRole('button', { name: /Why it matters/ });
    await user.click(first);
    expect(screen.getByRole('link', { name: 'Metro Railway history' })).toHaveAttribute('href', 'https://mtp.indianrailways.gov.in/x');
    expect(screen.getByText('Foundation stone')).toBeInTheDocument();

    expect(await screen.findByRole('link', { name: /Beginner/ })).toHaveAttribute('href', '/learn/gk/indian-gk/quiz/beginner');
    expect(screen.queryByRole('link', { name: /Intermediate/ })).toBeNull(); // no questions at that level
  });

  it('filters by search text after a short pause', async () => {
    const { user, source } = renderAt('/learn/gk/indian-gk');
    await screen.findByText('Statement GK-IGK-001');
    await user.type(screen.getByRole('searchbox'), 'metro');
    await vi.waitFor(() => expect(source.listGkFacts).toHaveBeenLastCalledWith(expect.objectContaining({ q: 'metro', offset: 0 })));
  });

  it('a question-bank chapter slug opens its card (banking awareness → economy)', async () => {
    renderAt('/learn/gk/banking-awareness');
    expect(await screen.findByRole('heading', { name: /Card economy/ })).toBeInTheDocument();
  });

  it('Bengali text is already in the page, so switching language keeps the place', async () => {
    renderAt('/learn/gk/indian-gk');
    await screen.findByText('Statement GK-IGK-001');
    act(() => languageStore.set('bn'));
    expect(screen.getByText('বিবৃতি GK-IGK-001')).toBeInTheDocument();
    expect(screen.getAllByText('বাংলা অনুবাদ পর্যালোচনার অপেক্ষায়')).toHaveLength(1);
  });
});

describe('source-check badge', () => {
  it('says exactly what was checked', () => {
    const { rerender } = render(<SourceCheckBadge check={{ status: 'SOURCE_PENDING' }} />);
    expect(screen.getByText('Practice question · source pending')).toBeInTheDocument();
    rerender(<SourceCheckBadge check={{ status: 'SOURCE_VERIFIED', sourceUrl: 'https://rbi.org.in/x', sourceTitle: 'RBI' }} />);
    expect(screen.getByRole('link', { name: /Source verified/ })).toHaveAttribute('href', 'https://rbi.org.in/x');
    rerender(<SourceCheckBadge check={{ status: 'NEEDS_REVIEW' }} />);
    expect(screen.getByText('Under review')).toBeInTheDocument();
    rerender(<SourceCheckBadge check={null} />);
    expect(screen.queryByText(/source/i)).toBeNull();
  });
});

describe('Learn progress sync', () => {
  it('uploads this device, merges the account copy, and keeps the better best score', async () => {
    recordQuiz('gs', 'indian_gk', 'beginner', { questionIds: ['a'.repeat(24)], correct: 4, total: 10 });
    const putLearnProgress = vi.fn(async () => ({
      progress: {
        'gs.indian_gk.beginner': { best: { correct: 8, total: 10 }, seen: ['b'.repeat(24)], fingerprints: [], patterns: [] },
        'quant.percentage.advanced': { best: { correct: 2, total: 10 }, seen: [], fingerprints: [], patterns: [] },
      },
    }));
    await syncLearnProgress({ getLearnProgress: vi.fn(), putLearnProgress });
    expect(putLearnProgress).toHaveBeenCalledWith([{ subject: 'gs', topic: 'indian_gk', level: 'beginner', best: { correct: 4, total: 10 }, seen: ['a'.repeat(24)], fingerprints: [], patterns: [] }]);
    expect(levelProgress('gs', 'indian_gk', 'beginner').best).toEqual({ correct: 8, total: 10 });
    expect(levelProgress('gs', 'indian_gk', 'beginner').seen.sort()).toEqual(['a'.repeat(24), 'b'.repeat(24)]);
    expect(levelProgress('quant', 'percentage', 'advanced').best).toEqual({ correct: 2, total: 10 });
    expect(localEntries()).toHaveLength(2);
  });

  it('a worse score from the account never replaces this device\'s better one, and failures are silent', async () => {
    recordQuiz('gs', 'polity', 'beginner', { questionIds: [], correct: 9, total: 10 });
    mergeServerProgress({ 'gs.polity.beginner': { best: { correct: 1, total: 10 }, seen: [] } });
    expect(levelProgress('gs', 'polity', 'beginner').best).toEqual({ correct: 9, total: 10 });
    await expect(syncLearnProgress({ getLearnProgress: vi.fn(async () => { throw new Error('offline'); }), putLearnProgress: vi.fn(async () => { throw new Error('offline'); }) })).resolves.toBeUndefined();
  });
});

describe('Indian GK expansion', () => {
  const signedInSource = (overrides = {}) => stubSource({
    getMe: vi.fn(async () => ({ user: { id: 'u1', name: 'Student', email: 's@example.test' } })),
    getLearnProgress: vi.fn(async () => ({ progress: {} })),
    putLearnProgress: vi.fn(async () => ({ progress: {} })),
    getGkCards: vi.fn(async () => cardsResponse([
      card('indian_gk', {
        progress: { questionsAttempted: 3, completedCorrectly: 2, answers: 3, correctAnswers: 2, accuracy: 67 },
        subtopics: [{ code: 'important_firsts', title: t('Important Firsts', 'প্রথম যাঁরা'), factCount: 2, questionCount: 6, progress: { questionsAttempted: 3, completedCorrectly: 2, answers: 3, correctAnswers: 2, accuracy: 67 } }],
      }),
    ], true)),
    listGkFacts: vi.fn(async () => ({ facts: [fact('GK-IGK-001', { mine: { bookmarked: false, status: 'new', dueAt: null, lastResult: null } })], pagination: { offset: 0, limit: 20, total: 1, hasMore: false } })),
    setGkFactBookmark: vi.fn(async (_code, on) => ({ bookmarked: on, status: 'new', dueAt: null, lastResult: null })),
    reviewGkFact: vi.fn(async () => ({ bookmarked: true, status: 'learning', dueAt: '2026-11-03T00:00:00.000Z', lastResult: 'known' })),
    ...overrides,
  });
  const renderSignedIn = (path, source) => {
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
  };

  it('the dashboard shows Indian GK and West Bengal GK as separate sections with real totals', async () => {
    renderAt('/learn/gk');
    expect(await screen.findByRole('heading', { name: /Indian GK/ })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /West Bengal GK/ })).toBeInTheDocument();
    expect(screen.getAllByText('20 questions · 4 facts').length).toBeGreaterThan(0); // two India cards of 10
    expect(screen.getAllByRole('button', { name: /Mock test: all of this section/ }).length).toBe(2);
  });

  it('chapter: topic-wise progress, filtered practice with a live count, then the practice arena', async () => {
    const practiceSource = vi.fn(() => createFixtureDataSource({ latencyMs: 0 }).practiceSource({ category: 'WBPSC', subject: 'gs', topic: 'indian_gk' }));
    const { user, source } = renderAt('/learn/gk/indian-gk', stubSource({ practiceSource }));
    expect(await screen.findByRole('heading', { name: /Topic-wise progress/ })).toBeInTheDocument();
    expect(screen.getByText('6 Q')).toBeInTheDocument();
    expect(await screen.findByText('7 questions match')).toBeInTheDocument();

    const practice = within(screen.getByRole('region', { name: /Practise one question at a time/ }));
    const sub = practice.getByRole('combobox', { name: /Subcategory/ });
    await user.selectOptions(sub, 'national_symbols');
    expect(await screen.findByText(/No questions match these filters/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start practice/ })).toBeDisabled();
    expect(source.countGkQuestions).toHaveBeenLastCalledWith(expect.objectContaining({ category: 'WBPSC', topic: 'indian_gk', subtopic: 'national_symbols' }));

    await user.selectOptions(sub, '');
    await user.selectOptions(practice.getByRole('combobox', { name: /Difficulty/ }), 'hard');
    await screen.findByText('7 questions match');
    await user.click(screen.getByRole('button', { name: /Start practice/ }));
    expect(practiceSource).toHaveBeenCalledWith(expect.objectContaining({ category: 'WBPSC', subject: 'gs', topic: 'indian_gk', difficulty: 'hard', verifiedOnly: false }));
    expect(screen.getByRole('button', { name: /Change filters/ })).toBeInTheDocument();
  });

  it('a signed-in student bookmarks and revises a fact; progress shows completed of total', async () => {
    const { user, source } = renderSignedIn('/learn/gk/indian-gk', signedInSource());
    expect((await screen.findAllByText('2 of 10 questions answered correctly')).length).toBeGreaterThan(0);
    const bookmark = await screen.findByRole('button', { name: /Bookmark/ });
    await user.click(bookmark);
    expect(source.setGkFactBookmark).toHaveBeenCalledWith('GK-IGK-001', true);
    expect(await screen.findByRole('button', { name: /Bookmarked/ })).toHaveAttribute('aria-pressed', 'true');
    await user.click(screen.getByRole('button', { name: /I knew this/ }));
    expect(source.reviewGkFact).toHaveBeenCalledWith('GK-IGK-001', 'known');
    expect(await screen.findByText(/Next revision: 3 Nov 2026/)).toBeInTheDocument();
  });

  it('revision centre: guests are asked to sign in; a student sees Daily GK, due facts and bookmarks', async () => {
    renderAt('/learn/gk/revision', stubSource({ getMe: vi.fn(async () => ({ user: null })) }));
    expect(await screen.findByRole('heading', { name: /Revision centre/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Mistake notebook/ })).toHaveAttribute('href', '/mistakes');
  });

  it('revision centre for a signed-in student', async () => {
    const source = signedInSource({
      getGkDaily: vi.fn(async () => ({ day: '2026-11-01', total: 2, done: 1, items: [
        { done: true, fact: fact('GK-IGK-001', { mine: { bookmarked: false, status: 'learning', dueAt: null, lastResult: 'known' } }) },
        { done: false, fact: fact('GK-IGK-002', { mine: { bookmarked: false, status: 'new', dueAt: null, lastResult: null } }) },
      ] })),
      getGkRevision: vi.fn(async () => ({ counts: { due: 0, learning: 1, mastered: 0, bookmarked: 0 }, due: [] })),
      listGkFacts: vi.fn(async () => ({ facts: [], pagination: { offset: 0, limit: 20, total: 0, hasMore: false } })),
    });
    renderSignedIn('/learn/gk/revision', source);
    expect(await screen.findByText('1 of 2 done today')).toBeInTheDocument();
    expect(screen.getByText('Statement GK-IGK-002')).toBeInTheDocument();
    expect(screen.queryByText('Statement GK-IGK-001')).toBeNull(); // done today
    expect(await screen.findByText('Nothing is due right now.')).toBeInTheDocument();
    expect(await screen.findByText(/No bookmarked facts yet/)).toBeInTheDocument();
    expect(source.listGkFacts).toHaveBeenCalledWith(expect.objectContaining({ mine: 'bookmarked' }));
  });
});

import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../App';
import { DataSourceProvider } from '../app/DataSourceContext';
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
  subtopics: [{ code: 'important_firsts', title: t('Important Firsts', 'প্রথম যাঁরা'), factCount: 2 }],
  progress: null,
  ...extra,
});
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
    getGkCards: vi.fn(async () => ({ signedIn: false, cards: [card('indian_gk'), card('economy', { topics: ['economy', 'banking_awareness'] })] })),
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
    expect(screen.getByRole('link', { name: /GK/ })).toHaveAttribute('aria-current', 'page');
  });

  it('shows a signed-in student only their own recorded progress', async () => {
    const source = stubSource({
      getGkCards: vi.fn(async () => ({ signedIn: true, cards: [card('indian_gk', { progress: { questionsAttempted: 4, answers: 5, correctAnswers: 3, accuracy: 60 } }), card('economy', { progress: { questionsAttempted: 0, answers: 0, correctAnswers: 0, accuracy: null } })] })),
    });
    renderAt('/learn/gk', source);
    expect(await screen.findByText('4 questions tried · 60% correct')).toBeInTheDocument();
    expect(screen.getByText('Not started yet')).toBeInTheDocument();
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

import { act, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../App';
import { AuthProvider } from '../app/AuthContext';
import { DataSourceProvider } from '../app/DataSourceContext';
import { createFixtureDataSource } from '../lib/dataSource';
import { clearResourceCache } from '../hooks/useResource';
import { languageStore } from '../hooks/useLanguagePreference';
import { learnLinkPath } from '../lib/learnLink';
import LearnThisLink from '../components/review/LearnThisLink';
import FeedbackPanel from '../components/practice/FeedbackPanel';
import ReviewMatrix from '../components/analytics/ReviewMatrix';

const t = (en, bn) => ({ en, bn });

// What the API sends (F6): a book section for a History PYQ, a GK fact, a Math lesson, a Reasoning concept sheet.
const BOOK = {
  kind: 'book', card: 'indian_history', book: 'history', chapter: 'HIS-19', section: 'repression',
  crumbs: [t('Indian History', 'ভারতের ইতিহাস'), { bn: '১৮৫৭-র মহাবিদ্রোহ' }, { bn: 'দমন ও পরিণতি' }],
};
const FACT = { kind: 'fact', code: 'GK-HIS-901', card: 'indian_history', crumbs: [t('Indian History', 'ভারতের ইতিহাস'), t('Revolt of 1857', '১৮৫৭-র বিদ্রোহ'), t('Barrackpore, 1857', 'ব্যারাকপুর')] };
const LESSON = { kind: 'lesson', subject: 'quant', topic: 'profit_loss', crumbs: [t('Mathematics', 'গণিত'), t('Profit & Loss', 'লাভ ও ক্ষতি')] };
const SHEET = { kind: 'sheet', category: 'WB_POLICE', subject: 'reasoning', topic: 'blood_relations', crumbs: [t('Reasoning', 'যুক্তি'), t('Blood Relations', 'রক্তের সম্পর্ক')] };

/** Subject → Chapter → Topic, in order (each label is rendered in every language, so match the item). */
function expectCrumbs(box, labels) {
  const items = within(box).getAllByRole('listitem');
  expect(items).toHaveLength(labels.length);
  labels.forEach((label, i) => expect(items[i]).toHaveTextContent(label));
  expect(items[1]).toHaveTextContent('→');
}

const at = (path, ui) => render(<MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>);

beforeEach(() => {
  localStorage.clear();
  clearResourceCache();
  act(() => languageStore.set('en'));
});

describe('learn link targets', () => {
  it('turns each kind of target into the page that teaches it', () => {
    expect(learnLinkPath(BOOK)).toBe('/learn/gk/indian-history/book/HIS-19#sec-repression');
    expect(learnLinkPath({ ...BOOK, section: null })).toBe('/learn/gk/indian-history/book/HIS-19');
    expect(learnLinkPath(FACT)).toBe('/learn/gk/topic/GK-HIS-901');
    expect(learnLinkPath(LESSON)).toBe('/learn/math/profit-loss');
    expect(learnLinkPath(SHEET)).toBe('/exams/wb-police/reasoning/blood-relations');
  });

  it('never makes a link without a reliable target', () => {
    expect(learnLinkPath(null)).toBeNull();
    expect(learnLinkPath({ kind: 'lesson', subject: 'gs', topic: 'polity' })).toBeNull(); // no GS lessons
    expect(learnLinkPath({ kind: 'unknown' })).toBeNull();
    at('/practice', <LearnThisLink learn={null} />);
    expect(screen.queryByTestId('learn-this')).toBeNull();
  });
});

describe('📖 Learn this topic', () => {
  it('shows the link with Subject → Chapter → Topic', () => {
    at('/pyq', <LearnThisLink learn={BOOK} />);
    const box = screen.getByTestId('learn-this');
    expect(within(box).getByRole('link', { name: /learn this topic/i })).toHaveAttribute('href', '/learn/gk/indian-history/book/HIS-19#sec-repression');
    expectCrumbs(box, ['Indian History', '১৮৫৭-র মহাবিদ্রোহ', 'দমন ও পরিণতি']);
  });

  it('is hidden on the page it points to, but a section of the same chapter still shows (it scrolls there)', () => {
    const { unmount } = at('/learn/math/profit-loss', <LearnThisLink learn={LESSON} />);
    expect(screen.queryByTestId('learn-this')).toBeNull();
    unmount();
    at('/learn/gk/indian-history/book/HIS-19', <LearnThisLink learn={BOOK} newTab />);
    const link = screen.getByRole('link', { name: /learn this topic/i });
    expect(link).not.toHaveAttribute('target'); // same page: no new tab
  });

  it('wrong question: practice / PYQ feedback shows the link, opening in a new tab', () => {
    const question = { options: [{ optionId: 'opt_a', text: t('Canning', 'ক্যানিং') }, { optionId: 'opt_b', text: t('Dalhousie', 'ডালহৌসি') }] };
    const result = { isCorrect: false, correctOptionId: 'opt_a', selectedOptionId: 'opt_b', explanation: { items: [t('Because.', 'কারণ।')] }, commonTraps: [], learn: BOOK };
    at('/pyq', <FeedbackPanel result={result} question={question} inARow={0} />);
    const link = within(screen.getByTestId('learn-this')).getByRole('link');
    expect(link).toHaveAttribute('href', '/learn/gk/indian-history/book/HIS-19#sec-repression');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('mock result: each reviewed question shows its link outside the collapsed solution', () => {
    const row = (seq, learn) => ({
      questionId: `q${seq}`, seq, topic: 'profit_loss', outcome: 'INCORRECT', selectedOptionId: `o${seq}b`, correctOptionId: `o${seq}a`, marks: -0.5, marksLost: 2.5, timeSpentSec: 30,
      stem: { en: `Q${seq}` }, options: ['a', 'b', 'c', 'd'].map((x) => ({ optionId: `o${seq}${x}`, text: { en: x } })), explanation: { steps: [], traps: [] }, learn,
    });
    at('/mock/s1', <ReviewMatrix review={[row(1, LESSON), row(2, null)]} topicNames={{ profit_loss: t('Profit & Loss', 'লাভ ও ক্ষতি') }} />);
    const links = screen.getAllByTestId('learn-this');
    expect(links).toHaveLength(1); // the question without a source gets none
    expect(within(links[0]).getByRole('link')).toHaveAttribute('href', '/learn/math/profit-loss');
  });

  it('mistake page: the notebook shows where to learn each mistake', async () => {
    const q = { questionId: 'q7', stem: t('Who was Governor-General in 1857?', '১৮৫৭ সালে গভর্নর-জেনারেল কে ছিলেন?'), options: [{ optionId: 'opt_a7aaa', text: t('Canning', 'ক্যানিং') }, { optionId: 'opt_b7bbb', text: t('Dalhousie', 'ডালহৌসি') }] };
    const source = {
      ...createFixtureDataSource({ latencyMs: 0 }),
      getMe: async () => ({ user: { id: 'u1', name: 'Riya', email: 'riya@example.com' } }),
      getReviewSummary: vi.fn(async () => ({ dueToday: 0, active: 1, mastered: 0, mistakesActive: 1, nextDueAt: null, masterAfter: 2 })),
      getMistakes: vi.fn(async ({ status }) => ({
        counts: { active: 1, mastered: 0 }, total: 1, hasMore: false,
        groups: [{ subject: 'gs', topic: 'indian_history', topicName: t('Indian History', 'ভারতের ইতিহাস'), count: 1 }],
        items: [{ status, wrongCount: 1, lastWrongAt: '2026-11-18T10:00:00Z', source: 'practice', dueAt: '2026-11-20T10:00:00Z', topicName: t('Indian History', 'ভারতের ইতিহাস'), yourOptionId: 'opt_b7bbb', correctOptionId: 'opt_a7aaa', steps: [t('Canning.', 'ক্যানিং।')], shortcut: null, trapForSelected: null, learn: FACT, question: q }],
      })),
    };
    render(
      <DataSourceProvider source={source}>
        <AuthProvider>
          <MemoryRouter initialEntries={['/mistakes']}>
            <AppRoutes />
          </MemoryRouter>
        </AuthProvider>
      </DataSourceProvider>,
    );
    const box = await screen.findByTestId('learn-this');
    expect(within(box).getByRole('link', { name: /learn this topic/i })).toHaveAttribute('href', '/learn/gk/topic/GK-HIS-901');
    expectCrumbs(box, ['Indian History', 'Revolt of 1857', 'Barrackpore, 1857']);
  });
});

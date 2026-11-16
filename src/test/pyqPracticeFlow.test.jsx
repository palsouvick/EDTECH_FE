import 'fake-indexeddb/auto';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../App';
import { DataSourceProvider } from '../app/DataSourceContext';
import { AuthProvider } from '../app/AuthContext';
import { createFixtureDataSource } from '../lib/dataSource';
import { clearResourceCache } from '../hooks/useResource';
import { languageStore } from '../hooks/useLanguagePreference';

// jsdom has no IntersectionObserver, which makes the Practice Arena look permanently
// on screen and hide the hub's CTA bar. Model a page scrolled to the top instead.
globalThis.IntersectionObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const t = (en, bn) => ({ en, bn });
const EXAM_WBCS = 'WBCS (Exe.) Prelims';
const EXAM_CLERK = 'WBPSC Clerkship (Part-I)';
const EXAM_IDO = 'Industrial Development Officer';
const filters = {
  exams: [
    { name: EXAM_WBCS, count: 1690, years: [2024, 2023, 2022, 2021, 2019], papers: [{ year: 2024, count: 200, paperUrl: 'https://psc.wb.gov.in/p.pdf', answerKeyUrl: 'https://psc.wb.gov.in/k.pdf', answerBasis: 'OFFICIAL_KEY', paperBasis: 'OFFICIAL_PAPER' }] },
    { name: EXAM_CLERK, count: 893, years: [2023, 2019, 2009], papers: [] },
    { name: EXAM_IDO, count: 96, years: [2019], papers: [] },
  ],
  topics: [
    { subject: 'quant', subjectName: t('Mathematics', 'গণিত'), topic: 'percentage', name: t('Percentage', 'শতকরা'), count: 100, byYear: { 2024: 100 } },
    { subject: 'english', subjectName: t('English', 'ইংরেজি'), topic: 'grammar', name: t('Grammar', 'ব্যাকরণ'), count: 90, byYear: { 2024: 90 } },
    { subject: 'gs', subjectName: t('General Studies', 'সাধারণ অধ্যয়ন'), topic: 'polity', name: t('Polity', 'রাষ্ট্রবিজ্ঞান'), count: 200, byYear: { 2024: 200 } },
  ],
};

const previewFor = (available, extra = {}) => ({
  subject: 'quant', preset: 'pyq', topics: [], questionCount: Math.min(10, available), requested: 10,
  shortBy: Math.max(0, 10 - available), difficulty: 'mixed', distribution: 'balanced', mode: 'exam',
  plan: [], recommendedMinutes: 12, followUp: null,
  pyq: { exam: null, year: 'all', yearFrom: null, yearTo: null, repeatMode: 'all', available, years: [2024, 2023, 2022, 2021, 2019], ...extra },
});

const sessionId = 'a'.repeat(24);
const mockSession = (over = {}) => ({
  sessionId,
  status: 'ACTIVE',
  config: {
    category: 'WBPSC', subject: 'quant', topicIds: [], language: 'en', questionCount: 10,
    timeLimitMinutes: 10, perQuestionTimer: false, perQuestionLimitSec: null, allowPause: true,
    markingScheme: { positive: 1, negative: 0, basis: 'PRACTICE', examCode: null, sourceUrl: null },
  },
  custom: {
    preset: 'pyq', mode: 'exam', difficulty: 'mixed', distribution: 'balanced', topics: [], plan: [],
    recommendedMinutes: 12, followUpOf: null, checked: {},
    pyq: { exam: null, year: 'all', yearFrom: null, yearTo: null, repeatMode: 'all' },
  },
  startedAt: new Date().toISOString(),
  expiresAt: new Date(Date.now() + 72 * 3600_000).toISOString(),
  notes: { pyq: 10, shortBy: 0 },
  questions: Array.from({ length: 10 }, (_, i) => ({
    questionId: `${'b'.repeat(23)}${i}`,
    seq: i + 1,
    topic: 'percentage',
    difficulty: 2,
    stem: t(`PYQ question ${i + 1}`, `PYQ প্রশ্ন ${i + 1}`),
    options: ['A', 'B', 'C', 'D'].map((x, k) => ({ optionId: `opt_${i}_${k}`, text: t(`${x} option`, `${x} বিকল্প`) })),
    pyq: [{ examName: EXAM_WBCS, year: 2024, tier: 'PRELIMS', questionNo: i + 1, answerBasis: 'OFFICIAL_KEY', paperBasis: 'OFFICIAL_PAPER' }],
  })),
  ...over,
});

function Location() {
  return <output data-testid="path">{useLocation().pathname}</output>;
}

function renderAt(path, overrides = {}) {
  const source = {
    ...createFixtureDataSource({ latencyMs: 0 }),
    getMe: vi.fn(async () => ({ user: { id: 'u1', name: 'Test', email: 't@example.com' } })),
    getPyqFilters: vi.fn(async () => filters),
    previewCustomTest: vi.fn(async () => previewFor(83)),
    createCustomTest: vi.fn(async () => mockSession()),
    ...overrides,
  };
  const user = userEvent.setup();
  render(
    <DataSourceProvider source={source}>
      <AuthProvider>
        <MemoryRouter initialEntries={[path]}>
          <AppRoutes />
          <Location />
        </MemoryRouter>
      </AuthProvider>
    </DataSourceProvider>,
  );
  return { user, source };
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  clearResourceCache();
  languageStore.set('en');
});

const path = () => screen.getByTestId('path').textContent;

async function openModal(user) {
  await user.click(await screen.findByRole('button', { name: /Start PYQ practice in Mathematics/ }));
  return screen.getByRole('dialog', { name: /Build your PYQ test/ });
}

describe('subject-wise PYQ practice', () => {
  it('shows one card per subject with the live available count', async () => {
    renderAt('/pyq');
    expect(await screen.findByText('100 PYQs available')).toBeInTheDocument();
    expect(screen.getByText('90 PYQs available')).toBeInTheDocument();
    expect(screen.getByText('200 PYQs available')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^GK \/ General Studies/ })).toBeInTheDocument();
    // The exam-wise section below is untouched.
    expect(screen.getByRole('heading', { name: /^Year-wise papers/ })).toBeInTheDocument();
  });

  it('the specified flow: Mathematics → All West Bengal Exams → 10 questions → 10 minutes', async () => {
    const { user, source } = renderAt('/pyq');
    const modal = await openModal(user);
    expect(within(modal).getByRole('radio', { name: /^All West Bengal Exams/, checked: true })).toBeInTheDocument();
    expect(within(modal).getByRole('radio', { name: /^10$/, checked: true })).toBeInTheDocument();
    expect(await within(modal).findByText('83 PYQs match these filters')).toBeInTheDocument();
    expect(within(modal).getByText(/Practice marking: \+1 correct, 0 for wrong/)).toBeInTheDocument();

    await user.click(within(modal).getByRole('button', { name: /Start test/ }));
    await waitFor(() => expect(source.createCustomTest).toHaveBeenCalledWith(expect.objectContaining({
      subject: 'quant', preset: 'pyq', questionCount: 10, timeLimitMinutes: 10,
      difficulty: 'mixed', mode: 'exam', repeatMode: 'all', language: 'en',
    })));
    expect(source.createCustomTest.mock.calls[0][0]).not.toHaveProperty('pyqExam');
    await waitFor(() => expect(path()).toBe(`/mock/${sessionId}`));
    await screen.findByText(/Question 1 of 10/);
  }, 20_000);

  it('exam, difficulty and repeat choices reach the preview and the create call', async () => {
    const { user, source } = renderAt('/pyq');
    const modal = await openModal(user);
    await user.click(within(modal).getByRole('radio', { name: EXAM_CLERK }));
    await user.click(within(modal).getByRole('radio', { name: /^Easy/ }));
    await user.click(within(modal).getByRole('radio', { name: /^Unattempted only/ }));
    await waitFor(() => expect(source.previewCustomTest).toHaveBeenCalledWith(expect.objectContaining({
      pyqExam: EXAM_CLERK, difficulty: 'easy', repeatMode: 'unattempted',
    })));
    await user.click(within(modal).getByRole('button', { name: /Start test/ }));
    await waitFor(() => expect(source.createCustomTest).toHaveBeenCalledWith(expect.objectContaining({
      pyqExam: EXAM_CLERK, difficulty: 'easy', repeatMode: 'unattempted',
    })));
  }, 20_000);

  it('a shortfall is stated plainly and the test starts with what matched', async () => {
    const preview = vi.fn(async (body) => previewFor(7, { available: 7 }));
    const { user, source } = renderAt('/pyq', { previewCustomTest: preview });
    const modal = await openModal(user);
    expect(await within(modal).findByText('7 PYQs match these filters')).toBeInTheDocument();
    expect(within(modal).getByText(/Only 7 PYQs match \(you asked for 10\)/)).toBeInTheDocument();
    await user.click(within(modal).getByRole('button', { name: /Start test with 7 questions/ }));
    await waitFor(() => expect(source.createCustomTest).toHaveBeenCalled());
  }, 20_000);

  it('fewer than 5 matching PYQs cannot start a test', async () => {
    const preview = vi.fn(async () => previewFor(3, { available: 3 }));
    const { user } = renderAt('/pyq', { previewCustomTest: preview });
    const modal = await openModal(user);
    expect(await within(modal).findByText(/Only 3 PYQs match — too few for a test/)).toBeInTheDocument();
    expect(within(modal).getByRole('button', { name: /Start test/ })).toBeDisabled();
  }, 20_000);

  it('signed-out students get a sign-in link on the subject card, not the setup', async () => {
    const source = {
      ...createFixtureDataSource({ latencyMs: 0 }),
      getMe: vi.fn(async () => ({ user: null })),
      getPyqFilters: vi.fn(async () => filters),
    };
    render(
      <DataSourceProvider source={source}>
        <AuthProvider>
          <MemoryRouter initialEntries={['/pyq']}>
            <AppRoutes />
          </MemoryRouter>
        </AuthProvider>
      </DataSourceProvider>,
    );
    const links = await screen.findAllByRole('link', { name: /Start PYQ practice/ });
    expect(links).toHaveLength(3);
    expect(links[0]).toHaveAttribute('href', expect.stringContaining('/login'));
    expect(screen.queryByRole('dialog', { name: /Build your PYQ test/ })).not.toBeInTheDocument();
  });
});

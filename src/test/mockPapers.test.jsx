import { render, screen } from '@testing-library/react';
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
import AccountButton from '../components/auth/AccountButton';
import MockPapersAdmin from '../components/admin/MockPapersAdmin';

const PAPERS = [
  {
    id: 'paper1',
    title: 'Capital Cities Mock',
    sourceLabel: 'Telegram group X, 24 Nov 2026 mock',
    subject: 'gs',
    language: 'en',
    questionCount: 2,
    timeLimitMin: 2,
    createdAt: '2026-11-24T10:00:00.000Z',
    myAttempts: { count: 1, bestScore: 1 },
  },
  {
    id: 'paper2',
    title: 'Ratio Mock',
    sourceLabel: 'Website Y, Clerkship mock 12',
    subject: 'quant',
    language: 'both',
    questionCount: 5,
    timeLimitMin: 5,
    createdAt: '2026-11-23T10:00:00.000Z',
    myAttempts: { count: 0, bestScore: null },
  },
];

const ACTIVE_ATTEMPT = {
  attempt: { id: 'att1', paperId: 'paper1', order: [1, 0], timeLimitMin: 30, startedAt: new Date().toISOString() },
  questions: [
    { questionIndex: 1, n: 2, stemEn: 'Second question?', stemBn: null, options: ['X', 'Y', 'Z', 'W'] },
    { questionIndex: 0, n: 1, stemEn: 'First question?', stemBn: null, options: ['A1', 'B1', 'C1', 'D1'] },
  ],
};

const RESULT = {
  attempt: { id: 'att1', score: 1, total: 2, timeUsedSec: 65, submittedAt: new Date().toISOString() },
  review: [
    { questionIndex: 1, n: 2, stemEn: 'Second question?', stemBn: null, options: ['X', 'Y', 'Z', 'W'], selected: 1, correctIndex: 1, correct: true, explanationEn: 'Because Y.', explanationBn: null },
    { questionIndex: 0, n: 1, stemEn: 'First question?', stemBn: null, options: ['A1', 'B1', 'C1', 'D1'], selected: 0, correctIndex: 2, correct: false, explanationEn: null, explanationBn: null },
  ],
};

const ADMIN_PAPER = {
  id: 'paper1',
  title: 'Capital Cities Mock',
  sourceLabel: 'Telegram group X',
  subject: 'gs',
  language: 'en',
  status: 'DRAFT',
  questions: [
    { n: 1, stemEn: 'What is the capital of West Bengal?', stemBn: null, options: ['Delhi', 'Kolkata', 'Mumbai', 'Chennai'], correctIndex: null, explanationEn: null, explanationBn: null, warnings: [] },
  ],
  unparsed: [],
  createdAt: '2026-11-24T10:00:00.000Z',
  updatedAt: '2026-11-24T10:00:00.000Z',
};

function stubSource(over = {}) {
  return {
    ...createFixtureDataSource({ latencyMs: 0 }),
    getMe: async () => ({ user: { id: 'u1', name: 'Riya', email: 'riya@example.com' } }),
    listMockPapers: vi.fn(async () => ({ papers: PAPERS })),
    getMockPaper: vi.fn(async () => ({
      paper: PAPERS[0],
      questions: [{ n: 1, stemEn: 'Q1', stemBn: null, options: ['a', 'b'] }],
      myAttempts: [{ id: 'att0', startedAt: '2026-11-24T10:00:00.000Z', submittedAt: null, score: null, total: 2, status: 'ACTIVE' }],
    })),
    startMockPaperAttempt: vi.fn(async () => ({ attempt: { id: 'att1', paperId: 'paper1', order: [1, 0], timeLimitMin: 30, startedAt: new Date().toISOString() }, questions: ACTIVE_ATTEMPT.questions })),
    getMockPaperAttempt: vi.fn(async () => ACTIVE_ATTEMPT),
    submitMockPaperAttempt: vi.fn(async () => RESULT),
    listAdminMockPapers: vi.fn(async () => ({ papers: [] })),
    createMockPaper: vi.fn(async () => ({ paper: ADMIN_PAPER })),
    getAdminMockPaper: vi.fn(async () => ({ paper: ADMIN_PAPER })),
    updateMockPaper: vi.fn(async () => ({ paper: ADMIN_PAPER })),
    publishMockPaper: vi.fn(async () => ({ paper: { ...ADMIN_PAPER, status: 'PUBLISHED' } })),
    unpublishMockPaper: vi.fn(async () => ({ paper: ADMIN_PAPER })),
    deleteMockPaper: vi.fn(async () => ({ deleted: true })),
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

describe('AccountButton', () => {
  it('renders the Mock Papers link between My Course and Log out', async () => {
    const user = userEvent.setup();
    render(
      <DataSourceProvider source={stubSource()}>
        <AuthProvider>
          <MemoryRouter>
            <AccountButton />
          </MemoryRouter>
        </AuthProvider>
      </DataSourceProvider>,
    );
    await user.click(await screen.findByRole('button', { name: /Riya/ }));
    const items = screen.getAllByRole('menuitem');
    const texts = items.map((el) => el.textContent);
    const courseIdx = texts.findIndex((t) => t.includes('My course'));
    const mocksIdx = texts.findIndex((t) => t.includes('Mock Papers'));
    const logoutIdx = texts.findIndex((t) => t.includes('Log out'));
    expect(courseIdx).toBeGreaterThanOrEqual(0);
    expect(mocksIdx).toBe(courseIdx + 1);
    expect(logoutIdx).toBe(mocksIdx + 1);
    expect(items[mocksIdx]).toHaveAttribute('href', '/mocks');
  });
});

describe('Mock Papers list page', () => {
  it('renders published papers with source, counts, time and attempts', async () => {
    renderAt('/mocks');
    expect(await screen.findByText('Capital Cities Mock')).toBeInTheDocument();
    // Localized values render en + bn slots, so both a span and its parent match: assert presence, not uniqueness.
    expect(screen.getAllByText(/Source: Telegram group X/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/2 questions/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/1 attempt · Best: 1/).length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: /Ratio Mock/ })).toHaveAttribute('href', '/mocks/paper2');
  });

  it('shows the empty state when no papers are published', async () => {
    renderAt('/mocks', stubSource({ listMockPapers: vi.fn(async () => ({ papers: [] })) }));
    expect(await screen.findByText('No mock papers yet')).toBeInTheDocument();
  });
});

describe('Mock Papers detail page', () => {
  it('shows the paper, its attempts and starts a new attempt', async () => {
    const { user, source } = renderAt('/mocks/paper1');
    expect(await screen.findByRole('heading', { name: 'Capital Cities Mock' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Resume attempt/ })).toHaveAttribute('href', '/mocks/paper1/attempt/att0');
    await user.click(screen.getByRole('button', { name: /Start the mock/ }));
    expect(source.startMockPaperAttempt).toHaveBeenCalledWith('paper1');
    expect(await screen.findByText('Second question?')).toBeInTheDocument();
  });
});

describe('Mock Paper attempt page', () => {
  it('renders questions in attempt order, submits answers and shows the score', async () => {
    const { user, source } = renderAt('/mocks/paper1/attempt/att1');
    // Attempt order: questionIndex 1 first, then 0.
    expect(await screen.findByText('Second question?')).toBeInTheDocument();
    expect(screen.queryByText('First question?')).toBeNull();
    await user.click(screen.getByRole('button', { name: 'B. Y' }));
    await user.click(screen.getByRole('button', { name: /Next/ }));
    expect(screen.getByText('First question?')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'A. A1' }));
    await user.click(screen.getByRole('button', { name: /Submit/ }));
    // Even with every question answered, submitting asks first.
    expect(source.submitMockPaperAttempt).not.toHaveBeenCalled();
    await user.click(await screen.findByRole('button', { name: /Yes, submit/ }));
    expect(source.submitMockPaperAttempt).toHaveBeenCalledWith('att1', {
      answers: [
        { questionIndex: 1, selected: 1 },
        { questionIndex: 0, selected: 0 },
      ],
    });
    expect((await screen.findAllByText(/Score: 1 \/ 2/)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Because Y\./).length).toBeGreaterThan(0);
    expect(screen.getAllByTestId('mock-review-question')).toHaveLength(2);
  });

  it('asks for confirmation while questions remain unanswered, then submits with nulls', async () => {
    const { user, source } = renderAt('/mocks/paper1/attempt/att1');
    expect(await screen.findByText('Second question?')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Submit/ }));
    expect((await screen.findAllByText(/2 questions are still unanswered/)).length).toBeGreaterThan(0);
    expect(source.submitMockPaperAttempt).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: /Submit anyway/ }));
    expect(source.submitMockPaperAttempt).toHaveBeenCalledWith('att1', {
      answers: [
        { questionIndex: 1, selected: null },
        { questionIndex: 0, selected: null },
      ],
    });
    expect((await screen.findAllByText(/Score: 1 \/ 2/)).length).toBeGreaterThan(0);
  });

  it('pausing freezes the countdown and keeps the question visible', async () => {
    const { user } = renderAt('/mocks/paper1/attempt/att1');
    expect(await screen.findByText('Second question?')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Pause/ }));
    expect(screen.getByText('Test paused')).toBeInTheDocument();
    expect(screen.getByText('Second question?')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Resume/ }));
    expect(screen.queryByText('Test paused')).toBeNull();
  });
});

describe('Mock Papers admin tab', () => {
  function renderAdmin(source = stubSource()) {
    const user = userEvent.setup();
    render(
      <DataSourceProvider source={source}>
        <MockPapersAdmin />
      </DataSourceProvider>,
    );
    return { user, source };
  }

  it('renders the paste form', async () => {
    renderAdmin();
    expect(await screen.findByLabelText(/Paste the paper text/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Title/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Source label/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Subject/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create draft/ })).toBeInTheDocument();
  });

  it('shows the publish-blocked reason when answers are missing', async () => {
    const { user, source } = renderAdmin();
    await user.type(screen.getByLabelText(/Title/), 'Capital Cities Mock');
    await user.type(screen.getByLabelText(/Source label/), 'Telegram group X');
    await user.type(screen.getByLabelText(/Paste the paper text/), '1. What is the capital of West Bengal?\n(A) Delhi (B) Kolkata (C) Mumbai (D) Chennai');
    await user.click(screen.getByRole('button', { name: /Create draft/ }));
    expect(source.createMockPaper).toHaveBeenCalledWith(expect.objectContaining({ title: 'Capital Cities Mock', sourceLabel: 'Telegram group X' }));
    expect(await screen.findByLabelText(/Stem \(English\)/)).toHaveDisplayValue('What is the capital of West Bengal?');
    expect(screen.getAllByText(/1 question has no answer/).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Publish/ })).toBeDisabled();
    expect(screen.getAllByText(/1 question is missing its answer/).length).toBeGreaterThan(0);
  });
});

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../App';
import { DataSourceProvider } from '../app/DataSourceContext';
import { createFixtureDataSource } from '../lib/dataSource';
import { createFixturePracticeSource } from '../lib/practiceSource';
import { clearResourceCache } from '../hooks/useResource';
import { languageStore } from '../hooks/useLanguagePreference';
import PyqBadge from '../components/practice/PyqBadge';

const t = (en, bn) => ({ en, bn });
const EXAM = 'WBCS (Exe.) Prelims';
const paper = (year, extra = {}) => ({
  year,
  count: 190,
  paperUrl: `https://psc.wb.gov.in/paper-${year}.pdf`,
  answerKeyUrl: `https://psc.wb.gov.in/key-${year}.pdf`,
  answerBasis: 'OFFICIAL_KEY',
  paperBasis: 'OFFICIAL_PAPER',
  ...extra,
});
const filters = {
  exams: [{
    name: EXAM,
    count: 570,
    years: [2023, 2022, 2019],
    papers: [
      paper(2023, { paperUrl: 'https://files.wbcs.in/wbcs-2023.pdf', paperBasis: 'UNOFFICIAL_COPY' }),
      paper(2022),
      paper(2019, { answerKeyUrl: null, answerBasis: 'CROSS_CHECKED' }),
    ],
  }],
  topics: [
    { subject: 'gs', subjectName: t('General Studies', 'সাধারণ অধ্যয়ন'), topic: 'indian_history', name: t('Indian History', 'ভারতের ইতিহাস'), count: 120, byYear: { 2022: 40, 2019: 80 } },
    { subject: 'english', subjectName: t('English', 'ইংরেজি'), topic: 'grammar', name: t('Grammar', 'ব্যাকরণ'), count: 30, byYear: { 2022: 30 } },
  ],
};

const question = {
  questionId: '66f200000000000000000001',
  topic: 'indian_history',
  difficulty: 2,
  pyq: [{ examName: EXAM, year: 2019, tier: null, questionNo: 61, answerBasis: 'CROSS_CHECKED', paperBasis: 'OFFICIAL_PAPER' }],
  stem: t('Who founded the Brahmo Samaj?', 'ব্রাহ্মসমাজ কে প্রতিষ্ঠা করেন?'),
  options: ['Rammohun Roy', 'Keshab Chandra Sen', 'Debendranath Tagore', 'Vivekananda'].map((x, i) => ({ optionId: `opt_${i}`, text: t(x, x) })),
  correctOptionId: 'opt_0',
  steps: [t('Rammohun Roy founded it in 1828.', 'রামমোহন রায় ১৮২৮ সালে প্রতিষ্ঠা করেন।')],
  stats: { attempts: 10, correct: 6 },
};

function renderAt(path, overrides = {}) {
  const source = {
    ...createFixtureDataSource({ latencyMs: 0 }),
    getPyqFilters: vi.fn(async () => filters),
    pyqPracticeSource: vi.fn(() => createFixturePracticeSource([question], { latencyMs: 0 })),
    ...overrides,
  };
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
  clearResourceCache();
  languageStore.set('en');
});

describe('PYQ hub', () => {
  it('lists each paper with how far its answers can be trusted, and links to paper and key', async () => {
    renderAt('/pyq');
    const official = (await screen.findByRole('heading', { name: `${EXAM} 2022` })).closest('article');
    expect(within(official).getByText('Official answer key')).toBeInTheDocument();
    expect(within(official).getByRole('link', { name: /^Answer key/ })).toHaveAttribute('href', 'https://psc.wb.gov.in/key-2022.pdf');

    const keyless = screen.getByRole('heading', { name: `${EXAM} 2019` }).closest('article');
    expect(within(keyless).getByText('Answer cross-checked · no official key')).toBeInTheDocument();
    expect(within(keyless).queryByText('Official answer key')).not.toBeInTheDocument();
    expect(within(keyless).queryByRole('link', { name: /^Answer key/ })).not.toBeInTheDocument();
    expect(within(keyless).getByText('No official key')).toBeInTheDocument();

    const copy = screen.getByRole('heading', { name: `${EXAM} 2023` }).closest('article');
    expect(within(copy).getByText('Paper text from an unofficial copy')).toBeInTheDocument();
    expect(within(copy).getByRole('link', { name: /^Question paper/ })).toHaveAttribute('href', 'https://files.wbcs.in/wbcs-2023.pdf');

    expect(screen.getByText('570 questions from 3 papers')).toBeInTheDocument();
  });

  it('practises a whole paper one question at a time, with the basis on the question', async () => {
    const { user, source } = renderAt('/pyq');
    await user.click(await screen.findByRole('button', { name: `Practise ${EXAM} 2019` }));
    expect(source.pyqPracticeSource).toHaveBeenCalledWith({ exam: EXAM, year: 2019 });

    expect(await screen.findByText('Who founded the Brahmo Samaj?')).toBeInTheDocument();
    expect(screen.getByText(`${EXAM} 2019, Q61`)).toBeInTheDocument();
    expect(screen.getByText('Answer cross-checked · no official key')).toBeInTheDocument();

    await user.click(screen.getByRole('radio', { name: /Keshab Chandra Sen/ }));
    await user.click(screen.getByRole('button', { name: /Check answer/ }));
    expect(await screen.findByText('Rammohun Roy founded it in 1828.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Choose another set/ }));
    expect(await screen.findByRole('heading', { name: /^Year-wise papers/ })).toBeInTheDocument();
  }, 20_000);

  it('a linked chapter with no PYQs says so instead of showing an empty "finished" set', async () => {
    const { user } = renderAt('/pyq?subject=gs&topic=important_days');
    expect(await screen.findByText('No previous-year questions on this chapter yet')).toBeInTheDocument();
    expect(screen.queryByText('You have finished this set')).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Choose another set/ }));
    expect(await screen.findByRole('heading', { name: /^Year-wise papers/ })).toBeInTheDocument();
  });

  it('a linked chapter with PYQs opens its set under its proper name', async () => {
    renderAt('/pyq?subject=gs&topic=indian_history');
    expect(await screen.findByText('Who founded the Brahmo Samaj?')).toBeInTheDocument();
    expect(screen.getByText('Indian History')).toBeInTheDocument();
  });

  it('topic-wise sets: GS first, counts per year, other subjects one tap away', async () => {
    const { user, source } = renderAt('/pyq');
    const history = (await screen.findByRole('heading', { name: /^Indian History/ })).closest('li');
    expect(within(history).getByText('2019: 80')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /^Grammar/ })).not.toBeInTheDocument();

    await user.click(within(history).getByRole('button', { name: 'Practise Indian History' }));
    expect(source.pyqPracticeSource).toHaveBeenCalledWith({ subject: 'gs', topic: 'indian_history' });
    await user.click(await screen.findByRole('button', { name: /Choose another set/ }));

    await user.click(screen.getByRole('button', { name: /^English/ }));
    expect(screen.getByRole('heading', { name: /^Grammar/ })).toBeInTheDocument();
  });

  it('shows an error with retry when the filters fail to load', async () => {
    const getPyqFilters = vi.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValue(filters);
    const { user } = renderAt('/pyq', { getPyqFilters });
    await user.click(await screen.findByRole('button', { name: /Try again/ }));
    expect(await screen.findByRole('heading', { name: `${EXAM} 2022` })).toBeInTheDocument();
  });
});

describe('PyqBadge', () => {
  it('official papers with an official key show the PYQ chip alone', () => {
    render(<PyqBadge refs={[{ examName: 'SSC CGL', year: 2023, tier: 'TIER_1', answerBasis: 'OFFICIAL_KEY', paperBasis: 'OFFICIAL_PAPER' }]} />);
    expect(screen.getByText('PYQ')).toBeInTheDocument();
    expect(screen.queryByText(/cross-checked|unofficial/i)).not.toBeInTheDocument();
  });

  it('older refs without a basis (fixtures) render as before', () => {
    render(<PyqBadge refs={[{ examName: 'SSC CHSL', year: 2022, tier: 'TIER_1' }]} />);
    expect(screen.getByText('PYQ')).toBeInTheDocument();
    expect(screen.queryByText(/cross-checked|unofficial/i)).not.toBeInTheDocument();
  });

  it('labels in Bengali when Bengali is chosen', () => {
    languageStore.set('bn');
    render(<PyqBadge refs={[{ examName: EXAM, year: 2019, answerBasis: 'CROSS_CHECKED', paperBasis: 'OFFICIAL_PAPER' }]} />);
    expect(screen.getByText('উত্তর মিলিয়ে দেখা · সরকারি উত্তরমালা নেই')).toBeInTheDocument();
  });
});

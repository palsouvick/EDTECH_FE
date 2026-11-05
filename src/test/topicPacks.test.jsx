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
import { FactCard } from '../pages/learn/GkChapterPage';

const t = (en, bn) => ({ en, bn });
const base = (code, extra = {}) => ({
  id: code, code, topic: 'indian_history', subtopic: 'mughal', tags: [], factKind: 'STATIC',
  title: t(`Title ${code}`, `শিরোনাম ${code}`), statement: t(`Statement ${code}`, `বিবৃতি ${code}`), explanation: t('Why it matters here', 'কেন'),
  milestones: [], dates: { eventDate: null, validFrom: null, validTo: null, reviewBy: null }, referenceYear: null, difficulty: 2, examRelevance: [],
  sources: [{ title: 'NCERT Class 7', url: 'https://ncert.nic.in/x.pdf', publisher: 'NCERT', publisherType: 'INSTITUTIONAL', accessedAt: '2026-11-05' }],
  verification: { status: 'VERIFIED', verifiedAt: '2026-11-05' }, bengaliReview: 'PENDING', questionCount: 0, pack: null, relatedPacks: [],
  ...extra,
});
const panipat = base('GK-HIS-102', {
  title: t('The three Battles of Panipat', 'পানিপথের তিনটি যুদ্ধ'),
  questionCount: 2,
  milestones: [{ kind: 'EVENT', date: '1526', note: t('First Battle: Babur defeats Ibrahim Lodi', 'প্রথম যুদ্ধ') }, { kind: 'EVENT', date: '-261', note: t('Old event', 'পুরোনো') }],
  pack: {
    order: 30,
    mustRemember: [t('1526, 1556, 1761', '১৫২৬, ১৫৫৬, ১৭৬১')],
    table: { caption: t('Three battles', 'তিনটি যুদ্ধ'), columns: [t('Battle', 'যুদ্ধ'), t('Year', 'সাল')], rows: [[t('First', 'প্রথম'), t('1526', '১৫২৬')], [t('Third', 'তৃতীয়'), t('1761', '১৭৬১')]] },
    dontConfuse: [t('1556 is Akbar vs Hemu, not Babur', '১৫৫৬ আকবর বনাম হিমু')],
    memoryTrick: t('26 → 56 → 61', '২৬ → ৫৬ → ৬১'),
    related: ['GK-HIS-008'],
    hasPyqTerms: true,
  },
});
const babur = base('GK-HIS-008', { title: t('Babur at Panipat (1526)', 'পানিপথে বাবর'), relatedPacks: [{ code: 'GK-HIS-102', topic: 'indian_history', title: panipat.title }] });
const pyqQ = {
  questionId: 'q1', topic: 'indian_history', difficulty: 3, stem: t("Who first used 'Tulghumah' in India?", 'প্রশ্ন'),
  options: ['Babur', 'Akbar', 'Humayun', 'Sher Shah'].map((x, i) => ({ optionId: `o${i}`, text: t(x, x) })),
  pyq: [{ examName: 'WBCS (Exe.) Prelims', year: 2022, questionNo: 116, answerBasis: 'OFFICIAL_KEY', paperBasis: 'OFFICIAL_PAPER' }],
  correctOptionId: 'o0', steps: [t('Babur', 'বাবর')], stats: { attempts: 1, correct: 1 },
};

function renderAt(path, overrides = {}) {
  const source = {
    ...createFixtureDataSource({ latencyMs: 0 }),
    getGkFact: vi.fn(async (code) => ({ 'GK-HIS-102': panipat, 'GK-HIS-008': babur })[code] ?? Promise.reject(Object.assign(new Error('Fact not found'), { status: 404 }))),
    getGkFactPyqs: vi.fn(async () => ({ total: 1, questions: [pyqQ] })),
    pyqPracticeSource: vi.fn(() => createFixturePracticeSource([pyqQ], { latencyMs: 0 })),
    gkFactPracticeSource: vi.fn(() => createFixturePracticeSource([{ ...pyqQ, questionId: 'own1', pyq: [], stem: t('Own question', 'নিজের প্রশ্ন') }], { latencyMs: 0 })),
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

describe('GK topic page', () => {
  it('one topic in one place: basics, must remember, dates, table, don\'t confuse, trick, related, PYQs, practice', async () => {
    const { user, source } = renderAt('/learn/gk/topic/GK-HIS-102');
    expect(await screen.findByRole('heading', { name: /^The three Battles of Panipat/, level: 1 })).toBeInTheDocument();
    expect(screen.getByText('Statement GK-HIS-102')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Must remember for exams/ })).toBeInTheDocument();
    expect(screen.getByText('1526, 1556, 1761')).toBeInTheDocument();
    expect(screen.getByText('261 BCE')).toBeInTheDocument();
    const table = screen.getByRole('table');
    expect(within(table).getAllByRole('row')).toHaveLength(3);
    expect(screen.getByText('1556 is Akbar vs Hemu, not Babur')).toBeInTheDocument();
    expect(screen.getByText('26 → 56 → 61')).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: /^Babur at Panipat \(1526\)/ })).toHaveAttribute('href', '/learn/gk/topic/GK-HIS-008');
    expect(await screen.findByText('1 real questions mention this topic')).toBeInTheDocument();
    expect(screen.getByText(/WBCS \(Exe.\) Prelims 2022, Q116/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Practise these past-paper questions/ }));
    expect(source.pyqPracticeSource).toHaveBeenCalledWith({ pack: 'GK-HIS-102' });
    await user.click(screen.getByRole('button', { name: /^Start practice/ }));
    expect(source.gkFactPracticeSource).toHaveBeenCalledWith('GK-HIS-102');
    expect(await screen.findByText('Own question')).toBeInTheDocument();
  });

  it('an ordinary fact shows the topics it connects to', async () => {
    renderAt('/learn/gk/topic/GK-HIS-008');
    expect(await screen.findByRole('heading', { name: /^Babur at Panipat/, level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /The three Battles of Panipat/ })).toHaveAttribute('href', '/learn/gk/topic/GK-HIS-102');
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('an unknown topic shows an error with retry', async () => {
    renderAt('/learn/gk/topic/GK-HIS-999');
    expect(await screen.findByRole('button', { name: /Try again/ })).toBeInTheDocument();
  });
});

describe('fact cards', () => {
  it('a pack links to its full page; a connected fact says what else to learn', () => {
    const { rerender } = render(<MemoryRouter><ul><FactCard fact={panipat} /></ul></MemoryRouter>);
    expect(screen.getByRole('link', { name: /Open the complete topic/ })).toHaveAttribute('href', '/learn/gk/topic/GK-HIS-102');
    rerender(<MemoryRouter><ul><FactCard fact={babur} /></ul></MemoryRouter>);
    expect(screen.getByText(/You should also learn/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /The three Battles of Panipat/ })).toHaveAttribute('href', '/learn/gk/topic/GK-HIS-102');
    rerender(<MemoryRouter><ul><FactCard fact={base('GK-HIS-002')} /></ul></MemoryRouter>);
    expect(screen.queryByText(/You should also learn/)).not.toBeInTheDocument();
  });
});

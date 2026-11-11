import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../App';
import { DataSourceProvider } from '../app/DataSourceContext';
import { createFixtureDataSource } from '../lib/dataSource';
import { createFixturePracticeSource } from '../lib/practiceSource';
import { bookSummary, chapterStatus, emptyProgress, readLocal, tally, weakSections, withReading, withResult } from '../lib/bookProgress';

const t = (en, bn) => ({ en, bn });
const sections = [
  { id: 'discovery', heading: 'আবিষ্কার' },
  { id: 'town_planning', heading: 'নগর পরিকল্পনা' },
  { id: 'seals', heading: 'সিলমোহর' },
  { id: 'decline', heading: 'পতন' },
];
const book = {
  book: 'history',
  title: 'ইতিহাস',
  parts: [{ code: 'intro', title: 'সূচনা' }, { code: 'ancient', title: 'প্রাচীন ভারত' }],
  chapters: [
    { code: 'HIS-00', number: 0, part: 'intro', title: 'ইতিহাস কীভাবে পড়বে', weight: false, bengal: false, available: false, sections: [] },
    { code: 'HIS-01', number: 1, part: 'ancient', title: 'প্রাগৈতিহাসিক ভারত', weight: false, bengal: false, available: false, sections: [] },
    { code: 'HIS-02', number: 2, part: 'ancient', title: 'হরপ্পা সভ্যতা', subtitle: 'প্রথম নগর', weight: true, bengal: false, available: true, draft: false, readingMinutes: { quick: 5, standard: 30 }, sections, questionCount: 4, pyqCount: 1 },
  ],
};
const chapter = {
  book: 'history', code: 'HIS-02', number: 2, part: 'ancient', title: 'হরপ্পা সভ্যতা', subtitle: 'প্রথম নগর', draft: false, weight: true, bengal: false,
  subtopics: ['ivc'], relatedFacts: ['GK-HIS-104'], prerequisites: [{ code: 'HIS-01', number: 1, title: 'প্রাগৈতিহাসিক ভারত', available: false }], readingMinutes: { quick: 5, standard: 30, deep: 45 },
  overview: { intro: 'এই অধ্যায়ের পরিচিতি।', you_will_learn: ['এক', 'দুই', 'তিন'] },
  sections: sections.map((s, i) => ({ ...s, quick: `সংক্ষেপ ${i}`, standard: `পূর্ণ ব্যাখ্যা ${i}`, deep: i === 0 ? 'গভীর আলোচনা ০' : null, boxes: i === 1 ? [{ kind: 'exam_note', title: 'বৃহত্তম', body: 'রাখিগড়ি বনাম মহেঞ্জোদারো' }] : [], sources: ['s1'], pyq: i === 0 ? [{ exam: 'WBCS', years: [2022] }] : [], questionCount: 1 })),
  events: [{ title: 'খনন', when: '১৯২১', what: 'হরপ্পায় খনন', why_it_matters: 'সভ্যতা চেনা গেল', section: 'discovery' }],
  people: [{ name: 'দয়ারাম সাহনি', when: '১৯২১', role: 'প্রত্নতত্ত্ববিদ', contribution: 'খনন' }],
  timeline: [{ sort_year: 1921, when: '১৯২১', label: 'হরপ্পায় খনন' }],
  terms: [{ term: 'সিটাডেল', meaning: 'উঁচু অংশ' }],
  causeEffect: [{ title: 'পতন', causes: ['জলবায়ু'], event: 'নগর পরিত্যাগ', results: ['গ্রামীণ জীবন'] }],
  examFocus: [{ point: 'স্থান ও আবিষ্কারক', section: 'discovery', pyq: [{ exam: 'WBCS', years: [2022] }] }],
  bengalConnection: { body: 'রাখালদাস বন্দ্যোপাধ্যায় মহেঞ্জোদারোয় সিলমোহর পান।' },
  quickRevision: ['প্রথম পয়েন্ট', 'দ্বিতীয় পয়েন্ট'],
  sources: [{ id: 's1', title: 'Themes in Indian History I', url: 'https://ncert.nic.in/textbook/pdf/lehs101.pdf', class: 'XII' }],
  pyq: { total: 1, byExam: [{ exam: 'WBCS', count: 1, years: [2022] }] },
  questionCount: 4,
  levels: [{ level: 'basic', count: 2 }, { level: 'moderate', count: 1 }, { level: 'difficult', count: 1 }, { level: 'exam', count: 0 }],
  previous: { code: 'HIS-01', number: 1, available: false },
  next: { code: 'HIS-03', number: 3, available: false },
};
const question = (id, section) => ({
  questionId: id, topic: 'indian_history', difficulty: 2, stem: { bn: `প্রশ্ন ${id}` },
  options: ['ক', 'খ', 'গ', 'ঘ'].map((x, i) => ({ optionId: `${id}o${i}`, text: { bn: x } })),
  correctOptionId: `${id}o0`, steps: [{ bn: 'ব্যাখ্যা' }], stats: { attempts: 0, correct: 0 }, pyq: [], book: { section, level: 'basic' },
});

function renderAt(path, overrides = {}) {
  const source = {
    ...createFixtureDataSource({ latencyMs: 0 }),
    getBook: vi.fn(async () => book),
    getBookChapter: vi.fn(async (b, code) => (code === 'HIS-02' ? chapter : Promise.reject(Object.assign(new Error('Chapter not found'), { status: 404 })))),
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
  return { source, user };
}

beforeEach(() => localStorage.clear());

describe('book progress (pure)', () => {
  it('chapter status runs not started → reading → read → tested → mastered', () => {
    const ch = { sections };
    expect(chapterStatus(ch, undefined).status).toBe('not_started');
    let p = withReading(emptyProgress(), { chapter: 'HIS-02', read: ['discovery'], section: 'discovery' });
    expect(chapterStatus(ch, p.chapters['HIS-02'])).toMatchObject({ status: 'reading', read: 1, percent: 25 });
    p = withReading(p, { chapter: 'HIS-02', read: sections.map((s) => s.id) });
    expect(chapterStatus(ch, p.chapters['HIS-02']).status).toBe('read');
    p = withResult(p, { chapter: 'HIS-02', mode: 'mini', correct: 6, total: 15, bySection: {} });
    expect(chapterStatus(ch, p.chapters['HIS-02']).status).toBe('tested');
    p = withResult(p, { chapter: 'HIS-02', mode: 'mini', correct: 12, total: 15, bySection: {} });
    expect(chapterStatus(ch, p.chapters['HIS-02'])).toMatchObject({ status: 'mastered', miniBest: 80 });
    p = withResult(p, { chapter: 'HIS-02', mode: 'mini', correct: 3, total: 15, bySection: {} });
    expect(p.chapters['HIS-02'].mini.best.correct).toBe(12);
  });

  it('book summary: percent over readable chapters and where to continue', () => {
    expect(bookSummary(book, emptyProgress()).resume).toMatchObject({ first: true, chapter: { code: 'HIS-02' } });
    const p = withReading(emptyProgress(), { chapter: 'HIS-02', read: ['discovery'], section: 'town_planning' });
    const s = bookSummary(book, p);
    expect(s).toMatchObject({ percent: 25, sectionsRead: 1, sectionsTotal: 4, chaptersAvailable: 1, chaptersTotal: 3 });
    expect(s.resume.section.id).toBe('town_planning');
  });

  it('tally and weak sections', () => {
    const r = tally([{ section: 'decline', isCorrect: false }, { section: 'decline', isCorrect: false }, { section: 'seals', isCorrect: true }, { section: 'seals', isCorrect: true }]);
    expect(r).toEqual({ correct: 2, total: 4, bySection: { decline: { correct: 0, total: 2 }, seals: { correct: 2, total: 2 } } });
    expect(weakSections(r.bySection, { decline: 'পতন' })).toEqual([{ id: 'decline', heading: 'পতন', accuracy: 0, correct: 0, total: 2 }]);
  });
});

describe('book pages', () => {
  it('book home: parts, chapter status, coming soon, and the first chapter to start', async () => {
    renderAt('/learn/gk/indian-history/book');
    expect(await screen.findByRole('heading', { level: 1, name: /History: study like a book/ })).toBeInTheDocument();
    expect(screen.getAllByText('প্রাচীন ভারত').length).toBeGreaterThan(0);
    const link = screen.getByRole('link', { name: /হরপ্পা সভ্যতা/ });
    expect(link).toHaveAttribute('href', '/learn/gk/indian-history/book/HIS-02');
    expect(screen.getAllByText('Coming soon').length).toBe(2);
    expect(screen.getByRole('link', { name: /Start reading/ })).toHaveAttribute('href', '/learn/gk/indian-history/book/HIS-02');
  });

  it('chapter: depths switch the text, sections can be marked read, and progress shows Continue reading', async () => {
    const { user } = renderAt('/learn/gk/indian-history/book/HIS-02');
    expect(await screen.findByRole('heading', { level: 1, name: 'হরপ্পা সভ্যতা' })).toBeInTheDocument();
    expect(screen.getByText('পূর্ণ ব্যাখ্যা 0')).toBeInTheDocument();
    expect(screen.getByText(/অধ্যায় ১: প্রাগৈতিহাসিক ভারত/)).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /প্রাগৈতিহাসিক ভারত/ })).toBeNull();
    expect(screen.queryByText('গভীর আলোচনা ০')).not.toBeInTheDocument();
    expect(screen.getByText('রাখিগড়ি বনাম মহেঞ্জোদারো')).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: /Quick/ }));
    expect(screen.getByText('সংক্ষেপ 0')).toBeInTheDocument();
    expect(screen.queryByText('পূর্ণ ব্যাখ্যা 0')).not.toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: /Deep study/ }));
    expect(screen.getByText('গভীর আলোচনা ০')).toBeInTheDocument();

    const first = document.getElementById('sec-discovery');
    await user.click(within(first).getByRole('button', { name: /Mark section as read/ }));
    expect(within(first).getByRole('button', { name: /Read ✓/ })).toBeDisabled();
    const saved = readLocal('history');
    expect(saved.chapters['HIS-02'].read).toEqual(['discovery']);
    expect(saved.last).toMatchObject({ chapter: 'HIS-02', section: 'discovery' });
    expect(saved.depth).toBe('deep');
    // Exam focus shows real PYQ evidence; Bengal connection and sources are there.
    expect(screen.getAllByText('WBCS 2022').length).toBeGreaterThan(0);
    expect(screen.getByText(/রাখালদাস বন্দ্যোপাধ্যায়/)).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /NCERT XII: Themes in Indian History I/ }).length).toBeGreaterThan(0);
  });

  it('practice → analysis shows weak sections with revise and test-again; the result is saved', async () => {
    const qs = [question('a', 'decline'), question('b', 'decline'), question('c', 'seals')];
    let opts = null;
    const bookPracticeSource = vi.fn((b, code, o) => {
      opts = o;
      const inner = createFixturePracticeSource(qs, { latencyMs: 0 });
      return { ...inner, verify: async (body) => { const r = await inner.verify(body); o.onChecked?.({ questionId: body.questionId, section: qs.find((q) => q.questionId === body.questionId).book.section, isCorrect: r.isCorrect }); return r; } };
    });
    const { user } = renderAt('/learn/gk/indian-history/book/HIS-02', { bookPracticeSource });
    await user.click(await screen.findByRole('button', { name: /Practice: all 4 questions/ }));
    expect(opts.mode).toBe('practice');
    // Simulate answers through the source's checking hook, then finish.
    opts.onChecked({ section: 'decline', isCorrect: false });
    opts.onChecked({ section: 'decline', isCorrect: false });
    opts.onChecked({ section: 'seals', isCorrect: true });
    await user.click(screen.getAllByRole('button', { name: /Finish and see analysis/ }).at(-1));
    const result = await screen.findByRole('status');
    expect(within(result).getByText('1 of 3 correct')).toBeInTheDocument();
    expect(within(result).getByText(/পতন · ০%/)).toBeInTheDocument();
    expect(readLocal('history').chapters['HIS-02'].practice.best).toMatchObject({ correct: 1, total: 3 });
    await user.click(within(result).getByRole('button', { name: /Test again on these sections/ }));
    expect(opts).toMatchObject({ mode: 'weak', sections: ['decline'] });
  });

  it('a chapter that is not available says so', async () => {
    renderAt('/learn/gk/indian-history/book/HIS-05');
    expect(await screen.findByText('This chapter is not available yet.')).toBeInTheDocument();
  });
});

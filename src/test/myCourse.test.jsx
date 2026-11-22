import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../app/AuthContext';
import { DataSourceProvider } from '../app/DataSourceContext';
import { createFixtureDataSource } from '../lib/dataSource';
import { languageStore } from '../hooks/useLanguagePreference';

const t = (en, bn) => ({ en, bn });
const PL = { id: 's1', subject: 'quant', topic: 'profit_loss', name: t('Profit, Loss & Discount', 'লাভ, ক্ষতি ও ছাড়'), label: null, from: 412, to: 447, pages: 36, source: 'auto', confidence: 0.8 };
const PIPES = { id: 's2', subject: 'quant', topic: 'pipes_cistern', name: t('Pipes & Cistern', 'নল ও চৌবাচ্চা'), label: null, from: 1, to: 27, pages: 27, source: 'filename', confidence: 0 };
const BOOK = { id: 'f1', title: 'Mathematics book', fileName: 'Mathematics book.pdf', sizeMb: 206.7, pages: 943, subject: 'quant', subjectName: t('Mathematics', 'গণিত'), kind: 'scanned', status: 'ready', progress: { done: 943, total: 943 }, lastPage: 415, sections: [PL] };
const NOTES = { id: 'f2', title: 'নল ও চৌবাচ্চা', fileName: 'নল_ও_চৌবাচ্চা.pdf', sizeMb: 9.5, pages: 27, subject: 'quant', subjectName: t('Mathematics', 'গণিত'), kind: null, status: 'processing', progress: { done: 9, total: 27 }, lastPage: 1, sections: [] };

const api = vi.hoisted(() => ({
  list: vi.fn(),
  get: vi.fn(),
  search: vi.fn(),
  chapters: vi.fn(),
  updateSection: vi.fn(),
  lastPage: vi.fn(async () => ({})),
  forTopic: vi.fn(),
  upload: vi.fn(),
  markPage: vi.fn(),
  markRange: vi.fn(),
  bookmarks: vi.fn(async () => ({ items: [] })),
  pdfUrl: (id) => `/api/v1/course/files/${id}/pdf`,
  pdfHeaders: () => ({}),
}));
vi.mock('../lib/course', async (orig) => ({ ...(await orig()), courseApi: api }));
// pdf.js cannot draw in jsdom: show which page would be drawn.
vi.mock('../components/course/PdfPage', () => ({ default: ({ page }) => <p>PDF page {page}</p> }));

import MyCoursePage from '../pages/MyCoursePage';
import CourseReaderPage from '../pages/CourseReaderPage';
import FromYourCourse from '../components/course/FromYourCourse';

function renderAt(path) {
  const source = { ...createFixtureDataSource({ latencyMs: 0 }), getMe: async () => ({ user: { id: 'u1', name: 'Riya', email: 'r@example.com' } }) };
  const user = userEvent.setup();
  render(
    <DataSourceProvider source={source}>
      <AuthProvider>
        <MemoryRouter initialEntries={[path]}>
          <Routes>
            <Route path="/my-course" element={<MyCoursePage />} />
            <Route path="/my-course/:id" element={<CourseReaderPage />} />
            <Route path="/chapter" element={<FromYourCourse subject="quant" topic="profit_loss" />} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    </DataSourceProvider>,
  );
  return user;
}

beforeEach(() => {
  vi.clearAllMocks();
  act(() => languageStore.set('en'));
  api.list.mockResolvedValue({ files: [BOOK, NOTES] });
  api.get.mockResolvedValue({ ...BOOK, sections: [PL, { ...PIPES, id: 's3', from: 448, to: 470, source: 'auto' }] });
  api.chapters.mockResolvedValue({ subjects: { quant: { name: t('Mathematics', 'গণিত'), topics: [{ topic: 'profit_loss', name: PL.name }, { topic: 'percentage', name: t('Percentage', 'শতকরা') }] } } });
  api.search.mockResolvedValue({ query: 'চৌবাচ্চা', hits: [{ fileId: 'f1', fileTitle: 'Mathematics book', page: 330, snippet: '…দুটি নল একটি চৌবাচ্চা…' }] });
});

describe('My course page', () => {
  it('lists PDFs: ready ones open where you stopped, with chapter links; reading ones show progress', async () => {
    renderAt('/my-course');
    expect(await screen.findByText('Mathematics book')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Continue at page 415/ })).toHaveAttribute('href', '/my-course/f1?page=415');
    expect(screen.getByRole('link', { name: /Profit, Loss & Discount.*pages 412–447/ })).toHaveAttribute('href', '/my-course/f1?page=412');
    expect(screen.getByText(/Reading pages… 9\/27/)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '33');
  });

  it('uploading the same PDF again says it is already there and links to it', async () => {
    api.upload.mockRejectedValue(Object.assign(new Error('dup'), { code: 'DUPLICATE_PDF', details: { fileId: 'f1', title: 'Mathematics book', status: 'ready' } }));
    const user = renderAt('/my-course');
    await screen.findByText('Mathematics book');
    await user.upload(screen.getByTestId('course-file-input'), new File(['%PDF-1.4'], 'Mathematics book (1).pdf', { type: 'application/pdf' }));
    expect(await screen.findByText(/This PDF is already in your course as "Mathematics book"/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^Open it/ })).toHaveAttribute('href', '/my-course/f1');
    expect(screen.queryByRole('alert')).toBeNull();
  });

  it('search across PDFs links straight to the page', async () => {
    const user = renderAt('/my-course');
    await screen.findByText('Mathematics book');
    await user.type(screen.getByRole('searchbox'), 'চৌবাচ্চা');
    const hit = await screen.findByRole('link', { name: /Mathematics book · Page 330/ });
    expect(hit).toHaveAttribute('href', '/my-course/f1?page=330');
  });
});

describe('Reader', () => {
  it('shows the asked page, its chapter, and turns pages', async () => {
    const user = renderAt('/my-course/f1?page=412');
    expect(await screen.findByText('PDF page 412')).toBeInTheDocument();
    expect(screen.getAllByText('Profit, Loss & Discount').length).toBeGreaterThan(0);
    await user.click(screen.getAllByRole('button', { name: /^Next/ })[0]);
    expect(await screen.findByText('PDF page 413')).toBeInTheDocument();
  });

  it('lets a phone reader jump to a chapter from the in-flow selector', async () => {
    const user = renderAt('/my-course/f1?page=412');
    expect(await screen.findByText('PDF page 412')).toBeInTheDocument();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Chapter' }), 's3');
    expect(await screen.findByText('PDF page 448')).toBeInTheDocument();
  });

  it('fix a section: choose the chapter and pages, saved through the API', async () => {
    api.updateSection.mockResolvedValue({ ...BOOK, sections: [{ ...PL, to: 440, source: 'manual' }] });
    const user = renderAt('/my-course/f1?page=412');
    await screen.findByText('PDF page 412');
    const chapters = screen.getByRole('region', { name: /Chapters in this PDF/ });
    await user.click(within(chapters).getAllByRole('button', { name: /^Fix/ })[0]);
    const to = within(chapters).getByLabelText(/To page/);
    await user.clear(to);
    await user.type(to, '440');
    await user.click(within(chapters).getByRole('button', { name: /^Save/ }));
    expect(api.updateSection).toHaveBeenCalledWith('s1', expect.objectContaining({ topic: 'profit_loss', from: 412, to: 440 }));
    expect(await within(chapters).findByText(/pages 412–440/)).toBeInTheDocument();
  });
});

describe('Reading progress, bookmarks and notes', () => {
  it('chapter bar shows pages read; "Chapter done" marks the whole chapter', async () => {
    api.get.mockResolvedValue({ ...BOOK, readList: [412], marks: [], sections: [{ ...PL, readPages: 12 }] });
    api.markRange.mockResolvedValue({ ...BOOK, readList: [], marks: [], sections: [{ ...PL, readPages: 36 }] });
    const user = renderAt('/my-course/f1?page=412');
    const bar = await screen.findByRole('region', { name: 'Chapter progress' });
    expect(within(bar).getByText(/12\/36 pages read/)).toBeInTheDocument();
    await user.click(within(bar).getByRole('button', { name: /Chapter done/ }));
    expect(api.markRange).toHaveBeenCalledWith('f1', { from: 412, to: 447, read: true });
    expect(await within(bar).findByRole('button', { name: /^Not done yet/ })).toBeInTheDocument();
  });

  it('⭐ a page and save a note on it; the PDF lists its marks', async () => {
    api.get.mockResolvedValue({ ...BOOK, readList: [], marks: [], sections: [{ ...PL, readPages: 0 }] });
    api.markPage.mockImplementation(async (_id, page, body) => ({ page, read: false, bookmarked: body.bookmarked ?? true, note: body.note ?? '' }));
    const user = renderAt('/my-course/f1?page=420');
    await screen.findByText('PDF page 420');
    await user.click(screen.getByRole('button', { name: /^☆ Bookmark/ }));
    expect(api.markPage).toHaveBeenCalledWith('f1', 420, { bookmarked: true });
    expect(await screen.findByRole('button', { name: /^⭐ Bookmarked/ })).toHaveAttribute('aria-pressed', 'true');
    const marks = screen.getByRole('region', { name: /Bookmarks & notes in this PDF/ });
    expect(within(marks).getByRole('button', { name: /Page 420/ })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Add a note/ }));
    await user.type(screen.getByRole('textbox'), 'Successive discount');
    await user.click(screen.getByRole('button', { name: /^Save note/ }));
    expect(api.markPage).toHaveBeenLastCalledWith('f1', 420, { note: 'Successive discount' });
    expect(await screen.findByRole('button', { name: /^Saved ✓/ })).toBeInTheDocument();
  }, 20000); // types a note: slow on a busy machine

  it('My course page lists every bookmark and note with its chapter', async () => {
    api.bookmarks.mockResolvedValue({ items: [{ fileId: 'f1', fileTitle: 'Mathematics book', page: 420, bookmarked: true, note: 'Successive discount', chapter: PL.name }] });
    renderAt('/my-course');
    const list = await screen.findByRole('region', { name: /Your bookmarks & notes/ });
    expect(within(list).getByRole('link', { name: /⭐ Mathematics book.*Page 420.*Profit, Loss & Discount/ })).toHaveAttribute('href', '/my-course/f1?page=420');
    expect(within(list).getByText('Successive discount')).toBeInTheDocument();
  });
});

describe('Check these parts', () => {
  it('unsure and nameless parts are listed first; a contents-page part with its own title is not', async () => {
    api.get.mockResolvedValue({
      ...BOOK,
      sections: [
        { ...PL, source: 'toc', confidence: 0.9 },
        { ...PIPES, id: 's4', from: 448, to: 470, source: 'auto', confidence: 0.2 },
        { id: 's5', subject: 'quant', topic: null, name: t('Other', 'অন্যান্য'), label: null, from: 471, to: 480, pages: 10, source: 'auto', confidence: 0 },
        { id: 's6', subject: 'quant', topic: null, name: t('বৃত্তস্থ কোণ', 'বৃত্তস্থ কোণ'), label: 'বৃত্তস্থ কোণ', from: 481, to: 490, pages: 10, source: 'toc', confidence: 0 },
      ],
    });
    const user = renderAt('/my-course/f1?page=412');
    const box = await screen.findByTestId('check-list');
    expect(within(box).getByText(/Check 2 parts/)).toBeInTheDocument();
    expect(within(box).getByRole('button', { name: /Pipes & Cistern.*pages 448–470/ })).toBeInTheDocument();
    expect(within(box).getByRole('button', { name: /Other.*pages 471–480/ })).toBeInTheDocument();
    expect(within(box).queryByRole('button', { name: /বৃত্তস্থ কোণ/ })).toBeNull();
    expect(screen.getAllByText(/from the contents page/).length).toBe(2);
    await user.click(within(box).getByRole('button', { name: /Pipes & Cistern/ }));
    expect(await screen.findByText('PDF page 448')).toBeInTheDocument();
    expect(screen.getByLabelText(/To page/)).toHaveValue(470);
  });
});

describe('Chapter page card', () => {
  it('lists the parts of your PDFs for this chapter', async () => {
    api.forTopic.mockResolvedValue({ sections: [{ ...PL, fileId: 'f1', fileTitle: 'Mathematics book' }] });
    renderAt('/chapter');
    const link = await screen.findByRole('link', { name: /Mathematics book.*pages 412–447/ });
    expect(link).toHaveAttribute('href', '/my-course/f1?page=412');
  });
});

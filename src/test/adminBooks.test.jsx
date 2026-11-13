import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const request = vi.fn();
vi.mock('../lib/api', () => ({ request: (...a) => request(...a) }));

const { default: AdminBooks } = await import('../pages/AdminBooks');

const row = (over) => ({
  book: 'history', part: 'ancient', written: true, fileStatus: 'DRAFT', status: 'DRAFT', published: false,
  verification: { status: 'VERIFIED', checkedAt: '2026-11-11', notes: 'Blind check 40/40' }, canPublish: true,
  sections: 8, questions: 40, questionsLive: 0, pyqsTaught: 5, decision: null, history: [], ...over,
});
const data = {
  errors: [],
  chapters: [
    row({ code: 'HIS-02', number: 2, title: 'হরপ্পা সভ্যতা' }),
    row({ code: 'HIS-22', number: 22, part: 'modern_national', title: 'বঙ্গভঙ্গ', published: true, status: 'PUBLISHED', questionsLive: 43, questions: 43, decision: { status: 'PUBLISHED', by: 'admin@example.com', at: '2026-11-11T10:00:00Z' } }),
    row({ code: 'HIS-03', number: 3, title: 'বৈদিক যুগ', verification: { status: 'NEEDS_REVIEW', notes: '' }, canPublish: false }),
    { book: 'history', code: 'HIS-05', number: 5, part: 'ancient', title: 'বৌদ্ধধর্ম', written: false, published: false, verification: null, canPublish: false },
    row({ book: 'geography', code: 'GEO-03', number: 3, part: 'india_land', title: 'ভারতের নদনদী ও হ্রদ', questions: 44 }),
    { book: 'geography', code: 'GEO-04', number: 4, part: 'india_land', title: 'ভারতের জলবায়ু', written: false, published: false, verification: null, canPublish: false },
  ],
};

beforeEach(() => {
  localStorage.clear();
  request.mockReset();
});

describe('Admin Console → Books', () => {
  it('lists chapters with check status and Preview / Publish / Unpublish; unverified chapters cannot be published', async () => {
    request.mockResolvedValue(data);
    render(<AdminBooks />);
    const r02 = (await screen.findByText('হরপ্পা সভ্যতা')).closest('tr');
    expect(within(r02).getByRole('link', { name: 'Preview' })).toHaveAttribute('href', '/learn/gk/indian-history/book/HIS-02?preview=1');
    expect(within(r02).getByRole('button', { name: 'Publish' })).toBeEnabled();
    const r22 = screen.getByText('বঙ্গভঙ্গ').closest('tr');
    expect(within(r22).getByRole('button', { name: 'Unpublish' })).toBeInTheDocument();
    expect(within(r22).getByText(/Published by admin@example.com/)).toBeInTheDocument();
    expect(within(screen.getByText('বৈদিক যুগ').closest('tr')).getByRole('button', { name: 'Publish' })).toBeDisabled();
    expect(within(screen.getByText('বৌদ্ধধর্ম').closest('tr')).queryByRole('button')).toBeNull();
  });

  it('one tab per subject: History first, Geography on its own with its own preview links', async () => {
    request.mockResolvedValue(data);
    const user = userEvent.setup();
    render(<AdminBooks />);
    await screen.findByText('হরপ্পা সভ্যতা');
    expect(screen.getByRole('tab', { name: /History/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: /History/ })).toHaveTextContent('1/4');
    expect(screen.getByRole('tab', { name: /Geography/ })).toHaveTextContent('0/2');
    expect(screen.queryByText('ভারতের নদনদী ও হ্রদ')).toBeNull();
    await user.click(screen.getByRole('tab', { name: /Geography/ }));
    expect(screen.getByRole('heading', { name: 'Geography book' })).toBeInTheDocument();
    expect(screen.queryByText('হরপ্পা সভ্যতা')).toBeNull();
    const geo = screen.getByText('ভারতের নদনদী ও হ্রদ').closest('tr');
    expect(within(geo).getByText('India: land and rivers')).toBeInTheDocument();
    expect(within(geo).getByRole('link', { name: 'Preview' })).toHaveAttribute('href', '/learn/gk/geography/book/GEO-03?preview=1');
    expect(screen.getByText(/1 of 2 chapters written/)).toBeInTheDocument();
  });

  it('publish asks for confirmation, calls the API and reloads', async () => {
    request.mockImplementation(async (path) => (path.endsWith('/publish') ? { questionsLive: 40 } : data));
    const user = userEvent.setup();
    render(<AdminBooks />);
    const r02 = (await screen.findByText('হরপ্পা সভ্যতা')).closest('tr');
    await user.click(within(r02).getByRole('button', { name: 'Publish' }));
    const dialog = await screen.findByRole('dialog', { name: 'Publish this chapter?' });
    expect(within(dialog).getByText('হরপ্পা সভ্যতা')).toBeInTheDocument();
    expect(within(dialog).getByText(/practice questions at once/)).toHaveTextContent('40');
    expect(request).toHaveBeenCalledTimes(1); // nothing sent before confirming
    await user.click(within(dialog).getByRole('button', { name: 'Yes, publish' }));
    expect(request).toHaveBeenCalledWith('/admin/books/history/HIS-02/publish', { method: 'POST' });
    expect(await screen.findByRole('status')).toHaveTextContent('Published HIS-02: 40 question(s) now live.');
    expect(request.mock.calls.filter(([p]) => p === '/admin/books').length).toBe(2);
  });

  it('nothing happens when the confirmation is cancelled', async () => {
    request.mockResolvedValue(data);
    const user = userEvent.setup();
    render(<AdminBooks />);
    const r22 = (await screen.findByText('বঙ্গভঙ্গ')).closest('tr');
    await user.click(within(r22).getByRole('button', { name: 'Unpublish' }));
    const dialog = await screen.findByRole('dialog', { name: 'Unpublish this chapter?' });
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(request).toHaveBeenCalledTimes(1);
  });
});

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import AdminVocabularyReview from '../pages/AdminVocabularyReview';

const word = (over = {}) => ({
  id: 'w1', word: 'Equivocal', partOfSpeech: 'ADJECTIVE', difficulty: 'ADVANCED',
  meaningBn: 'দ্ব্যর্থক; অস্পষ্ট', explanationBn: 'একাধিক অর্থে বোঝা যায়।', exampleBn: 'মন্ত্রী দ্ব্যর্থক উত্তর দিলেন।',
  definitionEn: 'Open to more than one interpretation.', exampleEn: 'The minister gave an equivocal reply.',
  synonyms: ['ambiguous'], antonyms: ['clear'], reviewPriority: 1300,
  examRelevance: [{ basis: 'PYQ_VERIFIED', references: [] }],
  bengaliReview: { status: 'PENDING', reviewedBy: null, reviewedAt: null },
  lexicalChecks: { unconfirmed: ['antonym:clear:NOT_LINKED'] }, editHistory: [], ...over,
});

function mockFetch(handler) {
  const calls = [];
  vi.stubGlobal('fetch', vi.fn(async (url, init = {}) => {
    calls.push({ url: String(url), method: init.method || 'GET', body: init.body ? JSON.parse(init.body) : null });
    const data = handler(String(url), init);
    return new Response(JSON.stringify({ success: true, data }), { status: 200, headers: { 'content-type': 'application/json' } });
  }));
  return calls;
}

afterEach(() => vi.unstubAllGlobals());

describe('Admin › Bengali review', () => {
  it('lists the queue, saves a corrected meaning and marks it reviewed in one step', async () => {
    let state = word();
    const calls = mockFetch((url, init) => {
      if (init.method === 'PATCH') {
        const body = JSON.parse(init.body);
        state = word({ meaningBn: body.meaningBn, bengaliReview: { status: 'REVIEWED', reviewedBy: 'admin@x', reviewedAt: '2026-10-29T10:00:00Z' } });
        return state;
      }
      return { words: [state], total: 1, offset: 0, limit: 10, counts: { pending: state.bengaliReview.status === 'PENDING' ? 1 : 0, reviewed: state.bengaliReview.status === 'REVIEWED' ? 1 : 0 } };
    });
    const user = userEvent.setup();
    render(<AdminVocabularyReview />);
    expect(await screen.findByText('official exam word')).toBeInTheDocument();
    expect(screen.getByText(/Not confirmed by WordNet/)).toHaveTextContent('antonym clear');

    const meaning = screen.getByLabelText('Bengali meaning');
    await user.clear(meaning);
    await user.type(meaning, 'দ্ব্যর্থবোধক');
    await user.click(screen.getByRole('button', { name: 'Save & mark reviewed' }));
    await waitFor(() => expect(calls.some((c) => c.method === 'PATCH')).toBe(true));
    const patch = calls.find((c) => c.method === 'PATCH');
    expect(patch.url).toMatch(/\/admin\/vocabulary\/words\/w1\/content$/);
    expect(patch.body).toEqual({ meaningBn: 'দ্ব্যর্থবোধক', markReviewed: true });
    expect(await screen.findByText(/reviewed by admin@x/)).toBeInTheDocument();
  });
});

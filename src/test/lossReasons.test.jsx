import 'fake-indexeddb/auto';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { analyseLosses, signalFor } from '../lib/lossReasons';
import { DataSourceProvider } from '../app/DataSourceContext';
import { createFixtureDataSource } from '../lib/dataSource';
import { clearResourceCache } from '../hooks/useResource';
import { languageStore } from '../hooks/useLanguagePreference';
import TestAnalyticsDashboard from '../components/analytics/TestAnalyticsDashboard';
import { practiceBank } from '../fixtures/practiceQuestions';

globalThis.IntersectionObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const q = (seq, outcome, timeSpentSec, extra = {}) => ({
  seq, topic: 'percentage', outcome, timeSpentSec, expectedTimeSec: 60, selectedOptionId: outcome === 'INCORRECT' ? 'o_b' : null,
  marksLost: outcome === 'CORRECT' ? 0 : outcome === 'INCORRECT' ? 1.25 : 1, explanation: { traps: [] }, ...extra,
});
const MARKING = { positive: 1, negative: 0.25 };

describe('analyseLosses: likely reasons come only from time and known traps', () => {
  it('maps each signal to a likely reason, and leaves plain wrong answers for the student', () => {
    expect(signalFor(q(1, 'INCORRECT', 10))).toMatchObject({ signal: 'rushed', likely: 'guess' }); // < 60/3
    expect(signalFor(q(2, 'INCORRECT', 150))).toMatchObject({ signal: 'stuck', likely: 'concept' }); // > 2×60
    expect(signalFor(q(3, 'INCORRECT', 45))).toMatchObject({ signal: 'wrong', likely: null });
    expect(signalFor(q(4, 'INCORRECT', 10, { explanation: { traps: [{ optionId: 'o_b', note: { en: 'Took 10% of the new price' } }] } })))
      .toMatchObject({ signal: 'trap', likely: 'concept', trap: { en: 'Took 10% of the new price' } }); // a trap beats timing
    expect(signalFor(q(5, 'UNATTEMPTED', 0))).toMatchObject({ signal: 'notReached', likely: 'time' });
    expect(signalFor(q(6, 'TIMED_OUT', 0))).toMatchObject({ signal: 'notReached', likely: 'time' });
    expect(signalFor(q(7, 'UNATTEMPTED', 40))).toMatchObject({ signal: 'skipped', likely: 'skipped' });
    expect(signalFor(q(8, 'INCORRECT', 3, { expectedTimeSec: null }))).toMatchObject({ signal: 'wrong', likely: null }, 'no usual time: no timing guess');
  });

  it('sums marks by reason; the student tag always wins; correct answers are ignored', () => {
    const review = [q(1, 'CORRECT', 30), q(2, 'INCORRECT', 10), q(3, 'INCORRECT', 45), q(4, 'UNATTEMPTED', 0), q(5, 'INCORRECT', 12)];
    const a = analyseLosses(review, { 5: 'misread' }, MARKING);
    expect(a.items.map((i) => [i.seq, i.reason, i.source])).toEqual([[2, 'guess', 'likely'], [3, 'untagged', 'none'], [4, 'time', 'likely'], [5, 'misread', 'you']]);
    expect(a.buckets.map((b) => [b.key, b.count, b.marksLost])).toEqual([['guess', 1, 1.25], ['misread', 1, 1.25], ['time', 1, 1], ['untagged', 1, 1.25]]);
    expect(a.totalLost).toBe(4.75);
    expect(a.negativeLost).toBe(0.75);
    expect(a).toMatchObject({ notReached: 1, tagged: 1, needsTag: 1, timeOnLostSec: 67 });
    expect(a.tips).toHaveLength(3);
    expect(a.tips[0].marksLost).toBe(1.25);
  });

  it('nothing lost, nothing to explain', () => {
    expect(analyseLosses([q(1, 'CORRECT', 30)], {}, MARKING)).toMatchObject({ items: [], buckets: [], totalLost: 0 });
  });
});

/** 10-question fixture mock: Q1-4 right, Q5-7 wrong (60-80 s), Q8-10 opened but blank. SSC: +2 / -0.5. */
async function takeFixtureMock(source) {
  const session = await source.createMock({ category: 'SSC', subject: 'quant', topicIds: ['profit_loss'], questionCount: 10, timeLimitMinutes: 10, language: 'en' });
  const bank = new Map(practiceBank.map((x) => [x.questionId, x]));
  const responses = session.questions.map((x, i) => {
    const right = bank.get(x.questionId).correctOptionId;
    // Wrong answers pick an option without a trap note, so no trap signal fires.
    const traps = bank.get(x.questionId).traps ?? {};
    const wrong = x.options.find((o) => o.optionId !== right && !traps[o.optionId]) ?? x.options.find((o) => o.optionId !== right);
    return { questionId: x.questionId, selectedOptionId: i < 4 ? right : i < 7 ? wrong.optionId : null, timeSpentSec: 20 + i * 10, markedForReview: false };
  });
  await source.submitMock({ sessionId: session.sessionId, responses });
  return session.sessionId;
}

function renderDashboard(source, id) {
  return render(
    <DataSourceProvider source={source}>
      <MemoryRouter>
        <TestAnalyticsDashboard sessionId={id} source={source} />
      </MemoryRouter>
    </DataSourceProvider>,
  );
}

describe('"Why did I lose marks?" on the result page', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    clearResourceCache();
    act(() => languageStore.set('en'));
  });

  it('shows marks lost by reason, next steps, and saves a one-tap reason per question', async () => {
    const source = createFixtureDataSource({ latencyMs: 0 });
    const id = await takeFixtureMock(source);
    const user = userEvent.setup();
    const { unmount } = renderDashboard(source, id);

    const panel = (await screen.findByText('Why did I lose marks?')).closest('section');
    // 3 wrong × (2 + 0.5) + 3 blank × 2 = 13.5, which is 20 − 6.5.
    expect(within(panel).getByText('You lost 13.5 marks on 6 questions')).toBeInTheDocument();
    expect(within(panel).getByText('1.5 of them to negative marking')).toBeInTheDocument();
    expect(within(panel).getByText('What to do next')).toBeInTheDocument();
    // Wrong in normal time: only the student knows why. Opened but blank: skipped.
    expect(within(panel).getAllByText('Not tagged yet').length).toBeGreaterThan(0);
    expect(within(panel).getAllByText('Skipped').length).toBeGreaterThan(0);

    const q5 = within(panel).getByRole('group', { name: 'Why did you lose this one? (Q5)' });
    await user.click(within(q5).getByRole('button', { name: /^Calculation slip/ }));
    expect(within(q5).getByRole('button', { name: /^Calculation slip/ })).toHaveAttribute('aria-pressed', 'true');
    expect(within(panel).getByText('2 · −5')).toBeInTheDocument(); // the two untagged wrong answers left
    expect((await source.getMockAnalytics(id)).lossReasons).toEqual({ 5: 'calculation' });

    // Coming back keeps the tag (cache patched); tapping it again clears it.
    unmount();
    renderDashboard(source, id);
    const again = within((await screen.findByText('Why did I lose marks?')).closest('section'));
    const q5b = again.getByRole('group', { name: 'Why did you lose this one? (Q5)' });
    expect(within(q5b).getByRole('button', { name: /^Calculation slip/ })).toHaveAttribute('aria-pressed', 'true');
    await user.click(within(q5b).getByRole('button', { name: /^Calculation slip/ }));
    expect((await source.getMockAnalytics(id)).lossReasons).toEqual({});
  }, 20_000); // takes a whole mock, tags, remounts

  it('a failed save puts the old tag back and says so', async () => {
    const source = createFixtureDataSource({ latencyMs: 0 });
    const id = await takeFixtureMock(source);
    const failing = { ...source, setLossReason: () => Promise.reject(new Error('offline')) };
    const user = userEvent.setup();
    renderDashboard(failing, id);
    const panel = within((await screen.findByText('Why did I lose marks?')).closest('section'));
    const q6 = panel.getByRole('group', { name: 'Why did you lose this one? (Q6)' });
    await user.click(within(q6).getByRole('button', { name: /^Concept gap/ }));
    expect(await panel.findByRole('alert')).toHaveTextContent('Could not save');
    expect(within(q6).getByRole('button', { name: /^Concept gap/ })).toHaveAttribute('aria-pressed', 'false');
  });
});

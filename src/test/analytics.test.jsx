import 'fake-indexeddb/auto';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { buildRetrySet } from '../features/analytics/retryQuiz';
import { DataSourceProvider } from '../app/DataSourceContext';
import { createFixtureDataSource } from '../lib/dataSource';
import { clearResourceCache } from '../hooks/useResource';
import { languageStore } from '../hooks/useLanguagePreference';
import TestAnalyticsDashboard from '../components/analytics/TestAnalyticsDashboard';
import RetryPracticePage from '../pages/RetryPracticePage';
import { practiceBank } from '../fixtures/practiceQuestions';

globalThis.IntersectionObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const r = (seq, topic, outcome, time = 30) => ({
  questionId: `q${seq}`,
  seq,
  topic,
  outcome,
  timeSpentSec: time,
  stem: { en: `Q${seq}` },
  options: ['a', 'b', 'c', 'd'].map((x) => ({ optionId: `o${seq}${x}`, text: { en: x } })),
});

describe('buildRetrySet', () => {
  const review = [
    r(1, 'time_work', 'INCORRECT', 40),
    r(2, 'time_work', 'INCORRECT', 90),
    r(3, 'time_work', 'INCORRECT', 20),
    r(4, 'percentage', 'INCORRECT', 50),
    r(5, 'average', 'INCORRECT', 10),
    r(6, 'percentage', 'INCORRECT', 70),
    r(7, 'average', 'UNATTEMPTED', 0),
    r(8, 'percentage', 'CORRECT', 30),
  ];
  const topics = [{ topic: 'time_work' }, { topic: 'percentage' }, { topic: 'average' }]; // most marks lost first

  it('takes 5 wrong answers round-robin across topics, weakest topic and longest struggle first', () => {
    const set = buildRetrySet(review, topics, { random: () => 0.5 });
    expect(set.questions.map((q) => q.questionId)).toEqual(['q2', 'q6', 'q5', 'q1', 'q4']);
    expect(set).toMatchObject({ incorrectTotal: 6, fromIncorrect: 5, fromUnattempted: 0 });
  });

  it('tops up with unattempted questions only when there are fewer than 5 wrong ones', () => {
    const set = buildRetrySet(review.filter((x) => [1, 7, 8].includes(x.seq)), topics);
    expect(set.questions.map((q) => q.questionId)).toEqual(['q1', 'q7']);
    expect(set).toMatchObject({ fromIncorrect: 1, fromUnattempted: 1 });
  });

  it('reshuffles options but keeps the same option ids', () => {
    let k = 0;
    const set = buildRetrySet([review[0]], topics, { random: () => [0.1, 0.9, 0.4][k++ % 3] });
    const ids = set.questions[0].options.map((o) => o.optionId);
    expect([...ids].sort()).toEqual(['o1a', 'o1b', 'o1c', 'o1d']);
    expect(ids).not.toEqual(['o1a', 'o1b', 'o1c', 'o1d']);
  });

  it('nothing to retry on a perfect paper', () => {
    expect(buildRetrySet([r(1, 'x', 'CORRECT')], []).questions).toEqual([]);
  });
});

/** Take a 10-question fixture mock: Q1-4 right, Q5-7 wrong, Q8-10 blank; Q2 and Q9 marked. */
async function takeFixtureMock(source) {
  const session = await source.createMock({
    category: 'SSC', subject: 'quant', topicIds: ['profit_loss'], questionCount: 10, timeLimitMinutes: 10,
    language: 'en', // SSC Quant: the official +2 / -0.5 (marks are never taken from the caller)
  });
  const bank = new Map(practiceBank.map((q) => [q.questionId, q]));
  const responses = session.questions.map((q, i) => {
    const right = bank.get(q.questionId).correctOptionId;
    return {
      questionId: q.questionId,
      selectedOptionId: i < 4 ? right : i < 7 ? q.options.find((o) => o.optionId !== right).optionId : null,
      timeSpentSec: 20 + i * 10,
      markedForReview: i === 1 || i === 8,
    };
  });
  await source.submitMock({ sessionId: session.sessionId, responses });
  return session.sessionId;
}

function Location() {
  return <output data-testid="path">{useLocation().pathname + useLocation().search}</output>;
}

describe('TestAnalyticsDashboard', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    clearResourceCache();
    act(() => languageStore.set('en'));
  });

  it('summary, honest percentile/cut-off states, charts, filters, bilingual review, and both retention links', async () => {
    const source = createFixtureDataSource({ latencyMs: 0 });
    const id = await takeFixtureMock(source);
    const user = userEvent.setup();
    render(
      <DataSourceProvider source={source}>
        <MemoryRouter initialEntries={[`/mock/${id}`]}>
          <Routes>
            <Route path="/mock/:sessionId" element={<TestAnalyticsDashboard sessionId={id} source={source} meta={{ examName: { en: 'SSC · P&L · Mock Test' } }} />} />
            <Route path="/mock/:sessionId/retry" element={<RetryPracticePage />} />
            <Route path="*" element={<p>elsewhere</p>} />
          </Routes>
          <Location />
        </MemoryRouter>
      </DataSourceProvider>,
    );

    await screen.findByText('Performance analysis');
    // 4×2 − 3×0.5 = 6.5 of 20
    expect(screen.getByText('6.5')).toBeInTheDocument();
    expect(screen.getByText('/ 20', { exact: false })).toBeInTheDocument();
    expect(screen.getByText(/Appears once 5 students have taken a comparable test/)).toBeInTheDocument();
    expect(screen.getByText(/No official cut-offs have been added for SSC yet/)).toBeInTheDocument();
    expect(screen.getByText('57.1%')).toBeInTheDocument(); // accuracy 4 of 7 attempted

    // Charts: one time bar per question, labelled for screen readers; outcome legend has icons + labels.
    expect(screen.getAllByRole('button', { name: /^Question \d+: / })).toHaveLength(10);
    expect(screen.getAllByText('✗').length).toBeGreaterThan(0);

    // Retention hooks
    const weakLink = screen.getByRole('link', { name: /Practice 15 Profit, Loss & Discount questions now/ });
    expect(weakLink).toHaveAttribute('href', '/exams/ssc/quant/profit-loss?practice=15');
    expect(screen.getByText(/3 wrong answers \+ 2 left blank, weakest topic first/)).toBeInTheDocument();

    // Review filters with counts
    const tabs = screen.getByRole('tablist', { name: 'Filter questions' });
    expect(within(tabs).getByRole('tab', { name: /Incorrect/ })).toHaveTextContent('3');
    expect(within(tabs).getByRole('tab', { name: /Unattempted/ })).toHaveTextContent('3');
    expect(within(tabs).getByRole('tab', { name: /Marked/ })).toHaveTextContent('2');
    await user.click(within(tabs).getByRole('tab', { name: /Incorrect/ }));
    expect(document.querySelectorAll('article[id^="review-q"]')).toHaveLength(3);

    // Side-by-side explanations
    await user.click(screen.getByRole('radio', { name: /Both/ }));
    const card = document.querySelector('article[id^="review-q"]');
    expect(within(card).getAllByText('EN').length).toBeGreaterThan(0);
    expect(within(card).getAllByText('বাংলা').length).toBeGreaterThan(0);
    expect(within(card).getAllByText(/Your answer/).length).toBe(1);

    // One click into the retry round
    await user.click(screen.getByRole('link', { name: /Start retry/ }));
    await waitFor(() => expect(screen.getByTestId('path').textContent).toBe(`/mock/${id}/retry`));
    await screen.findByRole('heading', { name: /Re-attempt incorrect questions/ });
    await screen.findByText('0/5 Completed');
  }, 20_000);
});

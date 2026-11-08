import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DataSourceProvider } from '../app/DataSourceContext';
import { languageStore } from '../hooks/useLanguagePreference';
import { buildRequest, defaultCount, parseCount, smartMinutes } from '../lib/customTest';
import { CT, reasonText, withNames } from '../lib/customTestCopy';
import CustomTestDialog from '../components/custom-test/CustomTestDialog';
import CustomTestResult from '../components/custom-test/CustomTestResult';
import CustomPracticePage from '../pages/CustomPracticePage';

const t = (en, bn) => ({ en, bn });
const SECONDS = { easy: 45, moderate: 70, hard: 100, exam: 75, mixed: 70 };
const chapter = (topic, en, bn, extra = {}) => ({
  topic,
  title: t(en, bn),
  emoji: '📘',
  available: { total: 40, easy: 15, moderate: 15, hard: 10, pyq: 5 },
  accuracyPct: null,
  answers: 0,
  status: 'not_started',
  mistakes: 0,
  priority: null,
  ...extra,
});
const options = {
  subject: 'quant',
  chapters: [
    chapter('percentage', 'Percentage', 'শতকরা', { accuracyPct: 52, answers: 12, mistakes: 3 }),
    chapter('profit_loss', 'Profit & Loss', 'লাভ-ক্ষতি', { accuracyPct: 81, answers: 20 }),
    chapter('ratio_proportion', 'Ratio & Proportion', 'অনুপাত'),
    chapter('algebra', 'Algebra', 'বীজগণিত', { available: { total: 0, easy: 0, moderate: 0, hard: 0, pyq: 0 } }),
  ],
  weakTopics: ['percentage'],
  mistakesTotal: 3,
  secondsPerQuestion: SECONDS,
  limits: { min: 5, max: 100 },
  history: { testsTaken: 0, challengeUnlocked: false, lastScores: [] },
};

function Where() {
  const loc = useLocation();
  return <p data-testid="where">{loc.pathname}</p>;
}

function renderWith(ui, source, { path = '/learn/math', route = '/learn/math' } = {}) {
  return render(
    <DataSourceProvider source={source}>
      <MemoryRouter initialEntries={[route]}>
        <Routes>
          <Route path={path} element={ui} />
          <Route path="*" element={<Where />} />
        </Routes>
      </MemoryRouter>
    </DataSourceProvider>,
  );
}

beforeEach(() => {
  languageStore.set?.('en');
});

describe('custom test helpers', () => {
  it('smart time, counts and the request body', () => {
    expect(smartMinutes(SECONDS, 'exam', 20)).toBe(25);
    expect(smartMinutes(SECONDS, 'easy', 2)).toBe(5);
    expect(defaultCount(2)).toBe(20);
    expect(defaultCount(3)).toBe(30);
    expect(parseCount('25')).toBe(25);
    expect(parseCount('4')).toBeNull();
    expect(parseCount('2.5')).toBeNull();
    const body = buildRequest('quant', { preset: 'custom', topics: new Set(['percentage']), count: 25, difficulty: 'exam', distribution: 'smart', mode: 'exam', time: 'smart' }, 'bn');
    expect(body).toEqual({ subject: 'quant', preset: 'custom', topics: ['percentage'], questionCount: 25, difficulty: 'exam', distribution: 'smart', mode: 'exam', language: 'bn' });
    expect(buildRequest('quant', { preset: 'quick10', topics: new Set(['a']), count: 30, difficulty: 'mixed', distribution: 'smart', mode: 'exam', time: 12 }, 'en')).toMatchObject({ timeLimitMinutes: 12 });
    expect(buildRequest('quant', { preset: 'quick10', topics: new Set(['a']), count: 30, difficulty: 'mixed', distribution: 'smart', mode: 'exam', time: 12 }, 'en').questionCount).toBeUndefined();
  });

  it('reason codes and names per language', () => {
    expect(reasonText('weak:52').en).toBe('your accuracy 52%');
    expect(reasonText('limited:7').bn).toContain('৭');
    expect(reasonText('unknown')).toBeNull();
    const v = withNames(CT.reviseBtn, t('Percentage', 'শতকরা'));
    expect(v).toEqual({ en: 'Revise Percentage', bn: 'শতকরা ঝালিয়ে নাও' });
  });
});

describe('custom test popup', () => {
  it('select chapters -> settings -> summary with the split -> start an exam-mode test', async () => {
    const user = userEvent.setup();
    const source = {
      getCustomTestOptions: vi.fn(async () => options),
      previewCustomTest: vi.fn(async (b) => ({ ...b, questionCount: 20, requested: 20, shortBy: 0, recommendedMinutes: 25, plan: [{ topic: 'percentage', count: 12, reasons: ['weak:52', 'mistakes:3'] }, { topic: 'profit_loss', count: 8, reasons: [] }] })),
      createCustomTest: vi.fn(async () => ({
        sessionId: 'a'.repeat(24),
        status: 'ACTIVE',
        custom: { mode: 'exam', preset: 'custom' },
        config: { questionCount: 1, timeLimitMinutes: 25, perQuestionTimer: false, allowPause: false, language: 'en', markingScheme: { positive: 1, negative: 0.25 } },
        startedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 1e6).toISOString(),
        questions: [{ questionId: 'b'.repeat(24), options: [] }],
      })),
    };
    renderWith(<CustomTestDialog open onClose={() => {}} subject="quant" />, source);

    const pct = await screen.findByRole('checkbox', { name: /Percentage/ });
    expect(screen.getByRole('checkbox', { name: /Algebra/ })).toBeDisabled();
    // Start is not possible before a chapter is chosen.
    expect(screen.getByRole('button', { name: /Start now with smart settings/ })).toBeDisabled();
    await user.click(pct);
    await user.click(screen.getByRole('checkbox', { name: /Profit & Loss/ }));
    expect(screen.getAllByText('2 chapters selected').length).toBeGreaterThan(0);
    // Weak-topic and mistakes shortcuts say what they will use.
    expect(screen.getByText(/Under 60%: Percentage/)).toBeInTheDocument();
    expect(screen.getByText(/You have 3 open mistakes/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Next/ }));
    expect(screen.getByText('Step 2 of 3')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '20' })).toHaveAttribute('aria-checked', 'true'); // 2 chapters -> 20
    expect(screen.getByRole('radio', { name: /Exam level/ })).toHaveAttribute('aria-checked', 'true');
    await user.click(screen.getByRole('radio', { name: /Balanced/ }));
    await user.click(screen.getByRole('radio', { name: /Smart/ }));

    await user.click(screen.getByRole('button', { name: /Next/ }));
    expect(await screen.findByText(/12/)).toBeInTheDocument();
    await waitFor(() => expect(source.previewCustomTest).toHaveBeenCalled());
    expect(await screen.findByText('your accuracy 52%')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /Smart time: 25 min/ })).toHaveAttribute('aria-checked', 'true');

    await user.click(screen.getByRole('button', { name: /Start Test/ }));
    await waitFor(() => expect(source.createCustomTest).toHaveBeenCalled());
    expect(source.createCustomTest.mock.calls[0][0]).toMatchObject({ subject: 'quant', preset: 'custom', topics: ['percentage', 'profit_loss'], questionCount: 20, difficulty: 'exam', distribution: 'smart', mode: 'exam' });
    expect(await screen.findByTestId('where')).toHaveTextContent(`/mock/${'a'.repeat(24)}`);
  });

  it('a practice-mode test opens the practice runner; server errors are explained', async () => {
    const user = userEvent.setup();
    const err = Object.assign(new Error('x'), { code: 'NO_WEAK_TOPICS' });
    const source = {
      getCustomTestOptions: vi.fn(async () => options),
      previewCustomTest: vi.fn(async () => { throw err; }),
      createCustomTest: vi.fn(async () => ({ sessionId: 'c'.repeat(24), custom: { mode: 'practice' } })),
    };
    renderWith(<CustomTestDialog open onClose={() => {}} subject="quant" />, source);
    await user.click(await screen.findByRole('button', { name: /Practice my weak topics/ }));
    expect(screen.getByText('Step 3 of 3')).toBeInTheDocument();
    expect(await screen.findByText(/No weak chapters yet/)).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: /Learning practice/ }));
    await user.click(screen.getByRole('button', { name: /Start Test/ }));
    expect(source.createCustomTest.mock.calls[0][0]).toMatchObject({ preset: 'weak', topics: ['percentage'], mode: 'practice' });
    expect(await screen.findByTestId('where')).toHaveTextContent(`/practice/custom/${'c'.repeat(24)}`);
  });
});

const report = {
  sessionId: 'd'.repeat(24),
  subject: 'quant',
  custom: { preset: 'custom', mode: 'exam', difficulty: 'exam', topics: ['percentage', 'profit_loss'] },
  score: 3.75, maxScore: 10, scorePct: 38, accuracy: 50, correct: 5, wrong: 5, skipped: 0, total: 10, timeSec: 1475, timeLimitMinutes: 13,
  marking: { positive: 1, negative: 0.25, basis: 'OFFICIAL' },
  chapters: [
    { topic: 'percentage', name: t('Percentage', 'শতকরা'), correct: 5, wrong: 0, skipped: 0, total: 5, accuracy: 100, band: 'strong' },
    { topic: 'profit_loss', name: t('Profit & Loss', 'লাভ-ক্ষতি'), correct: 0, wrong: 5, skipped: 0, total: 5, accuracy: 0, band: 'weak' },
  ],
  masteryPct: null,
  concepts: [{ topic: 'profit_loss', pattern: 'successive', name: t('Successive discount', 'ক্রমিক ছাড়'), correct: 0, total: 2, accuracy: 0, status: 'weak' }],
  recommendations: [
    { topic: 'percentage', accuracy: 100, action: 'next_chapter', nextTopic: 'ratio_proportion', name: t('Percentage', 'শতকরা'), nextName: t('Ratio & Proportion', 'অনুপাত') },
    { topic: 'profit_loss', accuracy: 0, action: 'revise', steps: ['revise_lesson', 'basic_quiz', 'targeted_test'], name: t('Profit & Loss', 'লাভ-ক্ষতি') },
  ],
  previous: { accuracy: 62 },
  nextTest: { preset: 'followup', followUpOf: 'd'.repeat(24), focusTopics: [{ topic: 'profit_loss', name: t('Profit & Loss', 'লাভ-ক্ষতি') }], difficulty: 'exam', harder: false },
  challenge: { unlocked: false, lastScores: [38] },
};
const opt = (id, en) => ({ optionId: id, text: t(en, en) });
const analytics = {
  review: [
    { questionId: 'q1', seq: 1, topic: 'percentage', outcome: 'CORRECT', selectedOptionId: 'opt_aaaa1', correctOptionId: 'opt_aaaa1', stem: t('What is 10% of 50?', '৫০-এর ১০%?'), options: [opt('opt_aaaa1', '5'), opt('opt_aaaa2', '10')], explanation: { steps: [], shortcut: null, traps: [] } },
    { questionId: 'q4', seq: 4, topic: 'profit_loss', outcome: 'INCORRECT', selectedOptionId: 'opt_bbbb2', correctOptionId: 'opt_bbbb3', stem: t('Two discounts of 10% and 20% equal?', 'ক্রমিক ছাড়?'), options: [opt('opt_bbbb1', '30%'), opt('opt_bbbb2', '28.5%'), opt('opt_bbbb3', '28%')], explanation: { steps: [t('10 + 20 − (10×20)/100 = 28%', '২৮%')], shortcut: t('Use a + b − ab/100', 'a + b − ab/100'), traps: [{ optionId: 'opt_bbbb2', note: t('Not 28.5', 'নয়') }] } },
  ],
};

describe('custom test result', () => {
  it('shows score, chapters, next steps, question analysis with Revise links, and Practice again', async () => {
    const user = userEvent.setup();
    const source = {
      getCustomTestReport: vi.fn(async () => report),
      getMockAnalytics: vi.fn(async () => analytics),
      createCustomTest: vi.fn(async () => ({ sessionId: 'e'.repeat(24), custom: { mode: 'practice' } })),
    };
    renderWith(<CustomTestResult sessionId={'d'.repeat(24)} />, source);
    expect(await screen.findByText('5/10')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByText('24 min 35 sec')).toBeInTheDocument();
    expect(screen.getByText(/Previous test: 62% → now 50%/)).toBeInTheDocument();
    expect(screen.getByText('🟢 Strong topic')).toBeInTheDocument();
    expect(screen.getByText('🔴 Weak topic')).toBeInTheDocument();
    expect(screen.getByText(/Move on to Ratio & Proportion/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /10 basic questions/ })).toHaveAttribute('href', '/learn/math/profit-loss/quiz/beginner');

    // Only wrong/skipped by default: question 4 with why, shortcut, trap and a Revise link.
    const q4 = screen.getByText('Question 4').closest('li');
    expect(screen.queryByText('Question 1')).toBeNull();
    expect(within(q4).getByText('10 + 20 − (10×20)/100 = 28%')).toBeInTheDocument();
    expect(within(q4).getByText(/Use a \+ b/)).toBeInTheDocument();
    expect(within(q4).getByText('Not 28.5')).toBeInTheDocument();
    expect(within(q4).getByRole('link', { name: /Revise Profit & Loss/ })).toHaveAttribute('href', '/learn/math/profit-loss');
    await user.click(screen.getByRole('button', { name: /Show all questions/ }));
    expect(screen.getByText('Question 1')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Practice again/ }));
    expect(source.createCustomTest.mock.calls[0][0]).toMatchObject({ subject: 'quant', preset: 'followup', followUpOf: 'd'.repeat(24) });
    expect(await screen.findByTestId('where')).toHaveTextContent(`/practice/custom/${'e'.repeat(24)}`);
  });
});

describe('practice runner', () => {
  it('checks each answer with explanation and shortcut, then submits', async () => {
    const user = userEvent.setup();
    const id = 'f'.repeat(24);
    const session = {
      sessionId: id,
      status: 'ACTIVE',
      config: { subject: 'quant', timeLimitMinutes: 3, questionCount: 2 },
      custom: { mode: 'practice', checked: {} },
      questions: [
        { questionId: 'q1', topic: 'percentage', pyq: [], stem: t('What is 10% of 50?', 'x'), options: [opt('opt_aaaa1', '5'), opt('opt_aaaa2', '10')] },
        { questionId: 'q2', topic: 'percentage', pyq: [], stem: t('What is 20% of 50?', 'y'), options: [opt('opt_cccc1', '10'), opt('opt_cccc2', '20')] },
      ],
    };
    const source = {
      getMockSession: vi.fn(async () => session),
      checkCustomAnswer: vi.fn(async (_s, { questionId, selectedOptionId }) => ({
        questionId, selectedOptionId, correctOptionId: 'opt_aaaa1', isCorrect: selectedOptionId === 'opt_aaaa1', locked: false,
        explanation: { steps: [t('50 × 10/100 = 5', '৫')], shortcut: t('10% = move the decimal', 'দশমিক'), traps: [] },
        concept: { subject: 'quant', topic: 'percentage', name: t('Percentage', 'শতকরা'), pattern: t('Basic percentage', 'মৌলিক') },
      })),
      submitMock: vi.fn(async () => ({})),
      getCustomTestReport: vi.fn(() => new Promise(() => {})),
      getMockAnalytics: vi.fn(() => new Promise(() => {})),
    };
    renderWith(<CustomPracticePage />, source, { path: '/practice/custom/:sessionId', route: `/practice/custom/${id}` });
    expect(await screen.findByText('What is 10% of 50?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Check answer/ })).toBeDisabled();
    await user.click(screen.getByRole('radio', { name: /10$/ }));
    await user.click(screen.getByRole('button', { name: /Check answer/ }));
    expect(await screen.findByText('❌ Not quite')).toBeInTheDocument();
    expect(screen.getByText('50 × 10/100 = 5')).toBeInTheDocument();
    expect(screen.getByText('10% = move the decimal')).toBeInTheDocument();
    expect(screen.getByText('Basic percentage')).toBeInTheDocument();
    // Answer is locked once checked.
    expect(screen.getByRole('radio', { name: /5$/ })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: /Next question/ }));
    expect(screen.getByText('What is 20% of 50?')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Finish and see result/ }));
    await waitFor(() => expect(source.submitMock).toHaveBeenCalled());
    const body = source.submitMock.mock.calls[0][0];
    expect(body.sessionId).toBe(id);
    expect(body.responses.map((r) => r.selectedOptionId)).toEqual(['opt_aaaa2', null]);
  });
});

import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../App';
import { DataSourceProvider } from '../app/DataSourceContext';
import { AuthProvider } from '../app/AuthContext';
import { createFixtureDataSource } from '../lib/dataSource';
import { clearResourceCache } from '../hooks/useResource';
import { languageStore } from '../hooks/useLanguagePreference';
import { focusStore } from '../lib/focusStore';
import { adaptiveAdvice, canSkip, daySummary, localIsoDate, localPlan, readiness } from '../lib/studyPlan';

const t = (en, bn) => ({ en, bn });
const learn = {
  id: 'd1-1', kind: 'learn', subject: 'quant', topic: 'number_system', name: t('Number System', 'সংখ্যা পদ্ধতি'), priority: 'MUST', session: { n: 1, of: 3 },
  minutes: 50, split: { concept: 20, examples: 10, practice: 20 }, learn: [t('Kinds of numbers', 'সংখ্যার প্রকারভেদ'), t('Prime numbers', 'মৌলিক সংখ্যা')],
  packs: [], questions: 15, accuracyTarget: 70, outcome: t('You can solve 15 questions with 70%+ accuracy.', 'ফল'),
};
const spaced = { id: 'd1-3', kind: 'spaced', minutes: 15, title: t('Spaced revision: topics learned earlier', 'রিভিশন'), items: [
  { subject: 'english', topic: 'articles', name: t('Articles', 'আর্টিকেল'), learnedDay: 1, kind: 'quick' },
  { subject: 'quant', topic: 'percentage', name: t('Percentage', 'শতকরা'), learnedDay: 1, kind: 'test' },
] };
const dailyTest = { id: 'd1-2', kind: 'daily_test', minutes: 25, sizes: { quant: 1, english: 1, gs: 0, pyq: 0 }, topics: [], title: t("Today's test: Math, English, GS and real PYQs", 'আজকের পরীক্ষা') };
const plan = {
  code: 'CLERKSHIP_60', version: 2, budget: 180, budgets: [120, 180, 240, 360],
  phases: [{ code: 'FOUNDATION', from: 1, to: 2, title: t('Phase 1 · Foundation', 'পর্ব ১'), goal: t('Basics', 'ভিত্তি') }],
  days: [
    { day: 1, phase: 'FOUNDATION', title: null, weeklyTest: false, minutes: 90, mission: { concepts: 1, questions: 17, revisions: 2, minutes: 90 }, tasks: [learn, dailyTest, spaced] },
    { day: 2, phase: 'FOUNDATION', title: null, weeklyTest: false, minutes: 30, mission: { concepts: 0, questions: 0, revisions: 0, minutes: 30 }, tasks: [{ id: 'd2-1', kind: 'revise', minutes: 30, title: t('Revision', 'রিভিশন') }] },
  ],
};
const q = (id, en) => ({ questionId: id, topic: 'number_system', difficulty: 2, pyq: [], stem: t(en, en), options: ['1', '2', '3', '4'].map((x, i) => ({ optionId: `opt_${id}${i}`, text: t(x, x) })) });
const testPayload = { day: 1, kind: 'daily_test', taskId: 'd1-2', minutes: 25, timed: false, negativeMarking: 0, testToken: 'tok', sections: [{ section: 'english', questions: [q('e1', 'English question')] }, { section: 'quant', questions: [q('m1', 'What is 2 + 2?')] }] };
const checked = {
  day: 1,
  summary: { kind: 'daily_test', correct: 1, total: 2, wrong: 1, skipped: 0, accuracy: 50, marks: 1, timeSec: 60, bySubject: { english: { correct: 1, total: 1, accuracy: 100 }, quant: { correct: 0, total: 1, accuracy: 0 } }, weakTopics: [{ subject: 'quant', topic: 'number_system', name: t('Number System', 'সংখ্যা পদ্ধতি'), accuracy: 0 }], strongTopics: [] },
  byTopic: [],
  results: [
    { questionId: 'e1', selectedOptionId: 'opt_e10', isCorrect: true, correctOptionId: 'opt_e10', steps: [], shortcut: null },
    { questionId: 'm1', selectedOptionId: 'opt_m10', isCorrect: false, correctOptionId: 'opt_m13', steps: [t('2 + 2 = 4', '২ + ২ = ৪')], shortcut: null },
  ],
};

function renderPlan(overrides = {}, { signedIn = false } = {}) {
  const source = {
    ...createFixtureDataSource({ latencyMs: 0 }),
    getStudyPlan: vi.fn(async () => plan),
    getPriorities: vi.fn(async () => ({ paperCount: 10, rule: {}, subjects: {} })),
    createPlanTest: vi.fn(async () => testPayload),
    checkPlanTest: vi.fn(async () => checked),
    getMe: vi.fn(async () => ({ user: signedIn ? { id: 'u1', name: 'Asha', email: 'a@example.com' } : null })),
    getPlanProgress: vi.fn(async () => ({ progress: { startDate: localIsoDate(), done: [], budget: 180, examDate: null, tests: {} } })),
    getReviewSummary: vi.fn(async () => ({ dueToday: 0 })),
    getInsights: vi.fn(async () => ({ mastery: [{ subject: 'quant', topic: 'percentage', status: 'strong', accuracyPct: 95, recentAnswers: 20 }] })),
    getPyqProgress: vi.fn(async (subject) => ({ subject, topics: {} })),
    getPyqFilters: vi.fn(async () => ({ exams: [], topics: [{ subject: 'quant', topic: 'number_system', name: { en: 'Number System' }, count: 12 }] })),
    ...overrides,
  };
  const user = userEvent.setup();
  render(
    <DataSourceProvider source={source}>
      <AuthProvider>
        <MemoryRouter initialEntries={['/plan']}>
          <AppRoutes />
        </MemoryRouter>
      </AuthProvider>
    </DataSourceProvider>,
  );
  return { user, source };
}

beforeEach(() => {
  clearResourceCache();
  languageStore.set('en');
  localPlan.write(null);
  focusStore.stop();
});

describe('plan logic', () => {
  it('readiness weighs subjects 30/30/40, counts untouched chapters as 0, and names the weakest', () => {
    const r = readiness({
      chapters: { quant: ['percentage', 'average'], english: ['articles'], gs: ['polity'] },
      mastery: { 'quant.percentage': { recentAnswers: 10, accuracyPct: 80 }, 'quant.average': { recentAnswers: 3, accuracyPct: 100 }, 'english.articles': { recentAnswers: 6, accuracyPct: 30 }, 'gs.polity': { recentAnswers: 9, accuracyPct: 60 } },
      pyq: { 'gs.polity': { total: 50, attempted: 75, solved: 60 } },
      tests: { 7: { kind: 'weekly_test', accuracy: 70 }, 3: { kind: 'daily_test', accuracy: 10 } },
    });
    expect([r.quant, r.english, r.gs]).toEqual([40, 30, 60]);
    expect(r.pyq).toBe(40);
    expect(r.mock).toBe(70);
    expect(r.overall).toBe(Math.round(0.7 * (0.3 * 40 + 0.3 * 30 + 0.4 * 60) + 0.15 * 40 + 0.15 * 70));
    expect(r.weakest).toBe('english');
  });

  it('advice and the day summary come from the latest test; strong topics may skip revision', () => {
    const tests = { 1: checked.summary };
    expect(adaptiveAdvice(tests).weak[0].topic).toBe('number_system');
    expect(adaptiveAdvice({})).toEqual({ weak: [], strong: [] });
    const s = daySummary(plan.days[0], { done: new Set(['d1-1']), tests });
    expect(s).toMatchObject({ complete: false, remaining: 2, weakArea: 'quant' });
    expect(canSkip(spaced.items[1], { mastery: { 'quant.percentage': { status: 'strong' } }, advice: { strong: [] } })).toBe(true);
    expect(canSkip(spaced.items[0], { mastery: {}, advice: { strong: [] } })).toBe(false);
  });
});

describe('plan page', () => {
  it('a day shows the mission, what to learn with minutes, target and outcome, and spaced revision', async () => {
    localPlan.write({ startDate: localIsoDate(), done: [], version: 2 });
    renderPlan();
    expect(await screen.findByText(/Learn 1 concept · Solve 17 questions · Revise 2 earlier topics · 90 minutes/)).toBeInTheDocument();
    const today = screen.getByRole('region', { name: /Today's target/ });
    expect(within(today).getByText('Prime numbers')).toBeInTheDocument();
    expect(within(today).getAllByText(/Target accuracy: 70%\+/).length).toBeGreaterThan(0);
    expect(within(today).getAllByText(/You can solve 15 questions/).length).toBeGreaterThan(0);
    expect((await within(today).findAllByRole('link', { name: /How WBPSC asks this/ }))[0]).toHaveAttribute('href', '/pyq?subject=quant&topic=number_system');
    expect(within(today).getAllByRole('link', { name: /^Articles/ })[0]).toHaveAttribute('href', '/learn/english/articles?mode=revision');
  });

  it('hides the past-question link for a chapter with no PYQs', async () => {
    localPlan.write({ startDate: localIsoDate(), done: [], version: 2 });
    const getPyqFilters = vi.fn(async () => ({ exams: [], topics: [] }));
    renderPlan({ getPyqFilters });
    const today = await screen.findByRole('region', { name: /Today's target/ });
    expect(await within(today).findByText('Prime numbers')).toBeInTheDocument();
    await vi.waitFor(() => expect(getPyqFilters).toHaveBeenCalled());
    expect(within(today).queryByRole('link', { name: /How WBPSC asks this/ })).not.toBeInTheDocument();
  });

  it('changing the study time reloads the plan for that budget and saves it', async () => {
    localPlan.write({ startDate: localIsoDate(), done: [], version: 2 });
    const { user, source } = renderPlan();
    const settings = (await screen.findAllByRole('combobox')).at(-1);
    await user.selectOptions(settings, '360');
    await user.click(screen.getAllByRole('button', { name: /^Save/ }).at(-1));
    expect(source.getStudyPlan).toHaveBeenLastCalledWith(360);
    expect(localPlan.read().budget).toBe(360);
  });

  it('the daily test runs one question at a time, is marked on the server, and updates the day summary and advice', async () => {
    localPlan.write({ startDate: localIsoDate(), done: [], version: 2 });
    const { user, source } = renderPlan();
    const today = await screen.findByRole('region', { name: /Today's target/ });
    await user.click(within(today).getAllByRole('button', { name: /Start the test/ })[0]);
    expect(await screen.findByText('English question')).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: /^A/ }));
    await user.click(screen.getByRole('button', { name: /^Next/ }));
    expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: /^A/ }));
    await user.click(screen.getByRole('button', { name: /Submit test/ }));
    const confirm = await screen.findByRole('dialog', { name: /Submit the test\?/ });
    expect(within(confirm).getByTestId('attempted')).toHaveTextContent('2');
    expect(within(confirm).getByTestId('not-attempted')).toHaveTextContent('0');
    expect(within(confirm).getByText('You have answered every question.')).toBeInTheDocument();
    await user.click(within(confirm).getByRole('button', { name: /^Yes, submit/ }));
    expect(source.checkPlanTest).toHaveBeenCalledWith(1, expect.objectContaining({ testToken: 'tok', answers: [expect.objectContaining({ questionId: 'e1', selectedOptionId: 'opt_e10' }), expect.objectContaining({ questionId: 'm1', selectedOptionId: 'opt_m10' })] }));
    expect(await screen.findByText('Score: 1/2')).toBeInTheDocument();
    expect(screen.getByText(/Today's test: 1\/2 \(50%\)/)).toBeInTheDocument();
    expect(screen.getByText(/Weak area today: Math/)).toBeInTheDocument();
    expect(screen.getByText(/Weak topic detected: Number System \(0%\)/)).toBeInTheDocument();
    expect(localPlan.read().tests['1'].correct).toBe(1);
    expect(localPlan.read().done).toContain('d1-2');
  });

  it('submitting asks first, with attempted and not-attempted counts', async () => {
    localPlan.write({ startDate: localIsoDate(), done: [], version: 2 });
    const { user, source } = renderPlan();
    const today = await screen.findByRole('region', { name: /Today's target/ });
    await user.click(within(today).getAllByRole('button', { name: /Start the test/ })[0]);
    expect(await screen.findByText('English question')).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: /^A/ }));
    await user.click(screen.getByRole('button', { name: /Submit test/ }));
    let confirm = await screen.findByRole('dialog', { name: /Submit the test\?/ });
    expect(within(confirm).getByTestId('total')).toHaveTextContent('2');
    expect(within(confirm).getByTestId('attempted')).toHaveTextContent('1');
    expect(within(confirm).getByTestId('not-attempted')).toHaveTextContent('1');
    expect(within(confirm).getByText(/1 question is not answered yet/)).toBeInTheDocument();
    // Back to the test: nothing is submitted.
    await user.click(within(confirm).getByRole('button', { name: /^Back to test/ }));
    expect(source.checkPlanTest).not.toHaveBeenCalled();
    // Go to the first unanswered question.
    await user.click(screen.getByRole('button', { name: /Submit test/ }));
    confirm = await screen.findByRole('dialog', { name: /Submit the test\?/ });
    await user.click(within(confirm).getByRole('button', { name: /^Go to first unanswered/ }));
    expect(screen.getByText('What is 2 + 2?')).toBeInTheDocument();
    expect(source.checkPlanTest).not.toHaveBeenCalled();
  });

  it('signed in: readiness with the biggest improvement area; strong topics may be skipped', async () => {
    renderPlan({}, { signedIn: true });
    expect(await screen.findByRole('heading', { name: /WBPSC Clerkship readiness/ })).toBeInTheDocument();
    expect(await screen.findByText(/Your biggest improvement area is/)).toBeInTheDocument();
    expect((await screen.findAllByText(/You know this well: skip if short of time/)).length).toBeGreaterThan(0);
  });

  it('Focus Mode hides the site navigation and ends with a session summary', async () => {
    localPlan.write({ startDate: localIsoDate(), done: [], version: 2 });
    const { user } = renderPlan();
    await screen.findByRole('region', { name: /Today's target/ });
    expect(screen.getAllByRole('navigation', { name: 'Site' }).length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: /Start Focus Mode/ }));
    expect(screen.queryByRole('navigation', { name: 'Site' })).not.toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Focus Mode' })).toBeInTheDocument();
    act(() => focusStore.record(true));
    await user.click(screen.getByRole('button', { name: /End session/ }));
    expect(await screen.findByText(/Focus session complete/)).toBeInTheDocument();
    expect(screen.getByText(/Questions solved: 1 · Accuracy: 100%/)).toBeInTheDocument();
    expect(screen.getAllByRole('navigation', { name: 'Site' }).length).toBeGreaterThan(0);
  });

  it('exam countdown, and a notice when ticks from the old plan layout were cleared', async () => {
    const inTwenty = localIsoDate(new Date(Date.now() + 20 * 86_400_000));
    localPlan.write({ startDate: localIsoDate(), done: ['d1-1'], examDate: inTwenty });
    renderPlan();
    expect(await screen.findByText(/⏳ 20 days remaining/)).toBeInTheDocument();
    expect(screen.getByText(/The 60-day plan was improved/)).toBeInTheDocument();
    expect(localPlan.read().done).toEqual([]);
  });
});

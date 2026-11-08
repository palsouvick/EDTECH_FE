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
import { dayNumber, localIsoDate, localPlan, nextStep, taskLink } from '../lib/studyPlan';

const t = (en, bn) => ({ en, bn });
const learn = (id, subject, topic, priority, session) => ({ id, kind: 'learn', subject, topic, name: t(topic, topic), priority, session, minutes: 30 });
const day = (n, tasks, extra = {}) => ({ day: n, phase: 'FOUNDATION', title: null, weeklyTest: false, minutes: 90, mission: { concepts: tasks.filter((x) => x.kind === 'learn' && !x.optional).length, questions: 25, revisions: 0, minutes: 90 }, tasks, ...extra });
const days = [
  day(1, [learn('d1-1', 'gs', 'polity', 'MUST', { n: 1, of: 4 }), learn('d1-2', 'quant', 'number_system', 'MUST', { n: 1, of: 3 }), { id: 'd1-3', kind: 'revise', minutes: 10, title: t('Revision: questions due today', 'রিভিশন') }]),
  day(2, [learn('d2-1', 'gs', 'geography', 'MUST', { n: 1, of: 4 }), { id: 'd2-2', kind: 'revise', minutes: 10, title: t('Revision: questions due today', 'রিভিশন') }]),
  day(3, [learn('d3-1', 'gs', 'important_days', null, { n: 1, of: 2 }), { id: 'd3-2', kind: 'revise', minutes: 10, title: t('Revision: questions due today', 'রিভিশন') }]),
  day(4, [{ id: 'd4-1', kind: 'pyq_paper', exam: 'WBPSC Clerkship (Part-I)', year: 2023, minutes: 60, title: t('Past paper: WBPSC Clerkship (Part-I) 2023', 'আগের প্রশ্নপত্র') }, { id: 'd4-2', kind: 'learn', subject: 'gs', topic: 'art_culture', name: t('Art', 'শিল্প'), optional: true, minutes: 20 }]),
];
const plan = { code: 'CLERKSHIP_60', days, phases: [{ code: 'FOUNDATION', from: 1, to: 4, title: t('Phase 1 · Foundation', 'পর্ব ১'), goal: t('Basics', 'ভিত্তি') }] };
const isoDaysAgo = (n) => localIsoDate(new Date(Date.now() - n * 86_400_000));

describe('plan logic', () => {
  it('counts days in the local calendar', () => {
    expect(dayNumber('2026-11-06', '2026-11-06')).toBe(1);
    expect(dayNumber('2026-11-06', '2026-12-05')).toBe(30);
    expect(dayNumber('2026-11-06', '2026-11-05')).toBe(0);
    expect(dayNumber('2026-10-30', '2026-11-02')).toBe(4);
  });

  it('what next: leftover first, then due revision, then today in order, then a weak chapter', () => {
    const none = new Set();
    let n = nextStep({ days, done: none, today: 2 });
    expect(n.task.id).toBe('d1-1');
    expect(n.reason.en).toMatch(/Left over from Day 1/);

    const day1 = new Set(['d1-1', 'd1-2', 'd1-3']);
    n = nextStep({ days, done: day1, today: 2 });
    expect(n.task.id).toBe('d2-1');
    expect(n.reason.en).toMatch(/Must know in WBPSC past papers; next in the plan \(1\/4\)/);

    n = nextStep({ days, done: day1, today: 2, dueToday: 20 });
    expect(n.task.id).toBe('d2-2');
    expect(n.reason.en).toMatch(/20 revision questions are due/);

    const allBut = new Set([...day1, 'd2-1', 'd2-2']);
    expect(nextStep({ days, done: allBut, today: 2 })).toBeNull();
    n = nextStep({ days, done: allBut, today: 2, weak: [{ subject: 'quant', topic: 'percentage', name: t('Percentage', 'শতকরা'), accuracyPct: 35 }] });
    expect(n.task.extra).toBe(true);
    expect(n.reason.en).toMatch(/accuracy here is 35%/);
  });

  it('a backlog older than three days is left behind; optional tasks never block', () => {
    // Day 1 is unfinished, but on Day 8 only Days 5–7 count as leftovers.
    const longer = [...days, day(5, []), day(6, []), day(7, []), day(8, [{ id: 'd8-1', kind: 'revise', minutes: 10, title: t('R', 'R') }])];
    const late = nextStep({ days: longer, done: new Set(), today: 8 });
    expect(late.task.id).toBe('d8-1');
    expect(late.day).toBe(8);
    // Day 4's optional task does not keep the day open.
    expect(nextStep({ days, done: new Set(['d1-1', 'd1-2', 'd1-3', 'd2-1', 'd2-2', 'd3-1', 'd3-2', 'd4-1']), today: 4 })).toBeNull();
  });

  it('links every task kind to the page where it is done', () => {
    expect(taskLink(learn('x', 'gs', 'west_bengal_gk'))).toBe('/learn/gk/west-bengal-gk');
    expect(taskLink(learn('x', 'quant', 'number_system'))).toBe('/learn/math/number-system');
    expect(taskLink(learn('x', 'english', 'fill_blanks'))).toBe('/learn/english/fill-blanks');
    expect(taskLink(days[3].tasks[0])).toBe('/pyq?exam=WBPSC+Clerkship+%28Part-I%29&year=2023');
    expect(taskLink({ kind: 'mock', subject: 'quant' })).toBe('/exams/wbpsc/quant');
    expect(taskLink({ kind: 'rest' })).toBeNull();
  });
});

function renderAt(path, overrides = {}) {
  const source = { ...createFixtureDataSource({ latencyMs: 0 }), getStudyPlan: vi.fn(async () => plan), getPriorities: vi.fn(async () => ({ paperCount: 10, rule: {}, subjects: {} })), ...overrides };
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
  localPlan.write(null);
});

describe('plan page (guest)', () => {
  it('starts on a chosen date, shows today and what next, and keeps ticks on this device', async () => {
    const { user } = renderAt('/plan');
    await user.click(await screen.findByRole('button', { name: /^Start the plan/ }));

    const next = screen.getByRole('region', { name: /What should I study next/ });
    expect(within(next).getByText('Study: polity (session 1 of 4)')).toBeInTheDocument();
    expect(within(next).getByRole('link', { name: /Open/ })).toHaveAttribute('href', '/learn/gk/polity');

    const today = screen.getByRole('region', { name: /Today's target/ });
    expect(within(today).getByText(/Day 1 of 4/, { selector: 'span' })).toBeInTheDocument();
    await user.click(within(today).getByRole('button', { name: /Done: Study: polity/ }));
    expect(within(next).getByText('Study: number_system (session 1 of 3)')).toBeInTheDocument();
    expect(localPlan.read()).toMatchObject({ startDate: localIsoDate(), done: ['d1-1'], budget: 180, version: 2 });
    expect(within(today).getByText('1 of 8 tasks done')).toBeInTheDocument();
  });

  it('a plan started three days ago opens on Day 4 and first offers what was left', async () => {
    localPlan.write({ startDate: isoDaysAgo(3), done: [], version: 2 });
    renderAt('/plan');
    const next = await screen.findByRole('region', { name: /What should I study next/ });
    expect(within(next).getByText(/Left over from Day 1/)).toBeInTheDocument();
    const today = screen.getByRole('region', { name: /Today's target/ });
    expect(within(today).getByText('If you have time')).toBeInTheDocument();
  });
});

describe('plan page (signed in)', () => {
  it('moves a guest\'s ticks into the account once, then saves ticks to the server', async () => {
    localPlan.write({ startDate: '2026-11-06', done: ['d1-1'], version: 2 });
    const getPlanProgress = vi.fn(async () => ({ progress: null }));
    const startPlan = vi.fn(async ({ startDate }) => ({ progress: { startDate, done: [] } }));
    const setPlanTasks = vi.fn(async ({ done = [] }) => ({ progress: { startDate: '2026-11-06', done: ['d1-1', ...done.filter((d) => d !== 'd1-1')] } }));
    const getMe = vi.fn(async () => ({ user: { id: 'u1', name: 'Asha', email: 'a@example.com' } }));
    const { AuthProvider } = await import('../app/AuthContext');
    const source = {
      ...createFixtureDataSource({ latencyMs: 0 }),
      getStudyPlan: vi.fn(async () => plan), getPlanProgress, startPlan, setPlanTasks, getMe,
      getReviewSummary: vi.fn(async () => ({ dueToday: 0 })), getInsights: vi.fn(async () => ({ mastery: [] })),
      getPriorities: vi.fn(async () => ({ paperCount: 10, rule: {}, subjects: {} })),
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
    await screen.findByRole('region', { name: /What should I study next/ });
    expect(startPlan).toHaveBeenCalledWith(expect.objectContaining({ startDate: '2026-11-06', budget: 180 }));
    expect(setPlanTasks).toHaveBeenCalledWith({ done: ['d1-1'] });
    expect(localPlan.read()).toBeNull();

    const today = screen.getByRole('region', { name: /Today's target/ });
    const rows = within(today).getAllByRole('button', { name: /^Done:/ });
    await user.click(rows.find((b) => b.getAttribute('aria-pressed') === 'false'));
    expect(setPlanTasks).toHaveBeenLastCalledWith(expect.objectContaining({ done: [expect.stringMatching(/^d\d+-\d+$/)] }));
  });
});

describe('PYQ deep link from the plan', () => {
  it('/pyq?exam=…&year=… opens that paper directly', async () => {
    const question = {
      questionId: 'q1', topic: 'polity', difficulty: 2, pyq: [], stem: t('Q text', 'Q'),
      options: ['a', 'b', 'c', 'd'].map((x, i) => ({ optionId: `o${i}`, text: t(x, x) })), correctOptionId: 'o0', steps: [t('why', 'কেন')], stats: { attempts: 1, correct: 1 },
    };
    const pyqPracticeSource = vi.fn(() => createFixturePracticeSource([question], { latencyMs: 0 }));
    renderAt('/pyq?exam=WBPSC%20Clerkship%20(Part-I)&year=2023', { getPyqFilters: vi.fn(async () => ({ exams: [], topics: [] })), pyqPracticeSource });
    expect(await screen.findByText('Q text')).toBeInTheDocument();
    expect(pyqPracticeSource).toHaveBeenCalledWith({ exam: 'WBPSC Clerkship (Part-I)', year: 2023 });
  });
});

import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '../lib/api';
import { AppRoutes } from '../App';
import { AuthProvider } from '../app/AuthContext';
import { DataSourceProvider } from '../app/DataSourceContext';
import { createFixtureDataSource, createHttpDataSource } from '../lib/dataSource';
import { clearResourceCache } from '../hooks/useResource';
import { languageStore } from '../hooks/useLanguagePreference';
import { localIsoDate } from '../lib/studyPlan';
import PriorityBadge from '../components/priority/PriorityBadge';

const t = (en, bn) => ({ en, bn });

const options = [
  { code: 'WBPSC_CLERKSHIP', name: t('Clerkship', 'ক্লার্কশিপ'), category: 'WBPSC', categoryName: t('WBPSC', 'WBPSC'), support: 'full', hasPlan: true, planCode: 'clerkship-60', planRoute: '/plan', pyqCount: 150, hasPattern: true, patternAsOf: null },
  { code: 'WBCS', name: t('WBCS', 'WBCS'), category: 'WBPSC', categoryName: t('WBPSC', 'WBPSC'), support: 'partial', hasPlan: false, planCode: null, planRoute: null, pyqCount: 200, hasPattern: true, patternAsOf: null },
  { code: 'SSC_CGL', name: t('CGL', 'CGL'), category: 'SSC', categoryName: t('SSC', 'SSC'), support: 'minimal', hasPlan: false, planCode: null, planRoute: null, pyqCount: null, hasPattern: true, patternAsOf: null },
];

const chapters = [
  { topic: 'percentage', name: t('Percentage', 'শতকরা'), weight: 25, weightSource: 'pyq', pyqCount: 12, bankCount: 20, answered: 6, pyqSolved: 4, completion: 40, hasLesson: true },
  { topic: 'algebra', name: t('Algebra', 'বীজগণিত'), weight: null, weightSource: null, pyqCount: 0, bankCount: 10, answered: 0, pyqSolved: 0, completion: 10, hasLesson: false },
];
const clerkshipSyllabus = {
  exam: { code: 'WBPSC_CLERKSHIP', name: t('Clerkship', 'ক্লার্কশিপ'), support: 'full', hasPlan: true, planCode: 'clerkship-60', planRoute: '/plan' },
  pattern: { stageName: t('Part-I', 'পার্ট-I'), durationMin: 90, negative: 0.25, sections: [{ subject: 'quant', name: t('Arithmetic', 'পাটিগণিত'), questions: 30, marks: 30, weight: 30 }] },
  subjects: [{ subject: 'quant', name: t('Arithmetic', 'পাটিগণিত'), weight: 30, weightSource: 'pattern', chapters }],
  readiness: { score: 42, components: { coverage: 30, mastery: 55, pyq: 12 }, basis: 'syllabus', note: null },
  countdown: { examDate: '2027-03-01', daysLeft: 42 },
};
const wbcsSyllabus = {
  ...clerkshipSyllabus,
  exam: { code: 'WBCS', name: t('WBCS', 'WBCS'), support: 'partial', hasPlan: false, planCode: null, planRoute: null },
  readiness: { score: 18, components: { coverage: 25, mastery: 50, pyq: null }, basis: 'syllabus', note: null },
  countdown: null,
};

const learn = (id, subject, topic, name) => ({ id, kind: 'learn', subject, topic, name: t(name, name), minutes: 30 });
const planDays = [
  { day: 1, phase: 'FOUNDATION', title: null, weeklyTest: false, minutes: 90, mission: {}, tasks: [learn('d1-1', 'gs', 'polity', 'Polity'), { id: 'd1-2', kind: 'revise', minutes: 10, title: t('Revision', 'রিভিশন') }] },
  { day: 2, phase: 'FOUNDATION', title: null, weeklyTest: false, minutes: 90, mission: {}, tasks: [learn('d2-1', 'quant', 'percentage', 'Percentage')] },
];
const plan = { code: 'CLERKSHIP_60', days: planDays, phases: [] };

const priorities = {
  paperCount: 10,
  rule: { mustPercent: 20, mustPaperPercent: 50, importantPercent: 10, importantPaperPercent: 30 },
  subjects: { gs: { topics: { polity: { share: 30, papers: 8, level: 'MUST' } } } },
};

/** The server's ONE Today list (F3), as GET /me/today returns it. */
function mkToday(items, plan = null) {
  return {
    date: '2026-11-19',
    exam: null,
    plan,
    items,
    totalMinutes: items.reduce((a, i) => a + i.minutes, 0),
    budgetMinutes: null,
    trimmedCount: 0,
    primary: items[0] ?? null,
  };
}
const defaultToday = mkToday([
  { id: 'today-1', kind: 'learn', source: 'unfinished_priority', subject: 'quant', topic: 'percentage', title: t('Learn — Percentage', 'শেখো — শতকরা'), minutes: 20 },
  { id: 'today-2', kind: 'general', source: 'daily_goal', title: t('Answer 30 questions today (0/30)', 'আজ ৩০টি প্রশ্নের উত্তর দাও (০/৩০)'), minutes: 15 },
]);

function stubSource({ user: initialUser, syllabus = clerkshipSyllabus, planProgress = null, dueToday = 0, today = defaultToday } = {}) {
  let currentUser = initialUser === undefined
    ? { id: 'u1', name: 'Riya Sen', email: 'riya@example.com', targetExam: null }
    : initialUser;
  return {
    ...createFixtureDataSource({ latencyMs: 0 }),
    getMe: vi.fn(async () => ({ user: currentUser })),
    getTargetExamOptions: vi.fn(async () => options),
    getTargetExamSyllabus: vi.fn(async () => {
      if (!currentUser?.targetExam) throw new ApiError(422, 'NO_TARGET_EXAM', 'No target exam chosen yet');
      return syllabus;
    }),
    setTargetExam: vi.fn(async ({ examCode, examDate, dailyStudyMinutes, preferredLanguage }) => {
      currentUser = {
        ...currentUser,
        targetExam: examCode ? { code: examCode, date: examDate || null, setAt: '2026-11-18T00:00:00.000Z' } : null,
        ...(dailyStudyMinutes !== undefined ? { dailyStudyMinutes: dailyStudyMinutes ?? null } : {}),
        ...(preferredLanguage !== undefined ? { preferredLanguage: preferredLanguage ?? null } : {}),
      };
      return { user: currentUser };
    }),
    getReviewSummary: vi.fn(async () => ({ dueToday, active: dueToday, mastered: 0, mistakesActive: 0, nextDueAt: null })),
    getToday: vi.fn(async () => today),
    getPlanProgress: vi.fn(async () => ({ progress: planProgress })),
    getStudyPlan: vi.fn(async () => plan),
    getIdoProgress: vi.fn(async () => ({ progress: null })),
    getIdoPlan: vi.fn(async () => ({ days: [] })),
    getPriorities: vi.fn(async () => priorities),
  };
}

function Location() {
  const l = useLocation();
  return <output data-testid="path">{`${l.pathname}${l.search}`}</output>;
}
const path = () => screen.getByTestId('path').textContent;

function renderAt(at, source) {
  const user = userEvent.setup();
  render(
    <DataSourceProvider source={source ?? stubSource()}>
      <AuthProvider>
        <MemoryRouter initialEntries={[at]}>
          <AppRoutes />
          <Location />
        </MemoryRouter>
      </AuthProvider>
    </DataSourceProvider>,
  );
  return user;
}

beforeEach(() => {
  localStorage.clear();
  clearResourceCache();
  act(() => languageStore.set('en'));
});

describe('target exam HTTP data source', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('unwraps the server { language, exams } options payload to the array the picker reads', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        new Response(JSON.stringify({ success: true, data: { language: 'en', exams: options } }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    );
    await expect(createHttpDataSource().getTargetExamOptions()).resolves.toEqual(options);
  });
});

describe('target exam picker', () => {
  it('lists exams grouped by category with honest support labels, and skipping lands on ?next=', async () => {
    const user = renderAt('/choose-exam?next=/me');
    await screen.findByRole('heading', { name: 'Choose your target exam' });
    expect(screen.getByText('Study plan + readiness')).toBeInTheDocument();
    expect(screen.getByText('Syllabus + previous papers')).toBeInTheDocument();
    expect(screen.getByText(/no previous papers in the app yet/)).toBeInTheDocument();
    expect(screen.getByText(/Switching exams keeps everything/)).toBeInTheDocument();

    await user.click(await screen.findByRole('button', { name: /Not sure yet/ }));
    expect(path()).toBe('/me');
  });

  it('choosing an exam saves it, then offers the syllabus', async () => {
    const source = stubSource();
    const user = renderAt('/choose-exam', source);
    await screen.findByRole('heading', { name: 'Choose your target exam' });
    await user.click(screen.getByRole('button', { name: /Clerkship/ }));
    await user.click(screen.getByRole('button', { name: /Save my target exam/ }));
    await screen.findByText('Saved — this is your target exam now.');
    expect(source.setTargetExam).toHaveBeenCalledWith({ examCode: 'WBPSC_CLERKSHIP', examDate: null, dailyStudyMinutes: null, preferredLanguage: 'en' });

    await user.click(screen.getByRole('link', { name: /View my syllabus/ }));
    expect(path()).toBe('/my-syllabus');
    await screen.findByText('Percentage');
    expect(screen.getByText('No weight data — the paper does not publish one, and we have not measured it from past papers yet.')).toBeInTheDocument();
  });

  it('saves daily study time, study language and "not announced" with the exam', async () => {
    const source = stubSource();
    const user = renderAt('/choose-exam', source);
    await screen.findByRole('heading', { name: 'Choose your target exam' });
    await user.click(screen.getByRole('button', { name: /Clerkship/ }));

    // "Not announced" instead of a date: the date input disables.
    const notAnnounced = await screen.findByRole('checkbox', { name: /Exam date not announced/ });
    await user.click(notAnnounced);
    expect(screen.getByLabelText(/Exam date \(if you know it\)/)).toBeDisabled();

    // 3 hours a day, in Bengali medium.
    await user.click(within(screen.getByRole('group', { name: 'Daily study time' })).getByRole('button', { name: '3h' }));
    await user.click(within(screen.getByRole('group', { name: 'Study language' })).getByRole('button', { name: 'বাংলা' }));

    await user.click(screen.getByRole('button', { name: /Save my target exam/ }));
    await screen.findByText('Saved — this is your target exam now.');
    expect(source.setTargetExam).toHaveBeenCalledWith({
      examCode: 'WBPSC_CLERKSHIP',
      examDate: null,
      dailyStudyMinutes: 180,
      preferredLanguage: 'bn',
    });
    // The study language applies on this device once the server has it.
    expect(languageStore.get()).toBe('bn');
  });

  it('works offline: the fixture source lists real catalogue exams and remembers the choice', async () => {
    localStorage.setItem('edtech:fixture-user', JSON.stringify({ id: 'fixture-user', name: 'Riya', email: 'riya@example.com', targetExam: null }));
    const user = renderAt('/choose-exam', createFixtureDataSource({ latencyMs: 0 }));
    await screen.findByRole('heading', { name: 'Choose your target exam' });
    await screen.findByText('CGL');
    await user.click(screen.getByRole('button', { name: /^CGL/ }));
    await user.click(screen.getByRole('button', { name: /Save my target exam/ }));
    await screen.findByText('Saved — this is your target exam now.');
    expect(JSON.parse(localStorage.getItem('edtech:fixture-user')).targetExam.code).toBe('SSC_CGL');
  });
});

describe('target exam onboarding', () => {
  it('register without a target exam goes to the picker; login does not force it', async () => {
    const user = renderAt('/register?next=/me', stubSource({ user: null }));
    await user.type(await screen.findByLabelText(/^Full name/), 'Arjun Sen');
    await user.type(screen.getByLabelText(/^Email/), 'arjun@example.com');
    await user.type(screen.getByLabelText(/^Password/), 'secret123');
    await user.click(screen.getByRole('button', { name: /^Create account/ }));
    await screen.findByRole('heading', { name: 'Choose your target exam' });
    expect(path()).toBe('/choose-exam?next=%2Fme');
  });

  it('login returns to ?next= without the picker', async () => {
    const user = renderAt('/login?next=/me', stubSource({ user: null }));
    await user.type(await screen.findByLabelText(/^Email/), 'riya@example.com');
    await user.type(screen.getByLabelText(/^Password/), 'secret123');
    await user.click(screen.getByRole('button', { name: /^Log in/ }));
    await screen.findByRole('heading', { name: /^My performance/ });
    expect(path()).toBe('/me');
  });
});

describe('home target-exam card and prompt', () => {
  it('prompts once when no exam is set, and dismissal sticks on the device', async () => {
    const user = renderAt('/');
    await screen.findByText('Pick your target exam');
    expect(screen.getByRole('link', { name: /Choose your exam/ })).toHaveAttribute('href', '/choose-exam');

    await user.click(screen.getByRole('button', { name: 'Not now' }));
    expect(screen.queryByText('Pick your target exam')).toBeNull();
    expect(localStorage.getItem('edtech:target-exam-prompt-dismissed')).toBe('1');
  });

  it('shows the exam, countdown and server readiness when one is set', async () => {
    renderAt('/', stubSource({
      user: { id: 'u1', name: 'Riya Sen', email: 'riya@example.com', targetExam: { code: 'WBPSC_CLERKSHIP', date: '2027-03-01', setAt: '2026-11-18T00:00:00.000Z' } },
    }));
    await screen.findByText('Clerkship');
    expect(await screen.findByText('42 days left')).toBeInTheDocument();
    // Phase 12: readiness is its own Home block, with its parts in words.
    expect(screen.getByTestId('home-readiness').textContent).toBe('42%');
    expect(screen.getByRole('heading', { name: /Exam readiness/ })).toBeInTheDocument();
    expect(screen.getByText(/Syllabus covered 30% · mastery 55% · PYQs 12%/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /View my syllabus/ })).toHaveAttribute('href', '/my-syllabus');
    expect(screen.queryByText('Pick your target exam')).toBeNull();
  });

  it('home shows the ONE Today list from the server, with a single Continue button', async () => {
    renderAt('/', stubSource({
      user: { id: 'u1', name: 'Riya Sen', email: 'riya@example.com', targetExam: { code: 'WBPSC_CLERKSHIP', date: null, setAt: '2026-11-18T00:00:00.000Z' } },
      planProgress: null,
    }));
    await screen.findByRole('heading', { name: /Today's Study/ });
    // The Continue button and the first list item lead to the same first task.
    const cont = await screen.findByRole('link', { name: /Continue Studying/ });
    const first = await screen.findByRole('link', { name: /Learn — Percentage/ });
    expect(cont).toHaveAttribute('href', first.getAttribute('href'));
    expect(screen.getByText('About 35 minutes today')).toBeInTheDocument();
    // The home page no longer builds a competing plan of its own.
    expect(screen.queryByText(/Start your 2-day plan/)).toBeNull();
    expect(screen.queryByText(/Syllabus .*% complete/)).toBeNull();
  });

  it('plan exam, started: the Today list carries the plan day and its next task', async () => {
    renderAt('/', stubSource({
      user: { id: 'u1', name: 'Riya Sen', email: 'riya@example.com', targetExam: { code: 'WBPSC_CLERKSHIP', date: null, setAt: '2026-11-18T00:00:00.000Z' } },
      today: mkToday(
        [{ id: 'today-1', kind: 'plan', source: 'plan', planKind: 'learn', day: 1, task: planDays[0].tasks[0], subject: 'gs', topic: 'polity', title: t('Polity', 'Polity'), minutes: 30 }],
        { code: 'WBPSC_CLERKSHIP', route: '/plan', day: 1, total: 2, dayDone: false },
      ),
    }));
    expect(await screen.findByText(/Day 1 of 2/)).toBeInTheDocument();
    const task = await screen.findByRole('link', { name: /Study: Polity/ });
    expect(task).toHaveAttribute('href', '/learn/gk/polity');
    expect(screen.getByRole('link', { name: /Continue Studying/ })).toHaveAttribute('href', '/learn/gk/polity');
  });

  it('no-plan exam: the Today list comes from the engine, not from syllabus progress', async () => {
    renderAt('/', stubSource({
      user: { id: 'u1', name: 'Riya Sen', email: 'riya@example.com', targetExam: { code: 'WBCS', date: null, setAt: '2026-11-18T00:00:00.000Z' } },
      syllabus: wbcsSyllabus,
    }));
    await screen.findByRole('heading', { name: /Today's Study/ });
    expect(await screen.findByRole('link', { name: /Learn — Percentage/ })).toBeInTheDocument();
    expect(screen.queryByText(/Work on Algebra/)).toBeNull();
  });

  it('due revision from the engine leads the Today list and the Continue button', async () => {
    renderAt('/', stubSource({
      user: { id: 'u1', name: 'Riya Sen', email: 'riya@example.com', targetExam: { code: 'WBCS', date: null, setAt: '2026-11-18T00:00:00.000Z' } },
      syllabus: wbcsSyllabus,
      today: mkToday([
        { id: 'today-1', kind: 'revise', source: 'overdue_revision', title: t('Revise 3 questions due today', 'আজ বাকি ৩টি প্রশ্ন রিভিশন করো'), count: 3, overdue: 1, minutes: 6 },
        { id: 'today-2', kind: 'learn', source: 'unfinished_priority', subject: 'quant', topic: 'percentage', title: t('Learn — Percentage', 'শেখো — শতকরা'), minutes: 20 },
      ]),
    }));
    const next = await screen.findByRole('link', { name: /Revise 3 questions due today/ });
    expect(next).toHaveAttribute('href', '/revise');
    expect(screen.getByRole('link', { name: /Continue Studying/ })).toHaveAttribute('href', '/revise');
  });
});

describe('my syllabus page', () => {
  it('redirects to the picker when no target exam is set', async () => {
    renderAt('/my-syllabus');
    await screen.findByRole('heading', { name: 'Choose your target exam' });
    expect(path()).toBe('/choose-exam?next=%2Fmy-syllabus');
  });

  it('shows pattern, readiness breakdown and chapters with weights and completion', async () => {
    renderAt('/my-syllabus', stubSource({
      user: { id: 'u1', name: 'Riya Sen', email: 'riya@example.com', targetExam: { code: 'WBPSC_CLERKSHIP', date: '2027-03-01', setAt: '2026-11-18T00:00:00.000Z' } },
    }));
    await screen.findByRole('heading', { name: 'My syllabus' });
    expect(await screen.findByText('Exam pattern')).toBeInTheDocument();
    expect(await screen.findByText('30 questions')).toBeInTheDocument();
    expect(screen.getByText('Readiness (syllabus + mastery + PYQs)')).toBeInTheDocument();
    expect(await screen.findByText('12 PYQs')).toBeInTheDocument();
    expect(await screen.findByText('6 of 20 answered')).toBeInTheDocument();
    expect(await screen.findByText('40% complete')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Open the full plan/ })).toHaveAttribute('href', '/plan');
  });
});

describe('target exam elsewhere', () => {
  it('account menu and /me both offer changing the exam', async () => {
    const source = stubSource({
      user: { id: 'u1', name: 'Riya Sen', email: 'riya@example.com', targetExam: { code: 'WBPSC_CLERKSHIP', date: '2027-03-01', setAt: '2026-11-18T00:00:00.000Z' } },
    });
    const user = renderAt('/exams', source);
    await user.click(await screen.findByRole('button', { name: /Account: Riya Sen/ }));
    expect(within(screen.getByRole('menu')).getByRole('menuitem', { name: /Target exam/ })).toHaveAttribute('href', '/choose-exam');

    renderAt('/me', source);
    await screen.findByRole('heading', { name: /^My performance/ });
    expect(await screen.findByText(/WBPSC CLERKSHIP/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Change exam/ })).toHaveAttribute('href', '/choose-exam');
  });

  it('/me without an exam offers choosing one', async () => {
    renderAt('/me');
    await screen.findByRole('heading', { name: /^My performance/ });
    expect(await screen.findByText(/No target exam chosen yet/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Choose your exam/ })).toHaveAttribute('href', '/choose-exam');
  });

  it('/me shows the target exam with "Not announced", daily study time and study language', async () => {
    renderAt('/me', stubSource({
      user: {
        id: 'u1', name: 'Riya Sen', email: 'riya@example.com',
        targetExam: { code: 'WBCS', date: null, setAt: '2026-11-18T00:00:00.000Z' },
        dailyStudyMinutes: 180,
        preferredLanguage: 'bn',
      },
    }));
    await screen.findByRole('heading', { name: /^My performance/ });
    // The profile section loads with the performance data, after the heading.
    const heading = await screen.findByRole('heading', { name: 'Target exam' });
    const section = heading.closest('section');
    expect(within(section).getByText('WBCS')).toBeInTheDocument();
    expect(within(section).getByText('Not announced')).toBeInTheDocument();
    expect(within(section).getByText('3h a day')).toBeInTheDocument();
    expect(within(section).getByText('বাংলা')).toBeInTheDocument();
    expect(within(section).getByRole('link', { name: /Change exam/ })).toHaveAttribute('href', '/choose-exam');
  });

  it('priorities are scoped to the target exam', async () => {
    const source = stubSource({
      user: { id: 'u1', name: 'Riya Sen', email: 'riya@example.com', targetExam: { code: 'WBPSC_CLERKSHIP', date: null, setAt: '2026-11-18T00:00:00.000Z' } },
    });
    render(
      <DataSourceProvider source={source}>
        <AuthProvider>
          <MemoryRouter>
            <PriorityBadge subject="gs" topics={['polity']} />
          </MemoryRouter>
        </AuthProvider>
      </DataSourceProvider>,
    );
    await screen.findByText('Must know');
    expect(source.getPriorities).toHaveBeenCalledWith('WBPSC_CLERKSHIP');
  });
});

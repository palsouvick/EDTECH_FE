import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../App';
import { DataSourceProvider } from '../app/DataSourceContext';
import { createFixtureDataSource } from '../lib/dataSource';
import { clearResourceCache } from '../hooks/useResource';
import { languageStore } from '../hooks/useLanguagePreference';
import { levelProgress, recordQuiz, rememberChapter } from '../lib/learnProgress';

const t = (en, bn) => ({ en, bn });
const levels = [
  { level: 'beginner', count: 30, questionCount: 2, timed: false, timeLimitSec: null },
  { level: 'intermediate', count: 20, questionCount: 2, timed: false, timeLimitSec: null },
  { level: 'advanced', count: 20, questionCount: 2, timed: true, timeLimitSec: 120 },
];
const lesson = {
  subject: 'quant',
  topic: 'percentage',
  emoji: '💯',
  title: t('Percentage', 'শতকরা'),
  intro: t('Per cent means out of 100.', 'শতকরা মানে প্রতি 100-তে।'),
  levels: ['basic', 'intermediate', 'advanced'].map((level) => ({
    level,
    sections: [{ heading: t(`${level} idea`, `${level} ধারণা`), body: t(`About ${level}.`, `${level} নিয়ে।`) }],
    examples: [{ question: t(`What is 10% of 50 (${level})?`, `50-এর 10% কত?`), steps: [t('Take 50 / 10.', '50 / 10 নাও।')], answer: t('5', 'উত্তর 5') }],
  })),
  rules: [{ label: t('x% of A', 'A-এর x%'), latex: '\\frac{x}{100}\\times A', explain: t('Multiply.', 'গুণ করো।') }],
  tips: [t('Base first.', 'আগে ভিত্তি।')],
};

const question = (i) => ({
  questionId: `q${i}`,
  index: i,
  stem: t(`Question number ${i}?`, `প্রশ্ন নম্বর ${i}?`),
  options: [
    { optionId: `opt_a${i}aa`, text: t(`right ${i}`, `ঠিক ${i}`) },
    { optionId: `opt_b${i}bb`, text: t(`wrong ${i}`, `ভুল ${i}`) },
  ],
});

function stubSource() {
  let draw = 0;
  return {
    ...createFixtureDataSource({ latencyMs: 0 }),
    listLearnSubjects: async () => ({
      subjects: [
        { code: 'quant', title: t('Math', 'গণিত'), emoji: '🔢', chapterCount: 15, questionCount: 1500 },
        { code: 'english', title: t('English', 'ইংরেজি'), emoji: '🔤', chapterCount: 8, questionCount: 800 },
      ],
    }),
    getLearnSubject: async () => ({
      subject: { code: 'quant', title: t('Math', 'গণিত'), emoji: '🔢' },
      chapters: [{ topic: 'percentage', title: lesson.title, emoji: '💯', intro: lesson.intro, hasLesson: true, levels }],
    }),
    getLearnChapter: async () => ({ subject: { code: 'quant' }, topic: 'percentage', title: lesson.title, lesson, levels, previous: null, next: null }),
    createLearnQuiz: vi.fn(async ({ level }) => {
      const base = draw;
      draw += 2;
      return { level, timed: level === 'advanced', timeLimitSec: level === 'advanced' ? 120 : null, restarted: false, questions: [question(base + 1), question(base + 2)] };
    }),
    checkLearnQuiz: vi.fn(async ({ answers }) => {
      const results = answers.map((a) => {
        const n = a.questionId.slice(1);
        const correctOptionId = `opt_a${n}aa`;
        return { questionId: a.questionId, selectedOptionId: a.selectedOptionId, isCorrect: a.selectedOptionId === correctOptionId, correctOptionId, steps: [t(`Because ${n}.`, `কারণ ${n}।`)], shortcut: null, trapForSelected: null };
      });
      return { results, score: { correct: results.filter((r) => r.isCorrect).length, total: results.length } };
    }),
  };
}

function Location() {
  return <output data-testid="path">{useLocation().pathname}</output>;
}

function renderAt(path, source = stubSource()) {
  const user = userEvent.setup();
  render(
    <DataSourceProvider source={source}>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
        <Location />
      </MemoryRouter>
    </DataSourceProvider>,
  );
  return { user, source };
}

const path = () => screen.getByTestId('path').textContent;

beforeEach(() => {
  localStorage.clear();
  clearResourceCache();
  act(() => languageStore.set('en'));
});

describe('learn', () => {
  it('home keeps the exams, adds a Learn Basics section, and opens a subject', async () => {
    const { user } = renderAt('/');
    expect(screen.getByRole('heading', { name: /^Pick your exam/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /^Banking/ })).toHaveAttribute('href', '/exams/bank');
    const nav = screen.getAllByRole('navigation', { name: 'Site' })[0];
    expect(within(nav).getByRole('link', { name: /^Exams/ })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Previous years/ })).toBeNull();

    const section = document.getElementById('learn-basics');
    expect(within(section).getByRole('heading', { name: /^Weak in the basics/ })).toBeInTheDocument();
    const math = within(section).getByRole('link', { name: /Math.*Numbers/s });
    expect(await within(math).findByText('15 chapters')).toBeInTheDocument();
    await user.click(math);
    expect(path()).toBe('/learn/math');
    await user.click(await screen.findByRole('link', { name: /Percentage/ }));
    expect(path()).toBe('/learn/math/percentage');
  });

  it('Learn Basics shows progress, a "continue" link to the last chapter, and chapter search', async () => {
    recordQuiz('quant', 'percentage', 'beginner', { questionIds: ['q1'], restarted: false, correct: 9, total: 10 });
    rememberChapter('quant', 'percentage', { en: 'Percentage', bn: 'শতকরা' });
    const { user } = renderAt('/learn/math');
    const card = (await screen.findByRole('heading', { name: /^Percentage/, level: 2 })).closest('a');
    expect(within(card).getByText('1/3 levels')).toBeInTheDocument();
    expect(within(card).getByText('Continue')).toBeInTheDocument();
    expect(screen.getByText('1 of 3 levels cleared')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Continue where you left off.*Percentage/s })).toHaveAttribute('href', '/learn/math/percentage');

    await user.type(screen.getByRole('searchbox'), 'zzz');
    expect(screen.getByText('No chapter matches your search.')).toBeInTheDocument();
  });

  it('one "Learn Basics" menu item opens Math and English tabs', async () => {
    const { user } = renderAt('/tips');
    const nav = screen.getAllByRole('navigation', { name: 'Site' })[0];
    expect(within(nav).queryByRole('link', { name: /^Math/ })).toBeNull();
    await user.click(within(nav).getByRole('link', { name: /^Learn Basics/ }));
    expect(path()).toBe('/learn/math');
    const tabs = screen.getByRole('navigation', { name: 'Subject' });
    expect(within(tabs).getByRole('link', { name: /Math/ })).toHaveAttribute('aria-current', 'page');
    // The new page renders its own header: look the menu up again.
    const siteNav = screen.getAllByRole('navigation', { name: 'Site' })[0];
    expect(within(siteNav).getByRole('link', { name: /^Learn Basics/ })).toHaveAttribute('aria-current', 'page');
    await user.click(within(tabs).getByRole('link', { name: /English/ }));
    expect(path()).toBe('/learn/english');
    expect(within(tabs).getByRole('link', { name: /English/ })).toHaveAttribute('aria-current', 'page');
  });

  it('chapter: lesson levels, worked solution, formulas, and three quizzes', async () => {
    const { user } = renderAt('/learn/math/percentage');
    expect(await screen.findByRole('heading', { name: /^Percentage/, level: 1 })).toBeInTheDocument();
    expect(screen.getByText('About basic.')).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: /Advanced/ }));
    expect(screen.getByText('About advanced.')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^Show the solution/ }));
    expect(screen.getByText('Take 50 / 10.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^Formulas to remember/ })).toBeInTheDocument();
    expect(screen.getAllByText('No timer')).toHaveLength(2);
    expect(screen.getByText('Timer: 2 min')).toBeInTheDocument();
  });

  it('beginner quiz: no timer, review shows right and wrong with explanations, retry gets new questions', async () => {
    const { user, source } = renderAt('/learn/math/percentage/quiz/beginner');
    await screen.findByText('Question number 1?');
    expect(screen.queryByRole('timer')).toBeNull();

    await user.click(screen.getByRole('radio', { name: /right 1/ }));
    await user.click(screen.getByRole('button', { name: /Next/ }));
    await user.click(screen.getByRole('radio', { name: /wrong 2/ }));
    await user.click(screen.getByRole('button', { name: /Finish and see answers/ }));

    expect(await screen.findByText('You got 1 out of 2 right')).toBeInTheDocument();
    expect(screen.getByText('Right')).toBeInTheDocument();
    expect(screen.getByText('Wrong')).toBeInTheDocument();
    expect(screen.getByText('Because 2.')).toBeInTheDocument();
    expect(levelProgress('quant', 'percentage', 'beginner')).toEqual({ seen: ['q1', 'q2'], best: { correct: 1, total: 2 } });

    await user.click(screen.getByRole('button', { name: /Try again with new questions/ }));
    await screen.findByText('Question number 3?');
    expect(source.createLearnQuiz).toHaveBeenLastCalledWith(expect.objectContaining({ level: 'beginner', exclude: ['q1', 'q2'] }));
  });

  it('asks before finishing with unanswered questions', async () => {
    const { user, source } = renderAt('/learn/math/percentage/quiz/intermediate');
    await screen.findByText('Question number 1?');
    await user.click(screen.getByRole('button', { name: '2' }));
    await user.click(screen.getByRole('button', { name: /Finish and see answers/ }));
    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText(/2 question\(s\) are not answered yet/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: /^Finish now/ }));
    expect(await screen.findByText('You got 0 out of 2 right')).toBeInTheDocument();
    expect(source.checkLearnQuiz.mock.calls[0][0].answers.every((a) => a.selectedOptionId === null)).toBe(true);
  });

  it('advanced quiz is timed and submits itself when time runs out', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      renderAt('/learn/math/percentage/quiz/advanced');
      await screen.findByText('Question number 1?');
      expect(screen.getByRole('timer')).toHaveTextContent('2:00');
      await act(async () => {
        vi.advanceTimersByTime(121_000);
      });
      expect(await screen.findByText('Time is up! Your answers were submitted.')).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });
});

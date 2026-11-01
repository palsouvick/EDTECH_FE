import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../App';
import { DataSourceProvider } from '../app/DataSourceContext';
import { createFixtureDataSource } from '../lib/dataSource';
import { clearResourceCache } from '../hooks/useResource';
import { languageStore } from '../hooks/useLanguagePreference';
import { lessonProgress, levelProgress, recordQuiz, rememberChapter } from '../lib/learnProgress';
import { ApiError } from '../lib/api';

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

const timeWorkLesson = {
  ...lesson,
  topic: 'time_work',
  title: t('Time & Work', 'সময় ও কার্য'),
  strategy: {
    heading: t('Problem-Solving Strategy / প্রথমে কীভাবে শুরু করব?', 'Problem-Solving Strategy / প্রথমে কীভাবে শুরু করব?'),
    sections: [{ heading: t('Choose a method', 'পদ্ধতি বেছে নাও'), body: t('Find the rate first.', 'আগে কাজের হার বের করো।') }],
  },
  practice: {
    question: t('A does 1/4 of a job each day. How much in 2 days?', 'A প্রতিদিন কাজের 1/4 করে। 2 দিনে কতটা?'),
    steps: [t('Multiply 2 by 1/4.', '2-কে 1/4 দিয়ে গুণ করো।')],
    answer: t('1/2', '1/2'),
  },
  levels: ['basic', 'intermediate', 'advanced'].map((level) => ({
    level,
    sections: [{ heading: t(`${level} idea`, `${level} ধারণা`), body: t(`About ${level}.`, `${level} নিয়ে।`) }],
    examples: level === 'basic'
      ? Array.from({ length: 10 }, (_, i) => ({
        question: t(`Everyday question ${i + 1}?`, `দৈনন্দিন প্রশ্ন ${i + 1}?`),
        given: t('One worker takes 4 days.', 'একজনের 4 দিন লাগে।'),
        find: t('Work in 1 day.', '1 দিনে কাজ।'),
        method: t('Divide 1 by 4.', '1-কে 4 দিয়ে ভাগ করো।'),
        steps: [t('Rate = 1/4 per day.', 'হার = প্রতিদিন 1/4।'), t('Use the stated time.', 'দেওয়া সময় ব্যবহার করো।')],
        answer: t('1/4', '1/4'),
        why: t('Four equal daily parts make the whole.', 'চারটি সমান দৈনিক অংশে পুরো কাজ হয়।'),
      }))
      : [{ question: t(`What is 10% of 50 (${level})?`, `50-এর 10% কত?`), steps: [t('Take 50 / 10.', '50 / 10 নাও।')], answer: t('5', 'উত্তর 5') }],
  })),
};

const algebraLesson = {
  ...timeWorkLesson,
  topic: 'algebra',
  title: t('Algebra', 'বীজগণিত'),
  strategy: {
    heading: t('Algebra problem-solving strategy', 'বীজগণিতের সমস্যা সমাধানের কৌশল'),
    sections: [
      { heading: t('Name the unknown', 'অজানাকে নাম দাও'), body: t('Use a letter for the number you need to find.', 'যে সংখ্যাটি বের করতে হবে, তার জন্য একটি অক্ষর নাও।') },
      { heading: t('Undo operations in reverse order', 'উল্টো ক্রমে কাজগুলো খোলো'), body: t('Undo addition or subtraction before multiplication or division.', 'গুণ বা ভাগের আগে যোগ বা বিয়োগের উল্টো কাজ করো।') },
      { heading: t('Keep the equation balanced', 'সমীকরণের ভারসাম্য রাখো'), body: t('Do the same operation on both sides.', 'দুই দিকেই একই কাজ করো।') },
      { heading: t('Check by substitution', 'বসিয়ে যাচাই করো'), body: t('Put your answer back into the original equation.', 'মূল সমীকরণে উত্তরটি বসিয়ে দেখো।') },
      { heading: t('Read the requested form', 'যে রূপ চেয়েছে তা লেখো'), body: t('Give the value of the unknown and include units when needed.', 'অজানার মান লেখো এবং দরকার হলে একক দাও।') },
    ],
  },
  levels: timeWorkLesson.levels.map((level) => ({
    ...level,
    examples: level.level === 'basic'
      ? Array.from({ length: 10 }, (_, i) => ({
        question: t(`Solve: x + ${i + 1} = ${i + 5}.`, `সমাধান করো: x + ${i + 1} = ${i + 5}।`),
        given: t(`x + ${i + 1} = ${i + 5}.`, `x + ${i + 1} = ${i + 5}।`),
        find: t('Find x.', 'x-এর মান বের করো।'),
        method: t('Undo addition by subtracting the same number from both sides.', 'দুই দিক থেকে একই সংখ্যা বিয়োগ করে যোগের উল্টো কাজ করো।'),
        steps: [t(`Subtract ${i + 1} from both sides.`, `দুই দিক থেকে ${i + 1} বিয়োগ করো।`), t(`Therefore x = ${4}.`, `তাই x = 4।`)],
        answer: t('x = 4', 'x = 4'),
        why: t('The same operation keeps both sides equal.', 'একই কাজ করলে দুই দিক সমান থাকে।'),
      }))
      : level.examples,
  })),
};

const timeWorkPattern = {
  key: 'two_together',
  emoji: '🤝',
  name: t('Two people working together', 'দুজন একসঙ্গে কাজ করলে'),
  spot: t('Two times are given.', 'দুটি সময় দেওয়া আছে।'),
  typicalWording: t('How long together?', 'একসঙ্গে কত দিন?'),
  method: [t('Add rates.', 'হার যোগ করো。'), t('Invert the result.', 'উত্তর উল্টে দাও।')],
  formula: t('xy/(x+y)', 'xy/(x+y)'),
  shortcut: t('Only for steady simultaneous work.', 'একসঙ্গে স্থির গতিতে কাজ করলেই।'),
  trap: t('Do not add days.', 'দিন যোগ কোরো না।'),
  difficulty: 'beginner',
  practiceLevels: ['beginner'],
  example: {
    question: t('A takes 4 days and B 4 days. How long together?', 'A ও B-র 4 দিন লাগে। একসঙ্গে কত দিন?'),
    steps: [t('Each does 1/4 per day.', 'প্রত্যেকে দিনে 1/4 করে।'), t('Together do 1/2 per day.', 'একসঙ্গে দিনে 1/2 করে।')],
    answer: t('2 days', '2 দিন'),
  },
  tryIt: {
    question: t('A takes 6 days and B 3 days. How long together?', 'A-র 6 দিন ও B-র 3 দিন লাগে। একসঙ্গে কত দিন?'),
    options: [t('2', '2'), t('3', '3'), t('4', '4'), t('9', '9')],
    correct: 0,
    explanation: [t('Rates add to 1/2 per day.', 'হার যোগে দিনে 1/2 হয়।'), t('The whole job takes 2 days.', 'পুরো কাজে 2 দিন লাগে।')],
  },
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
    getLearnChapter: async (_subject, topic) => {
      const selectedLesson = topic === 'time_work' ? timeWorkLesson : topic === 'algebra' ? algebraLesson : lesson;
      return { subject: { code: 'quant' }, topic, title: selectedLesson.title, lesson: selectedLesson, levels, previous: null, next: null };
    },
    getTopicPatterns: async ({ topic }) => ({ patterns: topic === 'time_work' ? [timeWorkPattern] : [] }),
    createLearnQuiz: vi.fn(async ({ level }) => {
      const base = draw;
      draw += 2;
      return { level, timed: level === 'advanced', timeLimitSec: level === 'advanced' ? 120 : null, restarted: false, quizToken: `token-${base}`, questions: [question(base + 1), question(base + 2)] };
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
    // Rendered in place (no redirect), so there is no empty frame before the page appears.
    expect(path()).toBe('/learn');
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

  it('Time & Work lesson sections are navigable, resumable, and expose saved items and pattern practice', async () => {
    const { user, source } = renderAt('/learn/math/time-work');
    expect(await screen.findByRole('heading', { name: /^Time & Work/, level: 1 })).toBeInTheDocument();
    expect(screen.getByText('Section 1 of 8')).toBeInTheDocument();
    expect(screen.getByText('Try this short exercise')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Solved Examples/ }));
    expect(screen.getByText('Section 2 of 8')).toBeInTheDocument();
    expect(screen.getAllByText(/Everyday question/)).toHaveLength(10);
    await user.click(screen.getAllByRole('button', { name: /Show the solution/ })[0]);
    expect(screen.getByText('One worker takes 4 days.')).toBeInTheDocument();
    expect(screen.getByText('Why it works')).toBeInTheDocument();
    await user.click(screen.getAllByRole('button', { name: /Save/ })[0]);
    expect(lessonProgress('quant', 'time_work').bookmarks).toContain('example-1');

    await user.click(screen.getByRole('button', { name: /Problem-Solving Strategy/ }));
    expect(screen.getByText('Find the rate first.')).toBeInTheDocument();
    expect(lessonProgress('quant', 'time_work').section).toBe('strategy');

    await user.click(screen.getByRole('button', { name: /Question Patterns/ }));
    expect(await screen.findByRole('heading', { name: 'Two people working together' })).toBeInTheDocument();
    const patternPracticeLink = screen.getByRole('link', { name: /Basic practice/ });
    expect(patternPracticeLink).toHaveAttribute(
      'href',
      '/learn/math/time-work/quiz/beginner?pattern=two_together',
    );
    await user.click(patternPracticeLink);
    await screen.findByText('Question number 1?');
    expect(source.createLearnQuiz).toHaveBeenLastCalledWith(expect.objectContaining({ pattern: 'two_together' }));
    await user.click(screen.getByRole('link', { name: /Back to the lesson/ }));
    await screen.findByRole('heading', { name: /^Time & Work/, level: 1 });

    await user.click(screen.getByRole('button', { name: /Revision/ }));
    await user.click(screen.getByRole('button', { name: /Mark as Completed/ }));
    expect(lessonProgress('quant', 'time_work').completed).toBe(true);
    expect(screen.getByText('Completed')).toBeInTheDocument();
  }, 20000);

  it('an expanded non-Time & Work Math lesson uses the guided sections and bookmarks', async () => {
    const { user } = renderAt('/learn/math/algebra');
    expect(await screen.findByRole('heading', { name: /^Algebra/, level: 1 })).toBeInTheDocument();
    expect(screen.getByText('Section 1 of 8')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Solved Examples/ }));
    expect(screen.getAllByText(/Solve: x \+/)).toHaveLength(10);
    await user.click(screen.getAllByRole('button', { name: /Save/ })[0]);
    expect(lessonProgress('quant', 'algebra').bookmarks).toContain('example-1');

    await user.click(screen.getByRole('button', { name: /Problem-Solving Strategy/ }));
    expect(screen.getByText('Undo operations in reverse order')).toBeInTheDocument();
    expect(lessonProgress('quant', 'algebra').section).toBe('strategy');
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
    expect(levelProgress('quant', 'percentage', 'beginner')).toEqual({
      seen: ['q1', 'q2'],
      fingerprints: [],
      patterns: [],
      best: { correct: 1, total: 2 },
    });

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
    // The server only marks questions listed in the token it issued with the quiz.
    expect(source.checkLearnQuiz.mock.calls[0][0].quizToken).toMatch(/^token-\d+$/);
  });

  it('a level that borrows easier questions says so, and Hard-bank review shows syllabus scope', async () => {
    const source = stubSource();
    const make = source.createLearnQuiz;
    source.createLearnQuiz = vi.fn(async (args) => {
      const quiz = await make(args);
      return {
        ...quiz,
        borrowed: true,
        questions: quiz.questions.map((q) => ({ ...q, patternName: t('Election with invalid votes', 'অবৈধ ভোটসহ নির্বাচন'), inClerkshipSyllabus: false })),
      };
    });
    const { user } = renderAt('/learn/math/percentage/quiz/intermediate', source);
    expect(await screen.findByText(/also includes questions from the level below/)).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: /right 1/ }));
    await user.click(screen.getByRole('button', { name: /Next/ }));
    await user.click(screen.getByRole('radio', { name: /right 2/ }));
    await user.click(screen.getByRole('button', { name: /Finish and see answers/ }));
    expect(await screen.findByText('You got 2 out of 2 right')).toBeInTheDocument();
    expect(screen.getAllByText('Election with invalid votes').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Not in the WBPSC Clerkship syllabus').length).toBe(2);
  });

  it('an Advanced Hard bank that is not ready shows a clear message, not easier questions', async () => {
    const source = stubSource();
    source.createLearnQuiz = vi.fn(async () => {
      throw new ApiError(422, 'HARD_POOL_NOT_READY', 'not ready');
    });
    renderAt('/learn/math/percentage/quiz/advanced', source);
    expect(await screen.findByText(/Advanced question bank for this chapter is still being prepared/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Back to the chapter/ })).toHaveAttribute('href', '/learn/math/percentage');
    expect(screen.queryByText('Question number 1?')).toBeNull();
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

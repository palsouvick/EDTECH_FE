import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../App';
import { DataSourceProvider } from '../app/DataSourceContext';
import { AuthProvider } from '../app/AuthContext';
import { createFixtureDataSource } from '../lib/dataSource';
import { clearResourceCache } from '../hooks/useResource';
import { languageStore } from '../hooks/useLanguagePreference';
import { recordQuiz, updateLessonProgress } from '../lib/learnProgress';
import { band, journeyStage, ladderFor, pyqDone, repairTopics } from '../lib/ladder';

const t = (en, bn) => ({ en, bn });
const facts = (over = {}) => ({
  lessonStarted: false,
  cleared: { beginner: false, intermediate: false, advanced: false },
  best: {},
  masteryStatus: null,
  pyq: null,
  ...over,
});
const statuses = (l) => Object.fromEntries(l.steps.map((s) => [s.key, s.status]));

describe('ladder logic', () => {
  it('opens one level at a time, from the progress the app already keeps', () => {
    expect(statuses(ladderFor(facts()))).toEqual({ beginner: 'open', easy: 'locked', competitive: 'locked', advanced: 'locked', exam: 'locked', pyq: 'locked' });
    const mid = ladderFor(facts({ lessonStarted: true, cleared: { beginner: true, intermediate: false, advanced: false } }));
    expect(mid.current).toBe('competitive');
    expect(mid.level).toBe(3);
    const top = ladderFor(facts({ lessonStarted: true, cleared: { beginner: true, intermediate: true, advanced: true }, masteryStatus: 'strong', pyq: { total: 30, attempted: 10, solved: 7 } }));
    expect(top.current).toBeNull();
    expect(top.level).toBe(7);
  });

  it('a chapter with no past-paper questions has no PYQ level to do', () => {
    const l = ladderFor(facts({ pyq: { total: 0, attempted: 0, solved: 0 } }));
    expect(l.steps.at(-1).status).toBe('none');
  });

  it('PYQ level: 10 answered (or all, if fewer) and 60% solved', () => {
    expect(pyqDone({ total: 30, attempted: 9, solved: 9 })).toBe(false);
    expect(pyqDone({ total: 30, attempted: 10, solved: 6 })).toBe(true);
    expect(pyqDone({ total: 30, attempted: 10, solved: 5 })).toBe(false);
    expect(pyqDone({ total: 4, attempted: 4, solved: 3 })).toBe(true);
    expect(pyqDone(null)).toBe(false);
  });

  it('journey stages need most chapters at a level', () => {
    const at = (cleared) => ladderFor(facts({ lessonStarted: true, cleared }));
    const none = ladderFor(facts());
    const easy = at({ beginner: true, intermediate: false, advanced: false });
    expect(journeyStage([none, none]).stage).toBe('beginner');
    expect(journeyStage([ladderFor(facts({ lessonStarted: true })), none]).stage).toBe('foundation');
    expect(journeyStage([easy, none, none]).stage).toBe('foundation', 'one chapter in three is not "most"');
    expect(journeyStage([easy, easy, none]).stage).toBe('concepts');
  });

  it('accuracy bands need 5 answers; repair sets need 3 mistakes in 7 days', () => {
    expect(band({ recentAnswers: 4, accuracyPct: 20 })).toBeNull();
    expect(band({ recentAnswers: 10, accuracyPct: 80 })).toBe('good');
    expect(band({ recentAnswers: 10, accuracyPct: 60 })).toBe('fair');
    expect(band({ recentAnswers: 10, accuracyPct: 45 })).toBe('weak');
    const now = Date.UTC(2026, 10, 10);
    const item = (topic, daysAgo) => ({ lastWrongAt: new Date(now - daysAgo * 86_400_000).toISOString(), topicName: t(topic, topic), question: { topic } });
    expect(repairTopics([item('time_work', 1), item('time_work', 2), item('time_work', 6), item('ages', 1), item('time_work', 9)], { now }))
      .toEqual([{ topic: 'time_work', name: t('time_work', 'time_work'), count: 3 }]);
  });
});

const lesson = {
  subject: 'quant',
  topic: 'percentage',
  title: t('Percentage', 'শতকরা'),
  emoji: '💯',
  intro: t('How many out of 100.', '১০০-র মধ্যে কত।'),
  levels: ['basic', 'intermediate', 'advanced'].map((level) => ({
    level,
    sections: [{ heading: t(`${level} idea`, `${level} ধারণা`), body: t('Body', 'বিবরণ') }],
    examples: [{ question: t(`${level}: What is 10% of 500?`, '৫০০-র ১০% কত?'), steps: [t('500 ÷ 10', '৫০০ ÷ ১০')], answer: t('50', '৫০') }],
  })),
  rules: [{ label: t('Percent of a number', 'সংখ্যার শতকরা'), latex: 'x\\% \\text{ of } N = \\frac{x}{100} N', explain: t('Multiply by x/100.', 'x/100 দিয়ে গুণ।') }],
  tips: [t('Always ask: percent of what?', 'সবসময় জিজ্ঞাসা করো: কিসের শতকরা?')],
};
const chapter = {
  subject: { code: 'quant' },
  topic: 'percentage',
  title: t('Percentage', 'শতকরা'),
  lesson,
  levels: [
    { level: 'beginner', count: 30, questionCount: 10, timed: false },
    { level: 'intermediate', count: 30, questionCount: 10, timed: false },
    { level: 'advanced', count: 12, questionCount: 10, timed: true, timeLimitSec: 600 },
  ],
  previous: null,
  next: null,
};

function renderAt(path, overrides = {}, { signedIn = false } = {}) {
  const source = {
    ...createFixtureDataSource({ latencyMs: 0 }),
    getLearnChapter: vi.fn(async () => chapter),
    getLearnSubject: vi.fn(async () => ({
      subject: { code: 'quant', title: t('Math', 'গণিত'), emoji: '🔢' },
      chapters: [
        { topic: 'percentage', title: t('Percentage', 'শতকরা'), emoji: '💯', intro: null, hasLesson: true, levels: chapter.levels },
        { topic: 'time_work', title: t('Time & Work', 'সময় ও কাজ'), emoji: '⏱', intro: null, hasLesson: true, levels: chapter.levels },
      ],
    })),
    getPriorities: vi.fn(async () => ({ paperCount: 10, rule: {}, subjects: {} })),
    getMe: vi.fn(async () => ({ user: signedIn ? { id: 'u1', name: 'Asha', email: 'a@example.com' } : null })),
    getInsights: vi.fn(async () => ({ mastery: [
      { subject: 'quant', topic: 'percentage', status: 'improving', accuracyPct: 85, recentAnswers: 20, name: t('Percentage', 'শতকরা') },
      { subject: 'quant', topic: 'time_work', status: 'weak', accuracyPct: 45, recentAnswers: 12, name: t('Time & Work', 'সময় ও কাজ') },
    ] })),
    getPyqProgress: vi.fn(async () => ({ subject: 'quant', topics: { percentage: { total: 15, attempted: 3, solved: 2 } } })),
    getMistakes: vi.fn(async () => ({ items: [] })),
    ...overrides,
  };
  const user = userEvent.setup();
  render(
    <DataSourceProvider source={source}>
      <AuthProvider>
        <MemoryRouter initialEntries={[path]}>
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
  localStorage.clear();
});

describe('chapter page: ladder and modes', () => {
  it('shows the six levels from existing progress; locked levels can still be opened', async () => {
    updateLessonProgress('quant', 'percentage', { section: 'examples' });
    recordQuiz('quant', 'percentage', 'beginner', { questionIds: ['a'], correct: 8, total: 10 });
    renderAt('/learn/math/percentage');
    const ladder = (await screen.findByRole('heading', { name: /^Your ladder in this chapter/ })).closest('section');
    const items = within(ladder).getAllByRole('listitem');
    expect(items).toHaveLength(6);
    expect(items[0]).toHaveTextContent('Done');
    expect(items[1]).toHaveTextContent('Best 8/10');
    expect(items[2]).toHaveAttribute('aria-current', 'step');
    expect(within(items[2]).getByRole('link', { name: /Intermediate quiz/ })).toHaveAttribute('href', '/learn/math/percentage/quiz/intermediate');
    expect(items[3]).toHaveTextContent('Locked');
    expect(within(items[3]).getByRole('link', { name: /Advanced quiz/ })).toBeInTheDocument();
    expect(items[5]).toHaveTextContent('Sign in so this level can be counted');
  });

  it('Detailed is the existing page; Revision shows rules, tips and (signed out) a sign-in note', async () => {
    const { user } = renderAt('/learn/math/percentage');
    expect(await screen.findByRole('tab', { name: /^Detailed/, selected: true })).toBeInTheDocument();
    expect(screen.getAllByText(/basic idea/).length).toBeGreaterThan(0);
    await user.click(screen.getByRole('tab', { name: /^Revision/ }));
    expect(screen.getByText('Percent of a number')).toBeInTheDocument();
    expect(screen.getByText('Always ask: percent of what?')).toBeInTheDocument();
    expect(screen.getByText(/Sign in to see your own mistakes/)).toBeInTheDocument();
    expect(screen.queryByText(/basic idea/)).not.toBeInTheDocument();
  });

  it('Quick mode: one worked example, then questions; Exam mode offers a timed test', async () => {
    const { user } = renderAt('/learn/math/percentage?mode=quick');
    expect(await screen.findByText('basic: What is 10% of 500?')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^Now try 5 questions/ })).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: /^Exam/ }));
    expect(screen.getByRole('button', { name: /Set up the timed test/ })).toBeInTheDocument();
  });

  it('signed in: PYQ progress and mastery fill the ladder', async () => {
    renderAt('/learn/math/percentage', {}, { signedIn: true });
    expect(await screen.findByText('2 solved · 3 of 15 answered')).toBeInTheDocument();
    const pyqLink = screen.getByRole('link', { name: /Past-paper questions/ });
    expect(pyqLink).toHaveAttribute('href', '/pyq?subject=quant&topic=percentage');
  });
});

describe('subject page: journey and weakness coach', () => {
  it('signed in: accuracy per chapter, the weakest with a prescription, and the next chapter', async () => {
    renderAt('/learn/math', {}, { signedIn: true });
    const coach = (await screen.findByRole('heading', { name: /^Where you stand/ })).closest('section');
    expect(await within(coach).findByText('Your weakest chapter is Time & Work.')).toBeInTheDocument();
    expect(within(coach).getByRole('link', { name: /Revise \(20 min\)/ })).toHaveAttribute('href', '/learn/math/time-work?mode=revision');
    expect(within(coach).getByText(/85%/)).toBeInTheDocument();
    const journey = screen.getByRole('heading', { name: /^From zero to exam ready/ }).closest('section');
    expect(within(journey).getByText('🌱 Beginner', { selector: 'strong span' })).toBeInTheDocument();
    expect(within(journey).getByRole('link', { name: /Study next.*Percentage/s })).toHaveAttribute('href', '/learn/math/percentage');
  });

  it('a chapter with 3 mistakes this week gets a repair set', async () => {
    const recent = new Date().toISOString();
    const items = [1, 2, 3].map(() => ({ lastWrongAt: recent, topicName: t('Time & Work', 'সময় ও কাজ'), question: { topic: 'time_work' } }));
    renderAt('/learn/math', { getMistakes: vi.fn(async () => ({ items })) }, { signedIn: true });
    expect(await screen.findByText('3 mistakes in Time & Work this week: practise 10 more questions there.')).toBeInTheDocument();
  });

  it('signed out: a sign-in note instead of accuracy', async () => {
    renderAt('/learn/math');
    expect(await screen.findByText(/Sign in to see your accuracy in every chapter/)).toBeInTheDocument();
  });
});

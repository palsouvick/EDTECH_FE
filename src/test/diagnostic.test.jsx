import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../App';
import { AuthProvider } from '../app/AuthContext';
import { DataSourceProvider } from '../app/DataSourceContext';
import { createFixtureDataSource } from '../lib/dataSource';
import { clearResourceCache } from '../hooks/useResource';
import { languageStore } from '../hooks/useLanguagePreference';

const t = (en, bn) => ({ en, bn });

const preview = {
  totalQuestions: 35,
  minutes: 26,
  basis: 'pattern',
  basisNote: t('Sections and question counts follow the official paper pattern of this exam.', 'বিভাগ'),
  sections: [
    { key: 's1', title: t('English', 'ইংরেজি'), subject: 'english', questions: 11 },
    { key: 's2', title: t('General Studies', 'সাধারণ জ্ঞান'), subject: 'gs', questions: 14 },
    { key: 's3', title: t('Arithmetic', 'পাটিগণিত'), subject: 'quant', questions: 10 },
  ],
};
const exam = { code: 'WBPSC_CLERKSHIP', name: t('Clerkship', 'ক্লার্কশিপ') };

const q = (id, subject, topic, level) => ({
  questionId: id,
  seq: 1,
  subject,
  topic,
  diagnostic: true,
  level,
  difficulty: level === 'easy' ? 1 : 3,
  stem: t(`Stem ${id}`, `প্রশ্ন ${id}`),
  options: ['a', 'b', 'c', 'd'].map((k) => ({ optionId: `opt_${id}${k}0`, text: t(`Option ${id}${k}`, `${k}`) })),
  pyq: [],
});
const test0 = {
  exam,
  label: 'DIAGNOSTIC',
  totalQuestions: 2,
  minutes: 2,
  timed: false,
  negativeMarking: 0,
  basis: 'pattern',
  notes: [],
  shortBlocks: [],
  sections: [
    { key: 's2', title: t('General Studies', 'সাধারণ জ্ঞান'), subject: 'gs', questions: [q('aaaa', 'gs', 'polity', 'easy')] },
    { key: 's3', title: t('Arithmetic', 'পাটিগণিত'), subject: 'quant', questions: [q('bbbb', 'quant', 'percentage', 'medium')] },
  ],
  testToken: 'signed.token',
};
const row = (subject, topic, name, correct, total, attempted) => ({
  subject, topic, name: t(name, name), total, attempted, unattempted: total - attempted, correct, wrong: attempted - correct,
  accuracy: attempted ? Math.round((correct / attempted) * 100) : null, score: Math.round((correct / total) * 100),
});
const result = {
  takenAt: '2026-11-19T06:00:00.000Z',
  attempts: 1,
  basis: 'pattern',
  startingMastery: 40,
  level: 'build_up',
  summary: { total: 2, attempted: 1, unattempted: 1, correct: 1, wrong: 0, accuracy: 100, score: 50 },
  sections: [],
  subjects: [
    { ...row('gs', null, 'GS', 1, 1, 1), subject: 'gs' },
    { ...row('quant', null, 'Maths', 0, 1, 0), subject: 'quant' },
  ],
  topics: [row('gs', 'polity', 'Polity', 1, 1, 1), row('quant', 'percentage', 'Percentage', 0, 1, 0)],
  weakTopics: [{ subject: 'quant', topic: 'percentage', name: t('Percentage', 'শতকরা'), total: 2, attempted: 0, correct: 0, score: 0 }],
  strongTopics: [{ subject: 'gs', topic: 'polity', name: t('Polity', 'রাষ্ট্রবিজ্ঞান'), total: 2, attempted: 2, correct: 2, score: 100 }],
  signal: { active: true, until: '2026-12-19T06:00:00.000Z', note: t('This is a starting signal from one short test, not a verdict.', 'সংকেত') },
};

function stubSource({ state = 'none', targetExam = { code: 'WBPSC_CLERKSHIP', date: null } } = {}) {
  let status = targetExam
    ? { exam, state, offer: state === 'none', preview, result: state === 'completed' ? result : null }
    : { exam: null, state: 'no_target', offer: false, preview: null, result: null };
  return {
    ...createFixtureDataSource({ latencyMs: 0 }),
    getMe: vi.fn(async () => ({ user: { id: 'u1', name: 'Riya Sen', email: 'riya@example.com', targetExam } })),
    getDiagnostic: vi.fn(async () => status),
    skipDiagnostic: vi.fn(async () => {
      status = { ...status, state: 'skipped', offer: false };
      return status;
    }),
    startDiagnostic: vi.fn(async () => test0),
    submitDiagnostic: vi.fn(async () => ({
      exam,
      result,
      results: [
        { questionId: 'aaaa', selectedOptionId: 'opt_aaaaa0', isCorrect: true, correctOptionId: 'opt_aaaaa0', steps: [] },
        { questionId: 'bbbb', selectedOptionId: null, isCorrect: false, correctOptionId: 'opt_bbbba0', steps: [t('Because.', 'কারণ')] },
      ],
    })),
    getTargetExamSyllabus: vi.fn(async () => { throw new Error('not needed'); }),
    getToday: vi.fn(async () => ({ date: '2026-11-19', exam: null, plan: null, items: [], totalMinutes: 0, budgetMinutes: null, trimmedCount: 0, primary: null, startingSignal: null })),
  };
}

function Location() {
  const l = useLocation();
  return <output data-testid="path">{`${l.pathname}${l.search}`}</output>;
}

function renderAt(at, source) {
  const user = userEvent.setup();
  render(
    <DataSourceProvider source={source}>
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

describe('Find My Starting Level (F7)', () => {
  it('intro shows the exam’s own sections and the honesty rules; "Not now" is remembered', async () => {
    const source = stubSource();
    const user = renderAt('/starting-level', source);
    await screen.findByText(/35 easy-to-medium questions/);
    expect(screen.getByText('General Studies')).toBeInTheDocument();
    expect(screen.getByText('14 questions')).toBeInTheDocument();
    expect(screen.getByText(/not previous-year questions/)).toBeInTheDocument();
    expect(screen.getByText(/do not count in your practice stats/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Not now/ }));
    expect(source.skipDiagnostic).toHaveBeenCalledTimes(1);
    await screen.findByText(/take it any time from your syllabus page/);
    // Still possible after skipping.
    expect(screen.getByRole('button', { name: /Start the check/ })).toBeInTheDocument();
  });

  it('runs easy→medium diagnostic questions, sends skipped ones as unanswered, and shows a starting signal', async () => {
    const source = stubSource();
    const user = renderAt('/starting-level', source);
    await user.click(await screen.findByRole('button', { name: /Start the check/ }));

    await screen.findByText('Stem aaaa');
    expect(screen.getByText('Diagnostic question')).toBeInTheDocument();
    expect(screen.getByText('Easy')).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: /Option aaaaa/ }));
    await user.click(screen.getByRole('button', { name: /^Next/ }));
    await screen.findByText('Stem bbbb');
    expect(screen.getByText('Medium')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^Submit/ }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /Yes, submit/ }));

    expect(source.submitDiagnostic).toHaveBeenCalledWith({
      testToken: 'signed.token',
      answers: [
        expect.objectContaining({ questionId: 'aaaa', selectedOptionId: 'opt_aaaaa0' }),
        expect.objectContaining({ questionId: 'bbbb', selectedOptionId: null }),
      ],
    });
    expect((await screen.findByTestId('starting-mastery')).textContent).toBe('40%');
    expect(screen.getByText(/You have a base to build on/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Percentage/ })).toHaveAttribute('href', '/learn/math/percentage');
    expect(screen.getByText('Already looking solid')).toBeInTheDocument();
    expect(screen.getByText('A starting signal, not a verdict')).toBeInTheDocument();
    // "Start here" wording, never "weak".
    expect(screen.queryByText(/weak/i)).not.toBeInTheDocument();
  });

  it('home offers the check once for the target exam; "Not now" hides it', async () => {
    const source = stubSource();
    const user = renderAt('/', source);
    const offer = await screen.findByRole('heading', { name: /Find My Starting Level/ });
    const card = offer.closest('section');
    expect(within(card).getByRole('link', { name: /Start the check/ })).toHaveAttribute('href', '/starting-level');
    await user.click(within(card).getByRole('button', { name: /Not now/ }));
    expect(source.skipDiagnostic).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('heading', { name: /Find My Starting Level/ })).not.toBeInTheDocument();
  });

  it('no offer on home once skipped or completed; completed opens straight on the result', async () => {
    renderAt('/', stubSource({ state: 'skipped' }));
    await screen.findByRole('heading', { name: /Today/ });
    expect(screen.queryByRole('heading', { name: /Find My Starting Level/ })).not.toBeInTheDocument();
  });

  it('completed result is shown on the page', async () => {
    renderAt('/starting-level', stubSource({ state: 'completed' }));
    expect((await screen.findByTestId('starting-mastery')).textContent).toBe('40%');
    expect(screen.getByText('Taken on 2026-11-19')).toBeInTheDocument();
  });

  it('without a target exam it asks to choose one first', async () => {
    renderAt('/starting-level', stubSource({ targetExam: null }));
    await screen.findByText(/Choose your target exam first/);
    expect(screen.getByRole('link', { name: /Choose your exam/ })).toHaveAttribute('href', '/choose-exam?next=/starting-level');
  });
});

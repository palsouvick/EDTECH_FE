import 'fake-indexeddb/auto';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../App';
import { DataSourceProvider } from '../app/DataSourceContext';
import { createFixtureDataSource } from '../lib/dataSource';
import { clearResourceCache } from '../hooks/useResource';
import { languageStore } from '../hooks/useLanguagePreference';
import { examStore } from '../lib/examStore';
import { createExamState } from '../features/mock/mockExamReducer';
import MockTestEngine from '../components/mock/MockTestEngine';

// jsdom has no IntersectionObserver, which makes the Practice Arena look permanently
// on screen and hide the hub's CTA bar. Model a page scrolled to the top instead.
globalThis.IntersectionObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const source = createFixtureDataSource({ latencyMs: 0 });

function Location() {
  return <output data-testid="path">{useLocation().pathname}</output>;
}

function renderApp(path) {
  return render(
    <DataSourceProvider source={source}>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
        <Location />
      </MemoryRouter>
    </DataSourceProvider>,
  );
}

const path = () => screen.getByTestId('path').textContent;
const palette = () => within(screen.getByRole('complementary', { name: 'Question palette' }));
const paletteStatus = (n) => palette().getByRole('button', { name: new RegExp(`^${n}: `) }).dataset.status;

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  clearResourceCache();
  act(() => languageStore.set('en'));
});

describe('mock test (CBT) flow', () => {
  it('setup -> answer -> refresh restores everything -> submit -> result', async () => {
    const user = userEvent.setup();
    const first = renderApp('/exams/ssc/quant/profit-loss');

    await user.click(await screen.findByRole('radio', { name: /Timed Mock Test/ }));
    await user.click(screen.getByRole('button', { name: /Launch mock test/ }));
    const setup = await screen.findByRole('dialog', { name: /Set up your mock test/ });
    await user.click(within(setup).getByRole('radio', { name: '10' }));
    await user.click(within(setup).getByRole('radio', { name: /বাংলা/ }));
    await user.click(within(setup).getByRole('button', { name: /Start test/ }));

    await waitFor(() => expect(path()).toMatch(/^\/mock\/[a-f\d]{24}$/));
    const mockPath = path();
    await screen.findByText(/Question 1 of 10/);
    expect(screen.queryByText('আপনার পরীক্ষা পুনরুদ্ধার হয়েছে।')).toBeNull(); // a new test is not 'restored'
    expect(screen.getByText(/SSC · লাভ, ক্ষতি ও ছাড় · মক টেস্ট/)).toBeInTheDocument();
    expect(document.documentElement.dataset.uiLang).toBe('bn'); // chosen language applied
    expect(screen.getByRole('timer')).toHaveTextContent(/00:(10:00|09:5\d)/);

    // Q1: answer B; Q2: mark without answering; Q3: choose but leave via the palette (discarded).
    await user.keyboard('b{Enter}');
    await screen.findByText(/Question 2 of 10/);
    await user.keyboard('m');
    await screen.findByText(/Question 3 of 10/);
    await user.keyboard('a');
    await user.click(palette().getByRole('button', { name: /^5: / }));
    await screen.findByText(/Question 5 of 10/);

    const expected = { 1: 'ANSWERED', 2: 'MARKED', 3: 'NOT_ANSWERED', 4: 'NOT_VISITED', 5: 'NOT_ANSWERED' };
    for (const [n, s] of Object.entries(expected)) expect(paletteStatus(n)).toBe(s);

    // Accidental refresh: throw the whole tree away and load the URL again.
    await new Promise((r) => setTimeout(r, 400)); // let the debounced IndexedDB write land
    first.unmount();
    renderApp(mockPath);
    await screen.findByText(/Question 5 of 10/);
    for (const [n, s] of Object.entries(expected)) expect(paletteStatus(n)).toBe(s);
    expect(screen.getAllByText('আপনার পরীক্ষা পুনরুদ্ধার হয়েছে।').length).toBeGreaterThan(0); // announced in the paper's language

    await user.click(screen.getAllByRole('button', { name: /^Submit/ })[0]);
    const confirm = await screen.findByRole('dialog', { name: /Submit the test/ });
    expect(confirm).toHaveTextContent('Answered');
    await user.click(within(confirm).getByRole('button', { name: /^Submit/ }));

    await screen.findByText('Performance analysis', {}, { timeout: 5000 }); // the analytics dashboard
    expect(screen.getByText(/\/ 10/)).toBeInTheDocument(); // score out of 10
    expect(await examStore.get(mockPath.split('/').pop())).toBeNull(); // local copy cleared after submit
    expect(Object.keys(localStorage).some((k) => k.includes('edtech:timer:mock:'))).toBe(false);
  }, 30_000);

  async function startEngine(overrides, questionCount = 2) {
    const session = await source.createMock({
      category: 'SSC', subject: 'quant', topicIds: ['profit_loss'], questionCount: 10, language: 'en',
      timeLimitMinutes: 10, markingScheme: { positive: 1, negative: 0.25 }, ...overrides.create,
    });
    const exam = createExamState(session, { examName: { en: 'Test' } });
    exam.questions = exam.questions.slice(0, questionCount);
    exam.entries = exam.entries.slice(0, questionCount);
    Object.assign(exam.config, overrides.config);
    render(
      <MemoryRouter>
        <MockTestEngine initialState={exam} source={source} />
      </MemoryRouter>,
    );
    return exam;
  }

  it('overall timer: auto-submits at 00:00:00', async () => {
    await startEngine({ create: { allowPause: true }, config: { durationSec: 1 } });
    expect(screen.getByRole('timer')).toHaveAttribute('data-low-time', 'true'); // red under 5 minutes
    await screen.findByText('Performance analysis', {}, { timeout: 6000 });
  }, 10_000);

  it('per-question timer: each question locks when its time is up, then the test submits', async () => {
    await startEngine({ create: { perQuestionTimer: true, perQuestionSeconds: 10, timeLimitMinutes: undefined }, config: { perQuestionSec: 1 } });
    expect(screen.queryByRole('button', { name: /Mark for Review/ })).toBeNull(); // linear test
    await screen.findByText(/Question 2 of 2/, {}, { timeout: 3000 });
    expect(paletteStatus(1)).toBe('NOT_ANSWERED');
    expect(palette().getByRole('button', { name: /^1: .*locked/ })).toBeDisabled();
    await screen.findByText('Performance analysis', {}, { timeout: 6000 });
  }, 10_000);

  it('time spent on a question is not lost when submitting right away', async () => {
    // Regression: buffered time (flushed every 5 s) used to be dropped on submit.
    const user = userEvent.setup();
    const submitMock = vi.spyOn(source, 'submitMock');
    await startEngine({ create: {} });
    await new Promise((r) => setTimeout(r, 1500));
    await user.click(screen.getAllByRole('button', { name: /^Submit/ })[0]);
    await user.click(within(await screen.findByRole('dialog', { name: /Submit the test/ })).getByRole('button', { name: /^Submit/ }));
    await waitFor(() => expect(submitMock).toHaveBeenCalled());
    expect(submitMock.mock.calls[0][0].responses[0].timeSpentSec).toBeGreaterThanOrEqual(1.2);
    submitMock.mockRestore();
  }, 10_000);

  it('pause hides the question and stops the clock', async () => {
    const user = userEvent.setup();
    await startEngine({ create: { allowPause: true } });
    await user.click(screen.getByRole('button', { name: /^Pause/ }));
    expect(screen.getByRole('heading', { name: /Test paused/ })).toBeInTheDocument();
    expect(document.getElementById('mock-stem')).toBeNull(); // question content is not in the DOM
    const t = screen.getByRole('timer').textContent;
    await new Promise((r) => setTimeout(r, 1200));
    expect(screen.getByRole('timer').textContent).toBe(t);
    await user.click(screen.getAllByRole('button', { name: /^Resume/ })[0]);
    expect(screen.getByText(/Question 1 of 2/)).toBeInTheDocument();
  }, 10_000);
});

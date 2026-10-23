import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PracticeArena from '../components/practice/PracticeArena';
import { practiceBank } from '../fixtures/practiceQuestions';
import { createFixturePracticeSource } from '../lib/practiceSource';
import { progressStore } from '../hooks/useStudyProgress';
import { languageStore } from '../hooks/useLanguagePreference';

const TOPIC = { en: 'Profit, Loss & Discount', bn: 'লাভ, ক্ষতি ও ছাড়' };

const options = () => [...document.querySelectorAll('[data-arena-option]')];
const statuses = () => options().map((o) => o.dataset.status);
const currentId = () => document.querySelector('article[aria-labelledby]').getAttribute('aria-labelledby').replace('arena-stem-', '');
const bankEntry = () => practiceBank.find((q) => q.questionId === currentId());
const correctIndex = () => bankEntry().options.findIndex((o) => o.optionId === bankEntry().correctOptionId);
const checkButton = () => screen.getByRole('button', { name: /Check answer/ });
// The verdict heading (the live region repeats the word for screen readers).
const verdict = (text) => screen.findByRole('heading', { name: new RegExp(text) });

function setup(sourceOverrides = {}) {
  const source = { ...createFixturePracticeSource(practiceBank, { latencyMs: 0 }), ...sourceOverrides };
  const onLaunchMock = vi.fn();
  const user = userEvent.setup();
  render(<PracticeArena source={source} topicName={TOPIC} onLaunchMock={onLaunchMock} />);
  return { user, onLaunchMock, source };
}

beforeEach(() => {
  localStorage.clear();
  act(() => {
    progressStore.reload();
    languageStore.set('en');
  });
});

describe('PracticeArena', () => {
  it('select -> check -> correct: green, celebration, bilingual steps, progress', async () => {
    const { user } = setup();
    await screen.findByText(practiceBank[0].stem.en);
    expect(screen.getByText(practiceBank[0].stem.bn)).toBeInTheDocument(); // both scripts rendered, CSS picks one
    expect(screen.getByText('SSC CGL 2023 Tier 1')).toBeInTheDocument();
    expect(checkButton()).toBeDisabled();

    await user.keyboard('b');
    expect(statuses()).toEqual(['idle', 'selected', 'idle', 'idle']);
    expect(checkButton()).toBeEnabled();

    await user.keyboard('{Enter}');
    await verdict('Correct!');
    expect(statuses()).toEqual(['dimmed', 'correct', 'dimmed', 'dimmed']);
    expect(document.querySelectorAll('.arena-burst-particle')).toHaveLength(10);
    expect(screen.getByText('60% of students got this right')).toBeInTheDocument();

    const steps = screen.getByRole('heading', { name: /Step-by-step solution/ }).closest('div').querySelectorAll('li');
    expect(steps).toHaveLength(4);
    expect(steps[0]).toHaveTextContent('Let the cost price (CP) be ₹100.');
    expect(steps[0]).toHaveTextContent('ধরি, ক্রয়মূল্য (CP) = ₹100।');

    expect(screen.getByText('1/20 Completed')).toBeInTheDocument();
    expect(screen.getByText('100% Accuracy')).toBeInTheDocument();
    expect(progressStore.get().attemptedToday).toBe(1); // feeds the hub's "today" ring
  });

  it('wrong answer: red pick, soft-green correct option, trap breakdown first', async () => {
    const { user } = setup();
    await screen.findByText(practiceBank[0].stem.en);
    await user.keyboard('4'); // 20%: the classic trap
    await user.click(checkButton());

    await verdict('Not quite');
    expect(statuses()).toEqual(['dimmed', 'answer', 'dimmed', 'wrong']);
    const mistake = screen.getByRole('heading', { name: /Where you made the mistake/ }).parentElement;
    expect(mistake).toHaveTextContent('Subtracting directly (40 − 20 = 20%)');
    expect(mistake).toHaveTextContent('ধার্যমূল্যের');
    expect(screen.getByText('0% Accuracy')).toBeInTheDocument();
  });

  it('options lock after checking; arrow keys move selection and focus', async () => {
    const { user } = setup();
    await screen.findByText(practiceBank[0].stem.en);
    options()[0].focus();
    await user.keyboard('{ArrowDown}{ArrowDown}');
    expect(statuses()[2]).toBe('selected');
    expect(options()[2]).toHaveFocus();

    await user.keyboard('{Enter}');
    await verdict('Not quite');
    await user.click(options()[1]);
    await user.keyboard('a');
    expect(statuses()).toEqual(['dimmed', 'answer', 'wrong', 'dimmed']);
  });

  it('bookmark toggles optimistically and persists; S is the shortcut', async () => {
    const { user } = setup();
    await screen.findByText(practiceBank[0].stem.en);
    const btn = screen.getByRole('button', { name: /Bookmark for revision/ });
    await user.click(btn);
    expect(btn).toHaveAttribute('aria-pressed', 'true');
    await waitFor(() => expect(JSON.parse(localStorage.getItem('edtech:fixture-bookmarks'))).toEqual([practiceBank[0].questionId]));

    await user.keyboard('s');
    expect(btn).toHaveAttribute('aria-pressed', 'false');
  });

  it('bookmark failure rolls back and tells the student', async () => {
    const { user } = setup({ setBookmark: () => Promise.reject(new Error('401')) });
    await screen.findByText(practiceBank[0].stem.en);
    const btn = screen.getByRole('button', { name: /Bookmark for revision/ });
    await user.click(btn);
    await screen.findByText("Couldn't update the bookmark.");
    expect(btn).toHaveAttribute('aria-pressed', 'false');
  });

  it('a failed check keeps the selection and can be retried', async () => {
    let fail = true;
    const base = createFixturePracticeSource(practiceBank, { latencyMs: 0 });
    const { user } = setup({ verify: (b) => (fail ? ((fail = false), Promise.reject(new Error('net'))) : base.verify(b)) });
    await screen.findByText(practiceBank[0].stem.en);
    await user.keyboard('b{Enter}');
    await screen.findByText("Couldn't check your answer. Try again.");
    expect(statuses()[1]).toBe('selected');
    await user.click(checkButton());
    await verdict('Correct!');
  });

  it('report error: pick a reason, send, see confirmation', async () => {
    const report = vi.fn().mockResolvedValue({ duplicate: false });
    const { user } = setup({ report });
    await screen.findByText(practiceBank[0].stem.en);
    await user.click(screen.getByRole('button', { name: /Report error/ }));
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('radio', { name: /Translation doesn't match/ }));
    await user.type(within(dialog).getByRole('textbox'), 'বাংলা বিকল্প ভুল');
    await user.click(within(dialog).getByRole('button', { name: /Send report/ }));
    await within(dialog).findByText('Thanks. Our editors will review it.');
    expect(report).toHaveBeenCalledWith({
      questionId: practiceBank[0].questionId,
      language: 'en',
      reason: 'TRANSLATION',
      message: 'বাংলা বিকল্প ভুল',
    });
    // Shortcuts are off while a dialog is open.
    await user.keyboard('c');
    expect(statuses()[2]).toBe('idle');
  });

  it('infinite flow: pages load ahead, milestone at 10, timed-test offer, then the end', async () => {
    const fetchPage = vi.fn();
    const base = createFixturePracticeSource(practiceBank, { latencyMs: 0 });
    fetchPage.mockImplementation(base.fetchPage);
    const { user, onLaunchMock } = setup({ fetchPage });
    await screen.findByText(practiceBank[0].stem.en);

    for (let n = 1; n <= 10; n++) {
      // Q2 answered wrong, the rest right: 9/10.
      const pick = n === 2 ? (correctIndex() + 1) % options().length : correctIndex();
      await user.click(options()[pick]);
      await user.keyboard('{Enter}');
      await verdict(n === 2 ? 'Not quite' : 'Correct!');
      await user.keyboard('{Enter}');
      if (n < 10) await waitFor(() => expect(screen.getByText(`Question ${n + 1}`)).toBeInTheDocument());
    }

    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent("You've mastered 10 Profit, Loss & Discount problems: 9 correct.");
    expect(dialog).toHaveTextContent('আপনি 10টি লাভ, ক্ষতি ও ছাড় প্রশ্নে দক্ষতা দেখিয়েছেন: 9টি সঠিক।');
    expect(screen.getByText('10/20 Completed')).toBeInTheDocument();
    expect(screen.getByText('90% Accuracy')).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: /Take a 10-question timed test/ }));
    expect(onLaunchMock).toHaveBeenCalledWith({ questionCount: 10, timeLimitMinutes: 10 });
    expect(screen.queryByRole('dialog')).toBeNull();

    // 12 questions in pages of 5: the 3rd page was fetched ahead of need, never on demand.
    expect(fetchPage).toHaveBeenCalledTimes(3);
    expect(fetchPage.mock.calls.map(([a]) => a.cursor)).toEqual([null, '5', '10']);

    for (let n = 11; n <= 12; n++) {
      await user.click(options()[correctIndex()]);
      await user.keyboard('{Enter}');
      await verdict('Correct!');
      await user.keyboard('{Enter}');
    }
    await screen.findByText("You've finished every question in this topic");
    expect(progressStore.get().attemptedToday).toBe(12);
  }, 30_000); // 12 full question cycles with KaTeX in jsdom

  it('3-option questions render 3 choices and ignore the D/4 keys', async () => {
    const six = practiceBank.find((q) => q.options.length === 3);
    const source = createFixturePracticeSource([six], { latencyMs: 0 });
    const user = userEvent.setup();
    render(<PracticeArena source={source} topicName={TOPIC} />);
    await screen.findByText(six.stem.en);
    expect(options()).toHaveLength(3);
    await user.keyboard('d4');
    expect(statuses()).toEqual(['idle', 'idle', 'idle']);
  });
});

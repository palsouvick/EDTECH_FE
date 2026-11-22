import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { languageStore } from '../hooks/useLanguagePreference';
import { buildRequest, SPEED_COUNTS } from '../lib/customTest';
import { CT, reasonText, withNames } from '../lib/customTestCopy';
import { PRACTICE_TYPE } from '../lib/adaptiveCopy';
import HardQuizInsights from '../components/custom-test/HardQuizInsights';

const report = (extra = {}) => ({
  sessionId: 's1',
  subject: 'quant',
  custom: { preset: 'hard', topics: ['percentage'], mode: 'practice' },
  chapters: [{ topic: 'percentage', name: { en: 'Percentage', bn: 'শতকরা' }, accuracy: 70, total: 10 }],
  skills: [
    { skill: 'standard', correct: 2, total: 2, accuracy: 100, status: 'strong' },
    { skill: 'reverse', correct: 0, total: 2, accuracy: 0, status: 'weak' },
    { skill: 'trap', correct: 1, total: 2, accuracy: 50, status: 'ok' },
  ],
  nextStep: { action: 'harder_mix', topic: null },
  speed: null,
  ...extra,
});

function show(r, onRun = vi.fn()) {
  render(
    <MemoryRouter>
      <HardQuizInsights r={r} subject="quant" busy={null} onRun={onRun} reviseLink={(s, t) => `/learn/${s}/${t}`} />
    </MemoryRouter>,
  );
  return onRun;
}

beforeEach(() => languageStore.set('en'));

describe('Hard Quiz copy and request', () => {
  it('names both new presets, every skill, every next step, and the tier reasons', () => {
    expect(CT.presetNames.hard.en).toBe('Hard Quiz');
    expect(CT.presetNames.speed.en).toBe('Speed Challenge');
    for (const s of ['standard', 'reverse', 'mixed', 'trap', 'reasoning', 'pyq', 'challenge']) expect(CT.hq.skills[s].bn).toBeTruthy();
    for (const a of ['harder_mix', 'new_pattern', 'more_moderate', 'review_concept', 'foundation']) expect(withNames(CT.hq.next[a], { en: 'Ratio', bn: 'অনুপাত' }, { en: 'p', bn: 'p' }).en).toBeTruthy();
    expect(reasonText('tier:foundation').en).toMatch(/foundation/);
    expect(reasonText('weak:52').en).toMatch(/52%/); // numeric reasons still work
    expect(PRACTICE_TYPE.pyq_pattern.label.en).toMatch(/PYQ pattern practice/);
  });

  it('a Speed Challenge request carries its count and minutes', () => {
    const body = buildRequest('quant', { preset: 'speed', topics: new Set(['percentage']), count: 15, time: 8, difficulty: 'exam', distribution: 'smart', mode: 'exam' }, 'en');
    expect(body).toMatchObject({ preset: 'speed', questionCount: 15, timeLimitMinutes: 8, topics: ['percentage'] });
    expect(SPEED_COUNTS).toEqual([5, 10, 15, 20]);
  });
});

describe('Why was this hard? panel', () => {
  it('shows strong and weak skills, per-type results, and starts a harder Hard Quiz', async () => {
    const onRun = show(report());
    expect(screen.getByRole('heading', { name: /Why was this hard/ })).toBeInTheDocument();
    expect(screen.getAllByText('Reverse problems').length).toBeGreaterThan(0);
    expect(screen.getByText(/0\/2/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Hard Quiz/ }));
    expect(onRun).toHaveBeenCalledWith('hard', { subject: 'quant', preset: 'hard', topics: ['percentage'] });
  });

  it('foundation: links to the chapter and basic questions instead of a hard set', () => {
    show(report({ skills: [], nextStep: { action: 'foundation', topic: 'percentage', name: { en: 'Percentage', bn: 'শতকরা' } } }));
    expect(screen.getByText(/Build the foundation in Percentage first/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Revise Percentage/ })).toHaveAttribute('href', '/learn/quant/percentage');
    expect(screen.queryByRole('button', { name: /Hard Quiz/ })).toBeNull();
  });

  it('Speed Challenge: answered, average time, skipped, rushed mistakes', () => {
    show(report({ custom: { preset: 'speed', topics: ['percentage'], mode: 'exam' }, skills: [], nextStep: null, speed: { questions: 10, completed: 8, skipped: 2, accuracy: 63, avgSecPerQuestion: 40, plannedSecPerQuestion: 60, rushedMistakes: 2 } }));
    expect(screen.getByRole('heading', { name: /Your speed/ })).toBeInTheDocument();
    expect(screen.getByText('8/10')).toBeInTheDocument();
    expect(screen.getByText('40s')).toBeInTheDocument();
    expect(screen.getByText(/Planned 60s per question/)).toBeInTheDocument();
  });

  it('renders nothing for a report without the new fields (older tests, other subjects)', () => {
    const { container } = render(<MemoryRouter><HardQuizInsights r={report({ skills: null, nextStep: null, speed: null })} subject="english" busy={null} onRun={vi.fn()} reviseLink={() => '/'} /></MemoryRouter>);
    expect(container).toBeEmptyDOMElement();
  });
});

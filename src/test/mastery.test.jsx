import { act, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../App';
import { AuthProvider } from '../app/AuthContext';
import { DataSourceProvider } from '../app/DataSourceContext';
import { createFixtureDataSource } from '../lib/dataSource';
import { clearResourceCache } from '../hooks/useResource';
import { languageStore } from '../hooks/useLanguagePreference';
import StageChip from '../components/mastery/StageChip';

const t = (en, bn) => ({ en, bn });
const row = (subject, topic, name, stage, score, status) => ({
  subject, topic, name: t(name, name), subjectName: t(subject, subject), category: 'WBPSC', stage, score, status, accuracyPct: score, answers: 20,
});
const insights = {
  mastery: [
    row('quant', 'percentage', 'Percentage', 'mastered', 96, 'strong'),
    row('english', 'grammar', 'Grammar', 'practising', 18, 'weak'),
    row('gs', 'polity', 'Polity', 'strong', 82, 'strong'),
    row('reasoning', 'series', 'Series', 'learning', null, 'started'),
  ],
  counts: { strong: 2, improving: 0, weak: 1, started: 1, not_started: 0 },
  stageCounts: { not_started: 0, learning: 1, practising: 1, developing: 0, strong: 1, mastered: 1 },
  stages: ['not_started', 'learning', 'practising', 'developing', 'strong', 'mastered'],
  weakPatterns: [],
  badges: [],
  allBadges: 9,
  today: { answered: 0 },
  streak: { days: 0, freezes: 0, protectedDays: [], freezeEvery: 7 },
};

function source() {
  return {
    ...createFixtureDataSource({ latencyMs: 0 }),
    getMe: vi.fn(async () => ({ user: { id: 'u1', name: 'Riya Sen', email: 'riya@example.com', targetExam: null } })),
    getInsights: vi.fn(async () => insights),
  };
}

function renderAt(at) {
  render(
    <DataSourceProvider source={source()}>
      <AuthProvider>
        <MemoryRouter initialEntries={[at]}>
          <AppRoutes />
        </MemoryRouter>
      </AuthProvider>
    </DataSourceProvider>,
  );
}

beforeEach(() => {
  localStorage.clear();
  clearResourceCache();
  act(() => languageStore.set('en'));
});

describe('unified mastery stages (F9/F10)', () => {
  it('the Mastery page shows every subject on the one stage scale, with the score', async () => {
    renderAt('/mastery');
    const tile = (await screen.findByText('Percentage')).closest('a');
    expect(within(tile).getByText('Mastered')).toBeInTheDocument();
    expect(within(tile).getByText('score 96')).toBeInTheDocument();
    expect(within(screen.getByText('Grammar').closest('a')).getByText('Practising')).toBeInTheDocument();
    expect(within(screen.getByText('Polity').closest('a')).getByText('Strong')).toBeInTheDocument();
    expect(within(screen.getByText('Series').closest('a')).getByText('Learning')).toBeInTheDocument();
    // The legend explains the evidence rule and that mastery is not permanent.
    expect(screen.getByText(/one good quiz is never permanent mastery/)).toBeInTheDocument();
  });

  it('Home shows the same stage counts', async () => {
    renderAt('/');
    const counts = await screen.findByTestId('home-stage-counts');
    expect(within(counts).getByText('Mastered').closest('li').textContent).toMatch(/^1\s*Mastered/);
    expect(within(counts).getByText('Practising').closest('li').textContent).toMatch(/^1\s*Practising/);
  });

  it('StageChip renders a stage and nothing without one', () => {
    const { container, rerender } = render(<StageChip stage="developing" />);
    expect(screen.getByText('Developing')).toBeInTheDocument();
    rerender(<StageChip stage={null} />);
    expect(container).toBeEmptyDOMElement();
  });
});

import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DataSourceProvider } from '../app/DataSourceContext';
import { createFixtureDataSource } from '../lib/dataSource';
import { clearResourceCache } from '../hooks/useResource';
import { languageStore } from '../hooks/useLanguagePreference';
import PriorityBadge, { PriorityLegend, priorityFor } from '../components/priority/PriorityBadge';

const name = (en) => ({ en, bn: en });
const priorities = {
  paperCount: 10,
  questionCount: 1794,
  rule: { mustPercent: 10, mustPaperPercent: 80, importantPercent: 4, importantPaperPercent: 50 },
  subjects: {
    gs: {
      total: 1293,
      topics: {
        polity: { name: name('Indian Polity'), count: 129, share: 10, papers: 10, level: 'MUST' },
        economy: { name: name('Economy'), count: 95, share: 7.3, papers: 10, level: 'IMPORTANT' },
      },
    },
    quant: { total: 116, topics: { partnership: { name: name('Partnership'), count: 1, share: 0.9, papers: 1, level: 'ADDITIONAL' } } },
  },
};

function renderWith(ui, getPriorities = vi.fn(async () => priorities)) {
  render(<DataSourceProvider source={{ ...createFixtureDataSource({ latencyMs: 0 }), getPriorities }}>{ui}</DataSourceProvider>);
}

beforeEach(() => {
  clearResourceCache();
  languageStore.set('en');
});

describe('priority tags', () => {
  it('shows the level with the PYQ figures behind it', async () => {
    renderWith(<PriorityBadge subject="gs" topics={['polity']} />);
    expect(await screen.findByText('Must know')).toBeInTheDocument();
    expect(screen.getByText(/10% of past-paper questions in this subject; asked in 10 of 10 papers/)).toBeInTheDocument();
  });

  it('a card with several chapters takes the highest level; unmeasured chapters get no tag', () => {
    expect(priorityFor(priorities, 'gs', ['economy', 'polity']).level).toBe('MUST');
    expect(priorityFor(priorities, 'gs', ['important_days'])).toBeNull();
    expect(priorityFor(priorities, 'reasoning', ['analogy'])).toBeNull();
    expect(priorityFor(null, 'gs', ['polity'])).toBeNull();
  });

  it('renders nothing when the chapter is not counted or priorities fail to load', async () => {
    const { container } = render(
      <DataSourceProvider source={{ ...createFixtureDataSource({ latencyMs: 0 }), getPriorities: vi.fn(async () => priorities) }}>
        <PriorityBadge subject="gs" topics={['important_days']} />
      </DataSourceProvider>,
    );
    await new Promise((r) => setTimeout(r, 0));
    expect(container).toBeEmptyDOMElement();
    clearResourceCache();
    renderWith(<PriorityBadge subject="gs" topics={['polity']} />, vi.fn(async () => { throw new Error('down'); }));
    await new Promise((r) => setTimeout(r, 0));
    expect(screen.queryByText('Must know')).not.toBeInTheDocument();
  });

  it('the legend states the rule in numbers', async () => {
    renderWith(<PriorityLegend />);
    expect(await screen.findByText(/from 10 WBPSC past papers.*at least 10% of the subject's questions and asked in at least 80% of papers/)).toBeInTheDocument();
  });
});

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DataSourceProvider } from '../app/DataSourceContext';
import { createFixtureDataSource } from '../lib/dataSource';
import { clearResourceCache } from '../hooks/useResource';
import { languageStore } from '../hooks/useLanguagePreference';
import YearAtAGlance from '../components/gk/YearAtAGlance';

const t = (en, bn) => ({ en, bn });
const row = (month, day, en, bn) => ({ month, day, name: t(en, bn) });
const calendar = {
  dayCount: 3,
  months: [
    { month: 1, subtopic: 'january', factCode: 'GK-DAY-001', sources: [{ title: 'ECI', url: 'https://eci.gov.in/x', publisher: 'Election Commission of India' }], rows: [row(1, 12, 'National Youth Day (birth anniversary of Swami Vivekananda)', 'জাতীয় যুব দিবস')] },
    { month: 9, subtopic: 'september', factCode: 'GK-DAY-009', sources: [], rows: [row(9, 5, "Teachers' Day in India", 'শিক্ষক দিবস')] },
    { month: 10, subtopic: 'october', factCode: 'GK-DAY-010', sources: [], rows: [row(10, 5, "World Teachers' Day (UNESCO)", 'বিশ্ব শিক্ষক দিবস')] },
  ],
  similarNames: [{ word: 'teachers', rows: [row(9, 5, "Teachers' Day in India", 'শিক্ষক দিবস'), row(10, 5, "World Teachers' Day (UNESCO)", 'বিশ্ব শিক্ষক দিবস')] }],
  confusedPairs: [t("Teachers' Day in India – 5 September (NOT World Teachers' Day, 5 October)", 'ভারতে শিক্ষক দিবস – ৫ সেপ্টেম্বর')],
  confusedPairsFactCode: 'GK-DAY-013',
};

function renderYear(getImportantDays = vi.fn(async () => calendar)) {
  const source = { ...createFixtureDataSource({ latencyMs: 0 }), getImportantDays };
  const user = userEvent.setup();
  render(
    <DataSourceProvider source={source}>
      <YearAtAGlance />
    </DataSourceProvider>,
  );
  return { user };
}

beforeEach(() => {
  clearResourceCache();
  languageStore.set('en');
});

describe('Important Days: year at a glance', () => {
  it('shows every month as a dated table with its source, then confused pairs and similar names', async () => {
    renderYear();
    const jan = (await screen.findByRole('heading', { name: /^January/ })).closest('section');
    const cells = within(jan).getAllByRole('cell');
    expect(cells[0]).toHaveTextContent('12 January');
    expect(cells[1]).toHaveTextContent('National Youth Day (birth anniversary of Swami Vivekananda)');
    expect(within(jan).getByRole('link', { name: 'Election Commission of India' })).toHaveAttribute('href', 'https://eci.gov.in/x');

    expect(screen.getByRole('heading', { name: /Most confused pairs/ })).toBeInTheDocument();
    expect(screen.getByText(/NOT World Teachers' Day, 5 October/)).toBeInTheDocument();
    const similar = screen.getByRole('heading', { name: /^Similar names, different dates/ }).closest('section');
    expect(within(similar).getByText('5 September')).toBeInTheDocument();
    expect(within(similar).getByText('5 October')).toBeInTheDocument();
    expect(screen.getByText(/3 days from January to December/)).toBeInTheDocument();
  });

  it('a month chip narrows the table to that month', async () => {
    const { user } = renderYear();
    await screen.findByRole('heading', { name: /^January/ });
    await user.click(screen.getByRole('button', { name: /^September/ }));
    expect(screen.queryByRole('heading', { name: /^January/ })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^September/ })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /^All months/ }));
    expect(screen.getByRole('heading', { name: /^January/ })).toBeInTheDocument();
  });

  it('shows Bengali dates and names in Bengali', async () => {
    languageStore.set('bn');
    renderYear();
    const jan = (await screen.findByRole('heading', { name: /January/ })).closest('section');
    expect(within(jan).getByText('১২ জানুয়ারি')).toBeInTheDocument();
    expect(within(jan).getByText('জাতীয় যুব দিবস')).toBeInTheDocument();
  });

  it('offers a retry when loading fails', async () => {
    const { user } = renderYear(vi.fn().mockRejectedValueOnce(new Error('down')).mockResolvedValue(calendar));
    await user.click(await screen.findByRole('button', { name: /Try again/ }));
    expect(await screen.findByRole('heading', { name: /^January/ })).toBeInTheDocument();
  });
});

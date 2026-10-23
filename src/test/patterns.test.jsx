import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppRoutes } from '../App';
import { DataSourceProvider } from '../app/DataSourceContext';
import { createFixtureDataSource } from '../lib/dataSource';
import { clearResourceCache } from '../hooks/useResource';
import { languageStore } from '../hooks/useLanguagePreference';

const t = (en, bn) => ({ en, bn });
const pattern = (key, name) => ({
  key,
  emoji: '🎯',
  name: t(name, `${name} বাংলা`),
  spot: t(`Spot ${name}`, `চেনো ${name}`),
  method: [t('Write the base.', 'ভিত্তি লেখো।'), t('Multiply.', 'গুণ করো।')],
  example: { question: t(`Worked ${name}?`, `উদাহরণ ${name}?`), steps: [t('First step here.', 'প্রথম ধাপ।'), t('Second step here.', 'দ্বিতীয় ধাপ।')], answer: t('42', 'উত্তর 42') },
  tryIt: {
    question: t(`Try ${name}?`, `চেষ্টা ${name}?`),
    options: [t('10', '10'), t('20', '20'), t('30', '30'), t('40', '40')],
    correct: 2,
    explanation: [t('Because thirty.', 'কারণ তিরিশ।'), t('Done.', 'শেষ।')],
  },
});

function renderStudy() {
  const source = {
    ...createFixtureDataSource({ latencyMs: 0 }),
    getTopicPatterns: async () => ({ patterns: [pattern('one', 'Mark-up pattern'), pattern('two', 'Discount pattern')] }),
  };
  const user = userEvent.setup();
  render(
    <DataSourceProvider source={source}>
      <MemoryRouter initialEntries={['/exams/wbpsc/quant/profit-loss']}>
        <AppRoutes />
      </MemoryRouter>
    </DataSourceProvider>,
  );
  return user;
}

beforeEach(() => {
  localStorage.clear();
  clearResourceCache();
  act(() => languageStore.set('en'));
});

describe('study page: learning path and question patterns', () => {
  it('shows the path, reveals the worked example step by step, and checks the "your turn" guess', async () => {
    const user = renderStudy();
    const path = await screen.findByRole('navigation', { name: 'Your learning path' });
    expect(within(path).getByRole('button', { name: /Learn patterns/ })).toBeInTheDocument();
    expect(within(path).getByRole('button', { name: /Mock test/ })).toBeInTheDocument();

    const section = await screen.findByRole('region', { name: /Question patterns/ });
    expect(within(section).getByText('Spot Mark-up pattern')).toBeInTheDocument();
    expect(within(section).queryByText('First step here.')).toBeNull();
    await user.click(within(section).getByRole('button', { name: /^Show next step \(1\/2\)/ }));
    expect(within(section).getByText('First step here.')).toBeInTheDocument();
    expect(within(section).queryByText('Second step here.')).toBeNull();
    await user.click(within(section).getByRole('button', { name: /^Show all/ }));
    expect(within(section).getByText('Second step here.')).toBeInTheDocument();

    // Wrong guess: feedback, the right option marked, explanation, and a retry.
    await user.click(within(section).getByRole('radio', { name: /^A/ }));
    expect(within(section).getByText('Not quite. See why below 👇')).toBeInTheDocument();
    expect(within(section).getByText('Because thirty.')).toBeInTheDocument();
    expect(within(section).getByRole('radio', { name: /^C/ })).toHaveAttribute('data-status', 'answer');
    await user.click(within(section).getByRole('button', { name: /Try again/ }));
    await user.click(within(section).getByRole('radio', { name: /^C/ }));
    expect(within(section).getByText('Correct! Well done 🎉')).toBeInTheDocument();
    expect(within(section).getByText('1/2 tried')).toBeInTheDocument();

    await user.click(within(section).getByRole('button', { name: /^Next pattern/ }));
    expect(within(section).getByRole('heading', { name: 'Discount pattern' })).toBeInTheDocument();
    expect(within(section).getByRole('button', { name: /Now practise real questions/ })).toBeInTheDocument();
  }, 20_000); // walks the whole section; slow on busy machines
});

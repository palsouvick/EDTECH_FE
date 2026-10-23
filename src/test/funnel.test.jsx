import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppRoutes } from '../App';
import { DataSourceProvider } from '../app/DataSourceContext';
import { createFixtureDataSource } from '../lib/dataSource';
import { clearResourceCache } from '../hooks/useResource';
import { languageStore } from '../hooks/useLanguagePreference';
import { lastVisitedStore } from '../lib/lastVisited';
import TopicSummaryHeader from '../components/topic-hub/TopicSummaryHeader';

function Location() {
  return <output data-testid="path">{useLocation().pathname}</output>;
}

function renderAt(path) {
  const user = userEvent.setup();
  render(
    <DataSourceProvider source={createFixtureDataSource({ latencyMs: 0 })}>
      <MemoryRouter initialEntries={[path]}>
        <AppRoutes />
        <Location />
      </MemoryRouter>
    </DataSourceProvider>,
  );
  return user;
}

const path = () => screen.getByTestId('path').textContent;
const crumbs = () => within(screen.getAllByRole('navigation', { name: 'Breadcrumb' })[0]);

beforeEach(() => {
  localStorage.clear();
  clearResourceCache();
  act(() => {
    languageStore.set('en');
    lastVisitedStore.reload();
  });
});

describe('selection funnel', () => {
  it('/exams lists the four categories with their exams; / is the home page', async () => {
    renderAt('/exams');
    await screen.findByRole('link', { name: /^SSC/ });
    expect(path()).toBe('/exams');

    const cards = screen.getAllByRole('link').filter((a) => a.getAttribute('href')?.match(/^\/exams\/[a-z-]+$/));
    expect(cards.map((a) => a.getAttribute('href'))).toEqual(['/exams/ssc', '/exams/bank', '/exams/wbpsc', '/exams/wb-post']);
    const ssc = cards[0];
    for (const exam of ['CGL', 'CHSL', 'MTS']) expect(within(ssc).getByText(exam)).toBeInTheDocument();
    expect(within(cards[1]).getByText('IBPS PO')).toBeInTheDocument();
    expect(within(cards[2]).getByText('WBCS')).toBeInTheDocument();
    expect(within(cards[3]).getByText('GDS')).toBeInTheDocument();
  });

  it('walks category -> subject -> topic -> study page, with dynamic breadcrumbs that navigate back', async () => {
    const user = renderAt('/exams');

    await user.click(await screen.findByRole('link', { name: /^WBPSC/ }));
    await screen.findByRole('heading', { name: /Choose a subject/ });
    expect(path()).toBe('/exams/wbpsc');
    const quant = await screen.findByRole('link', { name: /Quantitative Aptitude/ });
    expect(quant).toHaveTextContent('12 questions');
    expect(quant).toHaveTextContent('9 topics');
    expect(screen.getByRole('link', { name: /General Studies/ })).toHaveTextContent('7 topics'); // + West Bengal GK

    // Names and counts follow the study language.
    await user.click(screen.getAllByRole('radio', { name: 'বাংলা' })[1]);
    await waitFor(() => expect(screen.getByRole('link', { name: /পরিমাণগত দক্ষতা/ })).toBeInTheDocument());
    await user.click(screen.getAllByRole('radio', { name: 'English' })[0]);
    await waitFor(() => expect(screen.getByRole('link', { name: /Quantitative Aptitude/ })).toHaveTextContent('12 questions'));

    await user.click(screen.getByRole('link', { name: /Quantitative Aptitude/ }));
    expect(path()).toBe('/exams/wbpsc/quant');
    const pl = (await screen.findByRole('heading', { name: 'Profit, Loss & Discount' })).closest('li');
    expect(pl).toHaveTextContent('Easy');
    expect(pl).toHaveTextContent('10 PYQs');
    expect(pl).toHaveTextContent('12 questions');
    const pct = screen.getByRole('heading', { name: 'Percentage' }).closest('li');
    expect(within(pct).getByText('Coming soon').closest('[aria-disabled]')).toHaveAttribute('aria-disabled', 'true');
    expect(within(pct).queryByRole('link')).toBeNull();

    await user.click(within(pl).getByRole('link', { name: /Study & Practice/ }));
    expect(path()).toBe('/exams/wbpsc/quant/profit-loss');
    await screen.findByRole('heading', { name: /Profit, Loss & Discount/, level: 1 });
    expect(crumbs().getByRole('link', { name: 'WBPSC' })).toHaveAttribute('href', '/exams/wbpsc');
    expect(crumbs().getByRole('link', { name: /^Quantitative Aptitude/ })).toHaveAttribute('href', '/exams/wbpsc/quant');
    expect(crumbs().getByText('Profit, Loss & Discount').closest('li')).toHaveAttribute('aria-current', 'page');
    await screen.findByText(/A shopkeeper marks his goods 40%/); // the arena loaded the topic's questions

    await user.click(crumbs().getByRole('link', { name: /^Quantitative Aptitude/ }));
    expect(path()).toBe('/exams/wbpsc/quant');
    await user.click(crumbs().getByRole('link', { name: 'WBPSC' }));
    expect(path()).toBe('/exams/wbpsc');
    await user.click(crumbs().getByRole('link', { name: /^Exams/ }));
    expect(path()).toBe('/exams');

    // The last topic is offered as a shortcut.
    const resume = await screen.findByRole('link', { name: /Continue where you left off/ });
    expect(resume).toHaveAttribute('href', '/exams/wbpsc/quant/profit-loss');
  }, 20_000); // walks the whole funnel; slow on CI machines

  it.each([
    ['/exams/upsc', '/exams'],
    ['/exams/SSC!', '/exams'],
    ['/exams/ssc/physics', '/exams/ssc'],
    ['/exams/ssc/quant/trigonometry', '/exams/ssc/quant'],
    ['/exams/bank/quant/profit_loss', '/exams/bank/quant'],
    ['/study/anything', '/'],
  ])('%s redirects to %s instead of showing a default topic', async (from, to) => {
    renderAt(from);
    await waitFor(() => expect(path()).toBe(to));
    expect(screen.queryByText(/A shopkeeper marks his goods/)).toBeNull();
  });

  it('a deep link restores the exact topic on a fresh load', async () => {
    renderAt('/exams/wb-post/quant/profit-loss');
    await screen.findByRole('heading', { name: /Profit, Loss & Discount/, level: 1 });
    expect(crumbs().getByRole('link', { name: /^WB Post Office/ })).toHaveAttribute('href', '/exams/wb-post');
  });
});

describe('TopicSummaryHeader without published notes', () => {
  it('shows the title from the breadcrumb and a coming-soon note, no empty sections', () => {
    render(
      <MemoryRouter>
        <TopicSummaryHeader
          breadcrumb={{ topic: { code: 'percentage', name: { en: 'Percentage', bn: 'শতকরা' } } }}
          summary={null}
        />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Percentage');
    expect(screen.getByText(/Concept notes for this topic are on the way/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Core Formulas/ })).toBeNull();
  });
});

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import TopicSummaryHeader from '../components/topic-hub/TopicSummaryHeader';
import { Localized } from '../components/topic-hub/Localized';
import { profitLossTopic } from '../fixtures/profitLoss';

const { breadcrumb, summary } = profitLossTopic;

function setup(props = {}) {
  const handlers = { onStartPractice: vi.fn(), onLaunchMock: vi.fn() };
  render(<TopicSummaryHeader breadcrumb={breadcrumb} summary={summary} {...handlers} {...props} />);
  return handlers;
}

beforeEach(() => localStorage.clear());

describe('TopicSummaryHeader', () => {
  it('renders breadcrumb, sections and typeset formulas', () => {
    setup();
    const crumbs = within(screen.getByRole('navigation', { name: 'Breadcrumb' }));
    expect(crumbs.getByText('Quantitative Aptitude')).toBeInTheDocument();
    expect(crumbs.getByText('লাভ, ক্ষতি ও ছাড়')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: /Core Formulas/ })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: /Speed Tricks/ })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('button', { name: /Common PYQ Pitfalls/ })).toBeInTheDocument();

    // 5 display formulas, typeset by KaTeX (with MathML for screen readers).
    expect(document.querySelectorAll('.formula-display .katex-display')).toHaveLength(5);
    expect(document.querySelector('.formula-display math')).not.toBeNull();
  });

  it('marks untranslated content with an English fallback slot', () => {
    render(<Localized value={{ en: 'Only in English' }} />);
    const slot = screen.getByText(/Only in English/).closest('[data-l]');
    expect(slot).toHaveAttribute('data-l', 'en bn');
    expect(slot).toHaveAttribute('data-fallback-for', 'bn');
    expect(slot.querySelector('.fallback-badge')).not.toBeNull();
  });

  it('toggles sections and remembers them per topic', async () => {
    setup();
    const tricks = screen.getByRole('button', { name: /Speed Tricks/ });
    await userEvent.click(tricks);
    expect(tricks).toHaveAttribute('aria-expanded', 'true');
    expect(document.getElementById('tricks-panel')).not.toHaveAttribute('inert');
    expect(JSON.parse(localStorage.getItem('hub:quant.profit_loss:open'))).toEqual(['formulas', 'tricks']);

    await userEvent.click(screen.getByRole('button', { name: /Expand all/ }));
    expect(screen.getByRole('button', { name: /Common PYQ Pitfalls/ })).toHaveAttribute('aria-expanded', 'true');
  });

  it('CTA starts practice, or opens the mock test setup', async () => {
    const { onStartPractice, onLaunchMock } = setup();

    await userEvent.click(screen.getByRole('button', { name: /Start practice/ }));
    expect(onStartPractice).toHaveBeenCalledOnce();

    await userEvent.click(screen.getByRole('radio', { name: /Timed Mock Test/ }));
    await userEvent.click(screen.getByRole('button', { name: /Launch mock test/ }));
    expect(onLaunchMock).toHaveBeenCalledOnce(); // count, timer, pause and language are chosen in the setup dialog
    expect(localStorage.getItem('hub:mode')).toBe('"mock"');
  });

  it('shows on-device progress and accepts server numbers', () => {
    setup({ progress: { attemptedToday: 12, dailyGoal: 30, streak: 7, activeToday: true } });
    const nav = within(document.querySelector('[data-sticky-top]'));
    expect(nav.getByText('12')).toBeInTheDocument();
    expect(nav.getByText('/30')).toBeInTheDocument();
    expect(nav.getByText('7')).toBeInTheDocument();
  });
});

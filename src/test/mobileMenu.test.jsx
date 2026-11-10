import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppRoutes } from '../App';
import { DataSourceProvider } from '../app/DataSourceContext';
import { createFixtureDataSource } from '../lib/dataSource';
import { clearResourceCache } from '../hooks/useResource';
import { languageStore } from '../hooks/useLanguagePreference';

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

beforeEach(() => {
  localStorage.clear();
  clearResourceCache();
  act(() => languageStore.set('en'));
});

// jsdom applies no CSS, so md:hidden / hidden md:flex are not tested here; the phone and
// desktop layouts were checked in a real browser (390/360 px phones; 800/1366 px pixel-identical).
describe('phone menu', () => {
  it('opens every section, marks the current page, navigates and closes', async () => {
    const user = renderAt('/exams');
    const open = await screen.findByRole('button', { name: 'Open menu' });
    expect(open).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('dialog', { name: 'Menu' })).not.toBeInTheDocument();

    await user.click(open);
    const sheet = screen.getByRole('dialog', { name: 'Menu' });
    const links = within(sheet).getAllByRole('link');
    expect(links.map((a) => a.getAttribute('href'))).toEqual(['/', '/exams', '/plan', '/ido', '/learn', '/pyq', '/vocabulary', '/tips', '/me']);
    expect(within(sheet).getByRole('link', { name: /Exams/ })).toHaveAttribute('aria-current', 'page');
    expect(within(sheet).getByRole('radiogroup', { name: /Language/ })).toBeInTheDocument();
    expect(document.body.style.overflow).toBe('hidden');

    await user.click(within(sheet).getByRole('link', { name: /Previous years/ }));
    expect(screen.getByTestId('path').textContent).toBe('/pyq');
    expect(screen.queryByRole('dialog', { name: 'Menu' })).not.toBeInTheDocument();
    expect(document.body.style.overflow).toBe('');
  });

  it('Escape closes the sheet and returns focus to the menu button', async () => {
    const user = renderAt('/exams');
    const open = await screen.findByRole('button', { name: 'Open menu' });
    await user.click(open);
    expect(screen.getByRole('dialog', { name: 'Menu' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Menu' })).not.toBeInTheDocument();
    expect(open).toHaveFocus();
  });
});

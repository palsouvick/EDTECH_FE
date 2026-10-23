import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { AppRoutes } from '../App';
import { AuthProvider } from '../app/AuthContext';
import { DataSourceProvider } from '../app/DataSourceContext';
import { createFixtureDataSource } from '../lib/dataSource';
import { clearResourceCache } from '../hooks/useResource';
import { languageStore } from '../hooks/useLanguagePreference';
import ExamInfoPanel from '../components/exam-info/ExamInfoPanel';

function Location() {
  const l = useLocation();
  return <output data-testid="path">{`${l.pathname}${l.search}`}</output>;
}
const path = () => screen.getByTestId('path').textContent;

function renderApp(at) {
  const user = userEvent.setup();
  render(
    <DataSourceProvider source={createFixtureDataSource({ latencyMs: 0 })}>
      <AuthProvider>
        <MemoryRouter initialEntries={[at]}>
          <AppRoutes />
          <Location />
        </MemoryRouter>
      </AuthProvider>
    </DataSourceProvider>,
  );
  return user;
}

beforeEach(() => {
  localStorage.clear();
  clearResourceCache();
  act(() => languageStore.set('en'));
});

describe('accounts', () => {
  it('logs in from the header and returns to the page the student came from', async () => {
    const user = renderApp('/exams/ssc');
    await user.click(await screen.findByRole('link', { name: /^Log in/ }));
    expect(path()).toBe('/login?next=%2Fexams%2Fssc');

    await user.type(screen.getByLabelText(/^Email/), 'riya@example.com');
    await user.type(screen.getByLabelText(/^Password/), 'secret123');
    await user.click(screen.getByRole('button', { name: /^Log in/ }));

    await screen.findByRole('button', { name: /Account: riya/ });
    expect(path()).toBe('/exams/ssc');
  });

  it('registers, opens My performance, and logs out', async () => {
    const user = renderApp('/register?next=/me');
    await user.type(await screen.findByLabelText(/^Full name/), 'Arjun Sen');
    await user.type(screen.getByLabelText(/^Email/), 'arjun@example.com');
    await user.type(screen.getByLabelText(/^Password/), 'secret123');
    await user.click(screen.getByRole('button', { name: /^Create account/ }));

    await screen.findByRole('heading', { name: /^My performance/ });
    expect(path()).toBe('/me');
    expect(screen.getByText(/Hi Arjun Sen/)).toBeInTheDocument();
    expect(await screen.findByText('Questions practised')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Account: Arjun Sen/ }));
    expect(within(screen.getByRole('menu')).getByText('arjun@example.com')).toBeInTheDocument();
    await user.click(screen.getByRole('menuitem', { name: /^Log out/ }));
    await screen.findByRole('link', { name: /^Log in/ });
    expect(path()).toBe('/exams');
  });

  it('sends signed-out visitors of /me to log in', async () => {
    renderApp('/me');
    await screen.findByRole('heading', { name: /^Welcome back/ });
    expect(path()).toBe('/login?next=%2Fme');

  });

  it('ignores an off-site next after login', async () => {
    const user = renderApp('/login?next=//evil.example');
    await user.type(await screen.findByLabelText(/^Email/), 'a@example.com');
    await user.type(screen.getByLabelText(/^Password/), 'secret123');
    await user.click(screen.getByRole('button', { name: /^Log in/ }));
    await screen.findByRole('button', { name: /Account:/ });
    expect(path()).toBe('/exams');
  });
});

const all = (t) => ({ en: t, bn: t, hi: t });
const EXAMS = [
  {
    code: 'SSC_CGL',
    name: all('CGL'),
    fullName: { en: 'Combined Graduate Level Examination' },
    stages: [
      {
        tier: 'TIER_1',
        name: { en: 'Tier-1' },
        mode: 'CBT',
        durationMin: 60,
        sections: ['reasoning', 'gs', 'quant', 'english'].map((subject) => ({
          subject,
          title: { en: `${subject} section` },
          questions: 25,
          marksEach: 2,
          negative: 0.5,
        })),
        totalQuestions: 100,
        totalMarks: 200,
      },
    ],
    nextStages: [{ en: 'Tier-2' }],
    patternAsOf: '2025 notification',
    sourceUrl: 'https://ssc.gov.in/notice.pdf',
    cycles: [{ year: 2025, stage: { en: 'Tier-1' }, dates: '12 Sep - 26 Sep 2025', vacancies: 14582, sourceUrl: 'https://ssc.gov.in/x.pdf', sourceType: 'official' }],
  },
  { code: 'SSC_CHSL', name: all('CHSL') },
  { code: 'WB_POST_GDS', name: all('GDS'), selectionNote: { en: 'Selection is on Class 10 marks; there is no written exam.' } },
];
const SUBJECTS = [
  { code: 'quant', questionCount: 912 },
  { code: 'reasoning', questionCount: 700 },
  { code: 'english', questionCount: 800 },
  { code: 'gs', questionCount: 650 },
];

function renderPanel(at = '/exams/ssc') {
  const user = userEvent.setup();
  render(
    <MemoryRouter initialEntries={[at]}>
      <Routes>
        <Route path="*" element={<ExamInfoPanel category="SSC" exams={EXAMS} subjects={SUBJECTS} website="https://ssc.gov.in" />} />
      </Routes>
      <Location />
    </MemoryRouter>,
  );
  return user;
}

describe('exam info panel', () => {
  it('shows the pattern, our question counts per section, past cycles and sources', () => {
    renderPanel();
    expect(screen.getByRole('tab', { name: /^CGL/ })).toHaveAttribute('aria-selected', 'true');
    const panel = screen.getByRole('tabpanel');
    expect(within(panel).getByText('Combined Graduate Level Examination')).toBeInTheDocument();
    expect(within(panel).getByText('−0.5 per wrong')).toBeInTheDocument();
    expect(within(panel).getByRole('link', { name: /^912/ })).toHaveAttribute('href', '/exams/ssc/quant');
    expect(within(panel).getByText(/12 Sep - 26 Sep 2025/)).toBeInTheDocument();
    expect(within(panel).getByText('14,582')).toBeInTheDocument();
    expect(within(panel).getByRole('link', { name: /^Pattern source.*ssc\.gov\.in$/ })).toHaveAttribute('href', 'https://ssc.gov.in/notice.pdf');
  });

  it('switches tabs with click and arrow keys, kept in ?exam=', async () => {
    const user = renderPanel();
    await user.click(screen.getByRole('tab', { name: /^CHSL/ }));
    expect(path()).toBe('/exams/ssc?exam=SSC_CHSL');
    expect(screen.getByText('The verified exam pattern for this exam has not been added yet.')).toBeInTheDocument();
    expect(screen.getByText('Past exam dates have not been added yet.')).toBeInTheDocument();

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: /^GDS/ })).toHaveFocus();
    expect(screen.getByText(/no written exam/)).toBeInTheDocument();
    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: /^CGL/ })).toHaveAttribute('aria-selected', 'true');
  });

  it('opens the tab named in the URL', () => {
    renderPanel('/exams/wb-post?exam=WB_POST_GDS');
    expect(screen.getByRole('tab', { name: /^GDS/ })).toHaveAttribute('aria-selected', 'true');
  });
});

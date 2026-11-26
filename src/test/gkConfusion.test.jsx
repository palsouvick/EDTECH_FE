import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AppRoutes } from '../App';
import { AuthProvider } from '../app/AuthContext';
import { DataSourceProvider } from '../app/DataSourceContext';
import { createFixtureDataSource } from '../lib/dataSource';
import GkDrills from '../components/gk/GkDrills';
import { clearResourceCache } from '../hooks/useResource';
import { languageStore } from '../hooks/useLanguagePreference';

const t = (en, bn) => ({ en, bn });
const DETECTIVES = {
  id: 'bengali_characters',
  title: t('Bengali detectives and characters', 'বাংলা গোয়েন্দা ও চরিত্র'),
  intro: t('Byomkesh, Feluda, Ghanada: who created whom.', 'ব্যোমকেশ, ফেলুদা, ঘনাদা: কে কার স্রষ্টা।'),
  questionCount: 6,
  facts: [{ code: 'GK-WBG-260', title: t('Byomkesh Bakshi: Sharadindu Bandyopadhyay', 'ব্যোমকেশ বক্সী: শরদিন্দু বন্দ্যোপাধ্যায়') }],
};

function renderAt(path, extra = {}) {
  const source = {
    ...createFixtureDataSource({ latencyMs: 0 }),
    getMe: async () => ({ user: { id: 'u1', name: 'Riya', email: 'riya@example.com' } }),
    getGkDrills: vi.fn(async () => ({ drills: [DETECTIVES] })),
    ...extra,
  };
  const user = userEvent.setup();
  render(
    <DataSourceProvider source={source}>
      <AuthProvider>
        <MemoryRouter initialEntries={[path]}>
          <AppRoutes />
        </MemoryRouter>
      </AuthProvider>
    </DataSourceProvider>,
  );
  return { user, source };
}

beforeEach(() => {
  localStorage.clear();
  clearResourceCache();
  act(() => languageStore.set('en'));
});

describe('GK confusion drills', () => {
  it('drill page: title, how wrong options are explained, the topics it draws on', async () => {
    renderAt('/learn/gk/drill/bengali_characters');
    expect(await screen.findByRole('heading', { name: /^Bengali detectives and characters/ })).toBeInTheDocument();
    expect(screen.getByText(/The note under the answer says what that option really is/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Byomkesh Bakshi: Sharadindu/ })).toHaveAttribute('href', '/learn/gk/topic/GK-WBG-260');
    expect(screen.getByRole('button', { name: /^Start drill/ })).toBeInTheDocument();
  });

  it('a section mixed test opens as one drill made of all the section drills', async () => {
    const pen = { ...DETECTIVES, id: 'bengali_pen_names', title: t('Bengali pen names', 'বাংলা ছদ্মনাম'), facts: [{ code: 'GK-WBG-240', title: t('Banaphool: Balai Chand Mukhopadhyay', 'বনফুল: বলাইচাঁদ মুখোপাধ্যায়') }] };
    renderAt('/learn/gk/drill/mix_west_bengal', {
      getGkDrills: vi.fn(async () => ({
        drills: [{ ...DETECTIVES, group: 'west_bengal' }, { ...pen, group: 'west_bengal' }],
        groups: [{ id: 'west_bengal', title: t('West Bengal', 'পশ্চিমবঙ্গ'), mixId: 'mix_west_bengal', drillCount: 2, questionCount: 12 }],
      })),
    });
    expect(await screen.findByRole('heading', { name: /^West Bengal/ })).toBeInTheDocument();
    expect(screen.getByText(/questions from all 2 drills of this section/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Byomkesh Bakshi: Sharadindu/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Banaphool/ })).toBeInTheDocument();
  });

  it('a topic opened from a drill links back to that drill, and still to its chapter', async () => {
    const fact = {
      code: 'GK-WBG-260', topic: 'west_bengal_gk', subtopic: 'literature_culture', title: DETECTIVES.facts[0].title,
      statement: t('Byomkesh Bakshi was created by Sharadindu Bandyopadhyay.', 'ব্যোমকেশ বক্সীর স্রষ্টা শরদিন্দু বন্দ্যোপাধ্যায়।'),
      explanation: null, verification: { status: 'VERIFIED' }, bengaliReview: 'PENDING', pack: null, sources: [], milestones: [], questionCount: 0,
    };
    const { user } = renderAt('/learn/gk/drill/bengali_characters', { getGkFact: vi.fn(async () => fact) });
    await user.click(await screen.findByRole('link', { name: /Byomkesh Bakshi: Sharadindu/ }));
    const back = await screen.findByRole('link', { name: /Back to: Bengali detectives and characters/ });
    expect(back).toHaveAttribute('href', '/learn/gk/drill/bengali_characters');
    expect(screen.getByRole('link', { name: /Back to the chapter/ })).toBeInTheDocument();
  });

  it('drill cards show attempted / left as a progress bar (only when the API sends it)', async () => {
    const source = {
      ...createFixtureDataSource({ latencyMs: 0 }),
      getGkDrills: vi.fn(async () => ({ drills: [{ ...DETECTIVES, poolSize: 8, attempted: 3 }, { ...DETECTIVES, id: 'done', poolSize: 4, attempted: 4 }, { ...DETECTIVES, id: 'anon' }] })),
    };
    render(<DataSourceProvider source={source}><MemoryRouter><GkDrills /></MemoryRouter></DataSourceProvider>);
    expect(await screen.findByText('3/8 attempted')).toBeInTheDocument();
    expect(screen.getByText('5 left')).toBeInTheDocument();
    expect(screen.getByText('All done ✓')).toBeInTheDocument();
    const bars = screen.getAllByRole('progressbar');
    expect(bars).toHaveLength(2);
    expect(bars[0]).toHaveAttribute('aria-valuenow', '3');
  });

  it('GK page: drills live in their own tab; chapters tab is the default; ?view=drills opens it', async () => {
    const { user } = renderAt('/learn/gk');
    expect(await screen.findByRole('tab', { name: /Chapters & books/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.queryByRole('heading', { name: /confusion drills/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: /Confusion drills/ }));
    expect(await screen.findByRole('heading', { name: /Don't mix them up/ })).toBeInTheDocument();
  });

  it('the drill page back link returns to the drills tab', async () => {
    renderAt('/learn/gk/drill/bengali_characters');
    expect(await screen.findByRole('link', { name: /All GK/ })).toHaveAttribute('href', '/learn/gk?view=drills');
  });

  it('an unknown drill says so', async () => {
    renderAt('/learn/gk/drill/nope');
    expect(await screen.findByText('This drill is not available yet.')).toBeInTheDocument();
  });
});

describe('revision asks a GK fact another way', () => {
  it('shows the badge and sends both the queued and the asked question', async () => {
    const answerReview = vi.fn(async ({ askedQuestionId, selectedOptionId }) => ({
      questionId: askedQuestionId,
      selectedOptionId,
      isCorrect: true,
      correctOptionId: selectedOptionId,
      explanation: { items: [t('Byomkesh Bakshi.', 'ব্যোমকেশ বক্সী।')] },
      shortcut: null,
      trapForSelected: null,
      review: { status: 'active', streak: 1, masterAfter: 2, nextDueAt: '2026-11-24T10:00:00Z' },
    }));
    const { user } = renderAt('/revise', {
      getReviewSummary: async () => ({ dueToday: 1, active: 1, mastered: 0, mistakesActive: 1, nextDueAt: null, masterAfter: 2 }),
      getReviewDue: async () => ({
        masterAfter: 2,
        items: [{
          reason: 'mistake', streak: 0, wrongCount: 1, topicName: t('West Bengal GK', 'পশ্চিমবঙ্গ'),
          itemQuestionId: 'q_who', askedAnotherWay: true,
          question: { questionId: 'q_reverse', stem: t('Sharadindu Bandyopadhyay created which detective?', 'শরদিন্দু বন্দ্যোপাধ্যায় কোন গোয়েন্দার স্রষ্টা?'), options: [{ optionId: 'opt_aaaa', text: t('Byomkesh Bakshi', 'ব্যোমকেশ বক্সী') }, { optionId: 'opt_bbbb', text: t('Feluda', 'ফেলুদা') }] },
        }],
      }),
      answerReview,
    });
    expect(await screen.findByText('Sharadindu Bandyopadhyay created which detective?')).toBeInTheDocument();
    expect(screen.getByText('🔁 Same fact, asked another way')).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: /Byomkesh Bakshi/ }));
    await user.click(screen.getByRole('button', { name: /^Check answer/ }));
    expect(answerReview).toHaveBeenCalledWith(expect.objectContaining({ questionId: 'q_who', askedQuestionId: 'q_reverse', selectedOptionId: 'opt_aaaa' }));
  });
});

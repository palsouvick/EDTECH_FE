import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, expect, it, vi } from 'vitest';
import PracticeArena from '../components/practice/PracticeArena';
import { createFixturePracticeSource } from '../lib/practiceSource';
import { languageStore } from '../hooks/useLanguagePreference';

const t = (en, bn) => ({ en, bn });
const question = {
  questionId: 'q1', topic: 'indian_history', difficulty: 1, pyq: [],
  stem: t('Where did the Buddha attain enlightenment?', 'গৌতম বুদ্ধ কোথায় বোধিলাভ করেন?'),
  options: ['Sarnath', 'Kushinagar', 'Lumbini', 'Bodh Gaya'].map((x, i) => ({ optionId: `o${i}`, text: t(x, x) })),
  correctOptionId: 'o3', steps: [t('At Bodh Gaya, under the Bodhi tree.', 'বোধগয়ায়।')], stats: { attempts: 1, correct: 1 },
};

afterEach(() => vi.restoreAllMocks());

it('a question left open for two hours still checks, and the time sent is capped at an hour', async () => {
  languageStore.set('en');
  const base = createFixturePracticeSource([question], { latencyMs: 0 });
  const verify = vi.fn((body) => base.verify(body));
  const source = { ...base, verify };
  const user = userEvent.setup();
  render(<MemoryRouter><PracticeArena source={source} topicName={t('History', 'ইতিহাস')} /></MemoryRouter>);
  await screen.findByText('Where did the Buddha attain enlightenment?');

  const start = performance.now();
  vi.spyOn(performance, 'now').mockReturnValue(start + 2 * 3600 * 1000);
  await user.click(screen.getByRole('radio', { name: /Bodh Gaya/ }));
  await user.click(screen.getByRole('button', { name: /Check answer/ }));

  expect(await screen.findByText('At Bodh Gaya, under the Bodhi tree.')).toBeInTheDocument();
  expect(verify).toHaveBeenCalledWith(expect.objectContaining({ timeSpentSec: 3600 }));
});

import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import ReviewQuiz from '../components/vocabulary/ReviewQuiz';

const explanation = (bn, en) => ({ meaningBn: bn, definitionEn: en, exampleEn: 'An example.', exampleBn: 'একটি উদাহরণ।', synonyms: ['honest'], antonyms: ['cunning'], bengaliReview: { status: 'REVIEWED' } });

function stub() {
  const questions = [
    { questionId: 'q1', index: 0, mode: 'meaning', prompt: 'Choose the correct Bengali meaning of “Ingenuous”.', options: [{ optionId: 'a1', text: 'সরল; অকপট' }, { optionId: 'b1', text: 'চতুর' }, { optionId: 'c1', text: 'রাগী' }, { optionId: 'd1', text: 'অলস' }] },
    { questionId: 'q2', index: 1, mode: 'antonym', prompt: 'Choose a antonym of “Accurate”.', options: [{ optionId: 'a2', text: 'exact' }, { optionId: 'b2', text: 'inaccurate' }, { optionId: 'c2', text: 'precise' }, { optionId: 'd2', text: 'correct' }] },
  ];
  const right = { q1: 'a1', q2: 'b2' };
  return {
    createVocabularyReviewQuiz: vi.fn(async () => ({ sessionToken: 't'.repeat(43), type: 'due', questions })),
    answerVocabularyPractice: vi.fn(async (_t, { questionId, selectedOptionId }) => {
      const isCorrect = right[questionId] === selectedOptionId;
      return {
        questionId,
        selectedOptionId,
        isCorrect,
        correctOptionId: right[questionId],
        review: { known: isCorrect, intervalDays: isCorrect ? 3 : 1, nextReviewAt: null },
        explanation: questionId === 'q1' ? explanation('সরল; অকপট', 'Innocent and honest.') : explanation('নির্ভুল', 'Correct in every detail.'),
      };
    }),
  };
}

describe('vocabulary review quiz', () => {
  it('one tap answers; the description shows for a right AND a wrong answer; wrong goes back to revision', async () => {
    const user = userEvent.setup();
    const source = stub();
    const onAnswered = vi.fn();
    render(<ReviewQuiz source={source} type="due" onAnswered={onAnswered} />);

    expect(await screen.findByText(/Bengali meaning of “Ingenuous”/)).toBeInTheDocument();
    expect(screen.getByText(/Bengali meaning · বাংলা অর্থ/)).toBeInTheDocument();
    expect(screen.queryByTestId('review-explanation')).toBeNull(); // nothing given away before answering
    await user.click(screen.getByRole('radio', { name: /সরল; অকপট/ }));
    expect(screen.getByText(/Correct! You remembered it. Next review in 3 days/)).toBeInTheDocument();
    expect(within(screen.getByTestId('review-explanation')).getByText('Innocent and honest.')).toBeInTheDocument();
    expect(onAnswered).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole('button', { name: /Next word/ }));
    expect(screen.getByText(/Antonym · বিপরীত/)).toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: /exact/ }));
    expect(screen.getByText(/Not quite. Added to revision — this word comes back tomorrow/)).toBeInTheDocument();
    expect(within(screen.getByTestId('review-explanation')).getByText('Correct in every detail.')).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: /inaccurate/ })).toHaveTextContent('✓');
    // Answer is locked after the first tap.
    expect(screen.getByRole('radio', { name: /precise/ })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /See result/ }));
    const done = screen.getByTestId('review-done');
    expect(within(done).getByText('Revision complete: 1 / 2')).toBeInTheDocument();
    expect(within(done).getByText(/1 word went back into revision/)).toBeInTheDocument();
    expect(within(done).getByText('inaccurate')).toBeInTheDocument();
  });

  it('says so when nothing is due', async () => {
    const source = { createVocabularyReviewQuiz: async () => ({ sessionToken: null, type: 'due', questions: [] }) };
    render(<ReviewQuiz source={source} type="due" />);
    expect(await screen.findByText(/No words are due right now/)).toBeInTheDocument();
  });
});

describe('learn the neighbours', () => {
  it('shows synonyms and antonyms side by side with Bengali meanings, and the meaning of every option', async () => {
    const user = userEvent.setup();
    const q = { questionId: 'q1', index: 0, mode: 'synonym', prompt: 'Choose a synonym of “Abandon”.', options: [{ optionId: 'a', text: 'ban' }, { optionId: 'b', text: 'yield' }, { optionId: 'c', text: 'desert' }, { optionId: 'd', text: 'dispose of' }] };
    const source = {
      createVocabularyReviewQuiz: async () => ({ sessionToken: 't'.repeat(43), type: 'due', questions: [q] }),
      answerVocabularyPractice: async () => ({
        questionId: 'q1',
        selectedOptionId: 'a',
        isCorrect: false,
        correctOptionId: 'c',
        review: { known: false, intervalDays: 1 },
        explanation: {
          meaningBn: 'পরিত্যাগ করা',
          definitionEn: 'To leave completely.',
          synonyms: ['desert', 'forsake'],
          antonyms: ['keep', 'retain'],
          related: {
            synonyms: [{ word: 'desert', meaningBn: 'ছেড়ে যাওয়া', definitionEn: null }, { word: 'forsake', meaningBn: 'ত্যাগ করা', definitionEn: null }],
            antonyms: [{ word: 'keep', meaningBn: 'রাখা', definitionEn: null }, { word: 'retain', meaningBn: null, definitionEn: null }],
            options: [
              { optionId: 'a', text: 'ban', word: 'ban', meaningBn: 'নিষেধ করা', definitionEn: 'To forbid.' },
              { optionId: 'b', text: 'yield', word: 'yield', meaningBn: 'নতি স্বীকার করা', definitionEn: null },
              { optionId: 'c', text: 'desert', word: 'desert', meaningBn: 'ছেড়ে যাওয়া', definitionEn: null },
              { optionId: 'd', text: 'dispose of', word: 'dispose of', meaningBn: null, definitionEn: null },
            ],
          },
        },
      }),
    };
    render(<ReviewQuiz source={source} type="due" />);
    await user.click(await screen.findByRole('radio', { name: /ban/ }));
    const related = screen.getByTestId('related-words');
    expect(within(related).getByText('— ত্যাগ করা')).toBeInTheDocument();
    expect(within(related).getByText('— রাখা')).toBeInTheDocument();
    expect(within(related).getByText('retain')).toBeInTheDocument(); // not in the library: shown without a guessed meaning
    const opts = screen.getByTestId('option-meanings');
    expect(within(opts).getByText('— নিষেধ করা')).toBeInTheDocument();
    expect(within(opts).getByText('To forbid.')).toBeInTheDocument();
    expect(within(opts).getByText('— নতি স্বীকার করা')).toBeInTheDocument();
  });
});

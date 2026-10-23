/** Copy for the study page's learning path and question patterns. English + Bengali. */
const t = (en, bn) => ({ en, bn });

export const PATTERNS = Object.freeze({
  pathTitle: t('Your learning path', 'তোমার শেখার পথ'),
  path: {
    revise: { icon: '📘', title: t('Revise', 'ঝালিয়ে নাও'), sub: t('Formulas & tricks', 'সূত্র ও কৌশল') },
    patterns: { icon: '🧩', title: t('Learn patterns', 'প্যাটার্ন শেখো'), sub: t('Solved examples', 'সমাধান করা উদাহরণ') },
    practise: { icon: '✍️', title: t('Practise', 'অনুশীলন'), sub: t('MCQs, instant check', 'MCQ, সঙ্গে সঙ্গে উত্তর') },
    mock: { icon: '⏱️', title: t('Mock test', 'মক টেস্ট'), sub: t('Timed, like the exam', 'পরীক্ষার মতো, সময় ধরে') },
  },

  title: t('Question patterns', 'প্রশ্নের প্যাটার্ন'),
  sub: t(
    'Exams ask this chapter in a few fixed ways. Learn each pattern, watch it solved step by step, then try one yourself.',
    'পরীক্ষায় এই অধ্যায় থেকে কয়েকটি নির্দিষ্ট ধরনে প্রশ্ন আসে। প্রতিটি প্যাটার্ন শেখো, ধাপে ধাপে সমাধান দেখো, তারপর নিজে একটা চেষ্টা করো।',
  ),
  tried: (n, total) => t(`${n}/${total} tried`, `${total}টির মধ্যে ${n}টি চেষ্টা করেছ`),
  patternOf: (i, n) => t(`Pattern ${i} of ${n}`, `প্যাটার্ন ${i} / ${n}`),
  spot: t('How to spot it', 'কীভাবে চিনবে'),
  method: t('How to solve', 'কীভাবে সমাধান করবে'),
  example: t('Solved example', 'সমাধান করা উদাহরণ'),
  nextStep: (i, n) => t(`Show next step (${i}/${n})`, `পরের ধাপ দেখাও (${i}/${n})`),
  showAll: t('Show all', 'সব দেখাও'),
  answer: t('Answer', 'উত্তর'),
  yourTurn: t('Your turn! Guess the answer', 'এবার তোমার পালা! উত্তর আন্দাজ করো'),
  correct: t('Correct! Well done 🎉', 'ঠিক! দারুণ 🎉'),
  wrong: t('Not quite. See why below 👇', 'হলো না। নিচে কারণ দেখো 👇'),
  why: t('Why', 'কারণ'),
  tryAgain: t('Try again', 'আবার চেষ্টা করো'),
  prev: t('Previous pattern', 'আগের প্যাটার্ন'),
  next: t('Next pattern', 'পরের প্যাটার্ন'),
  toPractice: t('Now practise real questions', 'এবার আসল প্রশ্নে অনুশীলন করো'),
  allDone: t('You have tried every pattern. Time to practise! 💪', 'সব প্যাটার্ন চেষ্টা করা হয়ে গেছে। এবার অনুশীলনের পালা! 💪'),
});

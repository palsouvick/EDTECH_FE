/**
 * Copy for Mock Papers: pasted papers kept separate from the main question
 * bank, taken whole in a fresh random order every attempt. All new
 * user-facing strings for the section live here, bilingual en/bn, following
 * the t(en, bn) pattern of lib/stuckCopy.js. The paused banner reuses
 * MOCK.pausedTitle / MOCK.pausedHint from lib/i18n.js instead.
 */
const t = (en, bn) => ({ en, bn });

export const MP = Object.freeze({
  menu: t('Mock Papers', 'মক পেপার'),
  title: t('Mock Papers', 'মক পেপার'),
  subtitle: t(
    'Full papers pasted from groups and websites, taken whole in a fresh random order every time.',
    'গ্রুপ ও ওয়েবসাইট থেকে আনা পুরো প্রশ্নপত্র — প্রতিবার নতুন এলোমেলো ক্রমে পুরোটা দেওয়া যায়।',
  ),
  emptyTitle: t('No mock papers yet', 'এখনও কোনো মক পেপার নেই'),
  emptyBody: t(
    'Published mock papers will appear here. Check back soon.',
    'প্রকাশিত মক পেপার এখানে দেখা যাবে। পরে আবার দেখো।',
  ),
  backToList: t('Back to Mock Papers', 'মক পেপারে ফিরে যাও'),
  backToPaper: t('Back to the paper', 'প্রশ্নপত্রে ফিরে যাও'),
  notFoundTitle: t('Paper not found', 'প্রশ্নপত্র পাওয়া যায়নি'),
  notFoundBody: t(
    'This paper may be a draft, or the link may be wrong.',
    'এই প্রশ্নপত্রটি হয়তো এখনও খসড়া, অথবা লিঙ্কটি ভুল।',
  ),
  sourceLabel: (label) => t(`Source: ${label}`, `উৎস: ${label}`),
  questionsCount: (n) => t(n === 1 ? '1 question' : `${n} questions`, `${n}টি প্রশ্ন`),
  timeCount: (n) => t(n === 1 ? '1 minute' : `${n} minutes`, `${n} মিনিট`),
  attemptsLine: (count, best) =>
    t(
      best == null ? `${count} attempt${count === 1 ? '' : 's'}` : `${count} attempt${count === 1 ? '' : 's'} · Best: ${best}`,
      best == null ? `${count} বার চেষ্টা` : `${count} বার চেষ্টা · সেরা: ${best}`,
    ),
  noAttempts: t('No attempts yet', 'এখনও চেষ্টা করা হয়নি'),
  attemptsTitle: t('My attempts', 'আমার চেষ্টাগুলো'),
  attemptRow: (score, total, date) =>
    t(
      score == null ? `In progress · ${date}` : `Score ${score}/${total} · ${date}`,
      score == null ? `চলছে · ${date}` : `স্কোর ${score}/${total} · ${date}`,
    ),
  attemptStatus: {
    ACTIVE: t('In progress', 'চলছে'),
    SUBMITTED: t('Submitted', 'জমা দেওয়া হয়েছে'),
  },
  start: t('Start the mock', 'মক শুরু করো'),
  starting: t('Preparing your paper…', 'প্রশ্নপত্র তৈরি হচ্ছে…'),
  retake: t('Retake', 'আবার দাও'),
  resumeAttempt: t('Resume attempt', 'চেষ্টা চালিয়ে যাও'),
  viewResult: t('View result', 'ফলাফল দেখো'),

  // ---- Attempt run ----
  timeLeft: t('Time left', 'বাকি সময়'),
  questionOf: (i, n) => t(`Question ${i} of ${n}`, `${n}টির ${i} নম্বর প্রশ্ন`),
  previous: t('Previous', 'আগের'),
  next: t('Next', 'পরের'),
  palette: t('Question palette', 'প্রশ্ন তালিকা'),
  paletteQuestion: (n) => t(`Question ${n}`, `${n} নম্বর প্রশ্ন`),
  answered: t('Answered', 'উত্তর দেওয়া হয়েছে'),
  unanswered: t('Unanswered', 'উত্তর দেওয়া হয়নি'),
  current: t('Current', 'বর্তমান'),
  pause: t('Pause', 'বিরতি'),
  resume: t('Resume', 'আবার শুরু'),
  submit: t('Submit', 'জমা দিন'),
  submitting: t('Submitting…', 'জমা হচ্ছে…'),
  confirmTitle: t('Submit the mock?', 'মক জমা দেবে?'),
  confirmUnanswered: (n) =>
    t(
      n === 1 ? '1 question is still unanswered. It will be marked as unattempted.' : `${n} questions are still unanswered. They will be marked as unattempted.`,
      `${n}টি প্রশ্নের উত্তর দেওয়া হয়নি। সেগুলো উত্তর-না-দেওয়া হিসেবে ধরা হবে।`,
    ),
  confirmHint: t("You can't change answers after submitting.", 'জমা দেওয়ার পর উত্তর বদলানো যাবে না।'),
  confirmSubmit: t('Submit anyway', 'তবুও জমা দাও'),
  backToTest: t('Back to the test', 'পরীক্ষায় ফিরে যাও'),
  timeUp: t("Time's up!", 'সময় শেষ!'),
  submitFailed: t("Couldn't submit. Please try again.", 'জমা দেওয়া যায়নি। আবার চেষ্টা করো।'),
  loadFailed: t("Couldn't load this attempt.", 'এই চেষ্টাটি খোলা যায়নি।'),

  // ---- Result ----
  resultTitle: t('Result', 'ফলাফল'),
  scoreLine: (score, total) => t(`Score: ${score} / ${total}`, `স্কোর: ${score} / ${total}`),
  timeUsed: (sec) => t(`Time used: ${Math.floor(sec / 60)}m ${sec % 60}s`, `সময় লেগেছে: ${Math.floor(sec / 60)} মিনিট ${sec % 60} সেকেন্ড`),
  reviewTitle: t('Review', 'পর্যালোচনা'),
  correctAnswer: t('Correct answer', 'সঠিক উত্তর'),
  yourAnswer: t('Your answer', 'তোমার উত্তর'),
  correct: t('Correct ✓', 'সঠিক ✓'),
  wrong: t('Wrong', 'ভুল'),
  unattempted: t('Unattempted', 'উত্তর দেওয়া হয়নি'),
  explanation: t('Explanation', 'ব্যাখ্যা'),
  noAnswerGiven: t('No answer given', 'উত্তর দেওয়া হয়নি'),

  // ---- Admin ----
  adminTitle: t('Mock Papers', 'মক পেপার'),
  adminSubtitle: t(
    'Paste a paper, check the parsed questions, then publish. Papers stay separate from the main question bank.',
    'প্রশ্নপত্র পেস্ট করো, পার্স করা প্রশ্নগুলো দেখে নাও, তারপর প্রকাশ করো। পেপার মূল প্রশ্ন ব্যাংক থেকে আলাদা থাকে।',
  ),
  newPaper: t('New paper', 'নতুন পেপার'),
  paperTitleLabel: t('Title', 'শিরোনাম'),
  paperTitlePlaceholder: t('e.g. Clerkship mock 12', 'যেমন: ক্লার্কশিপ মক ১২'),
  sourceLabelLabel: t('Source label', 'উৎসের নাম'),
  sourceLabelPlaceholder: t('e.g. Telegram group X, 24 Nov 2026 mock', 'যেমন: টেলিগ্রাম গ্রুপ X, ২৪ নভেম্বর ২০২৬ মক'),
  subjectLabel: t('Subject (optional)', 'বিষয় (ঐচ্ছিক)'),
  subjectNone: t('No subject', 'কোনো বিষয় নয়'),
  subjects: {
    quant: t('Quant', 'গণিত'),
    english: t('English', 'ইংরেজি'),
    gs: t('General Studies', 'সাধারণ পাঠ'),
    reasoning: t('Reasoning', 'যুক্তি'),
    mixed: t('Mixed', 'মিশ্র'),
  },
  pasteLabel: t('Paste the paper text', 'প্রশ্নপত্রের লেখা পেস্ট করো'),
  pastePlaceholder: t(
    '1. What is the capital of West Bengal?\n(A) Delhi (B) Kolkata (C) Mumbai (D) Chennai\nAnswer: B\n\n2. …\nAnswer: …\n\nAnswers: 1-B, 2-A, …',
    '১. পশ্চিমবঙ্গের রাজধানী কোনটি?\n(A) দিল্লি (B) কলকাতা (C) মুম্বই (D) চেন্নাই\nAnswer: B\n\n২. …\nAnswer: …\n\nAnswers: 1-B, 2-A, …',
  ),
  pasteHint: t(
    'One question per number (1., Q1., 1)), options labelled (A)–(E) or 1.–5., an Answer: line per question or an Answers: key list at the end, and an optional Explanation: line.',
    'প্রতি প্রশ্নে একটি নম্বর (1., Q1., 1)), (A)–(E) বা 1.–5. লেবেলের অপশন, প্রতি প্রশ্নে Answer: লাইন বা শেষে Answers: তালিকা, আর ঐচ্ছিক Explanation: লাইন।',
  ),
  createDraft: t('Create draft', 'খসড়া তৈরি করো'),
  creating: t('Creating…', 'তৈরি হচ্ছে…'),
  createNeedsText: t('Paste the paper text first.', 'আগে প্রশ্নপত্রের লেখা পেস্ট করো।'),
  createNeedsTitle: t('Give the paper a title first.', 'আগে পেপারের শিরোনাম দাও।'),
  createNeedsSource: t('Give the paper a source label first.', 'আগে পেপারের উৎসের নাম দাও।'),
  listEmpty: t('No papers yet. Paste your first paper above.', 'এখনও কোনো পেপার নেই। উপরে প্রথম পেপারটি পেস্ট করো।'),
  draft: t('Draft', 'খসড়া'),
  published: t('Published', 'প্রকাশিত'),
  openReview: t('Review', 'পর্যালোচনা'),
  backToPapers: t('Back to papers', 'পেপারে ফিরে যাও'),
  save: t('Save changes', 'পরিবর্তন সংরক্ষণ করো'),
  saving: t('Saving…', 'সংরক্ষণ হচ্ছে…'),
  saved: t('Saved.', 'সংরক্ষিত হয়েছে।'),
  publish: t('Publish', 'প্রকাশ করো'),
  publishing: t('Publishing…', 'প্রকাশ হচ্ছে…'),
  unpublish: t('Unpublish', 'প্রকাশ তুলে নাও'),
  unpublishing: t('Unpublishing…', 'প্রকাশ তোলা হচ্ছে…'),
  deletePaper: t('Delete paper', 'পেপার মুছে ফেলো'),
  deleting: t('Deleting…', 'মোছা হচ্ছে…'),
  deleteConfirm: t('Delete this draft paper? This cannot be undone.', 'এই খসড়া পেপারটি মুছে ফেলবে? এটি আর ফেরানো যাবে না।'),
  questionsHeading: (n) => t(n === 1 ? '1 question' : `${n} questions`, `${n}টি প্রশ্ন`),
  questionHeading: (n) => t(`Question ${n}`, `${n} নম্বর প্রশ্ন`),
  stemEnLabel: t('Stem (English)', 'প্রশ্ন (ইংরেজি)'),
  stemBnLabel: t('Stem (Bengali)', 'প্রশ্ন (বাংলা)'),
  optionLabel: (letter) => t(`Option ${letter}`, `অপশন ${letter}`),
  addOption: t('Add option', 'অপশন যোগ করো'),
  removeOption: t('Remove option', 'অপশন সরিয়ে দাও'),
  correctAnswerLabel: t('Correct answer', 'সঠিক উত্তর'),
  noAnswer: t('No answer yet', 'এখনও উত্তর নেই'),
  explanationEnLabel: t('Explanation (English)', 'ব্যাখ্যা (ইংরেজি)'),
  explanationBnLabel: t('Explanation (Bengali)', 'ব্যাখ্যা (বাংলা)'),
  deleteQuestion: t('Delete question', 'প্রশ্ন মুছে ফেলো'),
  warningsLabel: t('Warnings', 'সতর্কতা'),
  warnings: {
    option_count: t('Not 4 options', '৪টি অপশন নয়'),
    duplicate_stem: t('Duplicate stem', 'একই প্রশ্ন দুবার আছে'),
    figure_reference: t('Mentions a figure / diagram / table', 'ছবি / চিত্র / টেবিলের উল্লেখ আছে'),
    answer_out_of_range: t('Answer letter is beyond the options', 'উত্তরের অক্ষর অপশনের বাইরে'),
  },
  missingAnswer: t('Answer missing', 'উত্তর নেই'),
  missingAnswerBanner: (n) =>
    t(
      n === 1 ? '1 question has no answer. Set its correct answer before publishing.' : `${n} questions have no answer. Set their correct answers before publishing.`,
      `${n}টি প্রশ্নের উত্তর নেই। প্রকাশ করার আগে সঠিক উত্তর ঠিক করো।`,
    ),
  unparsedHeading: (n) => t(n === 1 ? '1 unparsed block' : `${n} unparsed blocks`, `${n}টি পার্স হয়নি এমন অংশ`),
  unparsedHint: t(
    'These parts could not be parsed. Fix them by adding the question above, or discard the block. A paper with unparsed blocks cannot be published.',
    'এই অংশগুলো পার্স করা যায়নি। উপরে প্রশ্ন যোগ করে ঠিক করো, অথবা অংশটি বাদ দাও। পার্স-হয়নি অংশ থাকলে পেপার প্রকাশ করা যাবে না।',
  ),
  discardBlock: t('Discard block', 'অংশটি বাদ দাও'),
  publishBlocked: t('Publishing is blocked', 'প্রকাশ করা যাবে না'),
  blockedEmpty: t('The paper has no questions yet.', 'পেপারে এখনও কোনো প্রশ্ন নেই।'),
  blockedMissingAnswers: (n) =>
    t(
      n === 1 ? '1 question is missing its answer.' : `${n} questions are missing their answers.`,
      `${n}টি প্রশ্নের উত্তর নেই।`,
    ),
  blockedUnparsed: (n) =>
    t(
      n === 1 ? '1 block could not be parsed.' : `${n} blocks could not be parsed.`,
      `${n}টি অংশ পার্স করা যায়নি।`,
    ),
  publishedNote: t(
    'This paper is published. To correct it, unpublish it first — published papers are never edited underneath student attempts.',
    'এই পেপারটি প্রকাশিত। ঠিক করতে হলে আগে প্রকাশ তুলে নাও — প্রকাশিত পেপার ছাত্রদের চেষ্টার নিচে বদলানো হয় না।',
  ),
  createdAt: (date) => t(`Created ${date}`, `তৈরি: ${date}`),
});

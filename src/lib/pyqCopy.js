/** Copy for the previous-year question (PYQ) hub and badge. English + Bengali. */
const t = (en, bn) => ({ en, bn });
const bnDigits = (n) => String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[d]);

/** How far a PYQ's answer and text can be trusted (server: questionProvenance.pyqRefBasis). */
export const PYQ_BASIS = Object.freeze({
  OFFICIAL_KEY: {
    label: t('Official answer key', 'সরকারি উত্তরমালা'),
    hint: t("The answer is the one in the Commission's final answer key.", 'উত্তরটি কমিশনের চূড়ান্ত উত্তরমালা অনুযায়ী।'),
    tone: 'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30',
  },
  CROSS_CHECKED: {
    label: t('Answer cross-checked · no official key', 'উত্তর মিলিয়ে দেখা · সরকারি উত্তরমালা নেই'),
    hint: t(
      "The Commission's answer key for this paper is not available. The answer was cross-checked against independent sources, so treat it with a little care.",
      'এই প্রশ্নপত্রের সরকারি উত্তরমালা পাওয়া যায় না। উত্তরটি স্বাধীন সূত্রের সঙ্গে মিলিয়ে দেখা হয়েছে, তাই একটু সাবধানে ব্যবহার করো।',
    ),
    tone: 'bg-sky-50 text-sky-800 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/30',
  },
  UNOFFICIAL_COPY: {
    label: t('Paper text from an unofficial copy', 'প্রশ্নপত্রের বেসরকারি প্রতিলিপি'),
    hint: t(
      'The Commission did not publish this paper, so the question text comes from an unofficial copy.',
      'কমিশন এই প্রশ্নপত্র প্রকাশ করেনি, তাই প্রশ্নের লেখা একটি বেসরকারি প্রতিলিপি থেকে নেওয়া।',
    ),
    tone: 'bg-violet-50 text-violet-800 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/30',
  },
});

/** The note a badge shows for a ref; nothing for the plain official case. */
export function basisNotes(ref) {
  const notes = [];
  if (ref?.answerBasis === 'CROSS_CHECKED') notes.push(PYQ_BASIS.CROSS_CHECKED);
  if (ref?.paperBasis === 'UNOFFICIAL_COPY') notes.push(PYQ_BASIS.UNOFFICIAL_COPY);
  return notes;
}

export const PYQ = Object.freeze({
  pageTitle: t("WBPSC Previous Years' Questions (PYQ)", 'WBPSC আগের বছরের প্রশ্ন (PYQ)'),
  heroSub: t(
    'Real questions from WBCS Preliminary and WBPSC Clerkship papers. Practise one question at a time with the answer and explanation straight after. Every paper shows where its questions and answers come from.',
    'WBCS প্রিলিমিনারি ও WBPSC ক্লার্কশিপের আসল প্রশ্ন। একটি করে প্রশ্ন অনুশীলন করো, সঙ্গে সঙ্গে উত্তর ও ব্যাখ্যা দেখো। প্রতিটি প্রশ্নপত্রের প্রশ্ন ও উত্তর কোথা থেকে নেওয়া, তা লেখা আছে।',
  ),
  totals: (q, p) => t(`${q} questions from ${p} papers`, `${bnDigits(p)}টি প্রশ্নপত্র থেকে ${bnDigits(q)}টি প্রশ্ন`),
  examWise: t('Exam wise PYQ', 'পরীক্ষাভিত্তিক PYQ'),
  examWiseSub: t('Every paper of one exam in one place — pick a year and session to practise the full paper.', 'একটি পরীক্ষার সব প্রশ্নপত্র এক জায়গায় — বছর ও সেশন বেছে পুরো প্রশ্নপত্রটি অনুশীলন করো।'),
  byYear: t('Year-wise papers', 'বছরভিত্তিক প্রশ্নপত্র'),
  byYearSub: t('Attempt a whole paper in its printed order.', 'পুরো প্রশ্নপত্র ছাপা ক্রমে অনুশীলন করো।'),
  byTopic: t('Topic-wise sets', 'বিষয়ভিত্তিক সেট'),
  byTopicSub: t('All years together for one chapter. The small numbers show how many questions each year asked.', 'একটি অধ্যায়ের সব বছরের প্রশ্ন একসঙ্গে। ছোট সংখ্যাগুলি দেখায় কোন বছরে কতগুলি প্রশ্ন এসেছে।'),
  subject: t('Subject', 'বিষয়'),
  questions: (n) => t(`${n} questions`, `${bnDigits(n)}টি প্রশ্ন`),
  paper: t('Question paper', 'প্রশ্নপত্র'),
  answerKey: t('Answer key', 'উত্তরমালা'),
  noKey: t('No official key', 'সরকারি উত্তরমালা নেই'),
  practise: t('Practise', 'অনুশীলন করো'),
  back: t('Choose another set', 'অন্য সেট বেছে নাও'),
  practising: t('Practising', 'অনুশীলন চলছে'),
  basisNote: t(
    'Older papers (2015–2019) have no surviving official answer key, so their answers are marked as cross-checked. Questions that the Commission cancelled are left out. Explanations are ours.',
    'পুরোনো প্রশ্নপত্রের (২০১৫–২০১৯) সরকারি উত্তরমালা আর পাওয়া যায় না, তাই সেগুলির উত্তর "মিলিয়ে দেখা" হিসেবে চিহ্নিত। কমিশন যে প্রশ্ন বাতিল করেছে তা বাদ দেওয়া হয়েছে। ব্যাখ্যা আমাদের লেখা।',
  ),
  sourcesLink: t("WBPSC's previous-year paper page", 'WBPSC-র আগের বছরের প্রশ্নপত্রের পাতা'),
  empty: t('No previous-year papers are available yet.', 'এখনও কোনো আগের বছরের প্রশ্নপত্র নেই।'),
  noTopicTitle: t('No previous-year questions on this chapter yet', 'এই অধ্যায়ে এখনও আগের বছরের কোনো প্রশ্ন নেই'),
  noTopicBody: t(
    'The WBPSC papers we have do not ask from this chapter yet. Choose another set to practise.',
    'আমাদের কাছে থাকা WBPSC প্রশ্নপত্রে এই অধ্যায় থেকে প্রশ্ন আসেনি। অন্য একটি সেট বেছে নাও।',
  ),
  endTitle: t('You have finished this set', 'এই সেট শেষ করেছ'),
  endBody: t('Mistakes are saved to your Mistake Notebook when you are signed in.', 'সাইন ইন থাকলে ভুল উত্তরগুলি তোমার ভুলের খাতায় জমা থাকে।'),

  // Subject-wise PYQ practice tests (preset 'pyq'): one subject, real papers only.
  practiceBySubject: t('Practise PYQs by subject', 'বিষয় ধরে PYQ অনুশীলন'),
  practiceBySubjectSub: t('Pick a subject and build a timed test from real past-paper questions only — never generated questions.', 'একটি বিষয় বেছে আসল আগের বছরের প্রশ্ন দিয়ে সময় বেঁধে টেস্ট বানাও — কখনও বানানো প্রশ্ন নয়।'),
  subjectNames: {
    quant: t('Mathematics', 'গণিত'),
    english: t('English', 'ইংরেজি'),
    gs: t('GK / General Studies', 'GK / সাধারণ অধ্যয়ন'),
  },
  subjectHints: {
    quant: t('WBCS, Clerkship and IDO papers', 'WBCS, ক্লার্কশিপ ও IDO প্রশ্নপত্র'),
    english: t('WBCS, Clerkship and IDO papers', 'WBCS, ক্লার্কশিপ ও IDO প্রশ্নপত্র'),
    gs: t('WBCS, Clerkship and IDO papers', 'WBCS, ক্লার্কশিপ ও IDO প্রশ্নপত্র'),
  },
  nPyqsAvailable: (n) => t(`${n} PYQs available`, `${bnDigits(n)}টি PYQ আছে`),
  startPractice: t('Start PYQ practice', 'PYQ অনুশীলন শুরু করো'),
  setupTitle: t('Build your PYQ test', 'তোমার PYQ টেস্ট বানাও'),
  examLabel: t('Exam', 'পরীক্ষা'),
  examAll: t('All West Bengal Exams', 'পশ্চিমবঙ্গের সব পরীক্ষা'),
  countLabel: t('Number of questions', 'প্রশ্নের সংখ্যা'),
  customCountLabel: t('Custom number of questions (5–100)', 'প্রশ্নের সংখ্যা (৫–১০০)'),
  timeLabel: t('Test time', 'টেস্টের সময়'),
  customTimeLabel: t('Custom time in minutes (1–300)', 'সময়, মিনিটে (১–৩০০)'),
  timeTooShort: t('Give at least 10 seconds per question.', 'প্রতি প্রশ্নে অন্তত ১০ সেকেন্ড দাও।'),
  difficultyLabel: t('Difficulty', 'কাঠিন্য'),
  yearLabel: t('Year', 'বছর'),
  yearAll: t('All years', 'সব বছর'),
  yearRecent: t('Recent years', 'সাম্প্রতিক বছরগুলো'),
  yearRecentHint: t('The 5 most recent years in this subject', 'এই বিষয়ের সবচেয়ে সাম্প্রতিক ৫ বছর'),
  yearOne: t('One year', 'একটি বছর'),
  yearRange: t('Year range', 'বছরের সীমা'),
  yearFrom: t('From year', 'কোন বছর থেকে'),
  yearTo: t('To year', 'কোন বছর পর্যন্ত'),
  yearRangeInvalid: t('The range starts after it ends.', 'সীমার শুরু শেষের পরে।'),
  repeatLabel: t('Which PYQs?', 'কোন PYQ গুলো?'),
  repeatModes: {
    all: { label: t('All PYQs', 'সব PYQ'), hint: t('Any past-paper question, including ones you have seen', 'দেখা প্রশ্ন সহ যেকোনো আগের বছরের প্রশ্ন') },
    unattempted: { label: t('Unattempted only', 'শুধু না-করা'), hint: t('Only PYQs you have never answered', 'শুধু যে PYQ গুলোর উত্তর কখনও দাওনি') },
    wrong: { label: t('Wrong only', 'শুধু ভুল'), hint: t('Only PYQs you got wrong and have not mastered', 'শুধু যে PYQ গুলো ভুল করেছ এবং এখনও শোধরাওনি') },
    bookmarked: { label: t('Bookmarked only', 'শুধু বুকমার্ক'), hint: t('Only PYQs you bookmarked for revision', 'শুধু যে PYQ গুলো রিভিশনের জন্য বুকমার্ক করেছ') },
  },
  markingNote: t('Practice marking: +1 correct, 0 for wrong — no negative marking', 'প্র্যাকটিস নম্বর: সঠিকে +১, ভুলে ০ — কোনো নেগেটিভ মার্কিং নেই'),
  markingWhy: t('One test can mix WBCS (−⅓) and Clerkship (−0.25) papers, so no single official scheme applies.', 'একটি টেস্টে WBCS (−⅓) ও ক্লার্কশিপ (−০.২৫) দুটোই থাকতে পারে, তাই কোনো একক সরকারি নিয়ম চলে না।'),
  availableNow: (n) => t(`${n} PYQs match these filters`, `${bnDigits(n)}টি PYQ এই শর্তে মিলছে`),
  onlyAvailable: (have, want) => t(`Only ${have} PYQs match (you asked for ${want}). The test will start with ${have}.`, `মাত্র ${bnDigits(have)}টি PYQ মিলছে (তুমি চেয়েছিলে ${bnDigits(want)}টি)। টেস্ট ${bnDigits(have)}টি প্রশ্ন দিয়েই শুরু হবে।`),
  tooFew: (n) => t(`Only ${n} PYQs match — too few for a test (at least 5 needed). Loosen a filter.`, `মাত্র ${bnDigits(n)}টি PYQ মিলছে — টেস্টের জন্য কম (অন্তত ৫টি লাগবে)। শর্ত একটু হালকা করো।`),
  startWith: (n) => t(`Start test with ${n} questions`, `${bnDigits(n)}টি প্রশ্ন দিয়ে টেস্ট শুরু করো`),
  startTest: t('Start test', 'টেস্ট শুরু করো'),
  startingTest: t('Building your test…', 'তোমার টেস্ট তৈরি হচ্ছে…'),
  loadingPreview: t('Counting matching PYQs…', 'মিলে যাওয়া PYQ গুনছি…'),
  signInForPyq: t('Sign in to build a PYQ test', 'PYQ টেস্ট বানাতে সাইন ইন করো'),
});

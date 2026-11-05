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
      'The Commission did not publish this paper, so the question text comes from an unofficial copy. The answer is from the official key.',
      'কমিশন এই প্রশ্নপত্র প্রকাশ করেনি, তাই প্রশ্নের লেখা একটি বেসরকারি প্রতিলিপি থেকে নেওয়া। উত্তর সরকারি উত্তরমালা থেকে।',
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
  endTitle: t('You have finished this set', 'এই সেট শেষ করেছ'),
  endBody: t('Mistakes are saved to your Mistake Notebook when you are signed in.', 'সাইন ইন থাকলে ভুল উত্তরগুলি তোমার ভুলের খাতায় জমা থাকে।'),
});

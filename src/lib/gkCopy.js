/** Copy for the GK (General Knowledge / সাধারণ জ্ঞান) section. English + Bengali. */
const t = (en, bn) => ({ en, bn });
const bnDigits = (n) => String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[d]);

export const GK = Object.freeze({
  tab: t('General Knowledge', 'সাধারণ জ্ঞান'),
  pageTitle: t('General Knowledge (GK)', 'সাধারণ জ্ঞান (GK)'),
  heroSub: t(
    'Facts for WBPSC Clerkship, WBCS, SSC, Railway and banking exams, each with the official page it comes from. Read a fact, then practise the questions on it.',
    'WBPSC ক্লার্কশিপ, WBCS, SSC, রেল ও ব্যাংক পরীক্ষার জন্য তথ্য — প্রতিটির সঙ্গে সেই সরকারি পাতা যেখান থেকে তথ্যটি নেওয়া। তথ্য পড়ো, তারপর সেই বিষয়ে প্রশ্ন অনুশীলন করো।',
  ),
  facts: (n) => t(`${n} facts`, `${bnDigits(n)}টি তথ্য`),
  questions: (n) => t(`${n} questions`, `${bnDigits(n)}টি প্রশ্ন`),
  sourceVerifiedQuestions: (n, total) => t(`${n} of ${total} questions source-checked`, `${bnDigits(total)}টির মধ্যে ${bnDigits(n)}টি প্রশ্নের সূত্র যাচাই হয়েছে`),
  alsoTagged: (n) => t(`+${n} West Bengal facts from other cards`, `অন্য বিভাগ থেকে আরও ${bnDigits(n)}টি পশ্চিমবঙ্গ-সংক্রান্ত তথ্য`),
  noFactsYet: t('Facts for this card are being prepared and checked.', 'এই বিভাগের তথ্য তৈরি ও যাচাই চলছে।'),
  yourProgress: t('Your practice', 'তোমার অনুশীলন'),
  progressLine: (attempted, accuracy) => t(
    `${attempted} questions tried${accuracy == null ? '' : ` · ${accuracy}% correct`}`,
    `${bnDigits(attempted)}টি প্রশ্ন চেষ্টা করেছ${accuracy == null ? '' : ` · ${bnDigits(accuracy)}% সঠিক`}`,
  ),
  notStarted: t('Not started yet', 'এখনও শুরু করোনি'),
  signInForProgress: t('Sign in to keep your progress on every device.', 'সব ডিভাইসে অগ্রগতি রাখতে সাইন ইন করো।'),
  open: t('Open', 'খোলো'),
  back: t('All GK cards', 'সব GK বিভাগ'),

  readTitle: t('Read and learn', 'পড়ো ও শেখো'),
  practiceTitle: t('Practise', 'অনুশীলন'),
  practiceSub: t('Quizzes use the same questions as the exam practice pages. Mistakes go to your Mistake Notebook and revision queue.', 'কুইজে পরীক্ষা-অনুশীলনের প্রশ্নই আসে। ভুল উত্তর তোমার ভুলের খাতা ও রিভিশনে যোগ হয়।'),
  all: t('All', 'সব'),
  search: t('Search facts', 'তথ্য খোঁজো'),
  searchPlaceholder: t('Search in English or বাংলা…', 'বাংলা বা English-এ খোঁজো…'),
  difficulty: t('Difficulty', 'কাঠিন্য'),
  easy: t('Easy', 'সহজ'),
  medium: t('Medium', 'মাঝারি'),
  hard: t('Hard', 'কঠিন'),
  month: t('Month', 'মাস'),
  anyMonth: t('Any month', 'যেকোনো মাস'),
  loadMore: t('Show more facts', 'আরও তথ্য দেখো'),
  showing: (n, total) => t(`Showing ${n} of ${total}`, `${bnDigits(total)}টির মধ্যে ${bnDigits(n)}টি দেখানো হচ্ছে`),
  noMatch: t('No fact matches these filters.', 'এই ফিল্টারে কোনো তথ্য নেই।'),
  more: t('Why it matters', 'বিস্তারিত'),
  sources: t('Source', 'সূত্র'),
  milestones: t('Timeline', 'সময়রেখা'),
  eventDate: t('Event date', 'ঘটনার তারিখ'),
  validFrom: t('Current as of', 'যে তারিখ থেকে প্রযোজ্য'),
  reviewBy: t('Next check due', 'পরবর্তী যাচাই'),
  referenceYear: (y) => t(`Figures refer to ${y}`, `পরিসংখ্যান ${bnDigits(y)} সালের`),
  changing: t('Can change', 'পরিবর্তনশীল'),

  // Labels. Exactly one meaning each; never stronger than the data behind it.
  verified: t('Verified from source', 'সূত্র থেকে যাচাই করা'),
  verifiedOn: (date) => t(`Checked against the source on ${date}`, `${date} তারিখে সূত্রের সঙ্গে মিলিয়ে দেখা হয়েছে`),
  bengaliPending: t('Bengali translation pending review', 'বাংলা অনুবাদ পর্যালোচনার অপেক্ষায়'),
  bengaliReviewed: t('Bengali reviewed', 'বাংলা পর্যালোচিত'),
  milestoneKinds: {
    PROPOSED: t('Proposed', 'প্রস্তাব'),
    FOUNDATION: t('Foundation stone', 'ভিত্তিপ্রস্তর'),
    CONSTRUCTED: t('Construction', 'নির্মাণ'),
    INAUGURATED: t('Inaugurated', 'উদ্বোধন'),
    COMMERCIAL_OPERATION: t('Commercial operation', 'বাণিজ্যিক চলাচল'),
    ADOPTED: t('Adopted', 'গৃহীত'),
    NOTIFIED: t('Notified', 'বিজ্ঞপ্তি জারি'),
    ENACTED: t('Enacted', 'আইন পাস'),
    IN_FORCE: t('In force', 'কার্যকর'),
    LAUNCHED: t('Launched', 'উৎক্ষেপণ / চালু'),
    EVENT: t('Event', 'ঘটনা'),
  },
});

/** The source-check label on a General Studies question. */
export const SOURCE_CHECK = Object.freeze({
  SOURCE_VERIFIED: {
    label: t('Source verified', 'সূত্র যাচাই করা'),
    hint: t('The answer was checked against the linked source.', 'উত্তরটি লিঙ্ক করা সূত্রের সঙ্গে মিলিয়ে দেখা হয়েছে।'),
    tone: 'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/30',
  },
  SOURCE_PENDING: {
    label: t('Practice question · source pending', 'অনুশীলনের প্রশ্ন · সূত্র যাচাই বাকি'),
    hint: t('Not yet checked against an official source.', 'এখনও সরকারি সূত্রের সঙ্গে মিলিয়ে দেখা হয়নি।'),
    tone: 'bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700',
  },
  NEEDS_REVIEW: {
    label: t('Under review', 'পর্যালোচনাধীন'),
    hint: t('An editor flagged this question for checking.', 'একজন সম্পাদক প্রশ্নটি যাচাইয়ের জন্য চিহ্নিত করেছেন।'),
    tone: 'bg-amber-50 text-amber-900 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/30',
  },
});

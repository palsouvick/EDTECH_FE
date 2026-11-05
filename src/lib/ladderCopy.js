/** Copy for the Learn ladder, study modes, Zero → Exam journey and weakness coach. English + Bengali. */
const t = (en, bn) => ({ en, bn });
const bnDigits = (n) => String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[d]);

export const LADDER_COPY = Object.freeze({
  title: t('Your ladder in this chapter', 'এই অধ্যায়ে তোমার সিঁড়ি'),
  sub: t('Climb one level at a time. A level opens when you reach 60% in the one before it.', 'একবারে এক ধাপ ওঠো। আগের ধাপে ৬০% পেলে পরের ধাপ খোলে।'),
  levelN: (n) => t(`Level ${n}`, `ধাপ ${bnDigits(n)}`),
  done: t('Done', 'হয়ে গেছে'),
  now: t('You are here', 'তুমি এখানে'),
  locked: t('Locked', 'বন্ধ'),
  none: t('No past-paper questions for this chapter yet', 'এই অধ্যায়ে এখনও আগের প্রশ্ন নেই'),
  unlocksAfter: (n) => t(`Opens after Level ${n}`, `ধাপ ${bnDigits(n)}-এর পরে খুলবে`),
  signInFor: t('Sign in so this level can be counted', 'এই ধাপ গোনার জন্য সাইন ইন করো'),
  steps: {
    beginner: { icon: '🌱', title: t('Beginner', 'শুরু'), what: t('Understand the idea: read the Basic lesson.', 'ধারণাটা বোঝো: বেসিক পাঠ পড়ো।'), action: t('Read the lesson', 'পাঠ পড়ো') },
    easy: { icon: '🟢', title: t('Easy practice', 'সহজ অনুশীলন'), what: t('Simple questions: Beginner quiz, 60% to pass.', 'সহজ প্রশ্ন: বিগিনার কুইজ, পাস ৬০%।'), action: t('Beginner quiz', 'বিগিনার কুইজ') },
    competitive: { icon: '🟡', title: t('Competitive practice', 'প্রতিযোগিতার অনুশীলন'), what: t('Apply the concept: Intermediate lesson and quiz.', 'ধারণা প্রয়োগ: ইন্টারমিডিয়েট পাঠ ও কুইজ।'), action: t('Intermediate quiz', 'ইন্টারমিডিয়েট কুইজ') },
    advanced: { icon: '🟠', title: t('Advanced', 'উচ্চতর'), what: t('Tricky questions: Advanced lesson and quiz.', 'জটিল প্রশ্ন: অ্যাডভান্সড পাঠ ও কুইজ।'), action: t('Advanced quiz', 'অ্যাডভান্সড কুইজ') },
    exam: { icon: '🔴', title: t('Exam level', 'পরীক্ষার মান'), what: t('Timed, exam-style questions until this chapter shows "strong".', 'সময় ধরে পরীক্ষার ধাঁচের প্রশ্ন, যতক্ষণ না অধ্যায়টি "শক্তিশালী" দেখায়।'), action: t('Exam mode', 'পরীক্ষা মোড') },
    pyq: { icon: '🏆', title: t('PYQ challenge', 'আগের প্রশ্নের চ্যালেঞ্জ'), what: t('Real WBPSC past-paper questions: answer 10, solve 60%.', 'আসল WBPSC আগের প্রশ্ন: ১০টির উত্তর দাও, ৬০% সঠিক।'), action: t('Past-paper questions', 'আগের প্রশ্ন') },
  },
  pyqCount: (solved, attempted, total) => t(`${solved} solved · ${attempted} of ${total} answered`, `${bnDigits(solved)}টি সঠিক · ${bnDigits(total)}টির মধ্যে ${bnDigits(attempted)}টির উত্তর`),
  best: (c, n) => t(`Best ${c}/${n}`, `সেরা ${bnDigits(c)}/${bnDigits(n)}`),
});

export const MODES = Object.freeze({
  label: t('How do you want to study?', 'কীভাবে পড়তে চাও?'),
  quick: { title: t('Quick', 'দ্রুত'), hint: t('Short idea, one example, 5 questions', 'ছোট ধারণা, একটি উদাহরণ, ৫টি প্রশ্ন') },
  detailed: { title: t('Detailed', 'বিস্তারিত'), hint: t('The full lesson, step by step', 'পুরো পাঠ, ধাপে ধাপে') },
  practice: { title: t('Practice', 'অনুশীলন'), hint: t('Only questions, with instant explanations', 'শুধু প্রশ্ন, সঙ্গে সঙ্গে ব্যাখ্যা') },
  revision: { title: t('Revision', 'রিভিশন'), hint: t('Rules, shortcuts and your own mistakes', 'নিয়ম, শর্টকাট ও তোমার নিজের ভুল') },
  exam: { title: t('Exam', 'পরীক্ষা'), hint: t('Timed questions with exam marking', 'পরীক্ষার নিয়মে সময় ধরে প্রশ্ন') },
  quickExample: t('One worked example', 'একটি সমাধান করা উদাহরণ'),
  quickPractice: t('Now try 5 questions', 'এবার ৫টি প্রশ্ন চেষ্টা করো'),
  rules: t('Rules and formulas', 'নিয়ম ও সূত্র'),
  tips: t('Remember / common mistakes', 'মনে রাখো / সাধারণ ভুল'),
  yourMistakes: t('Your mistakes in this chapter', 'এই অধ্যায়ে তোমার ভুল'),
  noMistakes: t('No mistakes saved in this chapter yet.', 'এই অধ্যায়ে এখনও কোনো ভুল জমা নেই।'),
  signInMistakes: t('Sign in to see your own mistakes here.', 'নিজের ভুল এখানে দেখতে সাইন ইন করো।'),
  correctAnswer: t('Correct answer', 'সঠিক উত্তর'),
  allMistakes: t('Open the Mistake Notebook', 'ভুলের খাতা খোলো'),
  examIntro: t(
    'A timed test on this chapter only, marked like the exam. Choose the number of questions and the timer in the next step.',
    'শুধু এই অধ্যায়ের সময়-বাঁধা পরীক্ষা, পরীক্ষার নিয়মে নম্বর। পরের ধাপে প্রশ্নের সংখ্যা ও সময় বেছে নাও।',
  ),
  startExam: t('Set up the timed test', 'সময়-বাঁধা পরীক্ষা সাজাও'),
});

export const JOURNEY_COPY = Object.freeze({
  title: t('From zero to exam ready', 'শূন্য থেকে পরীক্ষার জন্য তৈরি'),
  stages: {
    beginner: t('🌱 Beginner', '🌱 শুরু'),
    foundation: t('📘 Foundation', '📘 ভিত্তি'),
    concepts: t('🧠 Concept mastery', '🧠 ধারণায় দক্ষতা'),
    practice: t('✍️ Practice', '✍️ অনুশীলন'),
    competitive: t('🔥 Competitive level', '🔥 প্রতিযোগিতার মান'),
    pyqMastery: t('🏆 PYQ mastery', '🏆 আগের প্রশ্নে দক্ষতা'),
    examReady: t('🎯 Exam ready', '🎯 পরীক্ষার জন্য তৈরি'),
  },
  youAreAt: t('You are at', 'তুমি আছ'),
  counts: (lv2, lv4, total) => t(
    `${lv2} of ${total} chapters past Easy practice · ${lv4} past Advanced`,
    `${bnDigits(total)}টির মধ্যে ${bnDigits(lv2)}টি অধ্যায় সহজ অনুশীলন পার · ${bnDigits(lv4)}টি উচ্চতর পার`,
  ),
  nextChapter: t('Study next', 'এরপর পড়ো'),
  atLevel: (n) => t(`Level ${n}`, `ধাপ ${bnDigits(n)}`),
  rule: t(
    'Each stage needs most chapters at that level: half the chapters for Concept mastery, Practice and Competitive; 80% for Exam ready.',
    'প্রতিটি পর্যায়ে বেশিরভাগ অধ্যায় সেই ধাপে থাকতে হয়: ধারণায় দক্ষতা, অনুশীলন ও প্রতিযোগিতার মানে অর্ধেক অধ্যায়; পরীক্ষার জন্য তৈরিতে ৮০%।',
  ),
});

export const COACH = Object.freeze({
  title: t('Where you stand', 'তুমি কোথায় দাঁড়িয়ে'),
  signIn: t('Sign in to see your accuracy in every chapter and what to fix first.', 'প্রতিটি অধ্যায়ে নির্ভুলতা ও আগে কী ঠিক করতে হবে দেখতে সাইন ইন করো।'),
  notEnough: t('Answer at least 5 questions in a chapter to see it here.', 'এখানে দেখতে কোনো অধ্যায়ে অন্তত ৫টি প্রশ্নের উত্তর দাও।'),
  weakest: (name) => ({ en: `Your weakest chapter is ${name.en}.`, bn: `তোমার সবচেয়ে দুর্বল অধ্যায় ${name.bn ?? name.en}।` }),
  prescription: t('Revise it for 20 minutes, then solve 10 practice questions.', '২০ মিনিট রিভিশন করো, তারপর ১০টি অনুশীলন প্রশ্ন সমাধান করো।'),
  revise: t('Revise (20 min)', 'রিভিশন (২০ মিনিট)'),
  practise: t('Practise 10', '১০টি অনুশীলন'),
  repairTitle: t('Repair set', 'মেরামতের সেট'),
  repair: (name, n) => ({ en: `${n} mistakes in ${name.en} this week: practise 10 more questions there.`, bn: `এই সপ্তাহে ${name.bn ?? name.en}-এ ${bnDigits(n)}টি ভুল: সেখানে আরও ১০টি প্রশ্ন অনুশীলন করো।` }),
  band: { good: '✅', fair: '🟡', weak: '🔴' },
});

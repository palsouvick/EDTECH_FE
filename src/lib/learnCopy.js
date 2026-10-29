/** Copy for the Learn section: home, subject, chapter and quiz pages. English + Bengali. */
const t = (en, bn) => ({ en, bn });

export const LEARN = Object.freeze({
  brandTagline: t('Learn Math and English step by step, in English and বাংলা.', 'ধাপে ধাপে গণিত ও ইংরেজি শেখো — বাংলা ও English-এ।'),
  homeBadge: t('Free · English + বাংলা', 'বিনামূল্যে · বাংলা + English'),
  homeTitle: t('What do you want to learn today?', 'আজ কী শিখবে?'),
  homeSub: t(
    'Pick a subject. Every chapter starts from the very basics, with easy examples, and ends with quizzes.',
    'একটি বিষয় বেছে নাও। প্রতিটি অধ্যায় একদম গোড়া থেকে শুরু হয়, সহজ উদাহরণসহ, আর শেষে থাকে কুইজ।',
  ),
  chapters: (n) => t(`${n} chapters`, `${n}টি অধ্যায়`),
  questions: (n) => t(`${n} practice questions`, `${n}টি অনুশীলনের প্রশ্ন`),
  start: t('Start learning', 'শেখা শুরু করো'),
  howTitle: t('How it works', 'কীভাবে শিখবে'),
  steps: [
    { icon: '📖', title: t('Read the lesson', 'পাঠ পড়ো'), body: t('Basic first, then intermediate, then advanced. Each idea comes with a worked example.', 'আগে সহজ, তারপর মাঝারি, তারপর কঠিন। প্রতিটি ধারণার সঙ্গে সমাধান করা উদাহরণ।') },
    { icon: '✏️', title: t('Take a quiz', 'কুইজ দাও'), body: t('Beginner and intermediate have no timer. Advanced is timed, like a real exam.', 'সহজ ও মাঝারি স্তরে কোনো টাইমার নেই। কঠিন স্তরে টাইমার আছে, আসল পরীক্ষার মতো।') },
    { icon: '✅', title: t('See every answer explained', 'প্রতিটি উত্তরের ব্যাখ্যা দেখো'), body: t('After the quiz, see what was right, what was wrong and why.', 'কুইজের পরে দেখো কোনটা ঠিক, কোনটা ভুল, আর কেন।') },
    { icon: '🔁', title: t('Try again with new questions', 'নতুন প্রশ্নে আবার চেষ্টা করো'), body: t('Each new attempt gives you questions you have not seen yet.', 'প্রতিবার নতুন চেষ্টায় এমন প্রশ্ন পাবে যা আগে দেখোনি।') },
  ],

  pageTitle: t('Learn Basics', 'বেসিক শেখো'),
  hello: t('Hi there! 👋', 'নমস্কার! 👋'),
  heroSub: t(
    'Pick a chapter, read a short lesson with easy examples, then play the quizzes. Start with Beginner: small steps every day make you strong.',
    'একটা অধ্যায় বেছে নাও, সহজ উদাহরণসহ ছোট্ট পাঠটা পড়ো, তারপর কুইজ খেলো। Beginner দিয়ে শুরু করো — রোজ একটু একটু করেই তুমি পাকা হয়ে উঠবে।',
  ),
  journey: [
    { icon: '📖', label: t('Read', 'পড়ো') },
    { icon: '✏️', label: t('Practise', 'অনুশীলন করো') },
    { icon: '🏆', label: t('Level up', 'এগিয়ে যাও') },
  ],
  yourProgress: t('Your progress', 'তোমার অগ্রগতি'),
  levelsCleared: (n, total) => t(`${n} of ${total} levels cleared`, `${total}টির মধ্যে ${n}টি স্তর পার করেছ`),
  progressHint: t('Score 60% or more in a quiz to clear its level.', 'কোনো কুইজে ৬০% বা তার বেশি পেলে সেই স্তর পার।'),
  continueLabel: t('Continue where you left off', 'যেখানে থেমেছিলে সেখান থেকে'),
  searchLabel: t('Find a chapter', 'অধ্যায় খোঁজো'),
  searchPlaceholder: t('Search chapters…', 'অধ্যায় খোঁজো…'),
  noMatch: t('No chapter matches your search.', 'এই নামে কোনো অধ্যায় পাওয়া গেল না।'),
  chapterN: (n) => t(`Chapter ${n}`, `অধ্যায় ${n}`),
  startHere: t('Start here', 'এখান থেকে শুরু'),
  ctaStart: t('Start', 'শুরু করো'),
  ctaContinue: t('Continue', 'চালিয়ে যাও'),
  ctaDone: t('Completed · practise again', 'সম্পূর্ণ · আবার অনুশীলন'),
  levelsDone: (n) => t(`${n}/3 levels`, `${n}/৩ স্তর`),
  subjectTabs: t('Subject', 'বিষয়'),
  chaptersTitle: t('Chapters', 'অধ্যায়সমূহ'),
  chaptersSub: t('Choose a chapter. Read the lesson, then take the quizzes.', 'একটি অধ্যায় বেছে নাও। পাঠ পড়ো, তারপর কুইজ দাও।'),
  lessonSoon: t('Lesson coming soon', 'পাঠ শীঘ্রই আসছে'),
  open: t('Open', 'খোলো'),

  lessonTitle: t('Lesson', 'পাঠ'),
  levelTabs: t('Lesson level', 'পাঠের স্তর'),
  example: (n) => t(`Example ${n}`, `উদাহরণ ${n}`),
  showSteps: t('Show the solution', 'সমাধান দেখো'),
  hideSteps: t('Hide the solution', 'সমাধান লুকাও'),
  answer: t('Answer', 'উত্তর'),
  formulas: t('Formulas to remember', 'মনে রাখার সূত্র'),
  rules: t('Rules to remember', 'মনে রাখার নিয়ম'),
  tips: t('Remember', 'মনে রেখো'),
  quizzesTitle: t('Quizzes', 'কুইজ'),
  quizzesSub: t('Start with Beginner. Every attempt gives you new questions.', 'Beginner দিয়ে শুরু করো। প্রতিবার নতুন প্রশ্ন পাবে।'),
  noTimer: t('No timer', 'টাইমার নেই'),
  timed: (min) => t(`Timer: ${min} min`, `টাইমার: ${min} মিনিট`),
  qCount: (n) => t(`${n} questions`, `${n}টি প্রশ্ন`),
  best: (c, n) => t(`Best: ${c}/${n}`, `সেরা: ${c}/${n}`),
  noQuestions: t('No questions yet', 'এখনও প্রশ্ন নেই'),
  startQuiz: t('Start quiz', 'কুইজ শুরু করো'),
  previous: t('Previous chapter', 'আগের অধ্যায়'),
  next: t('Next chapter', 'পরের অধ্যায়'),
  allChapters: t('All chapters', 'সব অধ্যায়'),

  questionOf: (i, n) => t(`Question ${i} of ${n}`, `প্রশ্ন ${i} / ${n}`),
  answered: (a, n) => t(`${a} of ${n} answered`, `${n}টির মধ্যে ${a}টির উত্তর দেওয়া হয়েছে`),
  prevQ: t('Previous', 'আগের'),
  nextQ: t('Next', 'পরের'),
  submit: t('Finish and see answers', 'শেষ করো ও উত্তর দেখো'),
  confirmTitle: t('Finish the quiz?', 'কুইজ শেষ করবে?'),
  confirmUnanswered: (n) => t(`${n} question(s) are not answered yet. They will count as wrong.`, `${n}টি প্রশ্নের উত্তর এখনও দাওনি। সেগুলো ভুল ধরা হবে।`),
  keepGoing: t('Keep answering', 'উত্তর দিতে থাকো'),
  finishNow: t('Finish now', 'এখনই শেষ করো'),
  timeLeft: t('Time left', 'বাকি সময়'),
  timeUp: t('Time is up! Your answers were submitted.', 'সময় শেষ! তোমার উত্তর জমা হয়ে গেছে।'),
  newCycle: t('You have seen every question at this level, so some come again.', 'এই স্তরের সব প্রশ্ন দেখা হয়ে গেছে, তাই কিছু প্রশ্ন আবার আসছে।'),
  borrowed: t(
    'This level does not have enough questions of its own yet, so this quiz also includes questions from the level below.',
    'এই স্তরে এখনও যথেষ্ট প্রশ্ন নেই, তাই এই কুইজে নিচের স্তরের কিছু প্রশ্নও আছে।',
  ),
  borrowedChip: t('Includes easier questions', 'সহজ প্রশ্নও আছে'),
  outsideClerkship: t('Not in the WBPSC Clerkship syllabus', 'WBPSC ক্লার্কশিপ সিলেবাসের বাইরে'),
  hardNotReady: t(
    'The Advanced question bank for this chapter is still being prepared. Please try the Intermediate quiz for now.',
    'এই অধ্যায়ের অ্যাডভান্সড প্রশ্নভান্ডার এখনও তৈরি হচ্ছে। আপাতত ইন্টারমিডিয়েট কুইজটি দাও।',
  ),
  backToChapter: t('Back to the chapter', 'অধ্যায়ে ফিরে যাও'),
  loadingQuiz: t('Getting your questions…', 'প্রশ্ন আনা হচ্ছে…'),
  checking: t('Checking your answers…', 'উত্তর মেলানো হচ্ছে…'),

  resultTitle: t('Your result', 'তোমার ফল'),
  scoreLine: (c, n) => t(`You got ${c} out of ${n} right`, `${n}টির মধ্যে ${c}টি ঠিক হয়েছে`),
  cheer: (pct) =>
    pct === 100
      ? t('Perfect! Excellent work! 🌟', 'একদম ঠিক! দারুণ! 🌟')
      : pct >= 70
        ? t('Great job! Keep it up! 🎉', 'খুব ভালো! এভাবেই চালিয়ে যাও! 🎉')
        : pct >= 40
          ? t('Good try! Read the explanations and try again. 💪', 'ভালো চেষ্টা! ব্যাখ্যাগুলো পড়ে আবার চেষ্টা করো। 💪')
          : t('Keep practising! Re-read the lesson, then try again. 📖', 'অনুশীলন চালিয়ে যাও! পাঠটা আবার পড়ো, তারপর চেষ্টা করো। 📖'),
  reviewTitle: t('Check every answer', 'প্রতিটি উত্তর দেখো'),
  right: t('Right', 'ঠিক'),
  wrong: t('Wrong', 'ভুল'),
  skipped: t('Not answered', 'উত্তর দেওয়া হয়নি'),
  yourAnswer: t('Your answer', 'তোমার উত্তর'),
  correctAnswer: t('Correct answer', 'সঠিক উত্তর'),
  explanation: t('Explanation', 'ব্যাখ্যা'),
  shortcut: t('Shortcut', 'শর্টকাট'),
  whyWrong: t('Why your choice is wrong', 'তোমার উত্তর কেন ভুল'),
  tryAgain: t('Try again with new questions', 'নতুন প্রশ্নে আবার চেষ্টা করো'),
  backToLesson: t('Back to the lesson', 'পাঠে ফিরে যাও'),
  nextLevel: t('Next level', 'পরের স্তর'),
  filterAll: t('All', 'সব'),
  filterWrong: t('Only wrong', 'শুধু ভুল'),
});

export const LEVEL_META = Object.freeze({
  basic: { label: t('Basic', 'সহজ'), tone: 'emerald' },
  intermediate: { label: t('Intermediate', 'মাঝারি'), tone: 'amber' },
  advanced: { label: t('Advanced', 'কঠিন'), tone: 'rose' },
  beginner: { label: t('Beginner', 'শুরু'), tone: 'emerald', icon: '🌱' },
});

export const QUIZ_LEVELS = Object.freeze([
  { level: 'beginner', label: t('Beginner', 'শুরুর স্তর'), icon: '🌱', tone: 'emerald' },
  { level: 'intermediate', label: t('Intermediate', 'মাঝারি স্তর'), icon: '🌿', tone: 'amber' },
  { level: 'advanced', label: t('Advanced', 'কঠিন স্তর'), icon: '🌳', tone: 'rose' },
]);

export const TONES = Object.freeze({
  emerald: { chip: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300', ring: 'ring-emerald-200 dark:ring-emerald-500/30', solid: 'bg-emerald-600 hover:bg-emerald-500' },
  amber: { chip: 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300', ring: 'ring-amber-200 dark:ring-amber-500/30', solid: 'bg-amber-600 hover:bg-amber-500' },
  rose: { chip: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300', ring: 'ring-rose-200 dark:ring-rose-500/30', solid: 'bg-rose-600 hover:bg-rose-500' },
});

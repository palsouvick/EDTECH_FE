/** Copy for the custom chapter test (setup popup, practice runner, result, history). English + Bengali. */
const t = (en, bn) => ({ en, bn });
const bnNum = (n) => String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[d]);

export const CT = Object.freeze({
  button: t('🎯 Custom Practice Test', '🎯 নিজের টেস্ট তৈরি করো'),
  buttonHint: t('Test only the chapters you have finished, at exam level', 'শুধু যে অধ্যায়গুলো শেষ করেছ, সেগুলো দিয়ে পরীক্ষার মানের টেস্ট'),
  signInToUse: t('Sign in to build your own test', 'নিজের টেস্ট বানাতে সাইন ইন করো'),
  title: t('Create your practice test', 'নিজের প্র্যাকটিস টেস্ট তৈরি করো'),
  stepOf: (i, n) => t(`Step ${i} of ${n}`, `ধাপ ${bnNum(i)} / ${bnNum(n)}`),
  steps: [t('Select chapters', 'অধ্যায় বাছো'), t('Questions + difficulty', 'প্রশ্ন + কাঠিন্য'), t('Time + mode', 'সময় + মোড')],
  close: t('Close', 'বন্ধ করো'),
  back: t('Back', 'পেছনে'),
  next: t('Next', 'পরের ধাপ'),
  start: t('🚀 Start Test', '🚀 টেস্ট শুরু করো'),
  starting: t('Building your test…', 'তোমার টেস্ট তৈরি হচ্ছে…'),
  quickStart: t('Start now with smart settings', 'স্মার্ট সেটিংসে এখনই শুরু'),
  loading: t('Loading chapters…', 'অধ্যায় আসছে…'),

  // Step 1
  selectChapters: t('Select chapters', 'অধ্যায় বাছো'),
  selectAll: t('Select all', 'সব বাছো'),
  clearAll: t('Clear all', 'সব মুছে দাও'),
  nSelected: (n) => t(`${n} chapter${n === 1 ? '' : 's'} selected`, `${bnNum(n)}টি অধ্যায় বাছা হয়েছে`),
  noneSelected: t('Pick at least one chapter you have studied.', 'যে অধ্যায় পড়েছ, অন্তত একটা বাছো।'),
  selectedTopics: t('Selected topics', 'বাছা অধ্যায়'),
  nQuestionsAvail: (n) => t(`${n} Qs`, `${bnNum(n)}টি প্রশ্ন`),
  noQuestions: t('No questions yet', 'এখনও প্রশ্ন নেই'),
  shortcuts: t('Or let the app choose', 'অথবা অ্যাপকে বাছতে দাও'),
  weakPreset: t('🔴 Practice my weak topics', '🔴 দুর্বল অধ্যায় অনুশীলন'),
  weakPresetHint: (names) => t(`Under 60%: ${names}`, `৬০%-এর নিচে: ${names}`),
  weakPresetNone: t('Answer 5+ questions in a chapter to find weak topics', 'দুর্বল অধ্যায় জানতে কোনো অধ্যায়ে অন্তত ৫টি প্রশ্নের উত্তর দাও'),
  mistakesPreset: t('❌ Retry my mistakes', '❌ ভুলগুলো আবার করো'),
  mistakesPresetHint: (n) => t(`You have ${n} open mistakes. New questions on the same concepts.`, `তোমার ${bnNum(n)}টি ভুল বাকি। একই ধারণার নতুন প্রশ্ন আসবে।`),
  mistakesPresetNone: t('No open mistakes. Well done!', 'কোনো ভুল বাকি নেই। দারুণ!'),
  quickPreset: t('⚡ Quick 10', '⚡ কুইক ১০'),
  quickPresetHint: t('10 mixed questions from the chosen chapters, about 10–15 min', 'বাছা অধ্যায় থেকে ১০টি মিশ্র প্রশ্ন, মোটামুটি ১০–১৫ মিনিট'),
  challengePreset: t('🔥 Challenge me', '🔥 আমাকে চ্যালেঞ্জ দাও'),
  challengeHint: t('Your last 3 tests were 85% or more. Harder questions unlocked.', 'শেষ ৩টি টেস্টে ৮৫% বা তার বেশি। কঠিন প্রশ্ন খুলে গেছে।'),
  accuracy: (n) => t(`${n}%`, `${bnNum(n)}%`),
  mistakesN: (n) => t(`${n} mistakes`, `${bnNum(n)}টি ভুল`),

  // Step 2
  howMany: t('Number of questions', 'প্রশ্নের সংখ্যা'),
  custom: t('Custom', 'নিজে লেখো'),
  customCountLabel: t('Custom number of questions (5–100)', 'প্রশ্নের সংখ্যা (৫–১০০)'),
  difficulty: t('Difficulty', 'কাঠিন্য'),
  difficulties: {
    easy: { icon: '🟢', label: t('Easy', 'সহজ'), hint: t('Basic concept practice', 'মূল ধারণার অনুশীলন') },
    moderate: { icon: '🟡', label: t('Moderate', 'মাঝারি'), hint: t('Competitive-exam level', 'প্রতিযোগিতামূলক পরীক্ষার মান') },
    hard: { icon: '🔴', label: t('Hard', 'কঠিন'), hint: t('Tricky questions', 'চালাকির প্রশ্ন') },
    exam: { icon: '🏆', label: t('Exam level', 'পরীক্ষার মান'), hint: t('WBPSC-style: mostly moderate and hard, real past-paper questions first', 'WBPSC ধাঁচের: বেশিরভাগ মাঝারি ও কঠিন, আগের বছরের আসল প্রশ্ন আগে') },
    mixed: { icon: '🔥', label: t('Mixed', 'মিশ্র'), hint: t('Easy + moderate + hard together', 'সহজ + মাঝারি + কঠিন একসঙ্গে') },
  },
  distribution: t('Question distribution', 'প্রশ্ন ভাগ'),
  distributions: {
    smart: { label: t('Smart', 'স্মার্ট'), hint: t('More questions from weak, important and mistake-heavy chapters', 'দুর্বল, গুরুত্বপূর্ণ ও বেশি ভুলের অধ্যায় থেকে বেশি প্রশ্ন') },
    balanced: { label: t('Balanced', 'সমান ভাগ'), hint: t('About the same number from every chapter', 'প্রতিটি অধ্যায় থেকে প্রায় সমান') },
  },

  // Step 3
  time: t('Test time', 'টেস্টের সময়'),
  smartTime: (m) => t(`⚡ Smart time: ${m} min`, `⚡ স্মার্ট সময়: ${bnNum(m)} মিনিট`),
  smartTimeHint: (n, diff, m) => t(`${n} ${diff} questions → recommended ${m} minutes`, `${bnNum(n)}টি ${diff} প্রশ্ন → প্রস্তাবিত ${bnNum(m)} মিনিট`),
  minutes: (m) => t(`${m} min`, `${bnNum(m)} মিনিট`),
  unlimitedTime: t('∞ Unlimited time', '∞ সীমাহীন সময়'),
  mode: t('Test mode', 'টেস্ট মোড'),
  modes: {
    exam: { icon: '🎯', label: t('Exam simulation', 'পরীক্ষার মতো'), hint: t('Countdown, one question at a time, mark for review, answers only after submitting', 'কাউন্টডাউন, একবারে একটি প্রশ্ন, রিভিউর জন্য চিহ্ন, উত্তর জমা দেওয়ার পরে') },
    practice: { icon: '📚', label: t('Learning practice', 'শিখতে শিখতে অনুশীলন'), hint: t('See right/wrong, explanation and shortcut after every answer', 'প্রতিটি উত্তরের পরেই ঠিক/ভুল, ব্যাখ্যা ও শর্টকাট') },
  },
  untimedPractice: t('No time pressure in practice mode; the time is a target only.', 'অনুশীলন মোডে সময়ের চাপ নেই; সময়টা শুধু লক্ষ্য।'),

  // Summary
  yourTest: t('🎯 Your test', '🎯 তোমার টেস্ট'),
  subject: t('Subject', 'বিষয়'),
  chapters: t('Chapters', 'অধ্যায়'),
  questions: t('Questions', 'প্রশ্ন'),
  modeLabel: t('Mode', 'মোড'),
  timeLabel: t('Time', 'সময়'),
  distributionLabel: t('Distribution', 'প্রশ্ন ভাগ'),
  whyThisSplit: t('Why this split', 'কেন এভাবে ভাগ'),
  shortBy: (have, want) => t(`Only ${have} questions are available in these chapters (you asked for ${want}).`, `এই অধ্যায়গুলোতে ${bnNum(have)}টি প্রশ্নই আছে (তুমি চেয়েছিলে ${bnNum(want)}টি)।`),
  reasons: {
    must_know: t('Must know in WBPSC papers', 'WBPSC প্রশ্নপত্রে অবশ্যই জানতে হবে'),
    important: t('Important in WBPSC papers', 'WBPSC প্রশ্নপত্রে গুরুত্বপূর্ণ'),
    new: t('not practised yet', 'এখনও অনুশীলন হয়নি'),
    focus: t('weak in your last test', 'আগের টেস্টে দুর্বল'),
    weak: (n) => t(`your accuracy ${n}%`, `তোমার সঠিকতা ${bnNum(n)}%`),
    strong: (n) => t(`already strong (${n}%)`, `আগে থেকেই ভালো (${bnNum(n)}%)`),
    mistakes: (n) => t(`${n} open mistakes`, `${bnNum(n)}টি ভুল বাকি`),
    limited: (n) => t(`only ${n} questions available`, `মাত্র ${bnNum(n)}টি প্রশ্ন আছে`),
    none_available: t('no questions yet', 'এখনও প্রশ্ন নেই'),
  },
  presetNames: {
    custom: t('Custom test', 'নিজের টেস্ট'),
    weak: t('Weak topic test', 'দুর্বল অধ্যায়ের টেস্ট'),
    mistakes: t('Retry my mistakes', 'ভুল শোধরানোর টেস্ট'),
    quick10: t('Quick 10', 'কুইক ১০'),
    mastery: t('Mastery test', 'দক্ষতা যাচাই টেস্ট'),
    challenge: t('Challenge test', 'চ্যালেঞ্জ টেস্ট'),
    followup: t('Targeted practice', 'লক্ষ্যভিত্তিক অনুশীলন'),
  },
  subjects: { quant: t('Mathematics', 'গণিত'), english: t('English', 'ইংরেজি'), gs: t('General Knowledge', 'সাধারণ জ্ঞান') },
  errors: {
    NO_WEAK_TOPICS: t('No weak chapters yet. Answer at least 5 questions in a chapter first.', 'এখনও কোনো দুর্বল অধ্যায় নেই। আগে কোনো অধ্যায়ে অন্তত ৫টি প্রশ্নের উত্তর দাও।'),
    NO_MISTAKES: t('No open mistakes in these chapters.', 'এই অধ্যায়গুলোতে কোনো ভুল বাকি নেই।'),
    INSUFFICIENT_QUESTIONS: t('Not enough questions in these chapters yet. Add another chapter.', 'এই অধ্যায়গুলোতে এখনও যথেষ্ট প্রশ্ন নেই। আরেকটা অধ্যায় যোগ করো।'),
    TIME_TOO_SHORT: t('Give at least 10 seconds per question.', 'প্রতি প্রশ্নে অন্তত ১০ সেকেন্ড দাও।'),
    MOCK_CREATE_RATE_LIMITED: t('Too many tests in a short time. Wait a few minutes.', 'অল্প সময়ে অনেক টেস্ট হয়ে গেছে। কয়েক মিনিট অপেক্ষা করো।'),
    generic: t('Could not build the test. Try again.', 'টেস্ট তৈরি করা গেল না। আবার চেষ্টা করো।'),
  },

  // Practice runner
  questionOf: (i, n) => t(`Question ${i} of ${n}`, `প্রশ্ন ${bnNum(i)} / ${bnNum(n)}`),
  check: t('Check answer', 'উত্তর দেখো'),
  checking: t('Checking…', 'দেখা হচ্ছে…'),
  correct: t('✅ Correct!', '✅ ঠিক!'),
  wrong: t('❌ Not quite', '❌ হয়নি'),
  correctIs: t('Correct answer', 'সঠিক উত্তর'),
  explanation: t('Explanation', 'ব্যাখ্যা'),
  shortcut: t('💡 Shortcut', '💡 শর্টকাট'),
  trap: t('Common trap', 'সাধারণ ফাঁদ'),
  relatedConcept: t('📖 Related concept', '📖 সম্পর্কিত ধারণা'),
  openLesson: t('Open the lesson', 'পাঠটা খোলো'),
  nextQuestion: t('Next question →', 'পরের প্রশ্ন →'),
  finish: t('Finish and see result', 'শেষ করে ফল দেখো'),
  skip: t('Skip', 'বাদ দাও'),
  targetTime: (m) => (m == null ? t('No time limit', 'কোনো সময়সীমা নেই') : t(`Target: ${m} min`, `লক্ষ্য: ${bnNum(m)} মিনিট`)),
  expired: t('This test has expired. Build a new one.', 'এই টেস্টের সময় শেষ। নতুন একটা বানাও।'),
  backToLearn: t('Back to chapters', 'অধ্যায়ে ফিরে যাও'),

  // Result
  resultTitle: t('🎯 Test result', '🎯 টেস্টের ফল'),
  score: t('Score', 'স্কোর'),
  accuracyLabel: t('Accuracy', 'সঠিকতা'),
  timeTaken: t('Time', 'সময়'),
  marksNote: (pos, neg) => t(`Marking: +${pos} per right answer, −${neg} per wrong answer (WBPSC Clerkship official scheme)`, `নম্বর: সঠিক উত্তরে +${pos}, ভুল উত্তরে −${neg} (WBPSC ক্লার্কশিপের সরকারি নিয়ম)`),
  chapterPerformance: t('Chapter performance', 'অধ্যায় অনুযায়ী ফল'),
  chapter: t('Chapter', 'অধ্যায়'),
  correctCol: t('Correct', 'সঠিক'),
  bands: {
    strong: t('🟢 Strong topic', '🟢 শক্তিশালী অধ্যায়'),
    practice: t('🟡 Needs practice', '🟡 আরও অনুশীলন দরকার'),
    weak: t('🔴 Weak topic', '🔴 দুর্বল অধ্যায়'),
  },
  mastery: (name, n) => t(`${name} mastery: ${n}%`, `${name}-এ দক্ষতা: ${bnNum(n)}%`),
  concepts: t('Concepts in this test', 'এই টেস্টের ধারণাগুলো'),
  conceptStatus: { strong: t('Strong', 'ভালো'), weak: t('Weak', 'দুর্বল'), revise: t('Revise', 'ঝালিয়ে নাও') },
  previous: (a, b) => t(`Previous test: ${a}% → now ${b}%`, `আগের টেস্ট: ${bnNum(a)}% → এখন ${bnNum(b)}%`),
  nextSteps: t('What to do next', 'এরপর কী করবে'),
  rec: {
    next_chapter: (name, next) => t(`You scored well in ${name}. Move on to ${next}.`, `${name}-এ ভালো করেছ। এবার ${next} শুরু করো।`),
    challenge: (name) => t(`You scored well in ${name}. Try a harder test.`, `${name}-এ ভালো করেছ। এবার আরও কঠিন টেস্ট দাও।`),
    practice: (name) => t(`${name} is close. Take another targeted test.`, `${name} প্রায় হয়ে এসেছে। আরেকটা লক্ষ্যভিত্তিক টেস্ট দাও।`),
    revise: (name) => t(`${name} needs work: revise the lesson → solve 10 basic questions → take another targeted test.`, `${name}-এ আরও কাজ দরকার: পাঠটা আবার পড়ো → ১০টি সহজ প্রশ্ন করো → আরেকটা লক্ষ্যভিত্তিক টেস্ট দাও।`),
  },
  reviseBtn: (name) => t(`Revise ${name}`, `${name} ঝালিয়ে নাও`),
  basicQuiz: t('10 basic questions', '১০টি সহজ প্রশ্ন'),
  openChapter: (name) => t(`Open ${name}`, `${name} খোলো`),
  questionAnalysis: t('Question-by-question analysis', 'প্রশ্ন ধরে বিশ্লেষণ'),
  showAll: t('Show all questions', 'সব প্রশ্ন দেখাও'),
  showMistakes: t('Show wrong and skipped only', 'শুধু ভুল ও বাদ দেওয়া'),
  qN: (n) => t(`Question ${n}`, `প্রশ্ন ${bnNum(n)}`),
  outcomes: { CORRECT: t('✅ Correct', '✅ সঠিক'), INCORRECT: t('❌ Incorrect', '❌ ভুল'), UNATTEMPTED: t('⏭ Skipped', '⏭ বাদ'), TIMED_OUT: t('⏱ Time up', '⏱ সময় শেষ') },
  yourAnswer: t('Your answer', 'তোমার উত্তর'),
  notAnswered: t('Not answered', 'উত্তর দাওনি'),
  why: t('Why?', 'কেন?'),
  noExplanation: t('No written explanation for this question yet.', 'এই প্রশ্নের লেখা ব্যাখ্যা এখনও নেই।'),
  practiceAgain: t('🔄 Practice again', '🔄 আবার অনুশীলন'),
  practiceAgainHint: (names) => t(`New questions, same chapters, more from: ${names}`, `নতুন প্রশ্ন, একই অধ্যায়, বেশি থাকবে: ${names}`),
  practiceAgainHarder: t('New questions, one level harder', 'নতুন প্রশ্ন, এক ধাপ কঠিন'),
  savedToNotebook: t('Wrong answers were added to your Mistake Notebook for revision.', 'ভুল উত্তরগুলো রিভিশনের জন্য তোমার ভুলের খাতায় যোগ হয়েছে।'),
  mistakeNotebook: t('Open Mistake Notebook', 'ভুলের খাতা খোলো'),
  newTest: t('Build a different test', 'অন্য টেস্ট বানাও'),

  // History
  historyTitle: t('📊 Custom practice history', '📊 নিজের টেস্টের ইতিহাস'),
  testsTaken: t('Tests taken', 'মোট টেস্ট'),
  avgScore: t('Average score', 'গড় স্কোর'),
  bestScore: t('Best score', 'সেরা স্কোর'),
  avgAccuracy: t('Average accuracy', 'গড় সঠিকতা'),
  avgTime: t('Average time', 'গড় সময়'),
  improvement: t('Improvement', 'উন্নতি'),
  improvementHint: t('Your last 3 tests compared with your first 3', 'প্রথম ৩টি টেস্টের তুলনায় শেষ ৩টি'),
  chapterMastery: t('Chapter mastery (custom tests)', 'অধ্যায়ে দক্ষতা (নিজের টেস্ট)'),
  recentTests: t('Recent tests', 'সাম্প্রতিক টেস্ট'),
  viewResult: t('View result', 'ফল দেখো'),

  // Chapter page
  masteryTitle: t('🏆 Test my mastery', '🏆 আমার দক্ষতা যাচাই'),
  masteryDone: (name) => t(`You have cleared ${name}. Check it at exam level.`, `তুমি ${name} পার করেছ। পরীক্ষার মানে যাচাই করো।`),
  masteryReady: (name) => t(`Finished ${name}? Take an exam-level test on this chapter only.`, `${name} শেষ? শুধু এই অধ্যায়ের পরীক্ষার-মানের টেস্ট দাও।`),
  masteryBtn: t('Test my mastery →', 'দক্ষতা যাচাই করো →'),
  masteryMeta: (n, m) => t(`${n} exam-level questions · ${m} min`, `${bnNum(n)}টি পরীক্ষার-মানের প্রশ্ন · ${bnNum(m)} মিনিট`),
});

/** "weak:52" -> localized reason text. */
export function reasonText(code) {
  const [key, arg] = code.split(':');
  const r = CT.reasons[key];
  if (!r) return null;
  return typeof r === 'function' ? r(Number(arg)) : r;
}

/**
 * Fills a copy function with names per language: names are { en, bn } objects, and each
 * language's sentence gets that language's name (English when there is no Bengali).
 */
export function withNames(fn, ...names) {
  const pick = (n, l) => (n && typeof n === 'object' ? n[l] ?? n.en ?? '' : n ?? '');
  return { en: fn(...names.map((n) => pick(n, 'en'))).en, bn: fn(...names.map((n) => pick(n, 'bn'))).bn };
}

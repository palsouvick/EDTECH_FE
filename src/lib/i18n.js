/**
 * Interface strings in the same { en, bn, hi } shape as content, so chrome and
 * content switch together through <Localized>.
 */
export const UI = Object.freeze({
  eyebrow: { en: 'Revise before you practise', bn: 'অনুশীলনের আগে ঝালিয়ে নিন', hi: 'अभ्यास से पहले दोहराएँ' },
  coreFormulas: { en: 'Core Formulas', bn: 'মূল সূত্র', hi: 'मुख्य सूत्र' },
  derivationRules: { en: 'Quick derivation rules', bn: 'দ্রুত নির্ণয়ের নিয়ম', hi: 'त्वरित व्युत्पत्ति नियम' },
  speedTricks: { en: 'Speed Tricks & Short Cuts', bn: 'দ্রুত সমাধানের কৌশল ও শর্টকাট', hi: 'स्पीड ट्रिक्स और शॉर्टकट' },
  pitfalls: { en: 'Common PYQ Pitfalls', bn: 'PYQ-তে সাধারণ ভুল', hi: 'PYQ में आम गलतियाँ' },
  expandAll: { en: 'Expand all', bn: 'সব খুলুন', hi: 'सभी खोलें' },
  collapseAll: { en: 'Collapse all', bn: 'সব বন্ধ করুন', hi: 'सभी बंद करें' },
  attemptedToday: { en: 'today', bn: 'আজ', hi: 'आज' },
  dayStreak: { en: 'day streak', bn: 'দিন টানা', hi: 'दिन लगातार' },
  keepStreak: {
    en: 'Answer one question today to keep your streak',
    bn: 'ধারা বজায় রাখতে আজ অন্তত একটি প্রশ্নের উত্তর দিন',
    hi: 'स्ट्रीक बनाए रखने के लिए आज कम से कम एक प्रश्न हल करें',
  },
  goalReached: { en: 'Daily goal reached', bn: 'আজকের লক্ষ্য পূর্ণ', hi: 'आज का लक्ष्य पूरा' },
  practiceMode: { en: 'Continuous Practice', bn: 'নিরবচ্ছিন্ন অনুশীলন', hi: 'निरंतर अभ्यास' },
  practiceHint: {
    en: 'Untimed · instant answer check',
    bn: 'সময়সীমা নেই · সঙ্গে সঙ্গে উত্তর যাচাই',
    hi: 'कोई समय सीमा नहीं · तुरंत उत्तर जाँच',
  },
  mockMode: { en: 'Timed Mock Test', bn: 'সময়বদ্ধ মক টেস্ট', hi: 'समयबद्ध मॉक टेस्ट' },
  mockHint: {
    en: 'Exam timer · negative marking',
    bn: 'পরীক্ষার টাইমার · নেগেটিভ মার্কিং',
    hi: 'परीक्षा टाइमर · नेगेटिव मार्किंग',
  },
  startPractice: { en: 'Start practice', bn: 'অনুশীলন শুরু করুন', hi: 'अभ्यास शुरू करें' },
  launchMock: { en: 'Launch mock test', bn: 'মক টেস্ট শুরু করুন', hi: 'मॉक टेस्ट शुरू करें' },
  questionsShort: { en: 'Qs', bn: 'প্রশ্ন', hi: 'प्रश्न' },
  minutesShort: { en: 'min', bn: 'মিনিট', hi: 'मिनट' },
  notTranslated: {
    en: 'Not yet available in this language',
    bn: 'এই ভাষায় এখনও উপলব্ধ নয়',
    hi: 'इस भाषा में अभी उपलब्ध नहीं',
  },
  contentLanguage: { en: 'Content language', bn: 'বিষয়বস্তুর ভাষা', hi: 'सामग्री की भाषा' },
});

/** "saves ~25s" in all three languages. */
export const savesSeconds = (n) => ({
  en: `saves ~${n}s`,
  bn: `~${n} সেকেন্ড বাঁচায়`,
  hi: `~${n} सेकंड बचाता है`,
});

const TIER_LABELS = {
  TIER_1: 'Tier 1',
  TIER_2: 'Tier 2',
  TIER_3: 'Tier 3',
  PRELIMS: 'Prelims',
  MAINS: 'Mains',
  SINGLE: 'Single stage',
};

/** "SSC_CGL" -> "SSC CGL", "TIER_1" -> "Tier 1". Exam names stay in Latin script in every language. */
export const examLabel = (code) => code.replace(/_/g, ' ');
export const tierLabel = (tier) => TIER_LABELS[tier] || tier;

/** Practice Arena strings. */
export const ARENA = Object.freeze({
  checkAnswer: { en: 'Check answer', bn: 'উত্তর যাচাই করুন', hi: 'उत्तर जाँचें' },
  checking: { en: 'Checking…', bn: 'যাচাই হচ্ছে…', hi: 'जाँच हो रही है…' },
  nextQuestion: { en: 'Next question', bn: 'পরের প্রশ্ন', hi: 'अगला प्रश्न' },
  bookmark: { en: 'Bookmark for revision', bn: 'রিভিশনের জন্য বুকমার্ক', hi: 'दोहराने के लिए बुकमार्क' },
  bookmarked: { en: 'Bookmarked', bn: 'বুকমার্ক করা হয়েছে', hi: 'बुकमार्क किया गया' },
  reportError: { en: 'Report error', bn: 'ভুল জানান', hi: 'त्रुटि बताएँ' },
  correct: { en: 'Correct!', bn: 'সঠিক!', hi: 'सही!' },
  incorrect: { en: 'Not quite', bn: 'সঠিক হয়নি', hi: 'सही नहीं' },
  mistakeTitle: { en: 'Where you made the mistake', bn: 'কোথায় ভুল হয়েছে', hi: 'गलती कहाँ हुई' },
  mistakeGeneric: {
    en: 'Compare your choice with the highlighted answer, then walk through the steps below.',
    bn: 'আপনার উত্তর চিহ্নিত সঠিক উত্তরের সঙ্গে মিলিয়ে দেখুন, তারপর নিচের ধাপগুলি দেখুন।',
    hi: 'अपने उत्तर की तुलना चिह्नित सही उत्तर से करें, फिर नीचे दिए चरण देखें।',
  },
  stepByStep: { en: 'Step-by-step solution', bn: 'ধাপে ধাপে সমাধান', hi: 'चरण-दर-चरण हल' },
  shortcut: { en: 'Shortcut', bn: 'শর্টকাট', hi: 'शॉर्टकट' },
  watchOut: { en: 'Watch out', bn: 'সাবধান', hi: 'सावधान' },
  loading: { en: 'Loading next question…', bn: 'পরের প্রশ্ন আসছে…', hi: 'अगला प्रश्न लोड हो रहा है…' },
  loadFailed: { en: "Couldn't load questions.", bn: 'প্রশ্ন লোড করা যায়নি।', hi: 'प्रश्न लोड नहीं हो सके।' },
  checkFailed: {
    en: "Couldn't check your answer. Try again.",
    bn: 'উত্তর যাচাই করা যায়নি। আবার চেষ্টা করুন।',
    hi: 'उत्तर जाँचा नहीं जा सका। फिर से कोशिश करें।',
  },
  retry: { en: 'Try again', bn: 'আবার চেষ্টা করুন', hi: 'फिर से कोशिश करें' },
  finishedTitle: {
    en: "You've finished every question in this topic",
    bn: 'এই বিষয়ের সব প্রশ্ন শেষ করেছেন',
    hi: 'आपने इस विषय के सभी प्रश्न पूरे कर लिए',
  },
  milestoneTitle: { en: 'Great focus!', bn: 'দারুণ মনোযোগ!', hi: 'बेहतरीन एकाग्रता!' },
  milestoneQuestion: {
    en: 'Keep going or take a 10-question timed test?',
    bn: 'অনুশীলন চালিয়ে যাবেন, নাকি 10 প্রশ্নের সময়বদ্ধ টেস্ট দেবেন?',
    hi: 'अभ्यास जारी रखें या 10 प्रश्नों का समयबद्ध टेस्ट दें?',
  },
  keepGoing: { en: 'Keep going', bn: 'চালিয়ে যান', hi: 'जारी रखें' },
  takeTimedTest: { en: 'Take a 10-question timed test', bn: '10 প্রশ্নের সময়বদ্ধ টেস্ট দিন', hi: '10 प्रश्नों का समयबद्ध टेस्ट दें' },
  reportTitle: { en: 'Report an error', bn: 'ভুল জানান', hi: 'त्रुटि की सूचना दें' },
  reportDetails: { en: 'Details (optional)', bn: 'বিস্তারিত (ঐচ্ছিক)', hi: 'विवरण (वैकल्पिक)' },
  send: { en: 'Send report', bn: 'পাঠান', hi: 'भेजें' },
  cancel: { en: 'Cancel', bn: 'বাতিল', hi: 'रद्द करें' },
  close: { en: 'Close', bn: 'বন্ধ করুন', hi: 'बंद करें' },
  reportThanks: {
    en: 'Thanks. Our editors will review it.',
    bn: 'ধন্যবাদ। আমাদের সম্পাদকরা এটি দেখবেন।',
    hi: 'धन्यवाद। हमारे संपादक इसकी समीक्षा करेंगे।',
  },
  reportFailed: { en: "Couldn't send the report.", bn: 'রিপোর্ট পাঠানো যায়নি।', hi: 'रिपोर्ट भेजी नहीं जा सकी।' },
  bookmarkFailed: { en: "Couldn't update the bookmark.", bn: 'বুকমার্ক বদলানো যায়নি।', hi: 'बुकमार्क अपडेट नहीं हो सका।' },
  shortcutsHint: {
    en: 'A–D or 1–4 choose · Enter checks / next · S bookmarks',
    bn: 'A–D বা 1–4 বেছে নিন · Enter যাচাই / পরের · S বুকমার্ক',
    hi: 'A–D या 1–4 चुनें · Enter जाँच / अगला · S बुकमार्क',
  },
});

/** Keys match backend REPORT_REASONS. */
export const REPORT_REASON_LABELS = Object.freeze({
  WRONG_ANSWER: { en: 'The answer key is wrong', bn: 'উত্তর ভুল দেওয়া আছে', hi: 'उत्तर कुंजी गलत है' },
  WRONG_EXPLANATION: { en: 'The explanation is wrong', bn: 'ব্যাখ্যা ভুল', hi: 'व्याख्या गलत है' },
  TRANSLATION: { en: "Translation doesn't match", bn: 'অনুবাদ মিলছে না', hi: 'अनुवाद मेल नहीं खाता' },
  TYPO: { en: 'Typo or formatting', bn: 'বানান বা ফরম্যাটিং ভুল', hi: 'वर्तनी या फ़ॉर्मेटिंग की गलती' },
  UNCLEAR: { en: 'The question is unclear', bn: 'প্রশ্নটি অস্পষ্ট', hi: 'प्रश्न अस्पष्ट है' },
  OTHER: { en: 'Something else', bn: 'অন্য কিছু', hi: 'कुछ और' },
});

export const questionNumber = (n) => ({ en: `Question ${n}`, bn: `প্রশ্ন ${n}`, hi: `प्रश्न ${n}` });
export const completedOf = (n, goal) => ({ en: `${n}/${goal} Completed`, bn: `${n}/${goal} সম্পন্ন`, hi: `${n}/${goal} पूर्ण` });
export const accuracyLabel = (p) => ({ en: `${p}% Accuracy`, bn: `${p}% নির্ভুলতা`, hi: `${p}% सटीकता` });
export const inARowLabel = (n) => ({ en: `${n} in a row`, bn: `টানা ${n}টি সঠিক`, hi: `लगातार ${n} सही` });
export const percentCorrectLabel = (p) => ({
  en: `${p}% of students got this right`,
  bn: `${p}% শিক্ষার্থী এটি ঠিক করেছেন`,
  hi: `${p}% छात्रों ने इसे सही किया`,
});

/**
 * "You've mastered 10 Ratio & Proportion problems". "Mastered" only at 80%+
 * accuracy; praising a 4/10 run as mastery would ring false.
 */
export function milestoneMessage(count, correct, topicName = {}) {
  const t = (l) => topicName[l] || topicName.en || '';
  const mastered = correct / count >= 0.8;
  return mastered
    ? {
        en: `You've mastered ${count} ${t('en')} problems: ${correct} correct.`,
        bn: `আপনি ${count}টি ${t('bn')} প্রশ্নে দক্ষতা দেখিয়েছেন: ${correct}টি সঠিক।`,
        hi: `आपने ${t('hi')} के ${count} प्रश्नों में महारत दिखाई: ${correct} सही।`,
      }
    : {
        en: `You've solved ${count} ${t('en')} problems: ${correct} correct.`,
        bn: `আপনি ${count}টি ${t('bn')} প্রশ্ন সমাধান করেছেন: ${correct}টি সঠিক।`,
        hi: `आपने ${t('hi')} के ${count} प्रश्न हल किए: ${correct} सही।`,
      };
}

/** Badge text: "SSC CGL 2024 Tier 1", "WBCS 2023 Prelims". */
// Stages read before the year ("WBCS Prelims 2023"), tiers after it ("SSC CGL 2024 Tier 1"),
// matching how students say them.
const STAGE_BEFORE_YEAR = new Set(['PRELIMS', 'MAINS']);
export const pyqLabel = (p) => {
  const tier = p.tier && tierLabel(p.tier);
  const parts = STAGE_BEFORE_YEAR.has(p.tier) ? [p.examName, tier, p.year] : [p.examName, p.year, tier];
  return parts.filter(Boolean).join(' ');
};

/** Selection funnel (exam -> subject -> topic) strings. */
export const FUNNEL = Object.freeze({
  brand: { en: 'Exam Prep', bn: 'Exam Prep', hi: 'Exam Prep' },
  exams: { en: 'Exams', bn: 'পরীক্ষা', hi: 'परीक्षाएँ' },
  stepExam: { en: 'Exam', bn: 'পরীক্ষা', hi: 'परीक्षा' },
  stepSubject: { en: 'Subject', bn: 'বিষয়', hi: 'विषय' },
  stepTopic: { en: 'Topic', bn: 'অধ্যায়', hi: 'अध्याय' },
  chooseExam: { en: 'Choose your exam', bn: 'আপনার পরীক্ষা বেছে নিন', hi: 'अपनी परीक्षा चुनें' },
  chooseExamHint: {
    en: 'Pick a category to see its subjects and topics.',
    bn: 'বিষয় ও অধ্যায় দেখতে একটি বিভাগ বেছে নিন।',
    hi: 'विषय और अध्याय देखने के लिए एक श्रेणी चुनें।',
  },
  chooseSubject: { en: 'Choose a subject', bn: 'একটি বিষয় বেছে নিন', hi: 'एक विषय चुनें' },
  studyLanguage: { en: 'Study language', bn: 'পড়ার ভাষা', hi: 'पढ़ाई की भाषा' },
  languageHint: {
    en: 'Question counts show what is available in this language.',
    bn: 'প্রশ্নের সংখ্যা এই ভাষায় যা উপলব্ধ তা দেখায়।',
    hi: 'प्रश्नों की संख्या इस भाषा में उपलब्ध प्रश्न दिखाती है।',
  },
  chooseTopic: { en: 'Choose a topic', bn: 'একটি অধ্যায় বেছে নিন', hi: 'एक अध्याय चुनें' },
  studyPractice: { en: 'Study & Practice', bn: 'পড়ুন ও অনুশীলন করুন', hi: 'पढ़ें और अभ्यास करें' },
  comingSoon: { en: 'Coming soon', bn: 'শীঘ্রই আসছে', hi: 'जल्द आ रहा है' },
  continueTitle: { en: 'Continue where you left off', bn: 'যেখানে ছেড়েছিলেন সেখান থেকে শুরু করুন', hi: 'जहाँ छोड़ा था वहीं से शुरू करें' },
  noCategories: {
    en: 'No exams are set up yet. Seed the catalogue with `npm run db:seed` in the backend.',
    bn: 'এখনও কোনো পরীক্ষা যোগ করা হয়নি।',
    hi: 'अभी कोई परीक्षा जोड़ी नहीं गई है।',
  },
  loadFailed: { en: "Couldn't load this page.", bn: 'পাতাটি লোড করা যায়নি।', hi: 'यह पेज लोड नहीं हो सका।' },
  notesComingSoon: {
    en: 'Concept notes for this topic are on the way. You can start practising now.',
    bn: 'এই অধ্যায়ের ধারণা-নোট শীঘ্রই আসছে। এখনই অনুশীলন শুরু করতে পারেন।',
    hi: 'इस अध्याय के कॉन्सेप्ट नोट्स जल्द आ रहे हैं। आप अभी अभ्यास शुरू कर सकते हैं।',
  },
  EASY: { en: 'Easy', bn: 'সহজ', hi: 'आसान' },
  MODERATE: { en: 'Moderate', bn: 'মাঝারি', hi: 'मध्यम' },
  HARD: { en: 'Hard', bn: 'কঠিন', hi: 'कठिन' },
  difficultyUnknown: { en: 'Not rated yet', bn: 'এখনও মূল্যায়িত নয়', hi: 'अभी रेट नहीं हुआ' },
});

export const questionsCount = (n) => ({
  en: `${n} ${n === 1 ? 'question' : 'questions'}`,
  bn: `${n}টি প্রশ্ন`,
  hi: `${n} प्रश्न`,
});
export const topicsCount = (n) => ({ en: `${n} ${n === 1 ? 'topic' : 'topics'}`, bn: `${n}টি অধ্যায়`, hi: `${n} अध्याय` });
export const pyqsCount = (n) => ({ en: `${n} ${n === 1 ? 'PYQ' : 'PYQs'}`, bn: `${n}টি PYQ`, hi: `${n} PYQ` });

/** Mock test (CBT) strings. */
export const MOCK = Object.freeze({
  mockTest: { en: 'Mock Test', bn: 'মক টেস্ট', hi: 'मॉक टेस्ट' },
  setupTitle: { en: 'Set up your mock test', bn: 'মক টেস্ট সাজিয়ে নিন', hi: 'अपना मॉक टेस्ट सेट करें' },
  questionCount: { en: 'Number of questions', bn: 'প্রশ্নের সংখ্যা', hi: 'प्रश्नों की संख्या' },
  scope: { en: 'Questions from', bn: 'প্রশ্ন আসবে', hi: 'प्रश्न कहाँ से' },
  scopeTopic: { en: 'This topic', bn: 'এই অধ্যায় থেকে', hi: 'इस अध्याय से' },
  scopeSubject: { en: 'Whole subject', bn: 'পুরো বিষয় থেকে', hi: 'पूरे विषय से' },
  timerMode: { en: 'Timer', bn: 'টাইমার', hi: 'टाइमर' },
  duration: { en: 'Test duration', bn: 'পরীক্ষার সময়', hi: 'परीक्षा की अवधि' },
  overallTimer: { en: 'Overall test timer', bn: 'পুরো পরীক্ষার টাইমার', hi: 'पूरी परीक्षा का टाइमर' },
  overallHint: {
    en: 'One clock for the whole test. Move freely between questions.',
    bn: 'পুরো পরীক্ষায় একটি ঘড়ি। যেকোনো প্রশ্নে যাওয়া যায়।',
    hi: 'पूरी परीक्षा के लिए एक घड़ी। किसी भी प्रश्न पर जा सकते हैं।',
  },
  perQuestionTimer: { en: 'Per-question timer', bn: 'প্রতি প্রশ্নের টাইমার', hi: 'प्रति प्रश्न टाइमर' },
  perQuestionHint: {
    en: 'Each question has its own clock. A saved or timed-out question locks.',
    bn: 'প্রতিটি প্রশ্নের নিজস্ব ঘড়ি। সেভ করা বা সময় শেষ হওয়া প্রশ্ন বন্ধ হয়ে যায়।',
    hi: 'हर प्रश्न की अपनी घड़ी। सेव किया या समय समाप्त प्रश्न लॉक हो जाता है।',
  },
  allowPause: { en: 'Allow pausing', bn: 'বিরতির অনুমতি', hi: 'रोकने की अनुमति' },
  allowPauseHint: {
    en: 'Keep it off to practise like the real exam.',
    bn: 'আসল পরীক্ষার মতো অনুশীলনের জন্য বন্ধ রাখুন।',
    hi: 'असली परीक्षा जैसे अभ्यास के लिए बंद रखें।',
  },
  language: { en: 'Question language', bn: 'প্রশ্নের ভাষা', hi: 'प्रश्न की भाषा' },
  startTest: { en: 'Start test', bn: 'পরীক্ষা শুরু করুন', hi: 'परीक्षा शुरू करें' },
  starting: { en: 'Preparing your paper…', bn: 'প্রশ্নপত্র তৈরি হচ্ছে…', hi: 'प्रश्नपत्र तैयार हो रहा है…' },
  cancel: { en: 'Cancel', bn: 'বাতিল', hi: 'रद्द करें' },
  clearResponse: { en: 'Clear Response', bn: 'উত্তর মুছুন', hi: 'उत्तर हटाएँ' },
  markForReview: { en: 'Mark for Review & Next', bn: 'রিভিউর জন্য চিহ্নিত করে পরের', hi: 'समीक्षा हेतु चिह्नित करें और आगे' },
  saveNext: { en: 'Save & Next', bn: 'সেভ করে পরের', hi: 'सेव करें और आगे' },
  pause: { en: 'Pause', bn: 'বিরতি', hi: 'रोकें' },
  resume: { en: 'Resume', bn: 'আবার শুরু', hi: 'फिर शुरू करें' },
  pausedTitle: { en: 'Test paused', bn: 'পরীক্ষা থেমে আছে', hi: 'परीक्षा रुकी हुई है' },
  pausedHint: {
    en: 'Questions are hidden and the timer is stopped.',
    bn: 'প্রশ্ন লুকানো আছে এবং টাইমার বন্ধ।',
    hi: 'प्रश्न छिपे हैं और टाइमर बंद है।',
  },
  submit: { en: 'Submit', bn: 'জমা দিন', hi: 'जमा करें' },
  palette: { en: 'Question palette', bn: 'প্রশ্ন তালিকা', hi: 'प्रश्न पैलेट' },
  timeLeft: { en: 'Time left', bn: 'বাকি সময়', hi: 'शेष समय' },
  questionTime: { en: 'This question', bn: 'এই প্রশ্নে', hi: 'इस प्रश्न में' },
  locked: { en: "Time's up for this question.", bn: 'এই প্রশ্নের সময় শেষ।', hi: 'इस प्रश्न का समय समाप्त।' },
  confirmTitle: { en: 'Submit the test?', bn: 'পরীক্ষা জমা দেবেন?', hi: 'परीक्षा जमा करें?' },
  confirmHint: {
    en: "You can't change answers after submitting.",
    bn: 'জমা দেওয়ার পর উত্তর বদলানো যাবে না।',
    hi: 'जमा करने के बाद उत्तर नहीं बदल सकते।',
  },
  backToTest: { en: 'Back to test', bn: 'পরীক্ষায় ফিরুন', hi: 'परीक्षा पर लौटें' },
  submitting: { en: 'Submitting your answers…', bn: 'আপনার উত্তর জমা হচ্ছে…', hi: 'आपके उत्तर जमा हो रहे हैं…' },
  timeUp: { en: "Time's up!", bn: 'সময় শেষ!', hi: 'समय समाप्त!' },
  submitFailed: {
    en: "Couldn't submit. Your answers are saved on this device; try again.",
    bn: 'জমা দেওয়া যায়নি। আপনার উত্তর এই ডিভাইসে সংরক্ষিত আছে; আবার চেষ্টা করুন।',
    hi: 'जमा नहीं हो सका। आपके उत्तर इस डिवाइस पर सहेजे हैं; फिर से कोशिश करें।',
  },
  retry: { en: 'Try again', bn: 'আবার চেষ্টা করুন', hi: 'फिर से कोशिश करें' },
  expired: {
    en: 'This test ended before it could be submitted.',
    bn: 'জমা দেওয়ার আগেই এই পরীক্ষার সময় শেষ হয়ে গেছে।',
    hi: 'जमा होने से पहले ही यह परीक्षा समाप्त हो गई।',
  },
  restored: { en: 'Your test was restored.', bn: 'আপনার পরীক্ষা পুনরুদ্ধার হয়েছে।', hi: 'आपकी परीक्षा बहाल हुई।' },
  result: { en: 'Result', bn: 'ফলাফল', hi: 'परिणाम' },
  score: { en: 'Score', bn: 'স্কোর', hi: 'स्कोर' },
  accuracy: { en: 'Accuracy', bn: 'নির্ভুলতা', hi: 'सटीकता' },
  attempted: { en: 'Attempted', bn: 'চেষ্টা করেছেন', hi: 'प्रयास किए' },
  negative: { en: 'Negative marks', bn: 'নেগেটিভ নম্বর', hi: 'नेगेटिव अंक' },
  correct: { en: 'Correct', bn: 'সঠিক', hi: 'सही' },
  incorrect: { en: 'Incorrect', bn: 'ভুল', hi: 'गलत' },
  unattempted: { en: 'Not attempted', bn: 'উত্তর দেওয়া হয়নি', hi: 'प्रयास नहीं किया' },
  timeTaken: { en: 'Time taken', bn: 'সময় লেগেছে', hi: 'लगा समय' },
  strengths: { en: 'Strong topics', bn: 'শক্তিশালী অধ্যায়', hi: 'मज़बूत अध्याय' },
  weaknesses: { en: 'Needs practice', bn: 'আরও অনুশীলন দরকার', hi: 'अभ्यास की ज़रूरत' },
  backToTopic: { en: 'Back to topic', bn: 'অধ্যায়ে ফিরুন', hi: 'अध्याय पर लौटें' },
  fiveMinutes: { en: '5 minutes left', bn: '৫ মিনিট বাকি', hi: '5 मिनट शेष' },
  oneMinute: { en: '1 minute left', bn: '১ মিনিট বাকি', hi: '1 मिनट शेष' },
  NOT_VISITED: { en: 'Not visited', bn: 'দেখা হয়নি', hi: 'नहीं देखा' },
  NOT_ANSWERED: { en: 'Not answered', bn: 'উত্তর দেওয়া হয়নি', hi: 'उत्तर नहीं दिया' },
  ANSWERED: { en: 'Answered', bn: 'উত্তর দেওয়া হয়েছে', hi: 'उत्तर दिया' },
  MARKED: { en: 'Marked for review', bn: 'রিভিউর জন্য চিহ্নিত', hi: 'समीक्षा हेतु चिह्नित' },
  ANSWERED_MARKED: {
    en: 'Answered & marked (will be evaluated)',
    bn: 'উত্তর দেওয়া ও চিহ্নিত (মূল্যায়ন হবে)',
    hi: 'उत्तर दिया व चिह्नित (मूल्यांकन होगा)',
  },
});

export const minutesLabel = (n) => ({ en: `${n} min`, bn: `${n} মিনিট`, hi: `${n} मिनट` });
export const perQuestionLabel = (n) => ({ en: `${n} s per question`, bn: `প্রতি প্রশ্নে ${n} সেকেন্ড`, hi: `प्रति प्रश्न ${n} सेकंड` });
export const questionOfLabel = (i, n) => ({ en: `Question ${i} of ${n}`, bn: `প্রশ্ন ${i} / ${n}`, hi: `प्रश्न ${i} / ${n}` });
export const markingLabel = (p, n) => ({
  en: `+${p} for correct, −${n} for wrong`,
  bn: `সঠিক উত্তরে +${p}, ভুলে −${n}`,
  hi: `सही पर +${p}, गलत पर −${n}`,
});
export const onlyAvailable = (n) => ({
  en: `Only ${n} questions are available for this choice.`,
  bn: `এই বাছাইয়ে মাত্র ${n}টি প্রশ্ন আছে।`,
  hi: `इस चुनाव के लिए केवल ${n} प्रश्न उपलब्ध हैं।`,
});
export const startWith = (n) => ({ en: `Start with ${n} questions`, bn: `${n}টি প্রশ্ন নিয়ে শুরু করুন`, hi: `${n} प्रश्नों से शुरू करें` });

/** Result & performance analytics dashboard strings. */
export const ANALYTICS = Object.freeze({
  title: { en: 'Performance analysis', bn: 'পারফরম্যান্স বিশ্লেষণ', hi: 'प्रदर्शन विश्लेषण' },
  percentile: { en: 'Percentile', bn: 'পার্সেন্টাইল', hi: 'पर्सेंटाइल' },
  timePerQuestion: { en: 'Time per question', bn: 'প্রতি প্রশ্নে সময়', hi: 'प्रति प्रश्न समय' },
  cutoffTitle: { en: 'Cut-off check', bn: 'কাট-অফ তুলনা', hi: 'कट-ऑफ तुलना' },
  cutoffNote: {
    en: 'Compared as a share of full marks. Your mock covers one subject, so treat this as a guide, not a prediction.',
    bn: 'পূর্ণমানের শতাংশ হিসেবে তুলনা। আপনার মক টেস্ট একটি বিষয়ের, তাই এটি পূর্বাভাস নয়, শুধু একটি দিশা।',
    hi: 'पूर्णांक के प्रतिशत के रूप में तुलना। आपका मॉक एक विषय का है, इसलिए इसे भविष्यवाणी नहीं, मार्गदर्शन मानें।',
  },
  you: { en: 'You', bn: 'আপনি', hi: 'आप' },
  source: { en: 'Source', bn: 'সূত্র', hi: 'स्रोत' },
  answerBreakdown: { en: 'Answer breakdown', bn: 'উত্তরের বিশ্লেষণ', hi: 'उत्तर विश्लेषण' },
  topicAccuracy: { en: 'Accuracy by topic', bn: 'অধ্যায়ভিত্তিক নির্ভুলতা', hi: 'अध्यायवार सटीकता' },
  timeChart: { en: 'Time management', bn: 'সময় ব্যবস্থাপনা', hi: 'समय प्रबंधन' },
  timeLegend: { en: 'Bar: time you took · dashed line: target time', bn: 'বার: আপনার সময় · ড্যাশ লাইন: লক্ষ্য সময়', hi: 'बार: आपका समय · डैश लाइन: लक्ष्य समय' },
  weakTitle: { en: 'Where you lost the most marks', bn: 'কোথায় সবচেয়ে বেশি নম্বর হারিয়েছেন', hi: 'सबसे ज़्यादा अंक कहाँ गंवाए' },
  noWeak: { en: 'No marks lost. A perfect paper!', bn: 'কোনো নম্বর হারাননি। নিখুঁত!', hi: 'कोई अंक नहीं गंवाया। परफेक्ट!' },
  retryTitle: { en: 'Re-attempt incorrect questions', bn: 'ভুল প্রশ্নগুলো আবার চেষ্টা করুন', hi: 'गलत प्रश्न फिर से हल करें' },
  retryStart: { en: 'Start retry', bn: 'রিট্রাই শুরু করুন', hi: 'रीट्राई शुरू करें' },
  retryNone: { en: 'Nothing to retry: every question is correct.', bn: 'আবার চেষ্টার কিছু নেই: সব সঠিক।', hi: 'दोहराने को कुछ नहीं: सब सही।' },
  retryDone: { en: 'Retry complete', bn: 'রিট্রাই সম্পূর্ণ', hi: 'रीट्राई पूरा' },
  backToAnalysis: { en: 'Back to analysis', bn: 'বিশ্লেষণে ফিরুন', hi: 'विश्लेषण पर लौटें' },
  reviewTitle: { en: 'Question-by-question review', bn: 'প্রশ্নভিত্তিক পর্যালোচনা', hi: 'प्रश्नवार समीक्षा' },
  filterAll: { en: 'All', bn: 'সব', hi: 'सभी' },
  filterIncorrect: { en: 'Incorrect', bn: 'ভুল', hi: 'गलत' },
  filterUnattempted: { en: 'Unattempted', bn: 'উত্তর দেওয়া হয়নি', hi: 'छोड़े गए' },
  filterMarked: { en: 'Marked for review', bn: 'রিভিউর জন্য চিহ্নিত', hi: 'समीक्षा हेतु चिह्नित' },
  explanationLanguage: { en: 'Explanation', bn: 'ব্যাখ্যা', hi: 'व्याख्या' },
  both: { en: 'Both', bn: 'দুটোই', hi: 'दोनों' },
  yourAnswer: { en: 'Your answer', bn: 'আপনার উত্তর', hi: 'आपका उत्तर' },
  correctAnswer: { en: 'Correct answer', bn: 'সঠিক উত্তর', hi: 'सही उत्तर' },
  solution: { en: 'Solution', bn: 'সমাধান', hi: 'हल' },
  noneInFilter: { en: 'No questions in this view.', bn: 'এখানে কোনো প্রশ্ন নেই।', hi: 'यहाँ कोई प्रश्न नहीं।' },
  marked: { en: 'Marked', bn: 'চিহ্নিত', hi: 'चिह्नित' },
  unavailable: { en: 'This question is no longer in the bank.', bn: 'এই প্রশ্নটি আর প্রশ্নভাণ্ডারে নেই।', hi: 'यह प्रश्न अब प्रश्न बैंक में नहीं है।' },
});

export const rankLabel = (r, of) => ({ en: `Rank ${r} of ${of}`, bn: `র‍্যাঙ্ক ${r} / ${of}`, hi: `रैंक ${r} / ${of}` });
export const percentileBasis = (n, count) => ({
  en: `among ${n} students who took a comparable ${count}-question test`,
  bn: `${count} প্রশ্নের সমতুল্য টেস্ট দেওয়া ${n} জন শিক্ষার্থীর মধ্যে`,
  hi: `${count} प्रश्नों का समान टेस्ट देने वाले ${n} छात्रों में`,
});
export const percentilePending = (min) => ({
  en: `Appears once ${min} students have taken a comparable test.`,
  bn: `সমতুল্য টেস্ট ${min} জন দিলে দেখা যাবে।`,
  hi: `${min} छात्रों के समान टेस्ट देने के बाद दिखेगा।`,
});
export const targetSeconds = (s) => ({ en: `target ${s}s`, bn: `লক্ষ্য ${s} সে.`, hi: `लक्ष्य ${s} से.` });
export const cutoffNone = (cat) => ({
  en: `No official cut-offs have been added for ${cat.en ?? cat} yet.`,
  bn: `${cat.bn ?? cat.en ?? cat}-এর কোনো সরকারি কাট-অফ এখনও যোগ করা হয়নি।`,
  hi: `${cat.hi ?? cat.en ?? cat} के लिए अभी कोई आधिकारिक कट-ऑफ नहीं जोड़ा गया है।`,
});
export const vsCutoff = (d) =>
  d >= 0
    ? { en: `${d}% above`, bn: `${d}% বেশি`, hi: `${d}% अधिक` }
    : { en: `${-d}% below`, bn: `${-d}% কম`, hi: `${-d}% कम` };
export const overTarget = (n) => ({
  en: `${n} ${n === 1 ? 'question' : 'questions'} took longer than the target`,
  bn: `${n}টি প্রশ্নে লক্ষ্যের চেয়ে বেশি সময় লেগেছে`,
  hi: `${n} प्रश्नों में लक्ष्य से अधिक समय लगा`,
});
/** "Time & Work: 3 incorrect, 2 left blank, 8.5 marks lost" (only the parts that apply). */
export const weakLine = (name, incorrect, blank, lost) => {
  const parts = (inc, bl) => [incorrect && inc, blank && bl].filter(Boolean).join(', ');
  return {
    en: `${name.en}: ${parts(`${incorrect} incorrect`, `${blank} left blank`)}, ${lost} marks lost`,
    bn: `${name.bn ?? name.en}: ${parts(`${incorrect}টি ভুল`, `${blank}টি ফাঁকা`)}, ${lost} নম্বর হারিয়েছেন`,
    hi: `${name.hi ?? name.en}: ${parts(`${incorrect} गलत`, `${blank} छोड़े`)}, ${lost} अंक गंवाए`,
  };
};
export const practiceN = (n, name) => ({
  en: `Practice ${n} ${name.en} questions now`,
  bn: `এখনই ${n}টি প্রশ্ন অনুশীলন করুন: ${name.bn ?? name.en}`,
  hi: `अभी ${name.hi ?? name.en} के ${n} प्रश्न हल करें`,
});
/** "3 wrong answers + 2 left blank, weakest topic first." Says exactly what the retry set holds. */
export const retryLine = (wrong, blank) => ({
  en: `${wrong} wrong ${wrong === 1 ? 'answer' : 'answers'}${blank ? ` + ${blank} left blank` : ''}, weakest topic first.`,
  bn: `${wrong}টি ভুল উত্তর${blank ? ` + ফাঁকা রাখা ${blank}টি` : ''}, দুর্বলতম অধ্যায় আগে।`,
  hi: `${wrong} गलत उत्तर${blank ? ` + ${blank} छोड़े गए` : ''}, सबसे कमज़ोर अध्याय पहले।`,
});
export const retryBlanks = (k) => ({
  en: `No wrong answers. Retry the ${k} you left blank.`,
  bn: `কোনো ভুল নেই। ফাঁকা রাখা ${k}টি প্রশ্ন আবার চেষ্টা করুন।`,
  hi: `कोई गलत नहीं। छोड़े गए ${k} प्रश्न फिर हल करें।`,
});

// ------------------------------------------------------------ exam info panel
export const EXAM_INFO = Object.freeze({
  heading: { en: 'About the exam', bn: 'পরীক্ষা সম্পর্কে', hi: 'परीक्षा के बारे में' },
  tabsLabel: { en: 'Exams in this category', bn: 'এই বিভাগের পরীক্ষা', hi: 'इस श्रेणी की परीक्षाएँ' },
  questions: { en: 'Questions', bn: 'প্রশ্ন', hi: 'प्रश्न' },
  marks: { en: 'Marks', bn: 'নম্বর', hi: 'अंक' },
  duration: { en: 'Time', bn: 'সময়', hi: 'समय' },
  negative: { en: 'Negative marking', bn: 'নেগেটিভ মার্কিং', hi: 'नकारात्मक अंकन' },
  noNegative: { en: 'None', bn: 'নেই', hi: 'नहीं' },
  varies: { en: 'Varies by section', bn: 'বিভাগ অনুযায়ী আলাদা', hi: 'खंड के अनुसार अलग' },
  pattern: { en: 'Exam pattern', bn: 'পরীক্ষার ধরন', hi: 'परीक्षा पैटर्न' },
  section: { en: 'Section', bn: 'বিভাগ', hi: 'खंड' },
  qs: { en: 'Qs', bn: 'প্রশ্ন', hi: 'प्रश्न' },
  each: { en: 'Marks each', bn: 'প্রতিটি নম্বর', hi: 'प्रति प्रश्न अंक' },
  minus: { en: 'Wrong', bn: 'ভুলে', hi: 'गलत पर' },
  sectional: { en: 'Time', bn: 'সময়', hi: 'समय' },
  ourBank: { en: 'Our bank', bn: 'আমাদের প্রশ্ন', hi: 'हमारे प्रश्न' },
  modes: {
    CBT: { en: 'computer-based', bn: 'কম্পিউটার-ভিত্তিক', hi: 'कंप्यूटर आधारित' },
    OMR: { en: 'OMR sheet', bn: 'OMR শিট', hi: 'OMR शीट' },
    OFFLINE: { en: 'pen and paper', bn: 'কাগজ-কলমে', hi: 'कागज़-कलम' },
    DESCRIPTIVE: { en: 'descriptive', bn: 'বর্ণনামূলক', hi: 'वर्णनात्मक' },
  },
  session: (n) => ({ en: `Session ${n}`, bn: `সেশন ${n}`, hi: `सत्र ${n}` }),
  total: { en: 'Total', bn: 'মোট', hi: 'कुल' },
  afterThis: { en: 'After this stage', bn: 'এই ধাপের পরে', hi: 'इस चरण के बाद' },
  pastExams: { en: 'Previous exams', bn: 'আগের পরীক্ষা', hi: 'पिछली परीक्षाएँ' },
  dates: { en: 'Held on', bn: 'অনুষ্ঠিত', hi: 'आयोजित' },
  vacancies: { en: 'Vacancies', bn: 'শূন্যপদ', hi: 'रिक्तियाँ' },
  source: { en: 'Source', bn: 'সূত্র', hi: 'स्रोत' },
  newsSource: { en: 'news report', bn: 'সংবাদ প্রতিবেদন', hi: 'समाचार रिपोर्ट' },
  officialSite: { en: 'Official website', bn: 'অফিসিয়াল ওয়েবসাইট', hi: 'आधिकारिक वेबसाइट' },
  patternSource: { en: 'Pattern source', bn: 'প্যাটার্নের সূত্র', hi: 'पैटर्न का स्रोत' },
  asOf: (s) => ({ en: `As per the ${s}`, bn: `${s} অনুযায়ী`, hi: `${s} के अनुसार` }),
  verify: {
    en: 'Patterns can change with each notification. Always confirm with the official notice before you apply.',
    bn: 'প্রতিটি বিজ্ঞপ্তিতে প্যাটার্ন বদলাতে পারে। আবেদনের আগে অফিসিয়াল বিজ্ঞপ্তি দেখে নিশ্চিত হন।',
    hi: 'हर अधिसूचना के साथ पैटर्न बदल सकता है। आवेदन से पहले आधिकारिक सूचना से पुष्टि करें।',
  },
  patternPending: {
    en: 'The verified exam pattern for this exam has not been added yet.',
    bn: 'এই পরীক্ষার যাচাই-করা প্যাটার্ন এখনও যোগ করা হয়নি।',
    hi: 'इस परीक्षा का सत्यापित पैटर्न अभी जोड़ा नहीं गया है।',
  },
  datesPending: {
    en: 'Past exam dates have not been added yet.',
    bn: 'আগের পরীক্ষার তারিখ এখনও যোগ করা হয়নি।',
    hi: 'पिछली परीक्षा की तिथियाँ अभी जोड़ी नहीं गई हैं।',
  },
});
export const minutesShort = (n) => ({ en: `${n} min`, bn: `${n} মি.`, hi: `${n} मि.` });
export const negativeLabel = (x) => ({ en: `−${x} per wrong`, bn: `ভুলে −${x}`, hi: `गलत पर −${x}` });

// --------------------------------------------------------------------- auth
export const AUTH = Object.freeze({
  login: { en: 'Log in', bn: 'লগ ইন', hi: 'लॉग इन' },
  register: { en: 'Create account', bn: 'অ্যাকাউন্ট খুলুন', hi: 'खाता बनाएँ' },
  logout: { en: 'Log out', bn: 'লগ আউট', hi: 'लॉग आउट' },
  nudgeTitle: { en: 'Your progress is not being tracked', bn: 'আপনার অগ্রগতি ট্র্যাক হচ্ছে না', hi: 'आपकी प्रगति ट्रैक नहीं हो रही है' },
  nudgeBody: {
    en: 'You are not logged in, so we cannot track your progress. Log in and we will track your accuracy, streaks and weak topics.',
    bn: 'আপনি লগ ইন করেননি, তাই আপনার অগ্রগতি ট্র্যাক করা যাচ্ছে না। লগ ইন করলে আমরা আপনার নির্ভুলতা, টানা দিন ও দুর্বল বিষয় ট্র্যাক করব।',
    hi: 'आप लॉग इन नहीं हैं, इसलिए आपकी प्रगति ट्रैक नहीं हो सकती। लॉग इन करें, हम आपकी सटीकता, स्ट्रीक और कमज़ोर विषय ट्रैक करेंगे।',
  },
  nudgeLater: { en: 'Maybe later', bn: 'পরে করব', hi: 'बाद में' },
  loginTitle: { en: 'Welcome back', bn: 'আবার স্বাগতম', hi: 'फिर से स्वागत है' },
  registerTitle: { en: 'Create your free account', bn: 'বিনামূল্যে অ্যাকাউন্ট খুলুন', hi: 'अपना मुफ़्त खाता बनाएँ' },
  why: {
    en: 'Your practice answers and mock results are saved to your account, so you can track accuracy, streaks and weak topics on any device.',
    bn: 'আপনার অনুশীলন ও মক টেস্টের ফল অ্যাকাউন্টে জমা থাকে, তাই যেকোনো ডিভাইসে নির্ভুলতা, ধারাবাহিকতা ও দুর্বল অধ্যায় দেখতে পারবেন।',
    hi: 'आपके अभ्यास उत्तर और मॉक परिणाम खाते में सेव होते हैं, ताकि आप किसी भी डिवाइस पर सटीकता, स्ट्रीक और कमज़ोर अध्याय देख सकें।',
  },
  name: { en: 'Full name', bn: 'পুরো নাম', hi: 'पूरा नाम' },
  email: { en: 'Email', bn: 'ইমেল', hi: 'ईमेल' },
  mobile: { en: 'Mobile number (optional)', bn: 'মোবাইল নম্বর (ঐচ্ছিক)', hi: 'मोबाइल नंबर (वैकल्पिक)' },
  mobileHint: { en: '10-digit Indian number, without +91', bn: '১০ সংখ্যার ভারতীয় নম্বর, +91 ছাড়া', hi: '10 अंकों का भारतीय नंबर, +91 के बिना' },
  password: { en: 'Password', bn: 'পাসওয়ার্ড', hi: 'पासवर्ड' },
  passwordHint: { en: 'At least 8 characters', bn: 'অন্তত ৮টি অক্ষর', hi: 'कम से कम 8 अक्षर' },
  showPassword: { en: 'Show', bn: 'দেখান', hi: 'दिखाएँ' },
  hidePassword: { en: 'Hide', bn: 'লুকান', hi: 'छिपाएँ' },
  submitting: { en: 'Please wait…', bn: 'অপেক্ষা করুন…', hi: 'कृपया प्रतीक्षा करें…' },
  noAccount: { en: 'New here?', bn: 'নতুন?', hi: 'नए हैं?' },
  haveAccount: { en: 'Already have an account?', bn: 'আগেই অ্যাকাউন্ট আছে?', hi: 'पहले से खाता है?' },
  myPerformance: { en: 'My performance', bn: 'আমার পারফরম্যান্স', hi: 'मेरा प्रदर्शन' },
  account: { en: 'Account', bn: 'অ্যাকাউন্ট', hi: 'खाता' },
  loginToTrack: {
    en: 'Log in to save your results and track your progress.',
    bn: 'ফল সংরক্ষণ ও অগ্রগতি দেখতে লগ ইন করুন।',
    hi: 'परिणाम सेव करने और प्रगति देखने के लिए लॉग इन करें।',
  },
  loginToStartMock: { en: 'Log in to start the test', bn: 'টেস্ট শুরু করতে লগ ইন করুন', hi: 'टेस्ट शुरू करने के लिए लॉग इन करें' },
  mockNeedsLogin: {
    en: 'Mock tests are saved to your account so you can see the full analysis later.',
    bn: 'মক টেস্ট আপনার অ্যাকাউন্টে সংরক্ষিত হয়, যাতে পরে পুরো বিশ্লেষণ দেখতে পারেন।',
    hi: 'मॉक टेस्ट आपके खाते में सेव होते हैं, ताकि आप बाद में पूरा विश्लेषण देख सकें।',
  },
});

// --------------------------------------------------------- my performance
export const PERF = Object.freeze({
  title: { en: 'My performance', bn: 'আমার পারফরম্যান্স', hi: 'मेरा प्रदर्शन' },
  hello: (name) => ({ en: `Hi ${name}, here is how you are doing.`, bn: `নমস্কার ${name}, আপনার অগ্রগতি দেখুন।`, hi: `नमस्ते ${name}, आपकी प्रगति यह रही।` }),
  practiced: { en: 'Questions practised', bn: 'অনুশীলিত প্রশ্ন', hi: 'अभ्यास किए प्रश्न' },
  practiceAccuracy: { en: 'Practice accuracy', bn: 'অনুশীলনে নির্ভুলতা', hi: 'अभ्यास सटीकता' },
  mocksTaken: { en: 'Mock tests taken', bn: 'মক টেস্ট দেওয়া', hi: 'दिए गए मॉक टेस्ट' },
  avgMock: { en: 'Average mock score', bn: 'গড় মক স্কোর', hi: 'औसत मॉक स्कोर' },
  best: (p) => ({ en: `best ${p}%`, bn: `সেরা ${p}%`, hi: `सर्वश्रेष्ठ ${p}%` }),
  today: { en: 'Answered today', bn: 'আজ উত্তর দিয়েছেন', hi: 'आज उत्तर दिए' },
  streak: { en: 'Day streak', bn: 'টানা দিন', hi: 'लगातार दिन' },
  trend: { en: 'Mock score trend', bn: 'মক স্কোরের ধারা', hi: 'मॉक स्कोर का रुझान' },
  trendHint: { en: 'Score as % of the maximum, oldest to newest', bn: 'সর্বোচ্চ নম্বরের শতাংশে স্কোর, পুরনো থেকে নতুন', hi: 'अधिकतम अंकों के % में स्कोर, पुराने से नए' },
  bySubject: { en: 'Practice accuracy by subject', bn: 'বিষয়ভিত্তিক অনুশীলন নির্ভুলতা', hi: 'विषयवार अभ्यास सटीकता' },
  weak: { en: 'Topics to work on', bn: 'যে অধ্যায়ে আরও অনুশীলন দরকার', hi: 'जिन अध्यायों पर काम करना है' },
  weakHint: (n) => ({ en: `Lowest accuracy among topics with ${n}+ answers`, bn: `অন্তত ${n}টি উত্তর আছে এমন অধ্যায়ের মধ্যে সবচেয়ে কম নির্ভুলতা`, hi: `कम से कम ${n} उत्तर वाले अध्यायों में सबसे कम सटीकता` }),
  noWeak: (n) => ({ en: `Answer ${n} questions in a topic to see how you are doing in it.`, bn: `কোনো অধ্যায়ে ${n}টি প্রশ্নের উত্তর দিলে সেখানে আপনার অবস্থা দেখা যাবে।`, hi: `किसी अध्याय में ${n} प्रश्नों के उत्तर दें, तब उसमें आपकी स्थिति दिखेगी।` }),
  practice: { en: 'Practise', bn: 'অনুশীলন', hi: 'अभ्यास' },
  recent: { en: 'Recent mock tests', bn: 'সাম্প্রতিক মক টেস্ট', hi: 'हाल के मॉक टेस्ट' },
  viewAnalysis: { en: 'View analysis', bn: 'বিশ্লেষণ দেখুন', hi: 'विश्लेषण देखें' },
  noMocks: { en: 'No mock tests yet. Take one from any topic page.', bn: 'এখনও কোনো মক টেস্ট নেই। যেকোনো অধ্যায়ের পাতা থেকে শুরু করুন।', hi: 'अभी कोई मॉक टेस्ट नहीं। किसी भी अध्याय पेज से शुरू करें।' },
  empty: { en: 'Start practising. Your progress will appear here.', bn: 'অনুশীলন শুরু করুন। আপনার অগ্রগতি এখানে দেখা যাবে।', hi: 'अभ्यास शुरू करें। आपकी प्रगति यहाँ दिखेगी।' },
  startPractice: { en: 'Choose an exam', bn: 'পরীক্ষা বেছে নিন', hi: 'परीक्षा चुनें' },
  answers: (n) => ({ en: `${n} answered`, bn: `${n}টি উত্তর`, hi: `${n} उत्तर` }),
  questionsShort: (n) => ({ en: `${n} Qs`, bn: `${n}টি প্রশ্ন`, hi: `${n} प्रश्न` }),
});

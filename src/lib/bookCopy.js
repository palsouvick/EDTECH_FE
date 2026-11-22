/**
 * Interface labels for the study books. The chapter text itself is Bengali only (owner decision, 2026-11-11);
 * these labels follow the student's language switch like the rest of the app.
 */
const L = (en, bn) => ({ en, bn });
export const bnNum = (n) => String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[d]);
const N = (n) => L(String(n), bnNum(n));

/** GK cards that have a book, and where it lives. */
export const BOOK_FOR_CARD = Object.freeze({
  indian_history: 'history', geography: 'geography', polity: 'polity',
  general_science: 'science', economy: 'economy', environment: 'environment', art_culture: 'art_culture',
  indian_gk: 'indian_gk', static_gk: 'static_gk', important_days: 'important_days', organisations: 'organisations',
  industrial_safety: 'industrial_safety', wb_industry: 'wb_industry',
});
/** Card code from the address (`indian-history` → `indian_history`). */
export const cardFromSlug = (slug = '') => slug.replace(/-/g, '_');
const slugOf = (card) => card.toLowerCase().replace(/_/g, '-');
export const bookHomePath = (card) => `/learn/gk/${slugOf(card)}/book`;
export const bookChapterPath = (card, code, section) => `/learn/gk/${slugOf(card)}/book/${code}${section ? `#sec-${section}` : ''}`;

export const BOOK = {
  open: L('Read History as a book', 'ইতিহাস বইয়ের মতো পড়ো'),
  openHint: L('Chapter by chapter, from zero, with practice after every chapter', 'শূন্য থেকে, অধ্যায় ধরে ধরে; প্রতিটি অধ্যায়ের পরে অনুশীলন'),
  homeTitle: L('History: study like a book', 'ইতিহাস: বইয়ের মতো পড়ো'),
  homeIntro: L(
    'Read each chapter in order, practise its questions, see your weak sections and revise them. Chapter text is in Bengali, based on NCERT textbooks.',
    'প্রতিটি অধ্যায় ক্রম অনুযায়ী পড়ো, তার প্রশ্ন অনুশীলন করো, দুর্বল অংশ দেখে আবার পড়ো। অধ্যায়ের লেখা বাংলায়, এনসিইআরটি পাঠ্যবইয়ের ভিত্তিতে।',
  ),
  backToCard: L('History card', 'ইতিহাস কার্ড'),
  backToBook: L('Contents', 'সূচিপত্র'),
  contents: L('Contents', 'সূচিপত্র'),
  completed: (p) => L(`${p}% completed`, `${bnNum(p)}% সম্পূর্ণ`),
  sectionsRead: (r, t) => L(`${r} of ${t} sections read`, `${bnNum(t)}টি অংশের মধ্যে ${bnNum(r)}টি পড়া হয়েছে`),
  chaptersReady: (a, t) => L(`${a} of ${t} chapters ready to read; the rest are being written`, `${bnNum(t)}টি অধ্যায়ের মধ্যে ${bnNum(a)}টি এখন পড়া যায়; বাকিগুলি লেখা চলছে`),
  resumeTitle: L('Continue reading', 'পড়া চালিয়ে যাও'),
  resumeStopped: (n, title) => L(`You stopped at Chapter ${n}: ${title}`, `তুমি থেমেছিলে অধ্যায় ${bnNum(n)}: ${title}`),
  resumeStart: (n, title) => L(`Start with Chapter ${n}: ${title}`, `শুরু করো অধ্যায় ${bnNum(n)}: ${title} দিয়ে`),
  resumeCta: L('Continue reading →', 'পড়া চালিয়ে যাও →'),
  startCta: L('Start reading →', 'পড়া শুরু করো →'),
  chapterN: (n) => L(`Chapter ${n}`, `অধ্যায় ${bnNum(n)}`),
  comingSoon: L('Coming soon', 'শীঘ্রই আসছে'),
  draft: L('Draft for review: not visible to students yet', 'পর্যালোচনার খসড়া: শিক্ষার্থীরা এখনও দেখতে পায় না'),
  weight: L('★ Asked often', '★ প্রায়ই আসে'),
  bengal: L('🐅 Bengal link', '🐅 বাংলার যোগ'),
  status: {
    not_started: L('Not started', 'শুরু হয়নি'),
    reading: L('Reading', 'পড়া চলছে'),
    read: L('Read', 'পড়া হয়েছে'),
    tested: L('Tested', 'পরীক্ষা দেওয়া হয়েছে'),
    mastered: L('Mastered', 'আয়ত্ত হয়েছে'),
  },
  minutes: (m) => L(`${m} min`, `${bnNum(m)} মিনিট`),
  questions: (n) => L(`${n} questions`, `${bnNum(n)}টি প্রশ্ন`),
  pyqs: (n) => L(`${n} PYQs`, `${bnNum(n)}টি পূর্ববর্তী প্রশ্ন`),
  signInToKeep: L('Sign in to keep your progress on every device. For now it is saved in this browser.', 'সব ডিভাইসে অগ্রগতি রাখতে সাইন ইন করো। এখন এটি এই ব্রাউজারে রাখা হচ্ছে।'),

  depth: L('Reading depth', 'পড়ার গভীরতা'),
  depths: {
    quick: { title: L('Quick', 'সংক্ষেপে'), hint: L('Short revision', 'দ্রুত রিভিশন') },
    standard: { title: L('Standard', 'সাধারণ'), hint: L('Full chapter', 'পুরো অধ্যায়') },
    deep: { title: L('Deep study', 'গভীর পাঠ'), hint: L('Extra depth', 'আরও বিস্তারিত') },
  },
  overview: L('Chapter overview', 'অধ্যায়ের পরিচিতি'),
  youWillLearn: L('In this chapter you will learn', 'এই অধ্যায়ে তুমি শিখবে'),
  readFirst: L('Read first', 'আগে পড়ে নাও'),
  sectionsNav: L('Sections', 'অংশগুলি'),
  deepMore: L('Deep study', 'গভীর পাঠ'),
  figureCredit: L('Image', 'ছবি'),
  figureOpen: L('Open the full-size image and its licence', 'পূর্ণ আকারের ছবি ও লাইসেন্স দেখো'),
  markRead: L('Mark section as read', 'এই অংশ পড়া হয়েছে'),
  isRead: L('Read ✓', 'পড়া হয়েছে ✓'),
  sectionPyq: L('Asked in previous papers', 'আগের প্রশ্নপত্রে এসেছে'),
  sources: L('Sources', 'সূত্র'),
  relatedFacts: L('Related GK facts', 'সম্পর্কিত সাধারণ জ্ঞানের তথ্য'),
  boxes: {
    exam_note: L('Exam note', 'পরীক্ষার কথা'),
    dont_confuse: L("Don't confuse", 'গুলিয়ে ফেলো না'),
    did_you_know: L('Did you know?', 'জানো কি?'),
    bengal: L('Bengal connection', 'বাংলার যোগ'),
    remember: L('Remember', 'মনে রাখো'),
  },
  events: L('Important events', 'গুরুত্বপূর্ণ ঘটনা'),
  whyMatters: L('Why it matters', 'কেন গুরুত্বপূর্ণ'),
  people: L('Important people', 'গুরুত্বপূর্ণ ব্যক্তি'),
  timeline: L('Timeline', 'সময়রেখা'),
  terms: L('Important terms', 'গুরুত্বপূর্ণ পরিভাষা'),
  causeEffect: L('Cause → Event → Result', 'কারণ → ঘটনা → ফলাফল'),
  causes: L('Why did it happen?', 'কেন ঘটল?'),
  event: L('What happened?', 'কী ঘটল?'),
  results: L('What was the result?', 'ফল কী হল?'),
  examFocus: L('Exam focus', 'পরীক্ষার দিক থেকে'),
  examFocusNote: L(
    'Exam names and years come only from real previous-year papers in this app. For WBP, KP and SSC there are no History papers in the app yet, so their relevance is by syllabus only.',
    'পরীক্ষার নাম ও সাল শুধু এই অ্যাপে থাকা আসল পূর্ববর্তী প্রশ্নপত্র থেকে নেওয়া। WBP, KP ও SSC-র ইতিহাসের প্রশ্নপত্র এখনও অ্যাপে নেই, তাই সেগুলির ক্ষেত্রে গুরুত্ব কেবল সিলেবাস অনুযায়ী।',
  ),
  bengalConnection: L('Bengal connection', 'বাংলার যোগ'),
  locate: L('Locate it', 'কোথায় অবস্থিত'),
  locatePlace: L('Place', 'স্থান'),
  locateWhere: L('Where', 'কোথায়'),
  locateAbout: L('What to remember', 'কী মনে রাখবে'),
  quickRevision: L('Quick revision', 'দ্রুত রিভিশন'),
  pyqConnection: L('Previous-year question connection', 'পূর্ববর্তী বছরের প্রশ্নের সঙ্গে যোগ'),
  pyqConnectionNone: L('No previous-year question in the app is linked to this chapter yet.', 'এই অ্যাপের কোনও পূর্ববর্তী প্রশ্ন এখনও এই অধ্যায়ের সঙ্গে যুক্ত হয়নি।'),
  pyqByExam: (exam, count, years) => L(`${exam}: ${count} (${years.join(', ')})`, `${exam}: ${bnNum(count)}টি (${years.map(bnNum).join(', ')})`),

  practiceTitle: L('Practise this chapter', 'এই অধ্যায় অনুশীলন করো'),
  practiceHint: L('Read → practise → see weak sections → revise → test again', 'পড়ো → অনুশীলন করো → দুর্বল অংশ দেখো → আবার পড়ো → আবার পরীক্ষা দাও'),
  modes: {
    practice: (n) => L(`Practice: all ${n} questions`, `অনুশীলন: সব ${bnNum(n)}টি প্রশ্ন`),
    mini: (n) => L(`Mini test: ${n} questions`, `মিনি টেস্ট: ${bnNum(n)}টি প্রশ্ন`),
    pyq: (n) => L(`Previous-year questions (${n})`, `পূর্ববর্তী বছরের প্রশ্ন (${bnNum(n)})`),
    weak: L('Weak sections again', 'দুর্বল অংশগুলি আবার'),
  },
  levelCounts: L('Levels', 'স্তর'),
  levels: {
    basic: L('Basic', 'প্রাথমিক'),
    moderate: L('Moderate', 'মাঝারি'),
    difficult: L('Difficult', 'কঠিন'),
    exam: L('Exam-style', 'পরীক্ষার ধাঁচে'),
    pyq: L('PYQ', 'পূর্ববর্তী প্রশ্ন'),
  },
  finish: L('Finish and see analysis', 'শেষ করো ও বিশ্লেষণ দেখো'),
  close: L('Close', 'বন্ধ করো'),
  analysisTitle: L('Your result', 'তোমার ফল'),
  score: (c, t) => L(`${c} of ${t} correct`, `${bnNum(t)}টির মধ্যে ${bnNum(c)}টি সঠিক`),
  bySection: L('By section', 'অংশ অনুযায়ী'),
  weakTitle: L('Your weak areas', 'তোমার দুর্বল অংশ'),
  weakNone: L('No weak section yet. Keep practising to get a clearer picture.', 'এখনও কোনও দুর্বল অংশ নেই। আরও অনুশীলন করলে ছবিটা পরিষ্কার হবে।'),
  revise: L('Revise this section', 'এই অংশ আবার পড়ো'),
  testAgain: L('Test again on these sections', 'এই অংশগুলিতে আবার পরীক্ষা দাও'),
  bestMini: (p) => L(`Best mini test: ${p}%`, `মিনি টেস্টে সেরা: ${bnNum(p)}%`),
  previous: L('← Previous chapter', '← আগের অধ্যায়'),
  next: L('Next chapter →', 'পরের অধ্যায় →'),
  notFound: L('This chapter is not available yet.', 'এই অধ্যায়টি এখনও পাওয়া যায় না।'),
  num: N,
};

/** Labels that name the book (History or Geography); everything else in BOOK is shared. */
const BOOK_NAMED = Object.freeze({
  geography: {
    open: L('Read Geography as a book', 'ভূগোল বইয়ের মতো পড়ো'),
    homeTitle: L('Geography: study like a book', 'ভূগোল: বইয়ের মতো পড়ো'),
    homeIntro: L(
      'Read each chapter in order, practise its questions, see your weak sections and revise them. Chapter text is in Bengali, based on NCERT and West Bengal school textbooks.',
      'প্রতিটি অধ্যায় ক্রম অনুযায়ী পড়ো, তার প্রশ্ন অনুশীলন করো, দুর্বল অংশ দেখে আবার পড়ো। অধ্যায়ের লেখা বাংলায়, এনসিইআরটি ও পশ্চিমবঙ্গের স্কুল পাঠ্যবইয়ের ভিত্তিতে।',
    ),
    backToCard: L('Geography card', 'ভূগোল কার্ড'),
    examFocusNote: L(
      'Exam names and years come only from real previous-year papers in this app. For WBP, KP and SSC there are no Geography papers in the app yet, so their relevance is by syllabus only.',
      'পরীক্ষার নাম ও সাল শুধু এই অ্যাপে থাকা আসল পূর্ববর্তী প্রশ্নপত্র থেকে নেওয়া। WBP, KP ও SSC-র ভূগোলের প্রশ্নপত্র এখনও অ্যাপে নেই, তাই সেগুলির ক্ষেত্রে গুরুত্ব কেবল সিলেবাস অনুযায়ী।',
    ),
    bengalConnection: L('West Bengal connection', 'পশ্চিমবঙ্গের যোগ'),
  },
  polity: {
    open: L('Read Polity as a book', 'রাষ্ট্রব্যবস্থা বইয়ের মতো পড়ো'),
    homeTitle: L('Indian Polity and Constitution: study like a book', 'ভারতের সংবিধান ও রাষ্ট্রব্যবস্থা: বইয়ের মতো পড়ো'),
    homeIntro: L(
      'Read each chapter in order, practise its questions, see your weak sections and revise them. Chapter text is in Bengali, based on the Constitution of India, NCERT and West Bengal school textbooks.',
      'প্রতিটি অধ্যায় ক্রম অনুযায়ী পড়ো, তার প্রশ্ন অনুশীলন করো, দুর্বল অংশ দেখে আবার পড়ো। অধ্যায়ের লেখা বাংলায়, ভারতের সংবিধান, এনসিইআরটি ও পশ্চিমবঙ্গের স্কুল পাঠ্যবইয়ের ভিত্তিতে।',
    ),
    backToCard: L('Polity card', 'রাষ্ট্রব্যবস্থা কার্ড'),
    examFocusNote: L(
      'Exam names and years come only from real previous-year papers in this app. For WBP, KP and SSC there are no Polity papers in the app yet, so their relevance is by syllabus only.',
      'পরীক্ষার নাম ও সাল শুধু এই অ্যাপে থাকা আসল পূর্ববর্তী প্রশ্নপত্র থেকে নেওয়া। WBP, KP ও SSC-র রাষ্ট্রব্যবস্থার প্রশ্নপত্র এখনও অ্যাপে নেই, তাই সেগুলির ক্ষেত্রে গুরুত্ব কেবল সিলেবাস অনুযায়ী।',
    ),
    bengalConnection: L('West Bengal connection', 'পশ্চিমবঙ্গের যোগ'),
  },
  science: {
    open: L('Read General Science as a book', 'সাধারণ বিজ্ঞান বইয়ের মতো পড়ো'),
    homeTitle: L('General Science: study like a book', 'সাধারণ বিজ্ঞান: বইয়ের মতো পড়ো'),
    homeIntro: L(
      'Read each chapter in order, practise its questions, see your weak sections and revise them. Chapter text is in Bengali, based on NCERT textbooks.',
      'প্রতিটি অধ্যায় ক্রম অনুযায়ী পড়ো, তার প্রশ্ন অনুশীলন করো, দুর্বল অংশ দেখে আবার পড়ো। অধ্যায়ের লেখা বাংলায়, এনসিইআরটি পাঠ্যবইয়ের ভিত্তিতে।',
    ),
    backToCard: L('Science card', 'বিজ্ঞান কার্ড'),
    bengalConnection: L('West Bengal connection', 'পশ্চিমবঙ্গের যোগ'),
  },
  economy: {
    open: L('Read Economy and Banking as a book', 'অর্থনীতি ও ব্যাংকিং বইয়ের মতো পড়ো'),
    homeTitle: L('Indian Economy and Banking: study like a book', 'ভারতীয় অর্থনীতি ও ব্যাংকিং: বইয়ের মতো পড়ো'),
    homeIntro: L(
      'Read each chapter in order, practise its questions, see your weak sections and revise them. Chapter text is in Bengali, based on NCERT, the Reserve Bank of India and Government of India sources.',
      'প্রতিটি অধ্যায় ক্রম অনুযায়ী পড়ো, তার প্রশ্ন অনুশীলন করো, দুর্বল অংশ দেখে আবার পড়ো। অধ্যায়ের লেখা বাংলায়, এনসিইআরটি, ভারতীয় রিজার্ভ ব্যাংক ও ভারত সরকারের সূত্রের ভিত্তিতে।',
    ),
    backToCard: L('Economy card', 'অর্থনীতি কার্ড'),
    bengalConnection: L('West Bengal connection', 'পশ্চিমবঙ্গের যোগ'),
  },
  environment: {
    open: L('Read Environment and Ecology as a book', 'পরিবেশ ও বাস্তুতন্ত্র বইয়ের মতো পড়ো'),
    homeTitle: L('Environment and Ecology: study like a book', 'পরিবেশ ও বাস্তুতন্ত্র: বইয়ের মতো পড়ো'),
    homeIntro: L(
      'Read each chapter in order, practise its questions, see your weak sections and revise them. Chapter text is in Bengali, based on NCERT and Government of India sources.',
      'প্রতিটি অধ্যায় ক্রম অনুযায়ী পড়ো, তার প্রশ্ন অনুশীলন করো, দুর্বল অংশ দেখে আবার পড়ো। অধ্যায়ের লেখা বাংলায়, এনসিইআরটি ও ভারত সরকারের সূত্রের ভিত্তিতে।',
    ),
    backToCard: L('Environment card', 'পরিবেশ কার্ড'),
    bengalConnection: L('West Bengal connection', 'পশ্চিমবঙ্গের যোগ'),
  },
  art_culture: {
    open: L('Read Art and Culture as a book', 'শিল্প ও সংস্কৃতি বইয়ের মতো পড়ো'),
    homeTitle: L('Art and Culture: study like a book', 'শিল্প ও সংস্কৃতি: বইয়ের মতো পড়ো'),
    homeIntro: L(
      'Read each chapter in order, practise its questions, see your weak sections and revise them. Chapter text is in Bengali, based on NCERT and Government of India sources, with extra West Bengal material.',
      'প্রতিটি অধ্যায় ক্রম অনুযায়ী পড়ো, তার প্রশ্ন অনুশীলন করো, দুর্বল অংশ দেখে আবার পড়ো। অধ্যায়ের লেখা বাংলায়, এনসিইআরটি ও ভারত সরকারের সূত্রের ভিত্তিতে, পশ্চিমবঙ্গের বাড়তি উপাদানসহ।',
    ),
    backToCard: L('Art and Culture card', 'শিল্প ও সংস্কৃতি কার্ড'),
    bengalConnection: L('West Bengal connection', 'পশ্চিমবঙ্গের যোগ'),
  },
  indian_gk: {
    open: L('Read National Symbols, Firsts and Institutions as a book', 'জাতীয় প্রতীক, প্রথম ও প্রতিষ্ঠান বইয়ের মতো পড়ো'),
    homeTitle: L('National Symbols, Firsts and Institutions: study like a book', 'জাতীয় প্রতীক, প্রথম ও প্রতিষ্ঠান: বইয়ের মতো পড়ো'),
    homeIntro: L(
      'Read each chapter in order, practise its questions, see your weak sections and revise them. Chapter text is in Bengali, based on official Government of India sources.',
      'প্রতিটি অধ্যায় ক্রম অনুযায়ী পড়ো, তার প্রশ্ন অনুশীলন করো, দুর্বল অংশ দেখে আবার পড়ো। অধ্যায়ের লেখা বাংলায়, ভারত সরকারের আনুষ্ঠানিক সূত্রের ভিত্তিতে।',
    ),
    backToCard: L('Indian GK card', 'ভারতীয় জিকে কার্ড'),
    bengalConnection: L('West Bengal connection', 'পশ্চিমবঙ্গের যোগ'),
  },
  static_gk: {
    open: L('Read Static GK as a book', 'স্ট্যাটিক জিকে বইয়ের মতো পড়ো'),
    homeTitle: L('Static GK: study like a book', 'স্ট্যাটিক জিকে: বইয়ের মতো পড়ো'),
    homeIntro: L(
      'Read each chapter in order, practise its questions, see your weak sections and revise them. Chapter text is in Bengali, based on official sources.',
      'প্রতিটি অধ্যায় ক্রম অনুযায়ী পড়ো, তার প্রশ্ন অনুশীলন করো, দুর্বল অংশ দেখে আবার পড়ো। অধ্যায়ের লেখা বাংলায়, আনুষ্ঠানিক সূত্রের ভিত্তিতে।',
    ),
    backToCard: L('Static GK card', 'স্ট্যাটিক জিকে কার্ড'),
    bengalConnection: L('West Bengal connection', 'পশ্চিমবঙ্গের যোগ'),
  },
  important_days: {
    open: L('Read Important Days as a book', 'গুরুত্বপূর্ণ দিবস বইয়ের মতো পড়ো'),
    homeTitle: L('Important Days: study like a book', 'গুরুত্বপূর্ণ দিবস: বইয়ের মতো পড়ো'),
    homeIntro: L(
      'Read each month in order, practise its questions, see your weak sections and revise them. Chapter text is in Bengali, based on official sources. The date is permanent; a year theme is always named with its year.',
      'প্রতিটি মাস ক্রম অনুযায়ী পড়ো, তার প্রশ্ন অনুশীলন করো, দুর্বল অংশ দেখে আবার পড়ো। অধ্যায়ের লেখা বাংলায়, আনুষ্ঠানিক সূত্রের ভিত্তিতে। তারিখটি স্থায়ী; বছরের থিম সবসময় সালসহ লেখা হয়।',
    ),
    backToCard: L('Important Days card', 'গুরুত্বপূর্ণ দিবস কার্ড'),
    bengalConnection: L('West Bengal connection', 'পশ্চিমবঙ্গের যোগ'),
  },
  organisations: {
    open: L('Read Headquarters and Organisations as a book', 'সদর দপ্তর ও সংস্থা বইয়ের মতো পড়ো'),
    homeTitle: L('Headquarters and Organisations: study like a book', 'সদর দপ্তর ও সংস্থা: বইয়ের মতো পড়ো'),
    homeIntro: L(
      'Read each chapter in order, practise its questions, see your weak sections and revise them. Chapter text is in Bengali, based on official sources. Office-holders are given with the date they were checked.',
      'প্রতিটি অধ্যায় ক্রম অনুযায়ী পড়ো, তার প্রশ্ন অনুশীলন করো, দুর্বল অংশ দেখে আবার পড়ো। অধ্যায়ের লেখা বাংলায়, আনুষ্ঠানিক সূত্রের ভিত্তিতে। পদাধিকারীদের নাম যাচাইয়ের তারিখসহ দেওয়া হয়।',
    ),
    backToCard: L('Organisations card', 'সংস্থা কার্ড'),
    bengalConnection: L('West Bengal connection', 'পশ্চিমবঙ্গের যোগ'),
  },
  industrial_safety: {
    open: L('Read Industrial Safety and Pollution Control as a book', 'শিল্প নিরাপত্তা ও দূষণ নিয়ন্ত্রণ বইয়ের মতো পড়ো'),
    homeTitle: L('Industrial Safety and Pollution Control: study like a book', 'শিল্প নিরাপত্তা ও দূষণ নিয়ন্ত্রণ: বইয়ের মতো পড়ো'),
    homeIntro: L(
      'Read each chapter in order, practise its questions, see your weak sections and revise them. Chapter text is in Bengali, based on official Government of India sources and the Acts and rules themselves.',
      'প্রতিটি অধ্যায় ক্রম অনুযায়ী পড়ো, তার প্রশ্ন অনুশীলন করো, দুর্বল অংশ দেখে আবার পড়ো। অধ্যায়ের লেখা বাংলায়, ভারত সরকারের সূত্র এবং আইন ও বিধির ভিত্তিতে।',
    ),
    backToCard: L('Industrial Safety card', 'শিল্প নিরাপত্তা কার্ড'),
    bengalConnection: L('West Bengal connection', 'পশ্চিমবঙ্গের যোগ'),
  },
  wb_industry: {
    open: L('Read the Industrial Scenario of West Bengal as a book', 'পশ্চিমবঙ্গের শিল্পচিত্র বইয়ের মতো পড়ো'),
    homeTitle: L('Industrial Scenario of West Bengal: study like a book', 'পশ্চিমবঙ্গের শিল্পচিত্র: বইয়ের মতো পড়ো'),
    homeIntro: L(
      'Read each chapter in order, practise its questions, see your weak sections and revise them. Chapter text is in Bengali, based on West Bengal Government sources; figures carry the date they were checked.',
      'প্রতিটি অধ্যায় ক্রম অনুযায়ী পড়ো, তার প্রশ্ন অনুশীলন করো, দুর্বল অংশ দেখে আবার পড়ো। অধ্যায়ের লেখা বাংলায়, পশ্চিমবঙ্গ সরকারের সূত্রের ভিত্তিতে; সংখ্যাগুলির সঙ্গে যাচাইয়ের তারিখ দেওয়া থাকে।',
    ),
    backToCard: L('WB Industry card', 'পশ্চিমবঙ্গ শিল্প কার্ড'),
    bengalConnection: L('West Bengal connection', 'পশ্চিমবঙ্গের যোগ'),
  },
});

/** BOOK with the labels of one book (`history` keeps the original wording). */
export const bookLabels = (book) => ({ ...BOOK, ...(BOOK_NAMED[book] || {}) });

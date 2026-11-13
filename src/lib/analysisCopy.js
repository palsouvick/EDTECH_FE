/** Copy for "My learning analysis" (Mathematics and English). English + Bengali (+ Hindi where added: the
 *  Localized type already allows `hi` and the CSS already hides/shows a `hi` slot, though the language
 *  switcher offers only English and Bengali today, so `hi` text is stored and ready, not shown yet). */
const t = (en, bn, hi) => (hi ? { en, bn, hi } : { en, bn });
const bnNum = (n) => String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[d]);

export const AN = Object.freeze({
  title: t('My learning analysis', 'আমার শেখার বিশ্লেষণ'),
  sub: t(
    'You do not need to study everything equally. Here is what you know, what keeps catching you out, what you skip, and exactly what to study next.',
    'সবকিছু সমানভাবে পড়ার দরকার নেই। এখানে দেখো কী জানো, কোথায় বারবার ভুল হয়, কী ছেড়ে যাও, আর ঠিক এরপর কী পড়বে।',
  ),
  subjects: { quant: t('Mathematics', 'গণিত'), english: t('English', 'ইংরেজি') },
  subjectIcon: { quant: '🧮', english: '📖' },
  open: (s) => t(`Open ${s.en} analysis`, `${s.bn} বিশ্লেষণ খোলো`),
  openShort: t('My learning analysis', 'আমার শেখার বিশ্লেষণ'),
  loginNeeded: t('Sign in to see your learning analysis.', 'তোমার শেখার বিশ্লেষণ দেখতে সাইন ইন করো।'),
  empty: t(
    'No answers yet. Read a chapter and answer a few questions: the analysis starts with your first 5 answers in a chapter.',
    'এখনও কোনো উত্তর নেই। একটি অধ্যায় পড়ে কয়েকটি প্রশ্নের উত্তর দাও: কোনো অধ্যায়ে প্রথম ৫টি উত্তর থেকেই বিশ্লেষণ শুরু হয়।',
  ),

  // Health / summary
  health: t('Learning health', 'শেখার স্বাস্থ্য'),
  mastery: t('Mastery', 'দক্ষতা'),
  syllabus: t('Syllabus', 'সিলেবাস', 'पाठ्यक्रम'),
  accuracy: t('Accuracy', 'নির্ভুলতা'),
  weakTopics: t('Weak chapters', 'দুর্বল অধ্যায়'),
  incomplete: t('Incomplete chapters', 'অসম্পূর্ণ অধ্যায়'),
  openMistakes: t('Open mistakes', 'বাকি ভুল'),
  openSkips: t('Skipped, not yet solved', 'ছেড়ে দেওয়া, এখনও সমাধান হয়নি'),
  revisionDue: t('Revision due', 'রিভিশন বাকি'),
  studyTime: t('Study time', 'পড়ার সময়'),
  answered: (n) => t(`${n} answers`, `${bnNum(n)}টি উত্তর`),
  chaptersStarted: (a, b) => t(`${a} of ${b} chapters started`, `${bnNum(b)}টির মধ্যে ${bnNum(a)}টি অধ্যায় শুরু`),
  noData: t('—', '—'),
  currentFocus: t('🎯 Current focus', '🎯 এখনকার লক্ষ্য'),
  currentFocusSub: t('The chapters that need your time most, across both subjects.', 'দুই বিষয় মিলিয়ে যে অধ্যায়গুলোতে সবচেয়ে বেশি সময় দরকার।'),

  // Tabs
  tabs: {
    now: t('🎯 Study now', '🎯 এখন পড়ো'),
    chapters: t('📚 Chapters', '📚 অধ্যায়'),
    weak: t('❌ Weak questions', '❌ দুর্বল প্রশ্ন'),
    skipped: t('⏭ Skipped', '⏭ ছেড়ে দেওয়া'),
    progress: t('📈 Am I improving?', '📈 উন্নতি হচ্ছে?'),
    time: t('⏱ Time', '⏱ সময়'),
  },

  // Study now
  studyNow: t('What should I study now?', 'এখন কী পড়ব?'),
  studyNowSub: t('Ranked from your own answers, skips and mistakes, not from the syllabus order.', 'সিলেবাসের ক্রমে নয়, তোমার নিজের উত্তর, ছেড়ে দেওয়া প্রশ্ন আর ভুল থেকে সাজানো।'),
  nextTask: t('Your next task', 'তোমার পরের কাজ'),
  band: {
    high: t('High priority', 'বেশি গুরুত্ব'),
    medium: t('Medium priority', 'মাঝারি গুরুত্ব'),
    low: t('Keep practising', 'অনুশীলন চালাও'),
    strong: t('Strong', 'দক্ষ'),
    not_started: t('Not started', 'শুরু হয়নি'),
  },
  bandIcon: { high: '🔴', medium: '🟠', low: '🟡', strong: '🟢', not_started: '⚪' },
  focusScore: t('Focus priority', 'মনোযোগের অগ্রাধিকার'),
  focusScoreHelp: t(
    'Focus priority (0-100) adds up: low accuracy, mistakes, skips, unfinished reading and practice, falling accuracy, exam importance, unsolved PYQs, days since you last practised, unrevised mistakes and hard questions.',
    'মনোযোগের অগ্রাধিকার (০-১০০) যোগ হয়: কম নির্ভুলতা, ভুল, ছেড়ে দেওয়া প্রশ্ন, অসম্পূর্ণ পড়া ও অনুশীলন, কমতে থাকা নির্ভুলতা, পরীক্ষায় গুরুত্ব, সমাধান না-করা PYQ, শেষ অনুশীলনের পর কত দিন, রিভিশন না-করা ভুল আর কঠিন প্রশ্ন।',
  ),
  whyTitle: (name) => t(`Why is ${name.en} weak?`, `${name.bn ?? name.en} কেন দুর্বল?`),
  whyStrong: (name) => t(`${name.en}: keep it fresh`, `${name.bn ?? name.en}: ঝালিয়ে রাখো`),
  plan: t('Recommended', 'যা করবে'),
  planTotal: (q, m) => t(`${q} questions · about ${m} min`, `${bnNum(q)}টি প্রশ্ন · প্রায় ${bnNum(m)} মিনিট`),
  weakestSkill: (name, p) => t(`Weakest skill: ${name.en} (${p}%)`, `সবচেয়ে দুর্বল দক্ষতা: ${name.bn ?? name.en} (${bnNum(p)}%)`),
  reviseOn: (d) => t(`Revise by ${d}`, `${d}-এর মধ্যে রিভিশন`),
  reviseNow: t('Revision due now', 'এখনই রিভিশন করো'),
  nothingToFocus: t('Nothing urgent. Start a new chapter or take a Smart Quiz to keep everything fresh.', 'জরুরি কিছু নেই। নতুন অধ্যায় শুরু করো বা সব ঝালিয়ে রাখতে Smart Quiz দাও।'),

  // Steps
  step: {
    read: (s) => t(`Read the concept again — ${s.minutes} min`, `ধারণাটা আবার পড়ো — ${bnNum(s.minutes)} মিনিট`),
    mistakes: (s) => t(`Re-solve ${s.count} of your mistakes`, `তোমার ${bnNum(s.count)}টি ভুল আবার সমাধান করো`),
    quiz: (s) => ({
      beginner: t(`Solve ${s.count} basic questions`, `${bnNum(s.count)}টি সহজ প্রশ্ন করো`),
      intermediate: t(`Solve ${s.count} moderate questions`, `${bnNum(s.count)}টি মাঝারি প্রশ্ন করো`),
      advanced: t(`Solve ${s.count} exam-level questions`, `${bnNum(s.count)}টি পরীক্ষা-মানের প্রশ্ন করো`),
    })[s.level],
    pyq: (s) => t(`Solve ${s.count} previous-year questions`, `${bnNum(s.count)}টি আগের বছরের প্রশ্ন করো`),
    smart_quiz: (s) => t(`Take a ${s.count}-question Smart Quiz`, `${bnNum(s.count)} প্রশ্নের Smart Quiz দাও`),
  },
  go: t('Go', 'যাও'),

  // Why reasons
  why: {
    low_accuracy: (r) => t(`${r.wrong}/${r.answered} questions wrong (${r.accuracy}% right recently)`, `${bnNum(r.answered)}টির মধ্যে ${bnNum(r.wrong)}টি ভুল (সম্প্রতি ${bnNum(r.accuracy)}% ঠিক)`),
    few_answers: (r) => t(`Only ${r.answered} answers so far: not enough to know`, `এখন পর্যন্ত মাত্র ${bnNum(r.answered)}টি উত্তর: বোঝার জন্য যথেষ্ট নয়`),
    mistakes: (r) => t(`${r.open} mistakes not yet fixed${r.repeated ? `, ${r.repeated} made more than once` : ''}`, `${bnNum(r.open)}টি ভুল এখনও শোধরানো হয়নি${r.repeated ? `, ${bnNum(r.repeated)}টি একাধিকবার` : ''}`),
    skips: (r) => t(`${r.skipped} questions skipped`, `${bnNum(r.skipped)}টি প্রশ্ন ছেড়ে দেওয়া`),
    incomplete: (r) => t(`Not finished: reading ${r.reading ?? '—'}%, practice ${r.practice}% (${r.unique} of ${r.goal} questions)`, `শেষ হয়নি: পড়া ${r.reading ?? '—'}%, অনুশীলন ${bnNum(r.practice)}% (${bnNum(r.goal)}টির মধ্যে ${bnNum(r.unique)}টি)`),
    decline: (r) => t(`Accuracy dropped from ${r.from}% to ${r.to}% in the last 2 weeks`, `গত ২ সপ্তাহে নির্ভুলতা ${bnNum(r.from)}% থেকে ${bnNum(r.to)}%-এ নেমেছে`),
    importance: (r) => t(r.level === 'MUST' ? 'Must-know chapter in WBPSC papers' : 'Important chapter in WBPSC papers', r.level === 'MUST' ? 'WBPSC প্রশ্নপত্রে অবশ্যই-জানার অধ্যায়' : 'WBPSC প্রশ্নপত্রে গুরুত্বপূর্ণ অধ্যায়'),
    pyq: (r) => t(`PYQ completion: ${r.pct}% (${r.solved}/${r.total})`, `PYQ সম্পূর্ণ: ${bnNum(r.pct)}% (${bnNum(r.solved)}/${bnNum(r.total)})`),
    stale: (r) => t(`Last practised ${r.days} days ago`, `শেষ অনুশীলন ${bnNum(r.days)} দিন আগে`),
    revision: (r) => t(`Only ${r.pct}% of your mistakes revised${r.days != null ? ` · last revision ${r.days} days ago` : ''}`, `ভুলের মাত্র ${bnNum(r.pct)}% রিভিশন হয়েছে${r.days != null ? ` · শেষ রিভিশন ${bnNum(r.days)} দিন আগে` : ''}`),
    hard: (r) => t(`Hard questions: ${r.hard}% right, against ${r.all}% overall`, `কঠিন প্রশ্নে ${bnNum(r.hard)}% ঠিক, সব মিলিয়ে ${bnNum(r.all)}%`),
  },

  // Chapters
  chaptersTitle: t('Every chapter: reading is not mastery', 'প্রতিটি অধ্যায়: পড়া মানেই দক্ষতা নয়'),
  chaptersSub: t('Six separate measures. A chapter is complete only when it is read, practised, its PYQs solved and mastered (70%+).', 'ছয়টি আলাদা মাপ। পড়া, অনুশীলন, PYQ সমাধান আর দক্ষতা (৭০%+) হলে তবেই অধ্যায় সম্পূর্ণ।'),
  measures: {
    reading: t('Reading', 'পড়া'),
    practice: t('Practice', 'অনুশীলন'),
    pyq: t('PYQ', 'PYQ'),
    revision: t('Revision', 'রিভিশন'),
    accuracy: t('Accuracy', 'নির্ভুলতা'),
    mastery: t('Mastery', 'দক্ষতা'),
  },
  measureHelp: {
    reading: t('Lesson sections read', 'পাঠের যে অংশগুলো পড়া হয়েছে'),
    practice: t('Different questions answered, out of 60 (or the whole bank if smaller)', 'আলাদা প্রশ্নের উত্তর, ৬০টির মধ্যে (প্রশ্নভান্ডার ছোট হলে পুরোটা)'),
    pyq: t('Previous-year questions solved', 'আগের বছরের প্রশ্ন সমাধান'),
    revision: t('Your mistakes revised at least once', 'তোমার ভুলগুলো অন্তত একবার রিভিশন'),
    accuracy: t('Right among your last 30 answers', 'শেষ ৩০টি উত্তরের মধ্যে ঠিক'),
    mastery: t('How well you actually perform: accuracy, hard questions, practice and PYQs, over enough answers, fading if you stop', 'আসলে কতটা পারো: নির্ভুলতা, কঠিন প্রশ্ন, অনুশীলন ও PYQ, যথেষ্ট উত্তরের ভিত্তিতে; অনুশীলন থামালে কমে'),
  },
  notApplicable: t('n/a', 'প্রযোজ্য নয়'),
  readNotMastered: t('Read, but not mastered yet', 'পড়া হয়েছে, কিন্তু এখনও দক্ষতা আসেনি'),
  complete: t('Complete', 'সম্পূর্ণ'),
  incompleteParts: t('Still to do', 'যা বাকি'),
  remainingQuestions: (n) => t(`${n} questions left in the bank`, `ভান্ডারে আরও ${bnNum(n)}টি প্রশ্ন`),
  sortBy: t('Sort by', 'সাজাও'),
  sorts: { focus: t('Focus priority', 'অগ্রাধিকার'), mastery: t('Mastery', 'দক্ষতা'), order: t('Syllabus order', 'সিলেবাসের ক্রম') },
  areas: t('Where the weakness is', 'দুর্বলতা কোথায়'),
  areaNames: {
    arithmetic: t('Arithmetic', 'পাটিগণিত'),
    time_rate: t('Time, work & speed', 'সময়, কাজ ও গতি'),
    numbers: t('Numbers & simplification', 'সংখ্যা ও সরলীকরণ'),
    algebra_geometry: t('Algebra & mensuration', 'বীজগণিত ও পরিমিতি'),
    grammar: t('Grammar', 'ব্যাকরণ'),
    vocabulary: t('Vocabulary', 'শব্দভান্ডার'),
    reading: t('Reading', 'পাঠ বোঝা'),
    application: t('Application (error spotting, improvement, blanks)', 'প্রয়োগ (ভুল খোঁজা, বাক্য সংশোধন, শূন্যস্থান)'),
  },
  areaWeakest: (name, p) => t(`weakest: ${name.en} ${p}%`, `সবচেয়ে দুর্বল: ${name.bn ?? name.en} ${bnNum(p)}%`),
  conceptLevels: t('Concept mastery', 'ধারণার দক্ষতা'),
  topicsLevel: t('Topics', 'বিষয়'),
  skillsLevel: t('Skills (question types)', 'দক্ষতা (প্রশ্নের ধরন)'),
  hidden: t('hidden weakness', 'লুকানো দুর্বলতা'),
  difficulty: { EASY: t('Easy', 'সহজ'), MEDIUM: t('Moderate', 'মাঝারি'), HARD: t('Hard', 'কঠিন') },
  byDifficulty: t('By difficulty', 'কাঠিন্য অনুযায়ী'),

  // Weak questions
  weakTitle: t('My weak questions', 'আমার দুর্বল প্রশ্ন'),
  weakSub: t('Grouped by chapter, then by topic and skill, so you see exactly where the problem is.', 'অধ্যায়, তারপর বিষয় ও দক্ষতা অনুযায়ী সাজানো, যাতে ঠিক কোথায় সমস্যা বোঝা যায়।'),
  chapterLine: (c) => t(`Attempted ${c.answers} · Correct ${c.correct} · Wrong ${c.wrong}`, `চেষ্টা ${bnNum(c.answers)} · ঠিক ${bnNum(c.correct)} · ভুল ${bnNum(c.wrong)}`),
  mostRepeated: t('Most repeated mistakes', 'সবচেয়ে বেশি বার করা ভুল'),
  wrongTimes: (n) => t(`wrong ${n}×`, `${bnNum(n)} বার ভুল`),
  repeated: t('repeated', 'বারবার'),
  noWeak: t('No wrong answers to show yet.', 'দেখানোর মতো কোনো ভুল উত্তর এখনও নেই।'),
  openNotebook: t('Open the mistake notebook', 'ভুলের খাতা খোলো'),

  // Skips
  skippedTitle: t('My skipped questions', 'আমার ছেড়ে দেওয়া প্রশ্ন'),
  skippedSub: t(
    'A skip does not mean you do not know it. Each one shows a likely reason from how it happened; tap to tell us the real one.',
    'ছেড়ে দেওয়া মানেই না-জানা নয়। প্রতিটির পাশে কীভাবে হয়েছিল তা থেকে সম্ভাব্য কারণ; আসল কারণটা বেছে দাও।',
  ),
  skipPattern: (p) =>
    p.kind === 'last_tests'
      ? t(`You skipped ${p.count} ${p.title.en} questions in the last ${p.tests} tests.`, `শেষ ${bnNum(p.tests)}টি টেস্টে ${p.title.bn ?? p.title.en}-এর ${bnNum(p.count)}টি প্রশ্ন ছেড়ে গেছ।`)
      : t(`You skipped ${p.count} ${p.title.en} questions in the last 30 days.`, `গত ৩০ দিনে ${p.title.bn ?? p.title.en}-এর ${bnNum(p.count)}টি প্রশ্ন ছেড়ে গেছ।`),
  skipAction: (title) => t(`Recommended → revise ${title.en} + practise 10 questions`, `পরামর্শ → ${title.bn ?? title.en} রিভিশন + ১০টি প্রশ্ন অনুশীলন`),
  skipChapterLine: (c) => t(`${c.questions} questions, ${c.events} skips${c.avgTimeSec != null ? ` · ${c.avgTimeSec}s before skipping` : ''}`, `${bnNum(c.questions)}টি প্রশ্ন, ${bnNum(c.events)} বার${c.avgTimeSec != null ? ` · ছাড়ার আগে ${bnNum(c.avgTimeSec)} সেকেন্ড` : ''}`),
  skipTimes: (n) => t(`skipped ${n}×`, `${bnNum(n)} বার ছাড়া`),
  skipTime: (s) => t(`${s}s on it`, `${bnNum(s)} সেকেন্ড`),
  likely: t('Likely', 'সম্ভবত'),
  yourReason: t('Your reason', 'তোমার কারণ'),
  setReason: t('Why did you skip it?', 'কেন ছেড়েছিলে?'),
  reasons: {
    too_difficult: t('Too difficult', 'খুব কঠিন'),
    unsure: t('Unsure', 'নিশ্চিত ছিলাম না'),
    forgot_concept: t('Forgot formula / concept', 'সূত্র / ধারণা ভুলে গেছি'),
    time_pressure: t('Time pressure', 'সময়ের চাপ'),
    did_not_understand: t("Didn't understand the question", 'প্রশ্নটা বুঝিনি'),
    ran_out_of_time: t('Ran out of time', 'সময় শেষ'),
  },
  clearReason: t('Use the likely reason', 'সম্ভাব্য কারণই থাক'),
  noSkips: t('No open skips. Every skipped question has since been answered right.', 'কোনো ছেড়ে দেওয়া প্রশ্ন বাকি নেই।'),

  // Progress
  improvingTitle: t('Am I actually improving?', 'আমি কি সত্যিই উন্নতি করছি?'),
  thisMonth: t('This month', 'এই মাস'),
  lastMonth: t('Last month', 'গত মাস'),
  questionsAttempted: t('Questions attempted', 'প্রশ্নের চেষ্টা'),
  improvement: (d) => (d >= 0 ? t(`Improvement: +${d} percentage points`, `উন্নতি: +${bnNum(d)} শতাংশ পয়েন্ট`) : t(`Change: ${d} percentage points`, `পরিবর্তন: ${d} শতাংশ পয়েন্ট`)),
  strongestImprovement: t('Strongest improvement', 'সবচেয়ে বেশি উন্নতি'),
  needsAttention: t('Needs attention', 'মনোযোগ দরকার', 'ध्यान देने योग्य'),
  weekly: t('Accuracy, week by week', 'সপ্তাহ অনুযায়ী নির্ভুলতা'),
  weekOf: (w) => t(`Week of ${w}`, `${w}-এর সপ্তাহ`),
  overWindow: (a, b, d) => t(`From ${a}% to ${b}%: ${d >= 0 ? '+' : ''}${d} points`, `${bnNum(a)}% থেকে ${bnNum(b)}%: ${d >= 0 ? '+' : ''}${d} পয়েন্ট`),
  improvingList: t('Getting better (last 2 weeks)', 'ভালো হচ্ছে (গত ২ সপ্তাহ)'),
  decliningList: t('Getting worse: revise these', 'খারাপ হচ্ছে: এগুলো রিভিশন করো'),
  fromTo: (a, b) => t(`${a}% → ${b}%`, `${bnNum(a)}% → ${bnNum(b)}%`),
  notEnough: t('Not enough answers yet to show a change (5 a week).', 'পরিবর্তন দেখানোর মতো যথেষ্ট উত্তর এখনও নেই (সপ্তাহে ৫টি)।'),

  // Time
  timeTitle: t('Time spent vs result', 'কত সময় দিয়েছ বনাম ফল'),
  timeSub: t('Reading and re-reading are timed while the lesson is open on screen; solving time comes from your answers.', 'পাঠ স্ক্রিনে খোলা থাকার সময় পড়া ও আবার পড়ার সময় মাপা হয়; সমাধানের সময় তোমার উত্তর থেকে।'),
  timeParts: { readSec: t('Reading', 'পড়া'), practiceSec: t('Solving', 'সমাধান'), reviseSec: t('Re-reading', 'আবার পড়া'), mistakesSec: t('Fixing mistakes', 'ভুল শোধরানো') },
  perQuestion: (s, target) => t(`${s}s per question (target ${target}s)`, `প্রতি প্রশ্নে ${bnNum(s)} সেকেন্ড (লক্ষ্য ${bnNum(target)})`),
  slow: t('slow', 'ধীর'),
  timeToMastery: (time, m) => t(`${time} studied → ${m == null ? 'mastery not yet measured' : `${m}% mastery`}`, `${time} পড়া → ${m == null ? 'দক্ষতা এখনও মাপা হয়নি' : `${bnNum(m)}% দক্ষতা`}`),

  // Smart quiz
  smartTitle: t('🧠 Smart Quiz', '🧠 Smart Quiz'),
  smartSub: t(
    'Not random: built from your wrong answers, skipped questions, unfinished and weak chapters, with a few questions from strong chapters so you keep them. New questions on the same concept are preferred over repeats.',
    'এলোমেলো নয়: তোমার ভুল উত্তর, ছেড়ে দেওয়া প্রশ্ন, অসম্পূর্ণ ও দুর্বল অধ্যায় থেকে তৈরি; দক্ষ অধ্যায় থেকেও কয়েকটি, যাতে মনে থাকে। একই প্রশ্নের বদলে একই ধারণার নতুন প্রশ্নকে আগে রাখা হয়।',
  ),
  nextSmartQuiz: t('Your next Smart Quiz', 'তোমার পরের Smart Quiz'),
  basedOnTest: t('From your latest test', 'তোমার শেষ টেস্ট থেকে'),
  gotWrong: (n, title) => t(`You got ${n} ${title.en} question${n === 1 ? '' : 's'} wrong.`, `${title.bn ?? title.en}-এর ${bnNum(n)}টি প্রশ্ন ভুল হয়েছে।`),
  skippedN: (n, title) => t(`You skipped ${n} ${title.en} question${n === 1 ? '' : 's'}.`, `${title.bn ?? title.en}-এর ${bnNum(n)}টি প্রশ্ন ছেড়েছ।`),
  weakestSkillIs: (name) => t(`Your weakest skill is ${name.en}.`, `তোমার সবচেয়ে দুর্বল দক্ষতা ${name.bn ?? name.en}।`),
  therefore: (n) => t(`Next Smart Quiz: ${n} questions`, `পরের Smart Quiz: ${bnNum(n)}টি প্রশ্ন`),
  retention: t('to keep it fresh', 'ঝালিয়ে রাখতে'),
  start: t('Start Smart Quiz', 'Smart Quiz শুরু করো'),
  startChapter: t('Smart Quiz on this chapter', 'এই অধ্যায়ে Smart Quiz'),
  starting: t('Building your quiz…', 'তোমার কুইজ তৈরি হচ্ছে…'),
  size: t('Questions', 'প্রশ্ন'),
  mode: { practice: t('Practice (answer shown at once)', 'অনুশীলন (সঙ্গে সঙ্গে উত্তর)'), exam: t('Exam (timed, answers at the end)', 'পরীক্ষা (সময় ধরে, শেষে উত্তর)') },
  failed: t('Could not build the quiz. Please try again.', 'কুইজ তৈরি করা গেল না। আবার চেষ্টা করো।'),

  // Learning loop
  loop: t('Read → practise → find mistakes and skips → Smart Quiz → revise → PYQs → mock test → repeat. Every answer updates this page.', 'পড়ো → অনুশীলন → ভুল ও ছেড়ে দেওয়া খোঁজো → Smart Quiz → রিভিশন → PYQ → মক টেস্ট → আবার। প্রতিটি উত্তরে এই পাতা বদলায়।'),
});

/** "4h 20m" / "35m" / "0m". */
export function formatDuration(sec) {
  const m = Math.round((sec || 0) / 60);
  const h = Math.floor(m / 60);
  return h ? `${h}h ${m % 60}m` : `${m}m`;
}

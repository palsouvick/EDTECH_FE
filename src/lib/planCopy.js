/** Copy for the 60-day WBPSC Clerkship plan. English + Bengali. */
const t = (en, bn) => ({ en, bn });
const bnDigits = (n) => String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[d]);

const PRIORITY_WORDS = {
  MUST: t('Must know', 'অবশ্যই জানতে হবে'),
  IMPORTANT: t('Important', 'গুরুত্বপূর্ণ'),
  ADDITIONAL: t('Additional', 'অতিরিক্ত'),
};

export const PLAN = Object.freeze({
  nav: t('60-day plan', '৬০ দিনের পরিকল্পনা'),
  title: t('WBPSC Clerkship: 60-day plan', 'WBPSC ক্লার্কশিপ: ৬০ দিনের পরিকল্পনা'),
  sub: t(
    'For a beginner starting from zero. Part-I has 30 English, 40 General Studies and 30 Arithmetic questions, so every day has a little of each, plus revision. About 1½–2 hours a day.',
    'একেবারে শূন্য থেকে শুরু করা শিক্ষার্থীর জন্য। পার্ট-I-এ ইংরেজি ৩০, সাধারণ পাঠ ৪০ ও পাটিগণিত ৩০টি প্রশ্ন, তাই প্রতিদিন প্রতিটির একটু করে, সঙ্গে রিভিশন। দিনে প্রায় দেড়–দুই ঘণ্টা।',
  ),
  startLabel: t('Day 1 is', 'প্রথম দিন'),
  start: t('Start the plan', 'পরিকল্পনা শুরু করো'),
  guestNote: t('You are not signed in: your ticks stay on this device. Sign in to keep them on every device.', 'তুমি সাইন ইন করোনি: টিকগুলি শুধু এই ডিভাইসে থাকবে। সব ডিভাইসে রাখতে সাইন ইন করো।'),
  dayOf: (d, total) => t(`Day ${d} of ${total}`, `${bnDigits(total)} দিনের ${bnDigits(d)} নম্বর দিন`),
  notYet: (n) => t(`Your plan starts in ${n} day${n === 1 ? '' : 's'}. Here is Day 1.`, `${bnDigits(n)} দিন পরে পরিকল্পনা শুরু। এই হল প্রথম দিন।`),
  behind: (calendarDay, d) => t(
    `By the calendar it is Day ${calendarDay}. Finish Day ${d} first — the next day opens only when this one is complete.`,
    `ক্যালেন্ডার অনুযায়ী আজ ${bnDigits(calendarDay)} নম্বর দিন। আগে ${bnDigits(d)} নম্বর দিনের কাজ শেষ করো — এই দিন পুরো হলে তবেই পরের দিন খুলবে।`,
  ),
  locked: (d) => t(`Locked — finish Day ${d} to open`, `বন্ধ — ${bnDigits(d)} নম্বর দিন শেষ করলে খুলবে`),
  finished: t('The 60 days are over. Keep revising with mocks and your mistakes.', '৬০ দিন শেষ। মক টেস্ট ও ভুলের খাতা দিয়ে রিভিশন চালিয়ে যাও।'),
  today: t("Today's target", 'আজকের লক্ষ্য'),
  minutes: (m) => t(`about ${m} min`, `প্রায় ${bnDigits(m)} মিনিট`),
  open: t('Open', 'খোলো'),
  markDone: t('Done', 'হয়ে গেছে'),
  optional: t('If you have time', 'সময় থাকলে'),
  weeklyTest: t('Weekly test day: no new chapter today', 'সাপ্তাহিক পরীক্ষার দিন: আজ নতুন অধ্যায় নেই'),
  next: t('What should I study next?', 'এরপর কী পড়ব?'),
  nothingNext: t('Everything for today is done. Rest, or revise anything you like.', 'আজকের সব কাজ শেষ। বিশ্রাম নাও, বা যা ইচ্ছে রিভিশন করো।'),
  progress: (done, total) => t(`${done} of ${total} tasks done`, `${bnDigits(total)}টির মধ্যে ${bnDigits(done)}টি কাজ শেষ`),
  allDays: t('All 60 days', 'সব ৬০ দিন'),
  restart: t('Change start date', 'শুরুর তারিখ বদলাও'),
  restartFresh: t('Start again from Day 1 (clears ticks)', 'আবার প্রথম দিন থেকে শুরু (টিক মুছে যাবে)'),
  session: (n, of) => t(`session ${n} of ${of}`, `${bnDigits(of)}টির মধ্যে ${bnDigits(n)} নম্বর পর্ব`),
  learnTitle: (name) => ({ en: `Study: ${name.en}`, bn: `পড়ো: ${name.bn ?? name.en}` }),
  extra: t('Extra', 'অতিরিক্ত'),

  reasonBacklog: (d) => t(`Left over from Day ${d}. Finish it before today's work.`, `${bnDigits(d)} নম্বর দিনের বাকি কাজ। আজকের কাজের আগে শেষ করো।`),
  reasonDue: (n) => t(`${n} revision questions are due. Revising first keeps what you learnt.`, `${bnDigits(n)}টি রিভিশন প্রশ্ন বাকি। আগে রিভিশন করলে শেখা জিনিস মনে থাকে।`),
  reasonWeak: (pct) => t(
    `Your accuracy here is ${pct ?? '–'}%. A short practice now brings it back up.`,
    `এখানে তোমার নির্ভুলতা ${pct == null ? '–' : bnDigits(pct)}%। এখন একটু অনুশীলন করলে তা আবার বাড়বে।`,
  ),
  reasonLearn: (priority, session) => {
    const p = priority ? PRIORITY_WORDS[priority] : null;
    const s = session ? ` (${session.n}/${session.of})` : '';
    return p
      ? t(`${p.en} in WBPSC past papers; next in the plan${s}.`, `WBPSC-র আগের প্রশ্নে ${p.bn}; পরিকল্পনায় এর পরেরটি${s}।`)
      : t(`Exam-standard GK basics; next in the plan${s}.`, `পরীক্ষার মানক GK ভিত্তি; পরিকল্পনায় এর পরেরটি${s}।`);
  },
  reasonPlanOrder: t('Next in your plan for today.', 'আজকের পরিকল্পনায় এর পরেরটি।'),
  reasonKind: {
    mock: t('Timed practice in the real exam pattern shows speed and accuracy.', 'আসল পরীক্ষার ধাঁচে সময় ধরে অনুশীলন গতি ও নির্ভুলতা দেখায়।'),
    pyq_paper: t('Real WBPSC questions show what the Commission asks again and again.', 'আসল WBPSC প্রশ্ন দেখায় কমিশন কী বারবার জিজ্ঞাসা করে।'),
    mistakes: t('Questions you got wrong are the fastest marks to win back.', 'ভুল করা প্রশ্নগুলিই সবচেয়ে সহজে নম্বর ফিরিয়ে আনে।'),
    weak: t('Your weakest chapter gains the most from practice.', 'সবচেয়ে দুর্বল অধ্যায়েই অনুশীলনে সবচেয়ে বেশি লাভ।'),
    revise: t('Spaced revision fixes today what you learnt earlier.', 'নির্দিষ্ট ব্যবধানে রিভিশন আগের শেখা পাকা করে।'),
    gk_revise: t('Flashcards keep GK facts fresh.', 'ফ্ল্যাশকার্ড GK তথ্য টাটকা রাখে।'),
    vocabulary: t('A few words a day adds up for the 30 English marks.', 'রোজ কয়েকটি শব্দ ইংরেজির ৩০ নম্বরে কাজে লাগে।'),
    days_year: t('The whole year on one page, for a last look.', 'সারা বছর এক পাতায়, শেষবার দেখার জন্য।'),
    daily_test: t("Today's test shows what stuck and sends mistakes to your notebook.", 'আজকের পরীক্ষা দেখায় কী মনে আছে, আর ভুলগুলি খাতায় তোলে।'),
    weekly_test: t('The weekly test checks the whole week before moving on.', 'এগোনোর আগে সাপ্তাহিক পরীক্ষা পুরো সপ্তাহ যাচাই করে।'),
    full_mock: t('A full mock in the real pattern builds speed and accuracy.', 'আসল ধাঁচের পূর্ণ মক গতি ও নির্ভুলতা বাড়ায়।'),
    spaced: t('Revising at the right interval stops you forgetting.', 'ঠিক ব্যবধানে রিভিশন করলে ভুলে যাওয়া আটকায়।'),
    pyq_topics: t('The chapters WBPSC asks most, in its own questions.', 'WBPSC যে অধ্যায় থেকে সবচেয়ে বেশি প্রশ্ন করে, তার নিজের প্রশ্নে।'),
    revise_subjects: t('Camp days are for revision, not new chapters.', 'শিবিরের দিনগুলি রিভিশনের জন্য, নতুন অধ্যায়ের জন্য নয়।'),
    strategy: t('A plan for the exam hall is worth marks.', 'পরীক্ষার হলের পরিকল্পনাও নম্বর আনে।'),
  },
  phaseTitle: { FOUNDATION: t('Foundation', 'ভিত্তি'), CORE: t('Core preparation', 'মূল প্রস্তুতি'), PYQ: t('PYQ + exam practice', 'আগের প্রশ্ন + পরীক্ষার অনুশীলন'), CAMP: t('Final exam camp', 'চূড়ান্ত পরীক্ষা-শিবির') },
});

const SUBJECT_NAMES = { quant: t('Math', 'গণিত'), english: t('English', 'ইংরেজি'), gs: t('GK/GS', 'সাধারণ জ্ঞান'), pyq: t('PYQ', 'আগের প্রশ্ন'), mock: t('Mock tests', 'মক টেস্ট') };

export const PLAN_UI = Object.freeze({
  subjects: SUBJECT_NAMES,
  // Settings
  studyTime: t('Study time per day', 'দিনে পড়ার সময়'),
  hours: (h) => t(`${h} h`, `${bnDigits(h)} ঘণ্টা`),
  examDate: t('Exam date (if announced)', 'পরীক্ষার তারিখ (ঘোষিত হলে)'),
  examTentative: t('Clerkship Part-I is tentatively "December 2026 or thereabout" (Advt 12/2024); set the date when WBPSC announces it.', 'ক্লার্কশিপ পার্ট-I আনুমানিক "ডিসেম্বর ২০২৬ বা তার কাছাকাছি" (বিজ্ঞাপন ১২/২০২৪); WBPSC তারিখ ঘোষণা করলে এখানে দাও।'),
  save: t('Save', 'সেভ করো'),
  countdown: (n) => t(`⏳ ${n} days remaining`, `⏳ আর ${bnDigits(n)} দিন বাকি`),
  examToday: t('⏳ Exam day. All the best!', '⏳ আজ পরীক্ষা। শুভেচ্ছা রইল!'),
  planUpdated: t('The 60-day plan was improved. Your start date is kept; ticks from the old layout were cleared.', '৬০ দিনের পরিকল্পনা উন্নত করা হয়েছে। শুরুর তারিখ রাখা আছে; পুরোনো বিন্যাসের টিক মুছে দেওয়া হয়েছে।'),
  focusStart: t('🎯 Start Focus Mode', '🎯 ফোকাস মোড শুরু করো'),
  // Mission
  mission: t("🎯 Today's Mission", '🎯 আজকের মিশন'),
  missionLine: (m) => t(
    `Learn ${m.concepts} concept${m.concepts === 1 ? '' : 's'} · Solve ${m.questions} questions · Revise ${m.revisions} earlier topic${m.revisions === 1 ? '' : 's'} · ${m.minutes} minutes of focused study`,
    `${bnDigits(m.concepts)}টি ধারণা শেখো · ${bnDigits(m.questions)}টি প্রশ্ন সমাধান করো · আগের ${bnDigits(m.revisions)}টি বিষয় রিভিশন · ${bnDigits(m.minutes)} মিনিট মন দিয়ে পড়া`,
  ),
  // Learn task
  learnList: t('Learn', 'শেখো'),
  split: { concept: t('Concept', 'ধারণা'), examples: t('Solved examples', 'সমাধান করা উদাহরণ'), practice: t('Practice', 'অনুশীলন'), read: t('Read', 'পড়া') },
  min: (m) => t(`${m} min`, `${bnDigits(m)} মিনিট`),
  questions: (n) => t(`${n} questions`, `${bnDigits(n)}টি প্রশ্ন`),
  target: (p) => t(`Target accuracy: ${p}%+`, `লক্ষ্য নির্ভুলতা: ${bnDigits(p)}%+`),
  outcome: t('Expected outcome', 'প্রত্যাশিত ফল'),
  topicPages: t('🔗 Connected topic pages', '🔗 সম্পর্কিত বিষয়-পাতা'),
  howAsked: t('How WBPSC asks this (PYQs)', 'WBPSC এটা কীভাবে জিজ্ঞাসা করে (আগের প্রশ্ন)'),
  openLesson: t('Open the lesson', 'পাঠ খোলো'),
  // Spaced revision
  spacedKind: { quick: t('quick revision', 'দ্রুত রিভিশন'), test: t('test yourself', 'নিজেকে যাচাই'), revise: t('revise', 'রিভিশন') },
  learnedOn: (d) => t(`learned on Day ${d}`, `${bnDigits(d)} নম্বর দিনে শেখা`),
  canSkip: t('You know this well: skip if short of time', 'এটা তোমার ভালো জানা: সময় কম থাকলে বাদ দিতে পারো'),
  // Tests
  startTest: t('Start the test', 'পরীক্ষা শুরু করো'),
  testSizes: (s) => t(`${s.quant || 0} Math · ${s.english || 0} English · ${s.gs || 0} GS · ${s.pyq || 0} real PYQs`, `গণিত ${bnDigits(s.quant || 0)} · ইংরেজি ${bnDigits(s.english || 0)} · সাধারণ পাঠ ${bnDigits(s.gs || 0)} · আসল আগের প্রশ্ন ${bnDigits(s.pyq || 0)}`),
  mockRules: t('100 questions in 90 minutes, −0.25 for each wrong answer (Clerkship Part-I pattern). The test submits itself when time is up.', '৯০ মিনিটে ১০০টি প্রশ্ন, প্রতিটি ভুলে −০.২৫ (ক্লার্কশিপ পার্ট-I-এর ধাঁচ)। সময় শেষ হলে পরীক্ষা নিজেই জমা পড়বে।'),
  section: { english: t('English', 'ইংরেজি'), gs: t('General Studies', 'সাধারণ পাঠ'), quant: t('Arithmetic', 'পাটিগণিত'), pyq: t('Real PYQs', 'আসল আগের প্রশ্ন') },
  questionOf: (i, n) => t(`Question ${i} of ${n}`, `${bnDigits(n)}টির মধ্যে ${bnDigits(i)} নম্বর প্রশ্ন`),
  prev: t('Previous', 'আগেরটি'),
  next: t('Next', 'পরেরটি'),
  submit: t('Submit test', 'পরীক্ষা জমা দাও'),
  answeredCount: (a, n) => t(`${a} of ${n} answered`, `${bnDigits(n)}টির মধ্যে ${bnDigits(a)}টির উত্তর দেওয়া`),
  timeLeft: t('Time left', 'বাকি সময়'),
  checking: t('Checking…', 'যাচাই হচ্ছে…'),
  resultTitle: t('Your result', 'তোমার ফল'),
  score: (c, n) => t(`Score: ${c}/${n}`, `স্কোর: ${bnDigits(c)}/${bnDigits(n)}`),
  marks: (m) => t(`Marks after negative marking: ${m}`, `নেগেটিভ মার্কিংয়ের পরে নম্বর: ${bnDigits(m)}`),
  accuracy: (p) => t(`Accuracy: ${p}%`, `নির্ভুলতা: ${bnDigits(p)}%`),
  timeTaken: (m) => t(`Time: ${m} min`, `সময়: ${bnDigits(m)} মিনিট`),
  weakTopics: t('🔴 Topics to revise', '🔴 যে বিষয়গুলি রিভিশন দরকার'),
  strongTopics: t('✅ Strong topics', '✅ শক্তিশালী বিষয়'),
  wrongAnswers: t('Review your wrong answers', 'ভুল উত্তরগুলি দেখে নাও'),
  yourAnswer: t('Your answer', 'তোমার উত্তর'),
  correctAnswer: t('Correct answer', 'সঠিক উত্তর'),
  notAnswered: t('Not answered', 'উত্তর দেওয়া হয়নি'),
  savedToNotebook: t('Wrong answers are saved to your Mistake Notebook and come back for revision.', 'ভুল উত্তরগুলি তোমার ভুলের খাতায় জমা হয় এবং রিভিশনে ফিরে আসে।'),
  close: t('Close', 'বন্ধ করো'),
  retake: t('Take another test', 'আরেকটি পরীক্ষা দাও'),
  // Day summary
  dayComplete: t('✅ Day complete', '✅ দিনের কাজ শেষ'),
  dayRemaining: (n) => t(`${n} task${n === 1 ? '' : 's'} left today`, `আজ আর ${bnDigits(n)}টি কাজ বাকি`),
  weakArea: (s) => ({ en: `🎯 Weak area today: ${SUBJECT_NAMES[s]?.en ?? s}`, bn: `🎯 আজকের দুর্বল জায়গা: ${SUBJECT_NAMES[s]?.bn ?? s}` }),
  todaysTest: (c, n, p) => t(`Today's test: ${c}/${n} (${p}%)`, `আজকের পরীক্ষা: ${bnDigits(c)}/${bnDigits(n)} (${bnDigits(p)}%)`),
  // Adaptive
  adaptiveTitle: t('Based on your last test', 'তোমার শেষ পরীক্ষার ভিত্তিতে'),
  weakAdvice: (name, p) => ({ en: `🔴 Weak topic detected: ${name.en} (${p}%). Revise it for 20 minutes and solve 10 more questions.`, bn: `🔴 দুর্বল বিষয়: ${name.bn ?? name.en} (${bnDigits(p)}%)। ২০ মিনিট রিভিশন করো এবং আরও ১০টি প্রশ্ন সমাধান করো।` }),
  strongAdvice: (name, p) => ({ en: `✅ ${name.en} (${p}%): strong. Move on; its next revision can be skipped if you are short of time.`, bn: `✅ ${name.bn ?? name.en} (${bnDigits(p)}%): শক্তিশালী। এগিয়ে যাও; সময় কম থাকলে এর পরের রিভিশন বাদ দিতে পারো।` }),
  // Readiness
  readinessTitle: t('🎯 WBPSC Clerkship readiness', '🎯 WBPSC ক্লার্কশিপ প্রস্তুতি'),
  overall: t('Overall', 'সামগ্রিক'),
  biggestArea: (s) => ({ en: `Your biggest improvement area is ${SUBJECT_NAMES[s].en}.`, bn: `তোমার সবচেয়ে বেশি উন্নতির জায়গা ${SUBJECT_NAMES[s].bn}।` }),
  readinessRule: t(
    'How it is worked out: each subject is your recent accuracy averaged over all its plan chapters (chapters with fewer than 5 answers count as 0, so coverage matters); PYQ is your accuracy on real PYQs, in full once you have answered 150; Mock is your last three weekly tests or full mocks. Overall = 70% subjects (weighted 30/30/40 like the paper) + 15% PYQ + 15% mock.',
    'হিসাব: প্রতিটি বিষয় হল পরিকল্পনার সব অধ্যায়ে তোমার সাম্প্রতিক নির্ভুলতার গড় (৫টির কম উত্তরের অধ্যায় ০ ধরা হয়, তাই সব অধ্যায় পড়া জরুরি); আগের প্রশ্ন হল আসল প্রশ্নে তোমার নির্ভুলতা, ১৫০টির উত্তর দিলে পুরোটা; মক হল শেষ তিনটি সাপ্তাহিক পরীক্ষা বা পূর্ণ মক। সামগ্রিক = ৭০% বিষয় (প্রশ্নপত্রের মতো ৩০/৩০/৪০) + ১৫% আগের প্রশ্ন + ১৫% মক।',
  ),
  signInReadiness: t('Sign in to see your readiness score and keep your test results.', 'প্রস্তুতির স্কোর দেখতে ও পরীক্ষার ফল রাখতে সাইন ইন করো।'),
  // Camp and strategy
  reviseSubject: t('Revise', 'রিভিশন'),
  mustOnly: t('Only the 🔴 Must-know chapters today.', 'আজ শুধু 🔴 অবশ্যই-জানতে-হবে অধ্যায়গুলি।'),
  strategy: [
    t('Part-I has 100 questions in 90 minutes: about 50 seconds a question. Do a first pass answering everything you are sure of, then return.', 'পার্ট-I-এ ৯০ মিনিটে ১০০টি প্রশ্ন: প্রশ্নপিছু প্রায় ৫০ সেকেন্ড। প্রথমবারে নিশ্চিত প্রশ্নগুলির উত্তর দাও, তারপর বাকিগুলিতে ফেরো।'),
    t('Each wrong answer costs 0.25 marks. Guess only when you can rule out at least two options.', 'প্রতিটি ভুল উত্তরে ০.২৫ নম্বর কাটা যায়। অন্তত দুটি বিকল্প বাদ দিতে পারলে তবেই আন্দাজে উত্তর দাও।'),
    t('Suggested order: English (30) and GS (40) first, which are quick to answer, then Arithmetic (30) with the time left.', 'প্রস্তাবিত ক্রম: আগে ইংরেজি (৩০) ও সাধারণ পাঠ (৪০), যেগুলি তাড়াতাড়ি হয়, তারপর বাকি সময়ে পাটিগণিত (৩০)।'),
    t('Fill the OMR as you go, not at the end. Keep the admit card and ID ready the night before.', 'OMR শেষে নয়, সঙ্গে সঙ্গে ভরো। অ্যাডমিট কার্ড ও পরিচয়পত্র আগের রাতেই গুছিয়ে রাখো।'),
  ],
});

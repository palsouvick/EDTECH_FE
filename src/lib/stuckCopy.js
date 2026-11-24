/**
 * Copy for the Math "I'm Stuck" learning loop: My Stuck Problems, the skill-gap diagnosis,
 * Practice My Weakness, its result panel and the home card. The in-test button copy is in
 * lib/i18n.js (STUCK).
 */
const t = (en, bn) => ({ en, bn });
const pick = (v, l) => (v && typeof v === 'object' ? v[l] || v.en || '' : v ?? '');
/** A sentence built per language around a localized name ({ en, bn }). */
const withName = (name, en, bn) => ({ en: en(pick(name, 'en')), bn: bn(pick(name, 'bn')) });

export const SP = Object.freeze({
  title: t('My Stuck Problems', 'যেখানে আটকে গেছি'),
  subtitle: t(
    'Questions you marked "I\'m Stuck" in Math mocks, what they have in common, and practice to fix it.',
    'ম্যাথ মকে যে প্রশ্নে "আটকে গেছি" দিয়েছ, সেগুলোর মিল কোথায়, আর তা ঠিক করার অনুশীলন।',
  ),
  safe: t(
    'Stuck marks never change your mock score. They are your learning map: where you needed help.',
    'আটকে যাওয়ার চিহ্ন কখনও মকের স্কোর বদলায় না। এটা তোমার শেখার মানচিত্র: কোথায় সাহায্য লেগেছে।',
  ),
  menu: t('My Stuck Problems', 'যেখানে আটকে গেছি'),
  emptyTitle: t('Nothing marked as stuck yet', 'এখনও কোনো প্রশ্নে আটকাওনি'),
  emptyBody: t(
    'In a Math mock, press 🆘 I\'m Stuck when you don\'t know how to solve a question. It is saved here, safely, without touching your score.',
    'ম্যাথ মকে কোনো প্রশ্ন কীভাবে করবে বুঝতে না পারলে 🆘 আটকে গেছি চাপো। স্কোর না ছুঁয়ে সেটা এখানে জমা থাকবে।',
  ),
  startMock: t('Take a Math mock', 'ম্যাথ মক দাও'),

  totalStuck: t('Stuck problems', 'আটকে যাওয়া প্রশ্ন'),
  solvedAfter: t('Solved after getting stuck', 'আটকে গিয়েও সঠিক'),
  wrongAfter: t('Wrong after getting stuck', 'আটকে গিয়ে ভুল'),
  leftAfter: t('Left unanswered', 'উত্তর দেওয়া হয়নি'),

  byChapter: t('Stuck by chapter', 'অধ্যায় অনুযায়ী আটকে যাওয়া'),
  chapter: t('Chapter', 'অধ্যায়'),
  stuck: t('Stuck', 'আটকে'),
  wrong: t('Wrong', 'ভুল'),
  accuracy: t('Accuracy', 'নির্ভুলতা'),
  whereStruggling: t('Where am I actually struggling?', 'আসলে কোথায় অসুবিধা হচ্ছে?'),

  // ---- "What is missing?" (diagnosis) ----
  missingTitle: t('What is missing?', 'কী কম পড়ছে?'),
  missingHint: t(
    'Worked out from repeated evidence — your stuck reasons, mistakes, skips, time and accuracy by level. Never from one question.',
    'বারবার পাওয়া প্রমাণ থেকে — আটকে যাওয়ার কারণ, ভুল, ছেড়ে যাওয়া প্রশ্ন, সময় আর স্তর অনুযায়ী নির্ভুলতা। কখনও একটা প্রশ্ন থেকে নয়।',
  ),
  noGapYet: t(
    'Not enough evidence for a diagnosis yet. Keep using 🆘 I\'m Stuck and practise a few sets — a pattern appears after repeated evidence.',
    'নির্ণয়ের মতো যথেষ্ট প্রমাণ এখনও নেই। 🆘 আটকে গেছি ব্যবহার করতে থাকো আর কয়েকটা সেট অনুশীলন করো — বারবার প্রমাণ এলে ধরন বোঝা যাবে।',
  ),
  high: t('High confidence', 'উচ্চ নিশ্চয়তা'),
  possible: t('Possible', 'সম্ভাব্য'),
  highLabel: (g) => ({ en: `High-confidence weakness: ${g.en}`, bn: `উচ্চ নিশ্চয়তার দুর্বলতা: ${g.bn}` }),
  possibleLabel: (g) => ({ en: `Possible weakness: ${g.en}`, bn: `সম্ভাব্য দুর্বলতা: ${g.bn}` }),
  toConfirm: (n) => t(`Practise ${n} more question${n === 1 ? '' : 's'} to confirm.`, `নিশ্চিত হতে আরও ${n}টি প্রশ্ন অনুশীলন করো।`),
  evidenceSignals: (n, of) => t(`${n} / last ${of} relevant questions`, `শেষ ${of}টি প্রাসঙ্গিক প্রশ্নের ${n}টি`),
  evidenceStuck: (n) => t(`Marked stuck ${n} times for this`, `এই কারণে ${n} বার আটকে গেছ`),
  evidenceSlow: (f) => t(`Average time: ${f}× the planned time`, `গড় সময়: পরিকল্পিত সময়ের ${f} গুণ`),
  evidenceLevels: (name, basic, applied, level) =>
    withName(
      name,
      (n) => `${n}: basic questions ${basic}%${applied != null ? ` · ${level === 'hard' ? 'exam-level' : 'application'} questions ${applied}%` : ''}`,
      (n) => `${n}: সহজ প্রশ্ন ${basic}%${applied != null ? ` · ${level === 'hard' ? 'পরীক্ষার স্তরের' : 'প্রয়োগের'} প্রশ্ন ${applied}%` : ''}`,
    ),
  mostIn: t('Mostly in', 'বেশি'),
  practiseThis: t('Practise this', 'এটা অনুশীলন করো'),

  gaps: {
    knowledge: { name: t('Basic concept', 'মূল ধারণা'), means: t('"I don\'t understand the concept."', '"ধারণাটা বুঝি না।"'), emoji: '🧠' },
    skill: { name: t('Applying the concept', 'ধারণার প্রয়োগ'), means: t('"I understand the concept but cannot apply it."', '"ধারণা বুঝি, কিন্তু প্রয়োগ করতে পারি না।"'), emoji: '🛠️' },
    calculation: { name: t('Calculation accuracy', 'হিসেবের নির্ভুলতা'), means: t('"I know how to solve it but make arithmetic mistakes."', '"কীভাবে করতে হয় জানি, কিন্তু হিসেবে ভুল হয়।"'), emoji: '🔢' },
    method: { name: t('Choosing the method', 'পদ্ধতি বেছে নেওয়া'), means: t('"I don\'t know which approach to use."', '"কোন পদ্ধতি লাগবে বুঝি না।"'), emoji: '📐' },
    recall: { name: t('Formula recall', 'সূত্র মনে রাখা'), means: t('"I forgot the formula / rule."', '"সূত্র / নিয়ম ভুলে গেছি।"'), emoji: '📖' },
    speed: { name: t('Speed', 'গতি'), means: t('"I can solve it but take too long."', '"পারি, কিন্তু অনেক সময় লাগে।"'), emoji: '⏱️' },
    reading: { name: t('Reading the question', 'প্রশ্ন বোঝা'), means: t('"I misunderstand what the question is asking."', '"প্রশ্নটা কী চাইছে ভুল বুঝি।"'), emoji: '❓' },
    multistep: { name: t('Multi-step problems', 'একাধিক ধাপের প্রশ্ন'), means: t('"I can solve simple ones but fail when concepts are combined."', '"সহজগুলো পারি, কিন্তু কয়েকটা ধারণা মিশলে পারি না।"'), emoji: '🧩' },
    bodmas: { name: t('BODMAS / order of operations', 'BODMAS / ক্রিয়ার ক্রম'), means: t('Brackets, × ÷ before + −, step order.', 'বন্ধনী, + − এর আগে × ÷, ধাপের ক্রম।'), emoji: '➗' },
  },

  /** The one-line recommendation (feature §11), per gap, around a chapter name. */
  advice: (gap, name) => {
    const n = (l) => pick(name, l);
    const A = {
      knowledge: t(`The basic idea of ${n('en')} is not settled yet. Start from the concept, then simple questions.`, `${n('bn')}-এর মূল ধারণা এখনও পোক্ত হয়নি। ধারণা থেকে শুরু করে সহজ প্রশ্নে যাও।`),
      skill: t(`Your basic ${n('en')} understanding is good, but applying it to real questions is where you get stuck.`, `${n('bn')}-এর মূল ধারণা ভালো, কিন্তু আসল প্রশ্নে প্রয়োগ করতে গিয়ে আটকে যাও।`),
      calculation: t(`You usually know the method in ${n('en')}, but the calculation goes wrong.`, `${n('bn')}-এ পদ্ধতি সাধারণত জানো, কিন্তু হিসেবে ভুল হয়।`),
      method: t(`You know the chapter, but in ${n('en')} you are often unsure which approach to use.`, `অধ্যায়টা জানো, কিন্তু ${n('bn')}-এ কোন পদ্ধতি লাগবে তা নিয়ে প্রায়ই দ্বিধা হয়।`),
      recall: t(`In ${n('en')} you often need help remembering the formula or rule.`, `${n('bn')}-এ সূত্র বা নিয়ম মনে করতে প্রায়ই সাহায্য লাগে।`),
      speed: t(`You can solve ${n('en')} questions, but they take much longer than the exam allows.`, `${n('bn')}-এর প্রশ্ন পারো, কিন্তু পরীক্ষার তুলনায় অনেক বেশি সময় লাগে।`),
      reading: t(`In ${n('en')} the question itself is often misread. Practise spotting what is asked.`, `${n('bn')}-এ প্রশ্নটাই প্রায়ই ভুল পড়া হয়। কী চাওয়া হচ্ছে তা ধরার অনুশীলন করো।`),
      multistep: t(`Your basic ${n('en')} understanding is good, but you struggle when several steps are combined.`, `${n('bn')}-এর মূল ধারণা ভালো, কিন্তু কয়েকটা ধাপ মিশলে অসুবিধা হয়।`),
      bodmas: t('The order of operations (brackets, × ÷ before + −) is tripping you up in Simplification.', 'সরলীকরণে ক্রিয়ার ক্রম (বন্ধনী, + − এর আগে × ÷) নিয়ে ভুল হচ্ছে।'),
    };
    return A[gap] ?? t(`You get stuck most in ${n('en')}.`, `সবচেয়ে বেশি আটকাও ${n('bn')}-এ।`);
  },

  // ---- Practice My Weakness ----
  practiceTitle: t('🎯 Practice My Weakness', '🎯 দুর্বলতার অনুশীলন'),
  practiceHint: t(
    'New questions on the same pattern as the ones you got stuck on — different numbers and wording, never the same question.',
    'যে প্রশ্নে আটকেছ, সেই একই ধরনের নতুন প্রশ্ন — সংখ্যা ও ভাষা আলাদা, কখনও একই প্রশ্ন নয়।',
  ),
  recommended: t('Recommended now', 'এখন যা করা ভালো'),
  practiceLine: (mode, name, count) =>
    withName(name, (n) => `Practice: ${mode.en}${n ? ` — ${n}` : ''} · ${count} questions`, (n) => `অনুশীলন: ${mode.bn}${n ? ` — ${n}` : ''} · ${count}টি প্রশ্ন`),
  start: t('Start practice', 'অনুশীলন শুরু করো'),
  starting: t('Building your quiz…', 'কুইজ তৈরি হচ্ছে…'),
  chooseMode: t('Practice type', 'অনুশীলনের ধরন'),
  chooseLevel: t('Level', 'স্তর'),
  chooseCount: t('Questions', 'প্রশ্ন'),
  autoLevel: t('Auto (recommended)', 'নিজে থেকে (প্রস্তাবিত)'),
  modes: {
    concept: { name: t('Concept Recovery', 'ধারণা ফিরে পাওয়া'), hint: t('For when the basic idea is unclear.', 'মূল ধারণা অস্পষ্ট হলে।') },
    formula: { name: t('Formula Practice', 'সূত্র অনুশীলন'), hint: t('For forgotten formulas and rules.', 'ভুলে যাওয়া সূত্র ও নিয়মের জন্য।') },
    calculation: { name: t('Calculation Practice', 'হিসেব অনুশীলন'), hint: t('For arithmetic and calculation slips.', 'হিসেবের ভুলের জন্য।') },
    method: { name: t('Method Selection', 'পদ্ধতি বাছাই'), hint: t('Spot which approach a question needs.', 'কোন প্রশ্নে কোন পদ্ধতি তা চেনা।') },
    pattern: { name: t('Pattern Practice', 'ধরন অনুশীলন'), hint: t('Many variations of the patterns you got stuck on.', 'যে ধরনে আটকেছ, তার নানা রূপ।') },
    exam: { name: t('Exam-Level Practice', 'পরীক্ষার স্তরের অনুশীলন'), hint: t('Harder WBPSC / WBP / KP-style questions.', 'কঠিন WBPSC / WBP / KP ধাঁচের প্রশ্ন।') },
    mixed: { name: t('Mixed Weakness Quiz', 'মিশ্র দুর্বলতার কুইজ'), hint: t('Your top weaknesses together.', 'প্রধান দুর্বলতাগুলো একসাথে।') },
  },
  levels: {
    basic: t('Level 1 — Basic', 'স্তর ১ — সহজ'),
    moderate: t('Level 2 — Application', 'স্তর ২ — প্রয়োগ'),
    exam: t('Level 3 — Exam level', 'স্তর ৩ — পরীক্ষার স্তর'),
  },
  levelLadder: t('Basic → Application → Exam level: 4 of 5 right moves you up a level.', 'সহজ → প্রয়োগ → পরীক্ষার স্তর: ৫টার ৪টা ঠিক হলে পরের স্তরে।'),
  noStuckForPractice: t('Mark at least one question "I\'m Stuck" in a Math mock first.', 'আগে ম্যাথ মকে অন্তত একটা প্রশ্নে "আটকে গেছি" দাও।'),

  // ---- Improvement ----
  improvementTitle: t('📈 Improvement', '📈 উন্নতি'),
  improvementRow: (name, before, now) => withName(name, (n) => `${n}: ${before}% → ${now}%`, (n) => `${n}: ${before}% → ${now}%`),
  improved: (d) => (d >= 0 ? t(`Improved +${d}%`, `উন্নতি +${d}%`) : t(`Down ${d}%`, `কমেছে ${d}%`)),
  noImprovementYet: t('Finish a practice set to see your progress here.', 'একটা অনুশীলন সেট শেষ করলে এখানে অগ্রগতি দেখা যাবে।'),
  recentPractice: t('Recent practice', 'সাম্প্রতিক অনুশীলন'),

  // ---- Problem cards ----
  problemsTitle: t('Your stuck questions', 'যে প্রশ্নে আটকেছ'),
  whyStuck: t('Why you were stuck', 'কেন আটকেছিলে'),
  noReason: t('No reason given', 'কারণ দেওয়া হয়নি'),
  stuckTimes: (n) => t(n === 1 ? 'Stuck once' : `Stuck ${n} times`, n === 1 ? 'একবার আটকেছ' : `${n} বার আটকেছ`),
  stuckBefore: (n) => t(`${n} earlier stuck mark${n === 1 ? '' : 's'} in this chapter`, `এই অধ্যায়ে আগে ${n} বার আটকেছ`),
  timeBefore: (s) => t(`${Math.round(s)}s before pressing I'm Stuck`, `আটকে গেছি চাপার আগে ${Math.round(s)} সেকেন্ড`),
  outcome: {
    CORRECT: t('Then solved it ✓', 'পরে সঠিক ✓'),
    INCORRECT: t('Then answered wrong', 'পরে ভুল উত্তর'),
    UNATTEMPTED: t('Left unanswered', 'উত্তর দেওয়া হয়নি'),
    TIMED_OUT: t('Time ran out', 'সময় শেষ'),
  },
  later: (c, n) => t(`Later on this pattern: ${c}/${n} right`, `পরে এই ধরনে: ${n}টির ${c}টি ঠিক`),
  revision: {
    due: t('In revision', 'রিভিশনে আছে'),
    revising: t('Revising', 'রিভিশন চলছে'),
    mastered: t('Mastered ✓', 'আয়ত্তে ✓'),
    none: t('Not in revision', 'রিভিশনে নেই'),
  },
  solution: t('Correct solution', 'সঠিক সমাধান'),
  showSolution: t('Show solution & learning', 'সমাধান ও শেখার অংশ দেখো'),
  hideSolution: t('Hide', 'লুকাও'),
  conceptInvolved: t('Concept involved', 'যে ধারণা লাগে'),
  howToSpot: t('How to spot it', 'কীভাবে চিনবে'),
  formula: t('Formula', 'সূত্র'),
  method: t('Method', 'পদ্ধতি'),
  workedExample: t('Worked example', 'করে দেখানো উদাহরণ'),
  trap: t('Common trap', 'সাধারণ ফাঁদ'),
  revise: t('📖 Revise this topic', '📖 এই অধ্যায় রিভাইস করো'),
  practiseSimilar: (n) => t(n ? `Practise similar questions (${n} available)` : 'Practise similar questions', n ? `একই ধরনের প্রশ্ন অনুশীলন করো (${n}টি আছে)` : 'একই ধরনের প্রশ্ন অনুশীলন করো'),
  more: t('Showing your latest stuck questions.', 'সাম্প্রতিক আটকে যাওয়া প্রশ্ন দেখানো হচ্ছে।'),

  // ---- After a practice set ----
  resultTitle: t('Practice My Weakness — result', 'দুর্বলতার অনুশীলন — ফলাফল'),
  previousNow: (p, n) => t(`Previous: ${p}% → Now: ${n}%`, `আগে: ${p}% → এখন: ${n}%`),
  firstTime: (n) => t(`Accuracy: ${n}%`, `নির্ভুলতা: ${n}%`),
  weakestPattern: t('Weakest pattern', 'সবচেয়ে দুর্বল ধরন'),
  strongestPattern: t('Strongest pattern', 'সবচেয়ে ভালো ধরন'),
  nextUp: (lvl) => ({ en: `4/5 or better — move up to ${lvl.en}.`, bn: `৫টার ৪টা বা বেশি ঠিক — এবার ${lvl.bn}।` }),
  nextSame: (lvl) => ({ en: `Stay at ${lvl.en} with a fresh set of the same patterns.`, bn: `${lvl.bn}-এই থাকো, একই ধরনের নতুন সেট নিয়ে।` }),
  nextRevise: t('Go back to the learning content first, then try Level 1 again.', 'আগে শেখার অংশে ফিরে যাও, তারপর আবার স্তর ১ চেষ্টা করো।'),
  nextMastered: t('Exam level mastered for these patterns. 🎉 Try a full Math mock to confirm.', 'এই ধরনে পরীক্ষার স্তর আয়ত্তে। 🎉 নিশ্চিত হতে একটা পুরো ম্যাথ মক দাও।'),
  nextSet: t('Next practice set', 'পরের অনুশীলন সেট'),
  sameAgain: t('Practise this level again', 'এই স্তর আবার অনুশীলন করো'),
  backToStuck: t('Back to My Stuck Problems', 'আটকে যাওয়া প্রশ্নে ফিরে যাও'),

  // ---- Home card ----
  cardTitle: t('🧠 My Math Weakness', '🧠 আমার ম্যাথের দুর্বলতা'),
  topProblem: t('Top problem', 'প্রধান সমস্যা'),
  evidence: t('Evidence', 'প্রমাণ'),
  mostStuckTopics: t('📌 Most stuck topics', '📌 সবচেয়ে বেশি আটকানো অধ্যায়'),
  nextAction: t('🎯 Next action', '🎯 পরের কাজ'),
  open: t('Open My Stuck Problems', 'আটকে যাওয়া প্রশ্ন খোলো'),
  cardNoGap: (n) => t(`${n} stuck problem${n === 1 ? '' : 's'} saved. More evidence is needed before naming a weakness.`, `${n}টি আটকে যাওয়া প্রশ্ন জমা আছে। দুর্বলতা বলার আগে আরও প্রমাণ দরকার।`),

  // ---- Mock result ----
  mockBanner: (n) =>
    t(
      `You marked ${n} question${n === 1 ? '' : 's'} "I'm Stuck". Your score is unchanged — these are saved to your learning map.`,
      `${n}টি প্রশ্নে "আটকে গেছি" দিয়েছ। স্কোর একই আছে — এগুলো তোমার শেখার মানচিত্রে জমা হয়েছে।`,
    ),
  stuckChip: t('🆘 Stuck', '🆘 আটকে'),
  filterStuck: t('Stuck', 'আটকে'),
});

/**
 * Labels of adaptive practice on "My learning analysis": Skill Map, next actions, Continue Studying,
 * week change, insight cards, chapter levels and practice-type chips. Bengali first (owner audience).
 */
const t = (en, bn) => ({ en, bn });
const bnNum = (n) => String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[d]);
const pctBn = (n) => `${bnNum(n)}%`;

export const AD = {
  sub: t(
    'Where you are doing well, where mistakes happen, and what to study now — all in one place.',
    'কোথায় ভালো আছো, কোথায় ভুল হচ্ছে এবং এখন কী পড়া উচিত — এক জায়গায় দেখো।',
  ),
  planLink: t('60-day plan', '৬০ দিনের পরিকল্পনা'),

  // ▶ Continue Studying
  continueTitle: t('Continue studying', 'পড়া চালিয়ে যাও'),
  continueCta: t('▶ Continue studying', '▶ পড়া চালিয়ে যাও'),
  continueWhy: {
    learn: (title) => t(`Learn ${title.en ?? ''} first: the concept is not read yet`, `আগে ${title.bn ?? title.en ?? ''} পড়ে নাও — ধারণাটা এখনও পড়া হয়নি`),
    revision: (n) => t(`${n} questions are due for revision`, `${bnNum(n)}টি প্রশ্ন রিভিশনের সময় হয়েছে`),
    practice: (title, level) => t(`${title.en ?? ''}: ${LEVEL[level]?.en ?? ''} practice`, `${title.bn ?? title.en ?? ''}: ${LEVEL[level]?.bn ?? ''} অনুশীলন`),
  },
  continueNothing: t('Start any chapter: after 5 answers the app knows your level.', 'যেকোনো অধ্যায় শুরু করো: ৫টি উত্তরের পর অ্যাপ তোমার স্তর বুঝে নেবে।'),

  // 📊 current status
  statusTitle: t('Where you stand now', 'তোমার বর্তমান অবস্থা'),
  overall: t('Overall progress', 'সামগ্রিক অগ্রগতি'),
  pyq: t('PYQ solved', 'আগের প্রশ্ন সমাধান'),
  streak: t('Study streak', 'পড়ার ধারাবাহিকতা'),
  days: (n) => t(`${n} day${n === 1 ? '' : 's'}`, `${bnNum(n)} দিন`),
  thisWeek: t('This week', 'এই সপ্তাহে'),

  // এখন কী করব?
  nowTitle: t('What should I do now?', 'এখন কী করব?'),
  nowSub: t('Chosen from your mastery, mistakes and how often your exam asks each chapter.', 'তোমার দক্ষতা, ভুল আর পরীক্ষায় অধ্যায়টি কতবার আসে — সব মিলিয়ে বাছা।'),
  nowEmpty: t('Answer a few questions in any chapter and your next steps will appear here.', 'যেকোনো অধ্যায়ে কয়েকটি প্রশ্নের উত্তর দাও — পরের ধাপগুলো এখানে দেখাবে।'),
  doN: (n, kind) => {
    const k = KIND[kind] ?? KIND.moderate;
    return t(`→ Practise ${n} ${k.en} questions`, `→ ${bnNum(n)}টি ${k.bn} প্রশ্ন অনুশীলন করো`);
  },
  startPractice: t('Start practice', 'অনুশীলন শুরু'),
  starting: t('Starting…', 'শুরু হচ্ছে…'),
  failed: t('Could not start. Try again.', 'শুরু করা যায়নি। আবার চেষ্টা করো।'),
  reviewConcept: t('Review concept', 'ধারণাটা আবার পড়ো'),
  tryAgain: t('Try again', 'আবার চেষ্টা করো'),
  conceptMsg: (name, n) => t(
    `You have made ${n} mistakes in ${name.en ?? name}. Review this concept before harder questions.`,
    `${name.bn ?? name.en ?? name}-এ ${bnNum(n)}টি ভুল হয়েছে। কঠিন প্রশ্নের আগে ধারণাটা আবার দেখে নাও।`,
  ),
  examPriority: { MUST: t('Must know for your exam', 'পরীক্ষায় অবশ্যই আসে'), IMPORTANT: t('Often asked', 'প্রায়ই আসে'), ADDITIONAL: t('Sometimes asked', 'মাঝে মাঝে আসে') },
  thinLevel: (level) => t(`Few ${LEVEL[level]?.en ?? ''} questions in this chapter yet — nearby levels are used.`, `এই অধ্যায়ে ${LEVEL[level]?.bn ?? ''} স্তরের প্রশ্ন কম — কাছের স্তরের প্রশ্ন দেওয়া হবে।`),

  // Skill Map
  skillTitle: t('My Skill Map', 'আমার দক্ষতার মানচিত্র'),
  skillSub: t('What I know, what I am learning, what I need to improve.', 'কী জানি, কী শিখছি, কোথায় আরও অনুশীলন দরকার।'),
  seeSkillMap: t('See skill map', 'দক্ষতার মানচিত্র দেখো'),
  skillCounts: (c) => t(`Strong ${c.strong} · Developing ${c.developing} · Needs practice ${c.weak}`, `দক্ষ ${bnNum(c.strong)} · শিখছি ${bnNum(c.developing)} · অনুশীলন দরকার ${bnNum(c.weak)}`),
  notStarted: (n) => t(`${n} chapters not started`, `${bnNum(n)}টি অধ্যায় শুরু হয়নি`),
  nextLevel: t('Next', 'পরের ধাপ'),
  answeredN: (n) => t(`${n} answered`, `${bnNum(n)}টি উত্তর`),
  emptyGroup: t('None yet', 'এখনও নেই'),

  // Week change
  weekTitle: t('What changed in the last 7 days?', 'গত ৭ দিনে কী পরিবর্তন হয়েছে?'),
  accuracyDelta: (s, d) => t(`${d >= 0 ? '↑' : '↓'} ${s.en} accuracy ${d >= 0 ? '+' : ''}${d}%`, `${d >= 0 ? '↑' : '↓'} ${s.bn} নির্ভুলতা ${d >= 0 ? '+' : '−'}${bnNum(Math.abs(d))}%`),
  answered: (n) => t(`${n} questions answered`, `${bnNum(n)}টি প্রশ্নের উত্তর`),
  improved: (n) => t(`🔥 ${n} chapter${n === 1 ? '' : 's'} improved`, `🔥 ${bnNum(n)}টি অধ্যায়ে উন্নতি`),
  wrongDelta: (d) => (d <= 0 ? t(`✓ ${-d} fewer wrong answers than last week`, `✓ গত সপ্তাহের চেয়ে ${bnNum(-d)}টি কম ভুল`) : t(`⚠ ${d} more wrong answers than last week`, `⚠ গত সপ্তাহের চেয়ে ${bnNum(d)}টি বেশি ভুল`)),
  revisionDue: (n) => t(`⚠ ${n} questions due for revision`, `⚠ ${bnNum(n)}টি প্রশ্ন রিভিশনের অপেক্ষায়`),
  weekQuiet: t('No answers this week yet.', 'এই সপ্তাহে এখনও কোনো উত্তর নেই।'),

  // Insight cards (only from the student's data)
  insightsTitle: t('What your answers show', 'তোমার উত্তর থেকে যা বোঝা যাচ্ছে'),
  insight: {
    progress: (i) => ({ icon: '🎯', title: t('Good progress', 'ভালো অগ্রগতি'), body: t(`Your ${i.title.en ?? ''} accuracy rose from ${i.from}% to ${i.to}%.`, `${i.title.bn ?? i.title.en ?? ''}-এ নির্ভুলতা ${pctBn(i.from)} থেকে বেড়ে ${pctBn(i.to)}।`) }),
    attention: (i) => ({
      icon: '⚠️',
      title: t('Needs attention', 'নজর দাও'),
      body: i.repeated >= 2
        ? t(`You are repeatedly missing ${i.title.en ?? ''} questions (${i.repeated} mistakes repeating).`, `${i.title.bn ?? i.title.en ?? ''}-এর প্রশ্নে বারবার ভুল হচ্ছে (${bnNum(i.repeated)}টি ভুল বারবার)।`)
        : t(`${i.title.en ?? ''} accuracy fell${i.from != null ? ` from ${i.from}% to ${i.to}%` : ''}.`, `${i.title.bn ?? i.title.en ?? ''}-এ নির্ভুলতা কমেছে${i.from != null ? ` (${pctBn(i.from)} → ${pctBn(i.to)})` : ''}।`),
    }),
    challenge: (i) => ({ icon: '🔥', title: t('Challenge yourself', 'নিজেকে চ্যালেঞ্জ করো'), body: t(`You are strong in ${i.title.en ?? ''}. Try ${LEVEL[i.level]?.en ?? 'Hard'}-level questions.`, `${i.title.bn ?? i.title.en ?? ''}-এ তুমি দক্ষ। এবার ${LEVEL[i.level]?.bn ?? 'কঠিন'} স্তরের প্রশ্ন চেষ্টা করো।`) }),
    review: (i) => ({ icon: '📖', title: t('Review', 'আবার দেখো'), body: t(`You made ${i.wrong} mistakes in ${i.concept?.en ?? ''} (${i.title.en ?? ''}). Review the concept before continuing.`, `${i.title.bn ?? i.title.en ?? ''}-এর ${i.concept?.bn ?? i.concept?.en ?? ''}-এ ${bnNum(i.wrong)}টি ভুল। এগোনোর আগে ধারণাটা দেখে নাও।`) }),
  },
};

/** The five difficulty levels (stored difficulty 1-5). */
export const LEVEL = {
  basic: t('Basic', 'মৌলিক'),
  easy: t('Easy', 'সহজ'),
  moderate: t('Moderate', 'মাঝারি'),
  hard: t('Hard', 'কঠিন'),
  challenge: t('Exam Challenge', 'পরীক্ষার চ্যালেঞ্জ'),
  assess: t('Level check', 'স্তর যাচাই'),
};

/** What the next practice is, as a word in "Practise 5 ___ questions". */
const KIND = {
  basic: t('Basic', 'মৌলিক'),
  easy: t('Easy', 'সহজ'),
  moderate: t('Moderate', 'মাঝারি'),
  hard: t('Hard', 'কঠিন'),
  challenge: t('Exam Challenge', 'চ্যালেঞ্জ'),
  assess: t('level-check', 'স্তর-যাচাইয়ের'),
  review_concept: t('Basic (concept)', 'মৌলিক (ধারণা)'),
  revise: t('revision', 'রিভিশনের'),
};

/** Skill Map status: icon + word + colour (never colour alone). */
export const STATUS = {
  strong: { icon: '🟢', label: t('Strong', 'দক্ষ'), tone: 'bg-emerald-50 text-emerald-900 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/30' },
  developing: { icon: '🟡', label: t('Developing', 'শিখছি'), tone: 'bg-amber-50 text-amber-900 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/30' },
  weak: { icon: '🔴', label: t('Needs practice', 'অনুশীলন দরকার'), tone: 'bg-rose-50 text-rose-900 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-200 dark:ring-rose-500/30' },
  insufficient: { icon: '🔵', label: t('Not enough data', 'যথেষ্ট তথ্য নেই'), tone: 'bg-sky-50 text-sky-900 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-200 dark:ring-sky-500/30' },
};

/** Question chips in a practice session: never mix kinds of practice without saying which is which. */
export const PRACTICE_TYPE = {
  learning: { label: t('Learning practice', 'শেখার অনুশীলন'), tone: 'bg-sky-50 text-sky-900 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-200 dark:ring-sky-500/30' },
  exam_pattern: { label: t('Exam pattern', 'পরীক্ষার ধাঁচ'), tone: 'bg-indigo-50 text-indigo-900 ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-200 dark:ring-indigo-500/30' },
  pyq: { label: t('🟣 Actual PYQ', '🟣 আসল আগের প্রশ্ন'), tone: 'bg-amber-50 text-amber-900 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/30' },
  // An original practice question in a pattern real PYQs use — never presented as a PYQ itself.
  pyq_pattern: { label: t('🔵 PYQ pattern practice', '🔵 আগের প্রশ্নের ধাঁচে অনুশীলন'), tone: 'bg-violet-50 text-violet-900 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-200 dark:ring-violet-500/30' },
  challenge: { label: t('Challenge', 'চ্যালেঞ্জ'), tone: 'bg-rose-50 text-rose-900 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-200 dark:ring-rose-500/30' },
};

export const levelOf = (lv) => (lv?.action === 'assess' ? 'assess' : lv?.next ?? null);

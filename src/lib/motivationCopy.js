/** Copy for the mastery map, weak patterns, badges, streak, daily challenge and leaderboard. English + Bengali. */
const t = (en, bn) => ({ en, bn });

export const MASTERY = Object.freeze({
  title: t('Mastery map', 'দক্ষতার মানচিত্র'),
  sub: t(
    'Every chapter at a glance, from your last 30 answers in it. Spend your time on the red and amber ones.',
    'সব অধ্যায় এক নজরে, প্রতিটিতে তোমার শেষ 30টি উত্তরের ভিত্তিতে। লাল আর হলুদগুলোতে বেশি সময় দাও।',
  ),
  status: {
    strong: t('Strong', 'দক্ষ'),
    improving: t('Improving', 'উন্নতি হচ্ছে'),
    weak: t('Weak', 'দুর্বল'),
    started: t('Just started', 'সবে শুরু'),
    not_started: t('Not started', 'শুরু হয়নি'),
  },
  accuracy: (p) => t(`${p}% right`, `${p}% ঠিক`),
  hard: (p) => t(`hard ${p}%`, `কঠিন ${p}%`),
  answers: (n) => t(`${n} answers`, `${n}টি উত্তর`),
  open: t('Open the mastery map', 'দক্ষতার মানচিত্র খোলো'),
  legendTitle: t('How it is worked out', 'কীভাবে হিসাব হয়'),
  legend: t(
    'Strong: at least 10 answers, 75%+ right, and 60%+ on the harder questions. Weak: under 50% right. Needs at least 5 answers.',
    'দক্ষ: অন্তত 10টি উত্তর, 75%+ ঠিক, আর কঠিন প্রশ্নে 60%+। দুর্বল: 50%-এর কম ঠিক। অন্তত 5টি উত্তর লাগে।',
  ),
});

export const WEAK = Object.freeze({
  title: t('Weak question patterns', 'দুর্বল প্রশ্নের ধরন'),
  sub: t('A chapter can look fine while one type of question keeps catching you out.', 'অধ্যায় ঠিকঠাক মনে হলেও একটা নির্দিষ্ট ধরনের প্রশ্নে বারবার ভুল হতে পারে।'),
  // Compare with the chapter only when the pattern is clearly behind it.
  // chapter: localized { en, bn } name.
  line: (chapter, cp, pp) =>
    cp != null && cp - pp >= 15
      ? t(`You get ${cp}% in ${chapter.en}, but only ${pp}% here.`, `${chapter.bn ?? chapter.en}-এ তুমি ${cp}% পাও, কিন্তু এখানে মাত্র ${pp}%।`)
      : t(`Only ${pp}% right so far.`, `এখন পর্যন্ত মাত্র ${pp}% ঠিক।`),
  learn: t('Learn the pattern', 'ধরনটা শেখো'),
  practise: t('Practise 10', '10টি অনুশীলন'),
  none: t('No weak patterns yet. Practise more and they will show up here.', 'এখনও কোনো দুর্বল ধরন নেই। আরও অনুশীলন করলে এখানে দেখাবে।'),
});

export const BADGE = Object.freeze({
  title: t('Badges', 'ব্যাজ'),
  none: t('Answer 10 questions to earn your first badge.', 'প্রথম ব্যাজ পেতে 10টি প্রশ্নের উত্তর দাও।'),
});

export const STREAK = Object.freeze({
  days: (n) => t(`${n}-day streak`, `টানা ${n} দিন`),
  freezes: (n) => t(`${n} streak ${n === 1 ? 'freeze' : 'freezes'} saved`, `${n}টি স্ট্রিক-ফ্রিজ জমা`),
  how: (k) => t(
    `Every ${k} days in a row earn a 🧊 freeze (up to 2). Miss a day and a freeze keeps your streak alive.`,
    `টানা ${k} দিন অনুশীলনে একটি 🧊 ফ্রিজ পাবে (সর্বোচ্চ 2টি)। কোনো দিন বাদ পড়লে ফ্রিজ তোমার স্ট্রিক বাঁচিয়ে রাখবে।`,
  ),
  saved: (n) => t(`A freeze saved your streak on ${n} ${n === 1 ? 'day' : 'days'}.`, `ফ্রিজ ${n} দিন তোমার স্ট্রিক বাঁচিয়েছে।`),
});

export const CHALLENGE = Object.freeze({
  title: t('Daily challenge', 'দৈনিক চ্যালেঞ্জ'),
  sub: t('5 questions, one from each subject. Everyone gets the same set today. About 3 minutes.', 'প্রতিটি বিষয় থেকে একটি করে 5টি প্রশ্ন। আজ সবার জন্য একই প্রশ্ন। মোটামুটি 3 মিনিট।'),
  play: t("Play today's challenge", 'আজকের চ্যালেঞ্জ খেলো'),
  doneToday: (c, n) => t(`Done today: ${c}/${n}. Come back tomorrow!`, `আজ হয়ে গেছে: ${c}/${n}। কাল আবার এসো!`),
  submit: t('Submit answers', 'উত্তর জমা দাও'),
  unanswered: (n) => t(`${n} not answered yet`, `${n}টির উত্তর বাকি`),
  score: (c, n) => t(`You got ${c} of ${n} right`, `${n}টির মধ্যে ${c}টি ঠিক`),
  perfect: t('Perfect! 🎯', 'নিখুঁত! 🎯'),
  notCounted: t('Your first attempt today is the one that counts.', 'আজকের প্রথম চেষ্টাটাই গোনা হবে।'),
  loginHint: t('Log in to keep your result and earn badges.', 'ফল রাখতে ও ব্যাজ পেতে লগ ইন করো।'),
  q: (i) => t(`Question ${i}`, `প্রশ্ন ${i}`),
});

export const BOARD = Object.freeze({
  title: t('Weekly leaderboard', 'সাপ্তাহিক লিডারবোর্ড'),
  sub: t(
    'Correct answers in the last 7 days. Only students who turn it on are listed, by first name and initial.',
    'গত 7 দিনের সঠিক উত্তর। যারা চালু করেছে শুধু তারাই তালিকায় থাকে, নামের প্রথম অংশ ও আদ্যক্ষর দিয়ে।',
  ),
  join: t('Show me on the leaderboard', 'আমাকে লিডারবোর্ডে দেখাও'),
  leave: t('Hide me from the leaderboard', 'আমাকে লিডারবোর্ড থেকে সরাও'),
  off: t('You are not on the leaderboard. Turning it on is optional; your progress is private either way.', 'তুমি লিডারবোর্ডে নেই। চালু করা ঐচ্ছিক; দুই ক্ষেত্রেই তোমার অগ্রগতি গোপন থাকে।'),
  you: t('You', 'তুমি'),
  correct: (n) => t(`${n} correct`, `${n}টি ঠিক`),
  empty: t('Nobody on the board yet this week.', 'এই সপ্তাহে এখনও কেউ বোর্ডে নেই।'),
});

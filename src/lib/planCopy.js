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
  },
  phaseTitle: { FOUNDATION: t('Foundation', 'ভিত্তি'), CORE: t('Core subjects', 'মূল বিষয়'), PYQ: t('Past papers', 'আগের প্রশ্ন'), REVISION: t('Revision + mocks', 'রিভিশন + মক') },
});

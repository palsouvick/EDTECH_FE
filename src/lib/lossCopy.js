/** Copy for "Why did I lose marks?" on the mock result page (components/analytics/LossReasons.jsx). */

const t = (en, bn) => ({ en, bn });
const bnNum = (n) => String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[d]);
const marks = (m) => (Number.isInteger(m) ? String(m) : m.toFixed(2).replace(/0$/, ''));

export const LOSS = Object.freeze({
  title: t('Why did I lose marks?', 'কেন নম্বর কাটা গেল?'),
  none: t('You did not lose a single mark. Well done!', 'একটাও নম্বর কাটা যায়নি। দারুণ!'),
  likely: t('Likely', 'সম্ভবত'),
  yours: t('Your reason', 'তোমার কারণ'),
  whyThis: t('Why did you lose this one?', 'এটা কেন ভুল হলো?'),
  clear: t('Clear', 'মুছে দাও'),
  saveError: t('Could not save. Check your connection and try again.', 'সেভ হয়নি। ইন্টারনেট দেখে আবার চেষ্টা করো।'),
  nextSteps: t('What to do next', 'এরপর কী করবে'),
  tagTitle: t('Tag your lost questions', 'যে প্রশ্নে নম্বর গেছে, তার কারণ বাছো'),
  tagHint: t(
    'Likely reasons come from your time and the option you chose. Only you know the real reason: one tap fixes it.',
    'সম্ভাব্য কারণ বের করা হয়েছে তোমার সময় আর বাছা উত্তর থেকে। আসল কারণ শুধু তুমিই জানো: এক ট্যাপে ঠিক করে দাও।',
  ),
  question: (n) => t(`Q${n}`, `প্র${bnNum(n)}`),
  showAll: (n) => t(`Show all ${n}`, `সব ${bnNum(n)}টি দেখাও`),
  showLess: t('Show fewer', 'কম দেখাও'),
  disclaimer: t(
    'A study guide, not a verdict: "likely" reasons are a best guess from timing and known traps.',
    'এটা পড়ার দিশা, রায় নয়: "সম্ভবত" কারণগুলো সময় আর পরিচিত ফাঁদ দেখে আন্দাজ করা।',
  ),
});

export const REASON_LABEL = Object.freeze({
  concept: t('Concept gap', 'ধারণার ঘাটতি'),
  calculation: t('Calculation slip', 'হিসাবের ভুল'),
  guess: t('Guess / rushed', 'আন্দাজ / তাড়াহুড়ো'),
  misread: t('Misread the question', 'প্রশ্ন ভুল পড়া'),
  time: t('Time management', 'সময় ব্যবস্থাপনা'),
  skipped: t('Skipped', 'ছেড়ে দেওয়া'),
  untagged: t('Not tagged yet', 'কারণ এখনও বাছা হয়নি'),
});

export const REASON_HINT = Object.freeze({
  concept: t('Did not know the rule or method.', 'নিয়ম বা পদ্ধতি জানা ছিল না।'),
  calculation: t('Knew the method, went wrong in the working.', 'পদ্ধতি জানতে, কিন্তু হিসাবে ভুল হয়েছে।'),
  guess: t('Answered too fast, or by guessing.', 'খুব তাড়াতাড়ি বা আন্দাজে উত্তর দিয়েছ।'),
  misread: t('Missed a word like NOT, EXCEPT, or the unit asked.', 'NOT, EXCEPT বা চাওয়া একক চোখ এড়িয়ে গেছে।'),
  time: t('Ran out of time, or spent it on other questions.', 'সময় শেষ, বা অন্য প্রশ্নে সময় চলে গেছে।'),
  skipped: t('Read it, but left it unanswered.', 'পড়েছ, কিন্তু উত্তর দাওনি।'),
  untagged: t('Only you know why. Tap a reason below.', 'কেন ভুল হলো তা শুধু তুমিই জানো। নিচে একটা কারণ বাছো।'),
});

/** Short evidence for a likely reason, shown next to the chip. */
export const signalText = (item) => {
  const s = Math.round(item.timeSpentSec);
  const e = item.expectedTimeSec;
  switch (item.signal) {
    case 'trap':
      return t('You chose a common trap option', 'তুমি একটা পরিচিত ফাঁদের উত্তর বেছেছ');
    case 'rushed':
      return t(`Answered in ${s}s (usual ${e}s)`, `${bnNum(s)} সেকেন্ডে উত্তর (সাধারণত ${bnNum(e)} সেকেন্ড)`);
    case 'stuck':
      return t(`Took ${s}s (usual ${e}s)`, `${bnNum(s)} সেকেন্ড লেগেছে (সাধারণত ${bnNum(e)} সেকেন্ড)`);
    case 'notReached':
      return t('Not reached', 'এই প্রশ্নে পৌঁছাওনি');
    case 'skipped':
      return t(`Opened for ${s}s, not answered`, `${bnNum(s)} সেকেন্ড দেখেছ, উত্তর দাওনি`);
    default:
      return t('Wrong answer', 'ভুল উত্তর');
  }
};

export const headline = (total, n) =>
  t(`You lost ${marks(total)} marks on ${n} question${n === 1 ? '' : 's'}`, `${bnNum(n)}টি প্রশ্নে ${bnNum(marks(total))} নম্বর কাটা গেছে`);

export const negativeLine = (m) => t(`${marks(m)} of them to negative marking`, `এর মধ্যে ${bnNum(marks(m))} নম্বর নেগেটিভ মার্কিংয়ে`);

export const timeLine = (sec) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  const en = m ? `${m} min ${s} s` : `${s} s`;
  const bn = m ? `${bnNum(m)} মিনিট ${bnNum(s)} সেকেন্ড` : `${bnNum(s)} সেকেন্ড`;
  return t(`${en} spent on questions that did not score`, `যে প্রশ্নে নম্বর আসেনি তাতে ${bn} গেছে`);
};

export const bucketLine = (count, m) => t(`${count} · −${marks(m)}`, `${bnNum(count)} · −${bnNum(marks(m))}`);

export const tipFor = ({ key, count: n, marksLost: m }) => {
  const mm = marks(m);
  const tips = {
    concept: t(`Revise the rule first, then practise: ${n} question${n === 1 ? '' : 's'} cost ${mm} marks.`, `আগে নিয়মটা ঝালিয়ে নাও, তারপর অনুশীলন: ${bnNum(n)}টি প্রশ্নে ${bnNum(mm)} নম্বর গেছে।`),
    calculation: t(`Write every step and recheck the last line: ${n} slip${n === 1 ? '' : 's'} cost ${mm} marks.`, `প্রতিটা ধাপ লেখো, শেষ লাইনটা আবার মিলিয়ে নাও: ${bnNum(n)}টি হিসাবের ভুলে ${bnNum(mm)} নম্বর গেছে।`),
    guess: t(`Slow down and re-read before you tap: ${n} quick answer${n === 1 ? '' : 's'} cost ${mm} marks.`, `ট্যাপ করার আগে ধীরে আবার পড়ো: ${bnNum(n)}টি তাড়াহুড়োর উত্তরে ${bnNum(mm)} নম্বর গেছে।`),
    misread: t(`Underline what is asked (NOT, EXCEPT, units): ${n} misread question${n === 1 ? '' : 's'} cost ${mm} marks.`, `কী চাওয়া হয়েছে দাগ দাও (NOT, EXCEPT, একক): ${bnNum(n)}টি ভুল পড়ায় ${bnNum(mm)} নম্বর গেছে।`),
    time: t(`Pace yourself: when a question passes its usual time, mark it and move on. ${n} question${n === 1 ? '' : 's'} cost ${mm} marks.`, `সময় ভাগ করে চলো: কোনো প্রশ্নে সাধারণ সময় পেরোলে মার্ক করে এগিয়ে যাও। ${bnNum(n)}টি প্রশ্নে ${bnNum(mm)} নম্বর গেছে।`),
    skipped: t(`Practise these chapters so you can attempt them: ${n} skipped question${n === 1 ? '' : 's'} cost ${mm} marks.`, `এই অধ্যায়গুলো অনুশীলন করো যাতে উত্তর দিতে পারো: ${bnNum(n)}টি ছেড়ে দেওয়া প্রশ্নে ${bnNum(mm)} নম্বর গেছে।`),
    untagged: t(`Tag the ${n} question${n === 1 ? '' : 's'} below to see where those ${mm} marks went.`, `নিচের ${bnNum(n)}টি প্রশ্নের কারণ বাছো, তাহলে দেখবে ওই ${bnNum(mm)} নম্বর কোথায় গেল।`),
  };
  return tips[key];
};

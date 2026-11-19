/** Copy for F13 — the one Revision page. English + Bengali. */
const t = (en, bn) => ({ en, bn });
const bn = (n) => String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[d]);

export const REV = Object.freeze({
  title: t('Revision', 'রিভিশন'),
  sub: t(
    'Everything you need to revise, in one place: what is due today, your mistakes, bookmarks, weak topics, previous-year questions and words.',
    'যা রিভিশন করতে হবে সব এক জায়গায়: আজ যা বাকি, তোমার ভুল, বুকমার্ক, দুর্বল অধ্যায়, আগের বছরের প্রশ্ন আর শব্দ।',
  ),
  start: t('Start revising', 'রিভিশন শুরু করো'),
  open: t('Open', 'খোলো'),
  nothingDue: t('Nothing is due today — well done.', 'আজ কিছু বাকি নেই — দারুণ।'),
  dueToday: t('Due today', 'আজ বাকি'),
  dueTotal: (n) => t(`${n} to revise today`, `আজ ${bn(n)}টি রিভিশন`),
  dueQuestions: (n) => t(`${n} questions`, `${bn(n)}টি প্রশ্ন`),
  dueFacts: (n) => t(`${n} GK facts`, `${bn(n)}টি সাধারণ জ্ঞানের তথ্য`),
  dueWords: (n) => t(`${n} words`, `${bn(n)}টি শব্দ`),
  mistakes: t('Mistakes', 'ভুল'),
  mistakesLine: (open, repeating) => t(
    `${open} open${repeating ? ` · ${repeating} repeating` : ''}`,
    `${bn(open)}টি খোলা${repeating ? ` · ${bn(repeating)}টি বারবার` : ''}`,
  ),
  masteredLine: (n) => t(`${n} fixed for good`, `${bn(n)}টি পাকাপাকি ঠিক`),
  openNotebook: t('Open the mistake notebook', 'ভুলের খাতা খোলো'),
  bookmarked: t('Bookmarked', 'বুকমার্ক'),
  bmQuestions: (n) => t(`${n} questions`, `${bn(n)}টি প্রশ্ন`),
  bmFacts: (n) => t(`${n} GK facts`, `${bn(n)}টি তথ্য`),
  bmWords: (n) => t(`${n} favourite words`, `${bn(n)}টি প্রিয় শব্দ`),
  weakTopics: t('Weak topics', 'দুর্বল অধ্যায়'),
  weakHint: t('Chapters that need work, from your own answers.', 'যে অধ্যায়ে আরও কাজ দরকার, তোমার নিজের উত্তর থেকে।'),
  noWeak: t('No weak topics yet — keep practising and they will show up here.', 'এখনও কোনো দুর্বল অধ্যায় নেই — অনুশীলন চালিয়ে যাও, এখানে দেখাবে।'),
  accuracy: (p) => t(`${p}% right`, `${bn(p)}% ঠিক`),
  practise: t('Practise', 'অনুশীলন করো'),
  pyq: t('PYQ revision', 'আগের বছরের প্রশ্নের রিভিশন'),
  pyqLine: (queue, due) => t(
    `${queue} previous-year questions in your revision queue, ${due} due today`,
    `রিভিশনের তালিকায় ${bn(queue)}টি আগের বছরের প্রশ্ন, আজ ${bn(due)}টি বাকি`,
  ),
  pyqEmpty: t('Previous-year questions you get wrong or bookmark come here.', 'আগের বছরের যে প্রশ্ন ভুল করবে বা বুকমার্ক করবে, সেগুলো এখানে আসবে।'),
  revisePyq: t('Revise PYQs due', 'বাকি PYQ রিভিশন করো'),
  morePyq: t('Practise more PYQs', 'আরও PYQ অনুশীলন'),
  vocabulary: t('Vocabulary', 'শব্দভান্ডার'),
  vocabLine: (due, difficult, missed) => t(
    `${due} due · ${difficult} difficult · ${missed} missed before`,
    `${bn(due)}টি বাকি · ${bn(difficult)}টি কঠিন · ${bn(missed)}টি আগে ভুল`,
  ),
  reviewWords: t('Review words', 'শব্দ রিভিশন করো'),
  sameSchedule: t(
    'Revision uses the same spaced schedules as before (1, 3, 7 and 21 days) — your old progress, mistakes and bookmarks are all here.',
    'রিভিশন আগের মতোই একই ব্যবধানে হয় (১, ৩, ৭ ও ২১ দিন) — তোমার পুরনো অগ্রগতি, ভুল আর বুকমার্ক সবই এখানে আছে।',
  ),
});

/** Copy for the revision list (bookmarked questions). English + Bengali. */
const t = (en, bn) => ({ en, bn });

export const REVISION = Object.freeze({
  title: t('My revision list', 'আমার রিভিশন তালিকা'),
  sub: t(
    'Every question you bookmarked. Try each one again without looking; once you get it right, tick it off.',
    'যত প্রশ্ন বুকমার্ক করেছ, সব এখানে। উত্তর না দেখে আবার চেষ্টা করো; ঠিক হলে তালিকা থেকে সরিয়ে দাও।',
  ),
  total: (n) => t(`${n} to revise`, `${n}টি রিভিশন বাকি`),
  all: t('All', 'সব'),
  check: t('Check answer', 'উত্তর মেলাও'),
  checking: t('Checking…', 'মেলানো হচ্ছে…'),
  right: t('Correct! You have learnt this one. 🎉', 'ঠিক! এটা তোমার শেখা হয়ে গেছে। 🎉'),
  wrong: t('Not yet. Read the explanation and try again later.', 'এখনও হয়নি। ব্যাখ্যাটা পড়ো, পরে আবার চেষ্টা করো।'),
  explanation: t('Explanation', 'ব্যাখ্যা'),
  shortcut: t('Shortcut', 'শর্টকাট'),
  whyWrong: t('Why your choice is wrong', 'তোমার উত্তর কেন ভুল'),
  gotIt: t('Got it, remove', 'শিখে গেছি, সরাও'),
  removed: t('Removed from your list', 'তালিকা থেকে সরানো হয়েছে'),
  undo: t('Undo', 'ফিরিয়ে আনো'),
  tryAgain: t('Try again', 'আবার চেষ্টা'),
  saved: (d) => t(`Saved ${d}`, `সংরক্ষিত ${d}`),
  more: t('Load more', 'আরও দেখাও'),
  emptyTitle: t('Your revision list is empty', 'তোমার রিভিশন তালিকা খালি'),
  emptyBody: t(
    'While practising, tap "Bookmark for revision" on any question you want to see again. It will wait for you here.',
    'অনুশীলনের সময় যে প্রশ্ন আবার দেখতে চাও, সেখানে "রিভিশনের জন্য বুকমার্ক" চাপো। প্রশ্নটা এখানে তোমার জন্য রাখা থাকবে।',
  ),
  startPractice: t('Start practising', 'অনুশীলন শুরু করো'),
  savedInArena: t('Saved to your revision list', 'রিভিশন তালিকায় রাখা হয়েছে'),
  open: t('Open list', 'তালিকা খোলো'),
});

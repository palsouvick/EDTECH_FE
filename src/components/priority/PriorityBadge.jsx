import { useDataSource } from '../../app/DataSourceContext';
import { useResource } from '../../hooks/useResource';
import { Localized } from '../topic-hub/Localized';

const t = (en, bn) => ({ en, bn });
const bnDigits = (n) => String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[d]);

export const PRIORITY = Object.freeze({
  MUST: { rank: 3, icon: '🔴', label: t('Must know', 'অবশ্যই জানতে হবে'), tone: 'bg-rose-50 text-rose-800 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30' },
  IMPORTANT: { rank: 2, icon: '🟠', label: t('Important', 'গুরুত্বপূর্ণ'), tone: 'bg-orange-50 text-orange-800 ring-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:ring-orange-500/30' },
  ADDITIONAL: { rank: 1, icon: '🟢', label: t('Additional', 'অতিরিক্ত'), tone: 'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30' },
});

const detail = (info, paperCount) => t(
  `${info.share}% of past-paper questions in this subject; asked in ${info.papers} of ${paperCount} papers`,
  `এই বিষয়ের আগের প্রশ্নের ${bnDigits(info.share)}%; ${bnDigits(paperCount)}টি প্রশ্নপত্রের ${bnDigits(info.papers)}টিতে এসেছে`,
);

/** WBPSC PYQ priorities (GET /pyq/priorities), or null while loading or when unavailable. */
export function usePriorities() {
  const source = useDataSource();
  const res = useResource(source.getPriorities ? 'pyq:priorities' : null, () => source.getPriorities());
  return res.status === 'ready' ? res.data : null;
}

/** The highest priority among a card's chapters, with that chapter's figures; null if none were measured. */
export function priorityFor(priorities, subject, topics) {
  const s = priorities?.subjects?.[subject];
  if (!s) return null;
  return topics.map((tp) => s.topics[tp]).filter(Boolean).sort((a, b) => PRIORITY[b.level].rank - PRIORITY[a.level].rank)[0] ?? null;
}

/** 🔴 Must know / 🟠 Important / 🟢 Additional, with the PYQ figures behind it. Renders nothing without data. */
export default function PriorityBadge({ subject, topics, className = '' }) {
  const priorities = usePriorities();
  const info = priorityFor(priorities, subject, topics);
  if (!info) return null;
  const meta = PRIORITY[info.level];
  return (
    <span title={detail(info, priorities.paperCount).en} className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${meta.tone} ${className}`}>
      <span aria-hidden="true">{meta.icon}</span>
      <Localized value={meta.label} />
      <span className="sr-only">: <Localized value={detail(info, priorities.paperCount)} /></span>
    </span>
  );
}

/** What the three tags mean, with the rule stated in numbers. */
export function PriorityLegend({ className = '' }) {
  const priorities = usePriorities();
  if (!priorities) return null;
  const { rule, paperCount } = priorities;
  const text = t(
    `Priority comes from ${paperCount} WBPSC past papers, chapter by chapter within each subject. 🔴 Must know: at least ${rule.mustPercent}% of the subject's questions and asked in at least ${rule.mustPaperPercent}% of papers. 🟠 Important: at least ${rule.importantPercent}% of questions, or asked in at least ${rule.importantPaperPercent}% of papers. 🟢 Additional: the rest. Chapters without a tag are not counted in the past papers yet.`,
    `অগ্রাধিকার ঠিক হয়েছে WBPSC-র ${bnDigits(paperCount)}টি আগের প্রশ্নপত্র থেকে, প্রতিটি বিষয়ের মধ্যে অধ্যায় ধরে। 🔴 অবশ্যই জানতে হবে: বিষয়ের অন্তত ${bnDigits(rule.mustPercent)}% প্রশ্ন এবং অন্তত ${bnDigits(rule.mustPaperPercent)}% প্রশ্নপত্রে এসেছে। 🟠 গুরুত্বপূর্ণ: অন্তত ${bnDigits(rule.importantPercent)}% প্রশ্ন, অথবা অন্তত ${bnDigits(rule.importantPaperPercent)}% প্রশ্নপত্রে এসেছে। 🟢 অতিরিক্ত: বাকিগুলি। যে অধ্যায়ে চিহ্ন নেই, আগের প্রশ্নপত্রে তা এখনও আলাদা করে গোনা হয়নি।`,
  );
  return <Localized value={text} as="p" className={`text-xs leading-relaxed text-slate-500 dark:text-slate-400 ${className}`} />;
}

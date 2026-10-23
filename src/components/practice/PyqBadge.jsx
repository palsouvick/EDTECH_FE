import { pyqLabel } from '../../lib/i18n';

/** "PYQ · SSC CGL 2024 Tier 1". Exam names stay in Latin script in every language, as on the papers. */
export default function PyqBadge({ refs }) {
  if (!refs?.length) return null;
  const [first, ...rest] = refs;
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-amber-50 py-1 pl-1 pr-2.5 text-xs font-semibold text-amber-900 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/30">
      <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white dark:bg-amber-400 dark:text-slate-950">
        PYQ
      </span>
      <span className="truncate" title={refs.map(pyqLabel).join(', ')}>
        {pyqLabel(first)}
      </span>
      {rest.length > 0 && <span className="shrink-0 text-amber-700 dark:text-amber-300">+{rest.length}</span>}
    </span>
  );
}

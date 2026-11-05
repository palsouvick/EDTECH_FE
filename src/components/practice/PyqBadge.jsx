import { pyqLabel } from '../../lib/i18n';
import { basisNotes } from '../../lib/pyqCopy';
import { Localized } from '../topic-hub/Localized';

/**
 * "PYQ · SSC CGL 2024 Tier 1". Exam names stay in Latin script in every language, as on the papers.
 * A second chip says when the answer is not from an official key, or the paper text is an
 * unofficial copy; official papers with official keys show the PYQ chip alone.
 */
export default function PyqBadge({ refs }) {
  if (!refs?.length) return null;
  const [first, ...rest] = refs;
  return (
    <>
      <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-amber-50 py-1 pl-1 pr-2.5 text-xs font-semibold text-amber-900 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/30">
        <span className="rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white dark:bg-amber-400 dark:text-slate-950">
          PYQ
        </span>
        <span className="truncate" title={refs.map(pyqLabel).join(', ')}>
          {pyqLabel(first)}
          {first.questionNo ? `, Q${first.questionNo}` : ''}
        </span>
        {rest.length > 0 && <span className="shrink-0 text-amber-700 dark:text-amber-300">+{rest.length}</span>}
      </span>
      {basisNotes(first).map((note) => (
        <span key={note.label.en} title={note.hint.en} className={`inline-flex max-w-full items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${note.tone}`}>
          <Localized value={note.label} />
        </span>
      ))}
    </>
  );
}

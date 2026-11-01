import { SOURCE_CHECK } from '../../lib/gkCopy';
import { Localized } from '../topic-hub/Localized';

/**
 * General Studies questions only: whether the answer has been checked against a
 * source. The server sends null for other subjects and for official papers (which
 * carry the PYQ badge instead), and then nothing is shown.
 */
export default function SourceCheckBadge({ check }) {
  const meta = check && SOURCE_CHECK[check.status];
  if (!meta) return null;
  const link = check.status === 'SOURCE_VERIFIED' && check.sourceUrl;
  const body = (
    <>
      <span aria-hidden="true">{check.status === 'SOURCE_VERIFIED' ? '✓' : check.status === 'NEEDS_REVIEW' ? '⚠' : '○'}</span>
      <Localized value={meta.label} />
    </>
  );
  const cls = `inline-flex max-w-full items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${meta.tone}`;
  return link ? (
    <a href={check.sourceUrl} target="_blank" rel="noopener noreferrer" title={check.sourceTitle || meta.hint.en} className={`${cls} underline-offset-2 hover:underline`}>
      {body}
    </a>
  ) : (
    <span title={meta.hint.en} className={cls}>
      {body}
    </span>
  );
}

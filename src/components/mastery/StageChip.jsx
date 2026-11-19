import { Localized } from '../topic-hub/Localized';
import { MASTERY } from '../../lib/motivationCopy';
import { STAGE_STYLE } from '../../pages/MasteryPage';

/**
 * The unified mastery stage of a chapter (F9/F10), the same label and colour
 * on every screen. Renders nothing for data without a stage.
 */
export default function StageChip({ stage, className = '' }) {
  if (!stage || !STAGE_STYLE[stage]) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1 ${STAGE_STYLE[stage].tile} ${className}`}>
      <span aria-hidden="true">{STAGE_STYLE[stage].icon}</span>
      <Localized value={MASTERY.stage[stage]} />
    </span>
  );
}

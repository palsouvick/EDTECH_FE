import { Localized } from '../topic-hub/Localized';

const PENDING = {
  en: 'Bengali meaning pending review',
  bn: 'বাংলা অর্থ পর্যালোচনার অপেক্ষায়',
};
const WHY = 'Written by our content team; a reviewer has not checked the Bengali yet. The English definition and example are unaffected.';

/**
 * A small, calm note beside a Bengali meaning that no reviewer has approved yet.
 * Shows nothing once the meaning is reviewed, so students only see it when it matters.
 */
export default function BengaliReviewNote({ review, className = '' }) {
  if (!review || review.status === 'REVIEWED') return null;
  return (
    <span
      title={WHY}
      className={`inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300 ${className}`}
    >
      <span aria-hidden="true">⏳</span>
      <Localized value={PENDING} />
      <span className="sr-only">. {WHY}</span>
    </span>
  );
}

/** Credit required by the CMU Pronouncing Dictionary licence (pronunciations are derived from it). */
export const CMU_CREDIT = 'Pronunciations (US English) derived from the CMU Pronouncing Dictionary, © 1993–2015 Carnegie Mellon University, BSD licence.';

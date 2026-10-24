import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useOptionalAuth } from '../../app/AuthContext';
import { useDataSource } from '../../app/DataSourceContext';
import { REVIEW } from '../../lib/reviewCopy';
import { Localized } from '../topic-hub/Localized';
import { ArrowRightIcon } from '../topic-hub/icons';

const dayLabel = (iso) => new Date(iso).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

/**
 * "Revise today (12)": the daily habit card, for signed-in students who have
 * anything in their revision queue. Renders nothing otherwise.
 */
export default function ReviseTodayCard({ className = '' }) {
  const auth = useOptionalAuth();
  const source = useDataSource();
  const [summary, setSummary] = useState(null);
  const user = auth?.user;

  useEffect(() => {
    if (!user) return undefined;
    let alive = true;
    source.getReviewSummary().then((s) => alive && setSummary(s), () => {});
    return () => {
      alive = false;
    };
  }, [user, source]);

  if (!user || !summary || (!summary.active && !summary.mastered)) return null;
  const due = summary.dueToday;

  return (
    <section aria-label={REVIEW.title.en} className={className}>
      <div className="flex flex-col gap-4 rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-600 p-5 text-white shadow-lg shadow-emerald-500/20 sm:flex-row sm:items-center sm:p-6">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/20 text-3xl" aria-hidden="true">🔁</span>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-extrabold">
            <Localized value={due ? REVIEW.dueCount(due) : REVIEW.allCaughtUp} />
          </h2>
          <p className="mt-0.5 text-sm text-white/90">
            {due ? (
              <Localized value={REVIEW.sub} />
            ) : (
              summary.nextDueAt && <Localized value={REVIEW.nextOn(dayLabel(summary.nextDueAt))} />
            )}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          {due > 0 && (
            <Link to="/revise" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-5 font-bold text-emerald-700 hover:bg-emerald-50">
              <Localized value={REVIEW.start} />
              <ArrowRightIcon />
            </Link>
          )}
          <Link to="/mistakes" className="inline-flex min-h-11 items-center rounded-xl bg-white/15 px-4 font-semibold ring-1 ring-white/30 hover:bg-white/25">
            📒 <Localized value={REVIEW.notebook} />
            {summary.mistakesActive > 0 && <span className="ml-1.5 tabular-nums opacity-90">({summary.mistakesActive})</span>}
          </Link>
        </div>
      </div>
    </section>
  );
}

import { memo } from 'react';
import { useStudyProgress } from '../../hooks/useStudyProgress';
import { UI } from '../../lib/i18n';
import { Localized } from './Localized';
import LanguageSwitcher from './LanguageSwitcher';
import { CheckIcon, FlameIcon } from './icons';
import Breadcrumbs from '../navigation/Breadcrumbs';

function GoalRing({ value, goal }) {
  const r = 9;
  const c = 2 * Math.PI * r;
  const ratio = Math.min(1, goal > 0 ? value / goal : 0);
  const done = ratio >= 1;
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" className="-rotate-90">
      <circle cx="12" cy="12" r={r} fill="none" strokeWidth="3" className="stroke-slate-200 dark:stroke-slate-700" />
      <circle
        cx="12"
        cy="12"
        r={r}
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={c * (1 - ratio)}
        className={`transition-[stroke-dashoffset] duration-500 motion-reduce:transition-none ${done ? 'stroke-emerald-500' : 'stroke-indigo-500'}`}
      />
    </svg>
  );
}

/**
 * Attempted-today ring + streak flame. Subscribes to progress on its own so
 * an answered question re-renders this chip, not the whole hub.
 * Pass `progress` to show server-side numbers instead of on-device ones.
 */
const ProgressStats = memo(function ProgressStats({ progress }) {
  const local = useStudyProgress();
  const { attemptedToday, dailyGoal, streak, activeToday } = { ...local, ...progress };
  const goalReached = attemptedToday >= dailyGoal;

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      <div
        className="flex items-center gap-1.5 rounded-full bg-slate-100 py-1 pl-1 pr-2.5 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200"
        aria-live="polite"
      >
        {goalReached ? (
          <span className="grid size-6 place-items-center rounded-full bg-emerald-500 text-white">
            <CheckIcon width={14} height={14} strokeWidth={3} />
          </span>
        ) : (
          <GoalRing value={attemptedToday} goal={dailyGoal} />
        )}
        <span className="tabular-nums">
          {attemptedToday}
          <span className="font-normal text-slate-400">/{dailyGoal}</span>
        </span>
        <Localized value={goalReached ? UI.goalReached : UI.attemptedToday} className="hidden font-normal text-slate-500 sm:inline dark:text-slate-400" />
      </div>

      <div
        className={`flex items-center gap-1 rounded-full py-1 pl-1.5 pr-2.5 text-xs font-semibold ${
          activeToday
            ? 'bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300'
            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
        }`}
      >
        <FlameIcon width={16} height={16} className={activeToday ? 'fill-amber-400 stroke-amber-600' : ''} />
        <span className="tabular-nums">{streak}</span>
        <Localized value={UI.dayStreak} className="hidden font-normal sm:inline" />
        {!activeToday && streak > 0 && (
          // Loss aversion: the strongest return-tomorrow nudge we can show.
          <span className="sr-only">
            <Localized value={UI.keepStreak} />
          </span>
        )}
      </div>
    </div>
  );
});

/**
 * breadcrumb = { root?, category, subject, topic }, each { code, name, href? }.
 * Parts with an href link back to that funnel step.
 */
function toItems(breadcrumb) {
  return ['root', 'category', 'subject', 'topic']
    .map((k) => breadcrumb[k] && { key: k, name: breadcrumb[k].name, to: breadcrumb[k].href })
    .filter(Boolean);
}

/**
 * Sticky bar under the site header: Category > Subject > Topic, today's
 * progress, streak, language. Sign-in lives in the site header above it.
 */
const QuickNavBar = memo(function QuickNavBar({ breadcrumb, progress }) {
  return (
    <header
      data-sticky-top
      className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/85 pt-[env(safe-area-inset-top)] backdrop-blur-md supports-[backdrop-filter]:bg-white/70 dark:border-slate-800 dark:bg-slate-950/85 dark:supports-[backdrop-filter]:bg-slate-950/70"
    >
      <div className="mx-auto flex max-w-3xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5">
        <div className="min-w-0 basis-full overflow-hidden">
          <Breadcrumbs items={toItems(breadcrumb)} />
        </div>
        <ProgressStats progress={progress} />
        <div className="ml-auto flex items-center gap-2">
          <LanguageSwitcher />
        </div>
      </div>
    </header>
  );
});

export default QuickNavBar;

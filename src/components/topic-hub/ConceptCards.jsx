import { memo } from 'react';
import { savesSeconds } from '../../lib/i18n';
import { Localized, Tex } from './Localized';
import { AlertIcon } from './icons';

/** Formula label, display equation, variable legend and a short note. */
export const FormulaCard = memo(function FormulaCard({ formula }) {
  return (
    <article data-scroll-anchor className="rounded-xl bg-slate-50 p-3.5 ring-1 ring-slate-200/70 dark:bg-slate-800/50 dark:ring-slate-700/60">
      <Localized value={formula.label} as="h3" className="text-sm font-semibold text-slate-700 dark:text-slate-200" />
      <div className="formula-display my-2 text-slate-900 dark:text-white">
        <Tex latex={formula.latex} display />
      </div>
      {formula.variables?.length > 0 && (
        <dl className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          {formula.variables.map((v) => (
            <div key={v.symbol} className="flex items-baseline gap-1">
              <dt>
                <Tex latex={v.symbol} />
              </dt>
              <dd>
                = <Localized value={v.meaning} />
              </dd>
            </div>
          ))}
        </dl>
      )}
      {formula.explanation && (
        <Localized value={formula.explanation} as="div" markdown className="mt-2 text-sm text-slate-600 dark:text-slate-300" />
      )}
    </article>
  );
});

export const RuleCard = memo(function RuleCard({ rule }) {
  return (
    <article data-scroll-anchor className="border-l-2 border-indigo-300 pl-3 dark:border-indigo-500/60">
      <Localized value={rule.title} as="h4" markdown inline className="text-sm font-semibold text-slate-800 dark:text-slate-100" />
      <Localized value={rule.body} as="div" markdown className="mt-1 text-sm text-slate-600 dark:text-slate-300" />
    </article>
  );
});

export const TrickCard = memo(function TrickCard({ trick, index }) {
  return (
    <article data-scroll-anchor className="flex gap-3">
      <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-amber-100 text-xs font-bold tabular-nums text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
        {index + 1}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <Localized value={trick.title} as="h3" markdown inline className="text-sm font-semibold text-slate-800 dark:text-slate-100" />
          {trick.approxTimeSavedSec > 0 && (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
              <Localized value={savesSeconds(trick.approxTimeSavedSec)} />
            </span>
          )}
        </div>
        <Localized value={trick.body} as="div" markdown className="mt-1 text-sm text-slate-600 dark:text-slate-300" />
      </div>
    </article>
  );
});

export const PitfallItem = memo(function PitfallItem({ trap }) {
  return (
    <li data-scroll-anchor className="flex gap-3 rounded-xl bg-rose-50/60 p-3 ring-1 ring-rose-100 dark:bg-rose-500/5 dark:ring-rose-500/20">
      <AlertIcon width={18} height={18} className="mt-0.5 shrink-0 text-rose-500" />
      <Localized value={trap} as="div" markdown className="min-w-0 flex-1 text-sm text-slate-700 dark:text-slate-300" />
    </li>
  );
});

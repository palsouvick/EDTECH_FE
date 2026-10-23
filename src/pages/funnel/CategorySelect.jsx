import { useSyncExternalStore } from 'react';
import { Link } from 'react-router-dom';
import { useDataSource } from '../../app/DataSourceContext';
import { useLanguagePreference } from '../../hooks/useLanguagePreference';
import { useResource } from '../../hooks/useResource';
import { FUNNEL, questionsCount } from '../../lib/i18n';
import { lastVisitedStore } from '../../lib/lastVisited';
import { paths } from '../../lib/routes';
import { Localized } from '../../components/topic-hub/Localized';
import { ArrowRightIcon } from '../../components/topic-hub/icons';
import FunnelLayout, { CardGridSkeleton, LoadError } from './FunnelLayout';

// One accent per category, so it stays recognisable through the funnel.
export const CATEGORY_ACCENTS = {
  SSC: { bar: 'bg-indigo-500', chip: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-300', ring: 'hover:ring-indigo-300 dark:hover:ring-indigo-500/50' },
  BANK: { bar: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300', ring: 'hover:ring-emerald-300 dark:hover:ring-emerald-500/50' },
  WBPSC: { bar: 'bg-amber-500', chip: 'bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300', ring: 'hover:ring-amber-300 dark:hover:ring-amber-500/50' },
  WB_POST: { bar: 'bg-rose-500', chip: 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300', ring: 'hover:ring-rose-300 dark:hover:ring-rose-500/50' },
};
const accentFor = (code) => CATEGORY_ACCENTS[code] ?? CATEGORY_ACCENTS.SSC;

function ContinueCard() {
  const last = useSyncExternalStore(lastVisitedStore.subscribe, lastVisitedStore.get, lastVisitedStore.get);
  if (!last) return null;
  return (
    <Link
      to={paths.topic(last.category, last.subject, last.topic)}
      className="mb-6 flex items-center gap-3 rounded-2xl bg-indigo-600 p-4 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
    >
      <div className="min-w-0 flex-1">
        <Localized value={FUNNEL.continueTitle} as="p" className="text-xs font-semibold uppercase tracking-wider text-indigo-100" />
        <p className="mt-0.5 truncate font-semibold">
          <Localized value={last.names.category} /> › <Localized value={last.names.subject} /> › <Localized value={last.names.topic} />
        </p>
      </div>
      <ArrowRightIcon className="shrink-0" />
    </Link>
  );
}

/** Step 1: SSC · Banking · WBPSC · WB Post Office. Selecting one opens /exams/:category. */
export default function CategorySelect() {
  const source = useDataSource();
  const { lang } = useLanguagePreference();
  const res = useResource(`categories:${lang}`, () => source.listCategories(lang));
  const data = res.data ?? res.staleData;

  return (
    <FunnelLayout
      step={1}
      crumbs={[{ key: 'exams', name: FUNNEL.exams }]}
      title={FUNNEL.chooseExam}
      subtitle={<Localized value={FUNNEL.chooseExamHint} />}
    >
      <ContinueCard />
      {res.status === 'error' && !data ? (
        <LoadError error={res.error} onRetry={res.retry} />
      ) : !data ? (
        <CardGridSkeleton count={4} height="h-44" />
      ) : data.categories.length === 0 ? (
        <Localized value={FUNNEL.noCategories} as="p" className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500 dark:border-slate-700" />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {data.categories.map((c) => {
            const accent = accentFor(c.code);
            return (
              <li key={c.code}>
                <Link
                  to={paths.category(c.code)}
                  className={`group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white p-5 pt-6 shadow-sm ring-1 ring-slate-200 transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:bg-slate-900 dark:ring-slate-800 ${accent.ring}`}
                >
                  <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-1.5 ${accent.bar}`} />
                  <Localized value={c.name} as="h2" className="text-xl font-bold text-slate-900 dark:text-white" />
                  {c.conductingBody && (
                    <Localized value={c.conductingBody} as="p" className="mt-0.5 text-sm text-slate-500 dark:text-slate-400" />
                  )}
                  <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Exams">
                    {c.exams.map((e) => (
                      <li key={e.code} className={`rounded-md px-2 py-0.5 text-xs font-semibold ${accent.chip}`}>
                        <Localized value={e.name} />
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto flex items-center justify-between pt-5 text-sm">
                    <Localized value={questionsCount(c.questionCount)} className="font-medium tabular-nums text-slate-600 dark:text-slate-300" />
                    <ArrowRightIcon className="text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-indigo-600 motion-reduce:transition-none dark:group-hover:text-indigo-400" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </FunnelLayout>
  );
}

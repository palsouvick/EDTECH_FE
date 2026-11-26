import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDataSource } from '../../app/DataSourceContext';
import { DRILL, GK } from '../../lib/gkCopy';
import { Localized } from '../topic-hub/Localized';

export const gkDrillPath = (id) => `/learn/gk/drill/${id}`;

function DrillCard({ d }) {
  return (
    <li>
      <Link to={gkDrillPath(d.id)} className="flex h-full flex-col rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 hover:ring-indigo-300 dark:bg-slate-900 dark:ring-slate-800 dark:hover:ring-indigo-500/50">
        <Localized value={d.title} className="font-bold text-slate-900 dark:text-white" />
        <Localized value={d.intro} as="span" className="mt-1 text-sm text-slate-600 dark:text-slate-300" />
        <Localized value={GK.questions(d.questionCount)} as="span" className="mt-auto pt-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300" />
      </Link>
    </li>
  );
}

const grid = 'mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3';

/**
 * GK dashboard section: the confusion drills, in sections (current affairs, polity, history…),
 * each section with a mixed test across its drills. Hidden until at least one drill has
 * published questions. Drills without a section are listed at the end.
 */
export default function GkDrills({ className = '' }) {
  const source = useDataSource();
  const [data, setData] = useState({ drills: [], groups: [] });
  useEffect(() => {
    let live = true;
    source.getGkDrills?.().then((d) => live && setData({ drills: d?.drills ?? [], groups: d?.groups ?? [] })).catch(() => {});
    return () => {
      live = false;
    };
  }, [source]);
  const { drills, groups } = data;
  if (!drills.length) return null;
  const known = new Set(groups.map((g) => g.id));
  const loose = drills.filter((d) => !known.has(d.group));
  return (
    <section aria-labelledby="gk-drills" className={className}>
      <h2 id="gk-drills" className="text-xl font-extrabold text-slate-900 dark:text-white"><Localized value={DRILL.title} /></h2>
      <Localized value={DRILL.sub} as="p" className="mt-1 max-w-3xl text-sm text-slate-600 dark:text-slate-300" />
      {groups.map((g) => (
        <section key={g.id} aria-labelledby={`gk-drills-${g.id}`} className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2 dark:border-slate-800">
            <h3 id={`gk-drills-${g.id}`} className="text-base font-bold text-slate-900 dark:text-white">
              <Localized value={g.title} />
              <Localized value={DRILL.drillCount(g.drillCount)} className="ml-2 text-xs font-semibold text-slate-500 dark:text-slate-400" />
            </h3>
            {g.drillCount > 1 && (
              <Link to={gkDrillPath(g.mixId)} className="inline-flex min-h-9 items-center rounded-lg bg-indigo-600 px-3 text-xs font-semibold text-white hover:bg-indigo-500">
                📝 <Localized value={DRILL.mixTestOf(g.questionCount)} className="ml-1" />
              </Link>
            )}
          </div>
          <ul className={grid}>
            {drills.filter((d) => d.group === g.id).map((d) => <DrillCard key={d.id} d={d} />)}
          </ul>
        </section>
      ))}
      {loose.length > 0 && <ul className={groups.length ? `${grid} mt-6` : grid}>{loose.map((d) => <DrillCard key={d.id} d={d} />)}</ul>}
    </section>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDataSource } from '../../app/DataSourceContext';
import { DRILL, GK } from '../../lib/gkCopy';
import { Localized } from '../topic-hub/Localized';

export const gkDrillPath = (id) => `/learn/gk/drill/${id}`;

/**
 * GK dashboard section: the confusion drills (look-alike symbols, detective and creator, pen
 * name and writer). Hidden until at least one drill has published questions.
 */
export default function GkDrills({ className = '' }) {
  const source = useDataSource();
  const [drills, setDrills] = useState([]);
  useEffect(() => {
    let live = true;
    source.getGkDrills?.().then((d) => live && setDrills(d?.drills ?? [])).catch(() => {});
    return () => {
      live = false;
    };
  }, [source]);
  if (!drills.length) return null;
  return (
    <section aria-labelledby="gk-drills" className={className}>
      <h2 id="gk-drills" className="text-xl font-extrabold text-slate-900 dark:text-white"><Localized value={DRILL.title} /></h2>
      <Localized value={DRILL.sub} as="p" className="mt-1 max-w-3xl text-sm text-slate-600 dark:text-slate-300" />
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {drills.map((d) => (
          <li key={d.id}>
            <Link to={gkDrillPath(d.id)} className="flex h-full flex-col rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 hover:ring-indigo-300 dark:bg-slate-900 dark:ring-slate-800 dark:hover:ring-indigo-500/50">
              <Localized value={d.title} className="font-bold text-slate-900 dark:text-white" />
              <Localized value={d.intro} as="span" className="mt-1 text-sm text-slate-600 dark:text-slate-300" />
              <Localized value={GK.questions(d.questionCount)} as="span" className="mt-auto pt-2 text-xs font-semibold text-indigo-700 dark:text-indigo-300" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

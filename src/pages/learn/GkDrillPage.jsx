import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDataSource } from '../../app/DataSourceContext';
import { DRILL } from '../../lib/gkCopy';
import PageShell from '../../components/navigation/PageShell';
import PracticeArena from '../../components/practice/PracticeArena';
import { Localized } from '../../components/topic-hub/Localized';
import { gkTopicPath } from './GkChapterPage';

const box = 'rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5 dark:bg-slate-900 dark:ring-slate-800';

/**
 * /learn/gk/drill/:id: one confusion drill. Questions from all its facts, mixed, so P and K
 * (or Feluda and Byomkesh) are asked next to each other. Below: links to the topics it draws on.
 */
export default function GkDrillPage() {
  const { id } = useParams();
  const source = useDataSource();
  const [drill, setDrill] = useState(undefined);
  const [running, setRunning] = useState(false);
  const practice = useMemo(() => (running ? source.gkDrillPracticeSource(id) : null), [running, source, id]);

  useEffect(() => {
    let live = true;
    source.getGkDrills().then((d) => live && setDrill(d.drills.find((x) => x.id === id) ?? null)).catch(() => live && setDrill(null));
    return () => {
      live = false;
    };
  }, [source, id]);

  return (
    <PageShell className="max-w-4xl pb-16 pt-6 sm:pt-8">
      <Link to="/learn/gk" className="inline-flex min-h-10 items-center text-sm font-semibold text-indigo-700 hover:underline dark:text-indigo-300">← <Localized value={DRILL.back} className="ml-1" /></Link>
      {drill === undefined && <p aria-busy="true" className="mt-4 h-32 animate-pulse rounded-2xl bg-slate-200/60 dark:bg-slate-800" />}
      {drill === null && <Localized value={DRILL.notFound} as="p" className={`${box} mt-4 text-slate-700 dark:text-slate-200`} />}
      {drill && (
        <div className="mt-2 space-y-4">
          <header>
            <Localized value={drill.title} as="h1" className="text-2xl font-extrabold text-slate-900 sm:text-3xl dark:text-white" />
            <Localized value={drill.intro} as="p" className="mt-2 text-slate-600 dark:text-slate-300" />
          </header>
          <section className={box}>
            {running ? (
              <PracticeArena source={practice} topicName={drill.title} initialGoal={drill.questionCount} />
            ) : (
              <>
                <Localized value={DRILL.tip} as="p" className="text-sm text-slate-600 dark:text-slate-300" />
                <button type="button" onClick={() => setRunning(true)} className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-500">
                  <Localized value={DRILL.start} />
                </button>
              </>
            )}
          </section>
          <section className={box}>
            <Localized value={DRILL.topics} as="h2" className="text-lg font-bold text-slate-900 dark:text-white" />
            <ul className="mt-2 flex flex-wrap gap-2">
              {drill.facts.map((f) => (
                <li key={f.code}>
                  <Link to={gkTopicPath(f.code)} className="inline-flex min-h-10 items-center rounded-lg bg-indigo-50 px-3 text-sm font-semibold text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300"><Localized value={f.title} /></Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      )}
    </PageShell>
  );
}

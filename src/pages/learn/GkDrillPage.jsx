import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDataSource } from '../../app/DataSourceContext';
import { DRILL, GK } from '../../lib/gkCopy';
import PageShell from '../../components/navigation/PageShell';
import PracticeArena from '../../components/practice/PracticeArena';
import { Localized } from '../../components/topic-hub/Localized';
import { gkTopicPath } from './GkChapterPage';

const box = 'rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6 dark:bg-slate-900 dark:ring-slate-800';
const bnDigits = (n) => String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[d]);
const STEP_TONES = ['bg-indigo-600', 'bg-emerald-600', 'bg-amber-600'];

function Stat({ icon, value }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white ring-1 ring-white/25 backdrop-blur-sm">
      <span aria-hidden="true">{icon}</span>
      <Localized value={value} />
    </span>
  );
}

/**
 * /learn/gk/drill/:id: one confusion drill. Questions from all its facts, mixed, so P and K
 * (or Feluda and Byomkesh) are asked next to each other. Below: links to the topics it draws on.
 */
/** A section's mixed test (id "mix_<group>"): all drills of that section as one drill, or null. */
function sectionDrill(list, id) {
  const g = (list.groups ?? []).find((x) => x.mixId === id);
  if (!g) return null;
  const members = list.drills.filter((d) => d.group === g.id);
  const facts = [...new Map(members.flatMap((d) => d.facts).map((f) => [f.code, f])).values()];
  return { id, title: g.title, intro: DRILL.mixIntro(members.length), questionCount: g.questionCount, facts };
}

export default function GkDrillPage() {
  const { id } = useParams();
  const source = useDataSource();
  const [drill, setDrill] = useState(undefined);
  const [running, setRunning] = useState(false);
  const practice = useMemo(() => (running ? source.gkDrillPracticeSource(id) : null), [running, source, id]);

  useEffect(() => {
    let live = true;
    source.getGkDrills().then((d) => live && setDrill(d.drills.find((x) => x.id === id) ?? sectionDrill(d, id))).catch(() => live && setDrill(null));
    return () => {
      live = false;
    };
  }, [source, id]);

  return (
    <PageShell className="max-w-4xl pb-16 pt-6 sm:pt-8">
      <Link to="/learn/gk" className="inline-flex min-h-10 items-center text-sm font-semibold text-indigo-700 hover:underline dark:text-indigo-300">← <Localized value={DRILL.back} className="ml-1" /></Link>
      {drill === undefined && <p aria-busy="true" className="mt-4 h-48 animate-pulse rounded-3xl bg-slate-200/60 dark:bg-slate-800" />}
      {drill === null && <Localized value={DRILL.notFound} as="p" className={`${box} mt-4 text-slate-700 dark:text-slate-200`} />}
      {drill && (
        <div className="mt-2 space-y-5">
          <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-5 text-white shadow-lg shadow-indigo-500/20 sm:p-8">
            <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 size-48 rounded-full bg-white/10" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 right-16 size-40 rounded-full bg-white/5" />
            <div className="relative">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-300 px-3 py-1 text-xs font-bold text-amber-950">
                <span aria-hidden="true">⚡</span>
                <Localized value={DRILL.badge} />
              </span>
              <Localized value={drill.title} as="h1" className="mt-3 text-2xl font-extrabold tracking-tight sm:text-4xl" />
              <Localized value={drill.intro} as="p" className="mt-2 max-w-2xl text-sm leading-relaxed text-indigo-50 sm:text-base" />
              <div className="mt-4 flex flex-wrap gap-2">
                <Stat icon="📝" value={GK.questions(drill.questionCount)} />
                <Stat icon="📚" value={DRILL.topicCount(drill.facts.length)} />
                <Stat icon="🔁" value={DRILL.bothWays} />
              </div>
            </div>
          </header>

          <section className={box}>
            {running ? (
              <PracticeArena source={practice} topicName={drill.title} initialGoal={drill.questionCount} />
            ) : (
              <div className="grid gap-6 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <Localized value={DRILL.how} as="h2" className="text-lg font-bold text-slate-900 dark:text-white" />
                  <ol className="mt-3 space-y-3">
                    {DRILL.steps.map((s, i) => (
                      <li key={i} className="flex gap-3">
                        <span aria-hidden="true" className={`grid size-7 shrink-0 place-items-center rounded-full text-sm font-bold text-white ${STEP_TONES[i % STEP_TONES.length]}`}>{i + 1}</span>
                        <Localized value={s} className="pt-0.5 text-sm text-slate-700 dark:text-slate-200" />
                      </li>
                    ))}
                  </ol>
                  <p className="mt-4 flex gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-950 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-100 dark:ring-amber-500/30">
                    <span aria-hidden="true">💡</span>
                    <Localized value={DRILL.tip} />
                  </p>
                </div>
                <button type="button" onClick={() => setRunning(true)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 text-base font-bold text-white shadow-md shadow-indigo-500/30 transition hover:-translate-y-0.5 hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">
                  <Localized value={DRILL.start} />
                  <span aria-hidden="true">→</span>
                </button>
              </div>
            )}
          </section>

          <section className={box}>
            <div className="flex items-baseline justify-between gap-3">
              <Localized value={DRILL.topics} as="h2" className="text-lg font-bold text-slate-900 dark:text-white" />
              <Localized value={DRILL.topicCount(drill.facts.length)} className="text-xs font-semibold text-slate-500 dark:text-slate-400" />
            </div>
            <ol className="mt-3 grid gap-2 sm:grid-cols-2">
              {drill.facts.map((f, i) => (
                <li key={f.code}>
                  <Link to={gkTopicPath(f.code)} className="group flex min-h-14 items-center gap-3 rounded-xl p-3 ring-1 ring-slate-200 transition hover:bg-indigo-50 hover:ring-indigo-300 dark:ring-slate-700 dark:hover:bg-indigo-500/10">
                    <span aria-hidden="true" className="grid size-8 shrink-0 place-items-center rounded-lg bg-indigo-100 text-sm font-bold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200">
                      <Localized value={{ en: String(i + 1), bn: bnDigits(i + 1) }} />
                    </span>
                    <Localized value={f.title} className="min-w-0 flex-1 text-sm font-semibold text-slate-800 group-hover:text-indigo-800 dark:text-slate-100 dark:group-hover:text-indigo-200" />
                    <span aria-hidden="true" className="text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-indigo-600">›</span>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        </div>
      )}
    </PageShell>
  );
}

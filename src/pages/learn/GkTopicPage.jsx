import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDataSource } from '../../app/DataSourceContext';
import { GK, PACK } from '../../lib/gkCopy';
import PageShell from '../../components/navigation/PageShell';
import PracticeArena from '../../components/practice/PracticeArena';
import PyqBadge from '../../components/practice/PyqBadge';
import { Localized } from '../../components/topic-hub/Localized';
import { CardGridSkeleton, LoadError } from '../funnel/FunnelLayout';
import { gkCardPath } from './GkDashboardPage';
import { FactActions, gkTopicPath } from './GkChapterPage';

const box = 'rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5 dark:bg-slate-900 dark:ring-slate-800';
const bnDigits = (n) => String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[d]);

/** "-261" → "c. 261 BCE"; "1526" → "1526"; full dates shown as given. Bengali: খ্রিস্টপূর্ব. */
function milestoneDate(d) {
  if (/^-\d+$/.test(d)) return { en: `${d.slice(1)} BCE`, bn: `খ্রিস্টপূর্ব ${bnDigits(d.slice(1))}` };
  return { en: d, bn: bnDigits(d) };
}

function Section({ title, children, tone = box }) {
  return (
    <section className={tone}>
      <Localized value={title} as="h2" className="text-lg font-bold text-slate-900 dark:text-white" />
      <div className="mt-2">{children}</div>
    </section>
  );
}

function RelatedFacts({ codes }) {
  const source = useDataSource();
  const [facts, setFacts] = useState([]);
  useEffect(() => {
    let live = true;
    Promise.allSettled(codes.map((c) => source.getGkFact(c))).then((rs) => live && setFacts(rs.filter((r) => r.status === 'fulfilled').map((r) => r.value)));
    return () => {
      live = false;
    };
  }, [source, codes]);
  if (!facts.length) return null;
  return (
    <Section title={PACK.related}>
      <ul className="space-y-2">
        {facts.map((f) => (
          <li key={f.code} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
            <Link to={gkTopicPath(f.code)} className="font-semibold text-indigo-700 hover:underline dark:text-indigo-300"><Localized value={f.title} /></Link>
            <Localized value={f.statement} markdown as="div" className="mt-1 text-sm text-slate-700 dark:text-slate-200" />
          </li>
        ))}
      </ul>
    </Section>
  );
}

function RelatedPyqs({ code }) {
  const source = useDataSource();
  const [state, setState] = useState({ status: 'loading' });
  const [running, setRunning] = useState(false);
  const practice = useMemo(() => (running ? source.pyqPracticeSource({ pack: code }) : null), [running, source, code]);
  useEffect(() => {
    let live = true;
    source.getGkFactPyqs(code).then((data) => live && setState({ status: 'ready', data }), (error) => live && setState({ status: 'error', error }));
    return () => {
      live = false;
    };
  }, [source, code]);
  if (state.status !== 'ready') return null;
  const { total, questions } = state.data;
  return (
    <Section title={PACK.pyqs}>
      {total === 0 ? (
        <Localized value={PACK.pyqsNone} as="p" className="text-sm text-slate-600 dark:text-slate-300" />
      ) : running ? (
        <PracticeArena source={practice} topicName={PACK.pyqs} />
      ) : (
        <>
          <Localized value={PACK.pyqsCount(total)} as="p" className="text-sm font-semibold text-slate-700 dark:text-slate-200" />
          <ul className="mt-2 space-y-2">
            {questions.slice(0, 5).map((q) => (
              <li key={q.questionId} className="rounded-xl p-3 ring-1 ring-slate-200 dark:ring-slate-800">
                <div className="mb-1 flex flex-wrap gap-2"><PyqBadge refs={q.pyq} /></div>
                <Localized value={q.stem} markdown as="div" className="text-sm text-slate-800 dark:text-slate-100" />
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => setRunning(true)} className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-amber-500 px-4 text-sm font-bold text-white hover:bg-amber-400">
            🏆 <Localized value={PACK.practisePyqs} className="ml-1" />
          </button>
        </>
      )}
    </Section>
  );
}

function PracticeMcqs({ code, title, count }) {
  const source = useDataSource();
  const [running, setRunning] = useState(false);
  const practice = useMemo(() => (running ? source.gkFactPracticeSource(code) : null), [running, source, code]);
  if (!count) return null;
  return (
    <Section title={PACK.practise}>
      {running ? (
        <PracticeArena source={practice} topicName={title} initialGoal={count} />
      ) : (
        <>
          <Localized value={GK.questions(count)} as="p" className="text-sm text-slate-600 dark:text-slate-300" />
          <button type="button" onClick={() => setRunning(true)} className="mt-2 inline-flex min-h-11 items-center rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-500">
            <Localized value={PACK.practiseStart} />
          </button>
        </>
      )}
    </Section>
  );
}

/**
 * /learn/gk/topic/:code: one topic in one place. For a topic pack: basic explanation → must
 * remember → dates → comparison table → don't confuse → memory trick → related facts →
 * WBPSC past-paper questions → practice MCQs → quick revision. An ordinary fact shows the
 * same page with the sections it has, plus the topics it connects to.
 */
export default function GkTopicPage() {
  const { code } = useParams();
  const source = useDataSource();
  const [state, setState] = useState({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let live = true;
    setState({ status: 'loading' });
    source.getGkFact(code).then((fact) => live && setState({ status: 'ready', fact }), (error) => live && setState({ status: 'error', error }));
    return () => {
      live = false;
    };
  }, [source, code, attempt]);

  const fact = state.fact;
  const p = fact?.pack;

  return (
    <PageShell className="max-w-4xl pb-16 pt-6 sm:pt-8">
      {state.status === 'loading' && <CardGridSkeleton count={2} height="h-40" />}
      {state.status === 'error' && <LoadError error={state.error} onRetry={() => setAttempt((n) => n + 1)} />}
      {fact && (
        <div className="space-y-5">
          <Link to={gkCardPath(fact.topic)} className="inline-flex min-h-10 items-center text-sm font-semibold text-indigo-700 hover:underline dark:text-indigo-300">
            ← <Localized value={PACK.backTo} />
          </Link>
          <header>
            {p && <Localized value={PACK.topicBadge} className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-bold text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-200" />}
            <Localized value={fact.title} as="h1" className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white" />
            <p className="mt-1 flex flex-wrap gap-2 text-xs font-semibold">
              {fact.verification.status === 'VERIFIED' && <span className="text-emerald-700 dark:text-emerald-300">✓ <Localized value={GK.verified} /></span>}
              {fact.bengaliReview !== 'REVIEWED' && <Localized value={GK.bengaliPending} className="text-amber-800 dark:text-amber-300" />}
            </p>
          </header>

          <Section title={PACK.basic}>
            <Localized value={fact.statement} markdown as="div" className="leading-relaxed text-slate-800 dark:text-slate-100" />
            {fact.explanation && (
              <>
                <Localized value={PACK.why} as="p" className="mt-3 text-sm font-semibold text-slate-900 dark:text-white" />
                <Localized value={fact.explanation} markdown as="div" className="mt-1 text-sm leading-relaxed text-slate-700 dark:text-slate-200" />
              </>
            )}
          </Section>

          {p?.mustRemember.length > 0 && (
            <Section title={PACK.mustRemember} tone="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200 sm:p-5 dark:bg-amber-500/10 dark:ring-amber-500/30">
              <ul className="list-disc space-y-1 pl-5 text-amber-950 dark:text-amber-100">{p.mustRemember.map((x, i) => <li key={i}><Localized value={x} markdown /></li>)}</ul>
            </Section>
          )}

          {fact.milestones.length > 0 && (
            <Section title={PACK.timeline}>
              <ol className="relative space-y-3 border-l-2 border-indigo-200 pl-4 dark:border-indigo-500/40">
                {fact.milestones.map((m, i) => (
                  <li key={i}>
                    <Localized value={milestoneDate(m.date)} className="font-bold tabular-nums text-indigo-700 dark:text-indigo-300" />
                    {m.note && <Localized value={m.note} as="p" className="text-sm text-slate-700 dark:text-slate-200" />}
                  </li>
                ))}
              </ol>
            </Section>
          )}

          {p?.table && (
            <Section title={p.table.caption ?? PACK.timeline}>
              <div className="overflow-x-auto rounded-xl ring-1 ring-slate-200 dark:ring-slate-800">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-800/60 dark:text-slate-400">
                    <tr>{p.table.columns.map((c, i) => <th key={i} scope="col" className="px-3 py-2"><Localized value={c} /></th>)}</tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {p.table.rows.map((row, i) => (
                      <tr key={i}>{row.map((cell, j) => <td key={j} className={`px-3 py-2 align-top ${j === 0 ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}><Localized value={cell} markdown inline /></td>)}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Section>
          )}

          {p?.dontConfuse.length > 0 && (
            <Section title={PACK.dontConfuse} tone="rounded-2xl bg-rose-50 p-4 ring-1 ring-rose-200 sm:p-5 dark:bg-rose-500/10 dark:ring-rose-500/30">
              <ul className="space-y-1 text-rose-950 dark:text-rose-100">{p.dontConfuse.map((x, i) => <li key={i}><Localized value={x} markdown /></li>)}</ul>
            </Section>
          )}

          {p?.memoryTrick && (
            <Section title={PACK.memoryTrick} tone="rounded-2xl bg-violet-50 p-4 ring-1 ring-violet-200 sm:p-5 dark:bg-violet-500/10 dark:ring-violet-500/30">
              <Localized value={p.memoryTrick} markdown as="div" className="text-violet-950 dark:text-violet-100" />
            </Section>
          )}

          {p?.related.length > 0 && <RelatedFacts codes={p.related} />}

          {fact.relatedPacks?.length > 0 && (
            <Section title={PACK.alsoLearn}>
              <ul className="flex flex-wrap gap-2">
                {fact.relatedPacks.map((r) => (
                  <li key={r.code}><Link to={gkTopicPath(r.code)} className="inline-flex min-h-10 items-center rounded-lg bg-indigo-50 px-3 text-sm font-semibold text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300">📚 <Localized value={r.title} /></Link></li>
                ))}
              </ul>
            </Section>
          )}

          {p?.hasPyqTerms && <RelatedPyqs code={fact.code} />}
          <PracticeMcqs code={fact.code} title={fact.title} count={fact.questionCount} />

          <Section title={PACK.revision}>
            {fact.mine ? <FactActions fact={fact} onChange={(next) => setState({ status: 'ready', fact: next })} /> : <Localized value={GK.signInForProgress} as="p" className="text-sm text-slate-600 dark:text-slate-300" />}
            <Localized value={GK.sources} as="p" className="mt-3 text-sm font-semibold text-slate-900 dark:text-white" />
            <ul className="mt-1 space-y-1 text-sm">
              {fact.sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline underline-offset-2 dark:text-indigo-400">{s.title}</a>
                  {s.publisher && <span className="text-slate-500"> · {s.publisher}</span>}
                </li>
              ))}
            </ul>
          </Section>
        </div>
      )}
    </PageShell>
  );
}

import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';
import { useDataSource } from '../app/DataSourceContext';
import { loginPath } from '../components/auth/AccountButton';
import PageShell from '../components/navigation/PageShell';
import { OPTION_LETTERS } from '../components/practice/OptionButton';
import AnswerExplanation from '../components/review/AnswerExplanation';
import { Localized } from '../components/topic-hub/Localized';
import { GapCard, PracticeLauncher, StartError, btn, useStartStuckPractice } from '../components/stuck/StuckParts';
import { STUCK } from '../lib/i18n';
import { learnPaths, paths } from '../lib/routes';
import { SP } from '../lib/stuckCopy';
import { CardGridSkeleton, LoadError } from './funnel/FunnelLayout';

const card = 'rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6 dark:bg-slate-900 dark:ring-slate-800';
const h2 = 'text-lg font-extrabold text-slate-900 dark:text-white';
const OUTCOME_TONE = {
  CORRECT: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300',
  INCORRECT: 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300',
  UNATTEMPTED: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  TIMED_OUT: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

function Stat({ label, value, tone = 'text-slate-900 dark:text-white' }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      <Localized value={label} as="p" className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400" />
      <p className={`mt-1 text-3xl font-extrabold tabular-nums ${tone}`}>{value}</p>
    </div>
  );
}

/** The pattern's learning content: how to spot it, formula, method, worked example, trap. */
function ConceptBox({ concept }) {
  if (!concept) return null;
  return (
    <div className="rounded-xl bg-violet-50 p-4 text-sm ring-1 ring-violet-200 dark:bg-violet-500/10 dark:ring-violet-500/30">
      <Localized value={SP.conceptInvolved} as="p" className="text-xs font-bold uppercase tracking-wide text-violet-700 dark:text-violet-300" />
      <p className="mt-0.5 font-bold text-slate-900 dark:text-white">
        {concept.emoji && <span aria-hidden="true">{concept.emoji} </span>}
        <Localized value={concept.name} markdown inline />
      </p>
      {concept.spot && (
        <div className="mt-2">
          <Localized value={SP.howToSpot} as="p" className="font-semibold text-violet-900 dark:text-violet-200" />
          <Localized value={concept.spot} markdown as="div" />
        </div>
      )}
      {concept.formula && (
        <div className="mt-2">
          <Localized value={SP.formula} as="p" className="font-semibold text-violet-900 dark:text-violet-200" />
          <Localized value={concept.formula} markdown as="div" />
        </div>
      )}
      {concept.method?.length > 0 && (
        <div className="mt-2">
          <Localized value={SP.method} as="p" className="font-semibold text-violet-900 dark:text-violet-200" />
          <ol className="mt-1 list-decimal space-y-1 pl-5">
            {concept.method.map((m, i) => (
              <li key={i}><Localized value={m} markdown inline /></li>
            ))}
          </ol>
        </div>
      )}
      {concept.example && (
        <div className="mt-2 rounded-lg bg-white/70 p-3 dark:bg-slate-900/60">
          <Localized value={SP.workedExample} as="p" className="font-semibold text-violet-900 dark:text-violet-200" />
          <Localized value={concept.example.question} markdown as="div" className="mt-1 font-medium" />
          <ol className="mt-1 list-decimal space-y-1 pl-5">
            {(concept.example.steps ?? []).map((s, i) => (
              <li key={i}><Localized value={s} markdown inline /></li>
            ))}
          </ol>
          {concept.example.answer && <Localized value={concept.example.answer} markdown as="div" className="mt-1 font-bold" />}
        </div>
      )}
      {concept.trap && (
        <div className="mt-2">
          <Localized value={SP.trap} as="p" className="font-semibold text-rose-800 dark:text-rose-300" />
          <Localized value={concept.trap} markdown as="div" />
        </div>
      )}
    </div>
  );
}

function ProblemCard({ item, practice }) {
  const [open, setOpen] = useState(false);
  const opts = item.question.options;
  const right = opts.findIndex((o) => o.optionId === item.correctOptionId);
  const reasons = item.reasons?.length ? item.reasons : item.reason ? [item.reason] : [];
  const id = `stuck-${item.questionId}`;
  return (
    <article className={card} data-testid="stuck-problem">
      <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
        <Localized value={item.topicName} className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300" />
        {item.concept?.name && <Localized value={item.concept.name} markdown inline className="rounded-full bg-violet-50 px-2.5 py-0.5 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300" />}
        <Localized value={SP.stuckTimes(item.times)} className={`rounded-full px-2.5 py-0.5 ${item.times >= 2 ? 'bg-amber-500 text-white' : 'bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200'}`} />
        <Localized value={SP.outcome[item.outcome] ?? SP.outcome.UNATTEMPTED} className={`rounded-full px-2.5 py-0.5 ${OUTCOME_TONE[item.outcome] ?? OUTCOME_TONE.UNATTEMPTED}`} />
        <Localized value={SP.revision[item.revision?.status] ?? SP.revision.none} className="ml-auto rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-600 dark:bg-slate-800 dark:text-slate-300" />
      </div>
      <Localized value={item.question.stem} markdown as="div" className="mt-3 font-medium leading-relaxed text-slate-900 dark:text-white" />

      <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-sm dark:bg-amber-500/10">
        <Localized value={SP.whyStuck} className="font-bold text-amber-900 dark:text-amber-200" />:{' '}
        {reasons.length ? (
          reasons.map((r, i) => (
            <span key={r} className="text-amber-900 dark:text-amber-100">
              {i > 0 && ' · '}
              <span aria-hidden="true">{STUCK.reasonIcons[r]} </span>
              <Localized value={STUCK.reasons[r]} />
            </span>
          ))
        ) : (
          <Localized value={SP.noReason} className="text-amber-800 dark:text-amber-200" />
        )}
        <p className="mt-0.5 text-xs text-amber-800/90 dark:text-amber-200/80">
          {item.timeBeforeSec != null && <Localized value={SP.timeBefore(item.timeBeforeSec)} />}
          {item.previousStuckInChapter > 0 && (
            <>
              {item.timeBeforeSec != null && ' · '}
              <Localized value={SP.stuckBefore(item.previousStuckInChapter)} />
            </>
          )}
          {item.later?.answered > 0 && (
            <>
              {' · '}
              <Localized value={SP.later(item.later.correct, item.later.answered)} />
            </>
          )}
        </p>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Link to={learnPaths.chapter('quant', item.topic)} className={`${btn} bg-violet-600 text-white hover:bg-violet-500`}>
          <Localized value={SP.revise} />
        </Link>
        <button
          type="button"
          disabled={Boolean(practice.busy)}
          onClick={() => practice.run(`similar:${item.questionId}`, { mode: 'pattern', count: 5, topics: [item.topic] })}
          className={`${btn} text-indigo-700 ring-1 ring-indigo-300 hover:bg-indigo-50 dark:text-indigo-300 dark:ring-indigo-500/40`}
        >
          <Localized value={practice.busy === `similar:${item.questionId}` ? SP.starting : SP.practiseSimilar(item.similarCount)} />
        </button>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((v) => !v)}
          className={`${btn} text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800`}
        >
          <Localized value={open ? SP.hideSolution : SP.showSolution} />
        </button>
      </div>

      {open && (
        <div id={id} className="mt-4 space-y-3">
          {right >= 0 && (
            <div className="rounded-xl bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-200">
              <Localized value={SP.solution} className="font-bold" />:{' '}
              <span className="font-bold">{OPTION_LETTERS[right]}.</span> <Localized value={opts[right].text} markdown inline />
            </div>
          )}
          <AnswerExplanation steps={item.steps} shortcut={item.shortcut} learn={item.learn} />
          <ConceptBox concept={item.concept} />
        </div>
      )}
    </article>
  );
}

/**
 * /math/stuck — My Stuck Problems: a personal Math learning area built from the "I'm Stuck" button.
 * Totals, stuck by chapter, the probable skill gaps (with evidence), improvement, Practice My
 * Weakness, and every stuck question with its solution, concept and a way to revise and practise.
 */
export default function StuckProblemsPage() {
  const source = useDataSource();
  const location = useLocation();
  const { status: authStatus, user } = useAuth();
  const [state, setState] = useState({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const practice = useStartStuckPractice();

  useEffect(() => {
    if (authStatus !== 'ready' || !user) return undefined;
    let alive = true;
    setState({ status: 'loading' });
    source.getStuckProblems().then(
      (data) => alive && setState({ status: 'ready', data }),
      (error) => alive && setState({ status: 'error', error }),
    );
    return () => {
      alive = false;
    };
  }, [source, authStatus, user, attempt]);

  const d = state.data;
  const topicNames = useMemo(() => new Map((d?.chapters ?? []).map((c) => [c.topic, c.name])), [d]);

  if (authStatus === 'ready' && !user) return <Navigate to={loginPath(location)} replace />;

  return (
    <PageShell className="max-w-4xl space-y-5 pb-16 pt-6 sm:pt-10">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
          <span aria-hidden="true">🧠 </span>
          <Localized value={SP.title} />
        </h1>
        <Localized value={SP.subtitle} as="p" className="mt-1 text-slate-600 dark:text-slate-300" />
        <Localized value={SP.safe} as="p" className="mt-2 inline-block rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200" />
      </header>

      {state.status === 'loading' && <CardGridSkeleton />}
      {state.status === 'error' && <LoadError error={state.error} onRetry={() => setAttempt((n) => n + 1)} />}

      {state.status === 'ready' && d.total === 0 && (
        <section className={`${card} text-center`}>
          <Localized value={SP.emptyTitle} as="h2" className={h2} />
          <Localized value={SP.emptyBody} as="p" className="mx-auto mt-2 max-w-lg text-slate-600 dark:text-slate-300" />
          <Link to={paths.exams()} className={`${btn} mt-4 bg-indigo-600 text-white hover:bg-indigo-500`}>
            <Localized value={SP.startMock} />
          </Link>
        </section>
      )}

      {state.status === 'ready' && d.total > 0 && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label={SP.totalStuck} value={d.total} />
            <Stat label={SP.solvedAfter} value={d.solvedAfterStuck} tone="text-emerald-700 dark:text-emerald-300" />
            <Stat label={SP.wrongAfter} value={d.wrongAfterStuck} tone="text-rose-700 dark:text-rose-300" />
            <Stat label={SP.leftAfter} value={d.leftAfterStuck} />
          </div>

          <section className={card} aria-labelledby="by-chapter-title">
            <h2 id="by-chapter-title" className={h2}><Localized value={SP.byChapter} /></h2>
            <Localized value={SP.whereStruggling} as="p" className="text-sm text-slate-500 dark:text-slate-400" />
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[20rem] text-sm" data-testid="stuck-chapters">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="py-1.5 pr-3 font-semibold"><Localized value={SP.chapter} /></th>
                    <th className="py-1.5 pr-3 text-right font-semibold"><Localized value={SP.stuck} /></th>
                    <th className="py-1.5 pr-3 text-right font-semibold"><Localized value={SP.wrong} /></th>
                    <th className="py-1.5 text-right font-semibold"><Localized value={SP.accuracy} /></th>
                  </tr>
                </thead>
                <tbody>
                  {d.chapters.map((c) => (
                    <tr key={c.topic} className="border-t border-slate-100 dark:border-slate-800">
                      <td className="py-2 pr-3 font-medium text-slate-900 dark:text-white"><Localized value={c.name} /></td>
                      <td className="py-2 pr-3 text-right font-bold tabular-nums text-amber-700 dark:text-amber-300">{c.stuck}</td>
                      <td className="py-2 pr-3 text-right tabular-nums text-rose-700 dark:text-rose-300">{c.wrong}</td>
                      <td className="py-2 text-right tabular-nums">{c.accuracy == null ? '—' : `${c.accuracy}%`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className={card} aria-labelledby="missing-title">
            <h2 id="missing-title" className={h2}>
              <span aria-hidden="true">🔍 </span>
              <Localized value={SP.missingTitle} />
            </h2>
            <Localized value={SP.missingHint} as="p" className="text-sm text-slate-500 dark:text-slate-400" />
            {d.gaps.length === 0 ? (
              <Localized value={SP.noGapYet} as="p" className="mt-3 text-slate-600 dark:text-slate-300" />
            ) : (
              <div className="mt-3 space-y-3">
                {d.gaps.map((g) => (
                  <GapCard
                    key={g.gap}
                    gap={g}
                    topicNames={topicNames}
                    busy={practice.busy}
                    onPractise={(gap) => practice.run(`gap:${gap.gap}`, { mode: gap.practice.mode, count: 10, topics: gap.practice.topic ? [gap.practice.topic] : [] })}
                  />
                ))}
              </div>
            )}
            <StartError error={practice.error} />
          </section>

          <PracticeLauncher next={d.next} gaps={d.gaps} practice={practice} />

          <section className={card} aria-labelledby="improvement-title">
            <h2 id="improvement-title" className={h2}><Localized value={SP.improvementTitle} /></h2>
            {d.improvement.length === 0 ? (
              <Localized value={SP.noImprovementYet} as="p" className="mt-2 text-sm text-slate-600 dark:text-slate-300" />
            ) : (
              <ul className="mt-2 space-y-1">
                {d.improvement.map((i) => (
                  <li key={i.topic} className="text-sm text-slate-800 dark:text-slate-200">
                    {i.before != null ? <Localized value={SP.improvementRow(i.name, i.before, i.now)} /> : <><Localized value={i.name} />: {i.now}%</>}{' '}
                    {i.change != null && (
                      <Localized value={SP.improved(i.change)} className={`font-bold ${i.change >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`} />
                    )}
                  </li>
                ))}
              </ul>
            )}
            {d.quizzes?.length > 0 && (
              <div className="mt-4">
                <Localized value={SP.recentPractice} as="p" className="text-xs font-bold uppercase tracking-wide text-slate-500" />
                <ul className="mt-1 space-y-1 text-sm text-slate-700 dark:text-slate-300">
                  {d.quizzes.map((q) => (
                    <li key={q.sessionId}>
                      <Link to={`/practice/custom/${q.sessionId}`} className="hover:underline">
                        {new Date(q.at).toLocaleDateString()} · <Localized value={SP.modes[q.mode]?.name ?? SP.modes.pattern.name} /> · <Localized value={SP.levels[q.level] ?? SP.levels.basic} /> ·{' '}
                        {q.topics.map((t) => `${t.accuracy}%`).join(' / ')}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section aria-labelledby="problems-title" className="space-y-3">
            <h2 id="problems-title" className={h2}><Localized value={SP.problemsTitle} /></h2>
            {d.items.map((item) => (
              <ProblemCard key={item.questionId} item={item} practice={practice} />
            ))}
            {d.hasMore && <Localized value={SP.more} as="p" className="text-sm text-slate-500" />}
          </section>
        </>
      )}
    </PageShell>
  );
}

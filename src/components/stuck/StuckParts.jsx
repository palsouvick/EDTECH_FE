import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useOptionalDataSource } from '../../app/DataSourceContext';
import { languageStore } from '../../hooks/useLanguagePreference';
import { SP } from '../../lib/stuckCopy';
import { learnPaths } from '../../lib/routes';
import { Localized } from '../topic-hub/Localized';
import { useStartCustomTest } from '../custom-test/useStartCustomTest';

export const STUCK_PATH = '/math/stuck';
export const MODES = ['concept', 'formula', 'calculation', 'method', 'pattern', 'exam', 'mixed'];
export const LEVELS = ['basic', 'moderate', 'exam'];

const card = 'rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6 dark:bg-slate-900 dark:ring-slate-800';
export const btn = 'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-bold disabled:opacity-50';

/** Starts a "Practice My Weakness" quiz (custom test preset 'stuck'); practice mode opens the runner. */
export function useStartStuckPractice() {
  const start = useStartCustomTest();
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const run = useCallback(
    async (key, { mode = 'pattern', level = null, count = 10, topics = [], focusQuestionId = null } = {}) => {
      setBusy(key);
      setError(null);
      try {
        await start({
          subject: 'quant',
          preset: 'stuck',
          stuckMode: mode,
          ...(level && { stuckLevel: level }),
          questionCount: count,
          topics,
          // One stuck question's "Practise similar questions": practise that question's
          // pattern only. Chapter-level practice (GapCard, launcher, next set) sends none.
          ...(focusQuestionId && { focusQuestionId }),
          language: languageStore.get(),
        });
      } catch (e) {
        setError(e);
        setBusy(null);
      }
    },
    [start],
  );
  return { run, busy, error };
}

export function StartError({ error }) {
  if (!error) return null;
  const msg = error.code === 'NO_STUCK_PROBLEMS' ? SP.noStuckForPractice : { en: error.message || 'Could not start the quiz', bn: error.message || 'কুইজ শুরু করা যায়নি' };
  return (
    <div role="alert" className="mt-2 text-sm font-medium text-rose-700 dark:text-rose-300">
      <Localized value={msg} as="p" />
    </div>
  );
}

/** One evidence line of a diagnosis. */
function EvidenceLine({ e }) {
  const v =
    e.kind === 'signals' ? SP.evidenceSignals(e.n, e.of)
      : e.kind === 'stuck' ? SP.evidenceStuck(e.n)
        : e.kind === 'slow' ? SP.evidenceSlow(e.factor)
          : e.kind === 'levels' ? SP.evidenceLevels(e.name ?? e.topic, e.basicPct, e.appliedPct, e.level)
            : null;
  if (!v) return null;
  return <Localized value={v} as="li" />;
}

/** "Possible gap: …" / "High-confidence weakness: …" with its evidence and a practice button. */
export function GapCard({ gap, topicNames, onPractise, busy }) {
  const g = SP.gaps[gap.gap];
  const high = gap.confidence === 'high';
  const evidence = gap.evidence.map((e) => (e.kind === 'levels' ? { ...e, name: topicNames?.get(e.topic) ?? e.topic } : e));
  return (
    <article
      data-testid={`gap-${gap.gap}`}
      className={`rounded-2xl p-4 ring-1 ${high ? 'bg-rose-50 ring-rose-200 dark:bg-rose-500/10 dark:ring-rose-500/30' : 'bg-amber-50 ring-amber-200 dark:bg-amber-500/10 dark:ring-amber-500/30'}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span aria-hidden="true" className="text-xl">{g.emoji}</span>
        <Localized value={high ? SP.highLabel(g.name) : SP.possibleLabel(g.name)} as="h3" className="font-extrabold text-slate-900 dark:text-white" />
        <Localized value={high ? SP.high : SP.possible} className={`ml-auto rounded-full px-2.5 py-0.5 text-xs font-bold ${high ? 'bg-rose-600 text-white' : 'bg-amber-200 text-amber-900 dark:bg-amber-500/30 dark:text-amber-100'}`} />
      </div>
      <Localized value={g.means} as="p" className="mt-1 text-sm italic text-slate-600 dark:text-slate-300" />
      <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm text-slate-700 dark:text-slate-200">
        {evidence.map((e, i) => <EvidenceLine key={i} e={e} />)}
      </ul>
      {gap.topics?.length > 0 && (
        <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">
          <Localized value={SP.mostIn} />:{' '}
          {gap.topics.map((t, i) => (
            <span key={t.topic}>
              {i > 0 && ', '}
              <Localized value={t.name ?? { en: t.topic }} />
            </span>
          ))}
        </p>
      )}
      {!high && gap.toConfirm > 0 && <Localized value={SP.toConfirm(gap.toConfirm)} as="p" className="mt-1 text-xs font-semibold text-amber-800 dark:text-amber-200" />}
      {onPractise && (
        <button type="button" disabled={Boolean(busy)} onClick={() => onPractise(gap)} className={`${btn} mt-3 bg-slate-900 text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900`}>
          <Localized value={busy === `gap:${gap.gap}` ? SP.starting : SP.practiseThis} /> · <Localized value={SP.modes[gap.practice.mode].name} />
        </button>
      )}
    </article>
  );
}

/** The recommendation sentence + "Practice: … — N questions" for a next action. */
export function Recommendation({ next, gaps }) {
  if (!next) return null;
  const gap = next.gap ? gaps?.find((g) => g.gap === next.gap) : null;
  return (
    <div className="rounded-xl bg-indigo-50 p-4 ring-1 ring-indigo-200 dark:bg-indigo-500/10 dark:ring-indigo-500/30">
      <Localized value={SP.recommended} as="p" className="text-xs font-bold uppercase tracking-wide text-indigo-700 dark:text-indigo-300" />
      {(next.gap || next.topicName) && <Localized value={SP.advice(next.gap, next.topicName)} as="p" className="mt-1 font-semibold text-slate-900 dark:text-white" />}
      <Localized value={SP.practiceLine(SP.modes[next.mode].name, next.topicName, next.count)} as="p" className="mt-1 text-sm font-bold text-indigo-800 dark:text-indigo-200" />
      {next.level && <Localized value={SP.levels[next.level]} as="p" className="mt-0.5 text-xs text-slate-600 dark:text-slate-300" />}
      {gap && gap.confidence === 'possible' && gap.toConfirm > 0 && <Localized value={SP.toConfirm(gap.toConfirm)} as="p" className="mt-0.5 text-xs text-slate-600 dark:text-slate-300" />}
    </div>
  );
}

/** 🎯 Practice My Weakness: the recommended set in one tap, or choose type, level and length. */
export function PracticeLauncher({ next, gaps, practice }) {
  const [mode, setMode] = useState(next?.mode ?? 'pattern');
  const [level, setLevel] = useState('auto');
  const [count, setCount] = useState(next?.count ?? 10);
  useEffect(() => {
    if (next?.mode) setMode(next.mode);
  }, [next?.mode]);
  const { run, busy, error } = practice;
  const radio = (on) => `min-h-10 rounded-xl px-3 text-sm font-semibold ring-1 ${on ? 'bg-indigo-600 text-white ring-indigo-600' : 'bg-white text-slate-700 ring-slate-300 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700'}`;
  return (
    <section className={card} aria-labelledby="practice-weakness-title">
      <h2 id="practice-weakness-title" className="text-lg font-extrabold text-slate-900 dark:text-white">
        <Localized value={SP.practiceTitle} />
      </h2>
      <Localized value={SP.practiceHint} as="p" className="mt-1 text-sm text-slate-600 dark:text-slate-300" />
      {next && (
        <div className="mt-4">
          <Recommendation next={next} gaps={gaps} />
          <button
            type="button"
            disabled={Boolean(busy)}
            onClick={() => run('recommended', { mode: next.mode, level: next.level, count: next.count, topics: next.topic ? [next.topic] : [] })}
            className={`${btn} mt-3 w-full bg-indigo-600 text-white hover:bg-indigo-500 sm:w-auto`}
          >
            <Localized value={busy === 'recommended' ? SP.starting : SP.start} />
          </button>
        </div>
      )}

      <div className="mt-5 space-y-4 border-t border-slate-100 pt-4 dark:border-slate-800">
        <fieldset>
          <Localized value={SP.chooseMode} as="legend" className="text-sm font-bold text-slate-800 dark:text-slate-100" />
          <div role="radiogroup" className="mt-2 grid gap-2 sm:grid-cols-2">
            {MODES.map((m) => (
              <button key={m} type="button" role="radio" aria-checked={mode === m} onClick={() => setMode(m)} className={`${radio(mode === m)} py-2 text-left`}>
                <Localized value={SP.modes[m].name} as="span" className="block" />
                <Localized value={SP.modes[m].hint} as="span" className={`block text-xs font-normal ${mode === m ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`} />
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <Localized value={SP.chooseLevel} as="legend" className="text-sm font-bold text-slate-800 dark:text-slate-100" />
          <div role="radiogroup" className="mt-2 flex flex-wrap gap-2">
            {['auto', ...LEVELS].map((l) => (
              <button key={l} type="button" role="radio" aria-checked={level === l} onClick={() => setLevel(l)} className={radio(level === l)}>
                <Localized value={l === 'auto' ? SP.autoLevel : SP.levels[l]} />
              </button>
            ))}
          </div>
          <Localized value={SP.levelLadder} as="p" className="mt-1 text-xs text-slate-500 dark:text-slate-400" />
        </fieldset>
        <fieldset>
          <Localized value={SP.chooseCount} as="legend" className="text-sm font-bold text-slate-800 dark:text-slate-100" />
          <div role="radiogroup" className="mt-2 flex gap-2">
            {[5, 10, 15].map((c) => (
              <button key={c} type="button" role="radio" aria-checked={count === c} onClick={() => setCount(c)} className={`${radio(count === c)} w-14`}>
                {c}
              </button>
            ))}
          </div>
        </fieldset>
        <button
          type="button"
          disabled={Boolean(busy)}
          onClick={() => run('custom', { mode, level: level === 'auto' ? null : level, count })}
          className={`${btn} bg-slate-900 text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900`}
        >
          <Localized value={busy === 'custom' ? SP.starting : SP.start} /> · <Localized value={SP.modes[mode].name} />
        </button>
        <StartError error={error} />
      </div>
    </section>
  );
}

/** Result of a Practice My Weakness set: previous → now, weakest / strongest pattern, adaptive next step. */
export function StuckPracticeResult({ data }) {
  const practice = useStartStuckPractice();
  if (!data) return null;
  const { next } = data;
  const topics = (next.topics ?? []).map((t) => t.topic);
  const message =
    next.action === 'up' ? SP.nextUp(SP.levels[next.level])
      : next.action === 'same' ? SP.nextSame(SP.levels[next.level])
        : next.action === 'mastered' ? SP.nextMastered
          : SP.nextRevise;
  return (
    <section className={card} aria-labelledby="stuck-result-title" data-testid="stuck-practice-result">
      <h2 id="stuck-result-title" className="text-base font-extrabold text-slate-900 dark:text-white">
        <Localized value={SP.resultTitle} />
      </h2>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        <Localized value={SP.modes[data.mode]?.name ?? SP.modes.pattern.name} /> · <Localized value={SP.levels[data.level] ?? SP.levels.basic} />
      </p>
      <div className="mt-3 flex flex-wrap items-baseline gap-3">
        <Localized value={data.previous != null ? SP.previousNow(data.previous, data.accuracy) : SP.firstTime(data.accuracy)} as="p" className="text-lg font-extrabold text-slate-900 dark:text-white" />
        {data.change != null && (
          <Localized value={SP.improved(data.change)} className={`rounded-full px-2.5 py-0.5 text-sm font-bold ${data.change >= 0 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300' : 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300'}`} />
        )}
      </div>
      {(data.weakestPattern || data.strongestPattern) && (
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          {data.weakestPattern && (
            <div className="rounded-xl bg-rose-50 p-3 dark:bg-rose-500/10">
              <Localized value={SP.weakestPattern} as="dt" className="text-xs font-bold uppercase text-rose-700 dark:text-rose-300" />
              <dd className="font-semibold text-slate-900 dark:text-white"><Localized value={data.weakestPattern.name} /> · {data.weakestPattern.accuracy}%</dd>
            </div>
          )}
          {data.strongestPattern && (
            <div className="rounded-xl bg-emerald-50 p-3 dark:bg-emerald-500/10">
              <Localized value={SP.strongestPattern} as="dt" className="text-xs font-bold uppercase text-emerald-700 dark:text-emerald-300" />
              <dd className="font-semibold text-slate-900 dark:text-white"><Localized value={data.strongestPattern.name} /> · {data.strongestPattern.accuracy}%</dd>
            </div>
          )}
        </dl>
      )}
      <div data-testid="stuck-next-message" className="mt-3 font-semibold text-indigo-800 dark:text-indigo-200">
        <Localized value={message} as="p" />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {next.action === 'revise' && topics[0] && (
          <Link to={learnPaths.chapter('quant', topics[0])} className={`${btn} bg-violet-600 text-white hover:bg-violet-500`}>
            <Localized value={SP.revise} />
          </Link>
        )}
        {next.action !== 'mastered' && (
          <button
            type="button"
            disabled={Boolean(practice.busy)}
            onClick={() => practice.run('next', { mode: data.mode, level: next.level, count: 5, topics })}
            className={`${btn} bg-indigo-600 text-white hover:bg-indigo-500`}
          >
            <Localized value={practice.busy === 'next' ? SP.starting : next.action === 'same' ? SP.sameAgain : SP.nextSet} />
          </button>
        )}
        <Link to={STUCK_PATH} className={`${btn} text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 dark:text-slate-200 dark:ring-slate-700`}>
          <Localized value={SP.backToStuck} />
        </Link>
      </div>
      <StartError error={practice.error} />
    </section>
  );
}

/** Home card (feature §17): top problem + evidence, most stuck topics, improvement, next action. Hidden without stuck data. */
export function StuckSummaryCard() {
  const source = useOptionalDataSource();
  const [data, setData] = useState(null);
  useEffect(() => {
    if (!source?.getStuckSummary) return undefined;
    let alive = true;
    source.getStuckSummary().then((d) => alive && setData(d), () => {});
    return () => {
      alive = false;
    };
  }, [source]);
  if (!data || !data.total) return null;
  const g = data.topGap;
  const gi = g ? SP.gaps[g.gap] : null;
  const ev = g?.evidence?.find((e) => e.kind === 'signals');
  return (
    <section className={`${card} mt-5`} aria-labelledby="stuck-card-title" data-testid="stuck-summary-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 id="stuck-card-title" className="text-lg font-extrabold text-slate-900 dark:text-white">
          <Localized value={SP.cardTitle} />
        </h2>
        <Link to={STUCK_PATH} className="text-sm font-semibold text-indigo-700 hover:underline dark:text-indigo-300">
          <Localized value={SP.open} /> →
        </Link>
      </div>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <div>
          {g ? (
            <>
              <Localized value={SP.topProblem} as="p" className="text-xs font-bold uppercase tracking-wide text-slate-500" />
              <p className="mt-0.5 text-lg font-extrabold text-slate-900 dark:text-white">
                <span aria-hidden="true">{gi.emoji} </span>
                <Localized value={gi.name} />
                <Localized value={g.confidence === 'high' ? SP.high : SP.possible} className="ml-2 align-middle text-xs font-bold text-slate-500" />
              </p>
              {ev && (
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  <Localized value={SP.evidence} />: <Localized value={SP.evidenceSignals(ev.n, ev.of)} />
                </p>
              )}
            </>
          ) : (
            <Localized value={SP.cardNoGap(data.total)} as="p" className="text-sm text-slate-600 dark:text-slate-300" />
          )}
          {data.mostStuck?.length > 0 && (
            <div className="mt-3">
              <Localized value={SP.mostStuckTopics} as="p" className="text-xs font-bold uppercase tracking-wide text-slate-500" />
              <ol className="mt-1 list-decimal pl-5 text-sm text-slate-800 dark:text-slate-200">
                {data.mostStuck.map((c) => (
                  <li key={c.topic}><Localized value={c.name} /> · {c.stuck}</li>
                ))}
              </ol>
            </div>
          )}
        </div>
        <div>
          {data.improvement?.length > 0 && (
            <div className="mb-3">
              <Localized value={SP.improvementTitle} as="p" className="text-xs font-bold uppercase tracking-wide text-slate-500" />
              {data.improvement.map((i) => (
                <p key={i.topic} className="text-sm text-slate-800 dark:text-slate-200">
                  <Localized value={SP.improvementRow(i.name, i.before, i.now)} />{' '}
                  <Localized value={SP.improved(i.change)} className={`font-bold ${i.change >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`} />
                </p>
              ))}
            </div>
          )}
          {data.next && (
            <>
              <Localized value={SP.nextAction} as="p" className="text-xs font-bold uppercase tracking-wide text-slate-500" />
              <Localized value={SP.practiceLine(SP.modes[data.next.mode].name, data.next.topicName, data.next.count)} as="p" className="mt-0.5 font-bold text-indigo-800 dark:text-indigo-200" />
              <Link to={STUCK_PATH} className={`${btn} mt-2 bg-indigo-600 text-white hover:bg-indigo-500`}>
                <Localized value={SP.start} />
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

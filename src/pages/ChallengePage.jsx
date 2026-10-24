import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useOptionalAuth } from '../app/AuthContext';
import { useDataSource } from '../app/DataSourceContext';
import PageShell from '../components/navigation/PageShell';
import OptionButton from '../components/practice/OptionButton';
import AnswerExplanation from '../components/review/AnswerExplanation';
import { Localized } from '../components/topic-hub/Localized';
import { CHALLENGE } from '../lib/motivationCopy';
import { LoadError } from './funnel/FunnelLayout';

/** Remembers on this device that today's challenge was played (for signed-out players). */
export const challengeKey = (day) => `edtech:challenge:${day}`;
export function playedOnDevice(day) {
  try {
    return JSON.parse(localStorage.getItem(challengeKey(day)));
  } catch {
    return null;
  }
}

/** /challenge: today's 5 mixed questions, then every answer explained. */
export default function ChallengePage() {
  const source = useDataSource();
  const auth = useOptionalAuth();
  const [state, setState] = useState({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [picked, setPicked] = useState({});
  const [outcome, setOutcome] = useState(null);
  const [busy, setBusy] = useState(false);
  const startedAt = useRef(Date.now());

  useEffect(() => {
    let alive = true;
    setState({ status: 'loading' });
    source.getChallenge().then(
      (data) => alive && setState({ status: 'ready', data }),
      (error) => alive && setState({ status: 'error', error }),
    );
    return () => {
      alive = false;
    };
  }, [source, attempt, auth?.user]);

  const questions = state.data?.questions ?? [];
  const missing = questions.filter((q) => !picked[q.questionId]).length;
  const byId = new Map((outcome?.results ?? []).map((r) => [r.questionId, r]));
  const done = state.data?.done ?? (state.data ? playedOnDevice(state.data.day) : null);

  async function submit() {
    setBusy(true);
    try {
      const perQuestion = Math.round((Date.now() - startedAt.current) / 1000 / Math.max(1, questions.length));
      const res = await source.submitChallenge({
        answers: questions.map((q) => ({ questionId: q.questionId, selectedOptionId: picked[q.questionId] ?? null, timeSpentSec: perQuestion })),
      });
      setOutcome(res);
      try {
        if (!done) localStorage.setItem(challengeKey(state.data.day), JSON.stringify(res.score));
      } catch {
        /* storage blocked: fine */
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      setState((s) => ({ ...s, actionError: error }));
    } finally {
      setBusy(false);
    }
  }

  const statusOf = (q, optionId) => {
    const r = byId.get(q.questionId);
    if (!r) return picked[q.questionId] === optionId ? 'selected' : 'idle';
    if (optionId === r.selectedOptionId) return r.isCorrect ? 'correct' : 'wrong';
    if (optionId === r.correctOptionId) return 'answer';
    return 'dimmed';
  };

  return (
    <PageShell className="max-w-3xl pb-16 pt-6 sm:pt-10">
      <header className="rounded-3xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 p-6 text-white shadow-lg sm:p-8">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          <span aria-hidden="true">⚡ </span>
          <Localized value={CHALLENGE.title} />
        </h1>
        <Localized value={CHALLENGE.sub} as="p" className="mt-2 max-w-xl leading-relaxed text-white/95" />
        {outcome ? (
          <div className="mt-4 rounded-2xl bg-white/20 p-4 ring-1 ring-white/30">
            <p className="text-4xl font-extrabold tabular-nums">
              {outcome.score.correct}/{outcome.score.total}
            </p>
            <Localized value={outcome.score.correct === outcome.score.total ? CHALLENGE.perfect : CHALLENGE.score(outcome.score.correct, outcome.score.total)} as="p" className="font-bold" />
            {!outcome.firstAttempt && <Localized value={CHALLENGE.notCounted} as="p" className="mt-1 text-sm text-white/90" />}
            {!auth?.user && <Localized value={CHALLENGE.loginHint} as="p" className="mt-1 text-sm text-white/90" />}
          </div>
        ) : (
          done && <Localized value={CHALLENGE.doneToday(done.correct, done.total)} as="p" className="mt-4 inline-block rounded-full bg-white/20 px-4 py-1.5 text-sm font-bold ring-1 ring-white/30" />
        )}
      </header>

      <div className="mt-6 space-y-4">
        {state.status === 'loading' && <div className="h-72 animate-pulse rounded-3xl bg-slate-200/70 motion-reduce:animate-none dark:bg-slate-800/70" aria-busy="true" />}
        {state.status === 'error' && <LoadError error={state.error} onRetry={() => setAttempt((n) => n + 1)} />}
        {questions.map((q, i) => {
          const r = byId.get(q.questionId);
          return (
            <article key={q.questionId} className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6 dark:bg-slate-900 dark:ring-slate-800">
              <Localized value={CHALLENGE.q(i + 1)} as="p" className="text-xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400" />
              <Localized value={q.stem} markdown as="div" className="mt-1 text-lg font-medium leading-relaxed text-slate-900 dark:text-white" />
              <div role="radiogroup" aria-label={CHALLENGE.q(i + 1).en} className="mt-4 space-y-2.5">
                {q.options.map((o, j) => (
                  <OptionButton
                    key={o.optionId}
                    option={o}
                    index={j}
                    status={statusOf(q, o.optionId)}
                    checked={picked[q.questionId] === o.optionId}
                    focusable
                    disabled={Boolean(outcome)}
                    onSelect={(optionId) => setPicked((p) => ({ ...p, [q.questionId]: optionId }))}
                  />
                ))}
              </div>
              {r && (
                <div className="mt-4">
                  <AnswerExplanation steps={r.steps} shortcut={r.shortcut} trap={r.trapForSelected} />
                </div>
              )}
            </article>
          );
        })}
        {state.actionError && <p role="alert" className="text-sm text-rose-600">{state.actionError.message}</p>}
        {questions.length > 0 && !outcome && (
          <div className="flex flex-wrap items-center justify-end gap-3">
            {missing > 0 && <Localized value={CHALLENGE.unanswered(missing)} className="text-sm font-semibold text-slate-500" />}
            <button type="button" disabled={busy || missing === questions.length} onClick={submit} className="min-h-12 rounded-xl bg-orange-600 px-6 font-bold text-white hover:bg-orange-500 disabled:cursor-not-allowed disabled:opacity-50">
              <Localized value={CHALLENGE.submit} />
            </button>
          </div>
        )}
        {outcome && (
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Link to="/revise" className="inline-flex min-h-11 items-center rounded-xl px-5 font-semibold text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-50 dark:text-indigo-300 dark:ring-indigo-500/40">
              🔁 <Localized value={{ en: 'Revise today', bn: 'আজকের রিভিশন' }} />
            </Link>
            <Link to="/" className="inline-flex min-h-11 items-center rounded-xl bg-indigo-600 px-5 font-semibold text-white hover:bg-indigo-500">
              <Localized value={{ en: 'Back to home', bn: 'হোমে ফিরে যাও' }} />
            </Link>
          </div>
        )}
      </div>
    </PageShell>
  );
}

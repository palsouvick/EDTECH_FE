import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';
import { useDataSource } from '../app/DataSourceContext';
import { loginPath } from '../components/auth/AccountButton';
import PageShell from '../components/navigation/PageShell';
import { Localized } from '../components/topic-hub/Localized';
import { useLanguagePreference } from '../hooks/useLanguagePreference';
import { MOCK } from '../lib/i18n';
import { MP } from '../lib/mockPapersCopy';
import { CardGridSkeleton, LoadError } from './funnel/FunnelLayout';

const LETTERS = ['A', 'B', 'C', 'D', 'E'];
const card = 'rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6 dark:bg-slate-900 dark:ring-slate-800';
const btn = 'min-h-11 rounded-xl px-4 text-sm font-semibold disabled:cursor-wait disabled:opacity-60';

/** The stem in the page language, falling back to whichever stem exists. */
function pickStem(q, lang) {
  if (!q) return '';
  return lang === 'bn' ? q.stemBn || q.stemEn || '' : q.stemEn || q.stemBn || '';
}

function pickExplanation(item, lang) {
  return lang === 'bn' ? item.explanationBn || item.explanationEn || null : item.explanationEn || item.explanationBn || null;
}

function formatClock(totalSec) {
  const s = Math.max(0, totalSec);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * /mocks/:paperId/attempt/:attemptId — run the paper in attempt order with a
 * countdown (auto-submit at 0), a palette, pause that freezes the countdown
 * while the question stays visible, and the result review after submit.
 */
export default function MockPaperAttemptPage() {
  const source = useDataSource();
  const location = useLocation();
  const navigate = useNavigate();
  const { paperId, attemptId } = useParams();
  const { status: authStatus, user } = useAuth();
  const { lang } = useLanguagePreference();
  const [state, setState] = useState({ status: 'loading' });
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const [remainingSec, setRemainingSec] = useState(null);
  const [confirming, setConfirming] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [result, setResult] = useState(null);
  const [retaking, setRetaking] = useState(false);
  const submitRef = useRef(null);

  useEffect(() => {
    if (authStatus !== 'ready' || !user) return undefined;
    let alive = true;
    setState({ status: 'loading' });
    setAnswers({});
    setCurrent(0);
    setPaused(false);
    setRemainingSec(null);
    setConfirming(false);
    setSubmitError(null);
    setResult(null);
    source.getMockPaperAttempt(attemptId).then(
      (data) => {
        if (!alive) return;
        setState({ status: 'ready', data });
        if (data.review) {
          setResult({ attempt: data.attempt, review: data.review });
        } else if (data.attempt) {
          const elapsed = Math.floor((Date.now() - new Date(data.attempt.startedAt).getTime()) / 1000);
          setRemainingSec(Math.max(0, (data.attempt.timeLimitMin ?? 0) * 60 - Math.max(0, elapsed)));
        }
      },
      (error) => alive && setState({ status: 'error', error }),
    );
    return () => {
      alive = false;
    };
  }, [source, authStatus, user, attemptId, loadAttempt]);

  const questions = state.data?.questions ?? [];
  const unanswered = questions.filter((q) => answers[q.questionIndex] == null).length;

  const submit = useCallback(async () => {
    if (submitting || result) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const payload = { answers: questions.map((q) => ({ questionIndex: q.questionIndex, selected: answers[q.questionIndex] ?? null })) };
      const data = await source.submitMockPaperAttempt(attemptId, payload);
      setResult({ attempt: data.attempt, review: data.review });
      setConfirming(false);
    } catch (err) {
      setSubmitError(err);
    } finally {
      setSubmitting(false);
    }
  }, [submitting, result, questions, answers, source, attemptId]);
  submitRef.current = submit;

  // Countdown: frozen while paused, auto-submits at 0.
  useEffect(() => {
    if (result || paused || remainingSec == null) return undefined;
    if (remainingSec <= 0) {
      submitRef.current?.();
      return undefined;
    }
    const t = setInterval(() => setRemainingSec((r) => (r == null ? r : Math.max(0, r - 1))), 1000);
    return () => clearInterval(t);
  }, [result, paused, remainingSec]);

  if (authStatus === 'ready' && !user) return <Navigate to={loginPath(location)} replace />;

  const onSubmitClick = () => {
    // Always ask first, even with every question answered: a stray click must not end the mock.
    if (!confirming) {
      setConfirming(true);
      return;
    }
    submit();
  };

  const retake = async () => {
    setRetaking(true);
    try {
      const data = await source.startMockPaperAttempt(paperId);
      navigate(`/mocks/${paperId}/attempt/${data.attempt.id}`);
    } catch (err) {
      setSubmitError(err);
    } finally {
      setRetaking(false);
    }
  };

  const currentQ = questions[current];

  return (
    <PageShell className="max-w-4xl space-y-5 pb-16 pt-6 sm:pt-10">
      <Link to={`/mocks/${paperId}`} className="text-sm font-semibold text-indigo-700 hover:underline dark:text-indigo-300">
        <Localized value={MP.backToPaper} />
      </Link>

      {state.status === 'loading' && <CardGridSkeleton />}
      {state.status === 'error' && <LoadError error={state.error} onRetry={() => setLoadAttempt((n) => n + 1)} />}

      {state.status === 'ready' && result && (
        <section className="space-y-5">
          <div className={card}>
            <Localized value={MP.resultTitle} as="h1" className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white" />
            <p className="mt-2 text-lg font-bold text-slate-900 dark:text-white">
              <Localized value={MP.scoreLine(result.attempt.score, result.attempt.total)} />
            </p>
            {result.attempt.timeUsedSec != null && (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                <Localized value={MP.timeUsed(result.attempt.timeUsedSec)} />
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" disabled={retaking} onClick={retake} className={`${btn} bg-indigo-600 text-white hover:bg-indigo-500`}>
                <Localized value={retaking ? MP.starting : MP.retake} />
              </button>
              <Link to={`/mocks/${paperId}`} className={`${btn} inline-flex items-center ring-1 ring-slate-300 dark:text-white`}>
                <Localized value={MP.backToPaper} />
              </Link>
            </div>
          </div>

          <section aria-labelledby="review-title" className="space-y-3">
            <h2 id="review-title" className="text-lg font-extrabold text-slate-900 dark:text-white">
              <Localized value={MP.reviewTitle} />
            </h2>
            {result.review.map((item) => {
              const explanation = pickExplanation(item, lang);
              return (
                <article key={item.questionIndex} className={card} data-testid="mock-review-question">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    <Localized value={MP.questionOf(item.n, result.attempt.total)} />
                  </p>
                  <p className="mt-1 font-medium leading-relaxed text-slate-900 dark:text-white">{pickStem(item, lang)}</p>
                  <ol className="mt-3 grid gap-1.5 text-sm">
                    {item.options.map((opt, i) => {
                      const isCorrect = i === item.correctIndex;
                      const isSelected = i === item.selected;
                      return (
                        <li
                          key={i}
                          className={`rounded-lg px-3 py-2 ${isCorrect ? 'bg-emerald-50 font-semibold text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200' : isSelected ? 'bg-rose-50 text-rose-800 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-200' : 'text-slate-700 dark:text-slate-300'}`}
                        >
                          <span className="font-bold">{LETTERS[i]}.</span> {opt}
                          {isCorrect && <> · <Localized value={MP.correctAnswer} /></>}
                          {isSelected && !isCorrect && <> · <Localized value={MP.yourAnswer} /></>}
                        </li>
                      );
                    })}
                  </ol>
                  <p className="mt-3 text-sm font-semibold">
                    <Localized value={item.correct ? MP.correct : item.selected == null ? MP.unattempted : MP.wrong} />
                  </p>
                  {item.selected == null && (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      <Localized value={MP.correctAnswer} />: <span className="font-bold">{LETTERS[item.correctIndex]}.</span> {item.options[item.correctIndex]}
                    </p>
                  )}
                  {explanation && (
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                      <Localized value={MP.explanation} className="font-bold" />: {explanation}
                    </p>
                  )}
                </article>
              );
            })}
          </section>
        </section>
      )}

      {state.status === 'ready' && !result && currentQ && (
        <>
          <div className={`${card} flex flex-wrap items-center justify-between gap-3`}>
            <div>
              <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
                <Localized value={MOCK.timeLeft} />: <span className="font-mono text-base font-bold tabular-nums text-slate-900 dark:text-white">{formatClock(remainingSec ?? 0)}</span>
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                <Localized value={MP.questionOf(current + 1, questions.length)} />
              </p>
            </div>
            <button
              type="button"
              onClick={() => setPaused((p) => !p)}
              className={`${btn} ring-1 ring-slate-300 dark:text-white`}
            >
              <Localized value={paused ? MP.resume : MP.pause} />
            </button>
          </div>

          {paused && (
            <div role="status" className="rounded-xl bg-amber-50 px-4 py-3 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:ring-amber-500/30">
              <p className="font-bold text-amber-900 dark:text-amber-200">⏸ <Localized value={MOCK.pausedTitle} inline /></p>
              <Localized value={MOCK.pausedHint} as="p" className="text-sm text-amber-800 dark:text-amber-300" />
            </div>
          )}

          {confirming && (
            <div role="alertdialog" aria-labelledby="mock-confirm-title" className="rounded-xl bg-amber-50 px-4 py-3 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:ring-amber-500/30">
              <Localized value={MP.confirmTitle} as="p" id="mock-confirm-title" className="font-bold text-amber-900 dark:text-amber-200" />
              {unanswered > 0 && <Localized value={MP.confirmUnanswered(unanswered)} as="p" className="mt-1 text-sm text-amber-800 dark:text-amber-300" />}
              <Localized value={MP.confirmHint} as="p" className="mt-1 text-sm text-amber-800 dark:text-amber-300" />
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" disabled={submitting} onClick={submit} className={`${btn} bg-rose-600 text-white hover:bg-rose-500`}>
                  <Localized value={submitting ? MP.submitting : unanswered > 0 ? MP.confirmSubmit : MP.confirmSubmitAll} />
                </button>
                <button type="button" onClick={() => setConfirming(false)} className={`${btn} ring-1 ring-slate-300 dark:text-white`}>
                  <Localized value={MP.backToTest} />
                </button>
              </div>
            </div>
          )}

          <section className={card} aria-labelledby="mock-question-heading">
            <h1 id="mock-question-heading" className="sr-only">
              <Localized value={MP.questionOf(currentQ.n, questions.length)} />
            </h1>
            <p className="font-medium leading-relaxed text-slate-900 dark:text-white">{pickStem(currentQ, lang)}</p>
            <div className="mt-4 grid gap-2">
              {currentQ.options.map((opt, i) => {
                const selected = answers[currentQ.questionIndex] === i;
                return (
                  <button
                    key={i}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setAnswers((a) => ({ ...a, [currentQ.questionIndex]: i }))}
                    className={`min-h-11 rounded-xl px-3 py-2 text-left text-sm ring-1 ${selected ? 'bg-indigo-600 font-semibold text-white ring-indigo-600' : 'text-slate-800 ring-slate-300 hover:bg-slate-50 dark:text-slate-100 dark:ring-slate-700 dark:hover:bg-slate-800'}`}
                  >
                    <span className="font-bold">{LETTERS[i]}.</span> {opt}
                  </button>
                );
              })}
            </div>
            <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
              <button type="button" disabled={current === 0} onClick={() => setCurrent((c) => Math.max(0, c - 1))} className={`${btn} ring-1 ring-slate-300 dark:text-white`}>
                <Localized value={MP.previous} />
              </button>
              <button type="button" disabled={current >= questions.length - 1} onClick={() => setCurrent((c) => Math.min(questions.length - 1, c + 1))} className={`${btn} ring-1 ring-slate-300 dark:text-white`}>
                <Localized value={MP.next} />
              </button>
              <button type="button" disabled={submitting} onClick={onSubmitClick} className={`${btn} bg-indigo-600 text-white hover:bg-indigo-500`}>
                <Localized value={submitting ? MP.submitting : MP.submit} />
              </button>
            </div>
            {submitError && (
              <p role="alert" className="mt-3 text-sm text-rose-600 dark:text-rose-300">{submitError.message}</p>
            )}
          </section>

          <section className={card} aria-labelledby="palette-title">
            <h2 id="palette-title" className="text-sm font-extrabold text-slate-900 dark:text-white">
              <Localized value={MP.palette} />
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {questions.map((q, i) => {
                const answered = answers[q.questionIndex] != null;
                const isCurrent = i === current;
                return (
                  <button
                    key={q.questionIndex}
                    type="button"
                    aria-current={isCurrent ? 'true' : undefined}
                    onClick={() => setCurrent(i)}
                    className={`grid size-10 place-items-center rounded-lg text-sm font-bold tabular-nums ring-1 ${isCurrent ? 'bg-indigo-600 text-white ring-indigo-600' : answered ? 'bg-emerald-100 text-emerald-800 ring-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300' : 'text-slate-700 ring-slate-300 hover:bg-slate-50 dark:text-slate-200 dark:ring-slate-700'}`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              <Localized value={MP.answered} />: {questions.length - unanswered} · <Localized value={MP.unanswered} />: {unanswered}
            </p>
          </section>
        </>
      )}
    </PageShell>
  );
}

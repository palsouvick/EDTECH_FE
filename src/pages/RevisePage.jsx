import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';
import { useDataSource } from '../app/DataSourceContext';
import { loginPath } from '../components/auth/AccountButton';
import PageShell from '../components/navigation/PageShell';
import OptionButton from '../components/practice/OptionButton';
import AnswerExplanation from '../components/review/AnswerExplanation';
import { Localized } from '../components/topic-hub/Localized';
import { REVIEW } from '../lib/reviewCopy';
import { paths } from '../lib/routes';
import { LoadError } from './funnel/FunnelLayout';

const card = 'rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-7 dark:bg-slate-900 dark:ring-slate-800';
export const dayLabel = (iso) => new Date(iso).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

/** The streak toward mastery as small dots: ● ● (filled = answered right in a row). */
function MasteryDots({ streak, of }) {
  return (
    <span className="inline-flex items-center gap-1" aria-hidden="true">
      {Array.from({ length: of }, (_, i) => (
        <span key={i} className={`size-2.5 rounded-full ${i < streak ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
      ))}
    </span>
  );
}

/** /revise: today's due questions, one at a time; each answer reschedules or masters it. */
export default function RevisePage() {
  const { status: authStatus, user } = useAuth();
  const source = useDataSource();
  const location = useLocation();
  const [load, setLoad] = useState({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [tally, setTally] = useState({ mastered: 0, again: 0 });
  const shownAt = useRef(Date.now());

  useEffect(() => {
    if (!user) return undefined;
    let alive = true;
    setLoad({ status: 'loading' });
    Promise.all([source.getReviewDue(), source.getReviewSummary()]).then(
      ([due, summary]) => alive && setLoad({ status: 'ready', items: due.items, masterAfter: due.masterAfter, summary }),
      (error) => alive && setLoad({ status: 'error', error }),
    );
    return () => {
      alive = false;
    };
  }, [user, source, attempt]);

  if (authStatus === 'ready' && !user) return <Navigate to={loginPath(location)} replace />;

  const items = load.items ?? [];
  const item = items[index];
  const done = load.status === 'ready' && index >= items.length;

  async function check() {
    setBusy(true);
    try {
      const r = await source.answerReview({
        questionId: item.question.questionId,
        selectedOptionId: picked,
        timeSpentSec: Math.round((Date.now() - shownAt.current) / 100) / 10,
      });
      setResult(r);
      setTally((x) => (r.review.status === 'mastered' ? { ...x, mastered: x.mastered + 1 } : { ...x, again: x.again + 1 }));
    } catch (error) {
      setLoad((l) => ({ ...l, actionError: error }));
    } finally {
      setBusy(false);
    }
  }

  function next() {
    setIndex((i) => i + 1);
    setPicked(null);
    setResult(null);
    shownAt.current = Date.now();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const statusOf = (optionId) => {
    if (!result) return picked === optionId ? 'selected' : 'idle';
    if (optionId === result.selectedOptionId) return result.isCorrect ? 'correct' : 'wrong';
    if (optionId === result.correctOptionId) return 'answer';
    return 'dimmed';
  };
  const reason = item && { mistake: REVIEW.reasonMistake, bookmark: REVIEW.reasonBookmark, both: REVIEW.reasonBoth }[item.reason];

  return (
    <PageShell className="max-w-3xl pb-16 pt-6 sm:pt-10">
      <header className="rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-600 to-sky-600 p-6 text-white shadow-lg sm:p-8">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          <span aria-hidden="true">🔁 </span>
          <Localized value={REVIEW.title} />
        </h1>
        <Localized value={REVIEW.sub} as="p" className="mt-2 max-w-xl leading-relaxed text-white/95" />
        {load.status === 'ready' && items.length > 0 && !done && (
          <div className="mt-4">
            <Localized value={REVIEW.progress(index + 1, items.length)} className="text-sm font-bold" />
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/25">
              <div className="h-full rounded-full bg-white transition-[width] duration-300" style={{ width: `${(index / items.length) * 100}%` }} />
            </div>
          </div>
        )}
      </header>

      <div className="mt-6">
        {load.status === 'loading' && <div className={`${card} h-72 animate-pulse motion-reduce:animate-none`} aria-busy="true" />}
        {load.status === 'error' && <LoadError error={load.error} onRetry={() => setAttempt((n) => n + 1)} />}

        {load.status === 'ready' && items.length === 0 && (
          <div className={`${card} text-center`}>
            <span className="text-5xl" aria-hidden="true">{load.summary.active ? '🎉' : '🌱'}</span>
            <Localized value={load.summary.active ? REVIEW.allCaughtUp : REVIEW.title} as="h2" className="mt-3 text-xl font-bold text-slate-900 dark:text-white" />
            {load.summary.nextDueAt ? (
              <Localized value={REVIEW.nextOn(dayLabel(load.summary.nextDueAt))} as="p" className="mt-1 text-slate-600 dark:text-slate-300" />
            ) : (
              <Localized value={REVIEW.emptyNew} as="p" className="mx-auto mt-1 max-w-md text-slate-600 dark:text-slate-300" />
            )}
            <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
              <Link to="/mistakes" className="inline-flex min-h-11 items-center justify-center rounded-xl px-5 font-semibold text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-50 dark:text-indigo-300 dark:ring-indigo-500/40">
                📒 <Localized value={REVIEW.openNotebook} />
              </Link>
              <Link to={paths.exams()} className="inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-5 font-semibold text-white hover:bg-indigo-500">
                <Localized value={{ en: 'Practise new questions', bn: 'নতুন প্রশ্ন অনুশীলন করো' }} />
              </Link>
            </div>
          </div>
        )}

        {done && items.length > 0 && (
          <div className={`${card} text-center`}>
            <span className="text-5xl" aria-hidden="true">🏆</span>
            <Localized value={REVIEW.doneTitle} as="h2" className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white" />
            <Localized value={REVIEW.doneLine(tally.mastered, tally.again)} as="p" className="mt-1 text-slate-600 dark:text-slate-300" />
            <Link to="/mistakes" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-indigo-600 px-5 font-semibold text-white hover:bg-indigo-500">
              📒 <Localized value={REVIEW.openNotebook} />
            </Link>
          </div>
        )}

        {item && !done && (
          <article className={card}>
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
              <Localized value={item.topicName} className="rounded-full bg-indigo-50 px-3 py-0.5 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300" />
              <Localized value={reason} className="rounded-full bg-amber-100 px-3 py-0.5 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300" />
              {item.wrongCount > 1 && <Localized value={REVIEW.wrongTimes(item.wrongCount)} className="rounded-full bg-rose-100 px-3 py-0.5 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300" />}
              <span className="ml-auto inline-flex items-center gap-2 font-semibold text-slate-500">
                <MasteryDots streak={result?.review.streak ?? item.streak} of={load.masterAfter} />
                <Localized value={REVIEW.toMaster(result?.review.streak ?? item.streak, load.masterAfter)} />
              </span>
            </div>
            <Localized value={item.question.stem} markdown as="div" className="mt-4 text-lg font-medium leading-relaxed text-slate-900 dark:text-white" />
            <div role="radiogroup" aria-label={REVIEW.check.en} className="mt-4 space-y-2.5">
              {item.question.options.map((o, i) => (
                <OptionButton key={o.optionId} option={o} index={i} status={statusOf(o.optionId)} checked={picked === o.optionId} focusable disabled={Boolean(result)} onSelect={setPicked} />
              ))}
            </div>

            {result && (
              <div className="mt-5 space-y-3" role="status">
                <Localized
                  value={result.review.status === 'mastered' ? REVIEW.mastered : result.isCorrect ? REVIEW.rightAgain(dayLabel(result.review.nextDueAt)) : REVIEW.wrongAgain}
                  as="p"
                  className={`rounded-xl px-4 py-3 font-bold ${result.isCorrect ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300' : 'bg-rose-50 text-rose-800 dark:bg-rose-500/10 dark:text-rose-300'}`}
                />
                <AnswerExplanation steps={result.explanation.items} shortcut={result.shortcut} trap={result.trapForSelected} />
              </div>
            )}
            {load.actionError && <p role="alert" className="mt-3 text-sm text-rose-600">{load.actionError.message}</p>}

            <div className="mt-6 flex justify-end">
              {!result ? (
                <button type="button" disabled={!picked || busy} onClick={check} className="min-h-12 rounded-xl bg-indigo-600 px-6 font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50">
                  <Localized value={REVIEW.check} />
                </button>
              ) : (
                <button type="button" onClick={next} className="min-h-12 rounded-xl bg-indigo-600 px-6 font-semibold text-white hover:bg-indigo-500">
                  <Localized value={index + 1 < items.length ? REVIEW.next : REVIEW.finish} /> →
                </button>
              )}
            </div>
          </article>
        )}
      </div>
    </PageShell>
  );
}

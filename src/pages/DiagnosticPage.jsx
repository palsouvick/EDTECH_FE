import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';
import { useDataSource } from '../app/DataSourceContext';
import { languageStore } from '../hooks/useLanguagePreference';
import { updateCachedResource } from '../hooks/useResource';
import { DIAG } from '../lib/diagnosticCopy';
import { chapterLink } from '../lib/studyPlan';
import { loginPath } from '../components/auth/AccountButton';
import { Localized } from '../components/topic-hub/Localized';
import PageShell from '../components/navigation/PageShell';
import SubmitConfirmDialog from '../components/practice/SubmitConfirmDialog';
import { LoadError } from './funnel/FunnelLayout';

const card = 'rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6 dark:bg-slate-900 dark:ring-slate-800';
const btn = 'inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-bold';
const subjectName = (s) => DIAG.subjects[s] ?? { en: s };

/** Intro: what the check is, its sections (from the exam's own pattern), Start / Not now. */
function Intro({ status, onStart, onSkip, busy }) {
  const p = status.preview;
  return (
    <section className={card} aria-labelledby="diag-intro">
      <h2 id="diag-intro" className="text-lg font-bold text-slate-900 dark:text-white">
        <Localized value={status.exam?.name} />
      </h2>
      <Localized value={DIAG.offerBody(p.totalQuestions, p.minutes)} as="p" className="mt-2 text-slate-600 dark:text-slate-300" />
      <Localized value={DIAG.sectionsTitle} as="h3" className="mt-5 text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400" />
      <ul className="mt-2 divide-y divide-slate-100 rounded-2xl ring-1 ring-slate-200 dark:divide-slate-800 dark:ring-slate-800">
        {p.sections.map((s) => (
          <li key={s.key} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
            <Localized value={s.title} className="min-w-0 font-semibold text-slate-800 dark:text-slate-100" />
            <Localized value={DIAG.questionsCount(s.questions)} className="shrink-0 tabular-nums text-slate-500 dark:text-slate-400" />
          </li>
        ))}
      </ul>
      {p.basisNote && <Localized value={p.basisNote} as="p" className="mt-2 text-xs text-slate-500 dark:text-slate-400" />}
      <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
        {DIAG.rules.map((r) => <li key={r.en}><Localized value={r} /></li>)}
      </ul>
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={onStart} disabled={busy} className={`${btn} min-h-12 bg-indigo-600 px-6 text-base text-white hover:bg-indigo-500 disabled:opacity-60`}>
          <Localized value={status.state === 'completed' ? DIAG.retake : DIAG.start} />
        </button>
        {status.state === 'none' && (
          <button type="button" onClick={onSkip} disabled={busy} className={`${btn} min-h-12 text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-800`}>
            <Localized value={DIAG.notNow} />
          </button>
        )}
      </div>
    </section>
  );
}

/** One question at a time; untimed; Skip moves on without an answer. */
function Runner({ test, onSubmit, submitting, submitError }) {
  const questions = test.sections.flatMap((s) => s.questions.map((q) => ({ ...q, sectionTitle: s.title })));
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState({});
  const [confirming, setConfirming] = useState(false);
  const shownAt = useRef(Date.now());
  const spent = useRef({});
  const q = questions[i];
  const note = () => {
    spent.current[q.questionId] = (spent.current[q.questionId] || 0) + (Date.now() - shownAt.current) / 1000;
    shownAt.current = Date.now();
  };
  const go = (to) => {
    note();
    setI(Math.max(0, Math.min(questions.length - 1, to)));
  };
  const submit = () => {
    note();
    onSubmit(questions.map((x) => ({
      questionId: x.questionId,
      selectedOptionId: picked[x.questionId] ?? null,
      timeSpentSec: Math.min(3600, Math.round(spent.current[x.questionId] || 0)),
    })));
  };
  const answered = questions.filter((x) => picked[x.questionId]).length;
  const last = i === questions.length - 1;

  return (
    <section className={`${card} space-y-4`} aria-label={DIAG.title.en}>
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-semibold text-slate-600 dark:text-slate-300">
          <Localized value={q.sectionTitle} /> · <Localized value={DIAG.questionOf(i + 1, questions.length)} />
        </span>
        <Localized value={DIAG.answered(answered, questions.length)} className="text-slate-500" />
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" aria-hidden="true">
        <div className="h-full bg-indigo-500" style={{ width: `${((i + 1) / questions.length) * 100}%` }} />
      </div>
      <div className="flex flex-wrap gap-2 text-xs font-bold">
        <span className="rounded-full bg-violet-50 px-2.5 py-1 text-violet-800 ring-1 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-200 dark:ring-violet-500/30">
          <Localized value={DIAG.diagnosticQuestion} />
        </span>
        {q.level && (
          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <Localized value={DIAG.level[q.level]} />
          </span>
        )}
      </div>
      <Localized value={q.stem} markdown as="div" className="text-lg font-medium text-slate-900 dark:text-white" />
      <div role="radiogroup" aria-label={DIAG.questionOf(i + 1, questions.length).en} className="space-y-2">
        {q.options.map((o, k) => {
          const on = picked[q.questionId] === o.optionId;
          return (
            <button
              key={o.optionId}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setPicked((p) => ({ ...p, [q.questionId]: on ? undefined : o.optionId }))}
              className={`flex w-full items-start gap-3 rounded-xl p-3 text-left ring-1 ${on ? 'bg-indigo-50 ring-indigo-500 dark:bg-indigo-500/15' : 'bg-white ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:ring-slate-700'}`}
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-sm font-bold dark:bg-slate-800">{'ABCD'[k]}</span>
              <Localized value={o.text} markdown inline />
            </button>
          );
        })}
      </div>
      {submitError && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{submitError.message}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={i === 0} onClick={() => go(i - 1)} className={`${btn} ring-1 ring-slate-300 disabled:opacity-40 dark:ring-slate-700`}>
          <Localized value={DIAG.prev} />
        </button>
        {!last && (
          <button type="button" onClick={() => go(i + 1)} className={`${btn} bg-slate-900 text-white dark:bg-white dark:text-slate-900`}>
            <Localized value={picked[q.questionId] ? DIAG.next : DIAG.skipQuestion} />
          </button>
        )}
        <button type="button" onClick={() => setConfirming(true)} disabled={submitting} className={`${btn} ml-auto bg-emerald-600 text-white disabled:opacity-60`}>
          <Localized value={submitting ? DIAG.checking : DIAG.submit} />
        </button>
      </div>
      <SubmitConfirmDialog
        open={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={() => {
          setConfirming(false);
          submit();
        }}
        total={questions.length}
        answered={answered}
        onGoToUnanswered={() => {
          setConfirming(false);
          const first = questions.findIndex((x) => !picked[x.questionId]);
          if (first >= 0) go(first);
        }}
      />
    </section>
  );
}

function Counts({ row }) {
  return (
    <span className="tabular-nums">
      {row.correct}/{row.total}
      {' · '}
      {row.accuracy == null ? <Localized value={DIAG.notTried} /> : `${row.accuracy}%`}
      {row.unattempted > 0 && <span className="text-slate-500 dark:text-slate-400"> · <Localized value={DIAG.unattempted} />: {row.unattempted}</span>}
    </span>
  );
}

function TopicList({ title, hint, rows, tone }) {
  if (!rows.length) return null;
  const tones = {
    start: 'bg-amber-50 ring-amber-200 dark:bg-amber-500/10 dark:ring-amber-500/30',
    solid: 'bg-emerald-50 ring-emerald-200 dark:bg-emerald-500/10 dark:ring-emerald-500/30',
  };
  return (
    <div className={`rounded-2xl p-4 ring-1 ${tones[tone]}`}>
      <Localized value={title} as="h3" className="font-bold text-slate-900 dark:text-white" />
      <Localized value={hint} as="p" className="text-xs text-slate-600 dark:text-slate-300" />
      <ul className="mt-2 space-y-1 text-sm">
        {rows.map((x) => (
          <li key={`${x.subject}.${x.topic}`} className="flex flex-wrap items-baseline justify-between gap-2">
            <Link to={chapterLink(x.subject, x.topic)} className="font-semibold text-indigo-700 underline-offset-2 hover:underline dark:text-indigo-300">
              <Localized value={x.name} />
            </Link>
            <Localized value={DIAG.outOf(x.correct, x.total)} className="tabular-nums text-slate-600 dark:text-slate-300" />
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The result: starting mastery, subjects, sections, chapters to start with / already solid. */
function Result({ result, review, onRetake }) {
  const s = result.summary;
  return (
    <div className="space-y-5">
      <section className={card} aria-labelledby="diag-result">
        <h2 id="diag-result" className="text-lg font-bold text-slate-900 dark:text-white"><Localized value={DIAG.resultTitle} /></h2>
        <div className="mt-3 flex flex-wrap items-end gap-x-6 gap-y-2">
          <p>
            <Localized value={DIAG.startingMastery} className="block text-sm text-slate-500 dark:text-slate-400" />
            <span className="text-4xl font-extrabold tabular-nums text-slate-900 dark:text-white" data-testid="starting-mastery">{result.startingMastery ?? '—'}%</span>
          </p>
          <dl className="grid grid-cols-3 gap-4 text-sm">
            {[[DIAG.attempted, s.attempted], [DIAG.unattempted, s.unattempted], [DIAG.correct, s.correct]].map(([label, v]) => (
              <div key={label.en}>
                <Localized value={label} as="dt" className="text-slate-500 dark:text-slate-400" />
                <dd className="text-lg font-bold tabular-nums text-slate-900 dark:text-white">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
        {result.level && <Localized value={DIAG.levelBand[result.level]} as="p" className="mt-3 font-semibold text-indigo-800 dark:text-indigo-200" />}
        <Localized value={DIAG.weightedNote} as="p" className="mt-1 text-xs text-slate-500 dark:text-slate-400" />
      </section>

      <section className={card} aria-labelledby="diag-subjects">
        <h2 id="diag-subjects" className="text-lg font-bold text-slate-900 dark:text-white"><Localized value={DIAG.bySubject} /></h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {result.subjects.map((x) => (
            <li key={x.subject} className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800/60">
              <Localized value={subjectName(x.subject)} className="block font-semibold text-slate-900 dark:text-white" />
              <Counts row={x} />
            </li>
          ))}
        </ul>
        <Localized value={DIAG.accuracyHint} as="p" className="mt-2 text-xs text-slate-500 dark:text-slate-400" />
        {result.sections.length > result.subjects.length && (
          <details className="mt-3">
            <summary className="cursor-pointer text-sm font-semibold text-slate-700 dark:text-slate-200"><Localized value={DIAG.bySection} /></summary>
            <ul className="mt-2 space-y-1 text-sm">
              {result.sections.map((x) => (
                <li key={x.key} className="flex flex-wrap justify-between gap-2">
                  <Localized value={x.title} />
                  <Counts row={x} />
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <TopicList title={DIAG.startHere} hint={DIAG.startHereHint} rows={result.weakTopics} tone="start" />
        <TopicList title={DIAG.looksSolid} hint={DIAG.looksSolidHint} rows={result.strongTopics} tone="solid" />
      </div>

      <details className={card}>
        <summary className="cursor-pointer font-semibold text-slate-900 dark:text-white"><Localized value={DIAG.byTopic} /> ({result.topics.length})</summary>
        <ul className="mt-3 space-y-1 text-sm">
          {result.topics.map((x) => (
            <li key={`${x.subject}.${x.topic}`} className="flex flex-wrap justify-between gap-2">
              <Localized value={x.name} />
              <Counts row={x} />
            </li>
          ))}
        </ul>
      </details>

      {review && <Review review={review} />}

      <section className="rounded-2xl bg-sky-50 p-4 ring-1 ring-sky-200 dark:bg-sky-500/10 dark:ring-sky-500/30">
        <Localized value={DIAG.signalTitle} as="h2" className="font-bold text-sky-900 dark:text-sky-100" />
        <Localized value={result.signal.note} as="p" className="mt-1 text-sm text-sky-900 dark:text-sky-200" />
      </section>

      <div className="flex flex-wrap gap-3">
        <Link to="/" className={`${btn} min-h-12 bg-indigo-600 px-6 text-base text-white hover:bg-indigo-500`}>
          <Localized value={DIAG.goToday} />
        </Link>
        <button type="button" onClick={onRetake} className={`${btn} min-h-12 text-indigo-700 ring-1 ring-slate-300 dark:text-indigo-300 dark:ring-slate-700`}>
          <Localized value={DIAG.retake} />
        </button>
      </div>
    </div>
  );
}

/** Answers and explanations, right after submitting (not stored for later). */
function Review({ review }) {
  const { questions, results } = review;
  const byId = new Map(questions.map((q) => [q.questionId, q]));
  const text = (q, id) => q?.options.find((o) => o.optionId === id)?.text;
  const missed = results.filter((r) => !r.isCorrect);
  if (!missed.length) return null;
  return (
    <details className={card}>
      <summary className="cursor-pointer font-semibold text-slate-900 dark:text-white"><Localized value={DIAG.review} /> ({missed.length})</summary>
      <ol className="mt-3 space-y-4">
        {missed.map((r) => {
          const q = byId.get(r.questionId);
          return (
            <li key={r.questionId} className="text-sm">
              <Localized value={q?.stem} markdown as="div" className="font-medium text-slate-900 dark:text-white" />
              <p className="mt-1 text-rose-800 dark:text-rose-300">
                <Localized value={DIAG.yourAnswer} />: {r.selectedOptionId ? <Localized value={text(q, r.selectedOptionId)} markdown inline /> : <Localized value={DIAG.notAnswered} />}
              </p>
              <p className="text-emerald-800 dark:text-emerald-300">
                <Localized value={DIAG.correctAnswer} />: <Localized value={text(q, r.correctOptionId)} markdown inline />
              </p>
              {r.steps.map((st, k) => <Localized key={k} value={st} markdown as="div" className="mt-1 text-slate-700 dark:text-slate-200" />)}
            </li>
          );
        })}
      </ol>
    </details>
  );
}

/**
 * /starting-level — F7 "Find My Starting Level" for the student's target
 * exam. Optional and skippable; the result is a starting signal for Today's
 * Study, never practice history (the server marks it with nothing recorded).
 */
export default function DiagnosticPage() {
  const { status: authStatus, user } = useAuth();
  const source = useDataSource();
  const location = useLocation();
  const [load, setLoad] = useState({ status: 'loading' });
  const [view, setView] = useState('auto'); // auto | running | done
  const [test, setTest] = useState(null);
  const [review, setReview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!user) return undefined;
    let live = true;
    setLoad({ status: 'loading' });
    source.getDiagnostic().then(
      (data) => live && setLoad({ status: 'ready', data }),
      (err) => live && setLoad({ status: 'error', error: err }),
    );
    return () => {
      live = false;
    };
  }, [source, user, attempt]);

  const start = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const t = await source.startDiagnostic({ language: languageStore.get() });
      setTest(t);
      setReview(null);
      setView('running');
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }, [source]);

  const skip = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const data = await source.skipDiagnostic();
      setLoad({ status: 'ready', data });
      // The home page's offer card reads the same status from its cache.
      if (data?.exam?.code) updateCachedResource(`diagnostic:${data.exam.code}`, () => data);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }, [source]);

  const submit = useCallback(async (answers) => {
    setBusy(true);
    setError(null);
    try {
      const data = await source.submitDiagnostic({ testToken: test.testToken, answers });
      setReview({ questions: test.sections.flatMap((s) => s.questions), results: data.results });
      setLoad((l) => ({ status: 'ready', data: { ...(l.data ?? {}), state: 'completed', offer: false, result: data.result } }));
      if (data.exam?.code) {
        updateCachedResource(`diagnostic:${data.exam.code}`, (d) => ({ ...d, state: 'completed', offer: false, result: data.result }));
      }
      setView('done');
      window.scrollTo?.(0, 0);
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }, [source, test]);

  if (authStatus === 'ready' && !user) return <Navigate to={loginPath(location)} replace />;

  const data = load.data;
  let body;
  if (load.status === 'loading' || !user) {
    body = <div aria-busy="true" className="h-48 animate-pulse rounded-3xl bg-slate-100 motion-reduce:animate-none dark:bg-slate-800" />;
  } else if (load.status === 'error') {
    body = <LoadError error={load.error} onRetry={() => setAttempt((n) => n + 1)} />;
  } else if (data.state === 'no_target') {
    body = (
      <section className={card}>
        <Localized value={DIAG.noTarget} as="p" className="text-slate-700 dark:text-slate-200" />
        <Link to="/choose-exam?next=/starting-level" className={`${btn} mt-4 bg-indigo-600 text-white hover:bg-indigo-500`}>
          <Localized value={DIAG.chooseExam} />
        </Link>
      </section>
    );
  } else if (view === 'running' && test) {
    body = <Runner test={test} onSubmit={submit} submitting={busy} submitError={error} />;
  } else if ((view === 'done' || view === 'auto') && data.state === 'completed' && data.result) {
    body = <Result result={data.result} review={view === 'done' ? review : null} onRetake={start} />;
  } else {
    body = (
      <>
        <Intro status={data} onStart={start} onSkip={skip} busy={busy} />
        {data.state === 'skipped' && <Localized value={DIAG.later} as="p" className="mt-3 text-sm text-slate-500 dark:text-slate-400" />}
      </>
    );
  }

  return (
    <PageShell className="max-w-3xl pb-16 pt-6 sm:pt-10">
      <header className="mb-5">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
          <span aria-hidden="true">🧭 </span>
          <Localized value={DIAG.title} />
        </h1>
        {data?.result?.takenAt && view !== 'running' && (
          <Localized value={DIAG.takenOn(data.result.takenAt.slice(0, 10))} as="p" className="mt-1 text-sm text-slate-500 dark:text-slate-400" />
        )}
      </header>
      {error && view !== 'running' && (
        <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950/50 dark:text-red-200">{error.message}</p>
      )}
      {body}
    </PageShell>
  );
}

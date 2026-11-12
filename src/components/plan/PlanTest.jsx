import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDataSource } from '../../app/DataSourceContext';
import { languageStore } from '../../hooks/useLanguagePreference';
import { focusStore } from '../../lib/focusStore';
import { PLAN_UI } from '../../lib/planCopy';
import { MOCK } from '../../lib/i18n';
import { chapterLink } from '../../lib/studyPlan';
import PyqBadge from '../practice/PyqBadge';
import { Localized } from '../topic-hub/Localized';
import { LoadError } from '../../pages/funnel/FunnelLayout';

const btn = 'inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-bold';
const mmss = (s) => `${String(Math.floor(Math.max(0, s) / 60)).padStart(2, '0')}:${String(Math.max(0, s) % 60).padStart(2, '0')}`;

function Result({ data, questions, onClose, onRetake }) {
  const { summary } = data;
  const byId = new Map(questions.map((q) => [q.questionId, q]));
  const wrong = data.results.filter((r) => !r.isCorrect);
  const optionText = (q, id) => q?.options.find((o) => o.optionId === id)?.text;
  return (
    <div className="space-y-4">
      <Localized value={PLAN_UI.resultTitle} as="h3" className="text-lg font-bold text-slate-900 dark:text-white" />
      <p className="flex flex-wrap gap-x-4 gap-y-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
        <Localized value={PLAN_UI.score(summary.correct, summary.total)} />
        <Localized value={PLAN_UI.accuracy(summary.accuracy ?? 0)} />
        <Localized value={PLAN_UI.timeTaken(Math.round(summary.timeSec / 60))} />
        {summary.kind === 'full_mock' && <Localized value={PLAN_UI.marks(summary.marks)} />}
      </p>
      <ul className="grid gap-2 sm:grid-cols-3">
        {Object.entries(summary.bySubject).map(([s, v]) => (
          <li key={s} className="rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800/60">
            <Localized value={PLAN_UI.subjects[s] ?? { en: s }} className="font-semibold" />
            <span className="ml-2 tabular-nums">{v.correct}/{v.total} · {v.accuracy}%</span>
          </li>
        ))}
      </ul>
      {summary.weakTopics.length > 0 && (
        <div className="rounded-xl bg-rose-50 p-3 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:ring-rose-500/30">
          <Localized value={PLAN_UI.weakTopics} as="p" className="font-bold text-rose-900 dark:text-rose-200" />
          <ul className="mt-1 space-y-1 text-sm">
            {summary.weakTopics.map((w) => (
              <li key={`${w.subject}.${w.topic}`}>
                <Link to={chapterLink(w.subject, w.topic, 'revision')} className="font-semibold text-rose-800 underline dark:text-rose-200"><Localized value={w.name} /></Link> · {w.accuracy}%
              </li>
            ))}
          </ul>
        </div>
      )}
      {summary.strongTopics.length > 0 && (
        <p className="text-sm text-emerald-800 dark:text-emerald-300">
          <Localized value={PLAN_UI.strongTopics} />: {summary.strongTopics.map((s, i) => <span key={s.topic}>{i > 0 && ', '}<Localized value={s.name} /></span>)}
        </p>
      )}
      {wrong.length > 0 && (
        <details className="rounded-xl p-3 ring-1 ring-slate-200 dark:ring-slate-800">
          <summary className="cursor-pointer font-semibold text-slate-900 dark:text-white"><Localized value={PLAN_UI.wrongAnswers} /> ({wrong.length})</summary>
          <ol className="mt-3 space-y-4">
            {wrong.map((r) => {
              const q = byId.get(r.questionId);
              return (
                <li key={r.questionId} className="text-sm">
                  <Localized value={q?.stem} markdown as="div" className="font-medium text-slate-900 dark:text-white" />
                  <p className="mt-1 text-rose-800 dark:text-rose-300"><Localized value={PLAN_UI.yourAnswer} />: {r.selectedOptionId ? <Localized value={optionText(q, r.selectedOptionId)} markdown inline /> : <Localized value={PLAN_UI.notAnswered} />}</p>
                  <p className="text-emerald-800 dark:text-emerald-300"><Localized value={PLAN_UI.correctAnswer} />: <Localized value={optionText(q, r.correctOptionId)} markdown inline /></p>
                  {r.steps.map((st, i) => <Localized key={i} value={st} markdown as="div" className="mt-1 text-slate-700 dark:text-slate-200" />)}
                  {r.shortcut && <Localized value={r.shortcut} markdown as="div" className="mt-1 text-slate-600 dark:text-slate-300" />}
                </li>
              );
            })}
          </ol>
        </details>
      )}
      <Localized value={PLAN_UI.savedToNotebook} as="p" className="text-xs text-slate-500 dark:text-slate-400" />
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={onRetake} className={`${btn} text-indigo-700 ring-1 ring-slate-300 dark:text-indigo-300 dark:ring-slate-700`}><Localized value={PLAN_UI.retake} /></button>
        <button type="button" onClick={onClose} className={`${btn} bg-indigo-600 text-white`}><Localized value={PLAN_UI.close} /></button>
      </div>
    </div>
  );
}

/**
 * A plan day's test (daily mixed test, weekly test or full mock): one question at a time,
 * a countdown for full mocks (submitted automatically at zero), then the marked result.
 * @param {{ day: number, budget: number, onFinished: (data) => void, onClose: () => void }} props
 */
export default function PlanTest({ day, budget, onFinished, onClose }) {
  const source = useDataSource();
  const [state, setState] = useState({ status: 'loading' });
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState({});
  const [now, setNow] = useState(() => Date.now());
  const shownAt = useRef(Date.now());
  const spent = useRef({});
  const [attempt, setAttempt] = useState(0);
  const [paused, setPaused] = useState(false);
  const pausedAt = useRef(null);

  useEffect(() => {
    let live = true;
    setState({ status: 'loading' });
    setPicked({});
    setI(0);
    setPaused(false);
    pausedAt.current = null;
    spent.current = {};
    source.createPlanTest(day, { budget, language: languageStore.get() }).then(
      (test) => {
        if (!live) return;
        shownAt.current = Date.now();
        setState({ status: 'running', test, startedAt: Date.now(), questions: test.sections.flatMap((s) => s.questions.map((q) => ({ ...q, section: s.section }))) });
      },
      (error) => live && setState({ status: 'error', error }),
    );
    return () => {
      live = false;
    };
  }, [source, day, budget, attempt]);

  const questions = state.questions || [];
  const q = questions[i];
  const note = () => {
    if (!q) return;
    spent.current[q.questionId] = (spent.current[q.questionId] || 0) + (Date.now() - shownAt.current) / 1000;
    shownAt.current = Date.now();
  };
  const go = (to) => {
    note();
    setI(Math.max(0, Math.min(questions.length - 1, to)));
  };

  const submit = useCallback(async () => {
    if (state.status !== 'running') return;
    note();
    const answers = questions.map((x) => ({ questionId: x.questionId, selectedOptionId: picked[x.questionId] ?? null, timeSpentSec: Math.min(3600, Math.round(spent.current[x.questionId] || 0)) }));
    setState((s) => ({ ...s, status: 'checking' }));
    try {
      const data = await source.checkPlanTest(day, { testToken: state.test.testToken, answers });
      for (const r of data.results) if (r.selectedOptionId) focusStore.record(r.isCorrect);
      setState((s) => ({ ...s, status: 'done', data }));
      onFinished?.(data);
    } catch (error) {
      setState((s) => ({ ...s, status: 'running', submitError: error }));
    }
    // note() only reads refs, so it is not a dependency.
  }, [state.status, state.test, questions, picked, source, day, onFinished]);

  // Pause (timed tests): freeze the countdown and the current question's
  // clock; on resume both clocks shift by the paused span, so paused time
  // never counts against the student.
  const pauseTest = () => {
    if (paused || state.status !== 'running') return;
    pausedAt.current = Date.now();
    setPaused(true);
  };
  const resumeTest = () => {
    if (!paused) return;
    const shift = Date.now() - (pausedAt.current ?? Date.now());
    pausedAt.current = null;
    setState((s) => (s.startedAt ? { ...s, startedAt: s.startedAt + shift } : s));
    shownAt.current += shift;
    setNow(Date.now());
    setPaused(false);
  };

  // Full mock: a countdown that submits the test at zero.
  const timed = state.test?.timed;
  const left = timed ? state.test.minutes * 60 - Math.floor((now - state.startedAt) / 1000) : null;
  useEffect(() => {
    if (!timed || state.status !== 'running' || paused) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [timed, state.status, paused]);
  useEffect(() => {
    if (timed && !paused && left != null && left <= 0 && state.status === 'running') submit();
  }, [timed, paused, left, state.status, submit]);

  if (state.status === 'loading') return <div aria-busy="true" className="h-40 animate-pulse rounded-2xl bg-slate-100 motion-reduce:animate-none dark:bg-slate-800" />;
  if (state.status === 'error') return <LoadError error={state.error} onRetry={() => setAttempt((n) => n + 1)} />;
  if (state.status === 'done') return <Result data={state.data} questions={questions} onClose={onClose} onRetake={() => setAttempt((n) => n + 1)} />;

  const answered = Object.keys(picked).length;
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className="font-semibold text-slate-600 dark:text-slate-300">
          <Localized value={PLAN_UI.section[q.section]} /> · <Localized value={PLAN_UI.questionOf(i + 1, questions.length)} />
        </span>
        {timed && <span className={`font-mono font-bold tabular-nums ${left < 300 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`} aria-label={PLAN_UI.timeLeft.en}>⏱ {mmss(left)}</span>}
        {timed && (
          <button type="button" onClick={paused ? resumeTest : pauseTest} className="rounded-full px-3 py-1 font-bold ring-1 ring-slate-300 hover:bg-slate-50 dark:ring-slate-700 dark:hover:bg-slate-800">
            {paused ? '▶' : '⏸'} <Localized value={paused ? MOCK.resume : MOCK.pause} />
          </button>
        )}
        <Localized value={PLAN_UI.answeredCount(answered, questions.length)} className="text-slate-500" />
      </div>
      {paused && (
        <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-amber-50 px-4 py-3 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:ring-amber-500/30">
          <div>
            <p className="font-bold text-amber-900 dark:text-amber-200">⏸ <Localized value={MOCK.pausedTitle} inline /></p>
            <Localized value={MOCK.pausedHint} as="p" className="text-sm text-amber-800 dark:text-amber-300" />
          </div>
          <button type="button" onClick={resumeTest} className={`${btn} bg-indigo-600 text-white hover:bg-indigo-500`}>
            ▶ <Localized value={MOCK.resume} />
          </button>
        </div>
      )}
      <>
      <div className="flex flex-wrap gap-2"><PyqBadge refs={q.pyq} /></div>
      <Localized value={q.stem} markdown as="div" className="text-lg font-medium text-slate-900 dark:text-white" />
      <div role="radiogroup" aria-label={PLAN_UI.questionOf(i + 1, questions.length).en} className="space-y-2">
        {q.options.map((o, k) => (
          <button
            key={o.optionId}
            type="button"
            role="radio"
            aria-checked={picked[q.questionId] === o.optionId}
            onClick={() => setPicked((p) => ({ ...p, [q.questionId]: o.optionId }))}
            className={`flex w-full items-start gap-3 rounded-xl p-3 text-left ring-1 ${picked[q.questionId] === o.optionId ? 'bg-indigo-50 ring-indigo-500 dark:bg-indigo-500/15' : 'bg-white ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:ring-slate-700'}`}
          >
            <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-sm font-bold dark:bg-slate-800">{'ABCD'[k]}</span>
            <Localized value={o.text} markdown inline />
          </button>
        ))}
      </div>
      {state.submitError && <p role="alert" className="text-sm text-rose-700">{state.submitError.message}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={i === 0} onClick={() => go(i - 1)} className={`${btn} ring-1 ring-slate-300 disabled:opacity-40 dark:ring-slate-700`}><Localized value={PLAN_UI.prev} /></button>
        {i < questions.length - 1 && <button type="button" onClick={() => go(i + 1)} className={`${btn} bg-slate-900 text-white dark:bg-white dark:text-slate-900`}><Localized value={PLAN_UI.next} /></button>}
        <button type="button" onClick={submit} disabled={state.status === 'checking'} className={`${btn} ml-auto bg-emerald-600 text-white disabled:opacity-60`}>
          <Localized value={state.status === 'checking' ? PLAN_UI.checking : PLAN_UI.submit} />
        </button>
      </div>
      </>
    </div>
  );
}

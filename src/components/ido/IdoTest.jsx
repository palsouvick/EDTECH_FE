import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDataSource } from '../../app/DataSourceContext';
import { languageStore } from '../../hooks/useLanguagePreference';
import { PLAN_UI } from '../../lib/planCopy';
import { IDO_UI } from '../../lib/idoCopy';
import { chapterLink } from '../../lib/studyPlan';
import PyqBadge from '../practice/PyqBadge';
import { Localized } from '../topic-hub/Localized';
import { LoadError } from '../../pages/funnel/FunnelLayout';

const btn = 'inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-bold';
const mmss = (s) => `${String(Math.floor(Math.max(0, s) / 60)).padStart(2, '0')}:${String(Math.max(0, Math.floor(s % 60))).padStart(2, '0')}`;

function Result({ data, questions, test, onClose, onRetake }) {
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
        {test.negativeMarking > 0 && <span>· {summary.marks} / {summary.maxMarks ?? summary.total}</span>}
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
                <span className="block text-xs text-rose-700 dark:text-rose-300"><Localized value={IDO_UI.weakAction(w.name?.en ?? w.topic)} /></span>
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
 * An IDO test (plan day test, sectional test or full mock): one question at a
 * time, section by section, a countdown when the test is timed (submitted
 * automatically at zero), then the marked result with weak topics.
 * @param {{ createTest: (source: object) => Promise<object>, onFinished?: (data: object) => void, onClose: () => void }} props
 */
export default function IdoTest({ createTest, onFinished, onClose }) {
  const source = useDataSource();
  const [state, setState] = useState({ status: 'loading' });
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState({});
  const [now, setNow] = useState(() => Date.now());
  const shownAt = useRef(Date.now());
  const spent = useRef({});
  const [attempt, setAttempt] = useState(0);
  const submitted = useRef(false);

  useEffect(() => {
    let live = true;
    setState({ status: 'loading' });
    setPicked({});
    setI(0);
    spent.current = {};
    submitted.current = false;
    createTest(source).then(
      (test) => {
        if (!live) return;
        shownAt.current = Date.now();
        setState({ status: 'running', test, startedAt: Date.now(), questions: test.sections.flatMap((s) => s.questions.map((q) => ({ ...q, section: s.section, sectionTitle: s.title }))) });
      },
      (error) => live && setState({ status: 'error', error }),
    );
    return () => { live = false; };
  }, [source, createTest, attempt]);

  const questions = state.questions || [];
  const test = state.test;
  const timed = Boolean(test?.timed && test?.minutes);
  const totalSec = timed ? test.minutes * 60 : 0;
  const elapsed = state.startedAt ? Math.floor((now - state.startedAt) / 1000) : 0;
  const left = totalSec - elapsed;

  const submit = useCallback(async () => {
    if (submitted.current || state.status !== 'running') return;
    submitted.current = true;
    const answers = questions.map((q) => ({ questionId: q.questionId, selectedOptionId: picked[q.questionId] ?? null, timeSpentSec: spent.current[q.questionId] ?? 0 }));
    setState((s) => ({ ...s, status: 'checking' }));
    try {
      const data = await source.checkIdoTest({ testToken: test.testToken, answers });
      setState({ status: 'done', test, questions, data });
      onFinished?.(data);
    } catch (error) {
      submitted.current = false;
      setState((s) => ({ ...s, status: 'running', error }));
    }
  }, [state.status, questions, picked, source, test, onFinished]);

  useEffect(() => {
    if (state.status !== 'running') return undefined;
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, [state.status]);

  useEffect(() => {
    if (timed && state.status === 'running' && left <= 0) submit();
  }, [timed, left, state.status, submit]);

  if (state.status === 'loading') return <p className="py-8 text-center text-sm text-slate-500">…</p>;
  if (state.status === 'error' && !test) return <LoadError error={state.error} onRetry={() => setAttempt((a) => a + 1)} />;
  if (state.status === 'done') return <Result data={state.data} questions={questions} test={test} onClose={onClose} onRetake={() => setAttempt((a) => a + 1)} />;

  const q = questions[i];
  if (!q) return <LoadError error={new Error('No questions')} onRetry={() => setAttempt((a) => a + 1)} />;
  const answeredCount = Object.values(picked).filter(Boolean).length;

  const go = (next) => {
    spent.current[q.questionId] = (spent.current[q.questionId] ?? 0) + Math.max(0, Math.round((Date.now() - shownAt.current) / 1000));
    shownAt.current = Date.now();
    setI(Math.min(questions.length - 1, Math.max(0, next)));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-semibold text-slate-800 dark:text-slate-100">
        <span className="tabular-nums">{i + 1} / {questions.length}</span>
        {q.sectionTitle && <Localized value={q.sectionTitle} className="text-slate-500 dark:text-slate-400" />}
        {timed ? <span className={`tabular-nums ${left < 300 ? 'text-rose-600' : ''}`}>{mmss(left)}</span> : <span className="tabular-nums">{mmss(elapsed)}</span>}
        {test.negativeMarking > 0 && <span className="text-rose-700 dark:text-rose-300">−{test.negativeMarking}</span>}
        <span className="text-slate-500 dark:text-slate-400">{answeredCount} ✓</span>
      </div>
      {state.error && <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-800 dark:bg-rose-500/10 dark:text-rose-200">{String(state.error.message ?? state.error)}</p>}
      <div>
        <Localized value={q.stem} markdown as="div" className="text-base font-medium text-slate-900 dark:text-white" />
        {q.pyq && <div className="mt-1"><PyqBadge pyq={q.pyq} /></div>}
        <div className="mt-3 grid gap-2">
          {q.options.map((o) => {
            const active = picked[q.questionId] === o.optionId;
            return (
              <button
                key={o.optionId}
                type="button"
                aria-pressed={active}
                onClick={() => setPicked((p) => ({ ...p, [q.questionId]: o.optionId }))}
                className={`min-h-11 rounded-xl px-4 py-2 text-left text-sm ring-1 transition-colors ${active ? 'bg-indigo-600 text-white ring-indigo-600' : 'bg-white text-slate-800 ring-slate-200 hover:bg-indigo-50 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700'}`}
              >
                <Localized value={o.text} markdown inline />
              </button>
            );
          })}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" disabled={i === 0} onClick={() => go(i - 1)} className={`${btn} ring-1 ring-slate-300 disabled:opacity-40 dark:ring-slate-700`}>←</button>
        <button type="button" disabled={i === questions.length - 1} onClick={() => go(i + 1)} className={`${btn} ring-1 ring-slate-300 disabled:opacity-40 dark:ring-slate-700`}>→</button>
        <button type="button" onClick={submit} disabled={state.status === 'checking'} className={`${btn} ml-auto bg-emerald-600 text-white disabled:opacity-50`}>
          {state.status === 'checking' ? '…' : <Localized value={PLAN_UI.submit ?? { en: 'Submit', bn: 'জমা দাও' }} />}
        </button>
        <button type="button" onClick={onClose} className={`${btn} text-slate-600 ring-1 ring-slate-200 dark:text-slate-300 dark:ring-slate-700`}><Localized value={PLAN_UI.close} /></button>
      </div>
      <div className="flex flex-wrap gap-1">
        {questions.map((qq, idx) => (
          <button
            key={qq.questionId}
            type="button"
            aria-label={`Question ${idx + 1}`}
            onClick={() => go(idx)}
            className={`size-7 rounded-md text-xs font-semibold tabular-nums ${idx === i ? 'bg-indigo-600 text-white' : picked[qq.questionId] ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}
          >
            {idx + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

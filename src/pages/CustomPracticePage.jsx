import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useDataSource } from '../app/DataSourceContext';
import { CT, withNames } from '../lib/customTestCopy';
import { learnPaths } from '../lib/routes';
import PageShell from '../components/navigation/PageShell';
import PyqBadge from '../components/practice/PyqBadge';
import { Localized } from '../components/topic-hub/Localized';
import CustomTestResult, { reviseLink } from '../components/custom-test/CustomTestResult';
import { LoadError } from './funnel/FunnelLayout';

const btn = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50';

function Feedback({ fb, q, subject }) {
  const letter = (id) => 'ABCD'[q.options.findIndex((o) => o.optionId === id)];
  const trap = fb.explanation.traps.find((t) => t.optionId && t.optionId === fb.selectedOptionId);
  return (
    <div role="status" className={`space-y-3 rounded-2xl p-4 ring-1 ${fb.isCorrect ? 'bg-emerald-50 ring-emerald-200 dark:bg-emerald-500/10 dark:ring-emerald-500/30' : 'bg-rose-50 ring-rose-200 dark:bg-rose-500/10 dark:ring-rose-500/30'}`}>
      <Localized value={fb.isCorrect ? CT.correct : CT.wrong} as="p" className="text-lg font-extrabold text-slate-900 dark:text-white" />
      {!fb.isCorrect && (
        <p className="text-sm">
          <Localized value={CT.correctIs} className="font-semibold" />: <b>{letter(fb.correctOptionId)}</b>{' '}
          <Localized value={q.options.find((o) => o.optionId === fb.correctOptionId)?.text} markdown inline />
        </p>
      )}
      {trap?.note && <p className="text-sm text-rose-900 dark:text-rose-100"><Localized value={CT.trap} className="font-semibold" />: <Localized value={trap.note} markdown inline /></p>}
      <div className="text-sm">
        <Localized value={CT.explanation} as="p" className="font-bold text-slate-900 dark:text-white" />
        {fb.explanation.steps.length
          ? fb.explanation.steps.map((st, i) => <Localized key={i} value={st} markdown as="div" className="mt-1 text-slate-800 dark:text-slate-100" />)
          : <Localized value={CT.noExplanation} as="p" className="text-slate-500" />}
      </div>
      {fb.explanation.shortcut && (
        <div className="text-sm">
          <Localized value={CT.shortcut} as="p" className="font-bold text-amber-800 dark:text-amber-200" />
          <Localized value={fb.explanation.shortcut} markdown as="div" className="text-slate-800 dark:text-slate-100" />
        </div>
      )}
      <p className="text-sm">
        <Localized value={CT.relatedConcept} className="font-bold" />: <Localized value={fb.concept.name} />
        {fb.concept.pattern && <> · <Localized value={fb.concept.pattern} /></>}
        {' · '}
        {/* A new tab, so the test stays where it is (it can also be resumed later). */}
        <a href={reviseLink(subject, fb.concept.topic)} target="_blank" rel="noopener" className="font-semibold text-indigo-700 underline dark:text-indigo-300">
          <Localized value={withNames(CT.reviseBtn, fb.concept.name)} /> ↗
        </a>
      </p>
    </div>
  );
}

/**
 * /practice/custom/:sessionId — a custom test in Learning practice mode: one question at a
 * time; Check shows right/wrong, the explanation, the shortcut and the related concept. The
 * first answer checked is final (the server keeps it). Finish submits and shows the result.
 * Reloading resumes: answers already checked come back from the server.
 */
export default function CustomPracticePage() {
  const { sessionId } = useParams();
  const source = useDataSource();
  const [view, setView] = useState({ status: 'loading' });
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState({});
  const [feedback, setFeedback] = useState({});
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const shownAt = useRef(Date.now());
  const spent = useRef({});
  const valid = /^[a-f\d]{24}$/i.test(sessionId);

  useEffect(() => {
    if (!valid) return undefined;
    let live = true;
    source.getMockSession(sessionId).then(
      (s) => {
        if (!live) return;
        if (s.status === 'SUBMITTED') return setView({ status: 'result' });
        const checked = s.custom?.checked ?? {};
        setPicked(checked);
        const firstOpen = s.questions.findIndex((q) => !checked[q.questionId]);
        setI(firstOpen === -1 ? s.questions.length - 1 : firstOpen);
        shownAt.current = Date.now();
        setView({ status: 'running', session: s, startedAt: Date.now() });
      },
      (err) => live && setView({ status: err.code === 'SESSION_EXPIRED' ? 'expired' : 'error', error: err }),
    );
    return () => {
      live = false;
    };
  }, [source, sessionId, attempt, valid]);

  useEffect(() => {
    if (view.status !== 'running') return undefined;
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - view.startedAt) / 1000)), 1000);
    return () => clearInterval(id);
  }, [view]);

  const questions = view.session?.questions ?? [];
  const q = questions[i];
  const subject = view.session?.config.subject;

  // Reopening a question already checked (after a reload) fetches its stored feedback again.
  useEffect(() => {
    if (!q || feedback[q.questionId] || !view.session?.custom?.checked?.[q.questionId]) return;
    source.checkCustomAnswer(sessionId, { questionId: q.questionId, selectedOptionId: view.session.custom.checked[q.questionId] }).then(
      (fb) => setFeedback((f) => ({ ...f, [q.questionId]: fb })),
      () => {},
    );
  }, [q, feedback, view.session, source, sessionId]);

  const note = () => {
    if (!q) return;
    spent.current[q.questionId] = (spent.current[q.questionId] || 0) + (Date.now() - shownAt.current) / 1000;
    shownAt.current = Date.now();
  };
  const go = (to) => {
    note();
    setError(null);
    setI(Math.max(0, Math.min(questions.length - 1, to)));
  };

  const check = async () => {
    if (!q || !picked[q.questionId]) return;
    setChecking(true);
    setError(null);
    try {
      const fb = await source.checkCustomAnswer(sessionId, { questionId: q.questionId, selectedOptionId: picked[q.questionId] });
      setFeedback((f) => ({ ...f, [q.questionId]: fb }));
      setPicked((p) => ({ ...p, [q.questionId]: fb.selectedOptionId }));
    } catch (e) {
      setError(e);
    } finally {
      setChecking(false);
    }
  };

  const finish = useCallback(async () => {
    note();
    setView((v) => ({ ...v, submitting: true }));
    try {
      await source.submitMock({
        sessionId,
        responses: questions.map((x) => ({
          questionId: x.questionId,
          // Only checked answers count in practice mode; the server keeps them in any case.
          selectedOptionId: feedback[x.questionId]?.selectedOptionId ?? view.session?.custom?.checked?.[x.questionId] ?? null,
          timeSpentSec: Math.min(3 * 3600, Math.round(spent.current[x.questionId] || 0)),
        })),
      });
      setView({ status: 'result' });
    } catch (e) {
      setError(e);
      setView((v) => ({ ...v, submitting: false }));
    }
    // note() only touches refs.
  }, [source, sessionId, questions, feedback, view.session]);

  if (!valid) return <Navigate to="/learn" replace />;
  if (view.status === 'result') return <CustomTestResult sessionId={sessionId} />;

  return (
    <PageShell className="max-w-3xl pb-16 pt-6 sm:pt-8">
      {view.status === 'loading' && <div aria-busy="true" className="h-72 animate-pulse rounded-2xl bg-slate-200/70 motion-reduce:animate-none dark:bg-slate-800/70" />}
      {view.status === 'error' && <LoadError error={view.error} onRetry={() => setAttempt((n) => n + 1)} />}
      {view.status === 'expired' && (
        <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          <Localized value={CT.expired} as="p" className="font-semibold" />
          <Link to="/learn" className={`${btn} mt-4 bg-indigo-600 text-white`}><Localized value={CT.backToLearn} /></Link>
        </div>
      )}
      {view.status === 'running' && q && (
        <div className="space-y-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-6 dark:bg-slate-900 dark:ring-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-bold text-indigo-700 dark:text-indigo-300">{CT.modes.practice.icon} <Localized value={CT.modes.practice.label} /></span>
            <span className="font-semibold text-slate-600 dark:text-slate-300"><Localized value={CT.questionOf(i + 1, questions.length)} /></span>
            <span className="font-mono tabular-nums text-slate-600 dark:text-slate-300">
              ⏱ {String(Math.floor(elapsed / 60)).padStart(2, '0')}:{String(elapsed % 60).padStart(2, '0')} · <Localized value={CT.targetTime(view.session.config.timeLimitMinutes)} />
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" aria-hidden="true">
            <div className="h-full rounded-full bg-indigo-500" style={{ width: `${(Object.keys(feedback).length / questions.length) * 100}%` }} />
          </div>
          <div className="flex flex-wrap gap-2"><PyqBadge refs={q.pyq} /></div>
          <Localized value={q.stem} markdown as="div" className="text-lg font-medium text-slate-900 dark:text-white" />
          <div role="radiogroup" aria-label={CT.questionOf(i + 1, questions.length).en} className="space-y-2">
            {q.options.map((o, k) => {
              const fb = feedback[q.questionId];
              const mine = picked[q.questionId] === o.optionId;
              const tone = fb
                ? o.optionId === fb.correctOptionId
                  ? 'bg-emerald-50 ring-2 ring-emerald-500 dark:bg-emerald-500/15'
                  : mine
                    ? 'bg-rose-50 ring-2 ring-rose-500 dark:bg-rose-500/15'
                    : 'bg-white ring-slate-200 opacity-70 dark:bg-slate-900 dark:ring-slate-700'
                : mine
                  ? 'bg-indigo-50 ring-2 ring-indigo-500 dark:bg-indigo-500/15'
                  : 'bg-white ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:ring-slate-700';
              return (
                <button
                  key={o.optionId}
                  type="button"
                  role="radio"
                  aria-checked={mine}
                  disabled={Boolean(fb)}
                  onClick={() => setPicked((p) => ({ ...p, [q.questionId]: o.optionId }))}
                  className={`flex w-full items-start gap-3 rounded-xl p-3 text-left ring-1 ${tone}`}
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-sm font-bold dark:bg-slate-800">{'ABCD'[k]}</span>
                  <Localized value={o.text} markdown inline />
                </button>
              );
            })}
          </div>
          {feedback[q.questionId] && <Feedback fb={feedback[q.questionId]} q={q} subject={subject} />}
          {error && <p role="alert" className="text-sm font-semibold text-rose-700 dark:text-rose-300">{error.message}</p>}
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => go(i - 1)} disabled={i === 0} className={`${btn} ring-1 ring-slate-300 dark:ring-slate-700`}>← <Localized value={CT.back} /></button>
            {!feedback[q.questionId] && (
              <>
                <button type="button" onClick={check} disabled={!picked[q.questionId] || checking} className={`${btn} bg-indigo-600 text-white hover:bg-indigo-500`}>
                  <Localized value={checking ? CT.checking : CT.check} />
                </button>
                {i < questions.length - 1 && <button type="button" onClick={() => go(i + 1)} className={`${btn} ring-1 ring-slate-300 dark:ring-slate-700`}><Localized value={CT.skip} /></button>}
              </>
            )}
            {feedback[q.questionId] && i < questions.length - 1 && (
              <button type="button" onClick={() => go(i + 1)} className={`${btn} bg-slate-900 text-white dark:bg-white dark:text-slate-900`}><Localized value={CT.nextQuestion} /></button>
            )}
            <button type="button" onClick={finish} disabled={view.submitting} className={`${btn} ml-auto bg-emerald-600 text-white hover:bg-emerald-500`}>
              <Localized value={view.submitting ? CT.checking : CT.finish} />
            </button>
          </div>
          <Link to={learnPaths.subject(subject)} className="inline-block text-sm text-slate-500 hover:underline"><Localized value={CT.backToLearn} /></Link>
        </div>
      )}
    </PageShell>
  );
}

import { useCallback, useEffect, useRef, useState } from 'react';
import { StuckButton, StuckPanel } from '../components/mock/StuckControls';
import { STUCK } from '../lib/i18n';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useDataSource } from '../app/DataSourceContext';
import { CT } from '../lib/customTestCopy';
import { learnPaths } from '../lib/routes';
import PageShell from '../components/navigation/PageShell';
import PyqBadge from '../components/practice/PyqBadge';
import { PracticeTypeChip } from '../components/analysis/AdaptiveParts';
import { Localized } from '../components/topic-hub/Localized';
import CustomTestResult from '../components/custom-test/CustomTestResult';
import AnswerFeedback from '../components/custom-test/AnswerFeedback';
import SubmitConfirmDialog from '../components/practice/SubmitConfirmDialog';
import { LoadError } from './funnel/FunnelLayout';

const btn = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-50';

/**
 * /practice/custom/:sessionId — a custom test in Learning practice mode: one question at a
 * time; Check shows right/wrong, the explanation, the shortcut and the related concept. The
 * first answer checked is final (the server keeps it). Finish submits and shows the result.
 * Reloading resumes: answers already checked come back from the server.
 */
// Math "I'm Stuck" in practice-mode tests (Smart Quiz, adaptive, chapter practice...), as on the
// mock screen: a learning signal sent next to the answer, never part of the score.
const STUCK_SUBJECTS = new Set(['quant']);
const STUCK_REASONS = new Set(Object.keys(STUCK.reasons));
const stuckKey = (id) => `edtech:practice-stuck:${id}`;
function readStuck(id) {
  try {
    return JSON.parse(localStorage.getItem(stuckKey(id)) || '{}') || {};
  } catch {
    return {};
  }
}

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
  // qid -> { reason, timeMs, markedAt }; kept on this device so a reload does not lose it.
  const [stuck, setStuck] = useState(() => (valid ? readStuck(sessionId) : {}));
  const [askingStuck, setAskingStuck] = useState(false);
  useEffect(() => {
    if (!valid) return;
    try {
      localStorage.setItem(stuckKey(sessionId), JSON.stringify(stuck));
    } catch {
      /* private mode: kept in memory only */
    }
  }, [stuck, sessionId, valid]);

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
  const stuckOn = STUCK_SUBJECTS.has(subject);
  useEffect(() => setAskingStuck(false), [i]);
  const markStuck = () => {
    if (!q || stuck[q.questionId]) return;
    const timeMs = Math.round(((spent.current[q.questionId] || 0) + (Date.now() - shownAt.current) / 1000) * 1000);
    setStuck((s) => ({ ...s, [q.questionId]: { reason: null, timeMs, markedAt: new Date().toISOString() } }));
    setAskingStuck(true);
  };
  const stuckReason = (reason) => {
    if (!q) return;
    setStuck((s) => (s[q.questionId] ? { ...s, [q.questionId]: { ...s[q.questionId], reason: STUCK_REASONS.has(reason) ? reason : null } } : s));
    setAskingStuck(false);
  };
  const unstuck = () => {
    if (!q) return;
    setStuck((s) => {
      const next = { ...s };
      delete next[q.questionId];
      return next;
    });
    setAskingStuck(false);
  };

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

  const [confirming, setConfirming] = useState(false);
  // Answered = checked in this visit or before (resumed from the server).
  const answered = questions.filter((x) => feedback[x.questionId] || view.session?.custom?.checked?.[x.questionId]).length;

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
          ...(stuckOn && stuck[x.questionId] && {
            stuck: { reason: stuck[x.questionId].reason ?? null, timeBeforeSec: Math.round((stuck[x.questionId].timeMs || 0) / 100) / 10, markedAt: stuck[x.questionId].markedAt ?? null },
          }),
        })),
      });
      try {
        localStorage.removeItem(stuckKey(sessionId));
      } catch {
        /* ignore */
      }
      setView({ status: 'result' });
    } catch (e) {
      setError(e);
      setView((v) => ({ ...v, submitting: false }));
    }
    // note() only touches refs.
  }, [source, sessionId, questions, feedback, view.session, stuck, stuckOn]);

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
          <div className="flex flex-wrap items-center gap-2">
            <PracticeTypeChip type={q.practiceType} />
            <PyqBadge refs={q.pyq} />
            {stuckOn && (
              <StuckButton
                stuck={stuck[q.questionId]}
                // Before the answer is checked; once checked, a stuck mark can still be opened or undone.
                disabled={Boolean(feedback[q.questionId]) && !stuck[q.questionId]}
                onClick={stuck[q.questionId] ? () => setAskingStuck((v) => !v) : markStuck}
              />
            )}
          </div>
          {stuckOn && (
            <StuckPanel
              stuck={stuck[q.questionId]}
              asking={askingStuck}
              disabled={false}
              onReason={stuckReason}
              onContinue={() => setAskingStuck(false)}
              onAsk={() => setAskingStuck(true)}
              onUndo={unstuck}
            />
          )}
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
          {feedback[q.questionId] && <AnswerFeedback fb={feedback[q.questionId]} q={q} subject={subject} />}
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
            <button type="button" onClick={() => setConfirming(true)} disabled={view.submitting} className={`${btn} ml-auto bg-emerald-600 text-white hover:bg-emerald-500`}>
              <Localized value={view.submitting ? CT.checking : CT.finish} />
            </button>
          </div>
          {/* Finishing ends the test for good, so it asks first (a stray click must not end it). */}
          <SubmitConfirmDialog
            open={confirming}
            onClose={() => setConfirming(false)}
            onConfirm={() => {
              setConfirming(false);
              finish();
            }}
            total={questions.length}
            answered={answered}
            onGoToUnanswered={() => {
              setConfirming(false);
              const first = questions.findIndex((x) => !(feedback[x.questionId] || view.session?.custom?.checked?.[x.questionId]));
              if (first >= 0) go(first);
            }}
          />
          <Link to={learnPaths.subject(subject)} className="inline-block text-sm text-slate-500 hover:underline"><Localized value={CT.backToLearn} /></Link>
        </div>
      )}
    </PageShell>
  );
}

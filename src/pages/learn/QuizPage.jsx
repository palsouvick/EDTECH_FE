import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useDataSource } from '../../app/DataSourceContext';
import { LEARN, QUIZ_LEVELS, TONES } from '../../lib/learnCopy';
import { levelProgress, recordQuiz } from '../../lib/learnProgress';
import { QUIZ_LEVEL_CODES, codeFromSlug, learnPaths, subjectCodeFromSlug } from '../../lib/routes';
import PageShell from '../../components/navigation/PageShell';
import OptionButton, { OPTION_LETTERS } from '../../components/practice/OptionButton';
import { Localized } from '../../components/topic-hub/Localized';
import { CheckIcon, XIcon } from '../../components/topic-hub/icons';
import { LoadError } from '../funnel/FunnelLayout';

const fmt = (ms) => {
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
};

/** Countdown for timed (advanced) quizzes, from a fixed deadline so it never drifts. */
function useCountdown(deadline, onExpire) {
  const [now, setNow] = useState(() => Date.now());
  const expire = useRef(onExpire);
  expire.current = onExpire;
  useEffect(() => {
    if (!deadline) return undefined;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (t >= deadline) {
        clearInterval(id);
        expire.current();
      }
    }, 250);
    return () => clearInterval(id);
  }, [deadline]);
  return deadline ? Math.max(0, deadline - now) : null;
}

function QuestionCard({ question, selected, onSelect }) {
  return (
    <article className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6 dark:bg-slate-900 dark:ring-slate-800">
      <Localized value={question.stem} markdown as="div" className="text-lg font-medium leading-relaxed text-slate-900 dark:text-white" />
      {question.media?.map((m) => (
        <img key={m.url} src={m.url} alt={m.alt?.en ?? ''} className="mt-3 max-h-72 max-w-full rounded-lg" />
      ))}
      <div role="radiogroup" aria-label={LEARN.answer.en} className="mt-5 space-y-3">
        {question.options.map((o, i) => (
          <OptionButton
            key={o.optionId}
            option={o}
            index={i}
            status={selected === o.optionId ? 'selected' : 'idle'}
            checked={selected === o.optionId}
            focusable
            onSelect={onSelect}
          />
        ))}
      </div>
    </article>
  );
}

function ReviewItem({ question, result, n }) {
  const state = !result.selectedOptionId ? 'skipped' : result.isCorrect ? 'right' : 'wrong';
  const badge = {
    right: ['bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300', LEARN.right],
    wrong: ['bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300', LEARN.wrong],
    skipped: ['bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300', LEARN.skipped],
  }[state];
  return (
    <li className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6 dark:bg-slate-900 dark:ring-slate-800">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-slate-500">#{n}</span>
        <Localized value={badge[1]} className={`rounded-full px-3 py-0.5 text-sm font-bold ${badge[0]}`} />
      </div>
      <Localized value={question.stem} markdown as="div" className="mt-2 font-medium leading-relaxed text-slate-900 dark:text-white" />
      <ul className="mt-4 space-y-2">
        {question.options.map((o, i) => {
          const isAnswer = o.optionId === result.correctOptionId;
          const isMine = o.optionId === result.selectedOptionId;
          const tone = isAnswer
            ? 'border-emerald-500 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-500/10'
            : isMine
              ? 'border-rose-500 bg-rose-50 dark:border-rose-400 dark:bg-rose-500/10'
              : 'border-slate-200 dark:border-slate-700';
          return (
            <li key={o.optionId} className={`flex items-center gap-3 rounded-xl border-2 px-3 py-2.5 ${tone}`}>
              <span className="grid size-7 shrink-0 place-items-center rounded-md border border-current text-sm font-bold text-slate-500">{OPTION_LETTERS[i]}</span>
              <span className="min-w-0 flex-1 text-slate-800 dark:text-slate-100">
                <Localized value={o.text} markdown inline />
              </span>
              {isMine && (
                <Localized value={LEARN.yourAnswer} className="hidden shrink-0 text-xs font-semibold text-slate-500 sm:inline" />
              )}
              {isAnswer && (
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-emerald-500 text-white" title={LEARN.correctAnswer.en}>
                  <CheckIcon width={14} height={14} strokeWidth={3} />
                </span>
              )}
              {isMine && !isAnswer && (
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-rose-500 text-white">
                  <XIcon width={14} height={14} strokeWidth={3} />
                </span>
              )}
            </li>
          );
        })}
      </ul>
      {result.trapForSelected && (
        <div className="mt-4 rounded-xl bg-rose-50 p-3 text-sm text-rose-950 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-100 dark:ring-rose-500/30">
          <Localized value={LEARN.whyWrong} as="p" className="font-bold" />
          <Localized value={result.trapForSelected} markdown as="div" className="mt-1" />
        </div>
      )}
      {result.steps.length > 0 && (
        <div className="mt-4 rounded-xl bg-indigo-50/70 p-4 ring-1 ring-indigo-100 dark:bg-indigo-500/5 dark:ring-indigo-500/20">
          <Localized value={LEARN.explanation} as="p" className="font-bold text-indigo-900 dark:text-indigo-200" />
          <ol className="mt-2 space-y-2">
            {result.steps.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-indigo-600 text-xs font-bold text-white">{i + 1}</span>
                <Localized value={s} markdown as="div" className="min-w-0 flex-1 text-slate-700 dark:text-slate-200" />
              </li>
            ))}
          </ol>
        </div>
      )}
      {(question.patternName || question.difficultyLabel) && (
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          {question.patternName && (
            <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              <Localized value={question.patternName} />
            </span>
          )}
          {question.difficultyLabel && (
            <span className="rounded-full bg-violet-100 px-3 py-1 font-medium text-violet-800 dark:bg-violet-500/15 dark:text-violet-200">
              <Localized value={question.difficultyLabel} />
            </span>
          )}
        </div>
      )}
      {result.shortcut && (
        <div className="mt-3 rounded-xl bg-amber-50 p-3 text-sm text-amber-950 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-100 dark:ring-amber-500/30">
          <span aria-hidden="true">⚡ </span>
          <Localized value={LEARN.shortcut} className="font-bold" />: <Localized value={result.shortcut} markdown inline />
        </div>
      )}
    </li>
  );
}

function Results({ subject, topic, level, quiz, outcome, timedOut, onRetry }) {
  const [onlyWrong, setOnlyWrong] = useState(false);
  const { correct, total } = outcome.score;
  const pct = total ? Math.round((correct / total) * 100) : 0;
  const byId = new Map(quiz.questions.map((q) => [q.questionId, q]));
  const nextLevel = QUIZ_LEVEL_CODES[QUIZ_LEVEL_CODES.indexOf(level) + 1];
  const items = outcome.results.map((r, i) => ({ r, n: i + 1 })).filter(({ r }) => !onlyWrong || !r.isCorrect);

  return (
    <div className="space-y-6">
      {timedOut && <Localized value={LEARN.timeUp} as="p" role="status" className="rounded-xl bg-amber-100 px-4 py-3 font-semibold text-amber-900 dark:bg-amber-500/15 dark:text-amber-200" />}
      <section className="rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 p-6 text-center text-white shadow-lg sm:p-8">
        <Localized value={LEARN.resultTitle} as="p" className="text-sm font-semibold uppercase tracking-wide text-indigo-200" />
        <p className="mt-2 text-5xl font-extrabold tabular-nums sm:text-6xl">
          {correct}<span className="text-3xl text-indigo-200">/{total}</span>
        </p>
        <Localized value={LEARN.scoreLine(correct, total)} as="p" className="mt-2 text-lg" />
        <Localized value={LEARN.cheer(pct)} as="p" className="mt-1 text-indigo-100" />
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={onRetry} className="min-h-12 rounded-xl bg-white px-5 font-bold text-indigo-700 hover:bg-indigo-50">
            🔁 <Localized value={LEARN.tryAgain} />
          </button>
          {nextLevel && (
            <Link to={learnPaths.quiz(subject, topic, nextLevel)} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white/15 px-5 font-bold text-white ring-1 ring-white/40 hover:bg-white/25">
              <Localized value={LEARN.nextLevel} /> →
            </Link>
          )}
          <Link to={learnPaths.chapter(subject, topic)} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-white/15 px-5 font-bold text-white ring-1 ring-white/40 hover:bg-white/25">
            📖 <Localized value={LEARN.backToLesson} />
          </Link>
        </div>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Localized value={LEARN.reviewTitle} as="h2" className="text-xl font-bold text-slate-900 dark:text-white" />
        <div role="group" className="inline-flex rounded-full bg-slate-100 p-0.5 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          {[false, true].map((v) => (
            <button
              key={String(v)}
              type="button"
              aria-pressed={onlyWrong === v}
              onClick={() => setOnlyWrong(v)}
              className={`min-h-9 rounded-full px-4 text-sm font-semibold ${onlyWrong === v ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-950 dark:text-indigo-300' : 'text-slate-600 dark:text-slate-300'}`}
            >
              <Localized value={v ? LEARN.filterWrong : LEARN.filterAll} />
            </button>
          ))}
        </div>
      </div>
      <ol className="space-y-4">
        {items.map(({ r, n }) => (
          <ReviewItem key={r.questionId} question={byId.get(r.questionId)} result={r} n={n} />
        ))}
      </ol>
    </div>
  );
}

/** /learn/:subject/:chapter/quiz/:level: answer every question, then review them all. */
export default function QuizPage() {
  const { subject: slug, chapter, level } = useParams();
  const subject = subjectCodeFromSlug(slug);
  const topic = codeFromSlug(chapter);
  const valid = subject && topic && QUIZ_LEVEL_CODES.includes(level);
  const source = useDataSource();

  const [attempt, setAttempt] = useState(0);
  const [phase, setPhase] = useState('loading'); // loading | running | checking | done | error
  const [quiz, setQuiz] = useState(null);
  const [error, setError] = useState(null);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [confirming, setConfirming] = useState(false);
  const [outcome, setOutcome] = useState(null);
  const [timedOut, setTimedOut] = useState(false);
  const [deadline, setDeadline] = useState(null);
  const timeSpent = useRef({});
  const shownAt = useRef(Date.now());

  useEffect(() => {
    if (!valid) return undefined;
    let alive = true;
    setPhase('loading');
    setQuiz(null);
    setAnswers({});
    setIndex(0);
    setOutcome(null);
    setTimedOut(false);
    setConfirming(false);
    setDeadline(null);
    timeSpent.current = {};
    const progress = levelProgress(subject, topic, level);
    source
      .createLearnQuiz({
        subject,
        topic,
        level,
        exclude: progress.seen,
        excludeFingerprints: progress.fingerprints,
        recentPatterns: progress.patterns,
      })
      .then((q) => {
        if (!alive) return;
        setQuiz(q);
        shownAt.current = Date.now();
        if (q.timed) setDeadline(Date.now() + q.timeLimitSec * 1000);
        setPhase('running');
      })
      .catch((e) => {
        if (!alive) return;
        setError(e);
        setPhase('error');
      });
    return () => {
      alive = false;
    };
  }, [valid, source, subject, topic, level, attempt]);

  const noteTime = useCallback(() => {
    const q = quiz?.questions[index];
    if (!q) return;
    timeSpent.current[q.questionId] = (timeSpent.current[q.questionId] || 0) + (Date.now() - shownAt.current) / 1000;
    shownAt.current = Date.now();
  }, [quiz, index]);

  const submit = useCallback(
    async (auto = false) => {
      if (!quiz || phase !== 'running') return;
      noteTime();
      setConfirming(false);
      setTimedOut(auto);
      setDeadline(null);
      setPhase('checking');
      window.scrollTo({ top: 0 });
      try {
        const res = await source.checkLearnQuiz({
          subject,
          topic,
          answers: quiz.questions.map((q) => ({
            questionId: q.questionId,
            selectedOptionId: answers[q.questionId] ?? null,
            timeSpentSec: Math.round((timeSpent.current[q.questionId] || 0) * 10) / 10,
          })),
        });
        recordQuiz(subject, topic, level, {
          questionIds: quiz.questions.map((q) => q.questionId),
          fingerprints: quiz.questions.map((q) => q.fingerprint).filter(Boolean),
          patterns: quiz.questions.map((q) => q.pattern).filter(Boolean),
          restarted: quiz.restarted,
          correct: res.score.correct,
          total: res.score.total,
        });
        setOutcome(res);
        setPhase('done');
      } catch (e) {
        setError(e);
        setPhase('error');
      }
    },
    [quiz, phase, answers, noteTime, source, subject, topic, level],
  );

  const remaining = useCountdown(phase === 'running' ? deadline : null, () => submit(true));

  // Keys 1-4 pick an option (the hints shown on each option), arrows move between questions.
  useEffect(() => {
    if (phase !== 'running' || !quiz || confirming) return undefined;
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.target.closest?.('input, textarea, select')) return;
      const q = quiz.questions[index];
      const option = q.options[Number(e.key) - 1];
      if (option) setAnswers((a) => ({ ...a, [q.questionId]: option.optionId }));
      else if (e.key === 'ArrowRight' && index < quiz.questions.length - 1) {
        noteTime();
        setIndex(index + 1);
      } else if (e.key === 'ArrowLeft' && index > 0) {
        noteTime();
        setIndex(index - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, quiz, index, confirming, noteTime]);

  if (!valid) return <Navigate to="/" replace />;

  const meta = QUIZ_LEVELS.find((l) => l.level === level);
  const total = quiz?.questions.length ?? 0;
  const answeredCount = quiz ? quiz.questions.filter((q) => answers[q.questionId]).length : 0;
  const question = quiz?.questions[index];
  const go = (i) => {
    noteTime();
    setIndex(i);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const lowTime = remaining != null && remaining < 60_000;

  return (
    <PageShell className={`max-w-3xl pt-6 sm:pt-8 ${phase === 'running' ? 'pb-36' : 'pb-16'}`}>
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
        <Link to={learnPaths.subject(subject)} className="hover:text-indigo-600 hover:underline">
          <Localized value={subject === 'quant' ? { en: 'Math', bn: 'গণিত' } : { en: 'English', bn: 'ইংরেজি' }} />
        </Link>
        <span aria-hidden="true">›</span>
        <Link to={learnPaths.chapter(subject, topic)} className="hover:text-indigo-600 hover:underline">
          <Localized value={LEARN.backToLesson} />
        </Link>
      </nav>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-2xl" aria-hidden="true">{meta.icon}</span>
        <Localized value={meta.label} as="h1" className="text-2xl font-extrabold text-slate-900 sm:text-3xl dark:text-white" />
        <Localized
          value={level === 'advanced' ? LEARN.timed(quiz ? Math.round(quiz.timeLimitSec / 60) : 10) : LEARN.noTimer}
          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${TONES[meta.tone].chip}`}
        />
      </div>

      <div className="mt-6">
        {phase === 'loading' && <Localized value={LEARN.loadingQuiz} as="p" role="status" className="animate-pulse rounded-2xl bg-white p-8 text-center text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800" />}
        {phase === 'checking' && <Localized value={LEARN.checking} as="p" role="status" className="animate-pulse rounded-2xl bg-white p-8 text-center text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800" />}
        {phase === 'error' && <LoadError error={error} onRetry={() => setAttempt((n) => n + 1)} />}
        {phase === 'done' && (
          <Results subject={subject} topic={topic} level={level} quiz={quiz} outcome={outcome} timedOut={timedOut} onRetry={() => { window.scrollTo({ top: 0 }); setAttempt((n) => n + 1); }} />
        )}
        {phase === 'running' && question && (
          <>
            {quiz.restarted && <Localized value={LEARN.newCycle} as="p" className="mb-4 rounded-xl bg-sky-50 px-4 py-2 text-sm text-sky-900 ring-1 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-200 dark:ring-sky-500/30" />}
            <div className="mb-3 flex items-center justify-between gap-2 text-sm font-semibold text-slate-600 dark:text-slate-300">
              <Localized value={LEARN.questionOf(index + 1, total)} />
              <Localized value={LEARN.answered(answeredCount, total)} />
            </div>
            <ol className="mb-4 flex flex-wrap gap-1.5" aria-label="Questions">
              {quiz.questions.map((q, i) => (
                <li key={q.questionId}>
                  <button
                    type="button"
                    onClick={() => go(i)}
                    aria-current={i === index ? 'step' : undefined}
                    aria-label={`${i + 1}`}
                    className={`grid size-9 place-items-center rounded-lg text-sm font-bold transition-colors ${
                      i === index
                        ? 'bg-indigo-600 text-white'
                        : answers[q.questionId]
                          ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-200'
                          : 'bg-white text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700'
                    }`}
                  >
                    {i + 1}
                  </button>
                </li>
              ))}
            </ol>
            <QuestionCard
              key={question.questionId}
              question={question}
              selected={answers[question.questionId]}
              onSelect={(optionId) => setAnswers((a) => ({ ...a, [question.questionId]: optionId }))}
            />
          </>
        )}
      </div>

      {phase === 'running' && quiz && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
          <div className="mx-auto flex max-w-3xl items-center gap-2 px-4 py-3">
            <button
              type="button"
              disabled={index === 0}
              onClick={() => go(index - 1)}
              className="min-h-12 rounded-xl px-4 font-semibold text-slate-700 ring-1 ring-slate-300 disabled:opacity-40 dark:text-slate-200 dark:ring-slate-700"
            >
              ← <Localized value={LEARN.prevQ} />
            </button>
            <div className="flex-1 text-center">
              {remaining != null && (
                <span role="timer" aria-live="off" className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-lg font-bold tabular-nums ${lowTime ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300' : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100'}`}>
                  ⏱ {fmt(remaining)}
                </span>
              )}
            </div>
            {index < total - 1 ? (
              <button type="button" onClick={() => go(index + 1)} className="min-h-12 rounded-xl bg-indigo-600 px-5 font-semibold text-white hover:bg-indigo-500">
                <Localized value={LEARN.nextQ} /> →
              </button>
            ) : (
              <button
                type="button"
                onClick={() => (answeredCount < total ? setConfirming(true) : submit())}
                className="min-h-12 rounded-xl bg-emerald-600 px-4 font-semibold text-white hover:bg-emerald-500"
              >
                <Localized value={LEARN.submit} />
              </button>
            )}
          </div>
        </div>
      )}

      {confirming && (
        <div role="dialog" aria-modal="true" aria-labelledby="confirm-title" className="fixed inset-0 z-40 grid place-items-center bg-slate-950/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900">
            <h2 id="confirm-title" className="text-lg font-bold text-slate-900 dark:text-white">
              <Localized value={LEARN.confirmTitle} />
            </h2>
            <Localized value={LEARN.confirmUnanswered(total - answeredCount)} as="p" className="mt-2 text-slate-600 dark:text-slate-300" />
            <div className="mt-5 flex flex-col gap-2 sm:flex-row-reverse">
              <button type="button" onClick={() => submit()} className="min-h-11 flex-1 rounded-xl bg-emerald-600 px-4 font-semibold text-white hover:bg-emerald-500">
                <Localized value={LEARN.finishNow} />
              </button>
              <button type="button" autoFocus onClick={() => setConfirming(false)} className="min-h-11 flex-1 rounded-xl px-4 font-semibold text-slate-700 ring-1 ring-slate-300 dark:text-slate-200 dark:ring-slate-700">
                <Localized value={LEARN.keepGoing} />
              </button>
            </div>
          </div>
        </div>
      )}
    </PageShell>
  );
}

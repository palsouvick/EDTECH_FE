import { useCallback, useEffect, useState } from 'react';
import BengaliReviewNote from './BengaliReviewNote';

const MODE = {
  meaning: { label: 'Bengali meaning · বাংলা অর্থ', icon: 'অ', tone: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-200' },
  synonym: { label: 'Synonym · সমার্থক', icon: '≈', tone: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200' },
  antonym: { label: 'Antonym · বিপরীত', icon: '⇄', tone: 'bg-amber-100 text-amber-900 dark:bg-amber-500/20 dark:text-amber-200' },
};
const KEYS = { 1: 0, 2: 1, 3: 2, 4: 3, a: 0, b: 1, c: 2, d: 3 };
const btn = 'inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-bold disabled:opacity-50';

const days = (n) => (n === 1 ? 'tomorrow' : `in ${n} days`);

/** One related word with its Bengali meaning beside it (only when the word is in the library). */
function RelatedRow({ r, tone }) {
  return (
    <li className={`flex flex-wrap items-baseline gap-x-2 rounded-lg px-3 py-1.5 ${tone}`} title={r.definitionEn || undefined}>
      <span className="font-bold">{r.word}</span>
      {r.meaningBn ? <span className="text-slate-700 dark:text-slate-200">— {r.meaningBn}</span> : null}
      {r.definitionEn && <span className="w-full text-xs text-slate-500 dark:text-slate-400">{r.definitionEn}</span>}
    </li>
  );
}

const plain = (list) => (list || []).map((word) => ({ word, meaningBn: null, definitionEn: null }));

/**
 * What the word means, shown after every answer, right or wrong — plus its synonyms and antonyms
 * side by side with their Bengali meanings, and the meaning of every other option, so one question
 * teaches several words.
 */
export function WordExplanation({ e, correctOptionId = null, selectedOptionId = null }) {
  const synonyms = e.related?.synonyms ?? plain(e.synonyms);
  const antonyms = e.related?.antonyms ?? plain(e.antonyms);
  const options = e.related?.options ?? [];
  const optionLabel = (o) => (o.word && o.word !== o.text ? `${o.text} → ${o.word}` : o.text);
  return (
    <div className="mt-3 space-y-2 rounded-2xl bg-white p-4 text-sm text-slate-800 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700" data-testid="review-explanation">
      <p className="text-lg font-bold text-indigo-800 dark:text-indigo-200">{e.meaningBn}</p>
      <BengaliReviewNote review={e.bengaliReview} />
      <p>{e.definitionEn}</p>
      {e.explanationBn && <p className="text-slate-600 dark:text-slate-300">{e.explanationBn}</p>}
      {e.exampleEn && (
        <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
          <p className="italic">{e.exampleEn}</p>
          {e.exampleBn && <p className="mt-1 text-slate-600 dark:text-slate-300">{e.exampleBn}</p>}
        </div>
      )}
      {(synonyms.length > 0 || antonyms.length > 0) && (
        <div className="grid gap-3 sm:grid-cols-2" data-testid="related-words">
          {synonyms.length > 0 && (
            <div>
              <p className="mb-1 font-bold text-emerald-800 dark:text-emerald-300">≈ Synonyms · সমার্থক</p>
              <ul className="space-y-1">{synonyms.map((r) => <RelatedRow key={r.word} r={r} tone="bg-emerald-50 dark:bg-emerald-500/10" />)}</ul>
            </div>
          )}
          {antonyms.length > 0 && (
            <div>
              <p className="mb-1 font-bold text-amber-800 dark:text-amber-300">⇄ Antonyms · বিপরীত</p>
              <ul className="space-y-1">{antonyms.map((r) => <RelatedRow key={r.word} r={r} tone="bg-amber-50 dark:bg-amber-500/10" />)}</ul>
            </div>
          )}
        </div>
      )}
      {options.some((o) => o.meaningBn || o.word) && (
        <div data-testid="option-meanings">
          <p className="mb-1 font-bold text-slate-800 dark:text-slate-100">📚 Learn the other options too · অন্য বিকল্পগুলোর অর্থ</p>
          <ul className="grid gap-1 sm:grid-cols-2">
            {options.map((o) => {
              const right = o.optionId === correctOptionId;
              const mine = o.optionId === selectedOptionId && !right;
              return (
                <li
                  key={o.optionId}
                  className={`rounded-lg px-3 py-1.5 ${right ? 'bg-emerald-50 ring-1 ring-emerald-300 dark:bg-emerald-500/10' : mine ? 'bg-rose-50 ring-1 ring-rose-300 dark:bg-rose-500/10' : 'bg-slate-50 dark:bg-slate-800'}`}
                  title={o.definitionEn || undefined}
                >
                  <span className="font-bold">{optionLabel(o)}</span>
                  {right && <span aria-hidden="true"> ✓</span>}
                  {mine && <span aria-hidden="true"> ✗</span>}
                  {o.meaningBn && o.meaningBn !== o.text && <span className="text-slate-700 dark:text-slate-200"> — {o.meaningBn}</span>}
                  {o.definitionEn && !right && <span className="block text-xs text-slate-500 dark:text-slate-400">{o.definitionEn}</span>}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Spaced revision as a real check: each due (or missed) word is a 4-option question — its Bengali
 * meaning, a synonym or an antonym. One tap answers; right or wrong, the meaning, example and
 * synonyms / antonyms are shown. The server checks the answer and moves the schedule: right =
 * remembered (longer interval), wrong = back in revision tomorrow.
 */
export default function ReviewQuiz({ source, type, onAnswered, onSwitchToMissed }) {
  const [quiz, setQuiz] = useState(null);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState('');
  const [answer, setAnswer] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState([]);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let live = true;
    setQuiz(null);
    setIndex(0);
    setPicked('');
    setAnswer(null);
    setResults([]);
    setError('');
    source.createVocabularyReviewQuiz(type, 10).then(
      (q) => live && setQuiz(q),
      (e) => live && setError(e?.message || 'Could not load the review'),
    );
    return () => {
      live = false;
    };
  }, [source, type, attempt]);

  const question = quiz?.questions?.[index];

  const choose = useCallback(
    async (optionId) => {
      if (!question || answer || busy) return;
      setPicked(optionId);
      setBusy(true);
      setError('');
      try {
        const result = await source.answerVocabularyPractice(quiz.sessionToken, { questionId: question.questionId, selectedOptionId: optionId });
        setAnswer(result);
        setResults((r) => [...r, { prompt: question.prompt, correct: result.isCorrect, answerText: question.options.find((o) => o.optionId === result.correctOptionId)?.text }]);
        onAnswered?.();
      } catch (e) {
        setError(e?.message || 'Could not check the answer');
        setPicked('');
      } finally {
        setBusy(false);
      }
    },
    [question, answer, busy, source, quiz, onAnswered],
  );

  const next = () => {
    setIndex((i) => i + 1);
    setPicked('');
    setAnswer(null);
  };

  // Keyboard: 1-4 / A-D choose, Enter goes to the next word.
  useEffect(() => {
    const onKey = (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target;
      if (t instanceof HTMLElement && /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) return;
      const k = e.key.toLowerCase();
      if (!answer && question && k in KEYS && question.options[KEYS[k]]) choose(question.options[KEYS[k]].optionId);
      else if (answer && k === 'enter') next();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [answer, question, choose]);

  if (error && !quiz) return <p role="alert" className="mt-5 text-sm font-medium text-rose-700">{error}</p>;
  if (!quiz) return <div aria-busy="true" className="mt-5 h-48 animate-pulse rounded-2xl bg-slate-100 motion-reduce:animate-none dark:bg-slate-800" />;
  if (!quiz.questions.length) {
    return (
      <p className="mt-5 rounded-2xl bg-emerald-50 p-5 text-sm text-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-100">
        {type === 'due' ? 'No words are due right now. 🎉' : 'No missed words to revise.'}
      </p>
    );
  }

  if (!question) {
    const right = results.filter((r) => r.correct).length;
    const missed = results.filter((r) => !r.correct);
    return (
      <div className="mt-5 rounded-2xl bg-slate-50 p-5 dark:bg-slate-800" data-testid="review-done">
        <p className="text-2xl font-extrabold">Revision complete: {right} / {results.length}</p>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          {missed.length ? `${missed.length} word${missed.length === 1 ? '' : 's'} went back into revision — ${missed.length === 1 ? 'it comes' : 'they come'} back tomorrow.` : 'Every word remembered — their next reviews are spaced further out.'}
        </p>
        {missed.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm">
            {missed.map((m) => (
              <li key={m.prompt} className="rounded-lg bg-rose-50 px-3 py-2 text-rose-900 dark:bg-rose-500/10 dark:text-rose-100">
                {m.prompt} → <strong>{m.answerText}</strong>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className={`${btn} bg-indigo-600 text-white hover:bg-indigo-500`} onClick={() => setAttempt((n) => n + 1)}>Review again</button>
          {missed.length > 0 && type !== 'missed' && onSwitchToMissed && (
            <button type="button" className={`${btn} text-slate-700 ring-1 ring-slate-300 hover:bg-white dark:text-slate-200 dark:ring-slate-600`} onClick={onSwitchToMissed}>Practise missed words</button>
          )}
        </div>
      </div>
    );
  }

  const m = MODE[question.mode] ?? MODE.meaning;
  const right = results.filter((r) => r.correct).length;
  return (
    <div className="mt-5 rounded-2xl bg-slate-50 p-5 dark:bg-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-bold ${m.tone}`}>
          <span aria-hidden="true">{m.icon}</span> {m.label}
        </span>
        <span className="tabular-nums text-slate-500 dark:text-slate-400">
          Word {index + 1} / {quiz.questions.length} · ✓ {right} · ✗ {results.length - right}
        </span>
      </div>
      <p className="mt-4 text-xl font-extrabold leading-snug text-slate-900 dark:text-white">{question.prompt}</p>
      <div role="radiogroup" aria-label="Answer options" className="mt-4 grid gap-2 sm:grid-cols-2">
        {question.options.map((o, i) => {
          const isRight = answer?.correctOptionId === o.optionId;
          const isWrong = answer && picked === o.optionId && !answer.isCorrect;
          const tone = isRight
            ? 'bg-emerald-100 text-emerald-900 ring-2 ring-emerald-500 dark:bg-emerald-950 dark:text-emerald-100'
            : isWrong
              ? 'bg-rose-100 text-rose-900 ring-2 ring-rose-500 dark:bg-rose-950 dark:text-rose-100'
              : picked === o.optionId
                ? 'bg-indigo-100 text-indigo-900 ring-2 ring-indigo-500'
                : 'bg-white text-slate-800 ring-1 ring-slate-200 hover:bg-indigo-50 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-700 dark:hover:bg-slate-700';
          return (
            <button
              key={o.optionId}
              type="button"
              role="radio"
              aria-checked={picked === o.optionId}
              disabled={Boolean(answer) || busy}
              onClick={() => choose(o.optionId)}
              className={`flex min-h-12 items-center gap-3 rounded-xl px-4 py-2 text-left text-base font-semibold transition-colors ${tone}`}
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-black/5 text-xs font-bold dark:bg-white/10">{'ABCD'[i]}</span>
              <span>{o.text}</span>
              {isRight && <span aria-hidden="true" className="ml-auto">✓</span>}
              {isWrong && <span aria-hidden="true" className="ml-auto">✗</span>}
            </button>
          );
        })}
      </div>
      {error && <p role="alert" className="mt-3 text-sm font-medium text-rose-700">{error}</p>}

      {answer && (
        <div role="status" className="mt-4">
          <p className={`rounded-xl px-4 py-3 font-bold ${answer.isCorrect ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
            {answer.isCorrect
              ? `✅ Correct! You remembered it.${answer.review ? ` Next review ${days(answer.review.intervalDays)}.` : ''}`
              : `❌ Not quite. Added to revision — this word comes back ${answer.review ? days(answer.review.intervalDays) : 'tomorrow'}.`}
          </p>
          {answer.explanation && <WordExplanation e={answer.explanation} correctOptionId={answer.correctOptionId} selectedOptionId={answer.selectedOptionId} />}
          <div className="mt-4 flex justify-end">
            <button type="button" autoFocus className={`${btn} bg-indigo-600 text-white hover:bg-indigo-500`} onClick={next}>
              {index + 1 < quiz.questions.length ? 'Next word →' : 'See result'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

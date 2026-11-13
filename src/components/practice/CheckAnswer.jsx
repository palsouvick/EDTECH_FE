import { useCallback, useRef, useState } from 'react';
import { Localized } from '../topic-hub/Localized';

const t = (en, bn) => ({ en, bn });

export const CHECK = Object.freeze({
  button: t('Check answer & explanation', 'উত্তর ও ব্যাখ্যা দেখো'),
  checking: t('Checking…', 'দেখা হচ্ছে…'),
  hint: t('After you check, this question is locked.', 'দেখার পর এই প্রশ্নের উত্তর আর বদলানো যাবে না।'),
  right: t('Correct!', 'ঠিক উত্তর!'),
  wrong: t('Not quite.', 'উত্তর ঠিক হয়নি।'),
  notAnswered: t('You did not choose an option — this question counts as unanswered.', 'তুমি কোনো উত্তর বাছোনি — প্রশ্নটি উত্তরহীন ধরা হবে।'),
  correctAnswer: t('Correct answer', 'সঠিক উত্তর'),
  explanation: t('Explanation', 'ব্যাখ্যা'),
  shortcut: t('Shortcut', 'শর্টকাট'),
  whyWrong: t('Why your choice is wrong', 'তোমার উত্তর কেন ভুল'),
  noExplanation: t('No written explanation for this question yet.', 'এই প্রশ্নের লিখিত ব্যাখ্যা এখনও নেই।'),
});

/**
 * Per-question "Check answer" state for a running test. `peek(question)` asks the server for one
 * question's answer and explanation (not recorded — the test is recorded when submitted).
 * A checked question is locked so the final score stays honest.
 */
export function useAnswerChecks(peek) {
  const [checks, setChecks] = useState({});
  const pending = useRef(new Set());
  const check = useCallback(async (questionId, selectedOptionId) => {
    if (pending.current.has(questionId)) return;
    pending.current.add(questionId);
    setChecks((c) => ({ ...c, [questionId]: { status: 'checking' } }));
    try {
      const result = await peek(questionId, selectedOptionId ?? null);
      setChecks((c) => ({ ...c, [questionId]: { status: 'done', result } }));
    } catch (error) {
      setChecks((c) => ({ ...c, [questionId]: { status: 'error', error } }));
    } finally {
      pending.current.delete(questionId);
    }
  }, [peek]);
  const reset = useCallback(() => setChecks({}), []);
  const isLocked = useCallback((questionId) => checks[questionId]?.status === 'done', [checks]);
  return { checks, check, reset, isLocked };
}

/** How an option looks once its question is checked: 'correct' | 'wrong' | 'answer' | 'dimmed' | null. */
export function checkedTone(result, optionId) {
  if (!result) return null;
  if (optionId === result.correctOptionId) return result.isCorrect ? 'correct' : 'answer';
  if (optionId === result.selectedOptionId) return 'wrong';
  return 'dimmed';
}

/** The button under a question and, once checked, the verdict, correct answer and explanation. */
export default function CheckAnswer({ question, selectedOptionId, state, onCheck, disabled }) {
  if (!state || state.status === 'error' || state.status === 'checking') {
    return (
      <div className="mt-4 space-y-1">
        <button
          type="button"
          disabled={disabled || state?.status === 'checking'}
          onClick={() => onCheck(question.questionId, selectedOptionId)}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-amber-100 px-4 text-sm font-bold text-amber-900 ring-1 ring-amber-300 hover:bg-amber-200 disabled:opacity-50 dark:bg-amber-500/15 dark:text-amber-200 dark:ring-amber-500/40"
        >
          💡 <Localized value={state?.status === 'checking' ? CHECK.checking : CHECK.button} />
        </button>
        <Localized value={CHECK.hint} as="p" className="text-xs text-slate-500 dark:text-slate-400" />
        {state?.status === 'error' && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{state.error?.message ?? String(state.error)}</p>}
      </div>
    );
  }

  const r = state.result;
  const answerText = question.options.find((o) => o.optionId === r.correctOptionId)?.text;
  const answerLetter = 'ABCD'[question.options.findIndex((o) => o.optionId === r.correctOptionId)];
  const verdict = !r.selectedOptionId ? CHECK.notAnswered : r.isCorrect ? CHECK.right : CHECK.wrong;
  const tone = r.isCorrect
    ? 'bg-emerald-50 ring-emerald-200 dark:bg-emerald-500/10 dark:ring-emerald-500/30'
    : 'bg-rose-50 ring-rose-200 dark:bg-rose-500/10 dark:ring-rose-500/30';
  return (
    <div role="status" className={`mt-4 space-y-3 rounded-xl p-4 text-sm ring-1 ${tone}`} data-testid="check-answer-result">
      <p className={`font-bold ${r.isCorrect ? 'text-emerald-800 dark:text-emerald-200' : 'text-rose-800 dark:text-rose-200'}`}>
        {r.isCorrect ? '✅ ' : '❌ '}<Localized value={verdict} inline />
      </p>
      {!r.isCorrect && answerText && (
        <p className="text-emerald-900 dark:text-emerald-200">
          <Localized value={CHECK.correctAnswer} className="font-bold" />: {answerLetter}. <Localized value={answerText} markdown inline />
        </p>
      )}
      {r.trapForSelected && (
        <div className="text-rose-950 dark:text-rose-100">
          <Localized value={CHECK.whyWrong} as="p" className="font-bold" />
          <Localized value={r.trapForSelected} markdown as="div" className="mt-1" />
        </div>
      )}
      <div className="rounded-lg bg-white/70 p-3 ring-1 ring-indigo-100 dark:bg-slate-900/60 dark:ring-indigo-500/20">
        <Localized value={CHECK.explanation} as="p" className="font-bold text-indigo-900 dark:text-indigo-200" />
        {r.steps?.length ? (
          <ol className="mt-2 space-y-2">
            {r.steps.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-indigo-600 text-xs font-bold text-white">{i + 1}</span>
                <Localized value={s} markdown as="div" className="min-w-0 flex-1 text-slate-700 dark:text-slate-200" />
              </li>
            ))}
          </ol>
        ) : (
          <Localized value={CHECK.noExplanation} as="p" className="mt-1 text-slate-600 dark:text-slate-300" />
        )}
      </div>
      {r.shortcut && (
        <p className="text-amber-950 dark:text-amber-100">
          ⚡ <Localized value={CHECK.shortcut} className="font-bold" />: <Localized value={r.shortcut} markdown inline />
        </p>
      )}
    </div>
  );
}

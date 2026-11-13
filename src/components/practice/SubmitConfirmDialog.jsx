import { useId } from 'react';
import Dialog from './Dialog';
import { Localized } from '../topic-hub/Localized';

const bnNum = (n) => String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[d]);
const t = (en, bn) => ({ en, bn });

const COPY = {
  title: t('Submit the test?', 'পরীক্ষা জমা দেবে?'),
  total: t('Questions', 'মোট প্রশ্ন'),
  attempted: t('Attempted', 'উত্তর দেওয়া'),
  notAttempted: t('Not attempted', 'উত্তর দেওয়া হয়নি'),
  warn: (n) => t(
    `${n} question${n === 1 ? ' is' : 's are'} not answered yet. Unanswered questions get no marks.`,
    `${bnNum(n)}টি প্রশ্নের উত্তর এখনও দেওয়া হয়নি। উত্তর না দেওয়া প্রশ্নে কোনো নম্বর নেই।`,
  ),
  allDone: t('You have answered every question.', 'সব প্রশ্নের উত্তর দেওয়া হয়েছে।'),
  final: t('After submitting you cannot change your answers.', 'জমা দেওয়ার পর উত্তর আর বদলানো যাবে না।'),
  goUnanswered: t('Go to first unanswered', 'প্রথম বাকি প্রশ্নে যাও'),
  back: t('Back to test', 'পরীক্ষায় ফিরে যাও'),
  submit: t('Yes, submit', 'হ্যাঁ, জমা দাও'),
};

const num = (n) => ({ en: String(n), bn: bnNum(n) });

/**
 * "Submit the test?" with how many questions were attempted and not attempted.
 * Shown when the student presses Submit; the timer's automatic submit at zero skips it.
 */
export default function SubmitConfirmDialog({ open, onClose, onConfirm, total, answered, onGoToUnanswered }) {
  const titleId = useId();
  const left = Math.max(0, total - answered);
  const tiles = [
    [COPY.total, total, 'bg-slate-50 text-slate-900 ring-slate-200 dark:bg-slate-800 dark:text-white dark:ring-slate-700'],
    [COPY.attempted, answered, 'bg-emerald-50 text-emerald-900 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/30'],
    [COPY.notAttempted, left, left ? 'bg-amber-50 text-amber-900 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/30' : 'bg-slate-50 text-slate-900 ring-slate-200 dark:bg-slate-800 dark:text-white dark:ring-slate-700'],
  ];
  return (
    <Dialog open={open} onClose={onClose} labelledBy={titleId}>
      <h2 id={titleId} className="text-lg font-bold text-slate-900 dark:text-white"><Localized value={COPY.title} /></h2>
      <dl className="mt-4 grid grid-cols-3 gap-2">
        {tiles.map(([label, n, tone], k) => (
          <div key={k} className={`rounded-xl p-3 text-center ring-1 ${tone}`}>
            <dt><Localized value={label} className="text-xs font-semibold" /></dt>
            <dd className="mt-1 text-2xl font-extrabold tabular-nums" data-testid={['total', 'attempted', 'not-attempted'][k]}><Localized value={num(n)} /></dd>
          </div>
        ))}
      </dl>
      <Localized
        value={left ? COPY.warn(left) : COPY.allDone}
        as="p"
        className={`mt-3 text-sm ${left ? 'font-semibold text-amber-800 dark:text-amber-300' : 'text-slate-600 dark:text-slate-300'}`}
      />
      <Localized value={COPY.final} as="p" className="mt-1 text-xs text-slate-500 dark:text-slate-400" />
      <div className="mt-5 flex flex-wrap justify-end gap-2">
        {left > 0 && onGoToUnanswered && (
          <button type="button" onClick={onGoToUnanswered} className="min-h-11 rounded-xl px-4 text-sm font-semibold text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-50 dark:text-indigo-300 dark:ring-indigo-500/40 dark:hover:bg-indigo-500/10">
            <Localized value={COPY.goUnanswered} />
          </button>
        )}
        <button type="button" onClick={onClose} className="min-h-11 rounded-xl px-4 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-800">
          <Localized value={COPY.back} />
        </button>
        <button type="button" onClick={onConfirm} className="min-h-11 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white hover:bg-emerald-500">
          <Localized value={COPY.submit} />
        </button>
      </div>
    </Dialog>
  );
}

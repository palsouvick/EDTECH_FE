import { useEffect, useState } from 'react';
import { focusStore, useFocus } from '../../lib/focusStore';
import { Localized } from '../topic-hub/Localized';

const t = (en, bn) => ({ en, bn });
const bnDigits = (n) => String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[d]);
const COPY = {
  focus: t('🎯 Focus Mode', '🎯 ফোকাস মোড'),
  solved: (n) => t(`${n} solved`, `${bnDigits(n)}টি সমাধান`),
  accuracy: (p) => t(`${p}% correct`, `${bnDigits(p)}% সঠিক`),
  end: t('End session', 'সেশন শেষ করো'),
  done: t('✅ Focus session complete', '✅ ফোকাস সেশন শেষ'),
  summary: (s) => t(
    `Study time: ${s.minutes} min · Questions solved: ${s.answered}${s.accuracy == null ? '' : ` · Accuracy: ${s.accuracy}%`}`,
    `পড়ার সময়: ${bnDigits(s.minutes)} মিনিট · সমাধান করা প্রশ্ন: ${bnDigits(s.answered)}${s.accuracy == null ? '' : ` · নির্ভুলতা: ${bnDigits(s.accuracy)}%`}`,
  ),
  close: t('Close', 'বন্ধ করো'),
};

const clock = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};

/** The only chrome shown in Focus Mode: elapsed time, questions solved, accuracy, and End. */
export function FocusBar() {
  const focus = useFocus();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!focus.active) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [focus.active]);
  if (!focus.active) return null;
  const acc = focus.answered ? Math.round((focus.correct / focus.answered) * 100) : null;
  return (
    <div role="region" aria-label="Focus Mode" className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-950/95">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 text-sm">
        <Localized value={COPY.focus} className="font-bold text-indigo-700 dark:text-indigo-300" />
        <span className="font-mono tabular-nums text-slate-900 dark:text-white" aria-label="Elapsed time">{clock(now - focus.startedAt)}</span>
        <Localized value={COPY.solved(focus.answered)} className="text-slate-600 dark:text-slate-300" />
        {acc != null && <Localized value={COPY.accuracy(acc)} className="text-slate-600 dark:text-slate-300" />}
        <button type="button" onClick={() => FocusSummary.show(focusStore.stop())} className="ml-auto min-h-9 rounded-lg px-3 font-semibold text-rose-700 ring-1 ring-rose-200 hover:bg-rose-50 dark:text-rose-300 dark:ring-rose-500/40">
          <Localized value={COPY.end} />
        </button>
      </div>
    </div>
  );
}

let showSummary = () => {};
/** "Focus session complete" with study time, questions and accuracy, shown after End. */
export function FocusSummary() {
  const [summary, setSummary] = useState(null);
  useEffect(() => {
    showSummary = setSummary;
    return () => {
      showSummary = () => {};
    };
  }, []);
  if (!summary) return null;
  return (
    <div role="status" className="fixed inset-x-4 bottom-4 z-50 mx-auto max-w-md rounded-2xl bg-white p-4 shadow-xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
      <Localized value={COPY.done} as="p" className="font-bold text-slate-900 dark:text-white" />
      <Localized value={COPY.summary(summary)} as="p" className="mt-1 text-sm text-slate-700 dark:text-slate-200" />
      <button type="button" onClick={() => setSummary(null)} className="mt-3 min-h-9 rounded-lg bg-indigo-600 px-3 text-sm font-semibold text-white">
        <Localized value={COPY.close} />
      </button>
    </div>
  );
}
FocusSummary.show = (s) => s && showSummary(s);

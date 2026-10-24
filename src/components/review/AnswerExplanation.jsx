import { Localized } from '../topic-hub/Localized';

const t = (en, bn) => ({ en, bn });
const COPY = {
  explanation: t('Explanation', 'ব্যাখ্যা'),
  shortcut: t('Shortcut', 'শর্টকাট'),
  whyWrong: t('Why your choice is wrong', 'তোমার উত্তর কেন ভুল'),
};

/**
 * Why-wrong note, numbered explanation steps and shortcut, as shown after an
 * answer on the revision, bookmarks and mistake-notebook pages.
 */
export default function AnswerExplanation({ steps = [], shortcut, trap }) {
  return (
    <div className="space-y-3">
      {trap && (
        <div className="rounded-xl bg-rose-50 p-3 text-sm text-rose-950 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-100 dark:ring-rose-500/30">
          <Localized value={COPY.whyWrong} as="p" className="font-bold" />
          <Localized value={trap} markdown as="div" className="mt-1" />
        </div>
      )}
      {steps.length > 0 && (
        <div className="rounded-xl bg-indigo-50/70 p-4 ring-1 ring-indigo-100 dark:bg-indigo-500/5 dark:ring-indigo-500/20">
          <Localized value={COPY.explanation} as="p" className="font-bold text-indigo-900 dark:text-indigo-200" />
          <ol className="mt-2 space-y-2">
            {steps.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-indigo-600 text-xs font-bold text-white">{i + 1}</span>
                <Localized value={s} markdown as="div" className="min-w-0 flex-1 text-slate-700 dark:text-slate-200" />
              </li>
            ))}
          </ol>
        </div>
      )}
      {shortcut && (
        <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-950 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-100 dark:ring-amber-500/30">
          ⚡ <Localized value={COPY.shortcut} className="font-bold" />: <Localized value={shortcut} markdown inline />
        </div>
      )}
    </div>
  );
}

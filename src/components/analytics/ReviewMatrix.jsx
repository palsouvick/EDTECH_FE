import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { ANALYTICS, ARENA } from '../../lib/i18n';
import { Localized, MathMarkdown } from '../topic-hub/Localized';
import { AlertIcon, BoltIcon } from '../topic-hub/icons';
import { OUTCOME } from './charts';
import { OPTION_LETTERS } from '../practice/OptionButton';

const FILTERS = [
  { id: 'all', label: ANALYTICS.filterAll, test: () => true },
  { id: 'incorrect', label: ANALYTICS.filterIncorrect, test: (r) => r.outcome === 'INCORRECT' },
  { id: 'unattempted', label: ANALYTICS.filterUnattempted, test: (r) => r.outcome === 'UNATTEMPTED' || r.outcome === 'TIMED_OUT' },
  { id: 'marked', label: ANALYTICS.filterMarked, test: (r) => r.markedForReview },
];

const VIEWS = [
  { id: 'en', label: 'English', lang: 'en' },
  { id: 'bn', label: 'বাংলা', lang: 'bn' },
  { id: 'both', label: ANALYTICS.both },
];

/**
 * Text in an explicit language view. Unlike <Localized> (which follows the
 * global UI language), the review lets students read English and Bengali side
 * by side, so it renders the requested languages directly.
 */
function BiText({ value, view, inline = false }) {
  if (!value) return null;
  const text = (l) => value[l] ?? value.en ?? Object.values(value)[0];
  if (view !== 'both' || !value.en || !value.bn || value.en === value.bn) {
    const l = view === 'both' ? (value.en ? 'en' : 'bn') : value[view] ? view : 'en';
    return (
      <div lang={l}>
        <MathMarkdown source={text(l)} inline={inline} />
      </div>
    );
  }
  return (
    <div className="grid gap-x-6 gap-y-2 md:grid-cols-2">
      {['en', 'bn'].map((l) => (
        <div key={l} lang={l} className="min-w-0">
          <span className="mb-0.5 block text-[10px] font-semibold uppercase tracking-wider text-slate-400">{l === 'en' ? 'EN' : 'বাংলা'}</span>
          <MathMarkdown source={text(l)} inline={inline} />
        </div>
      ))}
    </div>
  );
}

const outcomeKey = (o) => (o === 'TIMED_OUT' ? 'UNATTEMPTED' : o);

const QuestionReviewCard = memo(function QuestionReviewCard({ r, view, topicName, open, cardRef }) {
  const o = OUTCOME[outcomeKey(r.outcome)];
  const trap = r.outcome === 'INCORRECT' ? r.explanation?.traps?.find((t) => t.optionId === r.selectedOptionId) : null;
  const generalTraps = (r.explanation?.traps ?? []).filter((t) => !t.optionId);
  return (
    <article ref={cardRef} id={`review-q${r.seq}`} className="scroll-mt-24 rounded-2xl bg-white p-4 ring-1 ring-slate-200 sm:p-5 dark:bg-slate-900 dark:ring-slate-800">
      <header className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-bold text-slate-900 dark:text-white">Q{r.seq}</span>
        <span className="flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ring-1 ring-current" style={{ color: o.color }}>
          <span aria-hidden="true">{o.icon}</span>
          <Localized value={o.label} />
        </span>
        {r.markedForReview && (
          <span className="rounded-full bg-violet-100 px-2 py-0.5 font-semibold text-violet-800 dark:bg-violet-500/15 dark:text-violet-300">
            <Localized value={ANALYTICS.marked} />
          </span>
        )}
        {topicName && <Localized value={topicName} className="text-slate-500 dark:text-slate-400" />}
        <span className="ml-auto tabular-nums text-slate-500 dark:text-slate-400">
          {Math.round(r.timeSpentSec ?? 0)}s{r.expectedTimeSec ? ` / ${r.expectedTimeSec}s` : ''} ·{' '}
          <span className="font-semibold text-slate-900 dark:text-white">{r.marks > 0 ? `+${r.marks}` : r.marks}</span>
        </span>
      </header>

      {r.unavailable ? (
        <Localized value={ANALYTICS.unavailable} as="p" className="mt-3 text-sm text-slate-500" />
      ) : (
        <>
          <div className="mt-3 text-[15px] font-medium leading-relaxed text-slate-900 dark:text-white">
            <BiText value={r.stem} view={view} />
          </div>

          <ul className="mt-3 space-y-1.5">
            {r.options.map((opt, i) => {
              const correct = opt.optionId === r.correctOptionId;
              const chosen = opt.optionId === r.selectedOptionId;
              return (
                <li
                  key={opt.optionId}
                  className={`flex items-start gap-2.5 rounded-xl px-3 py-2 text-sm ring-1 ${
                    correct
                      ? 'bg-emerald-50 ring-emerald-300 dark:bg-emerald-500/10 dark:ring-emerald-500/40'
                      : chosen
                        ? 'bg-rose-50 ring-rose-300 dark:bg-rose-500/10 dark:ring-rose-500/40'
                        : 'ring-slate-200 dark:ring-slate-800'
                  }`}
                >
                  <span className="mt-0.5 font-bold text-slate-500">{OPTION_LETTERS[i]}</span>
                  <div className="min-w-0 flex-1 text-slate-800 dark:text-slate-100">
                    <BiText value={opt.text} view={view} inline />
                  </div>
                  {correct && (
                    <span className="shrink-0 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                      ✓ <Localized value={ANALYTICS.correctAnswer} />
                    </span>
                  )}
                  {chosen && !correct && (
                    <span className="shrink-0 text-xs font-semibold text-rose-700 dark:text-rose-300">
                      ✗ <Localized value={ANALYTICS.yourAnswer} />
                    </span>
                  )}
                </li>
              );
            })}
          </ul>

          <details open={open} className="group mt-3">
            <summary className="flex min-h-11 cursor-pointer list-none items-center gap-1.5 text-sm font-semibold text-indigo-700 dark:text-indigo-300">
              <span className="transition-transform group-open:rotate-90" aria-hidden="true">▸</span>
              <Localized value={ANALYTICS.solution} />
            </summary>
            <div className="space-y-3 pt-1">
              {trap && (
                <div className="rounded-xl bg-rose-50 p-3 ring-1 ring-rose-200 dark:bg-rose-500/5 dark:ring-rose-500/30">
                  <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300">
                    <AlertIcon width={14} height={14} />
                    <Localized value={ARENA.mistakeTitle} />
                  </p>
                  <div className="text-sm text-slate-700 dark:text-slate-300">
                    <BiText value={trap.note} view={view} />
                  </div>
                </div>
              )}
              {r.explanation?.steps?.length > 0 && (
                <ol className="space-y-2">
                  {r.explanation.steps.map((s, i) => (
                    <li key={i} className="flex gap-2.5 text-sm text-slate-700 dark:text-slate-300">
                      <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-indigo-50 text-[11px] font-bold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300">
                        {i + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <BiText value={s} view={view} />
                      </div>
                    </li>
                  ))}
                </ol>
              )}
              {r.explanation?.shortcut && (
                // Shortcut formulas are the highlight: what to remember for the next paper.
                <div className="rounded-xl bg-amber-50 p-3 ring-2 ring-amber-300 dark:bg-amber-500/10 dark:ring-amber-500/50">
                  <p className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-amber-800 dark:text-amber-300">
                    <BoltIcon width={14} height={14} />
                    <Localized value={ARENA.shortcut} />
                  </p>
                  <div className="text-sm font-medium text-slate-900 dark:text-white">
                    <BiText value={r.explanation.shortcut} view={view} />
                  </div>
                </div>
              )}
              {generalTraps.map((t, i) => (
                <div key={i} className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800/40 dark:text-slate-300 dark:ring-slate-700">
                  <BiText value={t.note} view={view} />
                </div>
              ))}
            </div>
          </details>
        </>
      )}
    </article>
  );
});

/**
 * @param {object} props
 * @param {Array} props.review       analytics.review
 * @param {object} props.topicNames  code -> localized name
 * @param {string} [props.defaultView] 'en' | 'bn' | 'both'
 * @param {number} [props.focusSeq]  scroll to and open this question (e.g. from the time chart)
 */
export default function ReviewMatrix({ review, topicNames, defaultView = 'en', focusSeq }) {
  const [filter, setFilter] = useState('all');
  const [view, setView] = useState(defaultView);
  const refs = useRef(new Map());
  const counts = useMemo(() => Object.fromEntries(FILTERS.map((f) => [f.id, review.filter(f.test).length])), [review]);
  const shown = review.filter(FILTERS.find((f) => f.id === filter).test);

  useEffect(() => {
    if (focusSeq == null) return;
    setFilter('all');
    requestAnimationFrame(() => refs.current.get(focusSeq)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }, [focusSeq]);

  return (
    <section aria-labelledby="review-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="review-title" className="text-lg font-bold text-slate-900 dark:text-white">
          <Localized value={ANALYTICS.reviewTitle} />
        </h2>
        <div role="radiogroup" aria-label="Explanation language" className="inline-flex rounded-full bg-slate-100 p-0.5 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              role="radio"
              aria-checked={view === v.id}
              onClick={() => setView(v.id)}
              lang={v.lang}
              className={`min-h-9 rounded-full px-3 text-xs font-semibold ${view === v.id ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-950 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'}`}
            >
              {typeof v.label === 'string' ? v.label : <Localized value={v.label} />}
            </button>
          ))}
        </div>
      </div>

      <div role="tablist" aria-label="Filter questions" className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            onClick={() => setFilter(f.id)}
            className={`flex min-h-11 shrink-0 items-center gap-2 rounded-xl px-3 text-sm font-semibold ring-1 transition-colors ${
              filter === f.id
                ? 'bg-indigo-600 text-white ring-indigo-600'
                : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700'
            }`}
          >
            <Localized value={f.label} />
            <span className={`rounded-full px-1.5 text-xs tabular-nums ${filter === f.id ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}`}>{counts[f.id]}</span>
          </button>
        ))}
      </div>

      <div role="tabpanel" className="mt-4 space-y-3">
        {shown.length === 0 ? (
          <Localized value={ANALYTICS.noneInFilter} as="p" className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500 dark:border-slate-700" />
        ) : (
          shown.map((r) => (
            <QuestionReviewCard
              key={r.questionId}
              r={r}
              view={view}
              topicName={topicNames?.[r.topic]}
              open={r.outcome !== 'CORRECT' || focusSeq === r.seq}
              cardRef={(el) => (el ? refs.current.set(r.seq, el) : refs.current.delete(r.seq))}
            />
          ))
        )}
      </div>
    </section>
  );
}

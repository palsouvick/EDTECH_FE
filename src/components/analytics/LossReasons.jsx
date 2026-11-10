import { useMemo, useState } from 'react';
import { updateCachedResource } from '../../hooks/useResource';
import { BUCKETS, REASONS, analyseLosses } from '../../lib/lossReasons';
import { LOSS, REASON_HINT, REASON_LABEL, bucketLine, headline, negativeLine, signalText, timeLine, tipFor } from '../../lib/lossCopy';
import { Localized } from '../topic-hub/Localized';

// One colour per reason, used by the bar, the legend and the selected tag.
const TONE = {
  concept: { bar: 'bg-indigo-500', dot: 'bg-indigo-500', on: 'bg-indigo-600 text-white ring-indigo-600' },
  calculation: { bar: 'bg-amber-500', dot: 'bg-amber-500', on: 'bg-amber-500 text-white ring-amber-500' },
  guess: { bar: 'bg-rose-500', dot: 'bg-rose-500', on: 'bg-rose-600 text-white ring-rose-600' },
  misread: { bar: 'bg-violet-500', dot: 'bg-violet-500', on: 'bg-violet-600 text-white ring-violet-600' },
  time: { bar: 'bg-sky-500', dot: 'bg-sky-500', on: 'bg-sky-600 text-white ring-sky-600' },
  skipped: { bar: 'bg-slate-400', dot: 'bg-slate-400' },
  untagged: { bar: 'bg-slate-200 dark:bg-slate-700', dot: 'bg-slate-300 dark:bg-slate-600' },
};
const TIP_ICON = { concept: '📘', calculation: '🧮', guess: '🐢', misread: '🔍', time: '⏱️', skipped: '🎯', untagged: '🏷️' };
const COLLAPSED = 6;

/**
 * "Why did I lose marks?" on the mock result page: marks lost by reason, the next three
 * steps, and a one-tap reason per lost question (saved for the student; never changes the score).
 */
export default function LossReasons({ sessionId, source, data }) {
  const [tags, setTags] = useState(() => data.lossReasons ?? {});
  const [error, setError] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const a = useMemo(() => analyseLosses(data.review, tags, data.marking), [data.review, data.marking, tags]);

  async function tag(seq, reason) {
    const before = tags;
    const next = { ...tags };
    if (reason) next[seq] = reason;
    else delete next[seq];
    setTags(next); // optimistic: the chart moves at once
    setError(false);
    try {
      const { lossReasons } = await source.setLossReason(sessionId, { seq, reason });
      setTags(lossReasons);
      updateCachedResource(`analytics:${sessionId}`, (d) => ({ ...d, lossReasons }));
    } catch {
      setTags(before);
      setError(true);
    }
  }

  if (!a.items.length) {
    return (
      <section aria-labelledby="loss-title" className="rounded-2xl bg-emerald-50 p-5 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:ring-emerald-500/30">
        <h2 id="loss-title" className="text-base font-bold text-slate-900 dark:text-white"><Localized value={LOSS.title} /></h2>
        <Localized value={LOSS.none} as="p" className="mt-1 text-sm text-emerald-800 dark:text-emerald-200" />
      </section>
    );
  }

  const names = data.topicNames || {};
  const list = showAll ? a.items : a.items.slice(0, COLLAPSED);

  return (
    <section aria-labelledby="loss-title" className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
      {/* Summary */}
      <div className="bg-gradient-to-br from-rose-50 via-white to-indigo-50 p-4 sm:p-5 dark:from-rose-500/10 dark:via-slate-900 dark:to-indigo-500/10">
        <h2 id="loss-title" className="text-xs font-semibold uppercase tracking-wider text-rose-600 dark:text-rose-400"><Localized value={LOSS.title} /></h2>
        <Localized value={headline(a.totalLost, a.items.length)} as="p" className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl dark:text-white" />
        <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-300">
          {a.negativeLost > 0 && <Localized value={negativeLine(a.negativeLost)} />}
          {a.timeOnLostSec > 0 && <Localized value={timeLine(a.timeOnLostSec)} />}
        </p>

        {/* Stacked bar: share of lost marks by reason */}
        <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" aria-hidden="true">
          {a.buckets.map((b) => (
            <span key={b.key} className={`${TONE[b.key].bar} transition-[width] duration-500 motion-reduce:transition-none`} style={{ width: `${(b.marksLost / a.totalLost) * 100}%` }} />
          ))}
        </div>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {BUCKETS.map((k) => a.buckets.find((b) => b.key === k)).filter(Boolean).map((b) => (
            <li key={b.key} className="flex items-start gap-2.5 rounded-xl bg-white/80 p-2.5 ring-1 ring-slate-200/80 dark:bg-slate-900/60 dark:ring-slate-700/60">
              <span className={`mt-1.5 size-2.5 shrink-0 rounded-full ${TONE[b.key].dot}`} aria-hidden="true" />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <Localized value={REASON_LABEL[b.key]} className="text-sm font-semibold text-slate-900 dark:text-white" />
                  <Localized value={bucketLine(b.count, b.marksLost)} className="shrink-0 text-xs font-semibold tabular-nums text-rose-600 dark:text-rose-400" />
                </span>
                <Localized value={REASON_HINT[b.key]} as="span" className="block text-xs text-slate-500 dark:text-slate-400" />
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Next steps */}
      <div className="border-t border-slate-100 p-4 sm:p-5 dark:border-slate-800">
        <Localized value={LOSS.nextSteps} as="h3" className="text-sm font-bold text-slate-900 dark:text-white" />
        <ol className="mt-2 space-y-2">
          {a.tips.map((tip) => (
            <li key={tip.key} className="flex gap-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
              <span aria-hidden="true" className="text-lg leading-none">{TIP_ICON[tip.key]}</span>
              <Localized value={tipFor(tip)} />
            </li>
          ))}
        </ol>
      </div>

      {/* One-tap reason per lost question */}
      <div className="border-t border-slate-100 p-4 sm:p-5 dark:border-slate-800">
        <Localized value={LOSS.tagTitle} as="h3" className="text-sm font-bold text-slate-900 dark:text-white" />
        <Localized value={LOSS.tagHint} as="p" className="mt-0.5 text-xs text-slate-500 dark:text-slate-400" />
        {error && (
          <p role="alert" className="mt-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700 dark:bg-rose-500/10 dark:text-rose-300">
            <Localized value={LOSS.saveError} />
          </p>
        )}
        <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
          {list.map((it) => (
            <li key={it.seq} className="py-3 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                <Localized value={LOSS.question(it.seq)} className="font-bold tabular-nums text-slate-900 dark:text-white" />
                <Localized value={names[it.topic] ?? { en: it.topic.replace(/_/g, ' ') }} className="text-slate-600 dark:text-slate-300" />
                <span className="text-xs font-semibold tabular-nums text-rose-600 dark:text-rose-400">−{it.marksLost}</span>
                <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">
                  {it.source === 'likely' && (
                    <>
                      <Localized value={LOSS.likely} className="font-semibold" />: <Localized value={REASON_LABEL[it.likely]} />
                      {' · '}
                    </>
                  )}
                  <Localized value={signalText(it)} />
                </span>
              </div>
              {it.trap && <Localized value={it.trap} as="p" className="mt-1 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-amber-900 dark:bg-amber-500/10 dark:text-amber-200" />}
              <div role="group" aria-label={`${LOSS.whyThis.en} (${LOSS.question(it.seq).en})`} className="mt-2 flex flex-wrap gap-1.5">
                {REASONS.map((r) => {
                  const on = tags[it.seq] === r;
                  const suggested = !tags[it.seq] && it.likely === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      aria-pressed={on}
                      onClick={() => tag(it.seq, on ? null : r)}
                      className={`min-h-9 rounded-full px-3 text-xs font-semibold ring-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-500 ${
                        on
                          ? TONE[r].on
                          : suggested
                            ? 'bg-slate-100 text-slate-900 ring-slate-400 dark:bg-slate-800 dark:text-white dark:ring-slate-500'
                            : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800'
                      }`}
                    >
                      <Localized value={REASON_LABEL[r]} />
                    </button>
                  );
                })}
              </div>
            </li>
          ))}
        </ul>
        {a.items.length > COLLAPSED && (
          <button type="button" onClick={() => setShowAll((v) => !v)} className="mt-3 min-h-10 w-full rounded-xl text-sm font-semibold text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-50 dark:text-indigo-300 dark:ring-indigo-500/40 dark:hover:bg-indigo-500/10">
            <Localized value={showAll ? LOSS.showLess : LOSS.showAll(a.items.length)} />
          </button>
        )}
        <Localized value={LOSS.disclaimer} as="p" className="mt-3 text-[11px] text-slate-400 dark:text-slate-500" />
      </div>
    </section>
  );
}

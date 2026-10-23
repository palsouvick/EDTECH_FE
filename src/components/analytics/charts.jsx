import { useEffect, useId, useRef, useState } from 'react';
import { Localized } from '../topic-hub/Localized';
import { MOCK, ANALYTICS, targetSeconds } from '../../lib/i18n';

/**
 * Lightweight SVG charts for the result dashboard. No chart library.
 *
 * Outcome colours come from the status palette (good / critical / neutral).
 * Red vs green is NOT distinguishable for deuteranopes (validator ΔE 4.1), so
 * colour never carries the outcome alone: incorrect marks are hatched,
 * unattempted ones are outlined, and every legend entry and tooltip has an
 * icon and a label.
 */
export const OUTCOME = {
  CORRECT: { color: '#0ca30c', icon: '✓', label: MOCK.correct },
  INCORRECT: { color: '#d03b3b', icon: '✗', label: MOCK.incorrect },
  UNATTEMPTED: { color: '#94a3b8', icon: '–', label: MOCK.unattempted },
};
const outcomeOf = (o) => (o === 'TIMED_OUT' ? 'UNATTEMPTED' : o);

/** Shared <defs>: the 45° hatch that marks "incorrect" independently of colour. */
function Hatch({ id }) {
  return (
    <defs>
      <pattern id={id} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="5" height="5" fill={OUTCOME.INCORRECT.color} />
        <line x1="0" y1="0" x2="0" y2="5" stroke="white" strokeOpacity="0.55" strokeWidth="2" />
      </pattern>
    </defs>
  );
}

function Swatch({ outcome }) {
  const o = OUTCOME[outcome];
  const style =
    outcome === 'UNATTEMPTED'
      ? { border: `2px solid ${o.color}`, background: 'transparent' }
      : outcome === 'INCORRECT'
        ? { background: `repeating-linear-gradient(45deg, ${o.color} 0 3px, rgba(255,255,255,.55) 3px 5px)` }
        : { background: o.color };
  return <span aria-hidden="true" className="inline-block size-3 shrink-0 rounded-[3px]" style={style} />;
}

export function OutcomeLegend({ counts }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
      {Object.keys(OUTCOME).map((k) => (
        <li key={k} className="flex items-center gap-1.5">
          <Swatch outcome={k} />
          <span aria-hidden="true">{OUTCOME[k].icon}</span>
          <Localized value={OUTCOME[k].label} />
          {counts && <span className="font-semibold tabular-nums text-slate-900 dark:text-white">{counts[k]}</span>}
        </li>
      ))}
    </ul>
  );
}

/** Single-value ring (accuracy, score share). Track + one arc; the number sits inside. */
export function RingGauge({ value, size = 96, stroke = 9, label, sublabel }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <figure className="flex flex-col items-center gap-1" aria-label={`${label?.en ?? ''} ${v}%`}>
      <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-slate-200 dark:stroke-slate-700" />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - v / 100)}
          className="stroke-indigo-500 transition-[stroke-dashoffset] duration-700 motion-reduce:transition-none"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-xl font-bold tabular-nums text-slate-900 dark:text-white">{v}%</div>
      </div>
      {label && <Localized value={label} as="figcaption" className="text-xs font-medium text-slate-500 dark:text-slate-400" />}
      {sublabel}
    </figure>
  );
}

/** Correct / incorrect / unattempted as one 100% bar: three segments with 2px gaps, direct-labelled. */
export function AnswerBar({ counts }) {
  const total = counts.CORRECT + counts.INCORRECT + counts.UNATTEMPTED || 1;
  const hatch = useId();
  let x = 0;
  const segs = Object.keys(OUTCOME)
    .map((k) => ({ k, w: (counts[k] / total) * 100 }))
    .filter((s) => s.w > 0)
    .map((s) => {
      const seg = { ...s, x };
      x += s.w;
      return seg;
    });
  return (
    <div>
      <svg viewBox="0 0 100 10" preserveAspectRatio="none" className="h-4 w-full overflow-visible" role="img" aria-label={Object.keys(OUTCOME).map((k) => `${OUTCOME[k].label.en} ${counts[k]}`).join(', ')}>
        <Hatch id={hatch} />
        {segs.map((s, i) => (
          <rect
            key={s.k}
            x={s.x + (i ? 0.4 : 0)}
            width={Math.max(0.5, s.w - (i ? 0.4 : 0))}
            height="10"
            rx="2"
            fill={s.k === 'INCORRECT' ? `url(#${hatch})` : s.k === 'UNATTEMPTED' ? 'transparent' : OUTCOME[s.k].color}
            stroke={s.k === 'UNATTEMPTED' ? OUTCOME.UNATTEMPTED.color : 'none'}
            strokeWidth={s.k === 'UNATTEMPTED' ? 1.2 : 0}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      <div className="mt-3">
        <OutcomeLegend counts={counts} />
      </div>
    </div>
  );
}

/** Accuracy per topic: one hue (magnitude), value printed at the end of each bar, worst first. */
export function TopicAccuracyBars({ topics, topicNames }) {
  return (
    <ul className="space-y-3">
      {topics.map((t) => (
        <li key={t.topic}>
          <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
            <span className="min-w-0 truncate text-slate-700 dark:text-slate-200">
              {topicNames?.[t.topic] ? <Localized value={topicNames[t.topic]} /> : t.topic.replace(/_/g, ' ')}
            </span>
            <span className="shrink-0 tabular-nums text-slate-500 dark:text-slate-400">
              {/* Accuracy is right / attempted, so show exactly that fraction; blanks are listed apart. */}
              {t.correct + t.incorrect > 0 ? (
                <>
                  <span className="font-semibold text-slate-900 dark:text-white">{t.accuracyPct}%</span> · {t.correct}/{t.correct + t.incorrect}
                </>
              ) : (
                <Localized value={MOCK.unattempted} />
              )}
              {t.unattempted > 0 && t.correct + t.incorrect > 0 && (
                <span className="text-slate-400">
                  {' · '}
                  <Localized value={{ en: `${t.unattempted} blank`, bn: `${t.unattempted}টি ফাঁকা`, hi: `${t.unattempted} छोड़े` }} />
                </span>
              )}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" role="img" aria-label={`${t.topic} ${t.accuracyPct}%`}>
            <div className="h-full rounded-full bg-indigo-500 transition-[width] duration-700 motion-reduce:transition-none" style={{ width: `${t.accuracyPct}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/**
 * Time per question: one bar per question (height = seconds spent, outcome
 * encoded by fill + pattern), with a dashed tick at that question's target
 * time. Hover/focus shows a tooltip; click jumps to the question in the review.
 */
/** Rendered pixel width of an element, so SVGs can draw at true size instead of scaling. */
export function useWidth(ref, fallback = 600) {
  const [w, setW] = useState(fallback);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);
  return w;
}

export function TimeChart({ review, onSelect }) {
  const hatch = useId();
  const [hover, setHover] = useState(null);
  const box = useRef(null);
  const width = useWidth(box);
  const n = review.length;
  const H = 120;
  // Fill the card; scroll sideways only when bars would get thinner than ~6px.
  const W = Math.max(width, n * 8, 280);
  const max = Math.max(30, ...review.map((r) => Math.max(r.timeSpentSec || 0, r.expectedTimeSec || 0))) * 1.1;
  const y = (s) => H - (s / max) * H;
  const slot = W / n;
  const bw = Math.max(3, Math.min(18, slot - 2)); // 2px surface gap between bars
  const hov = hover != null ? review[hover] : null;

  return (
    <div className="relative">
      <div ref={box} className="overflow-x-auto">
        <svg width={W} height={H + 18} viewBox={`0 0 ${W} ${H + 18}`} className="block" role="img" aria-labelledby={`${hatch}-desc`}>
          <desc id={`${hatch}-desc`}>{`${n} questions, seconds spent per question compared with the target time.`}</desc>
          <Hatch id={hatch} />
          {[0.5, 1].map((f) => (
            <line key={f} x1="0" x2={W} y1={y(max * f * 0.9)} y2={y(max * f * 0.9)} className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="1" />
          ))}
          {review.map((r, i) => {
            const k = outcomeOf(r.outcome);
            const x = i * slot + (slot - bw) / 2;
            const t = r.timeSpentSec || 0;
            const h = Math.max(2, H - y(t));
            return (
              <g
                key={r.questionId}
                tabIndex={0}
                role="button"
                aria-label={`Question ${r.seq}: ${OUTCOME[k].label.en}, ${Math.round(t)} seconds${r.expectedTimeSec ? `, target ${r.expectedTimeSec}` : ''}`}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                onClick={() => onSelect?.(r)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect?.(r)}
                className="cursor-pointer outline-none"
              >
                {/* hit target taller and wider than the mark */}
                <rect x={i * slot} y="0" width={slot} height={H} fill="transparent" />
                <rect
                  x={x}
                  y={H - h}
                  width={bw}
                  height={h}
                  rx={Math.min(3, bw / 2)}
                  fill={k === 'INCORRECT' ? `url(#${hatch})` : k === 'UNATTEMPTED' ? 'transparent' : OUTCOME[k].color}
                  stroke={k === 'UNATTEMPTED' ? OUTCOME.UNATTEMPTED.color : hover === i ? 'currentColor' : 'none'}
                  strokeWidth={k === 'UNATTEMPTED' ? 1.5 : 1}
                  className="text-slate-900 dark:text-white"
                />
                {r.expectedTimeSec ? (
                  <line x1={x - 2} x2={x + bw + 2} y1={y(r.expectedTimeSec)} y2={y(r.expectedTimeSec)} strokeDasharray="2 2" strokeWidth="1.5" className="stroke-slate-500 dark:stroke-slate-400" />
                ) : null}
                {(n <= 30 || (i + 1) % 5 === 0) && (
                  <text x={i * slot + slot / 2} y={H + 13} textAnchor="middle" className="fill-slate-400 text-[9px] tabular-nums">
                    {r.seq}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      {hov && (
        <div role="status" className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow-lg dark:bg-white dark:text-slate-900">
          <span className="font-semibold">Q{hov.seq}</span> · {OUTCOME[outcomeOf(hov.outcome)].icon} <Localized value={OUTCOME[outcomeOf(hov.outcome)].label} /> ·{' '}
          <span className="tabular-nums">{Math.round(hov.timeSpentSec || 0)}s</span>
          {hov.expectedTimeSec ? (
            <>
              {' '}
              (<Localized value={targetSeconds(hov.expectedTimeSec)} />)
            </>
          ) : null}
        </div>
      )}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <OutcomeLegend />
        <Localized value={ANALYTICS.timeLegend} className="text-xs text-slate-500 dark:text-slate-400" />
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDataSource } from '../../app/DataSourceContext';
import { CT } from '../../lib/customTestCopy';
import { Localized } from '../topic-hub/Localized';

const BAND = {
  strong: { dot: '🟢', bar: 'bg-emerald-500' },
  practice: { dot: '🟡', bar: 'bg-amber-400' },
  weak: { dot: '🔴', bar: 'bg-rose-500' },
};

function Stat({ label, value, hint }) {
  return (
    <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
      <Localized value={label} as="p" className="text-xs font-semibold text-slate-500 dark:text-slate-400" />
      <p className="mt-0.5 text-xl font-extrabold tabular-nums text-slate-900 dark:text-white">{value}</p>
      {hint && <Localized value={hint} as="p" className="text-[11px] leading-tight text-slate-500 dark:text-slate-400" />}
    </div>
  );
}

/** "📊 Custom practice history" for one subject: totals, chapter mastery from custom tests, recent tests. Hidden until the first test. */
export default function CustomHistoryCard({ subject }) {
  const source = useDataSource();
  const [h, setH] = useState(null);
  useEffect(() => {
    let live = true;
    source.getCustomTestHistory?.(subject).then((d) => live && setH(d), () => live && setH(null));
    return () => {
      live = false;
    };
  }, [source, subject]);
  if (!h?.testsTaken) return null;
  const pct = (v) => (v == null ? '—' : `${v}%`);
  return (
    <details className="group rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5 dark:bg-slate-900 dark:ring-slate-800">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2">
        <Localized value={CT.historyTitle} as="h2" className="text-base font-extrabold text-slate-900 dark:text-white" />
        <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
          <span className="tabular-nums">{h.testsTaken}</span> · <span className="tabular-nums">{pct(h.avgScorePct)}</span>
          <span aria-hidden="true" className="ml-2 inline-block transition-transform group-open:rotate-180">▾</span>
        </span>
      </summary>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        <Stat label={CT.testsTaken} value={h.testsTaken} />
        <Stat label={CT.avgScore} value={pct(h.avgScorePct)} />
        <Stat label={CT.bestScore} value={pct(h.bestScorePct)} />
        <Stat label={CT.avgAccuracy} value={pct(h.avgAccuracy)} />
        <Stat label={CT.avgTime} value={h.avgTimeMin == null ? '—' : `${h.avgTimeMin} min`} />
        <Stat label={CT.improvement} value={h.improvement == null ? '—' : `${h.improvement > 0 ? '+' : ''}${h.improvement}%`} hint={CT.improvementHint} />
      </div>
      {h.mastery.length > 0 && (
        <div className="mt-4">
          <Localized value={CT.chapterMastery} as="h3" className="text-sm font-bold text-slate-900 dark:text-white" />
          <ul className="mt-2 space-y-2">
            {h.mastery.map((m) => (
              <li key={m.topic} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 text-sm">
                <Localized value={m.name} className="truncate font-medium" />
                <span className="font-bold tabular-nums">{m.accuracy}% <span aria-hidden="true">{BAND[m.band]?.dot}</span></span>
                <span className="col-span-2 mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <span className={`block h-full rounded-full ${BAND[m.band]?.bar}`} style={{ width: `${Math.max(3, m.accuracy)}%` }} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="mt-4">
        <Localized value={CT.recentTests} as="h3" className="text-sm font-bold text-slate-900 dark:text-white" />
        <ul className="mt-2 divide-y divide-slate-100 text-sm dark:divide-slate-800">
          {h.recent.map((t) => (
            <li key={t.sessionId} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <span className="min-w-0">
                <Localized value={CT.presetNames[t.preset] ?? CT.presetNames.custom} className="font-semibold" />
                <span className="text-slate-500"> · {new Date(t.at).toLocaleDateString()} · </span>
                <span className="text-slate-600 dark:text-slate-300">{t.topicNames.map((n, i) => <span key={i}>{i > 0 && ', '}<Localized value={n} /></span>)}</span>
              </span>
              <Link to={`/mock/${t.sessionId}`} className="font-bold tabular-nums text-indigo-700 hover:underline dark:text-indigo-300">
                {t.accuracy}% · <Localized value={CT.viewResult} />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </details>
  );
}

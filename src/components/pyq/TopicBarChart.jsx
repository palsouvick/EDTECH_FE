import { useMemo, useState } from 'react';
import { Localized } from '../topic-hub/Localized';
import PriorityBadge from '../priority/PriorityBadge';
import { PYQ } from '../../lib/pyqCopy';

// Papers from this year on count as "recent" (the same split as the PYQ research report).
const RECENT_FROM = 2021;

// Categorical slots 1 and 2 of the dataviz reference palette, validated (light on white, dark on slate-900):
// adjacent CVD ΔE ≥ 24.7, normal-vision ΔE ≥ 31.8, contrast ≥ 3:1 in both modes.
const OLDER = 'bg-[#2a78d6] dark:bg-[#3987e5]';
const RECENT = 'bg-[#eb6834] dark:bg-[#d95926]';

function split(byYear) {
  let older = 0;
  let recent = 0;
  for (const [y, n] of Object.entries(byYear || {})) {
    if (Number(y) >= RECENT_FROM) recent += n;
    else older += n;
  }
  return { older, recent, total: older + recent };
}

function Swatch({ tone }) {
  return <span aria-hidden="true" className={`inline-block h-3 w-3 rounded-sm ${tone}`} />;
}

/**
 * Horizontal stacked bars: one per chapter of the chosen subject, longest first, split into papers before
 * 2021 and from 2021. The priority badge sits beside each name; the total is printed at the bar's tip in
 * text colour. Hover or keyboard focus shows the split; a toggle shows the same numbers as a table.
 */
export default function TopicBarChart({ topics, paperCount }) {
  const rows = useMemo(
    () => topics.map((t) => ({ ...t, ...split(t.byYear) })).filter((r) => r.total > 0).sort((a, b) => b.total - a.total),
    [topics],
  );
  const [table, setTable] = useState(false);
  const [active, setActive] = useState(null);
  if (!rows.length) return null;
  const max = rows[0].total;

  return (
    <figure className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 dark:border-slate-800 dark:bg-slate-900">
      <figcaption>
        <Localized value={PYQ.chartTitle} as="p" className="font-bold text-slate-900 dark:text-white" />
        <Localized value={PYQ.chartSub(paperCount)} as="p" className="mt-1 text-sm text-slate-600 dark:text-slate-300" />
      </figcaption>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <ul className="flex flex-wrap gap-4 text-sm text-slate-700 dark:text-slate-200">
          <li className="flex items-center gap-1.5"><Swatch tone={OLDER} /><Localized value={PYQ.chartOlder} /></li>
          <li className="flex items-center gap-1.5"><Swatch tone={RECENT} /><Localized value={PYQ.chartRecent} /></li>
        </ul>
        <button
          type="button"
          onClick={() => setTable((v) => !v)}
          className="min-h-10 rounded-lg px-3 text-sm font-semibold text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-50 dark:text-indigo-300 dark:ring-indigo-500/40 dark:hover:bg-slate-800"
        >
          <Localized value={table ? PYQ.chartHideTable : PYQ.chartShowTable} />
        </button>
      </div>

      {table ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-slate-500 dark:text-slate-400">
              <tr>
                <th scope="col" className="py-2 pr-3 font-semibold"><Localized value={PYQ.chartChapter} /></th>
                <th scope="col" className="py-2 pr-3 text-right font-semibold"><Localized value={PYQ.chartOlder} /></th>
                <th scope="col" className="py-2 pr-3 text-right font-semibold"><Localized value={PYQ.chartRecent} /></th>
                <th scope="col" className="py-2 text-right font-semibold"><Localized value={PYQ.chartTotal} /></th>
              </tr>
            </thead>
            <tbody className="tabular-nums text-slate-800 dark:text-slate-100">
              {rows.map((r) => (
                <tr key={`${r.subject}.${r.topic}`} className="border-t border-slate-100 dark:border-slate-800">
                  <th scope="row" className="py-2 pr-3 font-medium"><Localized value={r.name} /></th>
                  <td className="py-2 pr-3 text-right">{r.older}</td>
                  <td className="py-2 pr-3 text-right">{r.recent}</td>
                  <td className="py-2 text-right font-bold">{r.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {rows.map((r) => {
            const key = `${r.subject}.${r.topic}`;
            const on = active === key;
            return (
              <li key={key} className="grid grid-cols-1 gap-1 sm:grid-cols-[minmax(0,17rem)_1fr] sm:items-center sm:gap-3">
                <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                  <Localized value={r.name} className="text-sm font-medium leading-snug text-slate-800 dark:text-slate-100" />
                  <PriorityBadge subject={r.subject} topics={[r.topic]} />
                </div>
                <div
                  className="relative flex items-center gap-2 rounded-md py-1 outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                  tabIndex={0}
                  role="img"
                  aria-label={PYQ.chartAria(r.name.en, r.total, r.older, r.recent)}
                  onMouseEnter={() => setActive(key)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => setActive(key)}
                  onBlur={() => setActive(null)}
                >
                  {/* Bar: grows from the left baseline; 2px gap between the two parts; rounded data end only. */}
                  <div className="flex h-4 gap-0.5" style={{ width: `calc((100% - 3rem) * ${r.total / max})`, minWidth: '4px' }}>
                    {r.older > 0 && <span className={`${OLDER} h-full ${r.recent > 0 ? '' : 'rounded-r'}`} style={{ flexGrow: r.older }} />}
                    {r.recent > 0 && <span className={`${RECENT} h-full rounded-r`} style={{ flexGrow: r.recent }} />}
                  </div>
                  <span className="shrink-0 text-sm font-bold tabular-nums text-slate-900 dark:text-white">{r.total}</span>
                  {on && (
                    <span role="tooltip" className="pointer-events-none absolute -top-9 left-0 z-10 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow-lg dark:bg-white dark:text-slate-900">
                      <Localized value={PYQ.chartTooltip(r.older, r.recent)} />
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </figure>
  );
}

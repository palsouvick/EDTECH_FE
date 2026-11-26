import { memo, useMemo } from 'react';
import { FallbackBadge, MathMarkdown, slotsFor } from './Localized';

// A row is "short label <spaced en/em dash> rest": "IBRD – Reconstruction bank – 1944".
const DASH = /\s+[–—]\s+/;
const MAX_LABEL = 60;
// "Headquarters: Washington DC" (the label has no colon and is short).
const KV = /^([^:：]{1,40}?)\s*[:：]\s+(.+)$/;
const LIST = /^(\d+[.)]|[-*•])\s/;

function kindOf(line) {
  if (LIST.test(line)) return { type: 'list' };
  if (/[:：]$/.test(line) && line.length <= 80) return { type: 'heading' };
  const parts = line.split(DASH);
  if (parts.length >= 2 && parts[0].length <= MAX_LABEL) return { type: 'dash', cells: parts };
  const kv = line.match(KV);
  if (kv) return { type: 'kv', cells: [kv[1], kv[2]] };
  return { type: 'text' };
}

/**
 * Splits a multi-line fact statement into blocks: runs of "A – B – C" rows or "Label: value"
 * lines become tables, a short line ending in ":" a heading, everything else paragraphs.
 * One-line text is returned as a single markdown block (unchanged rendering).
 */
export function structure(text) {
  const lines = String(text ?? '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [{ type: 'markdown', text: lines.join('\n') }];
  const kinds = lines.map(kindOf);
  // A first line that names the topic ("United Nations (UN)") is a lead, not a table row,
  // when the rows below it have a different shape.
  const lead = lines.length >= 3 && kinds[0].type !== 'heading' && kinds[0].type !== 'list'
    && (kinds[0].type === 'text' || kinds[0].type !== kinds[1].type || kinds[0].cells.length !== kinds[1].cells?.length);
  const blocks = [];
  if (lead) blocks.push({ type: 'lead', text: lines[0] });
  for (let i = lead ? 1 : 0; i < lines.length; i += 1) {
    const k = kinds[i];
    const last = blocks[blocks.length - 1];
    if ((k.type === 'dash' || k.type === 'kv') && last?.type === `${k.type}-rows`) last.rows.push(k.cells);
    else if (k.type === 'dash' || k.type === 'kv') blocks.push({ type: `${k.type}-rows`, rows: [k.cells], line: lines[i] });
    else if (k.type === 'list' && last?.type === 'markdown-list') last.text += `\n${lines[i]}`;
    else if (k.type === 'list') blocks.push({ type: 'markdown-list', text: lines[i] });
    else blocks.push({ type: k.type, text: lines[i] });
  }
  // A lone row is clearer as a sentence; dash tables pad short rows before their last cell.
  return blocks.map((b) => {
    if ((b.type === 'dash-rows' || b.type === 'kv-rows') && b.rows.length < 2) return { type: 'text', text: b.line };
    if (b.type === 'dash-rows') {
      const n = Math.max(...b.rows.map((r) => r.length));
      return { type: 'table', rows: b.rows.map((r) => (r.length === n ? r : [...r.slice(0, -1), ...Array(n - r.length).fill(''), r[r.length - 1]])) };
    }
    if (b.type === 'kv-rows') return { type: 'table', kv: true, rows: b.rows };
    return b;
  });
}

function Blocks({ text, hl = null }) {
  const blocks = useMemo(() => structure(text), [text]);
  return blocks.map((b, i) => {
    if (b.type === 'markdown' || b.type === 'markdown-list') return <MathMarkdown highlight={hl} key={i} source={b.text} />;
    if (b.type === 'lead') return <p key={i} className="font-semibold text-slate-900 dark:text-white"><MathMarkdown highlight={hl} source={b.text} inline /></p>;
    if (b.type === 'heading') return <p key={i} className="mt-3 text-sm font-bold text-slate-900 first:mt-0 dark:text-white"><MathMarkdown highlight={hl} source={b.text} inline /></p>;
    if (b.type === 'table') {
      return (
        <div key={i} className="my-3 overflow-x-auto rounded-xl ring-1 ring-slate-200 dark:ring-slate-700">
          <table className="w-full border-collapse text-sm">
            <tbody>
              {b.rows.map((r, ri) => (
                <tr key={ri} className="border-t border-slate-200 first:border-t-0 odd:bg-slate-50 dark:border-slate-700 dark:odd:bg-slate-800/50">
                  {r.map((c, ci) => (
                    <td key={ci} className={`px-3 py-2 align-top ${ci === 0 ? 'whitespace-nowrap font-semibold text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-200'} ${b.kv && ci === 0 ? 'w-1/3' : ''}`}>
                      {c && <MathMarkdown highlight={hl} source={c} inline />}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    return <p key={i} className="mt-2 first:mt-0"><MathMarkdown highlight={hl} source={b.text} inline /></p>;
  });
}

/**
 * Like <Localized markdown>, but a structured multi-line text (a fact statement written as
 * "IBRD – … – 1944" rows or "Headquarters: …" lines) is shown as a table instead of one run-on
 * paragraph. Every language is rendered in its own slot, exactly as Localized does.
 * `highlights` ({ en: [...], bn: [...] }) marks those key terms, and dates/numbers, in the text.
 */
export const StructuredText = memo(function StructuredText({ value, className, highlights = null }) {
  const slots = useMemo(() => slotsFor(value), [value]);
  return slots.map(({ source, targets, fallbackFor }) => (
    <div key={source} data-l={targets.join(' ')} data-fallback-for={fallbackFor.length ? fallbackFor.join(' ') : undefined} lang={source} className={className}>
      {fallbackFor.length > 0 && <FallbackBadge />}
      <Blocks text={value[source]} hl={highlights ? highlights[source] ?? [] : null} />
    </div>
  ));
});

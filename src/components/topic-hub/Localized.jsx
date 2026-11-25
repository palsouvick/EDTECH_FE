import { memo, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import katex from 'katex';
import { UI } from '../../lib/i18n';

// Must match the language switcher (hooks/useLanguagePreference.js).
const UI_LANGS = ['en', 'bn'];

// GFM for tables (study books use them for lists of facts). singleTilde off: content writes "~২,৫০০ কিমি"
// for "about", and two such "~" on one line must not turn into strikethrough.
const REMARK_PLUGINS = [[remarkGfm, { singleTilde: false }], remarkMath];
// ✗ / ✓ in content (wrong vs right examples) become red / green badges so students see them at once.
const MARK_RE = /([✗✘✓✔])/;
const MARK_CLASS = { '✗': 'mark-wrong', '✘': 'mark-wrong', '✓': 'mark-right', '✔': 'mark-right' };
function rehypeRightWrongMarks() {
  const walk = (node) => {
    if (!node.children || (node.type === 'element' && (node.tagName === 'code' || node.tagName === 'pre'))) return;
    node.children = node.children.flatMap((child) => {
      if (child.type !== 'text' || !MARK_RE.test(child.value)) {
        walk(child);
        return [child];
      }
      return child.value.split(MARK_RE).filter(Boolean).map((part) =>
        MARK_CLASS[part]
          ? { type: 'element', tagName: 'span', properties: { className: [MARK_CLASS[part]] }, children: [{ type: 'text', value: part }] }
          : { type: 'text', value: part },
      );
    });
  };
  return walk;
}

// strict:'ignore' so editor typos degrade to red source text instead of breaking the page.
const REHYPE_PLUGINS = [rehypeRightWrongMarks, [rehypeKatex, { throwOnError: false, strict: 'ignore' }]];
// Links in content are sources (e.g. a current-affairs question's PIB release):
// open them in a new tab so the student keeps their place in practice.
const Anchor = ({ href, children }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="font-medium text-indigo-600 underline underline-offset-2 hover:text-indigo-500 dark:text-indigo-400">
    {children}
  </a>
);
// Wide tables scroll sideways inside their own box instead of widening the page on phones.
const Table = ({ children }) => (
  <div className="md-table">
    <table>{children}</table>
  </div>
);
const BLOCK_COMPONENTS = { a: Anchor, table: Table };
const INLINE_COMPONENTS = { p: ({ children }) => children, a: Anchor };

/**
 * Group UI languages by the content language that will serve them:
 *   { en, bn }  ->  [{ source: 'en', targets: ['en', 'hi'] }, { source: 'bn', targets: ['bn'] }]
 * Missing languages fall back to English, then to whatever exists.
 */
function slotsFor(value) {
  if (!value) return [];
  const groups = new Map(); // source language -> { targets, fallbackFor }
  for (const target of UI_LANGS) {
    let source = value[target] ? target : value.en ? 'en' : UI_LANGS.find((l) => value[l]);
    if (!source) continue;
    const fallback = source !== target;
    // Identical text in two languages ("SSC", "12%") is rendered once and shared.
    if (!fallback) source = [...groups.keys()].find((s) => value[s] === value[target]) ?? source;
    if (!groups.has(source)) groups.set(source, { targets: [], fallbackFor: [] });
    groups.get(source).targets.push(target);
    if (fallback) groups.get(source).fallbackFor.push(target);
  }
  return [...groups].map(([source, g]) => ({ source, ...g }));
}

/** Markdown + KaTeX ($inline$, $$display$$). Memoised: typesetting runs once per string. */
export const MathMarkdown = memo(function MathMarkdown({ source, inline = false }) {
  if (inline) {
    return (
      <span className="md-inline">
        <ReactMarkdown remarkPlugins={REMARK_PLUGINS} rehypePlugins={REHYPE_PLUGINS} components={INLINE_COMPONENTS}>
          {source}
        </ReactMarkdown>
      </span>
    );
  }
  return (
    <div className="md-body">
      <ReactMarkdown remarkPlugins={REMARK_PLUGINS} rehypePlugins={REHYPE_PLUGINS} components={BLOCK_COMPONENTS}>
        {source}
      </ReactMarkdown>
    </div>
  );
});

/** A language-neutral LaTeX formula. KaTeX output includes MathML for screen readers. */
export const Tex = memo(function Tex({ latex, display = false, className = '' }) {
  const html = useMemo(
    () => katex.renderToString(latex, { displayMode: display, throwOnError: false, strict: 'ignore', output: 'htmlAndMathml' }),
    [latex, display],
  );
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
});

function FallbackBadge() {
  return (
    <abbr
      className="fallback-badge float-right ml-2 mt-0.5 items-center rounded border border-slate-300 px-1 text-[10px] font-semibold uppercase leading-4 tracking-wide text-slate-500 no-underline dark:border-slate-600 dark:text-slate-400"
      title={UI.notTranslated.en}
      lang="en"
    >
      EN
    </abbr>
  );
}

/**
 * Renders every available language of `value` once; CSS keyed on
 * <html data-ui-lang> shows the active one. Switching language therefore
 * never re-renders or re-typesets this component.
 *
 * @param {{ en?: string, bn?: string, hi?: string }} props.value
 * @param {'span'|'div'|'p'|'h2'|'h3'|'li'} [props.as]
 * @param {boolean} [props.markdown]  render Markdown + math (use a block `as`)
 * @param {boolean} [props.inline]    Markdown without paragraph wrappers (titles)
 */
export const Localized = memo(function Localized({ value, as: Tag = 'span', markdown = false, inline = false, className }) {
  const slots = useMemo(() => slotsFor(value), [value]);
  return slots.map(({ source, targets, fallbackFor }) => (
    <Tag
      key={source}
      data-l={targets.join(' ')}
      data-fallback-for={fallbackFor.length ? fallbackFor.join(' ') : undefined}
      lang={source}
      className={className}
    >
      {fallbackFor.length > 0 && <FallbackBadge />}
      {markdown ? <MathMarkdown source={value[source]} inline={inline} /> : value[source]}
    </Tag>
  ));
});

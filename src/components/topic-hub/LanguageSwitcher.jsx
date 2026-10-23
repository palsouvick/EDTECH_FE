import { useRef } from 'react';
import { useLanguagePreference } from '../../hooks/useLanguagePreference';

/**
 * Segmented EN / বাংলা / हिन्दी control. The only part of the hub that
 * re-renders on a language switch: it has to move its highlight.
 * Keyboard: arrow keys move and select, per the WAI-ARIA radio group pattern.
 */
export default function LanguageSwitcher({ className = '', only }) {
  const { lang, setLang, languages: all } = useLanguagePreference();
  // `only` limits the choices, e.g. ['en', 'bn'] in a test paper set in those two.
  const languages = only ? all.filter((l) => only.includes(l.code)) : all;
  const refs = useRef([]);

  function onKeyDown(e) {
    const i = languages.findIndex((l) => l.code === lang);
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!step) return;
    e.preventDefault();
    const next = (i + step + languages.length) % languages.length;
    setLang(languages[next].code);
    refs.current[next]?.focus();
  }

  return (
    <div
      role="radiogroup"
      aria-label="Language / ভাষা"
      onKeyDown={onKeyDown}
      className={`inline-flex shrink-0 rounded-full bg-slate-100 p-0.5 ring-1 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700 ${className}`}
    >
      {languages.map((l, i) => {
        const active = l.code === lang;
        return (
          <button
            key={l.code}
            ref={(el) => (refs.current[i] = el)}
            type="button"
            role="radio"
            aria-checked={active}
            // Keep one button tabbable even when the active language is filtered out.
            tabIndex={active || (i === 0 && !languages.some((x) => x.code === lang)) ? 0 : -1}
            lang={l.code}
            onClick={() => setLang(l.code)}
            className={`min-h-8 rounded-full px-2.5 text-xs font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-indigo-500 sm:px-3 ${
              active
                ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-950 dark:text-indigo-300'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-100'
            }`}
          >
            {l.label}
          </button>
        );
      })}
    </div>
  );
}

import { useCallback, useSyncExternalStore } from 'react';
import { createPersistentStore } from '../lib/persistentStore';

export const LANGUAGES = Object.freeze([
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'bn', label: 'বাংলা', short: 'বাং' },
]);

const CODES = LANGUAGES.map((l) => l.code);
export const LANGUAGE_STORAGE_KEY = 'edtech:lang';

/** First-visit default: the browser's preferred language if we support it. */
function detectLanguage() {
  if (typeof navigator === 'undefined') return 'en';
  for (const tag of navigator.languages || [navigator.language]) {
    const base = String(tag).toLowerCase().split('-')[0];
    if (CODES.includes(base)) return base;
  }
  return 'en';
}

export const languageStore = createPersistentStore(LANGUAGE_STORAGE_KEY, detectLanguage, {
  validate: (v) => CODES.includes(v),
});

/**
 * The active language lives on <html data-ui-lang> and CSS shows the matching
 * slot of every localized block. Writing the attribute is the whole switch, so
 * content components never subscribe to the language and never re-render.
 */
function applyToDocument(lang) {
  const root = document.documentElement;
  if (root.dataset.uiLang === lang) return;
  root.dataset.uiLang = lang;
  root.lang = lang;
}

if (typeof document !== 'undefined') {
  applyToDocument(languageStore.get());
  // Also covers changes made in another tab.
  languageStore.subscribe(() => applyToDocument(languageStore.get()));
}

/**
 * Switching language changes the height of text above the viewport (Bengali
 * and Devanagari set taller than Latin), which would make the page jump. Take
 * the visible anchor whose top is nearest the sticky bar's edge (the block the
 * student is reading), switch, then scroll by however far that anchor moved.
 *
 * "Nearest", not "first visible": a tall section that started far above the
 * viewport is technically visible, but text inside it above the fold also
 * changes height, so anchoring to its top would still let the content jump.
 */
function captureScrollAnchor() {
  const stickyBottom = document.querySelector('[data-sticky-top]')?.getBoundingClientRect().bottom ?? 0;
  let best = null;
  for (const el of document.querySelectorAll('[data-scroll-anchor]')) {
    if (el.closest('[inert]')) continue; // inside a collapsed section
    const rect = el.getBoundingClientRect();
    if (rect.height === 0 || rect.bottom <= stickyBottom + 1) continue;
    const distance = Math.abs(rect.top - stickyBottom);
    if (!best || distance < best.distance) best = { el, top: rect.top, distance };
  }
  return best;
}

function switchLanguage(next) {
  if (!CODES.includes(next) || next === languageStore.get()) return;

  const root = document.documentElement;
  const anchor = captureScrollAnchor();
  // Turn off native scroll anchoring so it cannot double-correct with ours.
  root.classList.add('lang-switching');

  languageStore.set(next); // synchronously rewrites data-ui-lang via the subscription

  if (anchor) {
    const delta = anchor.el.getBoundingClientRect().top - anchor.top; // forces layout
    if (Math.abs(delta) > 0.5) window.scrollBy(0, delta);
  }
  const raf = window.requestAnimationFrame ?? ((cb) => setTimeout(cb, 16));
  raf(() => raf(() => root.classList.remove('lang-switching')));
}

/**
 * Language preference: persisted in localStorage, synced across tabs, applied
 * before first paint (see the inline script in index.html).
 *
 * Only components that display the *current* language (the switcher itself)
 * should call this. Content is rendered with <Localized>, which needs no state.
 *
 * @returns {{ lang: 'en'|'bn'|'hi', setLang: (code: string) => void, languages: typeof LANGUAGES }}
 */
export function useLanguagePreference() {
  const lang = useSyncExternalStore(languageStore.subscribe, languageStore.get, () => 'en');
  const setLang = useCallback((next) => switchLanguage(next), []);
  return { lang, setLang, languages: LANGUAGES };
}

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useLocation } from 'react-router-dom';
import { useLanguagePreference } from '../../hooks/useLanguagePreference';
import { NAV } from '../../lib/homeCopy';
import LanguageSwitcher from '../topic-hub/LanguageSwitcher';
import { Localized } from '../topic-hub/Localized';
import { XIcon } from '../topic-hub/icons';
import { ITEMS } from './SiteNav';

/**
 * Phones only (below md): a Menu button that opens a sheet with every site section
 * as a large tap target, plus the language switch. It replaces the sideways-scrolling
 * tab row there, where students could not see that more sections existed.
 * Desktop and tablet keep SiteNav exactly as before (SiteHeader shows it from md up).
 *
 * The sheet is portalled to <body>: the header's backdrop-blur makes it the
 * containing block for fixed children, which would trap the overlay inside the header.
 */
export default function MobileMenu({ showLanguage = true }) {
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const { lang } = useLanguagePreference();
  const button = useRef(null);
  const sheet = useRef(null);
  const say = (l) => l[lang] || l.en;

  // Close when a link navigates.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const close = () => {
      setOpen(false);
      button.current?.focus();
    };
    const onKey = (e) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden'; // the page behind must not scroll under the sheet
    sheet.current?.querySelector('[aria-current="page"], a')?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  return (
    <div className="md:hidden">
      <button
        ref={button}
        type="button"
        onClick={() => setOpen(true)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={say(NAV.openMenu)}
        className="grid size-10 place-items-center rounded-xl text-slate-700 ring-1 ring-slate-300 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:text-slate-200 dark:ring-slate-600 dark:hover:bg-slate-800"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>

      {open &&
        createPortal(
          <>
            <div aria-hidden="true" onClick={() => setOpen(false)} className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-[2px]" />
            <div
              id="mobile-menu"
              ref={sheet}
              role="dialog"
              aria-modal="true"
              aria-label={say(NAV.menu)}
              className="fixed inset-x-0 top-0 z-50 max-h-dvh overflow-y-auto rounded-b-2xl bg-white px-4 pb-5 pt-[calc(env(safe-area-inset-top)+0.75rem)] shadow-2xl dark:bg-slate-900"
            >
              <div className="flex items-center justify-between">
                <Localized value={NAV.menu} as="h2" className="text-base font-bold text-slate-900 dark:text-white" />
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    button.current?.focus();
                  }}
                  aria-label={say(NAV.closeMenu)}
                  className="grid size-10 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <XIcon width={20} height={20} aria-hidden="true" />
                </button>
              </div>

              <nav aria-label="Site" className="mt-3 grid grid-cols-2 gap-2">
                {ITEMS.map((i) => (
                  <NavLink
                    key={i.key}
                    to={i.to}
                    end={i.end}
                    onClick={() => setOpen(false)}
                    className={({ isActive }) =>
                      `flex min-h-12 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-indigo-500 ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30'
                          : 'bg-slate-50 text-slate-800 ring-1 ring-slate-200 hover:bg-slate-100 dark:bg-slate-800/60 dark:text-slate-100 dark:ring-slate-700'
                      }`
                    }
                  >
                    <span aria-hidden="true" className="text-lg leading-none">
                      {i.icon}
                    </span>
                    <Localized value={i.menuLabel ?? i.label} />
                  </NavLink>
                ))}
              </nav>

              {showLanguage && (
                <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                  <Localized value={NAV.language} className="text-sm font-medium text-slate-600 dark:text-slate-300" />
                  <LanguageSwitcher />
                </div>
              )}
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}

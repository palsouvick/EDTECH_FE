import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CONSENT_EVENTS, readConsent, saveConsent } from '../../lib/consent';
import { COOKIE } from '../../lib/homeCopy';
import { Localized } from '../topic-hub/Localized';

function Toggle({ checked, disabled, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${checked ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'} ${disabled ? 'opacity-60' : ''}`}
    >
      <span className={`absolute top-0.5 size-5 rounded-full bg-white transition-all ${checked ? 'left-[22px]' : 'left-0.5'}`} />
    </button>
  );
}

const primary = 'min-h-11 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-500';
const secondary = 'min-h-11 rounded-xl px-5 text-sm font-semibold text-slate-800 ring-1 ring-slate-300 hover:bg-slate-100 dark:text-white dark:ring-slate-600 dark:hover:bg-slate-800';

/** First-visit consent banner with a "Customize" panel; reopenable from the footer. */
export default function CookieConsent() {
  const [open, setOpen] = useState(() => readConsent() === null);
  const [custom, setCustom] = useState(false);
  const [prefs, setPrefs] = useState(() => readConsent()?.preferences ?? true);

  useEffect(() => {
    const show = () => { setPrefs(readConsent()?.preferences ?? true); setCustom(true); setOpen(true); };
    window.addEventListener(CONSENT_EVENTS.open, show);
    return () => window.removeEventListener(CONSENT_EVENTS.open, show);
  }, []);

  if (!open) return null;
  const decide = (preferences) => { saveConsent({ preferences }); setOpen(false); setCustom(false); };

  return (
    <div role="dialog" aria-modal="false" aria-labelledby="consent-title" className="fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-4">
      <div className="mx-auto max-w-3xl rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
        <Localized value={COOKIE.title} as="h2" id="consent-title" className="font-bold text-slate-900 dark:text-white" />
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          <Localized value={COOKIE.body} />{' '}
          <Link to="/privacy" className="font-semibold text-indigo-700 underline dark:text-indigo-300">
            <Localized value={COOKIE.learn} />
          </Link>
        </p>

        {custom && (
          <ul className="mt-4 space-y-3">
            {[
              { key: 'essential', on: true, locked: true, c: COOKIE.essential },
              { key: 'prefs', on: prefs, locked: false, c: COOKIE.prefs },
            ].map((r) => (
              <li key={r.key} className="flex items-start justify-between gap-4 rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
                <div>
                  <Localized value={r.c.title} as="div" className="text-sm font-semibold text-slate-900 dark:text-white" />
                  <Localized value={r.c.body} as="p" className="mt-0.5 text-xs text-slate-600 dark:text-slate-300" />
                </div>
                <Toggle checked={r.on} disabled={r.locked} onChange={setPrefs} label={r.c.title.en} />
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
          {custom ? (
            <button type="button" className={primary} onClick={() => decide(prefs)}>
              <Localized value={COOKIE.save} />
            </button>
          ) : (
            <>
              <button type="button" className={secondary} onClick={() => setCustom(true)}>
                <Localized value={COOKIE.customize} />
              </button>
              <button type="button" className={secondary} onClick={() => decide(false)}>
                <Localized value={COOKIE.reject} />
              </button>
              <button type="button" className={primary} onClick={() => decide(true)}>
                <Localized value={COOKIE.accept} />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

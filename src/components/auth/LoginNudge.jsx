import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useOptionalAuth } from '../../app/AuthContext';
import { AUTH } from '../../lib/i18n';
import { Localized } from '../topic-hub/Localized';
import { loginPath } from './AccountButton';

const KEY = 'loginNudge:dismissed';

const seen = () => {
  try {
    return sessionStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
};

/** One-time-per-session popup telling signed-out students that progress is not tracked. */
export default function LoginNudge({ delayMs = 1200 }) {
  const auth = useOptionalAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const show = auth?.status === 'ready' && !auth.user;

  useEffect(() => {
    if (!show || seen()) return undefined;
    const t = setTimeout(() => setOpen(true), delayMs);
    return () => clearTimeout(t);
  }, [show, delayMs]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && close();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  function close() {
    try {
      sessionStorage.setItem(KEY, '1');
    } catch {
      /* private mode: the popup may show again, which is acceptable */
    }
    setOpen(false);
  }

  if (!open || auth?.user) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/50 p-4 backdrop-blur-sm" onClick={close}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="login-nudge-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700"
      >
        <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-2xl text-white shadow-lg shadow-indigo-500/30">
          📈
        </div>
        <h2 id="login-nudge-title" className="text-lg font-bold text-slate-900 dark:text-white">
          <Localized value={AUTH.nudgeTitle} />
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
          <Localized value={AUTH.nudgeBody} />
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <Link
            to={loginPath(location)}
            onClick={close}
            autoFocus
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white shadow-md shadow-indigo-500/30 hover:bg-indigo-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
          >
            <Localized value={AUTH.login} />
          </Link>
          <Link
            to={loginPath(location, 'register')}
            onClick={close}
            className="inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-50 dark:text-indigo-300 dark:ring-indigo-800 dark:hover:bg-indigo-950"
          >
            <Localized value={AUTH.register} />
          </Link>
          <button
            type="button"
            onClick={close}
            className="min-h-10 rounded-xl px-4 text-sm font-medium text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            <Localized value={AUTH.nudgeLater} />
          </button>
        </div>
      </div>
    </div>
  );
}

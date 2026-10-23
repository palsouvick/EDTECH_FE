import { useEffect, useId, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { REVISION } from '../../lib/revisionCopy';
import { useOptionalAuth } from '../../app/AuthContext';
import { AUTH } from '../../lib/i18n';
import { NAV } from '../../lib/homeCopy';
import { Localized } from '../topic-hub/Localized';

/** "/login?next=/exams/ssc" for the page the student is on now. */
export function loginPath(location, mode = 'login') {
  const next = `${location.pathname}${location.search}`;
  return `/${mode}?next=${encodeURIComponent(next)}`;
}

const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || '?';

/** Header control: "Log in" when signed out; initials + menu (performance, log out) when signed in. */
export default function AccountButton(props) {
  const auth = useOptionalAuth();
  // Outside an AuthProvider (a component rendered on its own) there is no account to show.
  return auth ? <AccountControl auth={auth} {...props} /> : null;
}

function AccountControl({ auth, className = '' }) {
  const { status, user, logout } = auth;
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const rootRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => {
      if (e.type === 'keydown' ? e.key === 'Escape' : !rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  if (status === 'loading') return <span className={`inline-block size-9 ${className}`} aria-hidden="true" />;

  if (!user) {
    return (
      <span className={`inline-flex shrink-0 items-center gap-1.5 ${className}`}>
        <Link
          to={loginPath(location)}
          className="inline-flex min-h-9 items-center rounded-lg px-3 text-sm font-semibold text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:text-indigo-300 dark:ring-indigo-800 dark:hover:bg-indigo-950"
        >
          <Localized value={AUTH.login} />
        </Link>
        <Link
          to={loginPath(location, 'register')}
          className="hidden min-h-9 items-center rounded-lg bg-indigo-600 px-3 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 sm:inline-flex"
        >
          <Localized value={NAV.signup} />
        </Link>
      </span>
    );
  }

  const item = 'block w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800';
  return (
    <div ref={rootRef} className={`relative shrink-0 ${className}`}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`${AUTH.account.en}: ${user.name}`}
        onClick={() => setOpen((o) => !o)}
        className="grid size-9 place-items-center rounded-full bg-indigo-600 text-sm font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
      >
        {initials(user.name)}
      </button>
      {open && (
        <div id={menuId} role="menu" className="absolute right-0 z-40 mt-2 w-56 rounded-xl bg-white p-1.5 shadow-lg ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-700">
          <div className="px-3 py-2">
            <div className="truncate text-sm font-semibold text-slate-900 dark:text-white">{user.name}</div>
            <div className="truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</div>
          </div>
          <Link role="menuitem" to="/me" className={item} onClick={() => setOpen(false)}>
            <Localized value={AUTH.myPerformance} />
          </Link>
          <Link role="menuitem" to="/revision" className={item} onClick={() => setOpen(false)}>
            <span aria-hidden="true">📌 </span>
            <Localized value={REVISION.title} />
          </Link>
          <button
            role="menuitem"
            type="button"
            className={item}
            onClick={async () => {
              setOpen(false);
              await logout();
              if (location.pathname === '/me') navigate('/exams', { replace: true });
            }}
          >
            <Localized value={AUTH.logout} />
          </button>
        </div>
      )}
    </div>
  );
}

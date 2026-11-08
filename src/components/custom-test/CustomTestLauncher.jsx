import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useDataSource } from '../../app/DataSourceContext';
import { useOptionalAuth } from '../../app/AuthContext';
import { HAS_DEV_USER } from '../../lib/api';
import { CT } from '../../lib/customTestCopy';
import { loginPath } from '../auth/AccountButton';
import { Localized } from '../topic-hub/Localized';
import CustomTestDialog from './CustomTestDialog';
import CustomHistoryCard from './CustomHistoryCard';

/**
 * "🎯 Custom Practice Test" on a Learn subject page: opens the setup popup, and below it the
 * student's custom-test history. Custom tests are stored per account, so guests are asked to sign in.
 */
export default function CustomTestLauncher({ subject, className = '' }) {
  const source = useDataSource();
  const auth = useOptionalAuth();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  if (typeof source.createCustomTest !== 'function') return null; // offline fixtures have no custom tests
  const signedIn = HAS_DEV_USER || Boolean(auth?.user);
  const waiting = Boolean(auth) && auth.status !== 'ready';

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex flex-col gap-3 rounded-2xl bg-gradient-to-r from-indigo-50 via-violet-50 to-fuchsia-50 p-4 ring-1 ring-indigo-200 sm:flex-row sm:items-center sm:justify-between dark:from-indigo-500/10 dark:via-violet-500/10 dark:to-fuchsia-500/10 dark:ring-indigo-500/30">
        <div className="min-w-0">
          <Localized value={CT.button} as="p" className="text-lg font-extrabold text-slate-900 dark:text-white" />
          <Localized value={signedIn || waiting ? CT.buttonHint : CT.signInToUse} as="p" className="text-sm text-slate-600 dark:text-slate-300" />
        </div>
        {signedIn || waiting ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            disabled={waiting}
            className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 text-base font-bold text-white shadow-lg shadow-indigo-500/25 hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 disabled:opacity-60"
          >
            <Localized value={CT.button} />
          </button>
        ) : (
          <Link to={loginPath(location)} className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-xl bg-indigo-600 px-5 text-base font-bold text-white hover:bg-indigo-500">
            <Localized value={CT.signInToUse} />
          </Link>
        )}
      </div>
      {signedIn && <CustomHistoryCard subject={subject} />}
      {open && <CustomTestDialog open onClose={() => setOpen(false)} subject={subject} />}
    </div>
  );
}

import { Link } from 'react-router-dom';
import { FUNNEL } from '../../lib/i18n';
import { COOKIE, FOOTER, NAV } from '../../lib/homeCopy';
import { openConsentSettings } from '../../lib/consent';
import { Localized } from '../topic-hub/Localized';
import { SigmaIcon } from '../topic-hub/icons';

const LINKS = [
  { to: '/', label: NAV.home },
  { to: '/exams', label: NAV.exams },
  { to: '/learn', label: NAV.learn },
  { to: '/tips', label: NAV.tips },
  { to: '/me', label: NAV.progress },
  { to: '/register', label: NAV.signup },
  { to: '/privacy', label: NAV.privacy },
];

/** Site footer with navigation and copyright. */
export default function Footer({ className = '' }) {
  return (
    <footer className={`border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 ${className}`}>
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 md:flex-row md:items-center md:justify-between">
        <div className="max-w-sm">
          <Link to="/" className="inline-flex items-center gap-2 font-bold text-slate-900 dark:text-white">
            <span className="grid size-8 place-items-center rounded-lg bg-indigo-600 text-white">
              <SigmaIcon width={18} height={18} />
            </span>
            <Localized value={FUNNEL.brand} />
          </Link>
          <Localized value={FOOTER.tagline} as="p" className="mt-2 text-sm text-slate-500 dark:text-slate-400" />
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-slate-600 dark:text-slate-300">
          {LINKS.map((l) => (
            <Link key={l.to} to={l.to} className="hover:text-indigo-600 hover:underline dark:hover:text-indigo-400">
              <Localized value={l.label} />
            </Link>
          ))}
          <button type="button" onClick={openConsentSettings} className="hover:text-indigo-600 hover:underline dark:hover:text-indigo-400">
            <Localized value={COOKIE.settings} />
          </button>
        </nav>
      </div>
      <div className="border-t border-slate-100 py-4 text-center text-xs text-slate-500 dark:border-slate-900 dark:text-slate-400">
        © {new Date().getFullYear()} Exam Prep. <Localized value={FOOTER.rights} />
      </div>
    </footer>
  );
}

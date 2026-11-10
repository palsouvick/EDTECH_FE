import { Link } from 'react-router-dom';
import { FUNNEL } from '../../lib/i18n';
import AccountButton from '../auth/AccountButton';
import LanguageSwitcher from '../topic-hub/LanguageSwitcher';
import { Localized } from '../topic-hub/Localized';
import { SigmaIcon } from '../topic-hub/icons';
import MobileMenu from './MobileMenu';
import SiteNav from './SiteNav';

/**
 * Site header: brand, tabs, language, account.
 * The study page passes sticky={false} (its own breadcrumb bar sticks instead,
 * so a phone does not lose a third of the screen to two bars) and
 * showLanguage={false} (that bar carries the language switch).
 */
export default function SiteHeader({ sticky = true, showLanguage = true }) {
  return (
    <header
      data-sticky-top={sticky || undefined}
      className={`${sticky ? 'sticky top-0' : 'relative'} z-30 border-b border-slate-200/80 bg-white/85 pt-[env(safe-area-inset-top)] backdrop-blur-md dark:border-slate-800 dark:bg-slate-950/85`}
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5">
        <Link to="/" className="flex shrink-0 items-center gap-2 font-bold text-slate-900 dark:text-white">
          <span className="grid size-8 place-items-center rounded-lg bg-indigo-600 text-white">
            <SigmaIcon width={18} height={18} />
          </span>
          <Localized value={FUNNEL.brand} />
        </Link>
        {/* md and up: the tab row, exactly as before. Phones use MobileMenu instead of a row
            that scrolled sideways and hid most sections. */}
        <SiteNav desktopOnly className="order-last basis-full md:order-none md:basis-auto md:flex-1 md:justify-center-safe" />
        <div className="ml-auto flex items-center gap-2">
          {/* On phones the language switch moves into the menu sheet: brand, language,
              account and menu do not fit one 390px row. */}
          {showLanguage && <LanguageSwitcher hideBelow="md" />}
          <AccountButton />
          <MobileMenu showLanguage={showLanguage} />
        </div>
      </div>
    </header>
  );
}

import { Link, NavLink, useLocation } from 'react-router-dom';
import { NAV } from '../../lib/homeCopy';
import { PLAN } from '../../lib/planCopy';
import { Localized } from '../topic-hub/Localized';

// `icon` and `menuLabel` are used only by the phone menu (MobileMenu.jsx); the tabs show `label`.
export const ITEMS = [
  { key: 'home', to: '/', end: true, label: NAV.home, icon: '🏠' },
  { key: 'exams', to: '/exams', label: NAV.exams, icon: '📝' },
  { key: 'plan', to: '/plan', label: PLAN.nav, icon: '🗓️' },
  { key: 'ido', to: '/ido', label: { en: '🏛️ IDO', bn: '🏛️ IDO' }, icon: '🏛️', menuLabel: { en: 'IDO', bn: 'IDO' } },
  { key: 'learn', to: '/learn', label: NAV.learn, icon: '📘' },
  { key: 'pyq', to: '/pyq', label: NAV.pyq, icon: '📜' },
  { key: 'vocabulary', to: '/vocabulary', label: NAV.vocabulary, icon: '🔤' },
  { key: 'tips', to: '/tips', label: NAV.tips, icon: '💡' },
  { key: 'progress', to: '/me', label: NAV.progress, icon: '📈' },
];

const base = 'shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-indigo-500';
const idle = 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800';
const active = 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30';

/**
 * Site-wide tabs: Home, Exams, 60-day plan, Learn Basics (Math + English + GK), PYQ, Study tips, My progress.
 * desktopOnly: hidden below md, where MobileMenu takes over. The display class is chosen here
 * rather than passing `hidden` in className, because the nav's own `flex` would win over it.
 */
export default function SiteNav({ className = '', desktopOnly = false }) {
  const { pathname, hash } = useLocation();
  return (
    <nav aria-label="Site" className={`${desktopOnly ? 'hidden md:flex' : 'flex'} gap-1 overflow-x-auto [scrollbar-width:none] ${className}`}>
      {ITEMS.map((i) =>
        i.hash ? (
          <Link key={i.key} to={i.to} className={`${base} ${pathname === '/' && hash === '#how-it-works' ? active : idle}`}>
            <Localized value={i.label} />
          </Link>
        ) : (
          <NavLink
            key={i.key}
            to={i.to}
            end={i.end}
            className={({ isActive }) => `${base} ${isActive && !(i.key === 'home' && hash) ? active : idle}`}
          >
            <Localized value={i.label} />
          </NavLink>
        ),
      )}
    </nav>
  );
}

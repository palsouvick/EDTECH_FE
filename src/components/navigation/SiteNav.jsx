import { Link, NavLink, useLocation } from 'react-router-dom';
import { NAV } from '../../lib/homeCopy';
import { Localized } from '../topic-hub/Localized';

const ITEMS = [
  { key: 'home', to: '/', end: true, label: NAV.home },
  { key: 'exams', to: '/exams', label: NAV.exams },
  { key: 'learn', to: '/learn', label: NAV.learn },
  { key: 'tips', to: '/tips', label: NAV.tips },
  { key: 'progress', to: '/me', label: NAV.progress },
];

const base = 'shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-indigo-500';
const idle = 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800';
const active = 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30';

/** Site-wide tabs: Home, Exams, Learn Basics (Math + English), Study tips, My progress. */
export default function SiteNav({ className = '' }) {
  const { pathname, hash } = useLocation();
  return (
    <nav aria-label="Site" className={`flex gap-1 overflow-x-auto [scrollbar-width:none] ${className}`}>
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

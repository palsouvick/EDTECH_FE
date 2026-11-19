import { Link, useInRouterContext, useLocation } from 'react-router-dom';
import { LEARN_LINK, learnLinkPath } from '../../lib/learnLink';
import { Localized } from '../topic-hub/Localized';

const box = 'flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl bg-indigo-50 px-3 py-2.5 ring-1 ring-indigo-200 dark:bg-indigo-500/10 dark:ring-indigo-500/30';
const cta = 'inline-flex min-h-10 items-center gap-1 rounded-lg bg-indigo-600 px-3 text-sm font-bold text-white hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500';

function Body({ learn, to, newTab, className }) {
  const label = (
    <>
      📖 <Localized value={LEARN_LINK.cta} /> {newTab ? '↗' : '→'}
    </>
  );
  return (
    <nav aria-label={LEARN_LINK.label.en} className={`${box} ${className}`} data-testid="learn-this">
      {/* A new tab keeps the student's place in a running test or practice set. */}
      {newTab ? (
        <a href={to} target="_blank" rel="noopener" className={cta}>{label}</a>
      ) : (
        <Link to={to} className={cta}>{label}</Link>
      )}
      {learn.crumbs?.length > 0 && (
        <ol className="flex min-w-0 flex-wrap items-center gap-x-1.5 text-sm text-indigo-950 dark:text-indigo-100">
          {learn.crumbs.map((c, i) => (
            <li key={i} className="flex items-center gap-1.5">
              {i > 0 && <span aria-hidden="true" className="text-indigo-400">→</span>}
              <Localized value={c} className={i === learn.crumbs.length - 1 ? 'font-semibold' : ''} />
            </li>
          ))}
        </ol>
      )}
    </nav>
  );
}

/** Hidden on the very page it points to (a section of the same book chapter still shows: it scrolls there). */
function RoutedLearnLink(props) {
  const { pathname } = useLocation();
  const [path, hash] = props.to.split('#');
  if (path === pathname && !hash) return null;
  return <Body {...props} newTab={props.newTab && path !== pathname} />;
}

/**
 * "📖 Learn this topic" with its Subject → Chapter → Topic breadcrumb. Renders nothing when the
 * answer has no reliable learning source (`learn` null) — never a guessed link.
 */
export default function LearnThisLink({ learn, newTab = false, className = '' }) {
  const routed = useInRouterContext();
  const to = learnLinkPath(learn);
  if (!to) return null;
  return routed ? <RoutedLearnLink learn={learn} to={to} newTab={newTab} className={className} /> : <Body learn={learn} to={to} newTab className={className} />;
}

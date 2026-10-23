import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { Localized } from '../topic-hub/Localized';
import { ChevronRightIcon } from '../topic-hub/icons';

/**
 * Exams › SSC › Quantitative Aptitude › Profit, Loss & Discount
 *
 * Items with `to` are links back to that selection step; the last item is the
 * current page. On narrow screens earlier crumbs stay compact and the last
 * one truncates.
 *
 * @param {{ items: Array<{ key: string, name: { en?: string, bn?: string, hi?: string }, to?: string }> }} props
 */
export default function Breadcrumbs({ items, className = '' }) {
  const parts = items.filter((p) => p?.name);
  return (
    <nav aria-label="Breadcrumb" className={`min-w-0 ${className}`}>
      <ol className="flex min-w-0 items-center gap-1 text-xs text-slate-500 sm:text-sm dark:text-slate-400">
        {parts.map((p, i) => {
          const last = i === parts.length - 1;
          return (
            <Fragment key={p.key}>
              {i > 0 && (
                <li aria-hidden="true" className="shrink-0 text-slate-300 dark:text-slate-600">
                  <ChevronRightIcon />
                </li>
              )}
              <li
                className={last ? 'min-w-0 truncate font-semibold text-slate-900 dark:text-white' : 'min-w-0 max-w-[40%] shrink truncate sm:max-w-none sm:shrink-0'}
                aria-current={last ? 'page' : undefined}
              >
                {p.to && !last ? (
                  <Link
                    to={p.to}
                    className="rounded px-0.5 hover:text-indigo-600 hover:underline focus-visible:outline-2 focus-visible:outline-indigo-500 dark:hover:text-indigo-400"
                  >
                    <Localized value={p.name} />
                  </Link>
                ) : (
                  <Localized value={p.name} />
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}

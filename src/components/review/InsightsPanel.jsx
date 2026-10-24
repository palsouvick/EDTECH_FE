import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDataSource } from '../../app/DataSourceContext';
import { BADGE, BOARD, CHALLENGE, MASTERY, STREAK, WEAK } from '../../lib/motivationCopy';
import { paths } from '../../lib/routes';
import { Localized } from '../topic-hub/Localized';
import { ArrowRightIcon } from '../topic-hub/icons';

const card = 'rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800';

/** Study page for one pattern: its lesson tab, or its questions only ("practise 10"). */
export const patternLink = (w, practise) =>
  `${paths.topic(w.category, w.subject, w.topic)}?pattern=${w.pattern}${practise ? '&practice=10' : '#patterns'}`;

/**
 * "My performance" extras: protected streak, weak question patterns (with
 * links to learn and practise each), badges, and the way to the mastery map,
 * daily challenge and leaderboard.
 */
export default function InsightsPanel() {
  const source = useDataSource();
  const [d, setD] = useState(null);

  useEffect(() => {
    let alive = true;
    source.getInsights().then((x) => alive && setD(x), () => {});
    return () => {
      alive = false;
    };
  }, [source]);

  if (!d) return <div className="h-40 animate-pulse rounded-2xl bg-slate-200/70 motion-reduce:animate-none dark:bg-slate-800/70" aria-busy="true" />;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <Link to="/mastery" className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 p-4 text-white shadow-sm hover:shadow-md">
          <span className="text-2xl" aria-hidden="true">🗺️</span>
          <span className="min-w-0 flex-1">
            <Localized value={MASTERY.title} className="block font-bold" />
            <span className="block text-xs text-white/85">
              {['strong', 'improving', 'weak'].map((s) => `${d.counts[s] ?? 0} ${MASTERY.status[s].en.toLowerCase()}`).join(' · ')}
            </span>
          </span>
          <ArrowRightIcon />
        </Link>
        <Link to="/challenge" className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 p-4 text-white shadow-sm hover:shadow-md">
          <span className="text-2xl" aria-hidden="true">⚡</span>
          <Localized value={CHALLENGE.title} className="min-w-0 flex-1 font-bold" />
          <ArrowRightIcon />
        </Link>
        <Link to="/leaderboard" className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 p-4 text-white shadow-sm hover:shadow-md">
          <span className="text-2xl" aria-hidden="true">🏅</span>
          <Localized value={BOARD.title} className="min-w-0 flex-1 font-bold" />
          <ArrowRightIcon />
        </Link>
      </div>

      <section className={`${card} flex flex-wrap items-center gap-4`}>
        <span className="text-4xl" aria-hidden="true">🔥</span>
        <div className="min-w-0 flex-1">
          <Localized value={STREAK.days(d.streak.days)} as="p" className="text-xl font-extrabold text-slate-900 dark:text-white" />
          <Localized value={STREAK.how(d.streak.freezeEvery)} as="p" className="text-sm text-slate-600 dark:text-slate-300" />
          {d.streak.protectedDays.length > 0 && <Localized value={STREAK.saved(d.streak.protectedDays.length)} as="p" className="text-sm font-semibold text-sky-700 dark:text-sky-300" />}
        </div>
        <span className="rounded-full bg-sky-100 px-3 py-1 text-sm font-bold text-sky-800 dark:bg-sky-500/15 dark:text-sky-200">
          {'🧊'.repeat(d.streak.freezes)} <Localized value={STREAK.freezes(d.streak.freezes)} />
        </span>
      </section>

      <section className={card}>
        <Localized value={WEAK.title} as="h2" className="text-lg font-bold text-slate-900 dark:text-white" />
        <Localized value={WEAK.sub} as="p" className="mt-0.5 text-sm text-slate-600 dark:text-slate-300" />
        {d.weakPatterns.length === 0 ? (
          <Localized value={WEAK.none} as="p" className="mt-4 text-sm text-slate-500" />
        ) : (
          <ul className="mt-4 space-y-3">
            {d.weakPatterns.map((w) => (
              <li key={`${w.topic}.${w.pattern}`} className="rounded-xl bg-rose-50/70 p-4 ring-1 ring-rose-100 dark:bg-rose-500/5 dark:ring-rose-500/20">
                <div className="flex items-start gap-3">
                  <span className="text-2xl" aria-hidden="true">{w.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-900 dark:text-white">
                      <Localized value={w.patternName} /> <span className="font-normal text-slate-500">· <Localized value={w.chapterName} /></span>
                    </p>
                    <Localized value={WEAK.line(w.chapterName, w.chapterAccuracyPct, w.accuracyPct)} as="p" className="text-sm text-rose-800 dark:text-rose-200" />
                    <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-rose-100 dark:bg-rose-500/20" aria-hidden="true">
                      <div className="h-full rounded-full bg-rose-500" style={{ width: `${Math.max(w.accuracyPct, 3)}%` }} />
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link to={patternLink(w, false)} className="inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-semibold text-indigo-700 ring-1 ring-indigo-200 hover:bg-white dark:text-indigo-300 dark:ring-indigo-500/40">
                    🧩 <Localized value={WEAK.learn} />
                  </Link>
                  <Link to={patternLink(w, true)} className="inline-flex min-h-10 items-center rounded-lg bg-indigo-600 px-3 text-sm font-semibold text-white hover:bg-indigo-500">
                    ✍️ <Localized value={WEAK.practise} />
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={card}>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">
          <Localized value={BADGE.title} /> <span className="text-sm font-semibold text-slate-400 tabular-nums">{d.badges.length}</span>
        </h2>
        {d.badges.length === 0 ? (
          <Localized value={BADGE.none} as="p" className="mt-3 text-sm text-slate-500" />
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {d.badges.map((b) => (
              <li key={b.key} className="rounded-xl bg-amber-50 p-3 text-center ring-1 ring-amber-200 dark:bg-amber-500/10 dark:ring-amber-500/30" title={b.body?.en}>
                <span className="text-3xl" aria-hidden="true">{b.emoji}</span>
                <Localized value={b.title} as="p" className="mt-1 text-sm font-bold text-amber-950 dark:text-amber-100" />
                <Localized value={b.body} as="p" className="text-xs text-amber-900/80 dark:text-amber-200/80" />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

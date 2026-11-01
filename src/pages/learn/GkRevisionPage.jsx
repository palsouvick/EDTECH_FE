import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDataSource } from '../../app/DataSourceContext';
import { useOptionalAuth } from '../../app/AuthContext';
import { GK } from '../../lib/gkCopy';
import PageShell from '../../components/navigation/PageShell';
import { Localized } from '../../components/topic-hub/Localized';
import { CardGridSkeleton, LoadError } from '../funnel/FunnelLayout';
import { FactCard } from './GkChapterPage';

const panel = 'rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6 dark:bg-slate-900 dark:ring-slate-800';

/** Loads one personal list; never cached, because every action changes it. */
function useLive(load, deps) {
  const [state, setState] = useState({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let alive = true;
    setState((s) => (s.status === 'ready' ? s : { status: 'loading' }));
    load().then((data) => alive && setState({ status: 'ready', data }), (error) => alive && setState({ status: 'error', error }));
    return () => {
      alive = false;
    };
  }, [...deps, attempt]); // eslint-disable-line react-hooks/exhaustive-deps
  return { ...state, retry: () => setAttempt((n) => n + 1), set: (data) => setState({ status: 'ready', data }) };
}

function Daily() {
  const source = useDataSource();
  const daily = useLive(() => source.getGkDaily(), [source]);
  const onChange = useCallback((f) => {
    if (daily.status !== 'ready') return;
    // A fact answered here counts as done for today; the server records the same.
    const items = daily.data.items.map((i) => (i.fact.id === f.id ? { done: true, fact: f } : i));
    daily.set({ ...daily.data, items, done: items.filter((i) => i.done).length });
  }, [daily]);
  return (
    <section aria-labelledby="gk-daily" className={panel}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="gk-daily" className="text-xl font-bold text-slate-900 dark:text-white"><Localized value={GK.dailyTitle} /></h2>
        {daily.status === 'ready' && <Localized value={GK.dailySub(daily.data.done, daily.data.total)} className="text-sm font-semibold text-slate-600 dark:text-slate-300" />}
      </div>
      <div className="mt-4">
        {daily.status === 'loading' && <CardGridSkeleton count={2} height="h-28" />}
        {daily.status === 'error' && <LoadError error={daily.error} onRetry={daily.retry} />}
        {daily.status === 'ready' && daily.data.total > 0 && daily.data.done === daily.data.total && (
          <Localized value={GK.dailyDone} as="p" className="mb-3 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-200" />
        )}
        {daily.status === 'ready' && (
          <ul className="space-y-3">
            {daily.data.items.filter((i) => !i.done).map((i) => <FactCard key={i.fact.id} fact={i.fact} onChange={onChange} />)}
          </ul>
        )}
      </div>
    </section>
  );
}

function Due() {
  const source = useDataSource();
  const rev = useLive(() => source.getGkRevision(), [source]);
  const onChange = useCallback((f) => {
    if (rev.status !== 'ready') return;
    rev.set({ ...rev.data, due: rev.data.due.filter((x) => x.id !== f.id) });
  }, [rev]);
  return (
    <section aria-labelledby="gk-due" className={panel}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="gk-due" className="text-xl font-bold text-slate-900 dark:text-white"><Localized value={GK.dueTitle} /></h2>
        {rev.status === 'ready' && <Localized value={GK.revisionCounts(rev.data.counts)} className="text-sm text-slate-600 dark:text-slate-300" />}
      </div>
      <div className="mt-4">
        {rev.status === 'loading' && <CardGridSkeleton count={2} height="h-28" />}
        {rev.status === 'error' && <LoadError error={rev.error} onRetry={rev.retry} />}
        {rev.status === 'ready' && rev.data.due.length === 0 && <Localized value={GK.nothingDue} as="p" className="text-sm text-slate-500 dark:text-slate-400" />}
        {rev.status === 'ready' && (
          <ul className="space-y-3">
            {rev.data.due.map((f) => <FactCard key={f.id} fact={f} onChange={onChange} />)}
          </ul>
        )}
      </div>
    </section>
  );
}

function Bookmarks() {
  const source = useDataSource();
  const list = useLive(() => source.listGkFacts({ mine: 'bookmarked', limit: 20 }), [source]);
  const onChange = useCallback((f) => {
    if (list.status !== 'ready') return;
    const facts = f.mine.bookmarked ? list.data.facts.map((x) => (x.id === f.id ? f : x)) : list.data.facts.filter((x) => x.id !== f.id);
    list.set({ ...list.data, facts });
  }, [list]);
  return (
    <section aria-labelledby="gk-bookmarks" className={panel}>
      <h2 id="gk-bookmarks" className="text-xl font-bold text-slate-900 dark:text-white"><Localized value={GK.bookmarksTitle} /></h2>
      <div className="mt-4">
        {list.status === 'loading' && <CardGridSkeleton count={2} height="h-28" />}
        {list.status === 'error' && <LoadError error={list.error} onRetry={list.retry} />}
        {list.status === 'ready' && list.data.facts.length === 0 && <Localized value={GK.noBookmarks} as="p" className="text-sm text-slate-500 dark:text-slate-400" />}
        {list.status === 'ready' && (
          <ul className="space-y-3">
            {list.data.facts.map((f) => <FactCard key={f.id} fact={f} onChange={onChange} />)}
          </ul>
        )}
      </div>
    </section>
  );
}

/** /learn/gk/revision: Daily GK, facts due for revision, bookmarked facts, and the question mistake notebook. */
export default function GkRevisionPage() {
  const auth = useOptionalAuth();
  const signedIn = Boolean(auth?.user);
  return (
    <PageShell className="max-w-4xl pb-16 pt-6 sm:pt-8">
      <Link to="/learn/gk" className="inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-indigo-700 hover:underline dark:text-indigo-300">
        ← <Localized value={GK.back} />
      </Link>
      <Localized value={GK.revisionCentre} as="h1" className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white" />
      <Localized value={GK.revisionHint} as="p" className="mt-1 text-slate-600 dark:text-slate-300" />

      <section aria-labelledby="gk-questions-revision" className={`mt-6 ${panel}`}>
        <h2 id="gk-questions-revision" className="text-xl font-bold text-slate-900 dark:text-white"><Localized value={GK.questionsRevision} /></h2>
        <Localized value={GK.questionsRevisionHint} as="p" className="mt-1 text-sm text-slate-600 dark:text-slate-300" />
        <div className="mt-3 flex flex-wrap gap-2">
          <Link to="/revise" className="inline-flex min-h-11 items-center rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-500"><Localized value={GK.openRevise} /></Link>
          <Link to="/mistakes" className="inline-flex min-h-11 items-center rounded-xl bg-white px-4 text-sm font-bold text-indigo-700 ring-1 ring-slate-200 hover:bg-indigo-50 dark:bg-slate-900 dark:text-indigo-300 dark:ring-slate-700"><Localized value={GK.openMistakes} /></Link>
        </div>
      </section>

      {auth?.status === 'ready' && !signedIn && (
        <Localized value={GK.signInForRevision} as="p" className="mt-6 rounded-2xl bg-amber-50 p-4 text-sm font-semibold text-amber-900 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200" />
      )}
      {signedIn && (
        <div className="mt-6 space-y-6">
          <Daily />
          <Due />
          <Bookmarks />
        </div>
      )}
    </PageShell>
  );
}

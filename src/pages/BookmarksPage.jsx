import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';
import { useDataSource } from '../app/DataSourceContext';
import { loginPath } from '../components/auth/AccountButton';
import PageShell from '../components/navigation/PageShell';
import OptionButton from '../components/practice/OptionButton';
import AnswerExplanation from '../components/review/AnswerExplanation';
import { Localized } from '../components/topic-hub/Localized';
import { REVISION } from '../lib/revisionCopy';
import { paths } from '../lib/routes';
import { CardGridSkeleton, LoadError } from './funnel/FunnelLayout';

const card = 'rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6 dark:bg-slate-900 dark:ring-slate-800';
const keyOf = (g) => `${g.subject}.${g.topic}`;
const dateLabel = (iso) => new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

/** One bookmarked question: answer it again, check, then keep it or tick it off. */
function RevisionCard({ item, onRemove }) {
  const source = useDataSource();
  const q = item.question;
  const [picked, setPicked] = useState(null);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const statusOf = (optionId) => {
    if (!result) return picked === optionId ? 'selected' : 'idle';
    if (optionId === result.selectedOptionId) return result.isCorrect ? 'correct' : 'wrong';
    if (optionId === result.correctOptionId) return 'answer';
    return 'dimmed';
  };

  async function check() {
    setBusy(true);
    setError(null);
    try {
      setResult(await source.verifyAnswer({ questionId: q.questionId, selectedOptionId: picked }));
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className={card}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Localized value={item.topicName} className="rounded-full bg-indigo-50 px-3 py-0.5 text-xs font-bold text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300" />
        <Localized value={REVISION.saved(dateLabel(item.bookmarkedAt))} className="text-xs text-slate-400" />
      </div>
      <Localized value={q.stem} markdown as="div" className="mt-3 text-[17px] font-medium leading-relaxed text-slate-900 dark:text-white" />
      <div role="radiogroup" aria-label={REVISION.check.en} className="mt-4 space-y-2.5">
        {q.options.map((o, i) => (
          <OptionButton
            key={o.optionId}
            option={o}
            index={i}
            status={statusOf(o.optionId)}
            checked={picked === o.optionId}
            focusable
            disabled={Boolean(result)}
            onSelect={setPicked}
          />
        ))}
      </div>

      {result && (
        <div className="mt-4 space-y-3" role="status">
          <Localized
            value={result.isCorrect ? REVISION.right : REVISION.wrong}
            as="p"
            className={`font-bold ${result.isCorrect ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}
          />
          <AnswerExplanation steps={result.explanation?.items} shortcut={result.shortcut} trap={result.trapForSelected} />
        </div>
      )}
      {error && <p role="alert" className="mt-3 text-sm text-rose-600">{error.message}</p>}

      <div className="mt-5 flex flex-wrap gap-2">
        {!result ? (
          <button
            type="button"
            disabled={!picked || busy}
            onClick={check}
            className="min-h-11 rounded-xl bg-indigo-600 px-5 font-semibold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Localized value={busy ? REVISION.checking : REVISION.check} />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setResult(null);
              setPicked(null);
            }}
            className="min-h-11 rounded-xl px-4 font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 dark:text-slate-200 dark:ring-slate-700"
          >
            🔁 <Localized value={REVISION.tryAgain} />
          </button>
        )}
        <button
          type="button"
          onClick={() => onRemove(item)}
          className={`min-h-11 rounded-xl px-4 font-semibold ${
            result?.isCorrect
              ? 'bg-emerald-600 text-white hover:bg-emerald-500'
              : 'text-emerald-700 ring-1 ring-emerald-300 hover:bg-emerald-50 dark:text-emerald-300 dark:ring-emerald-500/40'
          }`}
        >
          ✅ <Localized value={REVISION.gotIt} />
        </button>
      </div>
    </article>
  );
}

/** /revision: the signed-in student's bookmarked questions, to answer again until learnt. */
export default function BookmarksPage() {
  const { status: authStatus, user } = useAuth();
  const source = useDataSource();
  const location = useLocation();
  const [filter, setFilter] = useState(null); // { subject, topic } or null for all
  const [state, setState] = useState({ status: 'loading', items: [], groups: [], total: 0, hasMore: false });
  const [removed, setRemoved] = useState(null); // last removed item, for undo

  const load = useCallback(
    async (offset, append) => {
      setState((s) => ({ ...s, status: append ? 'more' : 'loading' }));
      try {
        const d = await source.listBookmarks({ ...filter, offset });
        setState((s) => ({
          status: 'ready',
          items: append ? [...s.items, ...d.items] : d.items,
          // Chapter counts always describe the whole list, so keep them from the unfiltered load.
          groups: filter && s.groups.length ? s.groups : d.groups,
          total: d.total,
          hasMore: d.hasMore,
        }));
      } catch (error) {
        setState((s) => ({ ...s, status: 'error', error }));
      }
    },
    [source, filter],
  );

  useEffect(() => {
    if (user) load(0, false);
  }, [user, load]);

  if (authStatus === 'ready' && !user) return <Navigate to={loginPath(location)} replace />;

  async function remove(item) {
    const id = item.question.questionId;
    setState((s) => ({
      ...s,
      items: s.items.filter((x) => x.question.questionId !== id),
      total: s.total - 1,
      groups: s.groups.map((g) => (keyOf(g) === `${item.subject}.${item.topic}` ? { ...g, count: g.count - 1 } : g)).filter((g) => g.count > 0),
    }));
    setRemoved(item);
    await source.setBookmark(id, false).catch(() => {});
  }

  async function undo() {
    const item = removed;
    setRemoved(null);
    await source.setBookmark(item.question.questionId, true).catch(() => {});
    load(0, false);
  }

  const allCount = state.groups.reduce((n, g) => n + g.count, 0);
  const chip = (active) =>
    `inline-flex min-h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold transition-colors ${
      active ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-indigo-300 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700'
    }`;

  return (
    <PageShell className="max-w-3xl pb-16 pt-6 sm:pt-10">
      <header className="rounded-3xl bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 p-6 text-white shadow-lg sm:p-8">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          <span aria-hidden="true">📌 </span>
          <Localized value={REVISION.title} />
        </h1>
        <Localized value={REVISION.sub} as="p" className="mt-2 max-w-xl leading-relaxed text-white/95" />
        {state.status !== 'loading' && allCount > 0 && (
          <Localized value={REVISION.total(allCount)} className="mt-4 inline-block rounded-full bg-white/20 px-3 py-1 text-sm font-bold ring-1 ring-white/30" />
        )}
      </header>

      {state.groups.length > 1 && (
        <nav aria-label="Chapters" className="mt-6 flex flex-wrap gap-2">
          <button type="button" aria-pressed={!filter} onClick={() => setFilter(null)} className={chip(!filter)}>
            <Localized value={REVISION.all} /> <span className="tabular-nums opacity-80">{allCount}</span>
          </button>
          {state.groups.map((g) => {
            const active = filter && keyOf(filter) === keyOf(g);
            return (
              <button key={keyOf(g)} type="button" aria-pressed={Boolean(active)} onClick={() => setFilter({ subject: g.subject, topic: g.topic })} className={chip(active)}>
                <Localized value={g.topicName} /> <span className="tabular-nums opacity-80">{g.count}</span>
              </button>
            );
          })}
        </nav>
      )}

      {removed && (
        <div role="status" className="sticky top-20 z-20 mt-4 flex items-center justify-between gap-3 rounded-xl bg-slate-900 px-4 py-3 text-sm text-white shadow-lg dark:bg-slate-800">
          <Localized value={REVISION.removed} />
          <button type="button" onClick={undo} className="font-bold text-amber-300 hover:underline">
            <Localized value={REVISION.undo} />
          </button>
        </div>
      )}

      <div className="mt-6 space-y-4">
        {state.status === 'loading' && <CardGridSkeleton count={2} height="h-64" />}
        {state.status === 'error' && <LoadError error={state.error} onRetry={() => load(0, false)} />}
        {state.status !== 'loading' && state.status !== 'error' && state.items.length === 0 && (
          <div className={`${card} text-center`}>
            <span className="text-4xl" aria-hidden="true">📭</span>
            <Localized value={REVISION.emptyTitle} as="h2" className="mt-2 text-lg font-bold text-slate-900 dark:text-white" />
            <Localized value={REVISION.emptyBody} as="p" className="mx-auto mt-1 max-w-md text-slate-600 dark:text-slate-300" />
            <Link to={paths.exams()} className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-indigo-600 px-5 font-semibold text-white hover:bg-indigo-500">
              <Localized value={REVISION.startPractice} />
            </Link>
          </div>
        )}
        {state.items.map((item) => (
          <RevisionCard key={item.question.questionId} item={item} onRemove={remove} />
        ))}
        {state.hasMore && (
          <button
            type="button"
            disabled={state.status === 'more'}
            onClick={() => load(state.items.length, true)}
            className="min-h-12 w-full rounded-xl bg-white font-semibold text-indigo-700 ring-1 ring-slate-200 hover:ring-indigo-300 disabled:opacity-60 dark:bg-slate-900 dark:text-indigo-300 dark:ring-slate-700"
          >
            <Localized value={REVISION.more} />
          </button>
        )}
      </div>
    </PageShell>
  );
}

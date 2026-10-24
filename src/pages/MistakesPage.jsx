import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';
import { useDataSource } from '../app/DataSourceContext';
import { loginPath } from '../components/auth/AccountButton';
import PageShell from '../components/navigation/PageShell';
import { OPTION_LETTERS } from '../components/practice/OptionButton';
import AnswerExplanation from '../components/review/AnswerExplanation';
import { Localized } from '../components/topic-hub/Localized';
import { CheckIcon, XIcon } from '../components/topic-hub/icons';
import { REVIEW } from '../lib/reviewCopy';
import { CardGridSkeleton, LoadError } from './funnel/FunnelLayout';
import { dayLabel } from './RevisePage';

const card = 'rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6 dark:bg-slate-900 dark:ring-slate-800';
const keyOf = (g) => `${g.subject}.${g.topic}`;

/** One mistake: the question, your answer in red, the right one in green, and why. */
function MistakeCard({ m }) {
  return (
    <article className={card}>
      <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
        <Localized value={m.topicName} className="rounded-full bg-indigo-50 px-3 py-0.5 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300" />
        <Localized value={REVIEW.wrongTimes(m.wrongCount)} className="rounded-full bg-rose-100 px-3 py-0.5 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300" />
        {m.source && <Localized value={REVIEW.source[m.source]} className="rounded-full bg-slate-100 px-3 py-0.5 text-slate-600 dark:bg-slate-800 dark:text-slate-300" />}
        <span className="ml-auto font-medium text-slate-400">
          {m.status === 'active' && m.dueAt ? <Localized value={REVIEW.dueOn(dayLabel(m.dueAt))} /> : m.lastWrongAt && <Localized value={REVIEW.lastWrong(dayLabel(m.lastWrongAt))} />}
        </span>
      </div>
      <Localized value={m.question.stem} markdown as="div" className="mt-3 font-medium leading-relaxed text-slate-900 dark:text-white" />
      <ul className="mt-4 space-y-2">
        {m.question.options.map((o, i) => {
          const right = o.optionId === m.correctOptionId;
          const mine = o.optionId === m.yourOptionId;
          return (
            <li
              key={o.optionId}
              className={`flex items-center gap-3 rounded-xl border-2 px-3 py-2.5 ${
                right ? 'border-emerald-500 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-500/10' : mine ? 'border-rose-500 bg-rose-50 dark:border-rose-400 dark:bg-rose-500/10' : 'border-slate-200 dark:border-slate-700'
              }`}
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-md border border-current text-sm font-bold text-slate-500">{OPTION_LETTERS[i]}</span>
              <span className="min-w-0 flex-1 text-slate-800 dark:text-slate-100">
                <Localized value={o.text} markdown inline />
              </span>
              {mine && !right && <Localized value={REVIEW.yourAnswer} className="hidden shrink-0 text-xs font-bold text-rose-700 sm:inline dark:text-rose-300" />}
              {right && <Localized value={REVIEW.correctAnswer} className="hidden shrink-0 text-xs font-bold text-emerald-700 sm:inline dark:text-emerald-300" />}
              {right && (
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-emerald-500 text-white">
                  <CheckIcon width={14} height={14} strokeWidth={3} />
                </span>
              )}
              {mine && !right && (
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-rose-500 text-white">
                  <XIcon width={14} height={14} strokeWidth={3} />
                </span>
              )}
            </li>
          );
        })}
      </ul>
      <div className="mt-4">
        <AnswerExplanation steps={m.steps} shortcut={m.shortcut} trap={m.trapForSelected} />
      </div>
    </article>
  );
}

/** /mistakes: every wrong answer by chapter, "Still wrong" or "Fixed". */
export default function MistakesPage() {
  const { status: authStatus, user } = useAuth();
  const source = useDataSource();
  const location = useLocation();
  const [status, setStatus] = useState('active');
  const [chapter, setChapter] = useState(null);
  const [state, setState] = useState({ status: 'loading', items: [], groups: [], counts: { active: 0, mastered: 0 }, hasMore: false });

  const load = useCallback(
    async (offset) => {
      setState((s) => ({ ...s, status: offset ? 'more' : 'loading' }));
      try {
        const d = await source.getMistakes({ status, ...chapter, offset });
        setState((s) => ({
          status: 'ready',
          items: offset ? [...s.items, ...d.items] : d.items,
          // Chapter chips describe the whole tab, so keep them while a chapter is picked.
          groups: chapter && s.groups.length ? s.groups : d.groups,
          counts: d.counts,
          hasMore: d.hasMore,
        }));
      } catch (error) {
        setState((s) => ({ ...s, status: 'error', error }));
      }
    },
    [source, status, chapter],
  );

  useEffect(() => {
    if (user) load(0);
  }, [user, load]);

  if (authStatus === 'ready' && !user) return <Navigate to={loginPath(location)} replace />;

  const tab = (active) =>
    `flex min-h-11 items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold transition-colors sm:text-base ${active ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-950 dark:text-indigo-300' : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'}`;
  const chip = (active) =>
    `inline-flex min-h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold ${active ? 'bg-indigo-600 text-white' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-indigo-300 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700'}`;
  const pickStatus = (s) => {
    setChapter(null);
    setState((x) => ({ ...x, groups: [] }));
    setStatus(s);
  };

  return (
    <PageShell className="max-w-3xl pb-16 pt-6 sm:pt-10">
      <header className="rounded-3xl bg-gradient-to-br from-rose-500 via-pink-600 to-purple-600 p-6 text-white shadow-lg sm:p-8">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          <span aria-hidden="true">📒 </span>
          <Localized value={REVIEW.notebook} />
        </h1>
        <Localized value={REVIEW.notebookSub} as="p" className="mt-2 max-w-xl leading-relaxed text-white/95" />
        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/revise" className="inline-flex min-h-10 items-center rounded-xl bg-white px-4 text-sm font-bold text-rose-700 hover:bg-rose-50">
            🔁 <Localized value={REVIEW.title} />
          </Link>
          <Link to="/revision" className="inline-flex min-h-10 items-center rounded-xl bg-white/15 px-4 text-sm font-bold ring-1 ring-white/30 hover:bg-white/25">
            📌 <Localized value={REVIEW.bookmarks} />
          </Link>
        </div>
      </header>

      <div role="tablist" className="mt-6 grid grid-cols-2 gap-1 rounded-2xl bg-slate-200/70 p-1 dark:bg-slate-800">
        {[
          ['active', REVIEW.stillWrong, state.counts.active],
          ['mastered', REVIEW.fixed, state.counts.mastered],
        ].map(([key, label, n]) => (
          <button key={key} type="button" role="tab" aria-selected={status === key} onClick={() => pickStatus(key)} className={tab(status === key)}>
            <Localized value={label} />
            <span className="tabular-nums opacity-70">{n}</span>
          </button>
        ))}
      </div>

      {state.groups.length > 1 && (
        <nav aria-label="Chapters" className="mt-4 flex flex-wrap gap-2">
          <button type="button" aria-pressed={!chapter} onClick={() => setChapter(null)} className={chip(!chapter)}>
            <Localized value={REVIEW.all} />
          </button>
          {state.groups.map((g) => {
            const active = chapter && keyOf(chapter) === keyOf(g);
            return (
              <button key={keyOf(g)} type="button" aria-pressed={Boolean(active)} onClick={() => setChapter({ subject: g.subject, topic: g.topic })} className={chip(active)}>
                <Localized value={g.topicName} /> <span className="tabular-nums opacity-80">{g.count}</span>
              </button>
            );
          })}
        </nav>
      )}

      <div className="mt-5 space-y-4">
        {state.status === 'loading' && <CardGridSkeleton count={2} height="h-64" />}
        {state.status === 'error' && <LoadError error={state.error} onRetry={() => load(0)} />}
        {state.status !== 'loading' && state.status !== 'error' && state.items.length === 0 && (
          <Localized value={REVIEW.notebookEmpty} as="p" className={`${card} text-center text-slate-600 dark:text-slate-300`} />
        )}
        {state.items.map((m) => (
          <MistakeCard key={m.question.questionId} m={m} />
        ))}
        {state.hasMore && (
          <button
            type="button"
            disabled={state.status === 'more'}
            onClick={() => load(state.items.length)}
            className="min-h-12 w-full rounded-xl bg-white font-semibold text-indigo-700 ring-1 ring-slate-200 hover:ring-indigo-300 disabled:opacity-60 dark:bg-slate-900 dark:text-indigo-300 dark:ring-slate-700"
          >
            <Localized value={REVIEW.more} />
          </button>
        )}
      </div>
    </PageShell>
  );
}

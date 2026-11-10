import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';
import { useDataSource } from '../app/DataSourceContext';
import { loginPath } from '../components/auth/AccountButton';
import PageShell from '../components/navigation/PageShell';
import { OPTION_LETTERS } from '../components/practice/OptionButton';
import AnswerExplanation from '../components/review/AnswerExplanation';
import { Localized } from '../components/topic-hub/Localized';
import { CheckIcon, ChevronIcon, XIcon } from '../components/topic-hub/icons';
import { REVIEW } from '../lib/reviewCopy';
import { CardGridSkeleton, LoadError } from './funnel/FunnelLayout';
import { dayLabel } from './RevisePage';

const card = 'rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800';
const keyOf = (g) => `${g.subject}.${g.topic}`;
const SUBJECT_ORDER = ['gs', 'quant', 'english', 'reasoning'];
const SUBJECT_ICON = { all: '📚', gs: '🌏', quant: '🔢', english: '🔤', reasoning: '🧩' };
const CHIPS_COLLAPSED = 8;

/** Your answer and the right one, side by side: what a student scans for first. */
function AnswerPair({ m }) {
  const opts = m.question.options;
  const at = (id) => opts.findIndex((o) => o.optionId === id);
  const mine = at(m.yourOptionId);
  const right = at(m.correctOptionId);
  const row = (tone, icon, label, i) => (
    <div className={`flex items-start gap-3 rounded-xl px-3 py-2.5 ${tone}`}>
      <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-current/10">{icon}</span>
      <span className="min-w-0 flex-1">
        <Localized value={label} as="span" className="block text-[11px] font-bold uppercase tracking-wide opacity-80" />
        <span className="block text-sm font-medium text-slate-900 dark:text-white">
          {i >= 0 ? (
            <>
              <span className="mr-1.5 font-bold">{OPTION_LETTERS[i]}.</span>
              <Localized value={opts[i].text} markdown inline />
            </>
          ) : (
            <Localized value={REVIEW.noAnswer} />
          )}
        </span>
      </span>
    </div>
  );
  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      {row('bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300', <XIcon width={14} height={14} strokeWidth={3} />, REVIEW.yourAnswer, mine)}
      {row('bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300', <CheckIcon width={14} height={14} strokeWidth={3} />, REVIEW.correctAnswer, right)}
    </div>
  );
}

/** One mistake: compact by default (question + your answer vs the right one); open for all options and why. */
function MistakeCard({ m }) {
  const [open, setOpen] = useState(false);
  const id = `mistake-${m.question.questionId}`;
  return (
    <article className={`${card} p-4 transition-shadow hover:shadow-md sm:p-5`}>
      <div className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
        <Localized value={m.topicName} className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300" />
        <Localized value={REVIEW.wrongTimes(m.wrongCount)} className={`rounded-full px-2.5 py-0.5 ${m.wrongCount >= 3 ? 'bg-rose-600 text-white' : 'bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300'}`} />
        {m.source && <Localized value={REVIEW.source[m.source]} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-slate-600 dark:bg-slate-800 dark:text-slate-300" />}
        <span className="ml-auto font-medium text-slate-400">
          {m.status === 'active' && m.dueAt ? <Localized value={REVIEW.dueOn(dayLabel(m.dueAt))} /> : m.lastWrongAt && <Localized value={REVIEW.lastWrong(dayLabel(m.lastWrongAt))} />}
        </span>
      </div>
      <Localized value={m.question.stem} markdown as="div" className="mt-3 font-medium leading-relaxed text-slate-900 dark:text-white" />
      <AnswerPair m={m} />

      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className="mt-3 inline-flex min-h-10 items-center gap-1.5 rounded-lg px-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:text-indigo-300 dark:hover:bg-indigo-500/10"
      >
        <Localized value={open ? REVIEW.hideDetails : REVIEW.showDetails} />
        <ChevronIcon width={16} height={16} className={`transition-transform motion-reduce:transition-none ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open && (
        <div id={id} className="mt-2 border-t border-slate-100 pt-3 dark:border-slate-800">
          <ul className="space-y-2">
            {m.question.options.map((o, i) => {
              const right = o.optionId === m.correctOptionId;
              const mine = o.optionId === m.yourOptionId;
              return (
                <li
                  key={o.optionId}
                  className={`flex items-center gap-3 rounded-xl border-2 px-3 py-2 ${
                    right ? 'border-emerald-500 bg-emerald-50 dark:border-emerald-400 dark:bg-emerald-500/10' : mine ? 'border-rose-500 bg-rose-50 dark:border-rose-400 dark:bg-rose-500/10' : 'border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span className="grid size-7 shrink-0 place-items-center rounded-md border border-current text-sm font-bold text-slate-500">{OPTION_LETTERS[i]}</span>
                  <span className="min-w-0 flex-1 text-sm text-slate-800 dark:text-slate-100">
                    <Localized value={o.text} markdown inline />
                  </span>
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
          <div className="mt-3">
            <AnswerExplanation steps={m.steps} shortcut={m.shortcut} trap={m.trapForSelected} />
          </div>
        </div>
      )}
    </article>
  );
}

/** /mistakes: every wrong answer, by subject and chapter, "Still wrong" or "Fixed". */
export default function MistakesPage() {
  const { status: authStatus, user } = useAuth();
  const source = useDataSource();
  const location = useLocation();
  const [status, setStatus] = useState('active');
  const [subject, setSubject] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [allChips, setAllChips] = useState(false);
  const [state, setState] = useState({ status: 'loading', items: [], groups: [], counts: { active: 0, mastered: 0 }, total: 0, hasMore: false });

  const load = useCallback(
    async (offset) => {
      setState((s) => ({ ...s, status: offset ? 'more' : 'loading' }));
      try {
        const filter = chapter ?? (subject ? { subject } : {});
        const d = await source.getMistakes({ status, ...filter, offset });
        setState((s) => ({
          status: 'ready',
          items: offset ? [...s.items, ...d.items] : d.items,
          // Subject tabs and chapter chips describe the whole tab, so keep them while filtering.
          groups: (chapter || subject) && s.groups.length ? s.groups : d.groups,
          counts: d.counts,
          total: d.total ?? d.items.length,
          hasMore: d.hasMore,
        }));
      } catch (error) {
        setState((s) => ({ ...s, status: 'error', error }));
      }
    },
    [source, status, subject, chapter],
  );

  useEffect(() => {
    if (user) load(0);
  }, [user, load]);

  const bySubject = useMemo(() => {
    const m = new Map();
    for (const g of state.groups) m.set(g.subject, (m.get(g.subject) ?? 0) + g.count);
    return SUBJECT_ORDER.filter((s) => m.has(s)).map((s) => ({ code: s, count: m.get(s) }))
      .concat([...m.keys()].filter((s) => !SUBJECT_ORDER.includes(s)).map((s) => ({ code: s, count: m.get(s) })));
  }, [state.groups]);
  const tabTotal = state.groups.reduce((a, g) => a + g.count, 0);
  const chips = useMemo(() => [...state.groups].filter((g) => !subject || g.subject === subject).sort((a, b) => b.count - a.count), [state.groups, subject]);

  if (authStatus === 'ready' && !user) return <Navigate to={loginPath(location)} replace />;

  const { active, mastered } = state.counts;
  const fixedPct = active + mastered ? Math.round((mastered / (active + mastered)) * 100) : 0;

  const tab = (on) =>
    `flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition-colors sm:text-base ${on ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-950 dark:text-indigo-300' : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'}`;
  const subjectBtn = (on) =>
    `inline-flex min-h-10 shrink-0 items-center gap-2 rounded-xl px-3.5 text-sm font-semibold transition-colors ${on ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700'}`;
  const chip = (on) =>
    `inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors ${on ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-500/30' : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:ring-indigo-300 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700'}`;

  const pickStatus = (s) => {
    setSubject(null);
    setChapter(null);
    setAllChips(false);
    setState((x) => ({ ...x, groups: [] }));
    setStatus(s);
  };
  const pickSubject = (s) => {
    setChapter(null);
    setAllChips(false);
    setSubject(s);
  };
  const shownChips = allChips ? chips : chips.slice(0, CHIPS_COLLAPSED);

  return (
    <PageShell className="max-w-3xl pb-16 pt-6 sm:pt-10">
      {/* Header: what this is, how far you have got, what to do now */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-rose-500 via-pink-600 to-purple-600 p-5 text-white shadow-lg shadow-pink-500/20 sm:p-7">
        <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-white/10 blur-2xl" />
        <h1 className="relative text-2xl font-extrabold tracking-tight sm:text-3xl">
          <span aria-hidden="true">📒 </span>
          <Localized value={REVIEW.notebook} />
        </h1>
        <Localized value={REVIEW.notebookSub} as="p" className="relative mt-1.5 max-w-xl text-sm leading-relaxed text-white/90 sm:text-[15px]" />

        <div className="relative mt-4 rounded-2xl bg-white/15 p-3 ring-1 ring-white/25 backdrop-blur-sm">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <Localized value={REVIEW.progressLabel} className="font-semibold text-white/90" />
            <Localized value={REVIEW.fixedShare(fixedPct)} className="font-bold tabular-nums" />
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/25" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={fixedPct} aria-label={REVIEW.progressLabel.en}>
            <div className="h-full rounded-full bg-white transition-[width] duration-700 motion-reduce:transition-none" style={{ width: `${fixedPct}%` }} />
          </div>
        </div>

        <div className="relative mt-4 flex flex-wrap gap-2">
          <Link to="/revise" className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-white px-4 text-sm font-bold text-rose-700 shadow-sm hover:bg-rose-50">
            <span aria-hidden="true">🔁</span> <Localized value={REVIEW.title} />
          </Link>
          <Link to="/revision" className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-white/15 px-4 text-sm font-bold ring-1 ring-white/30 hover:bg-white/25">
            <span aria-hidden="true">📌</span> <Localized value={REVIEW.bookmarks} />
          </Link>
        </div>
      </header>

      {/* Still wrong / Fixed */}
      <div role="tablist" className="mt-6 grid grid-cols-2 gap-1 rounded-2xl bg-slate-200/70 p-1 dark:bg-slate-800">
        {[
          ['active', REVIEW.stillWrong, active],
          ['mastered', REVIEW.fixed, mastered],
        ].map(([key, label, n]) => (
          <button key={key} type="button" role="tab" aria-selected={status === key} onClick={() => pickStatus(key)} className={tab(status === key)}>
            <Localized value={label} />
            <span className={`rounded-full px-2 text-xs tabular-nums ${status === key ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-200' : 'bg-white/60 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>{n}</span>
          </button>
        ))}
      </div>

      {/* Subject first, then only that subject's chapters: no wall of 30 chips */}
      {bySubject.length > 1 && (
        <nav aria-label="Subjects" className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:flex-wrap sm:px-0">
          <button type="button" aria-pressed={!subject} onClick={() => pickSubject(null)} className={subjectBtn(!subject)}>
            <span aria-hidden="true">{SUBJECT_ICON.all}</span>
            <Localized value={REVIEW.subjects.all} />
            <span className="tabular-nums opacity-70">{tabTotal}</span>
          </button>
          {bySubject.map((s) => (
            <button key={s.code} type="button" aria-pressed={subject === s.code} onClick={() => pickSubject(s.code)} className={subjectBtn(subject === s.code)}>
              <span aria-hidden="true">{SUBJECT_ICON[s.code] ?? '📘'}</span>
              <Localized value={REVIEW.subjects[s.code] ?? { en: s.code }} />
              <span className="tabular-nums opacity-70">{s.count}</span>
            </button>
          ))}
        </nav>
      )}

      {chips.length > 1 && (
        <nav aria-label="Chapters" className="mt-3 rounded-2xl bg-white/60 p-3 ring-1 ring-slate-200/80 dark:bg-slate-900/40 dark:ring-slate-800">
          <Localized value={REVIEW.chapters} as="p" className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400" />
          <div className="flex flex-wrap gap-2">
            <button type="button" aria-pressed={!chapter} onClick={() => setChapter(null)} className={chip(!chapter)}>
              <Localized value={REVIEW.all} />
            </button>
            {shownChips.map((g, i) => {
              const on = chapter && keyOf(chapter) === keyOf(g);
              return (
                <button key={keyOf(g)} type="button" aria-pressed={Boolean(on)} onClick={() => setChapter({ subject: g.subject, topic: g.topic })} className={chip(on)}>
                  {i === 0 && !on && <span aria-hidden="true" title={REVIEW.topChapter.en}>🔥</span>}
                  <Localized value={g.topicName} />
                  <span className={`rounded-full px-1.5 text-xs tabular-nums ${on ? 'bg-white/20' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{g.count}</span>
                </button>
              );
            })}
            {chips.length > CHIPS_COLLAPSED && (
              <button type="button" onClick={() => setAllChips((v) => !v)} className="inline-flex min-h-9 items-center rounded-full px-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-500/10">
                <Localized value={allChips ? REVIEW.fewerChapters : REVIEW.moreChapters(chips.length - CHIPS_COLLAPSED)} />
              </button>
            )}
          </div>
        </nav>
      )}

      <div className="mt-5 space-y-3">
        {state.status === 'loading' && <CardGridSkeleton count={3} height="h-40" />}
        {state.status === 'error' && <LoadError error={state.error} onRetry={() => load(0)} />}
        {state.status !== 'loading' && state.status !== 'error' && state.items.length === 0 && (
          <div className={`${card} p-8 text-center`}>
            <p aria-hidden="true" className="text-4xl">🎉</p>
            <Localized value={REVIEW.notebookEmpty} as="p" className="mt-2 text-slate-600 dark:text-slate-300" />
          </div>
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

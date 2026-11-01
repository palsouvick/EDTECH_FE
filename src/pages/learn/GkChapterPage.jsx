import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useDataSource } from '../../app/DataSourceContext';
import { useResource } from '../../hooks/useResource';
import { useLanguagePreference } from '../../hooks/useLanguagePreference';
import { GK } from '../../lib/gkCopy';
import { QUIZ_LEVELS, TONES } from '../../lib/learnCopy';
import { codeFromSlug, learnPaths } from '../../lib/routes';
import { rememberChapter } from '../../lib/learnProgress';
import PageShell from '../../components/navigation/PageShell';
import { Localized } from '../../components/topic-hub/Localized';
import { ArrowRightIcon } from '../../components/topic-hub/icons';
import { CardGridSkeleton, LoadError } from '../funnel/FunnelLayout';

const PAGE = 20;
const card = 'rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6 dark:bg-slate-900 dark:ring-slate-800';
const chip = (on) => `min-h-10 rounded-full px-3.5 text-sm font-semibold ring-1 transition-colors ${on ? 'bg-indigo-600 text-white ring-indigo-600' : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700'}`;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const BN_MONTHS = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
const fmtDate = (iso) => (iso ? new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : null);
const fmtMilestone = (d) => (/^\d{4}-\d{2}-\d{2}$/.test(d) ? fmtDate(d) : d);

function useDebounced(value, ms) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

/** One fact: statement first, then the detail a student can open. Labels never claim more than the data says. */
export function FactCard({ fact }) {
  const [open, setOpen] = useState(false);
  const verified = fact.verification.status === 'VERIFIED';
  return (
    <li className={card}>
      <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
        <span className="font-mono text-slate-400">{fact.code}</span>
        {verified && (
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/30">
            ✓ <Localized value={GK.verified} />
          </span>
        )}
        {fact.bengaliReview !== 'REVIEWED' && (
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-900 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/30">
            <Localized value={GK.bengaliPending} />
          </span>
        )}
        {fact.factKind === 'CHANGING' && (
          <span className="rounded-full bg-sky-50 px-2.5 py-1 text-sky-900 ring-1 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-200 dark:ring-sky-500/30">
            <Localized value={GK.changing} />
          </span>
        )}
      </div>
      <Localized value={fact.title} as="h3" className="mt-2 text-lg font-bold text-slate-900 dark:text-white" />
      <Localized value={fact.statement} markdown as="div" className="mt-1 leading-relaxed text-slate-800 dark:text-slate-100" />
      {(fact.dates.eventDate || fact.dates.validFrom || fact.referenceYear) && (
        <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
          {fact.dates.eventDate && <span><Localized value={GK.eventDate} />: {fmtDate(fact.dates.eventDate)}</span>}
          {fact.dates.validFrom && <span><Localized value={GK.validFrom} />: {fmtDate(fact.dates.validFrom)}</span>}
          {fact.referenceYear && <Localized value={GK.referenceYear(fact.referenceYear)} />}
        </p>
      )}
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="mt-3 inline-flex min-h-10 items-center rounded-lg bg-slate-50 px-3 text-sm font-semibold text-indigo-700 ring-1 ring-slate-200 hover:bg-indigo-50 dark:bg-slate-950 dark:text-indigo-300 dark:ring-slate-700"
      >
        <Localized value={GK.more} />
      </button>
      {open && (
        <div className="mt-3 space-y-3 text-sm">
          {fact.explanation && <Localized value={fact.explanation} markdown as="div" className="leading-relaxed text-slate-700 dark:text-slate-200" />}
          {fact.milestones.length > 0 && (
            <div>
              <Localized value={GK.milestones} as="p" className="font-semibold text-slate-900 dark:text-white" />
              <ol className="mt-1 space-y-1">
                {fact.milestones.map((m, i) => (
                  <li key={i} className="flex flex-wrap gap-x-2 text-slate-700 dark:text-slate-200">
                    <span className="font-semibold tabular-nums">{fmtMilestone(m.date)}</span>
                    <Localized value={GK.milestoneKinds[m.kind] ?? { en: m.kind }} />
                    {m.note && <Localized value={m.note} className="text-slate-500 dark:text-slate-400" />}
                  </li>
                ))}
              </ol>
            </div>
          )}
          <div>
            <Localized value={GK.sources} as="p" className="font-semibold text-slate-900 dark:text-white" />
            <ul className="mt-1 space-y-1">
              {fact.sources.map((s) => (
                <li key={s.url}>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="font-medium text-indigo-600 underline underline-offset-2 hover:text-indigo-500 dark:text-indigo-400">
                    {s.title}
                  </a>
                  {s.publisher && <span className="text-slate-500 dark:text-slate-400"> · {s.publisher}</span>}
                </li>
              ))}
            </ul>
            {verified && fact.verification.verifiedAt && <Localized value={GK.verifiedOn(fmtDate(fact.verification.verifiedAt))} as="p" className="mt-1 text-xs text-slate-500 dark:text-slate-400" />}
            {fact.dates.reviewBy && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400"><Localized value={GK.reviewBy} />: {fmtDate(fact.dates.reviewBy)}</p>}
          </div>
        </div>
      )}
    </li>
  );
}

function FactList({ cardInfo }) {
  const source = useDataSource();
  const { lang } = useLanguagePreference();
  const [subtopic, setSubtopic] = useState('');
  const [query, setQuery] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [month, setMonth] = useState('');
  const q = useDebounced(query.trim(), 300);
  const months = useResource(cardInfo.dated ? 'gk:ca-months' : null, () => source.getGkCurrentAffairsMonths());
  const [state, setState] = useState({ status: 'loading', facts: [], total: 0 });
  const [attempt, setAttempt] = useState(0);

  const filters = useMemo(() => {
    const [year, m] = month ? month.split('-').map(Number) : [];
    return { card: cardInfo.code, subtopic: subtopic || undefined, q: q || undefined, difficulty: difficulty || undefined, year, month: m };
  }, [cardInfo.code, subtopic, q, difficulty, month]);

  // New filters: start again from the first page.
  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, status: 'loading' }));
    source.listGkFacts({ ...filters, offset: 0, limit: PAGE }).then(
      (d) => alive && setState({ status: 'ready', facts: d.facts, total: d.pagination.total, hasMore: d.pagination.hasMore }),
      (error) => alive && setState({ status: 'error', error, facts: [], total: 0 }),
    );
    return () => {
      alive = false;
    };
  }, [source, filters, attempt]);

  const loadMore = useCallback(async () => {
    setState((s) => ({ ...s, loadingMore: true }));
    try {
      const d = await source.listGkFacts({ ...filters, offset: state.facts.length, limit: PAGE });
      setState((s) => ({ ...s, loadingMore: false, facts: [...s.facts, ...d.facts], hasMore: d.pagination.hasMore, total: d.pagination.total }));
    } catch (error) {
      setState((s) => ({ ...s, loadingMore: false, moreError: error }));
    }
  }, [source, filters, state.facts.length]);

  const subtopics = cardInfo.subtopics.filter((s) => s.factCount > 0);
  const placeholder = GK.searchPlaceholder[lang] ?? GK.searchPlaceholder.en;

  return (
    <section aria-labelledby="gk-read" className="mt-8">
      <Localized value={GK.readTitle} as="h2" id="gk-read" className="text-xl font-bold text-slate-900 dark:text-white" />
      {subtopics.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Subcategory">
          <button type="button" className={chip(!subtopic)} aria-pressed={!subtopic} onClick={() => setSubtopic('')}>
            <Localized value={GK.all} />
          </button>
          {subtopics.map((s) => (
            <button key={s.code} type="button" className={chip(subtopic === s.code)} aria-pressed={subtopic === s.code} onClick={() => setSubtopic(s.code)}>
              <Localized value={s.title} /> <span className="tabular-nums opacity-70">({s.factCount})</span>
            </button>
          ))}
        </div>
      )}
      <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <label className="relative block">
          <span className="sr-only">{GK.search[lang] ?? GK.search.en}</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholder}
            className="min-h-11 w-full rounded-xl border-0 bg-white px-4 text-base text-slate-900 ring-1 ring-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:text-white dark:ring-slate-700"
          />
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
          <Localized value={GK.difficulty} />
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 font-normal dark:border-slate-700 dark:bg-slate-950">
            <option value="">{GK.all[lang] ?? GK.all.en}</option>
            <option value="easy">{GK.easy[lang] ?? GK.easy.en}</option>
            <option value="medium">{GK.medium[lang] ?? GK.medium.en}</option>
            <option value="hard">{GK.hard[lang] ?? GK.hard.en}</option>
          </select>
        </label>
        {cardInfo.dated && (
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <Localized value={GK.month} />
            <select value={month} onChange={(e) => setMonth(e.target.value)} className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 font-normal dark:border-slate-700 dark:bg-slate-950">
              <option value="">{GK.anyMonth[lang] ?? GK.anyMonth.en}</option>
              {(months.data?.months || []).map((m) => (
                <option key={`${m.year}-${m.month}`} value={`${m.year}-${m.month}`}>
                  {lang === 'bn' ? `${BN_MONTHS[m.month - 1]} ${m.year}` : `${MONTHS[m.month - 1]} ${m.year}`} ({m.factCount})
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      <div className="mt-4" aria-live="polite">
        {state.status === 'loading' && state.facts.length === 0 && <CardGridSkeleton count={3} height="h-32" />}
        {state.status === 'error' && <LoadError error={state.error} onRetry={() => setAttempt((n) => n + 1)} />}
        {state.status === 'ready' && state.total === 0 && (
          <Localized value={cardInfo.factCount ? GK.noMatch : GK.noFactsYet} as="p" className="rounded-2xl bg-white p-8 text-center text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800" />
        )}
        {state.facts.length > 0 && (
          <>
            <Localized value={GK.showing(state.facts.length, state.total)} as="p" className="mb-2 text-sm text-slate-500 dark:text-slate-400" />
            <ul className={`space-y-3 ${state.status === 'loading' ? 'opacity-60' : ''}`}>
              {state.facts.map((f) => <FactCard key={f.id} fact={f} />)}
            </ul>
            {state.hasMore && (
              <button
                type="button"
                onClick={loadMore}
                disabled={state.loadingMore}
                className="mt-4 flex min-h-11 w-full items-center justify-center rounded-xl bg-white font-semibold text-indigo-700 ring-1 ring-slate-200 hover:bg-indigo-50 disabled:opacity-60 dark:bg-slate-900 dark:text-indigo-300 dark:ring-slate-700"
              >
                <Localized value={GK.loadMore} />
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}

/** Level quizzes of one question-bank chapter, served by the existing Learn quiz engine. */
function ChapterQuizzes({ topic }) {
  const source = useDataSource();
  const res = useResource(`learn:chapter:gs:${topic}`, () => source.getLearnChapter('gs', topic));
  if (res.status === 'loading') return <div className="h-20 animate-pulse rounded-xl bg-slate-100 motion-reduce:animate-none dark:bg-slate-800" />;
  if (res.status === 'error') return <LoadError error={res.error} onRetry={res.retry} />;
  return (
    <div>
      <Localized value={res.data.title} as="h3" className="font-semibold text-slate-900 dark:text-white" />
      <ul className="mt-2 grid gap-2 sm:grid-cols-3">
        {QUIZ_LEVELS.map((l) => {
          const info = res.data.levels.find((x) => x.level === l.level);
          const available = Boolean(info?.count);
          const cls = `flex min-h-12 items-center justify-between gap-2 rounded-xl px-4 text-sm font-bold ring-1 ${TONES[l.tone].ring}`;
          return (
            <li key={l.level}>
              {available ? (
                <Link to={learnPaths.quiz('gs', topic, l.level)} className={`${cls} bg-white text-slate-900 hover:bg-slate-50 dark:bg-slate-900 dark:text-white`}>
                  <span><span aria-hidden="true">{l.icon}</span> <Localized value={l.label} /></span>
                  <ArrowRightIcon />
                </Link>
              ) : (
                <span className={`${cls} cursor-not-allowed bg-slate-50 text-slate-400 dark:bg-slate-900/50`}>
                  <span><span aria-hidden="true">{l.icon}</span> <Localized value={l.label} /></span>
                  <span className="text-xs font-semibold">0</span>
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** /learn/gk/:chapter: one GK card. The slug is a card code or one of its question-bank chapters. */
export default function GkChapterPage() {
  const { chapter: slug } = useParams();
  const code = codeFromSlug(slug);
  const source = useDataSource();
  const { status, data, error, retry } = useResource('gk:cards:static', () => source.getGkCards());
  const cardInfo = status === 'ready' ? data.cards.find((c) => c.code === code || c.topics.includes(code)) : null;

  useEffect(() => {
    if (cardInfo) rememberChapter('gs', cardInfo.code, cardInfo.title);
  }, [cardInfo]);

  if (!code) return <Navigate to="/learn/gk" replace />;
  if (status === 'ready' && !cardInfo) return <Navigate to="/learn/gk" replace />;

  return (
    <PageShell className="max-w-4xl pb-16 pt-6 sm:pt-8">
      <Link to="/learn/gk" className="inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-indigo-700 hover:underline dark:text-indigo-300">
        ← <Localized value={GK.back} />
      </Link>
      {status === 'loading' && <CardGridSkeleton count={2} height="h-32" />}
      {status === 'error' && <LoadError error={error} onRetry={retry} />}
      {cardInfo && (
        <>
          <header className="mt-3 flex items-start gap-3">
            <span aria-hidden="true" className="grid size-14 shrink-0 place-items-center rounded-2xl bg-indigo-50 text-3xl dark:bg-indigo-500/10">{cardInfo.emoji}</span>
            <div>
              <Localized value={cardInfo.title} as="h1" className="text-2xl font-extrabold text-slate-900 sm:text-3xl dark:text-white" />
              <Localized value={cardInfo.description} as="p" className="mt-1 text-slate-600 dark:text-slate-300" />
            </div>
          </header>

          <FactList cardInfo={cardInfo} />

          <section aria-labelledby="gk-practice" className={`mt-10 ${card}`}>
            <Localized value={GK.practiceTitle} as="h2" id="gk-practice" className="text-xl font-bold text-slate-900 dark:text-white" />
            <Localized value={GK.practiceSub} as="p" className="mt-1 text-sm text-slate-600 dark:text-slate-300" />
            <div className="mt-4 space-y-5">
              {cardInfo.topics.map((t) => <ChapterQuizzes key={t} topic={t} />)}
            </div>
          </section>
        </>
      )}
    </PageShell>
  );
}

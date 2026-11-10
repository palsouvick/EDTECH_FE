import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useDataSource } from '../../app/DataSourceContext';
import { useOptionalAuth } from '../../app/AuthContext';
import { useResource } from '../../hooks/useResource';
import { useLanguagePreference } from '../../hooks/useLanguagePreference';
import { GK, PACK } from '../../lib/gkCopy';
import { QUIZ_LEVELS, TONES } from '../../lib/learnCopy';
import { codeFromSlug, learnPaths } from '../../lib/routes';
import { rememberChapter } from '../../lib/learnProgress';
import PageShell from '../../components/navigation/PageShell';
import PracticeArena from '../../components/practice/PracticeArena';
import GkMockDialog from '../../components/gk/GkMockDialog';
import YearAtAGlance from '../../components/gk/YearAtAGlance';
import { Localized } from '../../components/topic-hub/Localized';
import { ArrowRightIcon } from '../../components/topic-hub/icons';
import { CardGridSkeleton, LoadError } from '../funnel/FunnelLayout';
import { CompletionBar, GK_REVISION_PATH } from './GkDashboardPage';

const PAGE = 20;
const card = 'rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6 dark:bg-slate-900 dark:ring-slate-800';
const chip = (on) => `min-h-10 rounded-full px-3.5 text-sm font-semibold ring-1 transition-colors ${on ? 'bg-indigo-600 text-white ring-indigo-600' : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700'}`;
const select = 'min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal dark:border-slate-700 dark:bg-slate-950';
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const BN_MONTHS = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
// Exam categories a practice set can be drawn from (each question lists the categories it serves).
const EXAM_TYPES = [
  { code: 'WBPSC', label: { en: 'WBPSC (Clerkship, WBCS, Misc)', bn: 'WBPSC (ক্লার্কশিপ, WBCS, মিসলেনিয়াস)' } },
  { code: 'SSC', label: { en: 'SSC', bn: 'SSC' } },
  { code: 'BANK', label: { en: 'Banking', bn: 'ব্যাংকিং' } },
  { code: 'WB_POST', label: { en: 'WB Post Office', bn: 'পশ্চিমবঙ্গ ডাক বিভাগ' } },
  { code: 'WB_POLICE', label: { en: 'WB Police (WBP, Kolkata Police)', bn: 'পশ্চিমবঙ্গ পুলিশ (WBP, কলকাতা পুলিশ)' } },
];
const fmtDate = (iso) => (iso ? new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : null);
const fmtMilestone = (d) => (/^\d{4}-\d{2}-\d{2}$/.test(d) ? fmtDate(d) : d);
const txt = (v, lang) => v?.[lang] ?? v?.en ?? '';

function useDebounced(value, ms) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
}

/** The signed-in student's buttons on a fact: bookmark, "I knew this", "Revise again". */
export function FactActions({ fact, onChange }) {
  const source = useDataSource();
  const [busy, setBusy] = useState(false);
  const mine = fact.mine;
  const act = async (fn) => {
    setBusy(true);
    try {
      onChange({ ...fact, mine: { ...mine, ...(await fn()) } });
    } catch {
      /* the button simply stays as it was; nothing is claimed */
    } finally {
      setBusy(false);
    }
  };
  const btn = 'inline-flex min-h-10 items-center gap-1.5 rounded-lg px-3 text-sm font-semibold ring-1 disabled:opacity-60';
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={busy}
        aria-pressed={mine.bookmarked}
        onClick={() => act(() => source.setGkFactBookmark(fact.code, !mine.bookmarked))}
        className={`${btn} ${mine.bookmarked ? 'bg-amber-100 text-amber-900 ring-amber-300 dark:bg-amber-500/15 dark:text-amber-200' : 'bg-white text-slate-700 ring-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700'}`}
      >
        <span aria-hidden="true">{mine.bookmarked ? '★' : '☆'}</span>
        <Localized value={mine.bookmarked ? GK.bookmarked : GK.bookmark} />
      </button>
      <button type="button" disabled={busy} onClick={() => act(() => source.reviewGkFact(fact.code, 'known'))} className={`${btn} bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/30`}>
        <span aria-hidden="true">✓</span>
        <Localized value={GK.knewIt} />
      </button>
      <button type="button" disabled={busy} onClick={() => act(() => source.reviewGkFact(fact.code, 'again'))} className={`${btn} bg-rose-50 text-rose-800 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-200 dark:ring-rose-500/30`}>
        <span aria-hidden="true">↻</span>
        <Localized value={GK.reviseAgain} />
      </button>
      {mine.status === 'mastered' && <Localized value={GK.mastered} className="text-xs font-bold text-emerald-700 dark:text-emerald-300" />}
      {mine.status === 'learning' && mine.dueAt && <Localized value={GK.nextReview(fmtDate(mine.dueAt))} className="text-xs text-slate-500 dark:text-slate-400" />}
    </div>
  );
}

/** One fact: statement first, then the detail a student can open. Labels never claim more than the data says. */
/** /learn/gk/topic/<code>: one topic (pack) or fact on its own page. */
export const gkTopicPath = (code) => `/learn/gk/topic/${code}`;

export function FactCard({ fact, onChange }) {
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
      {fact.pack && (
        <Link to={gkTopicPath(fact.code)} className="mt-3 inline-flex min-h-10 items-center gap-1 rounded-lg bg-indigo-600 px-3 text-sm font-bold text-white hover:bg-indigo-500">
          📚 <Localized value={PACK.openTopic} /> →
        </Link>
      )}
      {fact.relatedPacks?.length > 0 && (
        <p className="mt-3 flex flex-wrap items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2 text-sm dark:bg-indigo-500/10">
          <span className="font-semibold text-indigo-900 dark:text-indigo-200">🔗 <Localized value={PACK.alsoLearn} />:</span>
          {fact.relatedPacks.map((p) => (
            <Link key={p.code} to={gkTopicPath(p.code)} className="font-semibold text-indigo-700 underline underline-offset-2 hover:text-indigo-500 dark:text-indigo-300">
              <Localized value={p.title} />
            </Link>
          ))}
        </p>
      )}
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
      {fact.mine && onChange && <FactActions fact={fact} onChange={onChange} />}
    </li>
  );
}

/** The chapter's topic packs in study order: Ancient India → … as connected whole topics. */
function KnowledgeMap({ cardInfo }) {
  const source = useDataSource();
  const res = useResource(`gk:packs:${cardInfo.code}`, () => source.getGkCardPacks(cardInfo.code));
  const packs = res.data?.packs ?? [];
  if (!packs.length) return null;
  const subtitle = (code) => cardInfo.subtopics?.find((x) => x.code === code)?.title;
  return (
    <section aria-labelledby="gk-map" className={`mt-8 ${card}`}>
      <h2 id="gk-map" className="text-xl font-bold text-slate-900 dark:text-white">🗺️ <Localized value={PACK.mapTitle} /></h2>
      <Localized value={PACK.mapSub} as="p" className="mt-1 text-sm text-slate-600 dark:text-slate-300" />
      <ol className="mt-4 flex flex-wrap items-stretch gap-2">
        {packs.map((p, i) => (
          <li key={p.code} className="flex items-center gap-2">
            {i > 0 && <span aria-hidden="true" className="text-slate-400">→</span>}
            <Link to={gkTopicPath(p.code)} className="block rounded-xl bg-indigo-50 px-3 py-2 ring-1 ring-indigo-200 hover:bg-indigo-100 dark:bg-indigo-500/10 dark:ring-indigo-500/30">
              {subtitle(p.subtopic) && <Localized value={subtitle(p.subtopic)} as="span" className="block text-[11px] font-semibold uppercase tracking-wide text-indigo-600 dark:text-indigo-300" />}
              <Localized value={p.title} as="span" className="font-semibold text-slate-900 dark:text-white" />
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

function FactList({ cardInfo, signedIn }) {
  const source = useDataSource();
  const { lang } = useLanguagePreference();
  const [subtopic, setSubtopic] = useState('');
  const [query, setQuery] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [month, setMonth] = useState('');
  const [mine, setMine] = useState('');
  const q = useDebounced(query.trim(), 300);
  const months = useResource(cardInfo.dated ? 'gk:ca-months' : null, () => source.getGkCurrentAffairsMonths());
  const [state, setState] = useState({ status: 'loading', facts: [], total: 0 });
  const [attempt, setAttempt] = useState(0);

  const filters = useMemo(() => {
    const [year, m] = month ? month.split('-').map(Number) : [];
    return { card: cardInfo.code, subtopic: subtopic || undefined, q: q || undefined, difficulty: difficulty || undefined, year, month: m, mine: (signedIn && mine) || undefined };
  }, [cardInfo.code, subtopic, q, difficulty, month, mine, signedIn]);

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

  const replaceFact = useCallback((f) => setState((s) => ({ ...s, facts: s.facts.map((x) => (x.id === f.id ? f : x)) })), []);
  const subtopics = cardInfo.subtopics.filter((s) => s.factCount > 0);

  return (
    <section aria-labelledby="gk-read" className="mt-10">
      <h2 id="gk-read" className="text-xl font-bold text-slate-900 dark:text-white"><Localized value={GK.readTitle} /></h2>
      {signedIn ? (
        <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label={GK.show.en}>
          {[['', GK.allFacts], ['bookmarked', GK.myBookmarks], ['due', GK.dueNow], ['unseen', GK.notSeen]].map(([v, label]) => (
            <button key={v || 'all'} type="button" className={chip(mine === v)} aria-pressed={mine === v} onClick={() => setMine(v)}>
              <Localized value={label} />
            </button>
          ))}
        </div>
      ) : (
        <Localized value={GK.signInToSave} as="p" className="mt-2 text-sm text-slate-500 dark:text-slate-400" />
      )}
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
          <span className="sr-only">{txt(GK.search, lang)}</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={txt(GK.searchPlaceholder, lang)}
            className="min-h-11 w-full rounded-xl border-0 bg-white px-4 text-base text-slate-900 ring-1 ring-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:text-white dark:ring-slate-700"
          />
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
          <Localized value={GK.difficulty} />
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 font-normal dark:border-slate-700 dark:bg-slate-950">
            <option value="">{txt(GK.all, lang)}</option>
            <option value="easy">{txt(GK.easy, lang)}</option>
            <option value="medium">{txt(GK.medium, lang)}</option>
            <option value="hard">{txt(GK.hard, lang)}</option>
          </select>
        </label>
        {cardInfo.dated && (
          <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <Localized value={GK.month} />
            <select value={month} onChange={(e) => setMonth(e.target.value)} className="min-h-11 rounded-xl border border-slate-300 bg-white px-3 font-normal dark:border-slate-700 dark:bg-slate-950">
              <option value="">{txt(GK.anyMonth, lang)}</option>
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
              {state.facts.map((f) => <FactCard key={f.id} fact={f} onChange={signedIn ? replaceFact : undefined} />)}
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

/** Questions per subcategory and the student's completion in each. */
function TopicProgress({ cardInfo, signedIn }) {
  const rows = cardInfo.subtopics.filter((s) => s.questionCount > 0);
  const other = cardInfo.otherQuestions;
  if (!rows.length && !other?.questionCount) return null;
  const Row = ({ title, count, progress }) => (
    <li className="rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
      <div className="flex items-baseline justify-between gap-2">
        <Localized value={title} className="text-sm font-semibold text-slate-800 dark:text-slate-100" />
        <Localized value={GK.questionsShort(count)} className="shrink-0 text-xs tabular-nums text-slate-500 dark:text-slate-400" />
      </div>
      <div className="mt-2">
        <CompletionBar progress={progress} total={count} signedIn={signedIn} compact />
      </div>
    </li>
  );
  return (
    <section aria-labelledby="gk-topic-progress" className={`mt-8 ${card}`}>
      <h2 id="gk-topic-progress" className="text-xl font-bold text-slate-900 dark:text-white"><Localized value={GK.topicProgress} /></h2>
      <Localized value={GK.topicProgressHint} as="p" className="mt-1 text-sm text-slate-600 dark:text-slate-300" />
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((s) => <Row key={s.code} title={s.title} count={s.questionCount} progress={s.progress} />)}
        {other?.questionCount > 0 && <Row title={GK.other} count={other.questionCount} progress={other.progress} />}
      </ul>
    </section>
  );
}

/** Filters, then the existing one-question-at-a-time arena (answer, explanation, bookmark, report). */
function PracticePanel({ cardInfo, onMock }) {
  const source = useDataSource();
  const { lang } = useLanguagePreference();
  const [category, setCategory] = useState('WBPSC');
  const [topic, setTopic] = useState(cardInfo.topics[0]);
  const [subtopic, setSubtopic] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [running, setRunning] = useState(false);
  const [count, setCount] = useState(null);
  const filters = useMemo(() => ({ category, topic, subtopic: subtopic || undefined, difficulty: difficulty || undefined, verifiedOnly }), [category, topic, subtopic, difficulty, verifiedOnly]);

  useEffect(() => {
    let alive = true;
    setCount(null);
    source.countGkQuestions(filters).then((d) => alive && setCount(d.count), () => alive && setCount(null));
    return () => {
      alive = false;
    };
  }, [source, filters]);

  const practiceSource = useMemo(() => (running ? source.practiceSource({ ...filters, subject: 'gs' }) : null), [running, source, filters]);
  const subtopics = cardInfo.subtopics.filter((s) => s.questionCount > 0);

  return (
    <section aria-labelledby="gk-practice" className={`mt-8 ${card}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="gk-practice" className="text-xl font-bold text-slate-900 dark:text-white"><Localized value={GK.practiceOneByOne} /></h2>
          <Localized value={GK.practiceSub} as="p" className="mt-1 text-sm text-slate-600 dark:text-slate-300" />
        </div>
        <button type="button" onClick={onMock} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-500">
          <span aria-hidden="true">⏱️</span>
          <Localized value={GK.mockCard} />
        </button>
      </div>

      {!running && (
        <>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
              <Localized value={GK.examType} />
              <select value={category} onChange={(e) => setCategory(e.target.value)} className={`mt-1 ${select}`}>
                {EXAM_TYPES.map((x) => <option key={x.code} value={x.code}>{txt(x.label, lang)}</option>)}
              </select>
            </label>
            {cardInfo.topics.length > 1 && (
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                <Localized value={GK.chapter} />
                <select value={topic} onChange={(e) => { setTopic(e.target.value); setSubtopic(''); }} className={`mt-1 ${select}`}>
                  {cardInfo.topics.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
                </select>
              </label>
            )}
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
              <Localized value={GK.subcategory} />
              <select value={subtopic} onChange={(e) => setSubtopic(e.target.value)} className={`mt-1 ${select}`}>
                <option value="">{txt(GK.all, lang)}</option>
                {subtopics.map((s) => <option key={s.code} value={s.code}>{txt(s.title, lang)} ({s.questionCount})</option>)}
              </select>
            </label>
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
              <Localized value={GK.difficulty} />
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className={`mt-1 ${select}`}>
                <option value="">{txt(GK.anyLevel, lang)}</option>
                <option value="easy">{txt(GK.easy, lang)}</option>
                <option value="medium">{txt(GK.medium, lang)}</option>
                <option value="hard">{txt(GK.hard, lang)}</option>
              </select>
            </label>
          </div>
          <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
            <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} className="size-5" />
            <Localized value={GK.verifiedOnly} />
          </label>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={!count}
              onClick={() => setRunning(true)}
              className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-600 px-5 text-sm font-bold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Localized value={GK.startPractice} />
              <ArrowRightIcon />
            </button>
            <span aria-live="polite" className="text-sm text-slate-600 dark:text-slate-300">
              {count == null ? '…' : count === 0 ? <Localized value={GK.noQuestions} /> : <Localized value={GK.matching(count)} />}
            </span>
          </div>
        </>
      )}

      {running && practiceSource && (
        <div className="mt-4">
          <button type="button" onClick={() => setRunning(false)} className="mb-3 inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-semibold text-indigo-700 ring-1 ring-slate-200 hover:bg-indigo-50 dark:text-indigo-300 dark:ring-slate-700">
            ← <Localized value={GK.changeFilters} />
          </button>
          <PracticeArena
            key={JSON.stringify(filters)}
            source={practiceSource}
            topicName={cardInfo.title}
            onLaunchMock={onMock}
          />
        </div>
      )}
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
  const auth = useOptionalAuth();
  const userKey = auth?.user?.id ?? 'guest';
  const [mockOpen, setMockOpen] = useState(false);
  // Fresh on every visit: topic-wise progress changes after practice.
  const [state, setState] = useState({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let alive = true;
    source.getGkCards().then(
      (data) => alive && setState({ status: 'ready', data }),
      (error) => alive && setState({ status: 'error', error }),
    );
    return () => {
      alive = false;
    };
  }, [source, userKey, attempt]);
  const { status, data, error } = state;
  const cardInfo = status === 'ready' ? data.cards.find((c) => c.code === code || c.topics.includes(code)) : null;
  const signedIn = Boolean(data?.signedIn);

  useEffect(() => {
    if (cardInfo) rememberChapter('gs', cardInfo.code, cardInfo.title);
  }, [cardInfo]);

  if (!code) return <Navigate to="/learn/gk" replace />;
  if (status === 'ready' && !cardInfo) return <Navigate to="/learn/gk" replace />;

  return (
    <PageShell className="max-w-5xl pb-16 pt-6 sm:pt-8">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link to="/learn/gk" className="inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-indigo-700 hover:underline dark:text-indigo-300">
          ← <Localized value={GK.back} />
        </Link>
        <Link to={GK_REVISION_PATH} className="inline-flex min-h-10 items-center gap-1 text-sm font-semibold text-teal-700 hover:underline dark:text-teal-300">
          🔁 <Localized value={GK.revisionCentre} />
        </Link>
      </div>
      {status === 'loading' && <CardGridSkeleton count={2} height="h-32" />}
      {status === 'error' && <LoadError error={error} onRetry={() => setAttempt((n) => n + 1)} />}
      {cardInfo && (
        <>
          <header className="mt-3 flex items-start gap-3">
            <span aria-hidden="true" className="grid size-14 shrink-0 place-items-center rounded-2xl bg-indigo-50 text-3xl dark:bg-indigo-500/10">{cardInfo.emoji}</span>
            <div className="min-w-0">
              <Localized value={cardInfo.title} as="h1" className="text-2xl font-extrabold text-slate-900 sm:text-3xl dark:text-white" />
              <Localized value={cardInfo.description} as="p" className="mt-1 text-slate-600 dark:text-slate-300" />
              <Localized value={GK.sectionTotal(cardInfo.questionCount, cardInfo.factCount)} as="p" className="mt-1 text-sm font-bold text-indigo-700 dark:text-indigo-300" />
              <div className="mt-2 max-w-md">
                <CompletionBar progress={cardInfo.progress} total={cardInfo.questionCount} signedIn={signedIn} />
              </div>
            </div>
          </header>

          {cardInfo.code === 'important_days' && <YearAtAGlance />}
          <KnowledgeMap cardInfo={cardInfo} />
          <TopicProgress cardInfo={cardInfo} signedIn={signedIn} />
          {cardInfo.questionCount > 0 && <PracticePanel cardInfo={cardInfo} onMock={() => setMockOpen(true)} />}

          <section aria-labelledby="gk-quizzes" className={`mt-8 ${card}`}>
            <h2 id="gk-quizzes" className="text-xl font-bold text-slate-900 dark:text-white"><Localized value={GK.practiceTitle} /></h2>
            <div className="mt-4 space-y-5">
              {cardInfo.topics.map((t) => <ChapterQuizzes key={t} topic={t} />)}
            </div>
          </section>

          <FactList cardInfo={cardInfo} signedIn={signedIn} />

          {mockOpen && (
            <GkMockDialog
              open
              onClose={() => setMockOpen(false)}
              topics={cardInfo.topics}
              name={cardInfo.title}
              topicNames={Object.fromEntries(cardInfo.topics.map((t) => [t, cardInfo.title]))}
            />
          )}
        </>
      )}
    </PageShell>
  );
}

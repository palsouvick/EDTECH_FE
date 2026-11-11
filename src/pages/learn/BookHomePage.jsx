import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useDataSource } from '../../app/DataSourceContext';
import PageShell from '../../components/navigation/PageShell';
import { Localized } from '../../components/topic-hub/Localized';
import { CardGridSkeleton, LoadError } from '../funnel/FunnelLayout';
import useBookProgress from '../../hooks/useBookProgress';
import { BOOK, BOOK_FOR_CARD, bnNum, cardFromSlug, bookChapterPath, bookHomePath } from '../../lib/bookCopy';
import { bookSummary } from '../../lib/bookProgress';

const box = 'rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5 dark:bg-slate-900 dark:ring-slate-800';
const STATUS_TONE = {
  not_started: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
  reading: 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-200',
  read: 'bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-200',
  tested: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-200',
  mastered: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200',
};

export function ProgressBar({ percent, label }) {
  return (
    <div role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label={label} className="h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
      <div className="h-full rounded-full bg-indigo-600 transition-[width] motion-reduce:transition-none" style={{ width: `${percent}%` }} />
    </div>
  );
}

/** "Continue reading" card, also shown on the GK dashboard and the History card. */
export function ContinueReading({ card, book, progress, compact = false }) {
  const summary = useMemo(() => bookSummary(book, progress), [book, progress]);
  const r = summary.resume;
  if (!r) return null;
  const fresh = r.first;
  return (
    <section className={`${box} border-l-4 border-indigo-500`} aria-label={BOOK.resumeTitle.en}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Localized value={BOOK.resumeTitle} as="h2" className="text-base font-bold text-slate-900 dark:text-white" />
        {!fresh && <Localized value={BOOK.completed(summary.percent)} className="text-sm font-semibold text-indigo-700 dark:text-indigo-300" />}
      </div>
      {!fresh && <div className="mt-2"><ProgressBar percent={summary.percent} label={BOOK.completed(summary.percent).en} /></div>}
      <Localized value={(fresh ? BOOK.resumeStart : BOOK.resumeStopped)(r.chapter.number, r.chapter.title)} as="p" className="mt-2 text-sm text-slate-700 dark:text-slate-200" />
      {r.section && !compact && <p className="text-sm text-slate-500 dark:text-slate-400" lang="bn">§ {r.section.heading}</p>}
      <Link to={bookChapterPath(card, r.chapter.code, r.section?.id)} className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-500">
        <Localized value={fresh ? BOOK.startCta : BOOK.resumeCta} />
      </Link>
    </section>
  );
}

/**
 * The way into a book from a GK card (or the GK dashboard with `onlyIfStarted`): what the book is, how far the
 * student has got, and "Continue reading". Renders nothing for cards without a book.
 */
export function BookEntryCard({ card, onlyIfStarted = false, className = '' }) {
  const bookCode = BOOK_FOR_CARD[card];
  const source = useDataSource();
  const [book, setBook] = useState(null);
  const { progress } = useBookProgress(bookCode || 'history');
  useEffect(() => {
    if (!bookCode) return undefined;
    let live = true;
    source.getBook(bookCode).then((b) => live && setBook(b), () => {});
    return () => {
      live = false;
    };
  }, [source, bookCode]);
  if (!bookCode || (onlyIfStarted && !progress.last)) return null;
  if (book && progress.last) return <div className={className}><ContinueReading card={card} book={book} progress={progress} compact /></div>;
  if (onlyIfStarted) return null;
  return (
    <Link to={bookHomePath(card)} className={`${className} ${box} flex items-center gap-3 border-l-4 border-indigo-500 hover:bg-indigo-50/60 dark:hover:bg-slate-800/60`}>
      <span aria-hidden="true" className="text-3xl">📖</span>
      <span className="min-w-0 flex-1">
        <Localized value={BOOK.open} className="block font-bold text-slate-900 dark:text-white" />
        <Localized value={BOOK.openHint} className="block text-sm text-slate-600 dark:text-slate-300" />
        {book && <Localized value={BOOK.chaptersReady(book.chapters.filter((c) => c.available).length, book.chapters.length)} className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400" />}
      </span>
      <span aria-hidden="true" className="text-indigo-600">→</span>
    </Link>
  );
}

/**
 * /learn/gk/:card/book: the book's table of contents by part, each chapter's status and share read,
 * the whole-book percentage and "Continue reading".
 */
export default function BookHomePage() {
  const { chapter: slug } = useParams();
  const card = cardFromSlug(slug);
  const bookCode = BOOK_FOR_CARD[card];
  const preview = new URLSearchParams(useLocation().search).get('preview') === '1';
  const source = useDataSource();
  const [state, setState] = useState({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const { progress, signedIn, ready } = useBookProgress(bookCode || 'history');

  useEffect(() => {
    if (!bookCode) return undefined;
    let live = true;
    setState({ status: 'loading' });
    source.getBook(bookCode, { preview }).then((book) => live && setState({ status: 'ready', book }), (error) => live && setState({ status: 'error', error }));
    return () => {
      live = false;
    };
  }, [source, bookCode, preview, attempt]);

  const book = state.book;
  const summary = useMemo(() => (book ? bookSummary(book, progress) : null), [book, progress]);

  return (
    <PageShell className="max-w-4xl pb-16 pt-6 sm:pt-8">
      <Link to={`/learn/gk/${slug}`} className="inline-flex min-h-10 items-center text-sm font-semibold text-indigo-700 hover:underline dark:text-indigo-300">
        ← <Localized value={BOOK.backToCard} />
      </Link>
      {!bookCode && <Localized value={BOOK.notFound} as="p" className="mt-4 text-slate-700 dark:text-slate-200" />}
      {state.status === 'loading' && bookCode && <CardGridSkeleton count={3} height="h-24" />}
      {state.status === 'error' && <LoadError error={state.error} onRetry={() => setAttempt((n) => n + 1)} />}
      {book && summary && (
        <div className="mt-2 space-y-5">
          <header>
            <Localized value={BOOK.homeTitle} as="h1" className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white" />
            <Localized value={BOOK.homeIntro} as="p" className="mt-1 text-sm text-slate-600 dark:text-slate-300" />
            <div className="mt-3 space-y-1">
              <div className="flex flex-wrap justify-between gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                <Localized value={BOOK.completed(summary.percent)} />
                <Localized value={BOOK.sectionsRead(summary.sectionsRead, summary.sectionsTotal)} className="text-slate-500 dark:text-slate-400" />
              </div>
              <ProgressBar percent={summary.percent} label={BOOK.completed(summary.percent).en} />
              <Localized value={BOOK.chaptersReady(summary.chaptersAvailable, summary.chaptersTotal)} as="p" className="text-xs text-slate-500 dark:text-slate-400" />
            </div>
            {ready && !signedIn && <Localized value={BOOK.signInToKeep} as="p" className="mt-2 text-xs text-amber-800 dark:text-amber-300" />}
          </header>

          <ContinueReading card={card} book={book} progress={progress} />

          <nav aria-label={BOOK.contents.en} className="space-y-5">
            <Localized value={BOOK.contents} as="h2" className="text-lg font-bold text-slate-900 dark:text-white" />
            {book.parts.map((part) => {
              const chapters = book.chapters.filter((c) => c.part === part.code);
              if (!chapters.length) return null;
              return (
                <section key={part.code} className={box}>
                  <h3 className="text-base font-bold text-indigo-800 dark:text-indigo-300" lang="bn">{part.title}</h3>
                  <ol className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
                    {chapters.map((c) => {
                      const s = summary.statuses[c.code];
                      const inner = (
                        <>
                          <span className="w-8 shrink-0 text-right text-sm font-bold tabular-nums text-slate-400">{bnNum(c.number)}</span>
                          <span className="min-w-0 flex-1">
                            <span className={`block font-semibold ${c.available ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`} lang="bn">{c.title}</span>
                            <span className="mt-1 flex flex-wrap gap-1.5 text-[11px] font-semibold">
                              {c.weight && <Localized value={BOOK.weight} className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300" />}
                              {c.bengal && <Localized value={BOOK.bengal} className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300" />}
                              {c.available ? (
                                <>
                                  <Localized value={BOOK.status[s.status]} className={`rounded px-1.5 py-0.5 ${STATUS_TONE[s.status]}`} />
                                  {c.readingMinutes && <Localized value={BOOK.minutes(c.readingMinutes.standard)} className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600 dark:bg-slate-800 dark:text-slate-300" />}
                                  {c.draft && <span className="rounded bg-rose-100 px-1.5 py-0.5 text-rose-800 dark:bg-rose-500/20 dark:text-rose-200">DRAFT</span>}
                                </>
                              ) : (
                                <Localized value={BOOK.comingSoon} className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-500 dark:bg-slate-800 dark:text-slate-400" />
                              )}
                            </span>
                            {c.available && s.read > 0 && <span className="mt-1.5 block max-w-xs"><ProgressBar percent={s.percent} label={`${c.code} ${s.percent}%`} /></span>}
                          </span>
                        </>
                      );
                      return (
                        <li key={c.code}>
                          {c.available ? (
                            <Link to={`${bookChapterPath(card, c.code)}${preview ? '?preview=1' : ''}`} className="flex min-h-14 items-start gap-3 py-2.5 hover:bg-indigo-50/60 dark:hover:bg-slate-800/60">{inner}</Link>
                          ) : (
                            <div className="flex min-h-14 items-start gap-3 py-2.5" aria-disabled="true">{inner}</div>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                </section>
              );
            })}
          </nav>
        </div>
      )}
    </PageShell>
  );
}

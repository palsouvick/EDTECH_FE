import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useDataSource } from '../../app/DataSourceContext';
import PageShell from '../../components/navigation/PageShell';
import PracticeArena from '../../components/practice/PracticeArena';
import { Localized, MathMarkdown } from '../../components/topic-hub/Localized';
import { CardGridSkeleton, LoadError } from '../funnel/FunnelLayout';
import useBookProgress from '../../hooks/useBookProgress';
import { BOOK, BOOK_FOR_CARD, bnNum, cardFromSlug, bookChapterPath, bookHomePath } from '../../lib/bookCopy';
import { chapterStatus, tally, weakSections } from '../../lib/bookProgress';
import { ProgressBar } from './BookHomePage';
import { gkTopicPath } from './GkChapterPage';

const box = 'rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5 dark:bg-slate-900 dark:ring-slate-800';
const BOX_TONE = {
  exam_note: 'bg-amber-50 ring-amber-200 text-amber-950 dark:bg-amber-500/10 dark:ring-amber-500/30 dark:text-amber-100',
  dont_confuse: 'bg-rose-50 ring-rose-200 text-rose-950 dark:bg-rose-500/10 dark:ring-rose-500/30 dark:text-rose-100',
  did_you_know: 'bg-sky-50 ring-sky-200 text-sky-950 dark:bg-sky-500/10 dark:ring-sky-500/30 dark:text-sky-100',
  bengal: 'bg-emerald-50 ring-emerald-200 text-emerald-950 dark:bg-emerald-500/10 dark:ring-emerald-500/30 dark:text-emerald-100',
  remember: 'bg-violet-50 ring-violet-200 text-violet-950 dark:bg-violet-500/10 dark:ring-violet-500/30 dark:text-violet-100',
};
const DEPTHS = ['quick', 'standard', 'deep'];
const sectionAnchor = (id) => `sec-${id}`;

/** Bengali chapter text (Markdown). */
function Text({ children, className = '' }) {
  if (!children) return null;
  return (
    <div lang="bn" className={`leading-relaxed text-slate-800 dark:text-slate-100 ${className}`}>
      <MathMarkdown source={children} />
    </div>
  );
}

function Block({ id, title, children, tone = box }) {
  return (
    <section id={id} className={`${tone} scroll-mt-24`}>
      <Localized value={title} as="h2" className="text-lg font-bold text-slate-900 dark:text-white" />
      <div className="mt-2">{children}</div>
    </section>
  );
}

function PyqChips({ list }) {
  if (!list?.length) return null;
  return (
    <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
      <Localized value={BOOK.sectionPyq} className="font-semibold text-slate-600 dark:text-slate-300" />
      {list.map((p) => (
        <span key={p.exam} className="rounded-full bg-indigo-50 px-2 py-0.5 font-semibold text-indigo-800 ring-1 ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-200 dark:ring-indigo-500/30">
          {p.exam} {p.years.join(', ')}
        </span>
      ))}
    </p>
  );
}

function DepthSwitch({ depth, onDepth, hasDeep }) {
  return (
    <div role="radiogroup" aria-label={BOOK.depth.en} className="flex gap-2 overflow-x-auto pb-1">
      {DEPTHS.filter((d) => d !== 'deep' || hasDeep).map((d) => (
        <button
          key={d}
          type="button"
          role="radio"
          aria-checked={d === depth}
          onClick={() => onDepth(d)}
          className={`min-h-11 shrink-0 rounded-xl px-4 text-left text-sm ring-1 ${d === depth ? 'bg-indigo-600 text-white ring-indigo-600' : 'bg-white text-slate-700 ring-slate-200 hover:bg-indigo-50 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700'}`}
        >
          <Localized value={BOOK.depths[d].title} className="block font-bold" />
          <Localized value={BOOK.depths[d].hint} className={`block text-[11px] ${d === depth ? 'text-indigo-100' : 'text-slate-500'}`} />
        </button>
      ))}
    </div>
  );
}

/** One section of the detailed explanation, at the chosen depth, with its boxes, sources and "read" state. */
function ChapterSection({ index, section, depth, sources, read, onRead, observe }) {
  const end = useRef(null);
  const head = useRef(null);
  useEffect(() => observe?.(section.id, head.current, end.current), [observe, section.id]);
  return (
    <section id={sectionAnchor(section.id)} className={`${box} scroll-mt-24`} aria-labelledby={`${sectionAnchor(section.id)}-h`}>
      <h2 ref={head} id={`${sectionAnchor(section.id)}-h`} lang="bn" className="text-xl font-bold text-slate-900 dark:text-white">
        <span className="mr-2 text-indigo-600 tabular-nums dark:text-indigo-400">{bnNum(index + 1)}.</span>
        {section.heading}
      </h2>
      <div className="mt-3 space-y-3">
        {depth === 'quick' ? <Text>{section.quick}</Text> : <Text>{section.standard}</Text>}
        {depth === 'deep' && section.deep && (
          <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-200 dark:bg-slate-800/60 dark:ring-slate-700">
            <Localized value={BOOK.deepMore} as="p" className="text-sm font-bold text-indigo-800 dark:text-indigo-300" />
            <Text className="mt-1">{section.deep}</Text>
          </div>
        )}
        {depth !== 'quick' &&
          section.boxes.map((b, i) => (
            <aside key={i} className={`rounded-xl p-3 ring-1 ${BOX_TONE[b.kind] || BOX_TONE.remember}`}>
              <p className="text-sm font-bold">
                <Localized value={BOOK.boxes[b.kind] || BOOK.boxes.remember} />
                {b.title && <span lang="bn">: {b.title}</span>}
              </p>
              <Text className="mt-1 text-sm !text-inherit">{b.body}</Text>
            </aside>
          ))}
        <PyqChips list={section.pyq} />
        {section.sources.length > 0 && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            <Localized value={BOOK.sources} />:{' '}
            {section.sources.map((id, i) => {
              const s = sources.find((x) => x.id === id);
              return s ? (
                <span key={id}>
                  {i > 0 && '; '}
                  <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{s.publisher || 'NCERT'} {s.class ? `${s.class}: ` : ''}{s.title}</a>
                </span>
              ) : null;
            })}
          </p>
        )}
      </div>
      <div ref={end} className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => onRead(section.id)}
          disabled={read}
          className={`min-h-11 rounded-xl px-4 text-sm font-bold ring-1 ${read ? 'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/30' : 'bg-white text-indigo-700 ring-indigo-200 hover:bg-indigo-50 dark:bg-slate-900 dark:text-indigo-300 dark:ring-indigo-500/40'}`}
        >
          <Localized value={read ? BOOK.isRead : BOOK.markRead} />
        </button>
      </div>
    </section>
  );
}

/** Score, per-section accuracy and weak sections after a practice session, with revise and test-again links. */
function Analysis({ result, headings, onRevise, onTestAgain }) {
  const rows = Object.entries(result.bySection).map(([id, r]) => ({ id, heading: headings[id] || id, ...r, accuracy: Math.round((100 * r.correct) / r.total) }));
  const weak = weakSections(result.bySection, headings, { minAnswers: 1 });
  return (
    <div className="space-y-4" role="status">
      <div>
        <Localized value={BOOK.analysisTitle} as="h3" className="text-base font-bold text-slate-900 dark:text-white" />
        <Localized value={BOOK.score(result.correct, result.total)} as="p" className="text-2xl font-extrabold text-indigo-700 dark:text-indigo-300" />
      </div>
      {rows.length > 0 && (
        <div>
          <Localized value={BOOK.bySection} as="p" className="text-sm font-semibold text-slate-700 dark:text-slate-200" />
          <ul className="mt-1 space-y-2">
            {rows.map((r) => (
              <li key={r.id} className="text-sm">
                <span className="flex justify-between gap-2" lang="bn"><span>{r.heading}</span><span className="tabular-nums">{bnNum(r.correct)}/{bnNum(r.total)}</span></span>
                <ProgressBar percent={r.accuracy} label={`${r.heading} ${r.accuracy}%`} />
              </li>
            ))}
          </ul>
        </div>
      )}
      <WeakList weak={weak} onRevise={onRevise} onTestAgain={onTestAgain} />
    </div>
  );
}

function WeakList({ weak, onRevise, onTestAgain }) {
  return (
    <div className="rounded-xl bg-rose-50 p-3 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:ring-rose-500/30">
      <Localized value={BOOK.weakTitle} as="p" className="text-sm font-bold text-rose-900 dark:text-rose-100" />
      {weak.length === 0 ? (
        <Localized value={BOOK.weakNone} as="p" className="mt-1 text-sm text-rose-900/80 dark:text-rose-100/80" />
      ) : (
        <>
          <ul className="mt-1 space-y-1">
            {weak.map((w) => (
              <li key={w.id} className="flex flex-wrap items-center justify-between gap-2 text-sm text-rose-950 dark:text-rose-100">
                <span lang="bn">{w.heading} · {bnNum(w.accuracy)}%</span>
                <button type="button" onClick={() => onRevise(w.id)} className="min-h-10 rounded-lg px-2 font-semibold text-indigo-700 underline underline-offset-2 dark:text-indigo-300">
                  <Localized value={BOOK.revise} />
                </button>
              </li>
            ))}
          </ul>
          <button type="button" onClick={() => onTestAgain(weak.map((w) => w.id))} className="mt-2 min-h-11 rounded-xl bg-rose-600 px-4 text-sm font-bold text-white hover:bg-rose-500">
            <Localized value={BOOK.testAgain} />
          </button>
        </>
      )}
    </div>
  );
}

/** "Practise this chapter": practice / mini test / PYQs / weak sections, then the analysis. */
function PracticePanel({ bookCode, chapter, preview, entry, onResult, onRevise }) {
  const source = useDataSource();
  const [run, setRun] = useState(null); // { mode, sections, key }
  const [finished, setFinished] = useState(null);
  const checked = useRef([]);
  const saved = useRef(false);
  const headings = useMemo(() => Object.fromEntries(chapter.sections.map((s) => [s.id, s.heading])), [chapter]);

  const start = useCallback((mode, sections = []) => {
    checked.current = [];
    saved.current = false;
    setFinished(null);
    setRun({ mode, sections, key: Date.now() });
  }, []);

  const practice = useMemo(
    () => run && source.bookPracticeSource(bookCode, chapter.code, { mode: run.mode, sections: run.sections, preview, onChecked: (a) => checked.current.push(a) }),
    [run, source, bookCode, chapter.code, preview],
  );

  const finish = useCallback(() => {
    const result = tally(checked.current);
    if (!saved.current && result.total) {
      saved.current = true;
      onResult({ chapter: chapter.code, mode: run.mode, ...result });
    }
    setFinished(result);
    setRun(null);
  }, [chapter.code, onResult, run]);

  const overallWeak = weakSections(entry?.sections, headings);
  const mini = entry?.mini?.best;
  const pyqTotal = chapter.pyq.total;

  return (
    <Block id="practice" title={BOOK.practiceTitle}>
      <Localized value={BOOK.practiceHint} as="p" className="text-sm text-slate-600 dark:text-slate-300" />
      <p className="mt-2 flex flex-wrap gap-1.5 text-xs">
        {chapter.levels.filter((l) => l.count).map((l) => (
          <span key={l.level} className="rounded bg-slate-100 px-2 py-0.5 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            <Localized value={BOOK.levels[l.level]} /> {bnNum(l.count)}
          </span>
        ))}
        {mini && <Localized value={BOOK.bestMini(Math.round((100 * mini.correct) / mini.total))} className="rounded bg-indigo-50 px-2 py-0.5 font-semibold text-indigo-800 dark:bg-indigo-500/10 dark:text-indigo-200" />}
      </p>

      {!run && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => start('practice')} className="min-h-11 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-500">
            <Localized value={BOOK.modes.practice(chapter.questionCount)} />
          </button>
          <button type="button" onClick={() => start('mini')} className="min-h-11 rounded-xl bg-white px-4 text-sm font-bold text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-50 dark:bg-slate-900 dark:text-indigo-300">
            <Localized value={BOOK.modes.mini(Math.min(15, chapter.questionCount))} />
          </button>
          {pyqTotal > 0 && (
            <button type="button" onClick={() => start('pyq')} className="min-h-11 rounded-xl bg-white px-4 text-sm font-bold text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-50 dark:bg-slate-900 dark:text-indigo-300">
              <Localized value={BOOK.modes.pyq(pyqTotal)} />
            </button>
          )}
        </div>
      )}

      {!run && !finished && overallWeak.length > 0 && (
        <div className="mt-3">
          <WeakList weak={overallWeak} onRevise={onRevise} onTestAgain={(ids) => start('weak', ids)} />
        </div>
      )}

      {run && (
        <div className="mt-3 space-y-3">
          <PracticeArena
            key={run.key}
            source={practice}
            topicName={{ bn: chapter.title }}
            initialGoal={run.mode === 'mini' ? 15 : 20}
            endScreen={
              <button type="button" onClick={finish} className="min-h-11 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white">
                <Localized value={BOOK.finish} />
              </button>
            }
          />
          <button type="button" onClick={finish} className="min-h-11 rounded-xl bg-white px-4 text-sm font-bold text-slate-700 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-200">
            <Localized value={BOOK.finish} />
          </button>
        </div>
      )}

      {finished && (
        <div className="mt-3">
          <Analysis result={finished} headings={headings} onRevise={onRevise} onTestAgain={(ids) => start('weak', ids)} />
        </div>
      )}
    </Block>
  );
}

/**
 * /learn/gk/:card/book/:code: one chapter like a textbook. Overview → numbered sections (Quick / Standard /
 * Deep) → events → people → timeline → terms → cause → event → result → exam focus → Bengal connection →
 * quick revision → PYQ connection → practice and mini test with the weak-section analysis.
 */
export default function BookChapterPage() {
  const { chapter: slug, code } = useParams();
  const card = cardFromSlug(slug);
  const bookCode = BOOK_FOR_CARD[card];
  const location = useLocation();
  const preview = new URLSearchParams(location.search).get('preview') === '1';
  const source = useDataSource();
  const [state, setState] = useState({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const { progress, recordReading, recordResult } = useBookProgress(bookCode || 'history');
  const depth = progress.depth || 'standard';
  const entry = progress.chapters[code];
  const read = useMemo(() => new Set(entry?.read || []), [entry]);

  useEffect(() => {
    if (!bookCode) return undefined;
    let live = true;
    setState({ status: 'loading' });
    source.getBookChapter(bookCode, code, { preview }).then((chapter) => live && setState({ status: 'ready', chapter }), (error) => live && setState({ status: 'error', error }));
    return () => {
      live = false;
    };
  }, [source, bookCode, code, preview, attempt]);

  const chapter = state.chapter;

  // Open at the section in the address (#sec-…), e.g. from "Continue reading" or "Revise this section".
  useEffect(() => {
    if (!chapter || !location.hash) return;
    document.getElementById(location.hash.slice(1))?.scrollIntoView?.({ block: 'start' });
  }, [chapter, location.hash]);

  // Remember the section on screen (where the student stopped) and count a section read when its end is reached.
  const lastSeen = useRef(null);
  const observer = useRef(null);
  const targets = useRef(new Map());
  useEffect(() => {
    if (!chapter || typeof IntersectionObserver === 'undefined') return undefined;
    const io = new IntersectionObserver((items) => {
      for (const it of items) {
        if (!it.isIntersecting) continue;
        const t = targets.current.get(it.target);
        if (!t) continue;
        if (t.kind === 'head' && lastSeen.current !== t.id) {
          lastSeen.current = t.id;
          recordReading({ chapter: chapter.code, section: t.id });
        }
        if (t.kind === 'end') recordReading({ chapter: chapter.code, read: [t.id] });
      }
    }, { rootMargin: '0px 0px -40% 0px' });
    observer.current = io;
    for (const el of targets.current.keys()) io.observe(el);
    return () => io.disconnect();
  }, [chapter, recordReading]);
  const observe = useCallback((id, head, end) => {
    const pairs = [[head, 'head'], [end, 'end']].filter(([el]) => el);
    for (const [el, kind] of pairs) {
      targets.current.set(el, { id, kind });
      observer.current?.observe(el);
    }
    return () => {
      for (const [el] of pairs) {
        targets.current.delete(el);
        observer.current?.unobserve(el);
      }
    };
  }, []);

  const onRevise = useCallback((id) => {
    document.getElementById(sectionAnchor(id))?.scrollIntoView?.({ behavior: 'smooth', block: 'start' });
  }, []);

  if (!bookCode) {
    return (
      <PageShell className="max-w-4xl pb-16 pt-6">
        <Localized value={BOOK.notFound} as="p" className="text-slate-700 dark:text-slate-200" />
      </PageShell>
    );
  }
  const status = chapter ? chapterStatus(chapter, entry) : null;
  const q = preview ? '?preview=1' : '';

  return (
    <PageShell className="max-w-4xl pb-16 pt-6 sm:pt-8">
      <Link to={`${bookHomePath(card)}${q}`} className="inline-flex min-h-10 items-center text-sm font-semibold text-indigo-700 hover:underline dark:text-indigo-300">
        ← <Localized value={BOOK.backToBook} />
      </Link>
      {state.status === 'loading' && <CardGridSkeleton count={3} height="h-40" />}
      {state.status === 'error' && (state.error?.status === 404 ? <Localized value={BOOK.notFound} as="p" className="mt-4 text-slate-700 dark:text-slate-200" /> : <LoadError error={state.error} onRetry={() => setAttempt((n) => n + 1)} />)}
      {chapter && (
        <article className="mt-2 space-y-5">
          {chapter.draft && <Localized value={BOOK.draft} as="p" role="note" className="rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-900 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-100 dark:ring-rose-500/30" />}
          <header>
            <Localized value={BOOK.chapterN(chapter.number)} as="p" className="text-sm font-bold text-indigo-700 dark:text-indigo-300" />
            <h1 lang="bn" className="mt-1 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white">{chapter.title}</h1>
            {chapter.subtitle && <p lang="bn" className="mt-1 text-slate-600 dark:text-slate-300">{chapter.subtitle}</p>}
            <p className="mt-2 flex flex-wrap gap-1.5 text-xs font-semibold">
              {chapter.weight && <Localized value={BOOK.weight} className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300" />}
              {chapter.bengal && <Localized value={BOOK.bengal} className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300" />}
              <Localized value={BOOK.minutes(chapter.readingMinutes[depth] || chapter.readingMinutes.standard)} className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600 dark:bg-slate-800 dark:text-slate-300" />
              <Localized value={BOOK.questions(chapter.questionCount)} className="rounded bg-slate-100 px-1.5 py-0.5 text-slate-600 dark:bg-slate-800 dark:text-slate-300" />
              {chapter.pyq.total > 0 && <Localized value={BOOK.pyqs(chapter.pyq.total)} className="rounded bg-indigo-50 px-1.5 py-0.5 text-indigo-800 dark:bg-indigo-500/10 dark:text-indigo-200" />}
            </p>
            <div className="mt-3 max-w-md space-y-1">
              <Localized value={BOOK.sectionsRead(status.read, status.total)} as="p" className="text-xs font-semibold text-slate-600 dark:text-slate-300" />
              <ProgressBar percent={status.percent} label={BOOK.sectionsRead(status.read, status.total).en} />
            </div>
          </header>

          <DepthSwitch depth={depth} hasDeep={chapter.sections.some((s) => s.deep)} onDepth={(d) => recordReading({ chapter: chapter.code, depth: d })} />

          <nav aria-label={BOOK.sectionsNav.en} className="sticky top-0 z-10 -mx-4 overflow-x-auto bg-slate-50/95 px-4 py-2 backdrop-blur dark:bg-slate-950/95">
            <ol className="flex gap-2">
              {chapter.sections.map((s, i) => (
                <li key={s.id} className="shrink-0">
                  <a href={`#${sectionAnchor(s.id)}`} onClick={(e) => { e.preventDefault(); onRevise(s.id); }} className={`inline-flex min-h-10 items-center rounded-lg px-3 text-sm ring-1 ${read.has(s.id) ? 'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/30' : 'bg-white text-slate-700 ring-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700'}`} lang="bn">
                    {bnNum(i + 1)}. {s.heading}
                  </a>
                </li>
              ))}
              <li className="shrink-0">
                <a href="#practice" onClick={(e) => { e.preventDefault(); document.getElementById('practice')?.scrollIntoView?.({ behavior: 'smooth' }); }} className="inline-flex min-h-10 items-center rounded-lg bg-indigo-600 px-3 text-sm font-semibold text-white">
                  <Localized value={BOOK.practiceTitle} />
                </a>
              </li>
            </ol>
          </nav>

          <Block title={BOOK.overview}>
            <Text>{chapter.overview.intro}</Text>
            <Localized value={BOOK.youWillLearn} as="p" className="mt-3 text-sm font-semibold text-slate-900 dark:text-white" />
            <ul lang="bn" className="mt-1 list-disc space-y-1 pl-5 text-slate-800 dark:text-slate-100">
              {chapter.overview.you_will_learn.map((x, i) => <li key={i}>{x}</li>)}
            </ul>
            {chapter.prerequisites.length > 0 && (
              <div className="mt-3 rounded-xl bg-indigo-50 p-3 text-sm ring-1 ring-indigo-200 dark:bg-indigo-500/10 dark:ring-indigo-500/30">
                <Localized value={BOOK.readFirst} as="p" className="font-semibold text-indigo-900 dark:text-indigo-100" />
                <ul className="mt-1 space-y-1">
                  {chapter.prerequisites.map((p) => (
                    <li key={p.code} lang="bn">
                      {p.available ? (
                        <Link to={bookChapterPath(card, p.code)} className="font-semibold text-indigo-700 underline dark:text-indigo-300">{`অধ্যায় ${bnNum(p.number)}: ${p.title}`}</Link>
                      ) : (
                        <span className="text-slate-700 dark:text-slate-200">
                          {`অধ্যায় ${bnNum(p.number)}: ${p.title}`} <Localized value={BOOK.comingSoon} className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500 dark:bg-slate-800" />
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </Block>

          {chapter.sections.map((s, i) => (
            <ChapterSection key={s.id} index={i} section={s} depth={depth} sources={chapter.sources} read={read.has(s.id)} onRead={(id) => recordReading({ chapter: chapter.code, read: [id], section: id })} observe={observe} />
          ))}

          {depth !== 'quick' && (
            <>
              <Block title={BOOK.events}>
                <ol className="space-y-3">
                  {chapter.events.map((e, i) => (
                    <li key={i} lang="bn" className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                      <p className="font-bold text-slate-900 dark:text-white"><span className="text-indigo-700 dark:text-indigo-300">{e.when}</span> · {e.title}</p>
                      <Text className="mt-1 text-sm">{e.what}</Text>
                      <p className="mt-1 text-sm text-slate-700 dark:text-slate-200"><Localized value={BOOK.whyMatters} className="font-semibold" />: {e.why_it_matters}</p>
                    </li>
                  ))}
                </ol>
              </Block>

              <Block title={BOOK.people}>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {chapter.people.map((p, i) => (
                    <li key={i} lang="bn" className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                      <p className="font-bold text-slate-900 dark:text-white">{p.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{[p.when, p.role].filter(Boolean).join(' · ')}</p>
                      <Text className="mt-1 text-sm">{p.contribution}</Text>
                    </li>
                  ))}
                </ul>
              </Block>
            </>
          )}

          <Block title={BOOK.timeline}>
            <ol className="relative space-y-3 border-l-2 border-indigo-200 pl-4 dark:border-indigo-500/40" lang="bn">
              {chapter.timeline.map((t, i) => (
                <li key={i}>
                  <span className="absolute -left-[7px] mt-1.5 h-3 w-3 rounded-full bg-indigo-600" aria-hidden="true" />
                  <p className="font-bold tabular-nums text-indigo-700 dark:text-indigo-300">{t.when}</p>
                  <p className="text-sm text-slate-800 dark:text-slate-100">{t.label}</p>
                </li>
              ))}
            </ol>
          </Block>

          {depth !== 'quick' && (
            <>
              <Block title={BOOK.terms}>
                <dl className="grid gap-2 sm:grid-cols-2" lang="bn">
                  {chapter.terms.map((t, i) => (
                    <div key={i} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
                      <dt className="font-bold text-slate-900 dark:text-white">{t.term}</dt>
                      <dd className="mt-0.5 text-sm text-slate-700 dark:text-slate-200">{t.meaning}</dd>
                    </div>
                  ))}
                </dl>
              </Block>

              {chapter.causeEffect.length > 0 && (
                <Block title={BOOK.causeEffect}>
                  <div className="space-y-4">
                    {chapter.causeEffect.map((x, i) => (
                      <div key={i} lang="bn" className="rounded-xl ring-1 ring-slate-200 dark:ring-slate-700">
                        <p className="rounded-t-xl bg-slate-100 px-3 py-2 font-bold text-slate-900 dark:bg-slate-800 dark:text-white">{x.title}</p>
                        <div className="grid gap-2 p-3 sm:grid-cols-3">
                          <div><Localized value={BOOK.causes} as="p" className="text-xs font-bold uppercase text-amber-700 dark:text-amber-300" /><ul className="mt-1 list-disc pl-4 text-sm">{x.causes.map((c, j) => <li key={j}>{c}</li>)}</ul></div>
                          <div><Localized value={BOOK.event} as="p" className="text-xs font-bold uppercase text-indigo-700 dark:text-indigo-300" /><p className="mt-1 text-sm">{x.event}</p></div>
                          <div><Localized value={BOOK.results} as="p" className="text-xs font-bold uppercase text-emerald-700 dark:text-emerald-300" /><ul className="mt-1 list-disc pl-4 text-sm">{x.results.map((c, j) => <li key={j}>{c}</li>)}</ul></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Block>
              )}
            </>
          )}

          <Block title={BOOK.examFocus} tone="rounded-2xl bg-amber-50 p-4 ring-1 ring-amber-200 sm:p-5 dark:bg-amber-500/10 dark:ring-amber-500/30">
            <ul className="space-y-2" lang="bn">
              {chapter.examFocus.map((x, i) => (
                <li key={i} className="text-amber-950 dark:text-amber-100">
                  <span>• {x.point}</span>
                  <PyqChips list={x.pyq} />
                </li>
              ))}
            </ul>
            <Localized value={BOOK.examFocusNote} as="p" className="mt-3 text-xs text-amber-900/80 dark:text-amber-100/70" />
          </Block>

          <Block title={BOOK.bengalConnection} tone="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-200 sm:p-5 dark:bg-emerald-500/10 dark:ring-emerald-500/30">
            <Text className="!text-emerald-950 dark:!text-emerald-100">{chapter.bengalConnection.body}</Text>
          </Block>

          <Block id="revision" title={BOOK.quickRevision} tone="rounded-2xl bg-violet-50 p-4 ring-1 ring-violet-200 sm:p-5 dark:bg-violet-500/10 dark:ring-violet-500/30">
            <ol lang="bn" className="list-decimal space-y-1 pl-5 text-violet-950 dark:text-violet-100">
              {chapter.quickRevision.map((x, i) => <li key={i}><MathMarkdown source={x} inline /></li>)}
            </ol>
          </Block>

          <Block title={BOOK.pyqConnection}>
            {chapter.pyq.total === 0 ? (
              <Localized value={BOOK.pyqConnectionNone} as="p" className="text-sm text-slate-600 dark:text-slate-300" />
            ) : (
              <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-200">
                {chapter.pyq.byExam.map((e) => <li key={e.exam}><Localized value={BOOK.pyqByExam(e.exam, e.count, e.years)} /></li>)}
              </ul>
            )}
          </Block>

          <PracticePanel bookCode={bookCode} chapter={chapter} preview={preview} entry={entry} onResult={recordResult} onRevise={onRevise} />

          {chapter.relatedFacts.length > 0 && (
            <p className="flex flex-wrap gap-2 text-sm">
              {chapter.relatedFacts.map((c) => <Link key={c} to={gkTopicPath(c)} className="inline-flex min-h-10 items-center rounded-lg bg-indigo-50 px-3 font-semibold text-indigo-700 ring-1 ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300">📚 {c}</Link>)}
            </p>
          )}

          <Block title={BOOK.sources}>
            <ul className="space-y-1 text-sm">
              {chapter.sources.map((s) => (
                <li key={s.id}><a href={s.url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline underline-offset-2 dark:text-indigo-400">{s.publisher || 'NCERT'} {s.class ? `${s.class}: ` : ''}{s.title}</a></li>
              ))}
            </ul>
          </Block>

          <nav className="flex flex-wrap justify-between gap-2" aria-label="chapters">
            {chapter.previous?.available ? <Link to={`${bookChapterPath(card, chapter.previous.code)}${q}`} className="inline-flex min-h-11 items-center rounded-xl bg-white px-4 text-sm font-semibold text-indigo-700 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-indigo-300"><Localized value={BOOK.previous} /></Link> : <span />}
            {chapter.next?.available && <Link to={`${bookChapterPath(card, chapter.next.code)}${q}`} className="inline-flex min-h-11 items-center rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white"><Localized value={BOOK.next} /></Link>}
          </nav>
        </article>
      )}
    </PageShell>
  );
}

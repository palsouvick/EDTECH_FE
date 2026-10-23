import { useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useDataSource } from '../../app/DataSourceContext';
import { useResource } from '../../hooks/useResource';
import { useLanguagePreference } from '../../hooks/useLanguagePreference';
import { LEARN, QUIZ_LEVELS } from '../../lib/learnCopy';
import { lastChapter, levelCleared, levelProgress } from '../../lib/learnProgress';
import { learnPaths, subjectCodeFromSlug } from '../../lib/routes';
import PageShell from '../../components/navigation/PageShell';
import { Localized } from '../../components/topic-hub/Localized';
import { ArrowRightIcon, CheckIcon } from '../../components/topic-hub/icons';
import { CardGridSkeleton, LoadError } from '../funnel/FunnelLayout';

const SUBJECT_TABS = [
  { code: 'quant', emoji: '🔢', title: { en: 'Math', bn: 'গণিত' } },
  { code: 'english', emoji: '🔤', title: { en: 'English', bn: 'ইংরেজি' } },
];

// One colour per card, cycling, so a long grid stays easy to scan.
const PALETTE = [
  { tile: 'bg-sky-100 dark:bg-sky-500/15', strip: 'from-sky-400 to-blue-500', btn: 'bg-sky-600 hover:bg-sky-500' },
  { tile: 'bg-violet-100 dark:bg-violet-500/15', strip: 'from-violet-400 to-purple-500', btn: 'bg-violet-600 hover:bg-violet-500' },
  { tile: 'bg-emerald-100 dark:bg-emerald-500/15', strip: 'from-emerald-400 to-teal-500', btn: 'bg-emerald-600 hover:bg-emerald-500' },
  { tile: 'bg-amber-100 dark:bg-amber-500/15', strip: 'from-amber-400 to-orange-500', btn: 'bg-amber-600 hover:bg-amber-500' },
  { tile: 'bg-rose-100 dark:bg-rose-500/15', strip: 'from-rose-400 to-pink-500', btn: 'bg-rose-600 hover:bg-rose-500' },
  { tile: 'bg-cyan-100 dark:bg-cyan-500/15', strip: 'from-cyan-400 to-sky-500', btn: 'bg-cyan-700 hover:bg-cyan-600' },
];

/** Per chapter: which levels are cleared and whether any quiz was taken. */
function chapterProgress(subject, chapter) {
  const levels = QUIZ_LEVELS.map((l) => {
    const best = levelProgress(subject, chapter.topic, l.level).best;
    const info = chapter.levels.find((x) => x.level === l.level);
    return { ...l, best, cleared: levelCleared(best), available: Boolean(info?.count) };
  });
  return { levels, cleared: levels.filter((l) => l.cleared).length, started: levels.some((l) => l.best) };
}

/** 🌱 — 🌿 — 🌳: the three quiz levels as a small path, filled when cleared. */
function LevelPath({ levels }) {
  return (
    <ol className="flex items-center" aria-label="Levels">
      {levels.map((l, i) => (
        <li key={l.level} className="flex items-center">
          {i > 0 && <span aria-hidden="true" className={`h-0.5 w-5 sm:w-6 ${l.cleared ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-700'}`} />}
          <span
            title={l.label.en}
            className={`relative grid size-8 place-items-center rounded-full text-base ${
              l.cleared ? 'bg-emerald-100 ring-2 ring-emerald-400 dark:bg-emerald-500/20' : l.best ? 'bg-amber-50 ring-2 ring-amber-300 dark:bg-amber-500/10' : 'bg-slate-100 ring-1 ring-slate-200 grayscale dark:bg-slate-800 dark:ring-slate-700'
            } ${l.available ? '' : 'opacity-40'}`}
          >
            <span aria-hidden="true">{l.icon}</span>
            {l.cleared && (
              <span className="absolute -right-1 -top-1 grid size-4 place-items-center rounded-full bg-emerald-500 text-white">
                <CheckIcon width={10} height={10} strokeWidth={3.5} />
              </span>
            )}
            <span className="sr-only">
              {l.label.en}: {l.cleared ? 'cleared' : l.best ? `best ${l.best.correct}/${l.best.total}` : 'not started'}
            </span>
          </span>
        </li>
      ))}
    </ol>
  );
}

function ChapterCard({ subject, chapter, n, colour, startHere }) {
  const p = chapterProgress(subject, chapter);
  const done = p.cleared === 3;
  return (
    <Link
      to={learnPaths.chapter(subject, chapter.topic)}
      className="group relative flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 motion-reduce:transition-none dark:bg-slate-900 dark:ring-slate-800"
    >
      <span aria-hidden="true" className={`h-2 bg-gradient-to-r ${colour.strip}`} />
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <span className={`grid size-14 shrink-0 place-items-center rounded-2xl text-3xl transition-transform group-hover:scale-110 motion-reduce:transition-none ${colour.tile}`} aria-hidden="true">
            {chapter.emoji}
          </span>
          {startHere && (
            <Localized value={LEARN.startHere} className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300" />
          )}
          {done && <span className="text-2xl" aria-hidden="true">🏆</span>}
        </div>
        <Localized value={LEARN.chapterN(n)} as="p" className="mt-4 text-xs font-bold uppercase tracking-wider text-slate-400" />
        <Localized value={chapter.title} as="h2" className="mt-0.5 text-lg font-extrabold leading-snug text-slate-900 dark:text-white" />
        {chapter.intro && <Localized value={chapter.intro} markdown as="div" className="mt-2 line-clamp-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300" />}

        <div className="mt-auto pt-5">
          <div className="flex items-center justify-between gap-2">
            <LevelPath levels={p.levels} />
            <Localized value={LEARN.levelsDone(p.cleared)} className="text-xs font-semibold text-slate-500 dark:text-slate-400" />
          </div>
          <span className={`mt-4 flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold text-white transition-colors ${done ? 'bg-emerald-600 group-hover:bg-emerald-500' : colour.btn}`}>
            <Localized value={done ? LEARN.ctaDone : p.started ? LEARN.ctaContinue : LEARN.ctaStart} />
            <ArrowRightIcon className="transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  );
}

function Hero({ subject, chapters }) {
  const last = lastChapter();
  const stats = useMemo(() => {
    if (!chapters) return null;
    let total = 0;
    let cleared = 0;
    for (const c of chapters) {
      for (const l of chapterProgress(subject, c).levels) {
        if (!l.available) continue;
        total += 1;
        if (l.cleared) cleared += 1;
      }
    }
    return { total, cleared, pct: total ? Math.round((cleared / total) * 100) : 0 };
  }, [subject, chapters]);

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-6 text-white shadow-xl shadow-indigo-500/20 sm:p-8">
      <div aria-hidden="true" className="pointer-events-none absolute -right-10 -top-10 size-48 rounded-full bg-white/10" />
      <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 right-24 size-40 rounded-full bg-white/10" />
      <div className="relative grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-center">
        <div>
          <Localized value={LEARN.hello} as="p" className="text-lg font-semibold text-indigo-100" />
          <Localized value={LEARN.pageTitle} as="h1" className="mt-1 text-3xl font-extrabold tracking-tight sm:text-5xl" />
          <Localized value={LEARN.heroSub} as="p" className="mt-3 max-w-xl leading-relaxed text-indigo-50" />
          <ol className="mt-5 flex flex-wrap items-center gap-2">
            {LEARN.journey.map((j, i) => (
              <li key={j.icon} className="flex items-center gap-2">
                {i > 0 && <span aria-hidden="true" className="text-indigo-200">→</span>}
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-semibold ring-1 ring-white/25">
                  <span aria-hidden="true">{j.icon}</span>
                  <Localized value={j.label} />
                </span>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-2xl bg-white/15 p-5 ring-1 ring-white/25 backdrop-blur-sm">
          <Localized value={LEARN.yourProgress} as="p" className="text-sm font-semibold uppercase tracking-wide text-indigo-100" />
          {stats ? (
            <>
              <p className="mt-1 text-4xl font-extrabold tabular-nums">{stats.pct}%</p>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/25" role="progressbar" aria-valuenow={stats.pct} aria-valuemin={0} aria-valuemax={100}>
                <div className="h-full rounded-full bg-gradient-to-r from-amber-300 to-emerald-300" style={{ width: `${Math.max(stats.pct, 2)}%` }} />
              </div>
              <Localized value={LEARN.levelsCleared(stats.cleared, stats.total)} as="p" className="mt-2 text-sm font-medium" />
              <Localized value={LEARN.progressHint} as="p" className="mt-0.5 text-xs text-indigo-100" />
            </>
          ) : (
            <div className="mt-2 h-16 animate-pulse rounded-xl bg-white/15 motion-reduce:animate-none" />
          )}
          {last && (
            <Link
              to={learnPaths.chapter(last.subject, last.topic)}
              className="mt-4 flex min-h-11 items-center justify-between gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-indigo-700 hover:bg-indigo-50"
            >
              <span className="min-w-0">
                <Localized value={LEARN.continueLabel} as="span" className="block text-xs font-semibold text-slate-500" />
                <Localized value={last.title} className="truncate" />
              </span>
              <ArrowRightIcon className="shrink-0" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

/** /learn/:subject: Learn Basics, with Math | English tabs and the chosen subject's chapters. */
export default function SubjectPage() {
  const { subject: slug } = useParams();
  const subject = subjectCodeFromSlug(slug);
  const source = useDataSource();
  const [query, setQuery] = useState('');
  const { lang } = useLanguagePreference(); // placeholders are plain strings, not <Localized>
  const { status, data, error, retry } = useResource(subject && `learn:subject:${subject}`, () => source.getLearnSubject(subject));
  if (!subject) return <Navigate to="/learn" replace />;

  const q = query.trim().toLowerCase();
  const chapters = status === 'ready' ? data.chapters.map((c, i) => ({ c, n: i + 1 })) : [];
  const shown = q ? chapters.filter(({ c }) => `${c.title.en} ${c.title.bn ?? ''} ${c.topic}`.toLowerCase().includes(q)) : chapters;
  const nothingStarted = chapters.every(({ c }) => !chapterProgress(subject, c).started);

  return (
    <PageShell className="max-w-6xl pb-16 pt-6 sm:pt-8">
      <Hero subject={subject} chapters={status === 'ready' ? data.chapters : null} />

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Subject tabs: links, so each subject has its own URL and Back works. */}
        <nav aria-label={LEARN.subjectTabs.en} className="grid w-full grid-cols-2 gap-1 rounded-2xl bg-slate-200/70 p-1 sm:w-auto dark:bg-slate-800">
          {SUBJECT_TABS.map((s) => {
            const active = s.code === subject;
            return (
              <Link
                key={s.code}
                to={learnPaths.subject(s.code)}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-12 items-center justify-center gap-2 rounded-xl px-6 text-base font-bold transition-colors focus-visible:outline-2 focus-visible:outline-indigo-500 sm:min-w-44 sm:text-lg ${
                  active ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-950 dark:text-indigo-300' : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                <span aria-hidden="true">{s.emoji}</span>
                <Localized value={s.title} />
              </Link>
            );
          })}
        </nav>
        <label className="relative block sm:w-72">
          <span className="sr-only">{LEARN.searchLabel[lang] ?? LEARN.searchLabel.en}</span>
          <span aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={LEARN.searchPlaceholder[lang] ?? LEARN.searchPlaceholder.en}
            className="min-h-12 w-full rounded-2xl border-0 bg-white pl-10 pr-4 text-base text-slate-900 ring-1 ring-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-slate-900 dark:text-white dark:ring-slate-700"
          />
        </label>
      </div>

      <div className="mt-6">
        {status === 'loading' && <CardGridSkeleton count={6} height="h-72" />}
        {status === 'error' && <LoadError error={error} onRetry={retry} />}
        {status === 'ready' && shown.length === 0 && (
          <Localized value={LEARN.noMatch} as="p" className="rounded-2xl bg-white p-8 text-center text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800" />
        )}
        {status === 'ready' && shown.length > 0 && (
          <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map(({ c, n }) => (
              <li key={c.topic}>
                <ChapterCard subject={subject} chapter={c} n={n} colour={PALETTE[(n - 1) % PALETTE.length]} startHere={n === 1 && nothingStarted} />
              </li>
            ))}
          </ol>
        )}
      </div>
    </PageShell>
  );
}

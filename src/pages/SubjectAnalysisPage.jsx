import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';
import { useDataSource } from '../app/DataSourceContext';
import { loginPath } from '../components/auth/AccountButton';
import PageShell from '../components/navigation/PageShell';
import { Localized } from '../components/topic-hub/Localized';
import { useLanguagePreference } from '../hooks/useLanguagePreference';
import {
  BandBadge,
  card,
  Meter,
  NextSmartQuizCard,
  PlanSteps,
  ProgressMeters,
  SmartQuizButton,
  Stat,
  WeeklyTrend,
  textOf,
  WhyList,
} from '../components/analysis/AnalysisParts';
import { AN, formatDuration } from '../lib/analysisCopy';
import { learnPaths, subjectCodeFromSlug, subjectSlugFromCode } from '../lib/routes';
import { CardGridSkeleton, LoadError } from './funnel/FunnelLayout';

const TABS = ['now', 'chapters', 'weak', 'skipped', 'progress', 'time'];
const ANALYSED = ['quant', 'english'];
const dateOf = (d) => (d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) : null);

/** /analysis/math and /analysis/english: one subject's learning analysis. */
export default function SubjectAnalysisPage() {
  const { subject: slug } = useParams();
  const subject = subjectCodeFromSlug(slug);
  const { status: authStatus, user } = useAuth();
  const source = useDataSource();
  const location = useLocation();
  const { lang } = useLanguagePreference();
  const [state, setState] = useState({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [tab, setTab] = useState(() => (TABS.includes(location.hash.slice(1)) ? location.hash.slice(1) : 'now'));

  useEffect(() => {
    if (!user || !ANALYSED.includes(subject)) return undefined;
    let alive = true;
    setState({ status: 'loading' });
    source.getLearningAnalysis(subject, lang).then(
      (data) => alive && setState({ status: 'ready', data }),
      (error) => alive && setState({ status: 'error', error }),
    );
    return () => {
      alive = false;
    };
  }, [user, source, subject, lang, attempt]);

  if (!ANALYSED.includes(subject)) return <Navigate to="/analysis" replace />;
  if (authStatus === 'ready' && !user) return <Navigate to={loginPath(location)} replace />;
  const d = state.data;
  const other = subject === 'quant' ? 'english' : 'quant';

  return (
    <PageShell className="max-w-6xl pb-16 pt-6 sm:pt-10">
      <header className="rounded-3xl bg-gradient-to-br from-indigo-600 via-violet-600 to-fuchsia-600 p-6 text-white shadow-lg sm:p-8">
        <nav className="text-sm font-semibold text-white/85" aria-label="Breadcrumb">
          <Link to="/analysis" className="underline-offset-2 hover:underline"><Localized value={AN.title} /></Link>
          <span aria-hidden="true"> / </span>
          <Link to={`/analysis/${subjectSlugFromCode(other)}`} className="underline-offset-2 hover:underline">
            {AN.subjectIcon[other]} <Localized value={AN.subjects[other]} />
          </Link>
        </nav>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
          <span aria-hidden="true">{AN.subjectIcon[subject]} </span>
          <Localized value={AN.subjects[subject]} />
        </h1>
        <Localized value={AN.loop} as="p" className="mt-2 max-w-3xl text-sm leading-relaxed text-white/90" />
        {d && <SummaryRow s={d.summary} />}
      </header>

      {state.status === 'loading' && <div className="mt-6"><CardGridSkeleton count={6} height="h-32" /></div>}
      {state.status === 'error' && <div className="mt-6"><LoadError error={state.error} onRetry={() => setAttempt((n) => n + 1)} /></div>}
      {d && (
        <>
          {d.summary.answered === 0 && <Localized value={AN.empty} as="p" className={`${card} mt-6 text-slate-700 dark:text-slate-200`} />}
          <div role="tablist" aria-label={textOf(AN.subjects[subject], lang)} className="sticky top-0 z-10 -mx-4 mt-6 flex gap-2 overflow-x-auto bg-slate-50/95 px-4 py-2 backdrop-blur dark:bg-slate-950/95">
            {TABS.map((k) => (
              <button
                key={k}
                type="button"
                role="tab"
                id={`tab-${k}`}
                aria-selected={tab === k}
                aria-controls={`panel-${k}`}
                onClick={() => setTab(k)}
                className={`min-h-11 shrink-0 rounded-full px-4 text-sm font-semibold ring-1 ${tab === k ? 'bg-indigo-600 text-white ring-indigo-600' : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700'}`}
              >
                <Localized value={AN.tabs[k]} />
              </button>
            ))}
          </div>
          <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="mt-4 space-y-6">
            {tab === 'now' && <StudyNow d={d} />}
            {tab === 'chapters' && <Chapters d={d} lang={lang} />}
            {tab === 'weak' && <WeakQuestions d={d} />}
            {tab === 'skipped' && <Skipped d={d} source={source} lang={lang} />}
            {tab === 'progress' && <Progress d={d} />}
            {tab === 'time' && <TimeTab d={d} />}
          </div>
        </>
      )}
    </PageShell>
  );
}

function SummaryRow({ s }) {
  const items = [
    [AN.mastery, (
      <>
        {s.masteryPct == null ? '—' : `${s.masteryPct}%`}
        {s.syllabusMasteryPct != null && (
          <span className="block text-xs font-semibold text-white/75"><Localized value={AN.syllabus} /> {s.syllabusMasteryPct}%</span>
        )}
      </>
    )],
    [AN.accuracy, s.accuracyPct == null ? '—' : `${s.accuracyPct}%`],
    [AN.needsAttention, s.needsAttentionChapters],
    [AN.incomplete, s.incompleteChapters],
    [AN.openMistakes, s.openMistakes],
    [AN.openSkips, s.openSkips],
  ];
  return (
    <dl className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
      {items.map(([label, v], i) => (
        <div key={i} className="rounded-xl bg-white/15 px-3 py-2 ring-1 ring-white/25">
          <dt><Localized value={label} className="text-xs font-semibold text-white/85" /></dt>
          <dd className="text-xl font-extrabold tabular-nums">{v}</dd>
        </div>
      ))}
      <Localized value={AN.chaptersStarted(s.started, s.chapters)} as="p" className="col-span-full text-xs text-white/85" />
    </dl>
  );
}

/* ------------------------------------------------------------------ Study now */

function StudyNow({ d }) {
  const list = d.studyNow;
  return (
    <>
      <section aria-labelledby="study-now">
        <h2 id="study-now" className="text-xl font-bold text-slate-900 dark:text-white"><Localized value={AN.studyNow} /></h2>
        <Localized value={AN.studyNowSub} as="p" className="text-sm text-slate-600 dark:text-slate-300" />
        {!list.length && <Localized value={AN.nothingToFocus} as="p" className={`${card} mt-3`} />}
        <ol className="mt-3 grid gap-4 lg:grid-cols-2">
          {list.map((c, i) => (
            <li key={c.topic} className={`${card} ${i === 0 ? 'ring-2 ring-indigo-400 dark:ring-indigo-500' : ''}`}>
              {i === 0 && <Localized value={AN.nextTask} as="p" className="mb-1 text-xs font-bold uppercase tracking-wide text-indigo-700 dark:text-indigo-300" />}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white"><Localized value={c.title} /></h3>
                <BandBadge band={c.band} score={c.score} />
              </div>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                <Localized value={AN.mastery} />: <strong className="tabular-nums">{c.mastery == null ? '—' : `${c.mastery}%`}</strong>
                {' · '}
                <Localized value={AN.accuracy} />: <strong className="tabular-nums">{c.accuracy == null ? '—' : `${c.accuracy}%`}</strong>
                {c.weakestSkill && <> · <Localized value={AN.weakestSkill(c.weakestSkill.name, c.weakestSkill.accuracy)} /></>}
              </p>
              {c.why.length > 0 && (
                <div className="mt-3">
                  <Localized value={c.band === 'strong' ? AN.whyStrong(c.title) : AN.whyTitle(c.title)} as="h4" className="text-sm font-bold text-slate-900 dark:text-white" />
                  <WhyList why={c.why} />
                </div>
              )}
              <div className="mt-3">
                <Localized value={AN.plan} as="h4" className="mb-1 text-sm font-bold text-slate-900 dark:text-white" />
                <PlanSteps subject={d.subject} topic={c.topic} plan={c.plan} />
              </div>
              {c.revision?.nextAt && (
                <Localized
                  value={c.revision.due ? AN.reviseNow : AN.reviseOn(dateOf(c.revision.nextAt))}
                  as="p"
                  className={`mt-3 text-xs font-semibold ${c.revision.due ? 'text-rose-700 dark:text-rose-300' : 'text-slate-500 dark:text-slate-400'}`}
                />
              )}
            </li>
          ))}
        </ol>
      </section>
      <Areas d={d} />
      <NextSmartQuizCard subject={d.subject} quiz={d.nextSmartQuiz} />
    </>
  );
}

function Areas({ d }) {
  if (!d.areas?.length) return null;
  return (
    <section aria-labelledby="areas" className={card}>
      <h2 id="areas" className="text-lg font-bold text-slate-900 dark:text-white"><Localized value={AN.areas} /></h2>
      <ul className="mt-3 grid gap-3 sm:grid-cols-2">
        {d.areas.map((a) => (
          <li key={a.key}>
            <Meter label={AN.areaNames[a.key] ?? { en: a.key }} value={a.accuracyPct} />
            {a.weakestTopic && a.accuracyPct != null && (
              <Localized value={AN.areaWeakest(a.weakestTopic.title, a.weakestTopic.accuracy)} as="p" className="mt-0.5 text-xs text-slate-500 dark:text-slate-400" />
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ------------------------------------------------------------------ Chapters */

function Chapters({ d, lang }) {
  const [sort, setSort] = useState('focus');
  const [open, setOpen] = useState(null);
  const chapters = useMemo(() => {
    const list = [...d.chapters];
    if (sort === 'focus') list.sort((a, b) => (a.focus.band === 'not_started') - (b.focus.band === 'not_started') || b.focus.score - a.focus.score);
    if (sort === 'mastery') list.sort((a, b) => (a.mastery ?? 999) - (b.mastery ?? 999));
    return list;
  }, [d.chapters, sort]);
  return (
    <section aria-labelledby="chapters">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="chapters" className="text-xl font-bold text-slate-900 dark:text-white"><Localized value={AN.chaptersTitle} /></h2>
          <Localized value={AN.chaptersSub} as="p" className="max-w-3xl text-sm text-slate-600 dark:text-slate-300" />
        </div>
        <label className="text-sm">
          <Localized value={AN.sortBy} className="mr-2 font-semibold text-slate-600 dark:text-slate-300" />
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="min-h-11 rounded-lg bg-white px-2 ring-1 ring-slate-300 dark:bg-slate-900 dark:ring-slate-700">
            {Object.keys(AN.sorts).map((k) => <option key={k} value={k}>{textOf(AN.sorts[k], lang)}</option>)}
          </select>
        </label>
      </div>
      <Localized value={AN.focusScoreHelp} as="p" className="mt-2 text-xs text-slate-500 dark:text-slate-400" />
      <ul className="mt-3 grid gap-4 md:grid-cols-2">
        {chapters.map((c) => (
          <li key={c.topic} className={card}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-bold text-slate-900 dark:text-white"><span aria-hidden="true">{c.emoji} </span><Localized value={c.title} /></h3>
              <BandBadge band={c.focus.band} score={c.focus.score} />
            </div>
            <div className="mt-3"><ProgressMeters progress={c.progress} /></div>
            {c.readingMasteryGap && <Localized value={AN.readNotMastered} as="p" className="mt-2 text-xs font-semibold text-amber-800 dark:text-amber-300" />}
            {c.complete ? (
              <p className="mt-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">✅ <Localized value={AN.complete} /></p>
            ) : c.answers > 0 && (
              <Localized value={AN.remainingQuestions(c.remaining)} as="p" className="mt-2 text-xs text-slate-500 dark:text-slate-400" />
            )}
            <button type="button" aria-expanded={open === c.topic} onClick={() => setOpen(open === c.topic ? null : c.topic)} className="mt-2 min-h-11 text-sm font-semibold text-indigo-700 hover:underline dark:text-indigo-300">
              <Localized value={AN.conceptLevels} /> {open === c.topic ? '▴' : '▾'}
            </button>
            {open === c.topic && <ConceptLevels c={c} subject={d.subject} />}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ConceptLevels({ c, subject }) {
  const rows = (list) =>
    list.slice(0, 8).map((s) => (
      <li key={s.key} className="flex items-center justify-between gap-2 text-sm">
        <span>
          <Localized value={s.name} />
          {s.hidden && <span className="ml-1.5 rounded bg-rose-50 px-1.5 text-xs font-semibold text-rose-800 dark:bg-rose-500/10 dark:text-rose-200">⚠ <Localized value={AN.hidden} /></span>}
        </span>
        <span className="tabular-nums text-slate-600 dark:text-slate-300">{s.accuracyPct}% · {s.answered}</span>
      </li>
    ));
  return (
    <div className="mt-2 space-y-3 border-t border-slate-100 pt-3 dark:border-slate-800">
      {c.topics.length > 0 && (
        <div>
          <Localized value={AN.topicsLevel} as="h4" className="text-xs font-bold uppercase tracking-wide text-slate-500" />
          <ul className="mt-1 space-y-1">{rows(c.topics)}</ul>
        </div>
      )}
      {c.skills.length > 0 && (
        <div>
          <Localized value={AN.skillsLevel} as="h4" className="text-xs font-bold uppercase tracking-wide text-slate-500" />
          <ul className="mt-1 space-y-1">{rows(c.skills)}</ul>
        </div>
      )}
      <div>
        <Localized value={AN.byDifficulty} as="h4" className="text-xs font-bold uppercase tracking-wide text-slate-500" />
        <div className="mt-1 grid grid-cols-3 gap-2">
          {['EASY', 'MEDIUM', 'HARD'].map((b) => <Meter key={b} label={AN.difficulty[b]} value={c.difficulty[b].answered ? c.difficulty[b].accuracyPct : null} />)}
        </div>
      </div>
      {c.why.length > 0 && <WhyList why={c.why} />}
      <PlanSteps subject={subject} topic={c.topic} plan={c.plan} />
    </div>
  );
}

/* ------------------------------------------------------------------ Weak questions */

function WeakQuestions({ d }) {
  const withWrong = d.chapters.filter((c) => c.wrong > 0).sort((a, b) => (a.recentAccuracy ?? 100) - (b.recentAccuracy ?? 100));
  return (
    <>
      <section aria-labelledby="weak">
        <h2 id="weak" className="text-xl font-bold text-slate-900 dark:text-white"><Localized value={AN.weakTitle} /></h2>
        <Localized value={AN.weakSub} as="p" className="text-sm text-slate-600 dark:text-slate-300" />
        {!withWrong.length && <Localized value={AN.noWeak} as="p" className={`${card} mt-3`} />}
        <ul className="mt-3 grid gap-4 md:grid-cols-2">
          {withWrong.map((c) => (
            <li key={c.topic} className={card}>
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white"><Localized value={c.title} /></h3>
                <span className="text-lg font-extrabold tabular-nums text-slate-900 dark:text-white">{c.recentAccuracy == null ? '—' : `${c.recentAccuracy}%`}</span>
              </div>
              <Localized value={AN.chapterLine(c)} as="p" className="text-sm text-slate-600 dark:text-slate-300" />
              {c.repeatedMistakes > 0 && <p className="text-sm text-rose-700 dark:text-rose-300">🔁 {c.repeatedMistakes} <Localized value={AN.repeated} /></p>}
              <ul className="mt-2 space-y-1">
                {[...c.topics, ...c.skills].filter((s) => s.answered >= 3).sort((a, b) => a.accuracyPct - b.accuracyPct).slice(0, 5).map((s) => (
                  <li key={s.key} className="flex justify-between gap-2 text-sm">
                    <span>→ <Localized value={s.name} />{s.hidden && <span className="ml-1 text-rose-700 dark:text-rose-300">⚠</span>}</span>
                    <span className="font-semibold tabular-nums">{s.accuracyPct}%</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3"><SmartQuizButton subject={d.subject} topics={[c.topic]} count={10} variant="link" label={AN.startChapter} /></div>
            </li>
          ))}
        </ul>
      </section>
      {d.weakQuestions?.length > 0 && (
        <section aria-labelledby="repeated" className={card}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="repeated" className="text-lg font-bold text-slate-900 dark:text-white"><Localized value={AN.mostRepeated} /></h2>
            <Link to="/mistakes" className="text-sm font-semibold text-indigo-700 hover:underline dark:text-indigo-300"><Localized value={AN.openNotebook} /> →</Link>
          </div>
          <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
            {d.weakQuestions.map((q) => (
              <li key={q.questionId} className="py-3">
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                  <Localized value={q.title} />
                  <span className={`rounded px-1.5 ${q.repeated ? 'bg-rose-50 text-rose-800 dark:bg-rose-500/10 dark:text-rose-200' : 'bg-slate-100 dark:bg-slate-800'}`}><Localized value={AN.wrongTimes(q.wrongCount)} /></span>
                </div>
                {q.stem && <Localized value={q.stem} markdown as="div" className="mt-1 line-clamp-3 text-sm text-slate-800 dark:text-slate-100" />}
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ Skipped */

const REASONS = ['too_difficult', 'unsure', 'forgot_concept', 'time_pressure', 'did_not_understand', 'ran_out_of_time'];

function Skipped({ d, source, lang }) {
  const [own, setOwn] = useState(() => Object.fromEntries(d.skippedQuestions.map((q) => [q.questionId, q.reason])));
  const save = async (qid, reason) => {
    const prev = own[qid];
    setOwn((o) => ({ ...o, [qid]: reason }));
    try {
      await source.setSkipReason(qid, reason);
    } catch {
      setOwn((o) => ({ ...o, [qid]: prev }));
    }
  };
  const { chapters, patterns } = d.skips;
  return (
    <>
      <section aria-labelledby="skipped">
        <h2 id="skipped" className="text-xl font-bold text-slate-900 dark:text-white"><Localized value={AN.skippedTitle} /></h2>
        <Localized value={AN.skippedSub} as="p" className="max-w-3xl text-sm text-slate-600 dark:text-slate-300" />
        {patterns.length > 0 && (
          <ul className="mt-3 space-y-2">
            {patterns.map((p) => (
              <li key={p.topic} className="rounded-2xl bg-amber-50 p-4 text-amber-950 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-100 dark:ring-amber-500/30">
                <Localized value={AN.skipPattern(p)} as="p" className="font-semibold" />
                <Localized value={AN.skipAction(p.title)} as="p" className="text-sm" />
                <div className="mt-2 flex flex-wrap gap-3 text-sm">
                  <Link to={learnPaths.chapter(d.subject, p.topic)} className="font-semibold underline">📘 <Localized value={AN.step.read({ minutes: 15 })} /></Link>
                  <SmartQuizButton subject={d.subject} topics={[p.topic]} count={10} variant="link" label={AN.startChapter} />
                </div>
              </li>
            ))}
          </ul>
        )}
        {chapters.length > 0 && (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {chapters.map((c) => (
              <li key={c.topic} className={card}>
                <h3 className="font-bold text-slate-900 dark:text-white"><Localized value={c.title} /></h3>
                <Localized value={AN.skipChapterLine(c)} as="p" className="text-sm text-slate-600 dark:text-slate-300" />
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                  {['EASY', 'MEDIUM', 'HARD'].filter((b) => c.difficulty[b]).map((b) => `${textOf(AN.difficulty[b], lang)} ${c.difficulty[b]}`).join(' · ')}
                </p>
                {c.topReason && <p className="mt-1 text-xs text-slate-600 dark:text-slate-300"><Localized value={AN.likely} />: <Localized value={AN.reasons[c.topReason]} /></p>}
              </li>
            ))}
          </ul>
        )}
      </section>
      <section aria-labelledby="skip-list" className={card}>
        <h2 id="skip-list" className="sr-only"><Localized value={AN.skippedTitle} /></h2>
        {!d.skippedQuestions.length && <Localized value={AN.noSkips} as="p" className="text-slate-600 dark:text-slate-300" />}
        <ul className="divide-y divide-slate-100 dark:divide-slate-800">
          {d.skippedQuestions.map((q) => (
            <li key={q.questionId} className="py-3">
              <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400">
                <Localized value={q.title} />
                <span><Localized value={AN.skipTimes(q.times)} /></span>
                {q.timeBeforeSkipSec != null && <span><Localized value={AN.skipTime(q.timeBeforeSkipSec)} /></span>}
              </div>
              {q.stem && <Localized value={q.stem} markdown as="div" className="mt-1 line-clamp-3 text-sm text-slate-800 dark:text-slate-100" />}
              <label className="mt-2 flex flex-wrap items-center gap-2 text-sm">
                <span className="text-slate-600 dark:text-slate-300">
                  {own[q.questionId] ? <Localized value={AN.yourReason} /> : <><Localized value={AN.likely} />: <Localized value={AN.reasons[q.likelyReason]} className="font-semibold" /></>}
                </span>
                <select
                  aria-label={textOf(AN.setReason, lang)}
                  value={own[q.questionId] ?? ''}
                  onChange={(e) => save(q.questionId, e.target.value || null)}
                  className="min-h-11 rounded-lg bg-white px-2 ring-1 ring-slate-300 dark:bg-slate-900 dark:ring-slate-700"
                >
                  <option value="">{textOf(AN.setReason, lang)}</option>
                  {REASONS.map((r) => <option key={r} value={r}>{textOf(AN.reasons[r], lang)}</option>)}
                </select>
              </label>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

/* ------------------------------------------------------------------ Progress */

function Progress({ d }) {
  const m = d.month;
  return (
    <>
      <section aria-labelledby="improving" className={card}>
        <h2 id="improving" className="text-xl font-bold text-slate-900 dark:text-white"><Localized value={AN.improvingTitle} /></h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label={AN.questionsAttempted} value={m.attempted} sub={AN.thisMonth} />
          <Stat label={AN.accuracy} value={m.accuracyPct == null ? '—' : `${m.accuracyPct}%`} sub={AN.thisMonth} />
          <Stat label={AN.accuracy} value={m.lastMonth.accuracyPct == null ? '—' : `${m.lastMonth.accuracyPct}%`} sub={AN.lastMonth} />
          <Stat label={AN.questionsAttempted} value={m.lastMonth.attempted} sub={AN.lastMonth} />
        </div>
        {m.deltaPts != null && <Localized value={AN.improvement(m.deltaPts)} as="p" className={`mt-3 text-lg font-bold ${m.deltaPts >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`} />}
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {m.strongestImprovement && (
            <p className="text-sm">📈 <Localized value={AN.strongestImprovement} className="font-semibold" />: <Localized value={m.strongestImprovement.title} /> +{m.strongestImprovement.deltaPts}</p>
          )}
          {m.needsAttention && (
            <p className="text-sm">⚠️ <Localized value={AN.needsAttention} className="font-semibold" />: <Localized value={m.needsAttention.title} /> {m.needsAttention.deltaPts}</p>
          )}
        </div>
      </section>
      <section aria-labelledby="weekly" className={card}>
        <h2 id="weekly" className="text-lg font-bold text-slate-900 dark:text-white"><Localized value={AN.weekly} /></h2>
        <div className="mt-3"><WeeklyTrend weeks={d.trend.weeks} /></div>
        {d.trend.deltaPts != null ? (
          <Localized value={AN.overWindow(d.trend.firstAccuracy, d.trend.lastAccuracy, d.trend.deltaPts)} as="p" className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200" />
        ) : (
          <Localized value={AN.notEnough} as="p" className="mt-2 text-sm text-slate-500 dark:text-slate-400" />
        )}
      </section>
      {(d.improving.length > 0 || d.declining.length > 0) && (
        <div className="grid gap-4 md:grid-cols-2">
          {[['improvingList', d.improving, '📈'], ['decliningList', d.declining, '📉']].map(([k, list, icon]) => list.length > 0 && (
            <section key={k} className={card}>
              <h2 className="font-bold text-slate-900 dark:text-white"><span aria-hidden="true">{icon} </span><Localized value={AN[k]} /></h2>
              <ul className="mt-2 space-y-2">
                {list.map((c) => (
                  <li key={c.topic} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                    <span><Localized value={c.title} className="font-semibold" /> <Localized value={AN.fromTo(c.from, c.to)} /></span>
                    {k === 'decliningList' && <SmartQuizButton subject={d.subject} topics={[c.topic]} count={10} variant="link" label={AN.startChapter} />}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ Time */

function TimeTab({ d }) {
  const rows = d.chapters.filter((c) => c.time.totalSec > 0).sort((a, b) => b.time.totalSec - a.time.totalSec);
  const totals = ['readSec', 'practiceSec', 'reviseSec', 'mistakesSec'].map((k) => [k, d.chapters.reduce((a, c) => a + c.time[k], 0)]);
  return (
    <section aria-labelledby="time" className={card}>
      <h2 id="time" className="text-xl font-bold text-slate-900 dark:text-white"><Localized value={AN.timeTitle} /></h2>
      <Localized value={AN.timeSub} as="p" className="text-sm text-slate-600 dark:text-slate-300" />
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <Stat label={AN.studyTime} value={formatDuration(d.summary.totalSec)} />
        {totals.map(([k, v]) => <Stat key={k} label={AN.timeParts[k]} value={formatDuration(v)} />)}
      </div>
      <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
        {rows.map((c) => {
          const slow = c.time.avgSecPerQuestion != null && c.time.avgSecPerQuestion > c.time.targetSec * 1.3;
          return (
            <li key={c.topic} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
              <Localized value={c.title} className="font-semibold text-slate-900 dark:text-white" />
              <span className="text-slate-700 dark:text-slate-200"><Localized value={AN.timeToMastery(formatDuration(c.time.totalSec), c.mastery)} /></span>
              {c.time.avgSecPerQuestion != null && (
                <span className={`w-full text-xs ${slow ? 'font-semibold text-amber-800 dark:text-amber-300' : 'text-slate-500 dark:text-slate-400'}`}>
                  <Localized value={AN.perQuestion(c.time.avgSecPerQuestion, c.time.targetSec)} />
                  {slow && <> · <Localized value={AN.slow} /></>}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

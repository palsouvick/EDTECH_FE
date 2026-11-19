import { useMemo, useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';
import { useDataSource } from '../app/DataSourceContext';
import { useResource } from '../hooks/useResource';
import { SYLLABUS_MAP as MAP, TARGET_EXAM } from '../lib/targetExamCopy';
import { chapterLink } from '../lib/studyPlan';
import { subjectSlugFromCode } from '../lib/routes';
import { loginPath } from '../components/auth/AccountButton';
import { Localized } from '../components/topic-hub/Localized';
import PageShell from '../components/navigation/PageShell';
import { CardGridSkeleton, LoadError } from './funnel/FunnelLayout';

const card = 'rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6 dark:bg-slate-900 dark:ring-slate-800';
const chip = 'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ring-1';

function Name({ value, className }) {
  if (value && typeof value === 'object') return <Localized value={value} className={className} />;
  return <span className={className}>{value}</span>;
}

const VERDICT = {
  in: { label: MAP.verdictIn, tone: 'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30' },
  supplementary: { label: MAP.verdictSupplementary, tone: 'bg-sky-50 text-sky-800 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:ring-sky-500/30' },
  out: { label: MAP.verdictOut, tone: 'bg-rose-50 text-rose-800 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30' },
  unmapped: { label: MAP.verdictUnmapped, tone: 'bg-slate-50 text-slate-600 ring-slate-300 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-500/40' },
};
const BASIS = { official: MAP.basisOfficial, plan: MAP.basisPlan, plan_subject: MAP.basisPlan, plan_pattern: MAP.basisPlan, pyq: MAP.basisPyq, hardbank: MAP.basisHardbank };
const PRIORITY = {
  high: { label: MAP.priorityHigh, tone: 'bg-rose-50 text-rose-800 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:ring-rose-500/30' },
  medium: { label: MAP.priorityMedium, tone: 'bg-orange-50 text-orange-800 ring-orange-200 dark:bg-orange-500/10 dark:text-orange-300 dark:ring-orange-500/30' },
  low: { label: MAP.priorityLow, tone: 'bg-emerald-50 text-emerald-800 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/30' },
};
const STATUS = {
  not_started: { label: MAP.statusNotStarted, tone: 'bg-slate-50 text-slate-600 ring-slate-300 dark:bg-slate-500/10 dark:text-slate-300 dark:ring-slate-500/40' },
  in_progress: { label: MAP.statusInProgress, tone: 'bg-indigo-50 text-indigo-800 ring-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-300 dark:ring-indigo-500/30' },
  completed: { label: MAP.statusCompleted, tone: 'bg-teal-50 text-teal-800 ring-teal-200 dark:bg-teal-500/10 dark:text-teal-300 dark:ring-teal-500/30' },
  mastered: { label: MAP.statusMastered, tone: 'bg-violet-50 text-violet-800 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/30' },
};

function VerdictChip({ verdict, basis }) {
  const v = VERDICT[verdict] ?? VERDICT.unmapped;
  return (
    <span className={`${chip} ${v.tone}`}>
      <Localized value={v.label} />
      {basis && BASIS[basis] && (
        <span className="font-semibold opacity-75">· <Localized value={BASIS[basis]} /></span>
      )}
    </span>
  );
}

function CompletionBar({ completion }) {
  if (completion == null) return null;
  return (
    <span className="flex items-center gap-2">
      <span className="h-2 w-24 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" aria-hidden="true">
        <span className="block h-full rounded-full bg-indigo-500" style={{ width: `${completion}%` }} />
      </span>
      <span className="text-xs font-bold tabular-nums text-slate-700 dark:text-slate-200">{completion}%</span>
    </span>
  );
}

/**
 * /syllabus-map/:examCode — Feature F2. The full map for ANY catalogue exam:
 * subject -> chapter -> topic, each chapter carrying its syllabus verdict
 * (in / supplementary / out / not mapped yet, with the basis), its PYQ-based
 * priority where one can be measured, its weight where the system can state
 * one, and this student's status + mastery. Unmapped is shown, never guessed.
 */
export default function SyllabusMapPage() {
  const { examCode } = useParams();
  const { status, user } = useAuth();
  const source = useDataSource();
  const location = useLocation();
  const res = useResource(
    examCode && source.getSyllabusMap ? `syllabus-map:${examCode}` : null,
    () => source.getSyllabusMap(examCode),
  );
  const [verdictFilter, setVerdictFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [openTopics, setOpenTopics] = useState(() => new Set());

  const d = res.data;
  const subjects = useMemo(() => {
    if (!d) return [];
    return d.subjects
      .map((s) => ({
        ...s,
        chapters: s.chapters.filter((c) =>
          (verdictFilter === 'all' || c.syllabus === verdictFilter) &&
          (priorityFilter === 'all' || (priorityFilter === 'none' ? c.priority == null : c.priority === priorityFilter))),
      }))
      .filter((s) => s.chapters.length > 0);
  }, [d, verdictFilter, priorityFilter]);

  if (status === 'ready' && !user) return <Navigate to={loginPath(location)} replace />;

  const toggleTopics = (key) => setOpenTopics((prev) => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    return next;
  });

  const filterBtn = (active) =>
    `min-h-9 rounded-full px-3.5 text-sm font-semibold ring-1 ${active
      ? 'bg-indigo-600 text-white ring-indigo-600'
      : 'bg-white text-slate-700 ring-slate-300 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700'}`;

  return (
    <PageShell className="max-w-5xl pb-16 pt-6 sm:pt-10">
      <header>
        <Localized value={MAP.title} as="h1" className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white" />
        {d ? (
          <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
            <Name value={d.exam.name} />
            <span className="ml-2 text-sm font-semibold text-slate-500 dark:text-slate-400"><Name value={d.exam.categoryName} /></span>
            {d.exam.isTarget && (
              <span className="ml-3 rounded-full bg-indigo-100 px-3 py-1 text-sm font-bold text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-300">
                <Localized value={MAP.yourTarget} />
              </span>
            )}
          </p>
        ) : (
          <Localized value={MAP.sub} as="p" className="mt-2 text-slate-600 dark:text-slate-300" />
        )}
        {d && !d.exam.isTarget && (
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            <Localized value={MAP.notYourTarget} />{' '}
            <Link to="/choose-exam" className="font-semibold text-indigo-700 underline dark:text-indigo-300">
              <Localized value={MAP.changeTarget} />
            </Link>
          </p>
        )}
        {d?.pattern && (
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            <Name value={d.pattern.stageName} className="font-semibold text-slate-900 dark:text-white" />
            {' · '}
            <Localized value={TARGET_EXAM.questions(d.pattern.totalQuestions)} />
            {' · '}
            {d.pattern.totalMarks} marks
          </p>
        )}
        {d && (
          <p className="mt-3 text-sm font-bold text-indigo-700 dark:text-indigo-300">
            <Localized value={MAP.coverageLine(d.coverage.chapters)} />
          </p>
        )}
      </header>

      {res.status === 'error' ? (
        <div className="mt-6"><LoadError error={res.error} onRetry={res.retry} /></div>
      ) : !d ? (
        <div className="mt-6"><CardGridSkeleton count={4} /></div>
      ) : (
        <div className="mt-6 space-y-5">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Syllabus filters">
            {[['all', MAP.filterAll], ['in', MAP.verdictIn], ['supplementary', MAP.verdictSupplementary], ['out', MAP.verdictOut], ['unmapped', MAP.verdictUnmapped]].map(([key, label]) => (
              <button key={key} type="button" className={filterBtn(verdictFilter === key)} onClick={() => setVerdictFilter(key)}>
                <Localized value={label} />
              </button>
            ))}
            <span className="mx-1 hidden h-6 w-px bg-slate-200 sm:block dark:bg-slate-700" aria-hidden="true" />
            {[['all', MAP.filterAll], ['high', MAP.priorityHigh], ['medium', MAP.priorityMedium], ['low', MAP.priorityLow], ['none', MAP.priorityNone]].map(([key, label]) => (
              <button key={key} type="button" className={filterBtn(priorityFilter === key)} onClick={() => setPriorityFilter(key)}>
                <Localized value={label} />
              </button>
            ))}
          </div>

          {subjects.length === 0 && (
            <p className="text-sm text-slate-600 dark:text-slate-300"><Localized value={MAP.noChaptersMatch} /></p>
          )}

          {subjects.map((s) => (
            <section key={s.subject} className={card} aria-labelledby={`map-subject-${s.subject}`}>
              <div className="flex items-baseline justify-between gap-3">
                <h2 id={`map-subject-${s.subject}`} className="text-lg font-bold text-slate-900 dark:text-white">
                  <Name value={s.name} />
                </h2>
                <span className="text-sm font-bold tabular-nums text-slate-700 dark:text-slate-200">
                  {s.weight != null ? `${s.weight}%` : ''}
                </span>
              </div>
              {s.inPattern === false && (
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400"><Localized value={MAP.subjectNotInPattern} /></p>
              )}
              {s.note && <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{s.note}</p>}
              <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
                {s.chapters.map((c) => {
                  const key = `${s.subject}.${c.topic}`;
                  const open = openTopics.has(key);
                  const lessonLink = c.hasLesson && (s.subject === 'gs' || subjectSlugFromCode(s.subject)) ? chapterLink(s.subject, c.topic) : null;
                  return (
                    <li key={c.topic} className="py-3">
                      <div className="flex items-start justify-between gap-3">
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold text-slate-900 dark:text-white">
                            {lessonLink ? (
                              <Link to={lessonLink} className="hover:underline"><Name value={c.name} /></Link>
                            ) : (
                              <Name value={c.name} />
                            )}
                          </span>
                          <span className="mt-1 flex flex-wrap items-center gap-1.5">
                            <VerdictChip verdict={c.syllabus} basis={c.syllabusBasis} />
                            {c.priority && (
                              <span className={`${chip} ${PRIORITY[c.priority].tone}`}>
                                <Localized value={PRIORITY[c.priority].label} />
                              </span>
                            )}
                            <span className={`${chip} ${STATUS[c.status].tone}`}>
                              <Localized value={STATUS[c.status].label} />
                            </span>
                            {c.mastery?.answers > 0 && c.mastery.accuracyPct != null && (
                              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                                <Localized value={MAP.mastery} />: <Localized value={MAP.masteryAccuracy(c.mastery.accuracyPct)} />
                              </span>
                            )}
                          </span>
                          <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                            <Localized value={TARGET_EXAM.pyqCount(c.pyqCount ?? 0)} />
                            {' · '}
                            <Localized value={TARGET_EXAM.answered(c.answered ?? 0, c.bankCount ?? 0)} />
                            {c.hasLesson && (
                              <>
                                {' · '}
                                <Localized value={TARGET_EXAM.hasLesson} />
                              </>
                            )}
                          </span>
                          {c.syllabusNote && (
                            <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                              <Name value={c.syllabusNote} />
                            </span>
                          )}
                        </span>
                        <span className="shrink-0 text-right">
                          <span className="text-sm font-bold tabular-nums text-slate-700 dark:text-slate-200">
                            {c.weight != null ? `${c.weight}%` : ''}
                          </span>
                          <span className="mt-1 block"><CompletionBar completion={c.completion} /></span>
                        </span>
                      </div>
                      {c.subtopics?.length > 0 && (
                        <div className="mt-2">
                          <button
                            type="button"
                            className="text-xs font-bold text-indigo-700 underline dark:text-indigo-300"
                            onClick={() => toggleTopics(key)}
                            aria-expanded={open}
                          >
                            <Localized value={open ? MAP.hideTopics : MAP.showTopics} /> · <Localized value={MAP.topics(c.subtopics.length)} />
                          </button>
                          {open && (
                            <ul className="mt-2 space-y-1.5 border-l-2 border-slate-100 pl-3 dark:border-slate-800">
                              {c.subtopics.map((u) => (
                                <li key={u.code} className="flex items-center justify-between gap-3 text-sm">
                                  <Name value={u.name} className="text-slate-700 dark:text-slate-200" />
                                  <VerdictChip verdict={u.syllabus} basis={null} />
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}

          {d.dataGaps?.length > 0 && (
            <section className={card} aria-labelledby="map-gaps-title">
              <h2 id="map-gaps-title" className="text-lg font-bold text-slate-900 dark:text-white">
                <Localized value={MAP.dataGapsTitle} />
              </h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
                {d.dataGaps.map((g) => <li key={g}>{g}</li>)}
              </ul>
            </section>
          )}
        </div>
      )}
    </PageShell>
  );
}

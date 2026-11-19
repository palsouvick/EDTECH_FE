import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';
import { useDataSource } from '../app/DataSourceContext';
import { useResource } from '../hooks/useResource';
import { TARGET_EXAM, SYLLABUS_MAP } from '../lib/targetExamCopy';
import { DIAG } from '../lib/diagnosticCopy';
import { chapterLink } from '../lib/studyPlan';
import { subjectSlugFromCode } from '../lib/routes';
import { loginPath } from '../components/auth/AccountButton';
import { Localized } from '../components/topic-hub/Localized';
import PageShell from '../components/navigation/PageShell';
import { CardGridSkeleton, LoadError } from './funnel/FunnelLayout';

const card = 'rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6 dark:bg-slate-900 dark:ring-slate-800';

/** A localized { en, bn, hi } value, or a plain string. */
function Name({ value, className }) {
  if (value && typeof value === 'object') return <Localized value={value} className={className} />;
  return <span className={className}>{value}</span>;
}

function Weight({ weight, weightSource }) {
  if (weight == null) return <Localized value={TARGET_EXAM.noWeight} className="text-xs text-slate-500 dark:text-slate-400" />;
  return (
    <span className="text-sm font-bold tabular-nums text-slate-700 dark:text-slate-200">
      {weight}%{weightSource === 'pyq' ? ' · PYQ' : ''}
    </span>
  );
}

function CompletionBar({ completion }) {
  if (completion == null) {
    return <Localized value={TARGET_EXAM.noData} className="text-xs text-slate-500 dark:text-slate-400" />;
  }
  return (
    <span className="flex items-center gap-2">
      <span className="h-2 w-24 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" aria-hidden="true">
        <span className="block h-full rounded-full bg-indigo-500" style={{ width: `${completion}%` }} />
      </span>
      <span className="text-xs font-bold tabular-nums text-slate-700 dark:text-slate-200">
        <Localized value={TARGET_EXAM.complete(completion)} />
      </span>
    </span>
  );
}

/**
 * /my-syllabus: "these are your chapters, weighted like this" for the target
 * exam — subjects with weights, chapters with weight + completion + PYQ
 * counts, the exam pattern, the readiness breakdown and the countdown.
 * Weights that are null say so honestly instead of inventing a number.
 * No target exam set: off to /choose-exam.
 */
export default function MySyllabusPage() {
  const { status, user } = useAuth();
  const source = useDataSource();
  const location = useLocation();
  const target = user?.targetExam ?? null;
  const res = useResource(
    target && source.getTargetExamSyllabus ? `target-exam:syllabus:${target.code}` : null,
    () => source.getTargetExamSyllabus(),
  );

  if (status === 'ready' && !user) return <Navigate to={loginPath(location)} replace />;
  if (status === 'ready' && user && !target) return <Navigate to="/choose-exam?next=%2Fmy-syllabus" replace />;
  // The server agrees there is no target exam (422 NO_TARGET_EXAM): choose one.
  if (res.status === 'error' && res.error?.code === 'NO_TARGET_EXAM') return <Navigate to="/choose-exam?next=%2Fmy-syllabus" replace />;

  const d = res.data;
  const chapters = d?.subjects.flatMap((s) => s.chapters) ?? [];
  const withCompletion = chapters.filter((c) => c.completion != null);
  const overall = withCompletion.length ? Math.round(withCompletion.reduce((a, c) => a + c.completion, 0) / withCompletion.length) : null;
  const countdown = d?.countdown;
  const readiness = d?.readiness;

  return (
    <PageShell className="max-w-5xl pb-16 pt-6 sm:pt-10">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Localized value={TARGET_EXAM.syllabusTitle} as="h1" className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white" />
          {d ? (
            <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">
              <Name value={d.exam.name} />
              {countdown ? (
                <span className="ml-3 rounded-full bg-indigo-100 px-3 py-1 text-sm font-bold text-indigo-800 dark:bg-indigo-500/15 dark:text-indigo-300">
                  {countdown.daysLeft === 0 ? <Localized value={TARGET_EXAM.examToday} /> : <Localized value={TARGET_EXAM.daysLeft(countdown.daysLeft)} />}
                </span>
              ) : (
                <span className="ml-3 rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  <Localized value={TARGET_EXAM.notAnnounced} />
                </span>
              )}
            </p>
          ) : (
            <Localized value={TARGET_EXAM.syllabusSub} as="p" className="mt-2 text-slate-600 dark:text-slate-300" />
          )}
        </div>
        <Link to="/choose-exam" className="inline-flex min-h-10 items-center rounded-xl px-4 text-sm font-semibold text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-50 dark:text-indigo-300 dark:ring-indigo-500/40">
          <Localized value={TARGET_EXAM.change} />
        </Link>
      </header>

      {res.status === 'error' ? (
        <div className="mt-6"><LoadError error={res.error} onRetry={res.retry} /></div>
      ) : !d ? (
        <div className="mt-6"><CardGridSkeleton count={4} /></div>
      ) : (
        <div className="mt-6 space-y-5">
          {d.exam.planRoute && (
            <Link to={d.exam.planRoute} className="block rounded-2xl bg-indigo-600 p-4 text-white shadow-sm hover:bg-indigo-500 sm:p-5">
              <span className="block text-lg font-bold">
                <Localized value={TARGET_EXAM.openPlan} /> →
              </span>
            </Link>
          )}

          <Link to={`/syllabus-map/${d.exam.code}`} className="block rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 hover:ring-indigo-300 sm:p-5 dark:bg-slate-900 dark:ring-slate-800">
            <span className="block text-lg font-bold text-slate-900 dark:text-white">
              <Localized value={SYLLABUS_MAP.openMap} /> →
            </span>
            <span className="mt-0.5 block text-sm text-slate-600 dark:text-slate-300">
              <Localized value={SYLLABUS_MAP.sub} />
            </span>
          </Link>

          {/* F7: the optional starting-level check is always reachable here. */}
          <Link to="/starting-level" className="block rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 hover:ring-indigo-300 sm:p-5 dark:bg-slate-900 dark:ring-slate-800">
            <span className="block text-lg font-bold text-slate-900 dark:text-white">
              <span aria-hidden="true">🧭 </span>
              <Localized value={DIAG.takeIt} /> →
            </span>
          </Link>

          {/* Readiness */}
          {readiness && (
            <section className={card} aria-labelledby="readiness-title">
              <h2 id="readiness-title" className="text-lg font-bold text-slate-900 dark:text-white">
                <Localized value={TARGET_EXAM.readinessLabel} />
              </h2>
              <p className="mt-2 text-4xl font-extrabold tabular-nums text-slate-900 dark:text-white">
                {readiness.score != null ? `${readiness.score}%` : <Localized value={TARGET_EXAM.noData} />}
              </p>
              <ul className="mt-3 space-y-2">
                {[
                  [TARGET_EXAM.coverage, readiness.components?.coverage],
                  [TARGET_EXAM.masteryComponent, readiness.components?.mastery ?? readiness.components?.accuracy],
                  [TARGET_EXAM.pyq, readiness.components?.pyq],
                ].map(([label, value]) => (
                  <li key={label.en} className="flex items-center justify-between gap-3 text-sm">
                    <Localized value={label} className="text-slate-600 dark:text-slate-300" />
                    <span className="font-bold tabular-nums text-slate-900 dark:text-white">
                      {value != null ? `${value}%` : <Localized value={TARGET_EXAM.noData} />}
                    </span>
                  </li>
                ))}
              </ul>
              {readiness.note && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{readiness.note}</p>}
            </section>
          )}

          {/* Exam pattern */}
          <section className={card} aria-labelledby="pattern-title">
            <h2 id="pattern-title" className="text-lg font-bold text-slate-900 dark:text-white">
              <Localized value={TARGET_EXAM.patternTitle} />
            </h2>
            {d.pattern ? (
              <>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  <Name value={d.pattern.stageName} className="font-semibold text-slate-900 dark:text-white" />
                  {' · '}
                  <Localized value={TARGET_EXAM.duration(d.pattern.durationMin)} />
                  {' · '}
                  <Localized value={d.pattern.negative ? TARGET_EXAM.negative(d.pattern.negative) : TARGET_EXAM.noNegative} />
                </p>
                <ul className="mt-3 space-y-2">
                  {d.pattern.sections.map((s) => (
                    <li key={s.subject} className="flex items-center justify-between gap-3 text-sm">
                      <Name value={s.name} className="text-slate-700 dark:text-slate-200" />
                      <span className="shrink-0 tabular-nums text-slate-500 dark:text-slate-400">
                        <Localized value={TARGET_EXAM.questions(s.questions)} />
                        {' · '}
                        {s.marks} {s.marks === 1 ? 'mark' : 'marks'}
                        {s.weight != null && ` · ${s.weight}%`}
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <Localized value={TARGET_EXAM.noPattern} as="p" className="mt-1 text-sm text-slate-600 dark:text-slate-300" />
            )}
          </section>

          {/* Subjects and chapters */}
          {overall != null && (
            <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
              <Localized value={TARGET_EXAM.syllabusProgress(overall)} />
            </p>
          )}
          {d.subjects.map((s) => (
            <section key={s.subject} className={card} aria-labelledby={`subject-${s.subject}`}>
              <div className="flex items-baseline justify-between gap-3">
                <h2 id={`subject-${s.subject}`} className="text-lg font-bold text-slate-900 dark:text-white">
                  <Name value={s.name} />
                </h2>
                <Weight weight={s.weight} weightSource={s.weightSource} />
              </div>
              <ul className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
                {s.chapters.map((c) => {
                  const body = (
                    <>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-slate-900 dark:text-white">
                          <Name value={c.name} />
                        </span>
                        <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
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
                      </span>
                      <span className="shrink-0 text-right">
                        <Weight weight={c.weight} weightSource={c.weightSource} />
                        <span className="mt-1 block"><CompletionBar completion={c.completion} /></span>
                      </span>
                    </>
                  );
                  // Only link a chapter when its lesson page exists: Learn covers
                  // quant/english/gs; other syllabus subjects have no chapter page (yet).
                  const lessonLink = c.hasLesson && (s.subject === 'gs' || subjectSlugFromCode(s.subject)) ? chapterLink(s.subject, c.topic) : null;
                  return (
                    <li key={c.topic} className="py-3">
                      {lessonLink ? (
                        <Link to={lessonLink} className="flex items-start justify-between gap-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                          {body}
                        </Link>
                      ) : (
                        <div className="flex items-start justify-between gap-3">{body}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}
    </PageShell>
  );
}

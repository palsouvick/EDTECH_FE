import { Link, Navigate, useParams } from 'react-router-dom';
import { useDataSource } from '../../app/DataSourceContext';
import { useLanguagePreference } from '../../hooks/useLanguagePreference';
import { useResource } from '../../hooks/useResource';
import { FUNNEL, pyqsCount, questionsCount } from '../../lib/i18n';
import { categoryFromSlug, codeFromSlug, paths } from '../../lib/routes';
import { Localized } from '../../components/topic-hub/Localized';
import FunnelLayout, { CardGridSkeleton, LoadError } from './FunnelLayout';

const LEVELS = { EASY: 1, MODERATE: 2, HARD: 3 };
const LEVEL_COLOR = { EASY: 'bg-emerald-500', MODERATE: 'bg-amber-500', HARD: 'bg-rose-500' };

/** ●●○ Moderate. Three dots read at a glance; the word makes it unambiguous. */
function DifficultyBadge({ level }) {
  const n = LEVELS[level] ?? 0;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">
      <span aria-hidden="true" className="flex gap-0.5">
        {[1, 2, 3].map((i) => (
          <span key={i} className={`size-1.5 rounded-full ${i <= n ? LEVEL_COLOR[level] : 'bg-slate-200 dark:bg-slate-700'}`} />
        ))}
      </span>
      <Localized value={level ? FUNNEL[level] : FUNNEL.difficultyUnknown} />
    </span>
  );
}

/** Step 3: syllabus topics of the subject, each with difficulty, PYQ count and a CTA. */
export default function TopicList() {
  const params = useParams();
  const category = categoryFromSlug(params.category);
  const subject = codeFromSlug(params.subject);
  const source = useDataSource();
  const { lang } = useLanguagePreference();
  const res = useResource(
    category && subject ? `subject:${category}:${subject}:${lang}` : null,
    () => source.getSubject(category, subject, lang),
  );

  if (!category) return <Navigate to={paths.exams()} replace />;
  if (!subject || res.error?.status === 404) return <Navigate to={paths.category(category)} replace />;

  const data = res.data ?? res.staleData;

  return (
    <FunnelLayout
      step={3}
      crumbs={[
        { key: 'exams', name: FUNNEL.exams, to: paths.exams() },
        { key: 'category', name: data?.category.name ?? { en: category }, to: paths.category(category) },
        { key: 'subject', name: data?.subject.name ?? { en: subject } },
      ]}
      title={data?.subject.name ?? FUNNEL.chooseTopic}
      subtitle={<Localized value={FUNNEL.chooseTopic} />}
    >
      {res.status === 'error' && !data ? (
        <LoadError error={res.error} onRetry={res.retry} />
      ) : !data ? (
        <CardGridSkeleton count={6} height="h-40" />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-busy={res.status === 'loading'}>
          {data.topics.map((t) => {
            const available = t.questionCount > 0 || t.hasSummary;
            return (
              <li key={t.code} className="flex flex-col rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
                <Localized value={t.name} as="h2" className="text-[17px] font-semibold leading-snug text-slate-900 dark:text-white" />
                <div className="mt-2">
                  <DifficultyBadge level={t.difficulty} />
                </div>
                <dl className={`mt-3 flex gap-4 text-sm tabular-nums ${res.status === 'loading' ? 'opacity-50' : ''}`}>
                  <div>
                    <dt className="sr-only">PYQs</dt>
                    <dd className="flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-300">
                      <span className="rounded bg-amber-100 px-1 text-[10px] font-bold uppercase text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">PYQ</span>
                      <Localized value={pyqsCount(t.pyqCount)} />
                    </dd>
                  </div>
                  <div>
                    <dt className="sr-only">Questions</dt>
                    <dd className="text-slate-500 dark:text-slate-400">
                      <Localized value={questionsCount(t.questionCount)} />
                    </dd>
                  </div>
                </dl>
                <div className="mt-auto pt-4">
                  {available ? (
                    <Link
                      to={paths.topic(category, subject, t.code)}
                      className="flex min-h-11 items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                    >
                      <Localized value={FUNNEL.studyPractice} />
                      <span className="sr-only">
                        : <Localized value={t.name} />
                      </span>
                    </Link>
                  ) : (
                    <span
                      aria-disabled="true"
                      className="flex min-h-11 items-center justify-center rounded-xl bg-slate-100 px-4 text-sm font-semibold text-slate-400 dark:bg-slate-800 dark:text-slate-500"
                    >
                      <Localized value={FUNNEL.comingSoon} />
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </FunnelLayout>
  );
}

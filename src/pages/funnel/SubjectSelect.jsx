import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { BANK_TRACK } from '../../lib/homeCopy';
import { useDataSource } from '../../app/DataSourceContext';
import { useLanguagePreference } from '../../hooks/useLanguagePreference';
import { useResource } from '../../hooks/useResource';
import { FUNNEL, questionsCount, topicsCount } from '../../lib/i18n';
import { categoryFromSlug, paths } from '../../lib/routes';
import LanguageSwitcher from '../../components/topic-hub/LanguageSwitcher';
import { Localized } from '../../components/topic-hub/Localized';
import { ArrowRightIcon } from '../../components/topic-hub/icons';
import ExamInfoPanel from '../../components/exam-info/ExamInfoPanel';
import FunnelLayout, { CardGridSkeleton, LoadError } from './FunnelLayout';
import { CATEGORY_ACCENTS } from './CategorySelect';

/** Step 2: subjects of the chosen category + study language. */
export default function SubjectSelect() {
  const { category: categorySlug } = useParams();
  const category = categoryFromSlug(categorySlug);
  const source = useDataSource();
  const { lang } = useLanguagePreference();
  const [searchParams, setSearchParams] = useSearchParams();
  // Counts are per language, so switching language re-fetches; old counts stay visible meanwhile.
  const res = useResource(category ? `category:${category}:${lang}` : null, () => source.getCategory(category, lang));

  if (!category || res.error?.status === 404) return <Navigate to={paths.exams()} replace />;

  const data = res.data ?? res.staleData;
  const accent = CATEGORY_ACCENTS[category];
  const categoryName = data?.category.name ?? { en: category };

  // Banking: PO (officer) or Clerk, matched on the exam's code/name.
  const isBank = category === 'BANK';
  const track = ['po', 'clerk'].includes(searchParams.get('track')) ? searchParams.get('track') : 'all';
  const allExams = data?.category.exams ?? [];
  const isClerk = (e) => /clerk/i.test(`${e.code} ${e.name?.en ?? ''}`);
  const filtered = isBank && track !== 'all' ? allExams.filter((e) => (track === 'clerk') === isClerk(e)) : allExams;
  const exams = filtered.length ? filtered : allExams;
  const setTrack = (v) => {
    const next = new URLSearchParams(searchParams);
    next.delete('exam');
    if (v === 'all') next.delete('track');
    else next.set('track', v);
    setSearchParams(next, { replace: true });
  };

  return (
    <FunnelLayout
      step={2}
      wide
      crumbs={[
        { key: 'exams', name: FUNNEL.exams, to: paths.exams() },
        { key: 'category', name: categoryName },
      ]}
      title={FUNNEL.chooseSubject}
      subtitle={
        data && (
          <span className="flex flex-wrap items-center gap-1.5">
            <Localized value={data.category.name} className="font-semibold text-slate-800 dark:text-slate-100" />
            {exams.map((e) => (
              <span key={e.code} className={`rounded-md px-2 py-0.5 text-xs font-semibold ${accent.chip}`}>
                <Localized value={e.name} />
              </span>
            ))}
          </span>
        )
      }
    >
      {isBank && (
        <section aria-labelledby="bank-track" className="mb-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
          <h2 id="bank-track" className="text-sm font-semibold text-slate-900 dark:text-white">
            <Localized value={BANK_TRACK.title} />
          </h2>
          <div role="group" aria-labelledby="bank-track" className="mt-2 flex flex-wrap gap-2">
            {[['all', BANK_TRACK.all], ['po', BANK_TRACK.po], ['clerk', BANK_TRACK.clerk]].map(([k, label]) => (
              <button
                key={k}
                type="button"
                aria-pressed={track === k}
                onClick={() => setTrack(k)}
                className={`min-h-10 rounded-full px-5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-emerald-500 ${
                  track === k ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200'
                }`}
              >
                <Localized value={label} />
              </button>
            ))}
          </div>
          <Localized value={BANK_TRACK.hint} as="p" className="mt-2 text-xs text-slate-500 dark:text-slate-400" />
        </section>
      )}

      <section aria-labelledby="study-language" className="mb-6 rounded-2xl bg-white p-4 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <h2 id="study-language" className="text-sm font-semibold text-slate-900 dark:text-white">
            <Localized value={FUNNEL.studyLanguage} />
          </h2>
          <LanguageSwitcher className="[&_button]:min-h-10 [&_button]:px-4 [&_button]:text-sm" />
        </div>
        <Localized value={FUNNEL.languageHint} as="p" className="mt-2 text-xs text-slate-500 dark:text-slate-400" />
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,26rem)]">
        <div className="min-w-0">
          {res.status === 'error' && !data ? (
            <LoadError error={res.error} onRetry={res.retry} />
          ) : !data ? (
            <CardGridSkeleton count={4} />
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2" aria-busy={res.status === 'loading'}>
              {data.subjects.map((s) => (
                <li key={s.code}>
                  <Link
                    to={paths.subject(category, s.code)}
                    className={`group flex h-full items-center gap-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition-shadow hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:bg-slate-900 dark:ring-slate-800 ${accent.ring}`}
                  >
                    <div className="min-w-0 flex-1">
                      <Localized value={s.name} as="h2" className="text-lg font-semibold text-slate-900 dark:text-white" />
                      <p className={`mt-1 flex flex-wrap gap-x-2 text-sm tabular-nums text-slate-500 transition-opacity dark:text-slate-400 ${res.status === 'loading' ? 'opacity-50' : ''}`}>
                        <Localized value={questionsCount(s.questionCount)} className="font-semibold text-slate-700 dark:text-slate-200" />
                        <span aria-hidden="true">·</span>
                        <Localized value={topicsCount(s.topicCount)} />
                      </p>
                    </div>
                    <ArrowRightIcon className="shrink-0 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-indigo-600 motion-reduce:transition-none dark:group-hover:text-indigo-400" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        {data && (
          <ExamInfoPanel
            category={category}
            exams={exams}
            website={data.category.website}
            subjects={data.subjects}
            className="lg:sticky lg:top-4"
          />
        )}
      </div>
    </FunnelLayout>
  );
}

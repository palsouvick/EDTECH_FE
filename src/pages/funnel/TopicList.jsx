import { useState } from 'react';
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
const ENGLISH_GROUPS = [
  { id: 'reading', title: 'Reading', topics: ['reading_comprehension'] },
  { id: 'grammar', title: 'Grammar skills', topics: ['grammar'] },
  { id: 'formats', title: 'Question formats', topics: ['error_spotting', 'sentence_improvement', 'fill_blanks'] },
  { id: 'vocabulary', title: 'Vocabulary', topics: ['synonyms_antonyms', 'idioms_phrases', 'one_word_substitution'] },
];
const textOf = (value) => value?.en || value?.bn || value?.hi || '';

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
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
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
        <div className="space-y-5" aria-busy={res.status === 'loading'}>
          {category === 'WBPSC' && subject === 'english' && (
            <>
              <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-950 dark:border-indigo-900 dark:bg-indigo-950/40 dark:text-indigo-100">
                <p className="font-semibold">WBPSC English practice</p>
                <p className="mt-1 leading-relaxed">
                  Counts below are WBPSC-wide, not WBCS-only. WBCS and other WBPSC PYQs are separated. Topic-level official syllabus mapping is not yet verified; supplementary topics are clearly marked.
                </p>
              </div>
              <div className="grid gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 sm:grid-cols-2">
                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Search topics and subtopics
                  <input
                    type="search"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="e.g. tenses, vocabulary"
                    className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal dark:border-slate-700 dark:bg-slate-950"
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Content filter
                    <select value={filter} onChange={(event) => setFilter(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal dark:border-slate-700 dark:bg-slate-950">
                      <option value="all">All topics</option>
                      <option value="has_questions">Has questions</option>
                      <option value="has_wbcs_pyqs">Has verified WBCS PYQs</option>
                      <option value="supplementary">Supplementary practice</option>
                    </select>
                  </label>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Difficulty
                    <select value={difficultyFilter} onChange={(event) => setDifficultyFilter(event.target.value)} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 font-normal dark:border-slate-700 dark:bg-slate-950">
                      <option value="all">All levels</option>
                      <option value="EASY">Easy</option>
                      <option value="MODERATE">Moderate</option>
                      <option value="HARD">Hard</option>
                      <option value="unrated">Not rated</option>
                    </select>
                  </label>
                </div>
              </div>
            </>
          )}
          {(() => {
            const isWbpscEnglish = category === 'WBPSC' && subject === 'english';
            const query = isWbpscEnglish ? search.trim().toLocaleLowerCase() : '';
            const filteredTopics = data.topics.map((topic) => {
              const topicMatches = !query || textOf(topic.name).toLocaleLowerCase().includes(query);
              const matchingSubtopics = (topic.subtopics || []).filter((subtopic) => (
                !query
                || topicMatches
                || textOf(subtopic.name).toLocaleLowerCase().includes(query)
                || subtopic.code.includes(query.replaceAll(' ', '_'))
              ));
              return { ...topic, visibleSubtopics: matchingSubtopics };
            }).filter((topic) => {
              if (isWbpscEnglish && query && !textOf(topic.name).toLocaleLowerCase().includes(query) && topic.visibleSubtopics.length === 0) return false;
              if (isWbpscEnglish && filter === 'has_questions' && topic.questionCount === 0) return false;
              if (isWbpscEnglish && filter === 'has_wbcs_pyqs' && topic.wbcsPyqCount === 0) return false;
              if (isWbpscEnglish && filter === 'supplementary' && topic.syllabusStatus !== 'SUPPLEMENTARY' && !topic.visibleSubtopics.some((subtopic) => subtopic.syllabusStatus === 'SUPPLEMENTARY')) return false;
              if (isWbpscEnglish && difficultyFilter === 'unrated' && topic.difficulty) return false;
              if (isWbpscEnglish && ['EASY', 'MODERATE', 'HARD'].includes(difficultyFilter) && topic.difficulty !== difficultyFilter) return false;
              return true;
            });

            const groups = isWbpscEnglish
              ? ENGLISH_GROUPS.map((group) => ({ ...group, items: filteredTopics.filter((topic) => group.topics.includes(topic.code)) })).filter((group) => group.items.length)
              : [{ id: 'topics', title: '', items: filteredTopics }];

            return groups.length ? groups.map((group) => (
              <section key={group.id} aria-labelledby={`topic-group-${group.id}`}>
                {group.title && <h2 id={`topic-group-${group.id}`} className="mb-3 text-lg font-bold text-slate-900 dark:text-white">{group.title}</h2>}
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {group.items.map((t) => {
            const available = t.questionCount > 0 || t.hasSummary;
            return (
              <li key={t.code} className="flex flex-col rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <Localized value={t.name} as="h3" className="text-[17px] font-semibold leading-snug text-slate-900 dark:text-white" />
                  {isWbpscEnglish && (
                    <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${
                      t.syllabusStatus === 'SUPPLEMENTARY'
                        ? 'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                      {t.syllabusStatus === 'SUPPLEMENTARY' ? 'Supplementary' : 'Mapping unverified'}
                    </span>
                  )}
                </div>
                <div className="mt-2">
                  <DifficultyBadge level={t.difficulty} />
                </div>
                <dl className={`mt-3 grid grid-cols-2 gap-x-3 gap-y-2 text-sm tabular-nums ${res.status === 'loading' ? 'opacity-50' : ''}`}>
                  <div>
                    <dt className={isWbpscEnglish ? 'text-xs text-slate-500 dark:text-slate-400' : 'sr-only'}>{isWbpscEnglish ? 'WBPSC questions' : 'Verified PYQs'}</dt>
                    <dd className="flex items-center gap-1.5 font-semibold text-amber-700 dark:text-amber-300">
                      {!isWbpscEnglish && <span className="rounded bg-amber-100 px-1 text-[10px] font-bold uppercase text-amber-800 dark:bg-amber-500/15 dark:text-amber-300">PYQ</span>}
                      <Localized value={isWbpscEnglish ? questionsCount(t.questionCount) : pyqsCount(t.verifiedPyqCount ?? t.pyqCount)} />
                    </dd>
                  </div>
                  <div>
                    <dt className={isWbpscEnglish ? 'text-xs text-slate-500 dark:text-slate-400' : 'sr-only'}>{isWbpscEnglish ? 'Verified WBCS PYQs' : 'Questions'}</dt>
                    <dd className="text-slate-700 dark:text-slate-300">{isWbpscEnglish ? t.wbcsPyqCount || 0 : <Localized value={questionsCount(t.questionCount)} />}</dd>
                  </div>
                  {isWbpscEnglish && (
                    <>
                      <div><dt className="text-xs text-slate-500 dark:text-slate-400">Other WBPSC PYQs</dt><dd className="font-semibold text-slate-700 dark:text-slate-300">{t.otherWbpscPyqCount || 0}</dd></div>
                      <div><dt className="text-xs text-slate-500 dark:text-slate-400">Adapted / original / unclassified</dt><dd className="font-semibold text-slate-700 dark:text-slate-300">{t.adaptedPyqCount || 0} / {t.originalPracticeCount || 0} / {t.unclassifiedCount || 0}</dd></div>
                    </>
                  )}
                </dl>
                {isWbpscEnglish && t.visibleSubtopics.length > 0 && (
                  <details className="mt-4 rounded-xl bg-slate-50 p-3 dark:bg-slate-950">
                    <summary className="cursor-pointer text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {t.code === 'grammar' ? 'Grammar subtopics' : 'Practice subtopics'} ({t.visibleSubtopics.length})
                    </summary>
                    <ul className="mt-2 space-y-2">
                      {t.visibleSubtopics.map((subtopic) => (
                        <li key={subtopic.code} className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="text-slate-700 dark:text-slate-300">{textOf(subtopic.name)}</span>
                          <span className="flex items-center gap-2">
                            {subtopic.syllabusStatus === 'SUPPLEMENTARY' && <span className="rounded bg-violet-100 px-1.5 py-0.5 font-bold text-violet-800 dark:bg-violet-950 dark:text-violet-200">Supplementary</span>}
                            <span className="tabular-nums text-slate-500">{subtopic.questionCount} questions · {subtopic.verifiedPyqCount} verified PYQs</span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
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
              </section>
            )) : <p className="rounded-xl bg-white p-5 text-sm text-slate-500 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">No topics match your search and filters.</p>;
          })()}
        </div>
      )}
    </FunnelLayout>
  );
}

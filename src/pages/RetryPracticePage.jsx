import { useMemo } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useDataSource } from '../app/DataSourceContext';
import { useResource } from '../hooks/useResource';
import { ANALYTICS } from '../lib/i18n';
import { buildRetrySet, createStaticPracticeSource } from '../features/analytics/retryQuiz';
import PracticeArena from '../components/practice/PracticeArena';
import { Localized } from '../components/topic-hub/Localized';

/**
 * /mock/:sessionId/retry: a short practice round over the test's failed
 * questions (see buildRetrySet), in the normal Practice Arena so answers get
 * the same instant feedback, explanations and trap notes.
 */
export default function RetryPracticePage() {
  const { sessionId } = useParams();
  const source = useDataSource();
  const valid = /^[a-f\d]{24}$/i.test(sessionId ?? '');
  // Same key as the dashboard, so arriving from it is instant.
  const res = useResource(valid ? `analytics:${sessionId}` : null, () => source.getMockAnalytics(sessionId));
  const d = res.data;

  // Built once per visit: a fixed set and option order for this retry round.
  const retry = useMemo(() => (d ? buildRetrySet(d.review, d.topicBreakdown) : null), [d]);
  const practiceSource = useMemo(() => {
    if (!d || !retry?.questions.length) return null;
    // Verification, bookmarks and reports work exactly as in topic practice.
    const base = source.practiceSource({ category: d.category.code, subject: d.subject.code, topic: retry.questions[0].topic });
    return createStaticPracticeSource(retry.questions, base);
  }, [d, retry, source]);

  if (!valid || res.error?.status === 404) return <Navigate to="/exams" replace />;
  if (res.status === 'error' && !d) {
    return <p className="mx-auto mt-16 max-w-md px-4 text-center text-slate-600">{res.error?.message}</p>;
  }
  if (!d) return <div aria-busy="true" aria-label="Loading" className="mx-auto mt-10 h-64 max-w-3xl animate-pulse rounded-2xl bg-slate-200/70 px-4 dark:bg-slate-800/70" />;

  const back = (
    <Link to={`/mock/${sessionId}`} className="inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 dark:text-slate-200 dark:ring-slate-600 dark:hover:bg-slate-800">
      <Localized value={ANALYTICS.backToAnalysis} />
    </Link>
  );

  return (
    <main className="mx-auto min-h-dvh max-w-3xl px-4 pb-16 pt-6">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          <Localized value={ANALYTICS.retryTitle} />
        </h1>
        {back}
      </header>
      {practiceSource ? (
        <PracticeArena
          source={practiceSource}
          topicName={d.subject.name ?? { en: '' }}
          initialGoal={retry.questions.length}
          endScreen={
            <div className="arena-enter rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
              <Localized value={ANALYTICS.retryDone} as="p" className="text-lg font-bold text-slate-900 dark:text-white" />
              <div className="mt-5">{back}</div>
            </div>
          }
        />
      ) : (
        <Localized value={ANALYTICS.retryNone} as="p" className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-slate-500 dark:border-slate-700" />
      )}
    </main>
  );
}

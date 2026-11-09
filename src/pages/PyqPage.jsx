import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDataSource } from '../app/DataSourceContext';
import { useResource } from '../hooks/useResource';
import { PYQ, PYQ_BASIS, basisNotes } from '../lib/pyqCopy';
import PageShell from '../components/navigation/PageShell';
import PracticeArena from '../components/practice/PracticeArena';
import { Localized } from '../components/topic-hub/Localized';
import { ArrowRightIcon } from '../components/topic-hub/icons';
import { CardGridSkeleton, LoadError } from './funnel/FunnelLayout';
import PriorityBadge, { PriorityLegend } from '../components/priority/PriorityBadge';

// The Commission's own list of published papers.
const WBPSC_PYQ_PAGE = 'https://psc.wb.gov.in/previous_year_question_paper.jsp';

const linkCls = 'font-semibold text-indigo-700 underline underline-offset-2 hover:text-indigo-500 dark:text-indigo-300';
const practiseCls =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500';

function BasisChip({ basis }) {
  return (
    <span title={basis.hint.en} className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${basis.tone}`}>
      <Localized value={basis.label} />
    </span>
  );
}

function PaperCard({ exam, paper, onPractise }) {
  const notes = basisNotes(paper);
  return (
    <article className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">
        {exam.name} {paper.year}
      </h3>
      <Localized value={PYQ.questions(paper.count)} as="p" className="mt-1 text-sm text-slate-600 dark:text-slate-300" />
      <div className="mt-3 flex flex-wrap gap-2">
        {notes.length ? notes.map((n) => <BasisChip key={n.label.en} basis={n} />) : <BasisChip basis={PYQ_BASIS.OFFICIAL_KEY} />}
      </div>
      <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <a href={paper.paperUrl} target="_blank" rel="noopener noreferrer" className={linkCls}>
          <Localized value={PYQ.paper} />
        </a>
        {paper.answerKeyUrl ? (
          <a href={paper.answerKeyUrl} target="_blank" rel="noopener noreferrer" className={linkCls}>
            <Localized value={PYQ.answerKey} />
          </a>
        ) : (
          <Localized value={PYQ.noKey} className="text-slate-500 dark:text-slate-400" />
        )}
      </p>
      <div className="mt-auto pt-4">
        <button type="button" onClick={onPractise} className={`${practiseCls} w-full`} aria-label={`Practise ${exam.name} ${paper.year}`}>
          <Localized value={PYQ.practise} />
          <ArrowRightIcon />
        </button>
      </div>
    </article>
  );
}

function TopicSets({ topics, onPractise }) {
  const subjects = useMemo(() => {
    const seen = new Map();
    for (const t of topics) if (!seen.has(t.subject)) seen.set(t.subject, t.subjectName);
    return [...seen.entries()];
  }, [topics]);
  const [subject, setSubject] = useState(() => (subjects.some(([s]) => s === 'gs') ? 'gs' : subjects[0]?.[0]));
  const shown = topics.filter((t) => t.subject === subject);

  return (
    <>
      <div role="group" aria-label="Subject" className="mt-4 flex flex-wrap gap-2">
        {subjects.map(([code, name]) => (
          <button
            key={code}
            type="button"
            aria-pressed={code === subject}
            onClick={() => setSubject(code)}
            className={`min-h-10 rounded-full px-4 text-sm font-semibold ring-1 ${code === subject ? 'bg-indigo-600 text-white ring-indigo-600' : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-200 dark:ring-slate-700'}`}
          >
            <Localized value={name} />
          </button>
        ))}
      </div>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((t) => (
          <li key={`${t.subject}.${t.topic}`} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-2">
              <Localized value={t.name} as="h3" className="font-bold text-slate-900 dark:text-white" />
              <PriorityBadge subject={t.subject} topics={[t.topic]} />
            </div>
            <Localized value={PYQ.questions(t.count)} as="p" className="mt-0.5 text-sm text-slate-600 dark:text-slate-300" />
            <p className="mt-2 flex flex-wrap gap-1 text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
              {Object.entries(t.byYear)
                .sort(([a], [b]) => b - a)
                .map(([y, n]) => (
                  <span key={y} className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800">
                    {y}: {n}
                  </span>
                ))}
            </p>
            <div className="mt-auto pt-3">
              <button type="button" onClick={() => onPractise(t)} className={practiseCls} aria-label={`Practise ${t.name.en}`}>
                <Localized value={PYQ.practise} />
                <ArrowRightIcon />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

/**
 * /pyq: previous-year questions by paper (year-wise) or by chapter across years, practised
 * one at a time in the Practice Arena (answer and explanation after each question). Every
 * paper says where its text and answers come from (official key, cross-checked, unofficial copy).
 */
export default function PyqPage() {
  const source = useDataSource();
  const filters = useResource('pyq:filters', () => source.getPyqFilters());
  const [params] = useSearchParams();
  // /pyq?exam=…&year=… (from the study plan) opens that paper straight away.
  const [running, setRunning] = useState(() => {
    const exam = params.get('exam');
    const year = Number(params.get('year'));
    if (exam && Number.isInteger(year) && year > 1990) return { title: { en: `${exam} ${year}` }, filters: { exam, year } };
    // /pyq?subject=…&topic=… (from a Learn chapter's PYQ level) opens that chapter's set.
    const subject = params.get('subject');
    const topic = params.get('topic');
    return subject && topic && /^[a-z_]+$/.test(subject + topic) ? { title: { en: topic.replace(/_/g, ' ') }, filters: { subject, topic } } : null;
  }); // { title, filters }
  const practiceSource = useMemo(() => (running ? source.pyqPracticeSource(running.filters) : null), [running, source]);

  const data = filters.data;
  // A chapter opened from a link (/pyq?subject=…&topic=…) that has no past questions yet:
  // say so instead of starting an empty set, which would look "finished" at 0 answered.
  const linkedTopic = running?.filters.topic && data ? data.topics.find((t) => t.subject === running.filters.subject && t.topic === running.filters.topic) : undefined;
  const noPyqs = Boolean(running?.filters.topic && data && !(linkedTopic?.count > 0));
  const paperCount = data?.exams.reduce((a, e) => a + e.papers.length, 0) ?? 0;
  const questionCount = data?.exams.reduce((a, e) => a + e.count, 0) ?? 0;

  const start = (title, f) => {
    setRunning({ title, filters: f });
    window.scrollTo?.({ top: 0 });
  };

  return (
    <PageShell className="max-w-5xl pb-16 pt-6 sm:pt-8">
      <header>
        <Localized value={PYQ.pageTitle} as="h1" className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white" />
        <Localized value={PYQ.heroSub} as="p" className="mt-2 max-w-3xl text-slate-600 dark:text-slate-300" />
        {data && paperCount > 0 && <Localized value={PYQ.totals(questionCount, paperCount)} as="p" className="mt-2 text-sm font-bold text-indigo-700 dark:text-indigo-300" />}
      </header>

      {filters.status === 'loading' && <div className="mt-8"><CardGridSkeleton count={6} /></div>}
      {filters.status === 'error' && <div className="mt-8"><LoadError error={filters.error} onRetry={filters.retry} /></div>}

      {running && noPyqs && (
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900">
          <Localized value={PYQ.noTopicTitle} as="p" className="text-lg font-bold text-slate-900 dark:text-white" />
          <Localized value={PYQ.noTopicBody} as="p" className="mt-1 text-sm text-slate-600 dark:text-slate-300" />
          <button type="button" onClick={() => setRunning(null)} className={`${practiseCls} mt-4`}>
            <Localized value={PYQ.back} />
          </button>
        </div>
      )}

      {running && practiceSource && !noPyqs && (!running.filters.topic || data) && (
        <section aria-label="Practice" className="mt-6">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <button type="button" onClick={() => setRunning(null)} className="inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-semibold text-indigo-700 ring-1 ring-slate-200 hover:bg-indigo-50 dark:text-indigo-300 dark:ring-slate-700">
              ← <Localized value={PYQ.back} />
            </button>
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              <Localized value={PYQ.practising} />: <Localized value={linkedTopic?.name ?? running.title} />
            </p>
          </div>
          <PracticeArena
            key={JSON.stringify(running.filters)}
            source={practiceSource}
            topicName={linkedTopic?.name ?? running.title}
            endScreen={
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center dark:border-slate-800 dark:bg-slate-900">
                <Localized value={PYQ.endTitle} as="p" className="text-lg font-bold text-slate-900 dark:text-white" />
                <Localized value={PYQ.endBody} as="p" className="mt-1 text-sm text-slate-600 dark:text-slate-300" />
                <button type="button" onClick={() => setRunning(null)} className={`${practiseCls} mt-4`}>
                  <Localized value={PYQ.back} />
                </button>
              </div>
            }
          />
        </section>
      )}

      {!running && data && (
        paperCount === 0 ? (
          <Localized value={PYQ.empty} as="p" className="mt-8 text-slate-600 dark:text-slate-300" />
        ) : (
          <>
            <section aria-labelledby="pyq-years" className="mt-8">
              <h2 id="pyq-years" className="text-2xl font-extrabold text-slate-900 dark:text-white"><Localized value={PYQ.byYear} /></h2>
              <Localized value={PYQ.byYearSub} as="p" className="mt-1 text-sm text-slate-600 dark:text-slate-300" />
              {data.exams.map((exam) => (
                <ul key={exam.name} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {exam.papers.map((paper) => (
                    <li key={paper.year}>
                      <PaperCard
                        exam={exam}
                        paper={paper}
                        onPractise={() => start({ en: `${exam.name} ${paper.year}` }, { exam: exam.name, year: paper.year })}
                      />
                    </li>
                  ))}
                </ul>
              ))}
              <p className="mt-4 max-w-3xl text-sm text-slate-600 dark:text-slate-300">
                <Localized value={PYQ.basisNote} />{' '}
                <a href={WBPSC_PYQ_PAGE} target="_blank" rel="noopener noreferrer" className={linkCls}>
                  <Localized value={PYQ.sourcesLink} />
                </a>
              </p>
            </section>

            <section aria-labelledby="pyq-topics" className="mt-10">
              <h2 id="pyq-topics" className="text-2xl font-extrabold text-slate-900 dark:text-white"><Localized value={PYQ.byTopic} /></h2>
              <Localized value={PYQ.byTopicSub} as="p" className="mt-1 text-sm text-slate-600 dark:text-slate-300" />
              <PriorityLegend className="mt-2 max-w-3xl" />
              <TopicSets topics={data.topics} onPractise={(t) => start(t.name, { subject: t.subject, topic: t.topic })} />
            </section>
          </>
        )
      )}
    </PageShell>
  );
}

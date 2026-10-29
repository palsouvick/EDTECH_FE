import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useDataSource } from '../../app/DataSourceContext';
import { useResource } from '../../hooks/useResource';
import { LEARN, LEVEL_META, QUIZ_LEVELS, TONES } from '../../lib/learnCopy';
import { levelProgress, rememberChapter } from '../../lib/learnProgress';
import { codeFromSlug, learnPaths, subjectCodeFromSlug } from '../../lib/routes';
import PageShell from '../../components/navigation/PageShell';
import { Localized, Tex } from '../../components/topic-hub/Localized';
import { ArrowRightIcon } from '../../components/topic-hub/icons';
import { CardGridSkeleton, LoadError } from '../funnel/FunnelLayout';

const card = 'rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6 dark:bg-slate-900 dark:ring-slate-800';

function WorkedExample({ example, n }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="rounded-xl bg-indigo-50/60 p-4 ring-1 ring-indigo-100 dark:bg-indigo-500/5 dark:ring-indigo-500/20">
      <Localized value={LEARN.example(n)} as="p" className="text-xs font-bold uppercase tracking-wide text-indigo-700 dark:text-indigo-300" />
      <Localized value={example.question} markdown as="div" className="mt-1 font-medium text-slate-900 dark:text-white" />
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="mt-3 inline-flex min-h-10 items-center rounded-lg bg-white px-3 text-sm font-semibold text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-50 dark:bg-slate-900 dark:text-indigo-300 dark:ring-indigo-500/40"
      >
        <Localized value={open ? LEARN.hideSteps : LEARN.showSteps} />
      </button>
      {open && (
        <div className="mt-3 space-y-2">
          <ol className="space-y-2">
            {example.steps.map((s, i) => (
              <li key={i} className="flex gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-indigo-600 text-xs font-bold text-white">{i + 1}</span>
                <Localized value={s} markdown as="div" className="min-w-0 flex-1 text-slate-700 dark:text-slate-200" />
              </li>
            ))}
          </ol>
          <div className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-900 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/30">
            <Localized value={LEARN.answer} className="font-bold" />:{' '}
            <Localized value={example.answer} markdown inline />
          </div>
        </div>
      )}
    </li>
  );
}

function LessonLevel({ level }) {
  return (
    <div className="space-y-5">
      {level.sections.map((s, i) => (
        <section key={i}>
          <Localized value={s.heading} as="h3" className="text-lg font-bold text-slate-900 dark:text-white" />
          <Localized value={s.body} markdown as="div" className="mt-2 leading-relaxed text-slate-700 dark:text-slate-200" />
        </section>
      ))}
      <ul className="space-y-3">
        {level.examples.map((ex, i) => (
          <WorkedExample key={i} example={ex} n={i + 1} />
        ))}
      </ul>
    </div>
  );
}

function Lesson({ lesson, isMath }) {
  const [active, setActive] = useState(0);
  const level = lesson.levels[active];
  return (
    <>
      <div className={card}>
        <div role="tablist" aria-label={LEARN.levelTabs.en} className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          {lesson.levels.map((l, i) => (
            <button
              key={l.level}
              type="button"
              role="tab"
              id={`tab-${l.level}`}
              aria-selected={i === active}
              aria-controls="lesson-panel"
              onClick={() => setActive(i)}
              className={`min-h-11 rounded-lg px-2 text-sm font-semibold transition-colors sm:text-base ${
                i === active ? 'bg-white text-indigo-700 shadow-sm dark:bg-slate-950 dark:text-indigo-300' : 'text-slate-600 hover:text-slate-900 dark:text-slate-300'
              }`}
            >
              <span className="mr-1 text-xs opacity-60">{i + 1}.</span>
              <Localized value={LEVEL_META[l.level].label} />
            </button>
          ))}
        </div>
        <div id="lesson-panel" role="tabpanel" aria-labelledby={`tab-${level.level}`} className="mt-5">
          <LessonLevel level={level} />
        </div>
        {active < lesson.levels.length - 1 && (
          <button
            type="button"
            onClick={() => setActive(active + 1)}
            className="mt-6 inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-600 px-5 font-semibold text-white hover:bg-indigo-500"
          >
            <Localized value={LEVEL_META[lesson.levels[active + 1].level].label} />
            <ArrowRightIcon />
          </button>
        )}
      </div>

      <section className={card}>
        <Localized value={isMath ? LEARN.formulas : LEARN.rules} as="h2" className="text-xl font-bold text-slate-900 dark:text-white" />
        <ul className="mt-4 grid gap-3 md:grid-cols-2">
          {lesson.rules.map((r, i) => (
            <li key={i} className="min-w-0 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-800">
              <Localized value={r.label} as="p" className="font-semibold text-slate-900 dark:text-white" />
              {r.latex && (
                <div className="formula-scroll my-2 overflow-x-auto py-1 text-slate-900 dark:text-white">
                  <Tex latex={r.latex} display />
                </div>
              )}
              <Localized value={r.explain} markdown as="div" className="text-sm leading-relaxed text-slate-600 dark:text-slate-300" />
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl bg-amber-50 p-5 ring-1 ring-amber-200 sm:p-6 dark:bg-amber-500/10 dark:ring-amber-500/30">
        <h2 className="text-xl font-bold text-amber-900 dark:text-amber-200">
          <span aria-hidden="true">💡 </span>
          <Localized value={LEARN.tips} />
        </h2>
        <ul className="mt-3 space-y-2">
          {lesson.tips.map((tip, i) => (
            <li key={i} className="flex gap-2 text-amber-950 dark:text-amber-100">
              <span aria-hidden="true">•</span>
              <Localized value={tip} markdown as="div" className="min-w-0 flex-1" />
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

function QuizCards({ subject, topic, levels }) {
  return (
    <section id="quizzes" className={`${card} scroll-mt-28`}>
      <Localized value={LEARN.quizzesTitle} as="h2" className="text-xl font-bold text-slate-900 dark:text-white" />
      <Localized value={LEARN.quizzesSub} as="p" className="mt-1 text-sm text-slate-600 dark:text-slate-300" />
      <ul className="mt-4 grid gap-3 sm:grid-cols-3">
        {QUIZ_LEVELS.map((l) => {
          const info = levels.find((x) => x.level === l.level);
          const best = levelProgress(subject, topic, l.level).best;
          const tone = TONES[l.tone];
          const empty = !info?.count;
          return (
            <li key={l.level} className={`flex flex-col rounded-xl p-4 ring-1 ${tone.ring}`}>
              <div className="flex items-center gap-2">
                <span className="text-2xl" aria-hidden="true">{l.icon}</span>
                <Localized value={l.label} as="h3" className="font-bold text-slate-900 dark:text-white" />
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5 text-xs font-semibold">
                {!empty && <Localized value={LEARN.qCount(info.questionCount)} className={`rounded-full px-2 py-0.5 ${tone.chip}`} />}
                {!empty && info.borrowed && <Localized value={LEARN.borrowedChip} className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200" />}
                <Localized
                  value={info?.timed ? LEARN.timed(Math.round(info.timeLimitSec / 60)) : LEARN.noTimer}
                  className={`rounded-full px-2 py-0.5 ${tone.chip}`}
                />
              </div>
              {best && <Localized value={LEARN.best(best.correct, best.total)} as="p" className="mt-2 text-sm text-slate-600 dark:text-slate-300" />}
              {empty ? (
                <Localized value={LEARN.noQuestions} as="p" className="mt-auto pt-3 text-sm text-slate-400" />
              ) : (
                <div className="mt-auto pt-3">
                  <Link
                    to={learnPaths.quiz(subject, topic, l.level)}
                    className={`flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 font-semibold text-white ${tone.solid}`}
                  >
                    <Localized value={LEARN.startQuiz} />
                    <ArrowRightIcon />
                  </Link>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** /learn/:subject/:chapter: the lesson, basic -> advanced, then the level quizzes. */
export default function ChapterPage() {
  const { subject: slug, chapter } = useParams();
  const subject = subjectCodeFromSlug(slug);
  const topic = codeFromSlug(chapter);
  const source = useDataSource();
  const valid = subject && topic;
  const { status, data, error, retry } = useResource(valid && `learn:chapter:${subject}.${topic}`, () => source.getLearnChapter(subject, topic));
  useEffect(() => {
    if (status === 'ready') rememberChapter(subject, topic, data.title);
  }, [status, data, subject, topic]);
  if (!valid) return <Navigate to="/" replace />;
  if (status === 'error' && error?.status === 404) return <Navigate to={learnPaths.subject(subject)} replace />;

  return (
    <PageShell className="max-w-4xl pb-16 pt-6 sm:pt-10">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
        <Link to="/" className="hover:text-indigo-600 hover:underline">
          <Localized value={{ en: 'Home', bn: 'হোম' }} />
        </Link>
        <span aria-hidden="true">›</span>
        <Link to={learnPaths.subject(subject)} className="hover:text-indigo-600 hover:underline">
          <Localized value={subject === 'quant' ? { en: 'Math', bn: 'গণিত' } : { en: 'English', bn: 'ইংরেজি' }} />
        </Link>
      </nav>

      {status === 'loading' && <div className="mt-6"><CardGridSkeleton count={3} height="h-48" /></div>}
      {status === 'error' && <div className="mt-6"><LoadError error={error} onRetry={retry} /></div>}
      {status === 'ready' && (
        <div className="mt-3 space-y-6">
          <header className="flex items-start gap-3">
            <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-indigo-50 text-3xl dark:bg-indigo-500/10" aria-hidden="true">{data.lesson?.emoji ?? '📘'}</span>
            <div className="min-w-0">
              <Localized value={data.title} as="h1" className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white" />
              {data.lesson && <Localized value={data.lesson.intro} markdown as="div" className="mt-2 text-base leading-relaxed text-slate-600 sm:text-lg dark:text-slate-300" />}
              <a href="#quizzes" className="mt-3 inline-flex text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
                <Localized value={LEARN.quizzesTitle} /> ↓
              </a>
            </div>
          </header>

          {data.lesson ? <Lesson lesson={data.lesson} isMath={subject === 'quant'} /> : <Localized value={LEARN.lessonSoon} as="p" className={`${card} text-slate-500`} />}

          <QuizCards subject={subject} topic={topic} levels={data.levels} />

          <nav className="flex flex-col gap-3 sm:flex-row sm:justify-between" aria-label="Chapters">
            {data.previous ? (
              <Link to={learnPaths.chapter(subject, data.previous.topic)} className="rounded-xl bg-white px-4 py-3 ring-1 ring-slate-200 hover:ring-indigo-300 dark:bg-slate-900 dark:ring-slate-800">
                <Localized value={LEARN.previous} as="span" className="block text-xs text-slate-500" />
                <span className="font-semibold text-slate-900 dark:text-white">← <Localized value={data.previous.title} /></span>
              </Link>
            ) : <span />}
            {data.next ? (
              <Link to={learnPaths.chapter(subject, data.next.topic)} className="rounded-xl bg-white px-4 py-3 text-right ring-1 ring-slate-200 hover:ring-indigo-300 dark:bg-slate-900 dark:ring-slate-800">
                <Localized value={LEARN.next} as="span" className="block text-xs text-slate-500" />
                <span className="font-semibold text-slate-900 dark:text-white"><Localized value={data.next.title} /> →</span>
              </Link>
            ) : (
              <Link to={learnPaths.subject(subject)} className="rounded-xl bg-white px-4 py-3 text-right font-semibold ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
                <Localized value={LEARN.allChapters} />
              </Link>
            )}
          </nav>
        </div>
      )}
    </PageShell>
  );
}

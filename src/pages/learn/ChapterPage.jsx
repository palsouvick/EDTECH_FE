import { useEffect, useState } from 'react';
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom';
import { useDataSource } from '../../app/DataSourceContext';
import { useResource } from '../../hooks/useResource';
import { LEARN, LEVEL_META, QUIZ_LEVELS, TONES } from '../../lib/learnCopy';
import { lessonProgress, levelProgress, rememberChapter, toggleLessonBookmark, updateLessonProgress } from '../../lib/learnProgress';
import { codeFromSlug, learnPaths, subjectCodeFromSlug } from '../../lib/routes';
import PageShell from '../../components/navigation/PageShell';
import ChapterLadder from '../../components/learn/ChapterLadder';
import MasteryTestCard from '../../components/custom-test/MasteryTestCard';
import ModePanel, { MODE_KEYS, ModeTabs } from '../../components/learn/StudyModes';
import { useLearnStatus } from '../../components/learn/useLearnStatus';
import { Localized, Tex } from '../../components/topic-hub/Localized';
import QuestionPatterns from '../../components/topic-hub/QuestionPatterns';
import { ArrowRightIcon } from '../../components/topic-hub/icons';
import { CardGridSkeleton, LoadError } from '../funnel/FunnelLayout';

const card = 'rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6 dark:bg-slate-900 dark:ring-slate-800';

function WorkedExample({ example, n, bookmarked = false, onBookmark }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="rounded-xl bg-indigo-50/60 p-4 ring-1 ring-indigo-100 dark:bg-indigo-500/5 dark:ring-indigo-500/20">
      <Localized value={LEARN.example(n)} as="p" className="text-xs font-bold uppercase tracking-wide text-indigo-700 dark:text-indigo-300" />
      <Localized value={example.question} markdown as="div" className="mt-1 font-medium text-slate-900 dark:text-white" />
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="inline-flex min-h-10 items-center rounded-lg bg-white px-3 text-sm font-semibold text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-50 dark:bg-slate-900 dark:text-indigo-300 dark:ring-indigo-500/40"
        >
          <Localized value={open ? LEARN.hideSteps : LEARN.showSteps} />
        </button>
        {onBookmark && (
          <button
            type="button"
            aria-pressed={bookmarked}
            onClick={onBookmark}
            className="inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-white dark:text-slate-200 dark:ring-slate-700"
          >
            {bookmarked ? '★ ' : '☆ '}
            <Localized value={bookmarked ? LEARN.savedItem : LEARN.saveItem} />
          </button>
        )}
      </div>
      {open && (
        <div className="mt-3 space-y-2">
          {example.given && <div><Localized value={LEARN.given} className="font-bold" />: <Localized value={example.given} markdown inline /></div>}
          {example.find && <div><Localized value={LEARN.find} className="font-bold" />: <Localized value={example.find} markdown inline /></div>}
          {example.method && <div><Localized value={LEARN.method} className="font-bold" />: <Localized value={example.method} markdown inline /></div>}
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
          {example.why && (
            <div className="rounded-lg bg-sky-50 px-3 py-2 text-sky-950 ring-1 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-100 dark:ring-sky-500/30">
              <Localized value={LEARN.why} className="font-bold" />:{' '}
              <Localized value={example.why} markdown inline />
            </div>
          )}
        </div>
      )}
    </li>
  );
}

function LessonLevel({ level, includeExamples = true, bookmarks = [], onBookmark, collapsibleSections = false }) {
  return (
    <div className="space-y-5">
      {level.sections.map((s, i) => collapsibleSections ? (
        <details key={i} open={i === 0} className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-800">
          <summary className="cursor-pointer text-lg font-bold text-slate-900 dark:text-white"><Localized value={s.heading} /></summary>
          <Localized value={s.body} markdown as="div" className="mt-2 leading-relaxed text-slate-700 dark:text-slate-200" />
        </details>
      ) : (
        <section key={i}>
          <Localized value={s.heading} as="h3" className="text-lg font-bold text-slate-900 dark:text-white" />
          <Localized value={s.body} markdown as="div" className="mt-2 leading-relaxed text-slate-700 dark:text-slate-200" />
        </section>
      ))}
      {includeExamples && (
        <ul className="space-y-3">
          {level.examples.map((ex, i) => (
            <WorkedExample
              key={i}
              example={ex}
              n={i + 1}
              bookmarked={bookmarks.includes(`example-${i + 1}`)}
              onBookmark={onBookmark ? () => onBookmark(`example-${i + 1}`) : undefined}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function QuickPractice({ practice }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="rounded-xl bg-amber-50 p-4 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:ring-amber-500/30">
      <Localized value={{ en: 'Try this short exercise', bn: 'এই ছোট অনুশীলনটি করো' }} as="h3" className="font-bold text-amber-950 dark:text-amber-100" />
      <Localized value={practice.question} markdown as="div" className="mt-2 text-amber-950 dark:text-amber-100" />
      <button type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)} className="mt-3 min-h-10 rounded-lg bg-white px-3 text-sm font-semibold text-amber-900 ring-1 ring-amber-300 dark:bg-slate-900 dark:text-amber-100 dark:ring-amber-500/40">
        <Localized value={open ? LEARN.hideSteps : LEARN.showSteps} />
      </button>
      {open && (
        <div className="mt-3 space-y-2">
          <ol className="space-y-2">
            {practice.steps.map((step, index) => <li key={index}><Localized value={step} markdown /></li>)}
          </ol>
          <div className="font-semibold"><Localized value={LEARN.answer} />: <Localized value={practice.answer} markdown inline /></div>
        </div>
      )}
    </section>
  );
}

const guidedNav = [
  ['basic', { en: 'Basic Concepts', bn: 'মৌলিক ধারণা' }],
  ['examples', { en: 'Solved Examples', bn: 'সমাধান করা উদাহরণ' }],
  ['strategy', { en: 'Problem-Solving Strategy', bn: 'সমাধানের কৌশল' }],
  ['patterns', { en: 'Question Patterns', bn: 'প্রশ্নের ধরন' }],
  ['intermediate', LEVEL_META.intermediate.label],
  ['advanced', LEVEL_META.advanced.label],
  ['chapterTest', { en: 'Chapter Test', bn: 'অধ্যায়ের পরীক্ষা' }],
  ['revision', { en: 'Revision', bn: 'ঝালিয়ে নাও' }],
];

function Lesson({ lesson, isMath, subject, topic, quizLevels, patternResource }) {
  const [active, setActive] = useState(0);
  const level = lesson.levels[active];
  const guided = Boolean(lesson.strategy);
  const saved = guided ? lessonProgress(subject, topic) : { section: 'basic', completed: false, bookmarks: [] };
  const [activeSection, setActiveSection] = useState(saved.section);
  const [bookmarks, setBookmarks] = useState(saved.bookmarks);
  const sections = guidedNav;
  const selectedIndex = Math.max(0, sections.findIndex(([key]) => key === activeSection));
  const selectSection = (key) => {
    setActiveSection(key);
    updateLessonProgress(subject, topic, { section: key });
  };
  const bookmark = (id) => {
    const updated = toggleLessonBookmark(subject, topic, id);
    setBookmarks(updated.bookmarks);
  };

  useEffect(() => {
    if (!guided) return;
    const current = lessonProgress(subject, topic);
    setActiveSection(current.section);
    setBookmarks(current.bookmarks);
  }, [guided, subject, topic]);

  if (guided) {
    const basicLevel = lesson.levels.find((l) => l.level === 'basic');
    const selected = sections[selectedIndex][0];
    const move = (offset) => {
      const next = sections[Math.min(sections.length - 1, Math.max(0, selectedIndex + offset))][0];
      selectSection(next);
    };
    return (
      <div className="space-y-5">
        <section className={card} aria-label="Lesson navigation">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Localized value={{ en: `Section ${selectedIndex + 1} of ${sections.length}`, bn: `${sections.length}-টির মধ্যে ${selectedIndex + 1}-তম অংশ` }} className="text-sm font-semibold text-slate-600 dark:text-slate-300" />
            <div className="flex items-center gap-2">
              <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700" aria-label="Lesson progress">
                <div className="h-full rounded-full bg-indigo-600" style={{ width: `${((selectedIndex + 1) / sections.length) * 100}%` }} />
              </div>
              {saved.completed && <Localized value={{ en: 'Completed', bn: 'সম্পূর্ণ হয়েছে' }} className="text-xs font-bold text-emerald-700 dark:text-emerald-300" />}
            </div>
          </div>
          <nav aria-label="Lesson sections" className="mt-4 flex gap-2 overflow-x-auto pb-2">
            {sections.map(([key, label], index) => (
              <button
                key={key}
                type="button"
                aria-current={key === selected ? 'step' : undefined}
                onClick={() => selectSection(key)}
                className={`min-h-10 shrink-0 rounded-full px-3 text-sm font-semibold ${
                  key === selected
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-indigo-50 dark:bg-slate-800 dark:text-slate-200'
                }`}
              >
                <span className="mr-1 opacity-70">{index + 1}.</span><Localized value={label} />
              </button>
            ))}
          </nav>
        </section>

        <section className={`${card} space-y-5`} aria-live="polite">
          {selected === 'basic' && (
            <>
              <LessonLevel level={basicLevel} includeExamples={false} collapsibleSections />
              <QuickPractice practice={lesson.practice} />
            </>
          )}
          {selected === 'examples' && (
            <>
              <Localized value={{
                en: `${basicLevel.examples.length} solved examples, from everyday situations to exam-style questions.`,
                bn: `দৈনন্দিন সহজ ঘটনা থেকে পরীক্ষার ধাঁচের প্রশ্ন পর্যন্ত ${basicLevel.examples.length}টি সমাধান করা উদাহরণ।`,
              }} as="p" className="text-slate-600 dark:text-slate-300" />
              <ul className="space-y-3">
                {basicLevel.examples.map((ex, i) => (
                  <WorkedExample
                    key={i}
                    example={ex}
                    n={i + 1}
                    bookmarked={bookmarks.includes(`example-${i + 1}`)}
                    onBookmark={() => bookmark(`example-${i + 1}`)}
                  />
                ))}
              </ul>
            </>
          )}
          {selected === 'strategy' && (
            <div className="space-y-5">
              <Localized value={lesson.strategy.heading} as="h2" className="text-xl font-extrabold text-slate-900 dark:text-white" />
              {lesson.strategy.sections.map((section, i) => (
                <section key={i}>
                  <Localized value={section.heading} as="h3" className="text-lg font-bold text-slate-900 dark:text-white" />
                  <Localized value={section.body} markdown as="div" className="mt-2 leading-relaxed text-slate-700 dark:text-slate-200" />
                </section>
              ))}
            </div>
          )}
          {selected === 'patterns' && patternResource?.status === 'error' && <LoadError error={patternResource.error} onRetry={patternResource.retry} />}
          {selected === 'patterns' && patternResource?.status !== 'error' && (
            patternResource?.data?.patterns?.length ? (
              <QuestionPatterns
                subject={subject}
                topic={topic}
                patterns={patternResource.data.patterns}
                learnPractice
                onPractice={() => selectSection('chapterTest')}
              />
            ) : (
              <Localized
                value={patternResource?.status === 'ready'
                  ? { en: 'No question patterns are available for this chapter yet.', bn: 'এই অধ্যায়ের জন্য এখনও প্রশ্নের ধরন যোগ করা হয়নি।' }
                  : { en: 'Question patterns are loading.', bn: 'প্রশ্নের ধরন লোড হচ্ছে।' }}
                as="p"
                className="text-slate-600 dark:text-slate-300"
              />
            )
          )}
          {selected === 'intermediate' && <LessonLevel level={lesson.levels.find((l) => l.level === 'intermediate')} />}
          {selected === 'advanced' && <LessonLevel level={lesson.levels.find((l) => l.level === 'advanced')} />}
          {selected === 'chapterTest' && <QuizCards subject={subject} topic={topic} levels={quizLevels} />}
          {selected === 'revision' && (
            <>
              <section>
                <Localized value={isMath ? LEARN.formulas : LEARN.rules} as="h2" className="text-xl font-bold text-slate-900 dark:text-white" />
                <ul className="mt-4 grid gap-3 md:grid-cols-2">
                  {lesson.rules.map((rule, i) => {
                    const id = `formula-${i + 1}`;
                    const marked = bookmarks.includes(id);
                    return (
                      <li key={id} className="min-w-0 rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200 dark:bg-slate-950 dark:ring-slate-800">
                        <div className="flex items-start justify-between gap-2">
                          <Localized value={rule.label} as="p" className="font-semibold text-slate-900 dark:text-white" />
                          <button type="button" aria-pressed={marked} onClick={() => bookmark(id)} className="shrink-0 rounded px-2 py-1 text-xs font-semibold text-indigo-700 ring-1 ring-indigo-200 dark:text-indigo-300 dark:ring-indigo-500/40">
                            {marked ? '★ ' : '☆ '}<Localized value={marked ? LEARN.savedItem : LEARN.saveItem} />
                          </button>
                        </div>
                        {rule.latex && <div className="formula-scroll my-2 overflow-x-auto py-1 text-slate-900 dark:text-white"><Tex latex={rule.latex} display /></div>}
                        <Localized value={rule.explain} markdown as="div" className="text-sm leading-relaxed text-slate-600 dark:text-slate-300" />
                      </li>
                    );
                  })}
                </ul>
              </section>
              <section className="rounded-2xl bg-amber-50 p-5 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:ring-amber-500/30">
                <Localized value={LEARN.tips} as="h2" className="text-xl font-bold text-amber-900 dark:text-amber-200" />
                <ul className="mt-3 space-y-2">
                  {lesson.tips.map((tip, i) => <li key={i}><Localized value={tip} markdown /></li>)}
                </ul>
              </section>
              <section className="rounded-2xl bg-sky-50 p-4 ring-1 ring-sky-200 dark:bg-sky-500/10 dark:ring-sky-500/30">
                <Localized value={{ en: 'Saved formulas and examples', bn: 'সংরক্ষিত সূত্র ও উদাহরণ' }} as="h3" className="font-bold text-sky-950 dark:text-sky-100" />
                {bookmarks.length ? (
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {bookmarks.map((id) => <li key={id} className="rounded-full bg-white px-3 py-1 text-sm text-sky-900 dark:bg-slate-900 dark:text-sky-100">{id.startsWith('formula-') ? `Formula ${id.slice(8)}` : `Example ${id.slice(8)}`}</li>)}
                  </ul>
                ) : <Localized value={{ en: 'Use the star buttons to save an example or formula.', bn: 'তারকা বোতামে চাপ দিয়ে উদাহরণ বা সূত্র সংরক্ষণ করো।' }} as="p" className="mt-1 text-sm text-sky-900 dark:text-sky-100" />}
              </section>
            </>
          )}
          <div className="flex flex-wrap justify-between gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
            <button type="button" disabled={selectedIndex === 0} onClick={() => move(-1)} className="min-h-11 rounded-xl px-4 font-semibold text-slate-700 ring-1 ring-slate-300 disabled:opacity-40 dark:text-slate-200 dark:ring-slate-700">
              ← <Localized value={{ en: 'Previous', bn: 'আগের অংশ' }} />
            </button>
            {selectedIndex < sections.length - 1 ? (
              <button type="button" onClick={() => move(1)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-indigo-600 px-5 font-semibold text-white hover:bg-indigo-500">
                <Localized value={{ en: 'Next Lesson', bn: 'পরের পাঠ' }} /><ArrowRightIcon />
              </button>
            ) : (
              <button type="button" onClick={() => {
                updateLessonProgress(subject, topic, { completed: true, section: 'basic' });
                setActiveSection('basic');
              }} className="min-h-11 rounded-xl bg-emerald-600 px-5 font-semibold text-white hover:bg-emerald-500">
                <Localized value={{ en: 'Mark as Completed', bn: 'সম্পূর্ণ হিসেবে চিহ্নিত করো' }} />
              </button>
            )}
          </div>
        </section>
      </div>
    );
  }

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
  const patternResource = useResource(
    valid && subject === 'quant' ? `patterns:${subject}.${topic}` : null,
    () => source.getTopicPatterns({ subject, topic }),
  );
  useEffect(() => {
    if (status === 'ready') rememberChapter(subject, topic, data.title);
  }, [status, data, subject, topic]);
  const [params, setParams] = useSearchParams();
  const mode = MODE_KEYS.includes(params.get('mode')) ? params.get('mode') : 'detailed';
  const setMode = (next) => {
    setParams(next === 'detailed' ? {} : { mode: next }, { replace: true });
    document.getElementById('study-modes')?.scrollIntoView?.({ block: 'start', behavior: 'smooth' });
  };
  const learnStatus = useLearnStatus(subject);
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
              {data.lesson?.strategy ? (
                <Link to={learnPaths.quiz(subject, topic, 'beginner')} className="mt-3 inline-flex text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
                  <Localized value={LEARN.startQuiz} /> ↓
                </Link>
              ) : (
                <a href="#quizzes" className="mt-3 inline-flex text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
                  <Localized value={LEARN.quizzesTitle} /> ↓
                </a>
              )}
            </div>
          </header>

          <ChapterLadder subject={subject} topic={topic} status={learnStatus} onMode={setMode} />
          <MasteryTestCard subject={subject} topic={topic} title={data.title} />
          <div id="study-modes" className="scroll-mt-28">
            <ModeTabs mode={mode} onMode={setMode} />
          </div>

          {mode !== 'detailed' && (
            <ModePanel
              mode={mode}
              lesson={data.lesson}
              isMath={subject === 'quant'}
              subject={subject}
              topic={topic}
              title={data.title}
              status={learnStatus}
              renderExample={(example) => <WorkedExample example={example} n={1} />}
            />
          )}

          {mode === 'detailed' && (data.lesson ? (
            <Lesson
              lesson={data.lesson}
              isMath={subject === 'quant'}
              subject={subject}
              topic={topic}
              quizLevels={data.levels}
              patternResource={patternResource}
            />
          ) : <Localized value={LEARN.lessonSoon} as="p" className={`${card} text-slate-500`} />)}

          {mode === 'detailed' && !data.lesson?.strategy && <QuizCards subject={subject} topic={topic} levels={data.levels} />}

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

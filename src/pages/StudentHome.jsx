import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDataSource } from '../app/DataSourceContext';
import { useResource } from '../hooks/useResource';
import { chapterLink, taskLink } from '../lib/studyPlan';
import { taskTitle } from '../components/plan/PlanParts';
import { TARGET_EXAM, TODAY } from '../lib/targetExamCopy';
import PageShell from '../components/navigation/PageShell';
import { patternLink } from '../components/review/InsightsPanel';
import { Localized } from '../components/topic-hub/Localized';
import { ArrowRightIcon } from '../components/topic-hub/icons';
import { lastVisitedStore } from '../lib/lastVisited';
import { lastChapter } from '../lib/learnProgress';
import { MASTERY, WEAK } from '../lib/motivationCopy';
import { REVIEW } from '../lib/reviewCopy';
import { learnPaths, paths } from '../lib/routes';
import { STATUS_STYLE } from './MasteryPage';

const t = (en, bn) => ({ en, bn });
const COPY = {
  hello: (part, name) => t(`Good ${part}, ${name} 👋`, `শুভ ${{ morning: 'সকাল', afternoon: 'দুপুর', evening: 'সন্ধ্যা' }[part]}, ${name} 👋`),
  sub: t("Here's your plan for today.", 'আজ কী করবে, এখানে দেওয়া আছে।'),
  streak: (n) => t(`🔥 ${n}-day streak`, `🔥 টানা ${n} দিন`),
  freezes: (n) => t(`🧊 ${n}`, `🧊 ${n}`),
  continue: t('Continue where you left off', 'যেখানে থেমেছিলে সেখান থেকে'),
  exam: t('Exam practice', 'পরীক্ষার অনুশীলন'),
  basics: t('Learn Basics', 'বেসিক শেখো'),
  nothingYet: t('Pick an exam or start Learn Basics, and your place will be kept here.', 'একটা পরীক্ষা বা বেসিক শেখো শুরু করো, তোমার জায়গা এখানে মনে রাখা হবে।'),
  weakest: t('Your weakest spot', 'তোমার সবচেয়ে দুর্বল জায়গা'),
  noWeak: t('Answer a few more questions and your weakest spot will show up here.', 'আরও কিছু প্রশ্নের উত্তর দিলে তোমার দুর্বল জায়গা এখানে দেখাবে।'),
  map: t('Your chapters', 'তোমার অধ্যায়গুলো'),
  more: t('More', 'আরও'),
  explore: t('Browse all exams', 'সব পরীক্ষা দেখো'),
};
const partOfDay = () => {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
};
const card = 'rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6 dark:bg-slate-900 dark:ring-slate-800';

/** Dismissing the "pick your target exam" card is device-local and permanent for that device. */
const PROMPT_KEY = 'edtech:target-exam-prompt-dismissed';

const TODAY_ICON = { revise: '🔁', plan: '🗓️', learn: '📖', practice: '✍️', pyq: '📝', gk: '🧠', general: '🎯' };

/**
 * Where a Today item is done. The list itself is the server's (GET /me/today,
 * F3) — this only turns an item into the app's existing route for that work,
 * reusing the plan's own task links for plan tasks.
 */
function todayHref(item, today) {
  switch (item.kind) {
    case 'revise':
      return '/revise';
    case 'plan':
      return (item.task && taskLink(item.task)) || today?.plan?.route || '/plan';
    case 'learn':
      return chapterLink(item.subject, item.topic);
    case 'practice':
      return today?.exam?.category ? paths.topic(today.exam.category, item.subject, item.topic) : chapterLink(item.subject, item.topic);
    case 'pyq':
      return '/pyq';
    case 'gk':
      return '/learn/gk';
    default:
      return paths.exams();
  }
}

/**
 * "/" for a signed-in student: greeting and streak, the ONE "Today's Study"
 * list from the server (F3 — GET /me/today; no plan is computed here any
 * more, so home and /plan can never disagree), continue where you left off,
 * weakest spot, and a mastery snapshot. Each block hides itself if its data fails.
 */
export default function StudentHome({ user }) {
  const source = useDataSource();
  const [d, setD] = useState({});
  const [promptDismissed, setPromptDismissed] = useState(() => {
    try {
      return localStorage.getItem(PROMPT_KEY) === '1';
    } catch {
      return false;
    }
  });

  // The target exam shapes the plan below. A failed load (including the
  // backend not knowing the exam yet) falls back to the generic plan.
  const targetExam = user?.targetExam ?? null;
  const syllabusRes = useResource(
    targetExam && source.getTargetExamSyllabus ? `target-exam:syllabus:${targetExam.code}` : null,
    () => source.getTargetExamSyllabus(),
  );
  const syllabus = syllabusRes.status === 'ready' ? syllabusRes.data : null;

  useEffect(() => {
    let alive = true;
    Promise.allSettled([source.getInsights(), source.getReviewSummary(), source.getToday()]).then(([ins, rev, td]) => {
      if (!alive) return;
      setD({
        insights: ins.status === 'fulfilled' ? ins.value : null,
        review: rev.status === 'fulfilled' ? rev.value : null,
        today: td.status === 'fulfilled' ? td.value : null,
        ready: true,
      });
    });
    return () => {
      alive = false;
    };
  }, [source]);

  const exam = lastVisitedStore.get();
  const basics = lastChapter();
  const ins = d.insights;
  const weak = ins?.weakPatterns?.[0];
  const weakChapter = !weak ? ins?.mastery?.find((m) => m.status === 'weak') ?? ins?.mastery?.find((m) => m.status === 'improving') : null;
  const firstName = user.name.split(/\s+/)[0];
  const today = d.today;

  // Days left: the server's countdown when present, else the chosen date against today.
  const daysLeft = syllabus?.countdown?.daysLeft ?? (targetExam?.date
    ? Math.ceil((new Date(targetExam.date).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86_400_000)
    : null);
  const readinessScore = syllabus?.readiness?.score ?? null;
  const examName = syllabus?.exam?.name ?? (targetExam ? targetExam.code.replace(/_/g, ' ') : null);

  const dismissPrompt = () => {
    try {
      localStorage.setItem(PROMPT_KEY, '1');
    } catch {
      /* private mode: the card shows again next visit */
    }
    setPromptDismissed(true);
  };

  return (
    <PageShell className="max-w-6xl pb-16 pt-6 sm:pt-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Localized value={COPY.hello(partOfDay(), firstName)} as="h1" className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white" />
          <Localized value={COPY.sub} as="p" className="mt-1 text-slate-600 dark:text-slate-300" />
        </div>
        {ins && (
          <div className="flex gap-2 text-sm font-bold">
            <Localized value={COPY.streak(ins.streak.days)} className="rounded-full bg-amber-100 px-3 py-1.5 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300" />
            {ins.streak.freezes > 0 && <Localized value={COPY.freezes(ins.streak.freezes)} className="rounded-full bg-sky-100 px-3 py-1.5 text-sky-800 dark:bg-sky-500/15 dark:text-sky-200" />}
          </div>
        )}
      </header>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1.25fr_1fr]">
        <div className="space-y-5">
          {/* Target exam: countdown + readiness, or a one-time prompt to pick one. */}
          {targetExam ? (
            <section className={card} aria-labelledby="target-exam-title">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 id="target-exam-title" className="text-lg font-bold text-slate-900 dark:text-white">
                    <span aria-hidden="true">🎯 </span>
                    <Localized value={TARGET_EXAM.menu} />
                  </h2>
                  <p className="mt-1 truncate text-lg font-bold text-slate-900 dark:text-white">
                    {examName && typeof examName === 'object' ? <Localized value={examName} /> : examName}
                  </p>
                  {daysLeft != null && (
                    <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                      {daysLeft === 0 ? <Localized value={TARGET_EXAM.examToday} /> : daysLeft < 0 ? <Localized value={TARGET_EXAM.examPassed} /> : <Localized value={TARGET_EXAM.daysLeft(daysLeft)} />}
                    </p>
                  )}
                  {readinessScore != null && (
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      <Localized value={TARGET_EXAM.readinessLabel} />: <span className="font-bold tabular-nums text-slate-900 dark:text-white">{readinessScore}%</span>
                    </p>
                  )}
                </div>
                <Link to="/choose-exam" className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-50 dark:text-indigo-300 dark:ring-indigo-500/40">
                  <Localized value={TARGET_EXAM.change} />
                </Link>
              </div>
              <Link to="/my-syllabus" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-indigo-700 hover:underline dark:text-indigo-300">
                <Localized value={TARGET_EXAM.viewSyllabus} /> →
              </Link>
            </section>
          ) : (
            !promptDismissed && (
              <section className={card} aria-labelledby="target-exam-prompt-title">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 id="target-exam-prompt-title" className="text-lg font-bold text-slate-900 dark:text-white">
                      <span aria-hidden="true">🎯 </span>
                      <Localized value={TARGET_EXAM.promptTitle} />
                    </h2>
                    <Localized value={TARGET_EXAM.promptBody} as="p" className="mt-1 text-sm text-slate-600 dark:text-slate-300" />
                  </div>
                  <button type="button" onClick={dismissPrompt} aria-label={TARGET_EXAM.dismiss.en} className="shrink-0 rounded-lg px-2 py-1 text-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800">
                    ×
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-3">
                  <Link to="/choose-exam" className="inline-flex min-h-10 items-center rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-500">
                    <Localized value={TARGET_EXAM.choose} />
                  </Link>
                  <button type="button" onClick={dismissPrompt} className="inline-flex min-h-10 items-center rounded-xl px-4 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-800">
                    <Localized value={TARGET_EXAM.dismiss} />
                  </button>
                </div>
              </section>
            )
          )}

          {/* Today's Study — the ONE list, from the server (F3). The home
              page computes no plan of its own any more. */}
          <section className={card} aria-labelledby="today-title">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="today-title" className="text-lg font-bold text-slate-900 dark:text-white">
                  <span aria-hidden="true">📋 </span>
                  <Localized value={TODAY.title} />
                </h2>
                {today?.plan && (
                  <p className="mt-1 text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                    <Localized value={TARGET_EXAM.planDay(today.plan.day, today.plan.total)} />
                  </p>
                )}
                {today && today.items.length > 0 && (
                  <p className="mt-0.5 text-sm text-slate-600 dark:text-slate-300">
                    <Localized value={TODAY.totalTime(today.totalMinutes)} />
                  </p>
                )}
              </div>
              {today?.plan && (
                <Link to={today.plan.route} className="shrink-0 rounded-lg px-3 py-2 text-sm font-semibold text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-50 dark:text-indigo-300 dark:ring-indigo-500/40">
                  <Localized value={TARGET_EXAM.openPlan} />
                </Link>
              )}
            </div>
            {!d.ready ? (
              <div className="mt-4 h-40 animate-pulse rounded-xl bg-slate-100 motion-reduce:animate-none dark:bg-slate-800" aria-busy="true" />
            ) : !today || today.items.length === 0 ? (
              <Localized value={TODAY.empty} as="p" className="mt-3 text-slate-600 dark:text-slate-300" />
            ) : (
              <>
                <Link
                  to={todayHref(today.primary, today)}
                  className="mt-4 flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 text-base font-bold text-white shadow-sm hover:bg-indigo-500"
                >
                  <Localized value={TODAY.continueBtn} />
                  <ArrowRightIcon />
                </Link>
                <ul className="mt-3 space-y-1">
                  {today.items.map((item) => (
                    <li key={item.id}>
                      <Link to={todayHref(item, today)} className="flex min-h-12 items-center gap-3 rounded-xl px-3 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-500/10">
                        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-slate-100 text-lg dark:bg-slate-800" aria-hidden="true">
                          {TODAY_ICON[item.kind] ?? '📌'}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-semibold text-slate-800 dark:text-slate-100">
                            <Localized value={item.kind === 'plan' && item.task ? taskTitle(item.task) : item.title} />
                          </span>
                          {item.reason && (
                            <span className="block text-sm font-normal text-slate-500 dark:text-slate-400">
                              <Localized value={item.reason} />
                            </span>
                          )}
                        </span>
                        <span className="shrink-0 text-sm font-semibold tabular-nums text-slate-500 dark:text-slate-400">
                          <Localized value={TODAY.minutes(item.minutes)} />
                        </span>
                        <ArrowRightIcon className="shrink-0 text-indigo-500" />
                      </Link>
                    </li>
                  ))}
                </ul>
                {today.trimmedCount > 0 && (
                  <p className="mt-2 px-3 text-sm text-slate-500 dark:text-slate-400">
                    <Localized value={TODAY.heldBack(today.trimmedCount)} />
                  </p>
                )}
              </>
            )}
          </section>

          {/* Continue where you left off */}
          <section className={card} aria-labelledby="continue-title">
            <h2 id="continue-title" className="text-lg font-bold text-slate-900 dark:text-white">
              <span aria-hidden="true">▶️ </span>
              <Localized value={COPY.continue} />
            </h2>
            {exam || basics ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {exam && (
                  <Link to={paths.topic(exam.category, exam.subject, exam.topic)} className="group rounded-2xl bg-indigo-50 p-4 ring-1 ring-indigo-100 hover:ring-indigo-300 dark:bg-indigo-500/10 dark:ring-indigo-500/20">
                    <Localized value={COPY.exam} as="p" className="text-xs font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-300" />
                    <Localized value={exam.names?.topic ?? { en: exam.topic }} as="p" className="mt-1 font-bold text-slate-900 dark:text-white" />
                    {exam.names?.category && <Localized value={exam.names.category} as="p" className="text-sm text-slate-500" />}
                  </Link>
                )}
                {basics && (
                  <Link to={learnPaths.chapter(basics.subject, basics.topic)} className="group rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100 hover:ring-emerald-300 dark:bg-emerald-500/10 dark:ring-emerald-500/20">
                    <Localized value={COPY.basics} as="p" className="text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300" />
                    <Localized value={basics.title} as="p" className="mt-1 font-bold text-slate-900 dark:text-white" />
                  </Link>
                )}
              </div>
            ) : (
              <Localized value={COPY.nothingYet} as="p" className="mt-2 text-slate-600 dark:text-slate-300" />
            )}
          </section>
        </div>

        <div className="space-y-5">
          {/* Revise today */}
          {d.review && (
            <Link to={d.review.dueToday ? '/revise' : '/mistakes'} className="flex items-center gap-4 rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-600 p-5 text-white shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5 sm:p-6">
              <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/20 text-3xl" aria-hidden="true">🔁</span>
              <span className="min-w-0 flex-1">
                <Localized value={d.review.dueToday ? REVIEW.dueCount(d.review.dueToday) : REVIEW.title} className="block text-xl font-extrabold" />
                <Localized value={d.review.dueToday ? REVIEW.start : REVIEW.allCaughtUp} className="block text-sm text-white/90" />
              </span>
              <ArrowRightIcon />
            </Link>
          )}

          {/* Weakest spot */}
          <section className={card} aria-labelledby="weak-title">
            <h2 id="weak-title" className="text-lg font-bold text-slate-900 dark:text-white">
              <span aria-hidden="true">🎯 </span>
              <Localized value={COPY.weakest} />
            </h2>
            {weak ? (
              <div className="mt-3">
                <p className="font-bold text-slate-900 dark:text-white">
                  {weak.emoji} <Localized value={weak.patternName} /> <span className="font-normal text-slate-500">· <Localized value={weak.chapterName} /></span>
                </p>
                <Localized value={WEAK.line(weak.chapterName, weak.chapterAccuracyPct, weak.accuracyPct)} as="p" className="text-sm text-rose-700 dark:text-rose-300" />
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link to={patternLink(weak, false)} className="inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-semibold text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-50 dark:text-indigo-300 dark:ring-indigo-500/40">
                    🧩 <Localized value={WEAK.learn} />
                  </Link>
                  <Link to={patternLink(weak, true)} className="inline-flex min-h-10 items-center rounded-lg bg-indigo-600 px-3 text-sm font-semibold text-white hover:bg-indigo-500">
                    ✍️ <Localized value={WEAK.practise} />
                  </Link>
                </div>
              </div>
            ) : weakChapter ? (
              <Link to={paths.topic(weakChapter.category, weakChapter.subject, weakChapter.topic)} className="mt-3 block font-semibold text-indigo-700 hover:underline dark:text-indigo-300">
                <Localized value={weakChapter.name} /> · <Localized value={MASTERY.accuracy(weakChapter.accuracyPct)} /> →
              </Link>
            ) : (
              <Localized value={COPY.noWeak} as="p" className="mt-2 text-sm text-slate-600 dark:text-slate-300" />
            )}
          </section>

          {/* Mastery snapshot */}
          {ins && (
            <Link to="/mastery" className={`${card} block hover:ring-indigo-300`}>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  <span aria-hidden="true">🗺️ </span>
                  <Localized value={COPY.map} />
                </h2>
                <ArrowRightIcon className="text-slate-400" />
              </div>
              <div className="mt-3 flex h-3 overflow-hidden rounded-full" aria-hidden="true">
                {['strong', 'improving', 'weak', 'started', 'not_started'].map((s) =>
                  ins.counts[s] ? <span key={s} className={STATUS_STYLE[s].dot} style={{ flexGrow: ins.counts[s] }} /> : null,
                )}
              </div>
              <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-300">
                {['strong', 'improving', 'weak'].map((s) => (
                  <li key={s} className="inline-flex items-center gap-1.5">
                    <span className={`size-2.5 rounded-full ${STATUS_STYLE[s].dot}`} aria-hidden="true" />
                    <span className="tabular-nums font-bold">{ins.counts[s] ?? 0}</span> <Localized value={MASTERY.status[s]} />
                  </li>
                ))}
              </ul>
            </Link>
          )}

          <nav aria-label={COPY.more.en} className="grid grid-cols-2 gap-2 text-sm font-semibold">
            {[
              [paths.exams(), '📚', COPY.explore],
              ['/learn', '🌱', COPY.basics],
              ['/mistakes', '📒', REVIEW.notebook],
              ['/leaderboard', '🏅', { en: 'Leaderboard', bn: 'লিডারবোর্ড' }],
            ].map(([to, icon, label]) => (
              <Link key={to} to={to} className="flex min-h-12 items-center gap-2 rounded-xl bg-white px-3 ring-1 ring-slate-200 hover:ring-indigo-300 dark:bg-slate-900 dark:ring-slate-800">
                <span aria-hidden="true">{icon}</span>
                <Localized value={label} />
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </PageShell>
  );
}

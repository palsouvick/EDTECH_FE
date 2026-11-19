import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDataSource } from '../app/DataSourceContext';
import { updateCachedResource, useResource } from '../hooks/useResource';
import { DIAG } from '../lib/diagnosticCopy';
import { REV } from '../lib/revisionHubCopy';
import { chapterLink, taskLink } from '../lib/studyPlan';
import { taskTitle } from '../components/plan/PlanParts';
import { TARGET_EXAM, TODAY } from '../lib/targetExamCopy';
import PageShell from '../components/navigation/PageShell';
import StageChip from '../components/mastery/StageChip';
import { Localized } from '../components/topic-hub/Localized';
import { ArrowRightIcon } from '../components/topic-hub/icons';
import { lastVisitedStore } from '../lib/lastVisited';
import { lastChapter } from '../lib/learnProgress';
import { MASTERY } from '../lib/motivationCopy';
import { learnPaths, paths } from '../lib/routes';

const t = (en, bn) => ({ en, bn });
const bn = (n) => String(n).replace(/\d/g, (d) => '০১২৩৪৫৬৭৮৯'[d]);
const COPY = {
  hello: (part, name) => t(`Good ${part}, ${name} 👋`, `শুভ ${{ morning: 'সকাল', afternoon: 'দুপুর', evening: 'সন্ধ্যা' }[part]}, ${name} 👋`),
  sub: t("Here's your plan for today.", 'আজ কী করবে, এখানে দেওয়া আছে।'),
  streak: (n) => t(`🔥 ${n}-day streak`, `🔥 টানা ${n} দিন`),
  readiness: t('Exam readiness', 'পরীক্ষার প্রস্তুতি'),
  readinessParts: (c, m, p) => t(
    `Syllabus covered ${c ?? '—'}% · mastery ${m ?? '—'}% · PYQs ${p ?? '—'}%`,
    `সিলেবাস ${c ?? '—'}% · দক্ষতা ${m ?? '—'}% · আগের প্রশ্ন ${p ?? '—'}%`,
  ),
  readinessEmpty: t('Answer questions in your exam’s subjects and your readiness will show here.', 'তোমার পরীক্ষার বিষয়ে প্রশ্নের উত্তর দিলে এখানে প্রস্তুতি দেখাবে।'),
  readinessNoExam: t('Choose a target exam to see how close you are.', 'কতটা তৈরি, দেখতে একটি লক্ষ্য পরীক্ষা বেছে নাও।'),
  priorities: t('Top 3 priorities', 'সবচেয়ে জরুরি ৩টি'),
  noPriorities: t('Answer a few questions and your priorities will show up here.', 'কয়েকটি প্রশ্নের উত্তর দিলে এখানে তোমার অগ্রাধিকার দেখাবে।'),
  revision: t("Today's revision", 'আজকের রিভিশন'),
  continueLearning: t('Continue learning', 'পড়া চালিয়ে যাও'),
  exam: t('Exam practice', 'পরীক্ষার অনুশীলন'),
  basics: t('Learn Basics', 'বেসিক শেখো'),
  nothingYet: t('Pick an exam or start Learn Basics, and your place will be kept here.', 'একটা পরীক্ষা বা বেসিক শেখো শুরু করো, তোমার জায়গা এখানে মনে রাখা হবে।'),
  performance: t('Recent performance', 'সাম্প্রতিক ফল'),
  answeredToday: (n) => t(`${n} answered today`, `আজ ${bn(n)}টি উত্তর`),
  accuracy: (p) => t(`${p}% right overall`, `মোট ${bn(p)}% ঠিক`),
  mocks: (n, avg) => t(`${n} mock${n === 1 ? '' : 's'}${avg != null ? ` · avg ${avg}%` : ''}`, `${bn(n)}টি মক${avg != null ? ` · গড় ${bn(avg)}%` : ''}`),
  noPerformance: t('Your results will show here once you start practising.', 'অনুশীলন শুরু করলে এখানে তোমার ফল দেখাবে।'),
  fullProgress: t('My progress', 'আমার অগ্রগতি'),
  more: t('More', 'আরও'),
  explore: t('Browse all exams', 'সব পরীক্ষা দেখো'),
};
const partOfDay = () => {
  const h = new Date().getHours();
  return h < 12 ? 'morning' : h < 17 ? 'afternoon' : 'evening';
};
const card = 'rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6 dark:bg-slate-900 dark:ring-slate-800';
const h2 = 'text-lg font-bold text-slate-900 dark:text-white';

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

/** Where a Top-3 priority is studied: its lesson when not started, else practice. */
function priorityHref(p, today) {
  if (p.action === 'learn' || p.subject === 'gs') return chapterLink(p.subject, p.topic);
  const category = today?.exam?.category ?? (p.subject === 'reasoning' ? 'SSC' : null);
  return category ? paths.topic(category, p.subject, p.topic) : chapterLink(p.subject, p.topic);
}

/**
 * "/" for a signed-in student (Phase 12). Answers five questions at a glance:
 *   1. What exam am I preparing for?       My Target Exam
 *   2. How close am I to exam-ready?        Exam Readiness (server readiness, F9/F10 mastery inside)
 *   3. What should I study today?           Today's Study — the ONE server list (F3) and the
 *                                           primary action, Continue Studying
 *   4. What am I weak in?                   Top 3 Priorities (server-ranked, same engine as Today)
 *   5. How am I doing?                      Today's Revision, Continue Learning, Recent Performance
 * No charts, and no coins / badges / leaderboard / challenge competing with study.
 * Each block hides or falls back on its own if its data fails.
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

  const targetExam = user?.targetExam ?? null;
  const syllabusRes = useResource(
    targetExam && source.getTargetExamSyllabus ? `target-exam:syllabus:${targetExam.code}` : null,
    () => source.getTargetExamSyllabus(),
  );
  const syllabus = syllabusRes.status === 'ready' ? syllabusRes.data : null;

  // F7: offer the optional starting-level check once per exam (the server
  // remembers "Not now"); a failed load just hides the card.
  const diagRes = useResource(
    targetExam && source.getDiagnostic ? `diagnostic:${targetExam.code}` : null,
    () => source.getDiagnostic(),
  );
  const [diagSkipped, setDiagSkipped] = useState(false);
  const showDiagOffer = diagRes.status === 'ready' && diagRes.data?.offer && !diagSkipped;
  const skipDiag = () => {
    setDiagSkipped(true);
    Promise.resolve(source.skipDiagnostic?.()).catch(() => {});
    updateCachedResource(`diagnostic:${targetExam?.code}`, (data) => ({ ...data, state: 'skipped', offer: false }));
  };

  useEffect(() => {
    let alive = true;
    const opt = (fn) => (fn ? fn() : Promise.reject(new Error('unavailable')));
    Promise.allSettled([
      source.getInsights(),
      source.getReviewSummary(),
      source.getToday(),
      opt(source.getRevisionHub),
      opt(source.getPerformance),
    ]).then(([ins, rev, td, hub, perf]) => {
      if (!alive) return;
      const val = (r) => (r.status === 'fulfilled' ? r.value : null);
      setD({ insights: val(ins), review: val(rev), today: val(td), hub: val(hub), performance: val(perf), ready: true });
    });
    return () => {
      alive = false;
    };
  }, [source]);

  const exam = lastVisitedStore.get();
  const basics = lastChapter();
  const ins = d.insights;
  const firstName = user.name.split(/\s+/)[0];
  const today = d.today;
  const priorities = today?.topPriorities ?? [];

  // Days left: the server's countdown when present, else the chosen date against today.
  const daysLeft = syllabus?.countdown?.daysLeft ?? (targetExam?.date
    ? Math.ceil((new Date(targetExam.date).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0)) / 86_400_000)
    : null);
  const readiness = syllabus?.readiness ?? null;
  const examName = syllabus?.exam?.name ?? (targetExam ? targetExam.code.replace(/_/g, ' ') : null);

  // Today's revision: everything due across questions, GK facts and words (F13),
  // falling back to the question queue alone.
  const due = d.hub ? d.hub.dueToday : d.review ? { total: d.review.dueToday, questions: d.review.dueToday, gkFacts: 0, vocabulary: 0 } : null;
  const perf = d.performance?.summary ?? null;

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
        {ins?.streak && (
          <Localized value={COPY.streak(ins.streak.days)} className="rounded-full bg-amber-100 px-3 py-1.5 text-sm font-bold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300" />
        )}
      </header>

      {/* 1 + 2 — My Target Exam and Exam Readiness, side by side. */}
      {targetExam ? (
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <section className={card} aria-labelledby="target-exam-title">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 id="target-exam-title" className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <span aria-hidden="true">🎯 </span>
                  <Localized value={TARGET_EXAM.menu} />
                </h2>
                <p className="mt-1 truncate text-2xl font-extrabold text-slate-900 dark:text-white">
                  {examName && typeof examName === 'object' ? <Localized value={examName} /> : examName}
                </p>
                {daysLeft != null && (
                  <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                    {daysLeft === 0 ? <Localized value={TARGET_EXAM.examToday} /> : daysLeft < 0 ? <Localized value={TARGET_EXAM.examPassed} /> : <Localized value={TARGET_EXAM.daysLeft(daysLeft)} />}
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

          <section className={card} aria-labelledby="readiness-title">
            <h2 id="readiness-title" className="text-sm font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              <span aria-hidden="true">📊 </span>
              <Localized value={COPY.readiness} />
            </h2>
            {readiness?.score != null ? (
              <>
                <p className="mt-1 text-4xl font-extrabold tabular-nums text-slate-900 dark:text-white" data-testid="home-readiness">{readiness.score}%</p>
                <Localized
                  value={COPY.readinessParts(readiness.components?.coverage, readiness.components?.mastery, readiness.components?.pyq)}
                  as="p"
                  className="mt-1 text-sm text-slate-600 dark:text-slate-300"
                />
              </>
            ) : (
              <Localized value={COPY.readinessEmpty} as="p" className="mt-2 text-sm text-slate-600 dark:text-slate-300" />
            )}
          </section>
        </div>
      ) : (
        !promptDismissed && (
          <section className={`${card} mt-6`} aria-labelledby="target-exam-prompt-title">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="target-exam-prompt-title" className={h2}>
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

      {/* F7: Find My Starting Level, offered once for the target exam. */}
      {showDiagOffer && (
        <section className="mt-5 rounded-3xl bg-violet-50 p-5 shadow-sm ring-1 ring-violet-200 sm:p-6 dark:bg-violet-500/10 dark:ring-violet-500/30" aria-labelledby="diag-offer-title">
          <h2 id="diag-offer-title" className={h2}>
            <span aria-hidden="true">🧭 </span>
            <Localized value={DIAG.title} />
          </h2>
          <Localized
            value={diagRes.data.preview ? DIAG.offerBody(diagRes.data.preview.totalQuestions, diagRes.data.preview.minutes) : DIAG.offerShort}
            as="p"
            className="mt-1 text-sm text-slate-700 dark:text-slate-200"
          />
          <div className="mt-3 flex flex-wrap gap-3">
            <Link to="/starting-level" className="inline-flex min-h-10 items-center rounded-xl bg-violet-700 px-4 text-sm font-bold text-white hover:bg-violet-600">
              <Localized value={DIAG.start} />
            </Link>
            <button type="button" onClick={skipDiag} className="inline-flex min-h-10 items-center rounded-xl px-4 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-white dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-800">
              <Localized value={DIAG.notNow} />
            </button>
          </div>
        </section>
      )}

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.35fr_1fr]">
        {/* 3 — Today's Study: the ONE list from the server (F3), and the primary action. */}
        <section className={card} aria-labelledby="today-title">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 id="today-title" className={h2}>
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
              {today?.startingSignal?.used && (
                <Link to="/starting-level" className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-violet-700 hover:underline dark:text-violet-300">
                  🧭 <Localized value={DIAG.basedOnCheck} />
                </Link>
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
                className="mt-4 flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 text-lg font-bold text-white shadow-sm hover:bg-indigo-500"
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

        <div className="space-y-5">
          {/* 4 — Top 3 priorities: what I am weak in, ranked on the server. */}
          <section className={card} aria-labelledby="priorities-title">
            <h2 id="priorities-title" className={h2}>
              <span aria-hidden="true">🎯 </span>
              <Localized value={COPY.priorities} />
            </h2>
            {priorities.length ? (
              <ol className="mt-3 space-y-1">
                {priorities.map((p, i) => (
                  <li key={`${p.subject}.${p.topic}`}>
                    <Link to={priorityHref(p, today)} className="flex min-h-12 items-start gap-3 rounded-xl px-2 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-500/10">
                      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-indigo-100 text-sm font-bold text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-200" aria-hidden="true">{i + 1}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-slate-800 dark:text-slate-100">
                          <Localized value={p.subjectName} /> — <Localized value={p.name} />
                        </span>
                        <span className="mt-0.5 flex flex-wrap items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                          <StageChip stage={p.stage} />
                          <Localized value={p.reason} />
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            ) : (
              <Localized value={COPY.noPriorities} as="p" className="mt-2 text-sm text-slate-600 dark:text-slate-300" />
            )}
          </section>

          {/* Today's revision: one number, one link to the one Revision page (F13). */}
          {due && (
            <Link to="/revision" className="flex items-center gap-4 rounded-3xl bg-gradient-to-r from-emerald-500 to-teal-600 p-5 text-white shadow-sm hover:-translate-y-0.5 sm:p-6" aria-label={`${COPY.revision.en}: ${due.total ? REV.dueTotal(due.total).en : REV.nothingDue.en}`}>
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/20 text-2xl" aria-hidden="true">🔁</span>
              <span className="min-w-0 flex-1">
                <Localized value={COPY.revision} className="block text-sm font-semibold text-white/90" />
                <Localized value={due.total ? REV.dueTotal(due.total) : REV.nothingDue} className="block text-xl font-extrabold" />
              </span>
              <ArrowRightIcon />
            </Link>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        {/* Continue learning: where the student stopped. */}
        <section className={card} aria-labelledby="continue-title">
          <h2 id="continue-title" className={h2}>
            <span aria-hidden="true">▶️ </span>
            <Localized value={COPY.continueLearning} />
          </h2>
          {exam || basics ? (
            <div className="mt-3 grid gap-3">
              {basics && (
                <Link to={learnPaths.chapter(basics.subject, basics.topic)} className="rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100 hover:ring-emerald-300 dark:bg-emerald-500/10 dark:ring-emerald-500/20">
                  <Localized value={COPY.basics} as="p" className="text-xs font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-300" />
                  <Localized value={basics.title} as="p" className="mt-1 font-bold text-slate-900 dark:text-white" />
                </Link>
              )}
              {exam && (
                <Link to={paths.topic(exam.category, exam.subject, exam.topic)} className="rounded-2xl bg-indigo-50 p-4 ring-1 ring-indigo-100 hover:ring-indigo-300 dark:bg-indigo-500/10 dark:ring-indigo-500/20">
                  <Localized value={COPY.exam} as="p" className="text-xs font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-300" />
                  <Localized value={exam.names?.topic ?? { en: exam.topic }} as="p" className="mt-1 font-bold text-slate-900 dark:text-white" />
                  {exam.names?.category && <Localized value={exam.names.category} as="p" className="text-sm text-slate-500" />}
                </Link>
              )}
            </div>
          ) : (
            <Localized value={COPY.nothingYet} as="p" className="mt-2 text-slate-600 dark:text-slate-300" />
          )}
        </section>

        {/* Recent performance: a few numbers, no charts. */}
        <section className={card} aria-labelledby="performance-title">
          <div className="flex items-start justify-between gap-3">
            <h2 id="performance-title" className={h2}>
              <span aria-hidden="true">📈 </span>
              <Localized value={COPY.performance} />
            </h2>
            <Link to="/me" className="shrink-0 text-sm font-semibold text-indigo-700 hover:underline dark:text-indigo-300">
              <Localized value={COPY.fullProgress} /> →
            </Link>
          </div>
          {perf && perf.practiceAttempts > 0 ? (
            <ul className="mt-3 space-y-1.5 text-sm text-slate-700 dark:text-slate-200" data-testid="home-performance">
              <li><Localized value={COPY.answeredToday(perf.attemptedToday ?? 0)} /></li>
              {perf.practiceAccuracyPct != null && <li><Localized value={COPY.accuracy(perf.practiceAccuracyPct)} /></li>}
              {perf.mocksTaken > 0 && <li><Localized value={COPY.mocks(perf.mocksTaken, perf.avgMockScorePct)} /></li>}
            </ul>
          ) : (
            <Localized value={COPY.noPerformance} as="p" className="mt-2 text-sm text-slate-600 dark:text-slate-300" />
          )}
          {ins?.stageCounts && (
            <Link to="/mastery" className="mt-3 block rounded-xl bg-slate-50 px-3 py-2 text-sm hover:bg-indigo-50 dark:bg-slate-800/60 dark:hover:bg-indigo-500/10">
              <ul className="flex flex-wrap gap-x-4 gap-y-1 text-slate-600 dark:text-slate-300" data-testid="home-stage-counts">
                {['mastered', 'strong', 'developing', 'practising'].map((s) => (
                  <li key={s} className="inline-flex items-center gap-1.5">
                    <span className="tabular-nums font-bold">{ins.stageCounts[s] ?? 0}</span> <Localized value={MASTERY.stage[s]} />
                  </li>
                ))}
              </ul>
            </Link>
          )}
        </section>
      </div>

      <nav aria-label={COPY.more.en} className="mt-5 flex flex-wrap gap-2 text-sm font-semibold">
        {[
          [paths.exams(), '📚', COPY.explore],
          ['/learn', '🌱', COPY.basics],
          ['/mastery', '🗺️', MASTERY.title],
        ].map(([to, icon, label]) => (
          <Link key={to} to={to} className="flex min-h-11 items-center gap-2 rounded-xl bg-white px-3 ring-1 ring-slate-200 hover:ring-indigo-300 dark:bg-slate-900 dark:ring-slate-800">
            <span aria-hidden="true">{icon}</span>
            <Localized value={label} />
          </Link>
        ))}
      </nav>
    </PageShell>
  );
}

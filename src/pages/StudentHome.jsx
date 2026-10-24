import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDataSource } from '../app/DataSourceContext';
import { useStudyProgress } from '../hooks/useStudyProgress';
import PageShell from '../components/navigation/PageShell';
import { patternLink } from '../components/review/InsightsPanel';
import { Localized } from '../components/topic-hub/Localized';
import { ArrowRightIcon, CheckIcon } from '../components/topic-hub/icons';
import { lastVisitedStore } from '../lib/lastVisited';
import { lastChapter } from '../lib/learnProgress';
import { playedOnDevice } from './ChallengePage';
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
  plan: t("Today's plan", 'আজকের পরিকল্পনা'),
  planRevise: (n) => t(`Revise ${n} ${n === 1 ? 'question' : 'questions'} from your queue`, `তালিকা থেকে ${n}টি প্রশ্ন রিভিশন করো`),
  planRevised: t('Revision done for today', 'আজকের রিভিশন শেষ'),
  planChallenge: t('Play the daily challenge (5 questions)', 'দৈনিক চ্যালেঞ্জ খেলো (5টি প্রশ্ন)'),
  planChallengeDone: (c, n) => t(`Daily challenge done: ${c}/${n}`, `দৈনিক চ্যালেঞ্জ হয়ে গেছে: ${c}/${n}`),
  // name: a localized { en, bn } chapter or pattern name.
  planPattern: (name) => t(`Practise 10 questions: ${name.en}`, `10টি প্রশ্ন অনুশীলন: ${name.bn ?? name.en}`),
  planChapter: (name) => t(`Practise ${name.en}`, `${name.bn ?? name.en} অনুশীলন করো`),
  planGoal: (a, g) => t(`Answer ${g} questions today (${Math.min(a, g)}/${g})`, `আজ ${g}টি প্রশ্নের উত্তর দাও (${Math.min(a, g)}/${g})`),
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

function PlanItem({ done, to, children }) {
  const body = (
    <>
      <span className={`grid size-7 shrink-0 place-items-center rounded-full ring-2 ${done ? 'bg-emerald-500 text-white ring-emerald-500' : 'ring-slate-300 dark:ring-slate-600'}`} aria-hidden="true">
        {done && <CheckIcon width={14} height={14} strokeWidth={3} />}
      </span>
      <span className={`min-w-0 flex-1 font-semibold ${done ? 'text-slate-400 line-through dark:text-slate-500' : 'text-slate-800 dark:text-slate-100'}`}>{children}</span>
      {!done && to && <ArrowRightIcon className="shrink-0 text-indigo-500" />}
      <span className="sr-only">{done ? '(done)' : ''}</span>
    </>
  );
  return (
    <li>
      {to && !done ? (
        <Link to={to} className="flex min-h-12 items-center gap-3 rounded-xl px-3 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-500/10">
          {body}
        </Link>
      ) : (
        <div className="flex min-h-12 items-center gap-3 px-3 py-2">{body}</div>
      )}
    </li>
  );
}

/**
 * "/" for a signed-in student: greeting and streak, continue where you left
 * off, today's plan (revision, daily challenge, weakest pattern, daily goal),
 * weakest spot, and a mastery snapshot. Each block hides itself if its data fails.
 */
export default function StudentHome({ user }) {
  const source = useDataSource();
  const { dailyGoal } = useStudyProgress();
  const [d, setD] = useState({});

  useEffect(() => {
    let alive = true;
    Promise.allSettled([source.getInsights(), source.getReviewSummary(), source.getChallenge()]).then(([ins, rev, ch]) => {
      if (!alive) return;
      setD({
        insights: ins.status === 'fulfilled' ? ins.value : null,
        review: rev.status === 'fulfilled' ? rev.value : null,
        challenge: ch.status === 'fulfilled' ? ch.value : null,
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
  const challengeDone = d.challenge ? d.challenge.done ?? playedOnDevice(d.challenge.day) : null;
  const answered = ins?.today?.answered ?? 0;
  const firstName = user.name.split(/\s+/)[0];

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
          {/* Today's plan */}
          <section className={card} aria-labelledby="plan-title">
            <h2 id="plan-title" className="text-lg font-bold text-slate-900 dark:text-white">
              <span aria-hidden="true">📋 </span>
              <Localized value={COPY.plan} />
            </h2>
            {!d.ready ? (
              <div className="mt-4 h-40 animate-pulse rounded-xl bg-slate-100 motion-reduce:animate-none dark:bg-slate-800" aria-busy="true" />
            ) : (
              <ul className="mt-3 space-y-1">
                {d.review && (d.review.active > 0 || d.review.mastered > 0) && (
                  <PlanItem done={d.review.dueToday === 0} to="/revise">
                    <Localized value={d.review.dueToday ? COPY.planRevise(d.review.dueToday) : COPY.planRevised} />
                  </PlanItem>
                )}
                {d.challenge && (
                  <PlanItem done={Boolean(challengeDone)} to="/challenge">
                    <Localized value={challengeDone ? COPY.planChallengeDone(challengeDone.correct, challengeDone.total) : COPY.planChallenge} />
                  </PlanItem>
                )}
                {weak && (
                  <PlanItem to={patternLink(weak, true)}>
                    <Localized value={COPY.planPattern(weak.patternName)} />
                  </PlanItem>
                )}
                {!weak && weakChapter && (
                  <PlanItem to={paths.topic(weakChapter.category, weakChapter.subject, weakChapter.topic)}>
                    <Localized value={COPY.planChapter(weakChapter.name)} />
                  </PlanItem>
                )}
                <PlanItem done={answered >= dailyGoal} to={exam ? paths.topic(exam.category, exam.subject, exam.topic) : paths.exams()}>
                  <Localized value={COPY.planGoal(answered, dailyGoal)} />
                  <span className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" aria-hidden="true">
                    <span className="block h-full rounded-full bg-indigo-500" style={{ width: `${Math.min(100, (answered / dailyGoal) * 100)}%` }} />
                  </span>
                </PlanItem>
              </ul>
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

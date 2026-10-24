import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useOptionalAuth } from '../app/AuthContext';
import { useDataSource } from '../app/DataSourceContext';
import { useResource } from '../hooks/useResource';
import { FEATURES, HOME, STEPS } from '../lib/homeCopy';
import { LEARN } from '../lib/learnCopy';
import { learnPaths, paths } from '../lib/routes';
import PageShell from '../components/navigation/PageShell';
import ReviseTodayCard from '../components/review/ReviseTodayCard';
import DailyChallengeCard from '../components/review/DailyChallengeCard';
import StudentHome from './StudentHome';
import { Localized } from '../components/topic-hub/Localized';
import { ArrowRightIcon } from '../components/topic-hub/icons';

const t = (en, bn) => ({ en, bn });

const EXAMS = [
  { code: 'SSC', name: t('SSC', 'SSC'), sub: t('CGL · CHSL · MTS', 'CGL · CHSL · MTS'), bar: 'from-indigo-500 to-violet-500' },
  { code: 'BANK', name: t('Banking', 'ব্যাঙ্কিং'), sub: t('PO · Clerk (IBPS & SBI)', 'PO · ক্লার্ক (IBPS ও SBI)'), bar: 'from-emerald-500 to-teal-500' },
  { code: 'WBPSC', name: t('WBPSC', 'WBPSC'), sub: t('WBCS · Clerkship · Misc', 'WBCS · ক্লার্কশিপ · মিসেলেনিয়াস'), bar: 'from-amber-500 to-orange-500' },
  { code: 'WB_POST', name: t('WB Post Office', 'WB পোস্ট অফিস'), sub: t('India Post, West Bengal Circle', 'ইন্ডিয়া পোস্ট, পশ্চিমবঙ্গ সার্কেল'), bar: 'from-rose-500 to-pink-500' },
];

const SUBJECTS = [
  { code: 'quant', emoji: '🔢', title: t('Math', 'গণিত'), blurb: t('Numbers, percentage, profit & loss, speed, area and more.', 'সংখ্যা, শতকরা, লাভ-ক্ষতি, গতি, ক্ষেত্রফল এবং আরও অনেক কিছু।'), card: 'from-indigo-500 to-violet-600' },
  { code: 'english', emoji: '🔤', title: t('English', 'ইংরেজি'), blurb: t('Grammar, words, idioms, reading and correcting sentences.', 'ব্যাকরণ, শব্দভান্ডার, বাগধারা, পাঠ বোঝা ও বাক্য সংশোধন।'), card: 'from-emerald-500 to-teal-600' },
];

const btnPrimary =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-6 text-base font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:-translate-y-0.5 hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 motion-reduce:transition-none';
const btnGhost =
  'inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-base font-semibold text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-50 dark:bg-slate-900 dark:text-indigo-300 dark:ring-indigo-800';

/** Learn Basics on the home page: what it is, then the two subjects. */
function LearnBasicsSection() {
  const source = useDataSource();
  const { data } = useResource('learn:subjects', () => source.listLearnSubjects());
  const counts = Object.fromEntries((data?.subjects || []).map((s) => [s.code, s]));
  return (
    <section id="learn-basics" className="mx-auto max-w-6xl scroll-mt-28 px-4 pb-14">
      <div className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        <div className="grid gap-8 p-6 sm:p-10 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <Localized value={HOME.learnBadge} className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800 dark:bg-amber-500/15 dark:text-amber-300" />
            <Localized value={HOME.learnTitle} as="h2" className="mt-4 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl dark:text-white" />
            <Localized value={HOME.learnBody} as="p" className="mt-3 leading-relaxed text-slate-600 dark:text-slate-300" />
            <ul className="mt-5 grid gap-2.5 sm:grid-cols-2">
              {HOME.learnPoints.map((p) => (
                <li key={p.icon} className="flex items-start gap-2.5 rounded-xl bg-slate-50 p-3 text-sm font-medium text-slate-700 dark:bg-slate-950 dark:text-slate-200">
                  <span className="text-lg leading-none" aria-hidden="true">{p.icon}</span>
                  <Localized value={p.text} />
                </li>
              ))}
            </ul>
            <Link to="/learn" className={`${btnPrimary} mt-6`}>
              <Localized value={HOME.learnCta} />
              <ArrowRightIcon />
            </Link>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {SUBJECTS.map((s) => {
              const c = counts[s.code];
              return (
                <li key={s.code}>
                  <Link
                    to={learnPaths.subject(s.code)}
                    className={`group flex h-full items-center gap-4 rounded-2xl bg-gradient-to-br ${s.card} p-5 text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-indigo-400 motion-reduce:transition-none`}
                  >
                    <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-white/20 text-3xl" aria-hidden="true">{s.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <Localized value={s.title} as="h3" className="text-xl font-extrabold" />
                      <Localized value={s.blurb} as="p" className="mt-0.5 text-sm text-white/90" />
                      {c && <Localized value={LEARN.chapters(c.chapterCount)} as="p" className="mt-2 text-xs font-bold uppercase tracking-wide text-white/80" />}
                    </div>
                    <ArrowRightIcon className="shrink-0 transition-transform group-hover:translate-x-1" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}

/** "/": a signed-in student's dashboard (StudentHome); for visitors, what the site is, Learn Basics, how it works and the exam families. */
export default function HomePage() {
  const auth = useOptionalAuth();
  const { hash } = useLocation();
  const signedIn = Boolean(auth?.user);

  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [hash]);

  // Signed-in students get their own home: today's plan, not the marketing page.
  // A link to a section (/#learn-basics) still opens the full page.
  if (auth?.status === 'loading') return <PageShell className="max-w-6xl pt-10"><div className="h-64 animate-pulse rounded-3xl bg-slate-200/60 motion-reduce:animate-none dark:bg-slate-800/60" aria-busy="true" /></PageShell>;
  if (auth?.user && !hash) return <StudentHome user={auth.user} />;

  return (
    <PageShell padded={false}>
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-b from-indigo-100/70 via-violet-50/40 to-transparent dark:from-indigo-950/50 dark:via-transparent" />
        <div className="relative mx-auto max-w-4xl px-4 pb-14 pt-14 text-center sm:pt-20">
          <Localized value={HOME.badge} className="inline-block rounded-full bg-white px-4 py-1.5 text-xs font-semibold text-indigo-700 shadow-sm ring-1 ring-indigo-100 dark:bg-slate-900 dark:text-indigo-300 dark:ring-indigo-900" />
          <h1 className="mt-5 text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl dark:text-white">
            <Localized value={HOME.title} />{' '}
            <Localized value={HOME.titleAccent} className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent" />
          </h1>
          <Localized value={HOME.subtitle} as="p" className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-300" />
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to={paths.exams()} className={btnPrimary}>
              <Localized value={HOME.ctaStart} />
              <ArrowRightIcon />
            </Link>
            <Link to="/learn" className={btnGhost}>
              <span aria-hidden="true">🌱</span>
              <Localized value={HOME.learnCta} />
            </Link>
            {!signedIn && (
              <Link to="/register" className="text-sm font-semibold text-indigo-700 underline-offset-4 hover:underline dark:text-indigo-300 sm:ml-2">
                <Localized value={HOME.ctaRegister} />
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Signed-in students with a revision queue: the daily habit comes first. */}
      <ReviseTodayCard className="mx-auto max-w-6xl px-4 pb-6" />
      <DailyChallengeCard className="mx-auto max-w-6xl px-4 pb-10" />

      <section className="mx-auto max-w-6xl px-4 pb-14">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <Localized value={HOME.examsTitle} as="h2" className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white" />
            <Localized value={HOME.examsSub} as="p" className="mt-1 text-slate-600 dark:text-slate-300" />
          </div>
          <Link to={paths.exams()} className="text-sm font-semibold text-indigo-600 hover:underline dark:text-indigo-400">
            <Localized value={HOME.viewAll} /> →
          </Link>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {EXAMS.map((e) => (
            <li key={e.code}>
              <Link
                to={paths.category(e.code)}
                className="group relative block h-full overflow-hidden rounded-2xl bg-white p-5 pt-6 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-lg dark:bg-slate-900 dark:ring-slate-800 motion-reduce:transition-none"
              >
                <span aria-hidden="true" className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${e.bar}`} />
                <Localized value={e.name} as="h3" className="text-xl font-bold text-slate-900 dark:text-white" />
                <Localized value={e.sub} as="p" className="mt-1 text-sm text-slate-500 dark:text-slate-400" />
                <ArrowRightIcon className="mt-5 text-slate-400 transition-transform group-hover:translate-x-1 group-hover:text-indigo-600" />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <LearnBasicsSection />

      <section id="how-it-works" className="mx-auto max-w-6xl scroll-mt-28 px-4 pb-14">
        <div className="text-center">
          <Localized value={HOME.howTitle} as="h2" className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white" />
          <Localized value={HOME.howSub} as="p" className="mt-2 text-slate-600 dark:text-slate-300" />
        </div>
        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s) => (
            <li key={s.icon} className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
              <span className="grid size-12 place-items-center rounded-xl bg-indigo-50 text-2xl dark:bg-indigo-500/10" aria-hidden="true">{s.icon}</span>
              <Localized value={s.title} as="h3" className="mt-4 font-bold text-slate-900 dark:text-white" />
              <Localized value={s.body} as="p" className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-300" />
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-14">
        <Localized value={HOME.featuresTitle} as="h2" className="text-center text-3xl font-bold tracking-tight text-slate-900 dark:text-white" />
        <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <li key={f.icon} className="flex gap-4 rounded-2xl bg-white p-5 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
              <span className="text-2xl" aria-hidden="true">{f.icon}</span>
              <div>
                <Localized value={f.title} as="h3" className="font-bold text-slate-900 dark:text-white" />
                <Localized value={f.body} as="p" className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300" />
              </div>
            </li>
          ))}
        </ul>
      </section>

      {!signedIn && (
        <section className="mx-auto max-w-4xl px-4 pb-20">
          <div className="rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 p-8 text-center text-white shadow-xl shadow-indigo-500/20 sm:p-12">
            <Localized value={HOME.finalTitle} as="h2" className="text-2xl font-bold sm:text-3xl" />
            <Localized value={HOME.finalBody} as="p" className="mx-auto mt-3 max-w-xl text-indigo-100" />
            <Link to="/register" className="mt-6 inline-flex min-h-12 items-center rounded-xl bg-white px-6 font-semibold text-indigo-700 hover:bg-indigo-50">
              <Localized value={HOME.ctaRegister} />
            </Link>
          </div>
        </section>
      )}
    </PageShell>
  );
}

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';
import { useDataSource } from '../app/DataSourceContext';
import { useResource } from '../hooks/useResource';
import { languageStore } from '../hooks/useLanguagePreference';
import ExamInfoPanel from '../components/exam-info/ExamInfoPanel';
import IdoTest from '../components/ido/IdoTest';
import { Localized } from '../components/topic-hub/Localized';
import { LoadError } from './funnel/FunnelLayout';
import { box } from '../components/plan/PlanParts';
import { chapterLink } from '../lib/studyPlan';
import { IDO_UI, IDO_STRATEGY } from '../lib/idoCopy';

const ADVT_URL = 'https://psc.wb.gov.in/Download?param1=Cur_20261105212424_DetailedAdvtIDO152024.pdf&param2=advertisement';
const APPLY_CLOSE = new Date('2026-11-26T15:00:00+05:30');
const IDO_TOPICS = [
  ['gs', 'industrial_safety'], ['gs', 'environment'], ['gs', 'general_science'], ['gs', 'wb_industry'], ['gs', 'computer_awareness'],
  ['gs', 'economy'], ['gs', 'west_bengal_gk'],
  ['english', 'grammar'], ['english', 'one_word_substitution'], ['english', 'synonyms_antonyms'], ['english', 'fill_blanks'],
  ['english', 'idioms_phrases'], ['english', 'error_spotting'], ['english', 'sentence_improvement'], ['english', 'reading_comprehension'],
  ['quant', 'number_system'], ['quant', 'percentage'], ['quant', 'simplification'], ['quant', 'ratio_proportion'], ['quant', 'average'],
  ['quant', 'profit_loss'], ['quant', 'interest'], ['quant', 'time_work'], ['quant', 'time_speed_distance'], ['quant', 'algebra'],
  ['reasoning', 'series'], ['reasoning', 'coding_decoding'], ['reasoning', 'analogy'], ['reasoning', 'blood_relations'],
  ['reasoning', 'direction_sense'], ['reasoning', 'syllogism'],
];

/**
 * /ido: the IDO complete exam-preparation dashboard — official pattern and
 * eligibility (from the catalogue's exam entry), the seven sections with
 * sectional tests, the full mock, the study plan, the real 2019 paper,
 * readiness and weak topics from the student's own work, and exam strategy.
 */
export default function IdoDashboardPage() {
  const source = useDataSource();
  const { user } = useAuth() ?? {};
  const [test, setTest] = useState(null); // { createTest } while a test is open

  const categories = useResource('categories:en', () => source.listCategories('en'));
  const wbpsc = categories.data?.categories?.find((c) => c.code === 'WBPSC');
  const idoExam = wbpsc?.exams?.filter((e) => e.code === 'WBPSC_IDO');

  const planRes = useResource('ido:sections', () => source.getIdoPlan(60, 180));
  const sections = planRes.data?.sections ?? [];

  const perf = useResource(user ? 'ido:performance' : 'ido:performance:guest', () => (user ? source.getPerformance() : Promise.resolve(null)));
  const progress = useResource(user ? 'ido:progress' : 'ido:progress:guest', () => (user ? source.getIdoProgress() : Promise.resolve({ progress: null })));
  const progDays = progress.data?.progress?.days ?? null;
  const progBudget = progress.data?.progress?.budget ?? 180;
  const planForProgress = useResource(`ido:planfp:${progDays}:${progBudget}`, () => (progDays ? source.getIdoPlan(progDays, progBudget) : Promise.resolve(null)));
  const learnProgress = useResource(user ? 'ido:learn-progress' : 'ido:learn-progress:guest', () => (user ? source.getLearnProgress() : Promise.resolve({ progress: {} })));
  const pyqFilters = useResource('pyq:filters', () => source.getPyqFilters());
  const idoPaper = pyqFilters.data?.exams?.find((e) => /industrial development officer/i.test(e.name));
  const idoPaperCount = idoPaper?.papers?.reduce((a, p) => a + (p.count ?? 0), 0) ?? idoPaper?.count ?? 0;

  const stats = useMemo(() => {
    const p = perf.data;
    const prog = progress.data?.progress;
    const lp = learnProgress.data?.progress ?? {};
    const covered = IDO_TOPICS.filter(([s, tpc]) => Object.keys(lp).some((k) => k.startsWith(`${s}.${tpc}.`))).length;
    const planDone = prog ? (prog.done?.length ?? 0) : 0;
    const totalTasks = planForProgress.data?.days?.reduce((a, d) => a + d.tasks.length, 0) ?? 0;
    const planPct = totalTasks ? Math.round((planDone / totalTasks) * 100) : 0;
    const planTests = prog ? Object.values(prog.tests ?? {}) : [];
    const mockAccs = planTests.filter((x) => x.kind === 'full_mock' && x.total).map((x) => Math.round((x.correct / x.total) * 100));
    const coveragePct = Math.round((covered / IDO_TOPICS.length) * 100);
    const accuracyPct = p?.summary?.practiceAccuracyPct ?? 0;
    const readiness = Math.round(0.35 * coveragePct + 0.35 * accuracyPct + 0.15 * planPct + 0.15 * (mockAccs.length ? Math.max(...mockAccs) : 0));
    return {
      covered, coveragePct, accuracyPct,
      practiceAttempts: p?.summary?.practiceAttempts ?? 0,
      mocksTaken: planTests.filter((x) => x.kind === 'full_mock').length,
      readiness: user ? readiness : 0,
      planPct,
      weak: (p?.weakTopics ?? []).slice(0, 3),
      strong: (p?.subjects ?? []).filter((s) => s.accuracyPct >= 75 && s.attempts >= 10),
    };
  }, [perf.data, progress.data, learnProgress.data, planForProgress.data, user]);

  const daysLeft = Math.max(0, Math.ceil((APPLY_CLOSE - Date.now()) / 86400000));

  return (
    <main className="mx-auto w-full max-w-5xl space-y-5 px-4 py-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">🏛️ <Localized value={IDO_UI.title} /></h1>
        <Localized value={IDO_UI.subtitle} as="p" className="text-sm text-slate-600 dark:text-slate-300" />
        <p className="rounded-2xl bg-amber-50 p-3 text-sm text-amber-900 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/30">
          <Localized value={IDO_UI.applyBy} />{' '}
          <a href={ADVT_URL} target="_blank" rel="noreferrer" className="font-semibold underline"><Localized value={IDO_UI.officialSite} /></a>
          {daysLeft > 0 && <span className="ml-2 font-bold tabular-nums">{daysLeft} <Localized value={IDO_UI.daysLeft} /></span>}
        </p>
      </header>

      {test && (
        <section className={box}>
          <IdoTest createTest={test.createTest} onClose={() => setTest(null)} />
        </section>
      )}

      <section className={box}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Localized value={IDO_UI.readiness} as="h2" className="text-lg font-bold text-slate-900 dark:text-white" />
            <Localized value={IDO_UI.readinessHow} as="p" className="mt-1 max-w-xl text-xs text-slate-500 dark:text-slate-400" />
          </div>
          <p className="text-4xl font-black tabular-nums text-indigo-600 dark:text-indigo-400">{stats.readiness}%</p>
        </div>
        <div className="mt-3 h-3 rounded-full bg-slate-100 dark:bg-slate-800">
          <div className={`h-3 rounded-full ${stats.readiness >= 70 ? 'bg-emerald-500' : stats.readiness >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${stats.readiness}%` }} />
        </div>
        <ul className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <li className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60"><p className="text-xs text-slate-500"><Localized value={IDO_UI.coverage} /></p><p className="mt-0.5 font-bold tabular-nums">{stats.covered}/{IDO_TOPICS.length} · {stats.coveragePct}%</p></li>
          <li className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60"><p className="text-xs text-slate-500"><Localized value={IDO_UI.practiceQs} /></p><p className="mt-0.5 font-bold tabular-nums">{stats.practiceAttempts}</p></li>
          <li className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60"><p className="text-xs text-slate-500"><Localized value={IDO_UI.avgAccuracy} /></p><p className="mt-0.5 font-bold tabular-nums">{stats.accuracyPct}%</p></li>
          <li className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60"><p className="text-xs text-slate-500"><Localized value={IDO_UI.mocksTaken} /></p><p className="mt-0.5 font-bold tabular-nums">{stats.mocksTaken}</p></li>
        </ul>
        {!user && <Localized value={IDO_UI.signInNote} as="p" className="mt-3 text-xs text-slate-500 dark:text-slate-400" />}
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(19rem,24rem)]">
        <section className={box}>
          <Localized value={IDO_UI.sectionsTitle} as="h2" className="text-lg font-bold text-slate-900 dark:text-white" />
          <Localized value={IDO_UI.sectionsNote} as="p" className="mt-1 text-xs text-slate-500 dark:text-slate-400" />
          {planRes.status === 'error' ? <LoadError error={planRes.error} onRetry={planRes.retry} /> : (
            <ul className="mt-3 divide-y divide-slate-100 dark:divide-slate-800">
              {sections.map((s) => (
                <li key={s.key} className="flex flex-wrap items-center gap-2 py-3">
                  <div className="min-w-0 flex-1">
                    <Localized value={s.title} className="font-semibold text-slate-900 dark:text-white" />
                    <p className="text-xs tabular-nums text-slate-500"><Localized value={IDO_UI.marks(s.count)} /></p>
                  </div>
                  <Link to={s.topic ? chapterLink(s.subject, s.topic) : `/learn/${s.subject}`} className="inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-semibold text-indigo-700 ring-1 ring-slate-200 hover:bg-indigo-50 dark:text-indigo-300 dark:ring-slate-700">
                    <Localized value={IDO_UI.learn} />
                  </Link>
                  <button type="button" onClick={() => setTest({ createTest: (src) => src.createIdoSectional(s.key, { language: languageStore.get() }) })} className="inline-flex min-h-10 items-center rounded-lg bg-emerald-600 px-3 text-sm font-bold text-white hover:bg-emerald-500">
                    <Localized value={IDO_UI.sectionalTest} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <button type="button" onClick={() => setTest({ createTest: (src) => src.createIdoFullMock({ language: languageStore.get() }) })} className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-500">
            <Localized value={IDO_UI.fullMock} />
          </button>
        </section>

        {wbpsc && idoExam?.length > 0 && (
          <ExamInfoPanel category="WBPSC" exams={idoExam} website={wbpsc.website} subjects={wbpsc.subjects} />
        )}
      </div>

      <section className={box}>
        <Localized value={IDO_UI.planTitle} as="h2" className="text-lg font-bold text-slate-900 dark:text-white" />
        <Localized value={IDO_UI.planBlurb} as="p" className="mt-1 text-sm text-slate-600 dark:text-slate-300" />
        <Link to="/plan/ido" className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-500">
          <Localized value={IDO_UI.openPlan} />
        </Link>
      </section>

      <section className={box}>
        <Localized value={IDO_UI.pyqTitle} as="h2" className="text-lg font-bold text-slate-900 dark:text-white" />
        <Localized value={IDO_UI.pyqBlurb} as="p" className="mt-1 text-sm text-slate-600 dark:text-slate-300" />
        <p className="mt-2 text-sm font-semibold tabular-nums text-slate-800 dark:text-slate-100">
          <Localized value={IDO_UI.pyqSolved} />: {idoPaperCount}
        </p>
        <Link to="/pyq?exam=Industrial%20Development%20Officer&year=2019" className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-500">
          <Localized value={IDO_UI.openPyq} />
        </Link>
        <Localized value={IDO_UI.pyqStyleNote} as="p" className="mt-2 text-xs text-slate-500 dark:text-slate-400" />
      </section>

      <section className={box}>
        <Localized value={IDO_UI.weakTitle} as="h2" className="text-lg font-bold text-slate-900 dark:text-white" />
        {stats.weak.length === 0 ? (
          <Localized value={IDO_UI.noWeak} as="p" className="mt-1 text-sm text-slate-600 dark:text-slate-300" />
        ) : (
          <ul className="mt-2 space-y-2">
            {stats.weak.map((w) => (
              <li key={`${w.subject}.${w.topic}`} className="rounded-xl bg-rose-50 p-3 text-sm ring-1 ring-rose-200 dark:bg-rose-500/10 dark:ring-rose-500/30">
                <Link to={chapterLink(w.subject, w.topic, 'revision')} className="font-bold text-rose-900 underline dark:text-rose-200"><Localized value={w.name} /></Link>
                <span className="ml-2 tabular-nums text-rose-800 dark:text-rose-300">{w.accuracyPct}% · {w.attempts}</span>
                <span className="block text-xs text-rose-700 dark:text-rose-300"><Localized value={IDO_UI.weakAction(w.name?.en ?? w.topic)} /></span>
              </li>
            ))}
          </ul>
        )}
        {stats.strong.length > 0 && (
          <p className="mt-3 text-sm text-emerald-800 dark:text-emerald-300">
            <Localized value={IDO_UI.strongTitle} />: {stats.strong.map((s, i) => <span key={s.subject}>{i > 0 && ', '}<Localized value={s.name} /> {s.accuracyPct}%</span>)}
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-2 text-sm font-semibold">
          <Link to="/mistakes" className="rounded-lg px-3 py-2 text-indigo-700 ring-1 ring-slate-200 hover:bg-indigo-50 dark:text-indigo-300 dark:ring-slate-700"><Localized value={IDO_UI.mistakesLink} /></Link>
          <Link to="/revision" className="rounded-lg px-3 py-2 text-indigo-700 ring-1 ring-slate-200 hover:bg-indigo-50 dark:text-indigo-300 dark:ring-slate-700"><Localized value={IDO_UI.revisionLink} /></Link>
          <Link to="/me" className="rounded-lg px-3 py-2 text-indigo-700 ring-1 ring-slate-200 hover:bg-indigo-50 dark:text-indigo-300 dark:ring-slate-700"><Localized value={IDO_UI.analyticsLink} /></Link>
        </div>
      </section>

      <section className={box}>
        <Localized value={IDO_UI.customTitle} as="h2" className="text-lg font-bold text-slate-900 dark:text-white" />
        <Localized value={IDO_UI.customBlurb} as="p" className="mt-1 text-sm text-slate-600 dark:text-slate-300" />
        <div className="mt-3 flex flex-wrap gap-2">
          {sections.map((s) => (
            <Link key={s.key} to={s.topic ? chapterLink(s.subject, s.topic) : `/learn/${s.subject}`} className="inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-semibold text-indigo-700 ring-1 ring-slate-200 hover:bg-indigo-50 dark:text-indigo-300 dark:ring-slate-700">
              <Localized value={s.title} />
            </Link>
          ))}
        </div>
      </section>

      <section className={box}>
        <Localized value={IDO_UI.updatesTitle} as="h2" className="text-lg font-bold text-slate-900 dark:text-white" />
        <Localized value={IDO_UI.updatesBlurb} as="p" className="mt-1 text-sm text-slate-600 dark:text-slate-300" />
        <div className="mt-3 flex flex-wrap gap-2">
          <Link to={chapterLink('gs', 'wb_industry')} className="inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-semibold text-indigo-700 ring-1 ring-slate-200 hover:bg-indigo-50 dark:text-indigo-300 dark:ring-slate-700">🏭 WB Industry</Link>
          <Link to={chapterLink('gs', 'environment')} className="inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-semibold text-indigo-700 ring-1 ring-slate-200 hover:bg-indigo-50 dark:text-indigo-300 dark:ring-slate-700">🌱 Environment & Energy</Link>
          <Link to={chapterLink('gs', 'economy')} className="inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-semibold text-indigo-700 ring-1 ring-slate-200 hover:bg-indigo-50 dark:text-indigo-300 dark:ring-slate-700">📈 Economy</Link>
          <Link to="/learn/gk/revision" className="inline-flex min-h-10 items-center rounded-lg px-3 text-sm font-semibold text-indigo-700 ring-1 ring-slate-200 hover:bg-indigo-50 dark:text-indigo-300 dark:ring-slate-700">🗂️ GK Revision</Link>
        </div>
      </section>

      <section className={box}>
        <Localized value={IDO_UI.strategyTitle} as="h2" className="text-lg font-bold text-slate-900 dark:text-white" />
        <div className="mt-2 space-y-2">
          {IDO_STRATEGY.map((block, i) => (
            <details key={i} className="rounded-xl ring-1 ring-slate-200 dark:ring-slate-800" open={i === 0}>
              <summary className="cursor-pointer px-4 py-3 font-semibold text-slate-900 dark:text-white"><Localized value={block.title} /></summary>
              <ul className="ml-8 list-disc space-y-1.5 px-4 pb-4 text-sm text-slate-700 dark:text-slate-200">
                {block.points.map((pt, j) => <li key={j}><Localized value={pt} /></li>)}
              </ul>
            </details>
          ))}
        </div>
      </section>
    </main>
  );
}

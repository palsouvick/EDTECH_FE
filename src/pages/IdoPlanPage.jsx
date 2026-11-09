import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';
import { useDataSource } from '../app/DataSourceContext';
import { useResource } from '../hooks/useResource';
import { languageStore } from '../hooks/useLanguagePreference';
import { preferencesAllowed } from '../lib/consent';
import IdoTest from '../components/ido/IdoTest';
import { Localized } from '../components/topic-hub/Localized';
import { LoadError } from './funnel/FunnelLayout';
import { TaskCard, box } from '../components/plan/PlanParts';
import { PLAN, PLAN_UI } from '../lib/planCopy';
import { IDO_UI } from '../lib/idoCopy';

const LOCAL_KEY = 'edtech:ido-plan';
const DURATIONS = [30, 45, 60];
const BUDGETS = [120, 180, 240, 360];
const todayLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const dayDiff = (a, b) => Math.round((Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 86400000);

function readLocal() {
  try {
    const v = JSON.parse(window.localStorage.getItem(LOCAL_KEY));
    return v && typeof v === 'object' ? v : null;
  } catch { return null; }
}
function writeLocal(p) {
  if (!preferencesAllowed()) return;
  try { window.localStorage.setItem(LOCAL_KEY, JSON.stringify(p)); } catch { /* storage full/blocked */ }
}
const EMPTY = { status: 'empty', startDate: null, done: new Set(), budget: 180, days: 60, examDate: null, tests: {} };
const fromStored = (p) => (p ? { status: 'ready', startDate: p.startDate, done: new Set(p.done ?? []), budget: p.budget ?? 180, days: p.days ?? 60, examDate: p.examDate ?? null, tests: p.tests ?? {} } : EMPTY);

/**
 * /plan/ido: the IDO study plan at 30, 45 or 60 days. Same contract as the
 * Clerkship plan page: the layout comes from the server, progress is the
 * signed-in student's (guests keep it on this device), and a day's test opens
 * in place.
 */
export default function IdoPlanPage() {
  const source = useDataSource();
  const { user } = useAuth() ?? {};
  const [days, setDays] = useState(60);
  const [budget, setBudget] = useState(180);
  const [progress, setProgress] = useState(EMPTY);
  const [testFor, setTestFor] = useState(null); // plan day whose test is open
  const [openDay, setOpenDay] = useState(null);

  const plan = useResource(`ido:plan:${days}:${budget}`, () => source.getIdoPlan(days, budget));

  // Load progress (server for a signed-in student, this device for a guest).
  useEffect(() => {
    let live = true;
    if (user) {
      source.getIdoProgress().then(({ progress: p }) => {
        if (!live) return;
        if (p) {
          setProgress(fromStored(p));
          setDays(p.days ?? 60);
          setBudget(p.budget ?? 180);
        } else setProgress(EMPTY);
      }, () => live && setProgress(EMPTY));
    } else {
      setProgress(fromStored(readLocal()));
      const local = readLocal();
      if (local) { setDays(local.days ?? 60); setBudget(local.budget ?? 180); }
    }
    return () => { live = false; };
  }, [source, user]);

  const persist = (next) => {
    setProgress(next);
    if (!user) writeLocal({ startDate: next.startDate, done: [...next.done], budget: next.budget, days: next.days, examDate: next.examDate, tests: next.tests });
  };

  const start = async (over = {}) => {
    const body = { startDate: todayLocal(), days, budget, ...over };
    if (user) {
      const { progress: p } = await source.startIdoPlan(body);
      setProgress(fromStored(p));
    } else {
      persist({ status: 'ready', startDate: body.startDate, done: new Set(), budget, days, examDate: over.examDate ?? null, tests: {} });
    }
  };

  const changeDays = async (d) => {
    setDays(d);
    if (progress.status === 'ready') {
      if (user) {
        const { progress: p } = await source.startIdoPlan({ startDate: progress.startDate, days: d, budget });
        setProgress(fromStored(p));
      } else {
        persist({ ...progress, days: d, done: new Set(), tests: {} });
      }
    }
  };
  const changeBudget = async (b) => {
    setBudget(b);
    if (progress.status === 'ready') {
      if (user) {
        const { progress: p } = await source.startIdoPlan({ startDate: progress.startDate, days, budget: b });
        setProgress(fromStored(p));
      } else persist({ ...progress, budget: b });
    }
  };

  const toggle = async (task, done) => {
    const next = new Set(progress.done);
    if (done) next.add(task.id); else next.delete(task.id);
    if (user) {
      const { progress: p } = await source.setIdoTasks(done ? { done: [task.id], undone: [] } : { done: [], undone: [task.id] });
      setProgress(fromStored(p));
    } else persist({ ...progress, done: next });
  };

  const currentDay = useMemo(() => {
    if (progress.status !== 'ready' || !progress.startDate) return 1;
    return Math.min(days, Math.max(1, dayDiff(todayLocal(), progress.startDate) + 1));
  }, [progress, days]);

  useEffect(() => { setOpenDay(currentDay); }, [currentDay]);

  const phases = plan.data?.phases ?? [];
  const allDays = plan.data?.days ?? [];
  const totalTasks = allDays.reduce((a, d) => a + d.tasks.length, 0);
  const doneCount = progress.done.size;
  const ctx = { onStartTest: (task) => setTestFor(Number(task.id.split('-')[0].slice(1))) };

  return (
    <main className="mx-auto w-full max-w-4xl space-y-5 px-4 py-6">
      <header className="space-y-1">
        <p className="text-sm"><Link to="/ido" className="font-semibold text-indigo-700 dark:text-indigo-300">← 🏛️ <Localized value={IDO_UI.title} /></Link></p>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white"><Localized value={IDO_UI.planTitle} /></h1>
        <Localized value={IDO_UI.planBlurb} as="p" className="text-sm text-slate-600 dark:text-slate-300" />
      </header>

      <section className={box}>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          <div>
            <p className="text-xs font-semibold text-slate-500">{PLAN.duration?.en ?? 'Plan length'}</p>
            <div className="mt-1 flex gap-1.5" role="group" aria-label="Plan length">
              {DURATIONS.map((d) => (
                <button key={d} type="button" aria-pressed={days === d} onClick={() => changeDays(d)} className={`min-h-10 rounded-full px-4 text-sm font-bold ${days === d ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200'}`}>{d} days</button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500"><Localized value={PLAN_UI.studyTime ?? { en: 'Study time per day', bn: 'প্রতিদিনের পড়ার সময়' }} /></p>
            <div className="mt-1 flex gap-1.5" role="group" aria-label="Study time">
              {BUDGETS.map((b) => (
                <button key={b} type="button" aria-pressed={budget === b} onClick={() => changeBudget(b)} className={`min-h-10 rounded-full px-4 text-sm font-bold ${budget === b ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200'}`}>{b / 60}h</button>
              ))}
            </div>
          </div>
          {progress.status !== 'ready' ? (
            <button type="button" onClick={() => start()} className="ml-auto inline-flex min-h-11 items-center rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white hover:bg-emerald-500">
              <Localized value={PLAN_UI.startToday ?? { en: 'Start today', bn: 'আজ থেকে শুরু করো' }} />
            </button>
          ) : (
            <p className="ml-auto text-sm font-semibold tabular-nums text-slate-700 dark:text-slate-200">
              Day {currentDay} / {days} · {doneCount}/{totalTasks} ✓
            </p>
          )}
        </div>
        {progress.status === 'ready' && (
          <div className="mt-3 h-2.5 rounded-full bg-slate-100 dark:bg-slate-800">
            <div className="h-2.5 rounded-full bg-emerald-500" style={{ width: `${totalTasks ? Math.round((doneCount / totalTasks) * 100) : 0}%` }} />
          </div>
        )}
      </section>

      {testFor != null && (
        <section className={box}>
          <IdoTest
            createTest={(src) => src.createIdoPlanTest(testFor, { days, budget, language: languageStore.get() })}
            onFinished={() => { if (user) source.getIdoProgress().then(({ progress: p }) => p && setProgress(fromStored(p))); }}
            onClose={() => setTestFor(null)}
          />
        </section>
      )}

      {plan.status === 'error' ? <LoadError error={plan.error} onRetry={plan.retry} /> : !plan.data ? (
        <p className="py-10 text-center text-sm text-slate-500">…</p>
      ) : (
        phases.map((phase) => (
          <section key={phase.code} className="space-y-3">
            <div>
              <Localized value={phase.title} as="h2" className="text-lg font-bold text-slate-900 dark:text-white" />
              <Localized value={phase.goal} as="p" className="text-xs text-slate-500 dark:text-slate-400" />
            </div>
            {allDays.filter((d) => d.phase === phase.code).map((d) => {
              const dayDone = d.tasks.every((t) => progress.done.has(t.id));
              const isToday = progress.status === 'ready' && d.day === currentDay;
              return (
                <div key={d.day} className={`${box} ${isToday ? 'ring-2 ring-indigo-400' : ''}`}>
                  <button type="button" onClick={() => setOpenDay(openDay === d.day ? null : d.day)} className="flex w-full flex-wrap items-center gap-2 text-left" aria-expanded={openDay === d.day}>
                    <span className="font-black tabular-nums text-slate-900 dark:text-white">Day {d.day}</span>
                    {d.title && <Localized value={d.title} className="font-semibold text-slate-700 dark:text-slate-200" />}
                    {isToday && <span className="rounded bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-800 dark:bg-indigo-500/20 dark:text-indigo-200">Today</span>}
                    {dayDone && <span className="text-emerald-600">✓</span>}
                    <span className="ml-auto text-xs tabular-nums text-slate-500">{d.minutes} min · {d.tasks.filter((t) => progress.done.has(t.id)).length}/{d.tasks.length}</span>
                  </button>
                  {openDay === d.day && (
                    <ul className="mt-1 divide-y divide-slate-100 dark:divide-slate-800">
                      {d.tasks.map((task) => (
                        <TaskCard key={task.id} task={task} done={progress.done.has(task.id)} onToggle={toggle} ctx={ctx} />
                      ))}
                    </ul>
                  )}
                  {d.day && progress.tests?.[d.day] && (
                    <p className="mt-2 text-xs font-semibold tabular-nums text-slate-500">
                      Test: {progress.tests[d.day].correct}/{progress.tests[d.day].total} · {progress.tests[d.day].accuracy}%
                    </p>
                  )}
                </div>
              );
            })}
          </section>
        ))
      )}
    </main>
  );
}

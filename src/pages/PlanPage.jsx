import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDataSource } from '../app/DataSourceContext';
import { useOptionalAuth } from '../app/AuthContext';
import { useResource } from '../hooks/useResource';
import { PLAN } from '../lib/planCopy';
import { dayNumber, localIsoDate, localPlan, nextStep, taskLink } from '../lib/studyPlan';
import PageShell from '../components/navigation/PageShell';
import PriorityBadge from '../components/priority/PriorityBadge';
import { Localized } from '../components/topic-hub/Localized';
import { ArrowRightIcon, CheckIcon } from '../components/topic-hub/icons';
import { CardGridSkeleton, LoadError } from './funnel/FunnelLayout';

const box = 'rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800';
const primary = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500';

function taskTitle(task) {
  if (task.kind !== 'learn') return task.title;
  const title = PLAN.learnTitle(task.name);
  if (!task.session || task.session.of < 2) return title;
  const s = PLAN.session(task.session.n, task.session.of);
  return { en: `${title.en} (${s.en})`, bn: `${title.bn} (${s.bn})` };
}

function TaskRow({ task, done, onToggle }) {
  const link = taskLink(task);
  return (
    <li className="flex items-start gap-3 py-3">
      <button
        type="button"
        aria-pressed={done}
        aria-label={`${PLAN.markDone.en}: ${taskTitle(task).en}`}
        onClick={() => onToggle(task, !done)}
        className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg ring-1 ${done ? 'bg-emerald-600 text-white ring-emerald-600' : 'bg-white ring-slate-300 hover:bg-slate-50 dark:bg-slate-900 dark:ring-slate-600'}`}
      >
        {done && <CheckIcon />}
      </button>
      <div className="min-w-0 flex-1">
        <p className={`font-semibold ${done ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-white'}`}>
          <Localized value={taskTitle(task)} />
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          {task.minutes > 0 && <Localized value={PLAN.minutes(task.minutes)} />}
          {task.optional && <Localized value={PLAN.optional} className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800" />}
          {task.kind === 'learn' && <PriorityBadge subject={task.subject} topics={[task.topic]} />}
        </p>
      </div>
      {link && (
        <Link to={link} className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-lg px-3 text-sm font-semibold text-indigo-700 ring-1 ring-slate-200 hover:bg-indigo-50 dark:text-indigo-300 dark:ring-slate-700">
          <Localized value={PLAN.open} />
          <ArrowRightIcon />
        </Link>
      )}
    </li>
  );
}

/**
 * /plan: the 60-day WBPSC Clerkship plan. Today's target, "What should I study next?"
 * with its reason, ticks per task (account for signed-in students, this device for
 * guests; a guest's ticks move to the account at sign-in), and the whole 60 days.
 */
export default function PlanPage() {
  const source = useDataSource();
  const auth = useOptionalAuth();
  const user = auth?.user ?? null;
  const authReady = !auth || auth.status === 'ready';
  const plan = useResource('plan:clerkship-60', () => source.getStudyPlan());
  const [progress, setProgress] = useState({ status: 'loading' }); // { status, startDate, done: Set }
  const [extras, setExtras] = useState({ dueToday: 0, weak: [] });
  const [startDate, setStartDate] = useState(localIsoDate());
  const [saveError, setSaveError] = useState(null);

  const load = useCallback(async () => {
    const local = localPlan.read();
    if (!user) {
      setProgress(local ? { status: 'ready', startDate: local.startDate, done: new Set(local.done) } : { status: 'ready', startDate: null, done: new Set() });
      return;
    }
    try {
      let { progress: p } = await source.getPlanProgress();
      if (local) {
        // Ticks made as a guest on this device join the account once.
        if (!p) ({ progress: p } = await source.startPlan({ startDate: local.startDate }));
        if (local.done.length) ({ progress: p } = await source.setPlanTasks({ done: local.done }));
        localPlan.write(null);
      }
      setProgress(p ? { status: 'ready', startDate: p.startDate, done: new Set(p.done) } : { status: 'ready', startDate: null, done: new Set() });
    } catch (error) {
      setProgress({ status: 'error', error });
    }
  }, [source, user]);

  useEffect(() => {
    if (authReady) load();
  }, [authReady, load]);

  // Signed-in students: due revision and weak chapters feed "What next".
  useEffect(() => {
    if (!user) return undefined;
    let live = true;
    Promise.allSettled([source.getReviewSummary(), source.getInsights()]).then(([summary, insights]) => {
      if (!live) return;
      setExtras({
        dueToday: summary.status === 'fulfilled' ? summary.value.dueToday : 0,
        weak: insights.status === 'fulfilled' ? insights.value.mastery.filter((m) => m.status === 'weak').sort((a, b) => (a.accuracyPct ?? 0) - (b.accuracyPct ?? 0)) : [],
      });
    });
    return () => {
      live = false;
    };
  }, [source, user]);

  const save = useCallback(async (next, body) => {
    setProgress((p) => ({ ...p, ...next }));
    setSaveError(null);
    if (!user) {
      localPlan.write({ startDate: next.startDate, done: [...next.done] });
      return;
    }
    try {
      const { progress: p } = body.startDate ? await source.startPlan(body) : await source.setPlanTasks(body);
      setProgress({ status: 'ready', startDate: p.startDate, done: new Set(p.done) });
    } catch (error) {
      setSaveError(error);
    }
  }, [source, user]);

  const toggle = (task, on) => {
    const done = new Set(progress.done);
    if (on) done.add(task.id);
    else done.delete(task.id);
    save({ startDate: progress.startDate, done }, on ? { done: [task.id] } : { undone: [task.id] });
  };
  const start = (reset) => save({ startDate, done: reset ? new Set() : progress.done }, { startDate, reset });

  const days = plan.data?.days;
  const today = progress.startDate ? dayNumber(progress.startDate) : 1;
  const current = Math.min(Math.max(today, 1), days?.length ?? 60);
  const next = useMemo(
    () => (days && progress.startDate ? nextStep({ days, done: progress.done, today, dueToday: extras.dueToday, weak: extras.weak }) : null),
    [days, progress.startDate, progress.done, today, extras],
  );
  const totals = useMemo(() => {
    const all = days?.flatMap((d) => d.tasks.filter((x) => !x.optional && x.kind !== 'rest')) ?? [];
    return { total: all.length, done: all.filter((x) => progress.done?.has(x.id)).length };
  }, [days, progress.done]);

  const loading = plan.status === 'loading' || progress.status === 'loading';
  const error = plan.status === 'error' ? plan.error : progress.status === 'error' ? progress.error : null;

  return (
    <PageShell className="max-w-4xl pb-16 pt-6 sm:pt-8">
      <header>
        <Localized value={PLAN.title} as="h1" className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white" />
        <Localized value={PLAN.sub} as="p" className="mt-2 text-slate-600 dark:text-slate-300" />
      </header>

      {loading && !error && <div className="mt-6"><CardGridSkeleton count={2} height="h-40" /></div>}
      {error && <div className="mt-6"><LoadError error={error} onRetry={() => (plan.status === 'error' ? plan.retry() : load())} /></div>}

      {!loading && !error && days && (
        <>
          {!progress.startDate ? (
            <section aria-label="Start" className={`mt-6 ${box}`}>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                <Localized value={PLAN.startLabel} />
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="ml-3 min-h-11 rounded-xl px-3 ring-1 ring-slate-300 dark:bg-slate-900 dark:ring-slate-700" />
              </label>
              <button type="button" onClick={() => start(false)} disabled={!startDate} className={`${primary} mt-4`}>
                <Localized value={PLAN.start} />
                <ArrowRightIcon />
              </button>
              {!user && <Localized value={PLAN.guestNote} as="p" className="mt-3 text-xs text-slate-500 dark:text-slate-400" />}
              <ol className="mt-5 grid gap-3 sm:grid-cols-2">
                {plan.data.phases.map((ph) => (
                  <li key={ph.code} className="rounded-2xl p-3 ring-1 ring-slate-200 dark:ring-slate-800">
                    <Localized value={ph.title} as="p" className="font-bold text-slate-900 dark:text-white" />
                    <p className="text-xs text-slate-500">Day {ph.from}–{ph.to}</p>
                    <Localized value={ph.goal} as="p" className="mt-1 text-sm text-slate-600 dark:text-slate-300" />
                  </li>
                ))}
              </ol>
            </section>
          ) : (
            <>
              {saveError && <p role="alert" className="mt-4 text-sm text-rose-700">{saveError.message}</p>}

              <section aria-labelledby="plan-next" className="mt-6 rounded-3xl bg-indigo-600 p-5 text-white shadow-sm">
                <h2 id="plan-next" className="text-sm font-bold uppercase tracking-wider text-indigo-100"><Localized value={PLAN.next} /></h2>
                {next ? (
                  <>
                    <p className="mt-2 text-xl font-extrabold"><Localized value={taskTitle(next.task)} /></p>
                    <p className="mt-1 text-sm text-indigo-100"><Localized value={next.reason} /></p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {taskLink(next.task) && (
                        <Link to={taskLink(next.task)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-indigo-700 hover:bg-indigo-50">
                          <Localized value={PLAN.open} />
                          <ArrowRightIcon />
                        </Link>
                      )}
                      {!next.task.extra && (
                        <button type="button" onClick={() => toggle(next.task, true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold text-white ring-1 ring-white/60 hover:bg-white/10">
                          <CheckIcon />
                          <Localized value={PLAN.markDone} />
                        </button>
                      )}
                    </div>
                  </>
                ) : (
                  <Localized value={PLAN.nothingNext} as="p" className="mt-2 font-semibold" />
                )}
              </section>

              <section aria-labelledby="plan-today" className={`mt-6 ${box}`}>
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 id="plan-today" className="text-xl font-bold text-slate-900 dark:text-white">
                    <Localized value={PLAN.today} /> · <Localized value={PLAN.dayOf(current, days.length)} />
                  </h2>
                  <Localized value={PLAN.minutes(days[current - 1].minutes)} className="text-sm text-slate-500" />
                </div>
                <Localized value={PLAN.phaseTitle[days[current - 1].phase]} as="p" className="text-sm font-semibold text-indigo-700 dark:text-indigo-300" />
                {today < 1 && <Localized value={PLAN.notYet(1 - today)} as="p" className="mt-1 text-sm text-slate-600" />}
                {today > days.length && <Localized value={PLAN.finished} as="p" className="mt-1 text-sm text-slate-600" />}
                {days[current - 1].weeklyTest && <Localized value={PLAN.weeklyTest} as="p" className="mt-1 text-sm text-amber-700 dark:text-amber-300" />}
                <ul className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
                  {days[current - 1].tasks.map((task) => <TaskRow key={task.id} task={task} done={progress.done.has(task.id)} onToggle={toggle} />)}
                </ul>
                <div className="mt-4">
                  <Localized value={PLAN.progress(totals.done, totals.total)} as="p" className="text-sm font-semibold text-slate-700 dark:text-slate-200" />
                  <div className="mt-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                    <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${totals.total ? (totals.done / totals.total) * 100 : 0}%` }} />
                  </div>
                </div>
                {!user && <Localized value={PLAN.guestNote} as="p" className="mt-3 text-xs text-slate-500 dark:text-slate-400" />}
              </section>

              <section aria-labelledby="plan-all" className="mt-8">
                <h2 id="plan-all" className="text-xl font-bold text-slate-900 dark:text-white"><Localized value={PLAN.allDays} /></h2>
                {plan.data.phases.map((ph) => (
                  <details key={ph.code} open={current >= ph.from && current <= ph.to} className={`mt-3 ${box}`}>
                    <summary className="cursor-pointer font-bold text-slate-900 dark:text-white">
                      <Localized value={ph.title} /> <span className="text-sm font-normal text-slate-500">· Day {ph.from}–{ph.to}</span>
                    </summary>
                    <Localized value={ph.goal} as="p" className="mt-1 text-sm text-slate-600 dark:text-slate-300" />
                    <ol className="mt-3 space-y-3">
                      {days.filter((d) => d.day >= ph.from && d.day <= ph.to).map((d) => (
                        <li key={d.day} className={d.day === current ? 'rounded-xl bg-indigo-50 p-2 dark:bg-indigo-500/10' : 'p-2'}>
                          <p className="text-sm font-bold text-slate-900 dark:text-white"><Localized value={PLAN.dayOf(d.day, days.length)} /></p>
                          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                            {d.tasks.map((task) => <TaskRow key={task.id} task={task} done={progress.done.has(task.id)} onToggle={toggle} />)}
                          </ul>
                        </li>
                      ))}
                    </ol>
                  </details>
                ))}
              </section>

              <section aria-label="Start date" className="mt-8 flex flex-wrap items-center gap-3 text-sm">
                <input type="date" aria-label={PLAN.startLabel.en} value={startDate} onChange={(e) => setStartDate(e.target.value)} className="min-h-10 rounded-xl px-3 ring-1 ring-slate-300 dark:bg-slate-900 dark:ring-slate-700" />
                <button type="button" onClick={() => start(false)} className="min-h-10 rounded-lg px-3 font-semibold text-indigo-700 ring-1 ring-slate-200 dark:text-indigo-300 dark:ring-slate-700"><Localized value={PLAN.restart} /></button>
                <button type="button" onClick={() => start(true)} className="min-h-10 rounded-lg px-3 font-semibold text-rose-700 ring-1 ring-slate-200 dark:text-rose-300 dark:ring-slate-700"><Localized value={PLAN.restartFresh} /></button>
              </section>
            </>
          )}
        </>
      )}
    </PageShell>
  );
}

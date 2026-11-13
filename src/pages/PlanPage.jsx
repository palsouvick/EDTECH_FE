import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDataSource } from '../app/DataSourceContext';
import { useOptionalAuth } from '../app/AuthContext';
import { useResource } from '../hooks/useResource';
import { focusStore, useFocus } from '../lib/focusStore';
import { PLAN, PLAN_UI } from '../lib/planCopy';
import { adaptiveAdvice, currentPlanDay, dayNumber, daySummary, localIsoDate, localPlan, nextStep, PLAN_VERSION, readiness, taskLink, TEST_KINDS } from '../lib/studyPlan';
import PageShell from '../components/navigation/PageShell';
import PlanTest from '../components/plan/PlanTest';
import { AdviceCard, box, DaySummaryCard, ReadinessCard, TaskCard, taskTitle } from '../components/plan/PlanParts';
import { Localized } from '../components/topic-hub/Localized';
import { ArrowRightIcon, CheckIcon } from '../components/topic-hub/icons';
import { CardGridSkeleton, LoadError } from './funnel/FunnelLayout';

const primary = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500';
const BUDGETS = [120, 180, 240, 360];
const EMPTY = { status: 'ready', startDate: null, done: new Set(), budget: 180, examDate: null, tests: {} };

function Settings({ value, onSave, saving }) {
  const [startDate, setStartDate] = useState(value.startDate ?? localIsoDate());
  const [budget, setBudget] = useState(value.budget ?? 180);
  const [examDate, setExamDate] = useState(value.examDate ?? '');
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave({ startDate, budget, examDate: examDate || null }); }} className="grid gap-3 text-sm sm:grid-cols-4 sm:items-end">
      <label className="block font-semibold text-slate-700 dark:text-slate-200">
        <Localized value={PLAN.startLabel} />
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="mt-1 block min-h-11 w-full rounded-xl px-3 ring-1 ring-slate-300 dark:bg-slate-900 dark:ring-slate-700" />
      </label>
      <label className="block font-semibold text-slate-700 dark:text-slate-200">
        <Localized value={PLAN_UI.studyTime} />
        <select value={budget} onChange={(e) => setBudget(Number(e.target.value))} className="mt-1 block min-h-11 w-full rounded-xl px-3 ring-1 ring-slate-300 dark:bg-slate-900 dark:ring-slate-700">
          {BUDGETS.map((b) => <option key={b} value={b}>{b / 60} h</option>)}
        </select>
      </label>
      <label className="block font-semibold text-slate-700 dark:text-slate-200">
        <Localized value={PLAN_UI.examDate} />
        <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} className="mt-1 block min-h-11 w-full rounded-xl px-3 ring-1 ring-slate-300 dark:bg-slate-900 dark:ring-slate-700" />
      </label>
      <button type="submit" disabled={!startDate || saving} className={primary}>
        <Localized value={value.startDate ? PLAN_UI.save : PLAN.start} />
      </button>
      <Localized value={PLAN_UI.examTentative} as="p" className="text-xs text-slate-500 sm:col-span-4 dark:text-slate-400" />
    </form>
  );
}

/**
 * /plan: the 60-day WBPSC Clerkship preparation system. Countdown, readiness, Today's Mission,
 * the day's detailed tasks (learn, spaced revision, tests, PYQs, camp revision), "What should I
 * study next?", the day summary and advice from the last test, Focus Mode and all 60 days.
 * Progress is kept on the account for signed-in students and on this device for guests.
 */
export default function PlanPage() {
  const source = useDataSource();
  const auth = useOptionalAuth();
  const user = auth?.user ?? null;
  const authReady = !auth || auth.status === 'ready';
  const focus = useFocus();
  const [progress, setProgress] = useState({ status: 'loading' });
  const [extras, setExtras] = useState({ dueToday: 0, mastery: {}, weak: [], pyq: {} });
  const [saveError, setSaveError] = useState(null);
  const [testFor, setTestFor] = useState(null); // plan day whose test is open

  const budget = progress.budget ?? 180;
  const plan = useResource(`plan:clerkship-60:${budget}`, () => source.getStudyPlan(budget));

  const fromServer = (p) => (p ? { status: 'ready', startDate: p.startDate, done: new Set(p.done), budget: p.budget ?? 180, examDate: p.examDate ?? null, tests: p.tests || {}, planUpdated: p.planUpdated } : EMPTY);
  const fromLocal = (v) => (v ? { status: 'ready', startDate: v.startDate, done: new Set(v.done), budget: v.budget ?? 180, examDate: v.examDate ?? null, tests: v.tests || {}, planUpdated: v.planUpdated } : EMPTY);
  const writeLocal = (p) => localPlan.write({ startDate: p.startDate, done: [...p.done], budget: p.budget, examDate: p.examDate, tests: p.tests, version: PLAN_VERSION });

  const load = useCallback(async () => {
    const local = localPlan.read();
    if (!user) {
      setProgress(fromLocal(local));
      if (local?.planUpdated) writeLocal(fromLocal(local));
      return;
    }
    try {
      let { progress: p } = await source.getPlanProgress();
      if (local) {
        // A guest's plan on this device joins the account once.
        if (!p) ({ progress: p } = await source.startPlan({ startDate: local.startDate, budget: local.budget ?? 180, examDate: local.examDate ?? null }));
        if (local.done.length) ({ progress: p } = await source.setPlanTasks({ done: local.done }));
        localPlan.write(null);
      }
      setProgress(fromServer(p));
    } catch (error) {
      setProgress({ status: 'error', error });
    }
  }, [source, user]);

  useEffect(() => {
    if (authReady) load();
  }, [authReady, load]);

  // Signed-in students: due revision, chapter mastery and PYQ progress feed advice and readiness.
  useEffect(() => {
    if (!user) return undefined;
    let live = true;
    Promise.allSettled([source.getReviewSummary(), source.getInsights(), ...['quant', 'english', 'gs'].map((s) => source.getPyqProgress(s))]).then(([summary, insights, ...pyqs]) => {
      if (!live) return;
      const mastery = {};
      for (const m of insights.status === 'fulfilled' ? insights.value.mastery : []) mastery[`${m.subject}.${m.topic}`] = m;
      const pyq = {};
      for (const r of pyqs) if (r.status === 'fulfilled') for (const [topic, v] of Object.entries(r.value.topics || {})) pyq[`${r.value.subject}.${topic}`] = v;
      setExtras({
        dueToday: summary.status === 'fulfilled' ? summary.value.dueToday : 0,
        mastery,
        weak: Object.values(mastery).filter((m) => m.status === 'weak').sort((a, b) => (a.accuracyPct ?? 0) - (b.accuracyPct ?? 0)),
        pyq,
      });
    });
    return () => {
      live = false;
    };
  }, [source, user, progress.tests]);

  const save = useCallback(async (next, body) => {
    setProgress((p) => ({ ...p, ...next }));
    setSaveError(null);
    if (!user) {
      writeLocal({ ...progress, ...next });
      return;
    }
    try {
      const { progress: p } = body.startDate ? await source.startPlan(body) : await source.setPlanTasks(body);
      setProgress(fromServer(p));
    } catch (error) {
      setSaveError(error);
    }
  }, [source, user, progress]);

  const toggle = (task, on) => {
    const done = new Set(progress.done);
    if (on) done.add(task.id);
    else done.delete(task.id);
    save({ done }, on ? { done: [task.id] } : { undone: [task.id] });
  };
  const saveSettings = ({ startDate, budget: b, examDate }) => save({ startDate, budget: b, examDate }, { startDate, budget: b, examDate });

  const onTestFinished = useCallback((day) => (data) => {
    const task = plan.data?.days[day - 1]?.tasks.find((x) => TEST_KINDS.has(x.kind));
    setProgress((p) => {
      const prev = p.tests?.[day];
      const better = !prev || data.summary.correct / data.summary.total > prev.correct / prev.total;
      const next = { ...p, tests: better ? { ...p.tests, [day]: data.summary } : p.tests, done: task ? new Set([...p.done, task.id]) : p.done };
      if (!user) writeLocal(next);
      return next;
    });
  }, [plan.data, user]);

  const days = plan.data?.days;
  const today = progress.startDate ? dayNumber(progress.startDate) : 1; // calendar day
  // The day the student is on: the next day opens only when this one is complete.
  const current = useMemo(
    () => (days && progress.done ? currentPlanDay({ days, done: progress.done, calendarDay: today }) : Math.min(Math.max(today, 1), days?.length ?? 60)),
    [days, progress.done, today],
  );
  const day = days?.[current - 1];
  const next = useMemo(
    () => (days && progress.startDate ? nextStep({ days, done: progress.done, today: current, dueToday: extras.dueToday, weak: extras.weak }) : null),
    [days, progress.startDate, progress.done, current, extras],
  );
  const totals = useMemo(() => {
    const all = days?.flatMap((d) => d.tasks.filter((x) => !x.optional && x.kind !== 'rest')) ?? [];
    return { total: all.length, done: all.filter((x) => progress.done?.has(x.id)).length };
  }, [days, progress.done]);
  const chapters = useMemo(() => {
    const out = { quant: [], english: [], gs: [] };
    for (const d of days || []) for (const x of d.tasks) if (x.kind === 'learn' && !x.optional && !out[x.subject].includes(x.topic)) out[x.subject].push(x.topic);
    return out;
  }, [days]);
  const score = useMemo(() => readiness({ chapters, mastery: extras.mastery, pyq: extras.pyq, tests: progress.tests }), [chapters, extras, progress.tests]);
  const advice = useMemo(() => adaptiveAdvice(progress.tests), [progress.tests]);
  const ctx = { mastery: extras.mastery, advice, onStartTest: () => setTestFor(current) };
  const daysLeft = progress.examDate ? dayNumber(localIsoDate(), progress.examDate) - 1 : null;

  const loading = plan.status === 'loading' || progress.status === 'loading';
  const error = plan.status === 'error' ? plan.error : progress.status === 'error' ? progress.error : null;

  return (
    <PageShell className="max-w-4xl pb-16 pt-6 sm:pt-8">
      {!focus.active && (
        <header>
          <Localized value={PLAN.title} as="h1" className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl dark:text-white" />
          <Localized value={PLAN.sub} as="p" className="mt-2 text-slate-600 dark:text-slate-300" />
        </header>
      )}

      {loading && !error && <div className="mt-6"><CardGridSkeleton count={2} height="h-40" /></div>}
      {error && <div className="mt-6"><LoadError error={error} onRetry={() => (plan.status === 'error' ? plan.retry() : load())} /></div>}

      {!loading && !error && days && (
        !progress.startDate ? (
          <section aria-label="Start" className={`mt-6 ${box}`}>
            <Settings value={progress} onSave={saveSettings} />
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
          <div className="mt-6 space-y-6">
            {progress.planUpdated && <Localized value={PLAN_UI.planUpdated} as="p" role="status" className="rounded-xl bg-sky-50 p-3 text-sm text-sky-900 ring-1 ring-sky-200 dark:bg-sky-500/10 dark:text-sky-200" />}
            {saveError && <p role="alert" className="text-sm text-rose-700">{saveError.message}</p>}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-lg font-bold text-slate-900 dark:text-white">
                {daysLeft != null && <Localized value={daysLeft > 0 ? PLAN_UI.countdown(daysLeft) : PLAN_UI.examToday} />}
              </p>
              {!focus.active && (
                <button type="button" onClick={() => focusStore.start()} className="inline-flex min-h-10 items-center rounded-xl px-4 text-sm font-bold text-indigo-700 ring-1 ring-indigo-300 hover:bg-indigo-50 dark:text-indigo-300">
                  <Localized value={PLAN_UI.focusStart} />
                </button>
              )}
            </div>

            {!focus.active && <ReadinessCard score={score} signedIn={Boolean(user)} />}

            <section aria-labelledby="plan-next" className="rounded-3xl bg-indigo-600 p-5 text-white shadow-sm">
              <h2 id="plan-next" className="text-sm font-bold uppercase tracking-wider text-indigo-100"><Localized value={PLAN.next} /></h2>
              {next ? (
                <>
                  <p className="mt-2 text-xl font-extrabold"><Localized value={taskTitle(next.task)} /></p>
                  <p className="mt-1 text-sm text-indigo-100"><Localized value={next.reason} /></p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {TEST_KINDS.has(next.task.kind) ? (
                      <button type="button" onClick={() => setTestFor(next.day)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-indigo-700 hover:bg-indigo-50">
                        <Localized value={PLAN_UI.startTest} /><ArrowRightIcon />
                      </button>
                    ) : taskLink(next.task) && (
                      <Link to={taskLink(next.task)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-indigo-700 hover:bg-indigo-50">
                        <Localized value={PLAN.open} /><ArrowRightIcon />
                      </Link>
                    )}
                    {!next.task.extra && (
                      <button type="button" onClick={() => toggle(next.task, true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl px-4 text-sm font-bold text-white ring-1 ring-white/60 hover:bg-white/10">
                        <CheckIcon /><Localized value={PLAN.markDone} />
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <Localized value={PLAN.nothingNext} as="p" className="mt-2 font-semibold" />
              )}
            </section>

            {testFor != null && (
              <section aria-label="Test" className={box}>
                <PlanTest day={testFor} budget={budget} onFinished={onTestFinished(testFor)} onClose={() => setTestFor(null)} />
              </section>
            )}

            <section aria-labelledby="plan-today" className={box}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 id="plan-today" className="text-xl font-bold text-slate-900 dark:text-white">
                  <Localized value={PLAN.today} /> · <Localized value={PLAN.dayOf(current, days.length)} />
                </h2>
                <Localized value={PLAN.minutes(day.minutes)} className="text-sm text-slate-500" />
              </div>
              <p className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                <Localized value={PLAN.phaseTitle[day.phase]} />{day.title && <> · <Localized value={day.title} /></>}
              </p>
              {today < 1 && <Localized value={PLAN.notYet(1 - today)} as="p" className="mt-1 text-sm text-slate-600" />}
              {Math.min(today, days.length) > current && <Localized value={PLAN.behind(Math.min(today, days.length), current)} as="p" role="status" className="mt-2 rounded-xl bg-rose-50 p-3 text-sm font-semibold text-rose-900 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-200 dark:ring-rose-500/30" />}
              {today > days.length && <Localized value={PLAN.finished} as="p" className="mt-1 text-sm text-slate-600" />}
              <div className="mt-3 rounded-2xl bg-amber-50 p-3 ring-1 ring-amber-200 dark:bg-amber-500/10 dark:ring-amber-500/30">
                <Localized value={PLAN_UI.mission} as="p" className="font-bold text-amber-900 dark:text-amber-200" />
                <Localized value={PLAN_UI.missionLine(day.mission)} as="p" className="text-sm text-amber-950 dark:text-amber-100" />
              </div>
              <ul className="mt-2 divide-y divide-slate-100 dark:divide-slate-800">
                {day.tasks.map((task) => <TaskCard key={task.id} task={task} done={progress.done.has(task.id)} onToggle={toggle} ctx={ctx} />)}
              </ul>
              <DaySummaryCard summary={daySummary(day, progress)} />
              <div className="mt-4">
                <Localized value={PLAN.progress(totals.done, totals.total)} as="p" className="text-sm font-semibold text-slate-700 dark:text-slate-200" />
                <div className="mt-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800">
                  <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${totals.total ? (totals.done / totals.total) * 100 : 0}%` }} />
                </div>
              </div>
              {!user && <Localized value={PLAN.guestNote} as="p" className="mt-3 text-xs text-slate-500 dark:text-slate-400" />}
            </section>

            {!focus.active && <AdviceCard advice={advice} />}

            {!focus.active && (
              <>
                <section aria-labelledby="plan-all">
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
                            <p className="text-sm font-bold text-slate-900 dark:text-white">
                              <Localized value={PLAN.dayOf(d.day, days.length)} />{d.title && <> · <Localized value={d.title} /></>}
                              {progress.tests[d.day] && <span className="ml-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300">{progress.tests[d.day].correct}/{progress.tests[d.day].total}</span>}
                            </p>
                            {d.day > current && <Localized value={PLAN.locked(d.day - 1)} as="p" className="text-xs font-semibold text-slate-500 dark:text-slate-400" />}
                            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                              {d.tasks.map((task) => <TaskCard key={task.id} task={task} done={progress.done.has(task.id)} onToggle={toggle} locked={d.day > current} ctx={{ ...ctx, onStartTest: () => setTestFor(d.day) }} />)}
                            </ul>
                          </li>
                        ))}
                      </ol>
                    </details>
                  ))}
                </section>

                <section aria-label="Settings" className={box}>
                  <Settings value={progress} onSave={saveSettings} />
                  <button type="button" onClick={() => save({ done: new Set(), tests: {} }, { startDate: progress.startDate, reset: true })} className="mt-3 min-h-10 rounded-lg px-3 text-sm font-semibold text-rose-700 ring-1 ring-slate-200 dark:text-rose-300 dark:ring-slate-700">
                    <Localized value={PLAN.restartFresh} />
                  </button>
                </section>
              </>
            )}
          </div>
        )
      )}
    </PageShell>
  );
}

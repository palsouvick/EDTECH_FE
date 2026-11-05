import { learnPaths, toSlug } from './routes';
import { PLAN } from './planCopy';

/** Days are counted in the student's local calendar: "2026-11-06" → Day 1 on that date. */
export function localIsoDate(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** 1-based plan day for `today`; 0 before the start; can exceed the plan length after the end. */
export function dayNumber(startDate, today = localIsoDate()) {
  const [a, b] = [startDate, today].map((s) => Date.UTC(...s.split('-').map((n, i) => (i === 1 ? n - 1 : Number(n)))));
  return Math.floor((b - a) / 86_400_000) + 1;
}

/** Where a task is done in the app. */
export function taskLink(task) {
  switch (task.kind) {
    case 'learn':
      return task.subject === 'gs' ? `/learn/gk/${toSlug(task.topic)}` : learnPaths.chapter(task.subject, task.topic);
    case 'mock':
      return `/exams/wbpsc/${toSlug(task.subject)}`;
    case 'pyq_paper':
      return `/pyq?${new URLSearchParams({ exam: task.exam, year: String(task.year) })}`;
    case 'revise':
      return '/revise';
    case 'mistakes':
      return '/mistakes';
    case 'weak':
      return '/mastery';
    case 'gk_revise':
      return '/learn/gk/revision';
    case 'vocabulary':
      return '/vocabulary';
    case 'days_year':
      return '/learn/gk/important-days';
    default:
      return null;
  }
}

// How far back unfinished tasks are suggested before they are left behind (no snowballing backlog).
export const BACKLOG_DAYS = 3;
// Revision jumps the queue when this many questions are due.
export const DUE_FIRST = 15;

/**
 * "What should I study next?": one task and the reason for it.
 *   1. a required task left from the last few days (oldest first)
 *   2. revision, when many questions are due and today's revision is not ticked
 *   3. today's next task, in plan order (each subject's chapters are ordered easiest-first)
 *   4. a weak chapter, once today is done
 * Returns null when there is nothing left to suggest.
 */
export function nextStep({ days, done, today, dueToday = 0, weak = [] }) {
  const isDone = (task) => done.has(task.id);
  const required = (d) => d.tasks.filter((task) => !task.optional && task.kind !== 'rest');
  const current = Math.min(Math.max(today, 1), days.length);

  for (let n = Math.max(1, current - BACKLOG_DAYS); n < current; n += 1) {
    const task = required(days[n - 1]).find((x) => !isDone(x));
    if (task) return { day: n, task, reason: PLAN.reasonBacklog(n) };
  }
  const todayDay = days[current - 1];
  const reviseToday = todayDay.tasks.find((x) => x.kind === 'revise' && !isDone(x));
  if (reviseToday && dueToday >= DUE_FIRST) return { day: current, task: reviseToday, reason: PLAN.reasonDue(dueToday) };

  const task = required(todayDay).find((x) => !isDone(x));
  if (task) return { day: current, task, reason: reasonFor(task) };

  if (weak.length) {
    const w = weak[0];
    return { day: current, task: { id: `weak-${w.subject}-${w.topic}`, kind: 'learn', subject: w.subject, topic: w.topic, name: w.name, extra: true }, reason: PLAN.reasonWeak(w.accuracyPct) };
  }
  return null;
}

function reasonFor(task) {
  if (task.kind === 'learn') return PLAN.reasonLearn(task.priority, task.session);
  return PLAN.reasonKind[task.kind] ?? PLAN.reasonPlanOrder;
}

/** Guests keep their plan on this device. */
const KEY = 'edtech:plan:clerkship60';
export const localPlan = {
  read() {
    try {
      const v = JSON.parse(localStorage.getItem(KEY));
      return v && typeof v.startDate === 'string' && Array.isArray(v.done) ? v : null;
    } catch {
      return null;
    }
  },
  write(v) {
    try {
      if (v) localStorage.setItem(KEY, JSON.stringify(v));
      else localStorage.removeItem(KEY);
    } catch {
      /* private mode: progress lasts for this visit */
    }
  },
};

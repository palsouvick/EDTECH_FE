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

/** A day's tasks that must be done before the next day opens. */
export const requiredTasks = (day) => day.tasks.filter((x) => !x.optional && x.kind !== 'rest');

/**
 * The plan day the student is on. A day opens only when every required task of the days before
 * it is done, and never before its calendar date. A student who misses days resumes where they
 * stopped instead of being moved ahead to the calendar day.
 */
export function currentPlanDay({ days, done, calendarDay }) {
  const cap = Math.min(Math.max(calendarDay, 1), days.length);
  for (let n = 1; n < cap; n += 1) {
    if (requiredTasks(days[n - 1]).some((x) => !done.has(x.id))) return n;
  }
  return cap;
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

/** A chapter's page, optionally opened in a study mode (Math/English) — GK chapters have no modes. */
export function chapterLink(subject, topic, mode) {
  if (!topic) return subject === 'gs' ? '/learn/gk' : learnPaths.subject(subject);
  if (subject === 'gs') return `/learn/gk/${toSlug(topic)}`;
  return `${learnPaths.chapter(subject, topic)}${mode ? `?mode=${mode}` : ''}`;
}

export const pyqLink = (subject, topic) => `/pyq?${new URLSearchParams({ subject, topic })}`;

/** Tasks that are tests run inside the plan page. */
export const TEST_KINDS = new Set(['daily_test', 'weekly_test', 'full_mock']);

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
// Ticks saved against another plan layout (version) are dropped; start date and settings are kept.
export const PLAN_VERSION = 2;
export const localPlan = {
  read() {
    try {
      const v = JSON.parse(localStorage.getItem(KEY));
      if (!(v && typeof v.startDate === 'string' && Array.isArray(v.done))) return null;
      return v.version === PLAN_VERSION ? v : { ...v, done: [], tests: {}, version: PLAN_VERSION, planUpdated: true };
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

// ---------------------------------------------------------------- readiness and adaptivity

const SUBJECT_WEIGHT = { quant: 0.3, english: 0.3, gs: 0.4 }; // Part-I marks: 30 / 30 / 40
export const PYQ_FULL_CREDIT = 150; // real PYQs answered for full PYQ credit
export const MIN_ANSWERS = 5;

/**
 * WBPSC Clerkship readiness, 0–100, from the student's own answers:
 *   subject  average over the plan's chapters of recent accuracy (a chapter with fewer than
 *            5 answers counts as 0, so untouched chapters lower it: readiness needs coverage)
 *   pyq      accuracy on real PYQs × share of PYQ_FULL_CREDIT answered
 *   mock     average accuracy of the plan's weekly tests and full mocks (latest three)
 *   overall  70% subjects (weighted 30/30/40 like the paper) + 15% PYQ + 15% mock
 */
export function readiness({ chapters, mastery, pyq, tests }) {
  const subject = {};
  for (const s of Object.keys(SUBJECT_WEIGHT)) {
    const list = chapters[s] || [];
    subject[s] = list.length ? Math.round(list.reduce((a, topic) => {
      const m = mastery[`${s}.${topic}`];
      return a + (m && m.recentAnswers >= MIN_ANSWERS && m.accuracyPct != null ? m.accuracyPct : 0);
    }, 0) / list.length) : 0;
  }
  const att = Object.values(pyq).reduce((a, t) => a + t.attempted, 0);
  const sol = Object.values(pyq).reduce((a, t) => a + t.solved, 0);
  const pyqScore = att ? Math.round((sol / att) * Math.min(1, att / PYQ_FULL_CREDIT) * 100) : 0;
  const mocks = Object.entries(tests || {}).filter(([, r]) => r.kind === 'weekly_test' || r.kind === 'full_mock').sort(([a], [b]) => Number(b) - Number(a)).slice(0, 3);
  const mockScore = mocks.length ? Math.round(mocks.reduce((a, [, r]) => a + r.accuracy, 0) / mocks.length) : 0;
  const subjects = Object.entries(SUBJECT_WEIGHT).reduce((a, [s, w]) => a + w * subject[s], 0);
  const overall = Math.round(0.7 * subjects + 0.15 * pyqScore + 0.15 * mockScore);
  const weakest = Object.keys(SUBJECT_WEIGHT).sort((a, b) => subject[a] - subject[b])[0];
  return { overall, quant: subject.quant, english: subject.english, gs: subject.gs, pyq: pyqScore, mock: mockScore, weakest };
}

/** The most recent plan test result (by plan day), or null. */
export function latestTest(tests) {
  const days = Object.keys(tests || {}).map(Number).filter((d) => d > 0).sort((a, b) => b - a);
  return days.length ? { day: days[0], ...tests[days[0]] } : null;
}

/**
 * What to change because of the latest test: weak topics (below 50%) get revision tomorrow,
 * strong ones (90%+) may skip their next spaced revision.
 */
export function adaptiveAdvice(tests) {
  const last = latestTest(tests);
  if (!last) return { weak: [], strong: [] };
  return { day: last.day, weak: last.weakTopics || [], strong: last.strongTopics || [] };
}

/** A spaced-revision item the student already knows well (strong mastery or 90%+ in the latest test). */
export function canSkip(item, { mastery = {}, advice = { strong: [] } } = {}) {
  const m = mastery[`${item.subject}.${item.topic}`];
  return m?.status === 'strong' || advice.strong.some((x) => x.subject === item.subject && x.topic === item.topic);
}

/** End-of-day summary: done or not, topics to revise, and the weakest subject in today's test. */
export function daySummary(day, { done, tests }) {
  const required = day.tasks.filter((x) => !x.optional && x.kind !== 'rest');
  const complete = required.every((x) => done.has(x.id));
  const result = tests?.[day.day] ?? null;
  const subjects = Object.entries(result?.bySubject || {}).filter(([, v]) => v.total > 0);
  const weakArea = subjects.length ? subjects.sort(([, a], [, b]) => a.accuracy - b.accuracy)[0][0] : null;
  return { complete, remaining: required.filter((x) => !done.has(x.id)).length, result, revise: result?.weakTopics || [], weakArea };
}

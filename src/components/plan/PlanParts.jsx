import { Link } from 'react-router-dom';
import { PLAN, PLAN_UI } from '../../lib/planCopy';
import { canSkip, chapterLink, pyqLink, taskLink, TEST_KINDS } from '../../lib/studyPlan';
import PriorityBadge from '../priority/PriorityBadge';
import { usePyqTopics } from '../../hooks/usePyqTopics';
import { Localized } from '../topic-hub/Localized';
import { CheckIcon } from '../topic-hub/icons';

export const box = 'rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800';
const chip = 'inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200';
const linkCls = 'font-semibold text-indigo-700 underline underline-offset-2 hover:text-indigo-500 dark:text-indigo-300';

export function taskTitle(task) {
  if (task.kind !== 'learn') return task.title;
  const title = PLAN.learnTitle(task.name);
  if (!task.session || task.session.of < 2) return title;
  const s = PLAN.session(task.session.n, task.session.of);
  return { en: `${title.en} (${s.en})`, bn: `${title.bn} (${s.bn})` };
}

function TaskBody({ task, ctx }) {
  // Only link to past questions for chapters that have some; an empty set looks like a finished one.
  const pyqTopics = usePyqTopics();
  if (task.kind === 'learn') {
    return (
      <div className="mt-2 space-y-2 text-sm">
        {task.learn?.length > 0 && (
          <div>
            <Localized value={PLAN_UI.learnList} className="font-semibold text-slate-900 dark:text-white" />:
            <ul className="ml-5 mt-1 list-disc text-slate-700 dark:text-slate-200">{task.learn.map((l, i) => <li key={i}><Localized value={l} /></li>)}</ul>
          </div>
        )}
        {task.split && (
          <p className="flex flex-wrap gap-1.5">
            {Object.entries(task.split).map(([k, m]) => <span key={k} className={chip}><Localized value={PLAN_UI.split[k]} />: <Localized value={PLAN_UI.min(m)} className="ml-1" /></span>)}
            {task.questions ? <span className={chip}><Localized value={PLAN_UI.questions(task.questions)} /></span> : null}
            {task.accuracyTarget ? <span className={`${chip} bg-amber-50 text-amber-900 dark:bg-amber-500/10 dark:text-amber-200`}><Localized value={PLAN_UI.target(task.accuracyTarget)} /></span> : null}
          </p>
        )}
        {task.packs?.length > 0 && (
          <p><Localized value={PLAN_UI.topicPages} />: {task.packs.map((c, i) => <span key={c}>{i > 0 && ' · '}<Link to={`/learn/gk/topic/${c}`} className={linkCls}>{c}</Link></span>)}</p>
        )}
        {task.outcome && <p className="text-slate-600 dark:text-slate-300"><Localized value={PLAN_UI.outcome} className="font-semibold" />: <Localized value={task.outcome} /></p>}
        {!task.optional && pyqTopics?.has(`${task.subject}.${task.topic}`) && <Link to={pyqLink(task.subject, task.topic)} className={`${linkCls} text-xs`}>🏆 <Localized value={PLAN_UI.howAsked} /></Link>}
      </div>
    );
  }
  if (task.kind === 'spaced') {
    return (
      <ul className="mt-2 space-y-1 text-sm">
        {task.items.map((it) => (
          <li key={`${it.subject}.${it.topic}`} className="flex flex-wrap items-center gap-x-2">
            <Link to={chapterLink(it.subject, it.topic, 'revision')} className={linkCls}><Localized value={it.name} /></Link>
            <span className="text-xs text-slate-500">(<Localized value={PLAN_UI.spacedKind[it.kind]} />, <Localized value={PLAN_UI.learnedOn(it.learnedDay)} />)</span>
            {canSkip(it, ctx) && <Localized value={PLAN_UI.canSkip} className="rounded bg-emerald-50 px-1.5 text-xs text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300" />}
          </li>
        ))}
      </ul>
    );
  }
  if (TEST_KINDS.has(task.kind)) {
    return (
      <div className="mt-2 space-y-2 text-sm">
        <Localized value={task.kind === 'full_mock' ? PLAN_UI.mockRules : PLAN_UI.testSizes(task.sizes)} as="p" className="text-slate-600 dark:text-slate-300" />
        <button type="button" onClick={() => ctx.onStartTest(task)} className="inline-flex min-h-10 items-center rounded-lg bg-emerald-600 px-3 font-bold text-white hover:bg-emerald-500">
          <Localized value={PLAN_UI.startTest} />
        </button>
      </div>
    );
  }
  if (task.kind === 'pyq_topics' || task.kind === 'revise_subjects') {
    return (
      <div className="mt-2 text-sm">
        {task.mustOnly && <Localized value={PLAN_UI.mustOnly} as="p" className="text-slate-600 dark:text-slate-300" />}
        <ul className="flex flex-wrap gap-2">
          {task.items.map((it) => {
            const to = task.kind === 'pyq_topics' ? pyqLink(it.subject, it.topic) : chapterLink(it.subject, it.topic, 'revision');
            return (
              <li key={`${it.subject}.${it.topic}`}>
                <Link to={to} className="inline-flex min-h-9 items-center rounded-lg px-3 font-semibold text-indigo-700 ring-1 ring-slate-200 hover:bg-indigo-50 dark:text-indigo-300 dark:ring-slate-700">
                  <Localized value={it.name ?? PLAN_UI.subjects[it.subject]} />
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    );
  }
  if (task.kind === 'strategy') {
    return <ul className="ml-5 mt-2 list-disc space-y-1 text-sm text-slate-700 dark:text-slate-200">{PLAN_UI.strategy.map((s, i) => <li key={i}><Localized value={s} /></li>)}</ul>;
  }
  return null;
}

/** One task of a plan day: tick, title, minutes, details by kind, and where to do it. */
export function TaskCard({ task, done, onToggle, ctx }) {
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
        <p className={`font-semibold ${done ? 'text-slate-400 line-through' : 'text-slate-900 dark:text-white'}`}><Localized value={taskTitle(task)} /></p>
        <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          {task.minutes > 0 && <Localized value={PLAN.minutes(task.minutes)} />}
          {task.optional && <Localized value={PLAN.optional} className="rounded bg-slate-100 px-1.5 py-0.5 dark:bg-slate-800" />}
          {task.kind === 'learn' && <PriorityBadge subject={task.subject} topics={[task.topic]} />}
        </p>
        {!done && <TaskBody task={task} ctx={ctx} />}
      </div>
      {link && task.kind !== 'learn' && !TEST_KINDS.has(task.kind) && (
        <Link to={link} className="inline-flex min-h-10 shrink-0 items-center rounded-lg px-3 text-sm font-semibold text-indigo-700 ring-1 ring-slate-200 hover:bg-indigo-50 dark:text-indigo-300 dark:ring-slate-700">
          <Localized value={PLAN.open} />
        </Link>
      )}
      {task.kind === 'learn' && (
        <Link to={link} className="inline-flex min-h-10 shrink-0 items-center rounded-lg px-3 text-sm font-semibold text-indigo-700 ring-1 ring-slate-200 hover:bg-indigo-50 dark:text-indigo-300 dark:ring-slate-700">
          <Localized value={PLAN_UI.openLesson} />
        </Link>
      )}
    </li>
  );
}

const bar = (v) => (
  <div className="mt-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800">
    <div className={`h-2 rounded-full ${v >= 70 ? 'bg-emerald-500' : v >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${v}%` }} />
  </div>
);

/** WBPSC Clerkship readiness: overall, per subject, PYQ and mocks, and the biggest gap. */
export function ReadinessCard({ score, signedIn }) {
  return (
    <section aria-labelledby="readiness" className={box}>
      <h2 id="readiness" className="text-lg font-bold text-slate-900 dark:text-white"><Localized value={PLAN_UI.readinessTitle} /></h2>
      {!signedIn ? (
        <Localized value={PLAN_UI.signInReadiness} as="p" className="mt-1 text-sm text-slate-600 dark:text-slate-300" />
      ) : (
        <>
          <p className="mt-2 text-3xl font-extrabold tabular-nums text-slate-900 dark:text-white">{score.overall}% <Localized value={PLAN_UI.overall} className="text-sm font-semibold text-slate-500" /></p>
          <ul className="mt-3 grid gap-3 sm:grid-cols-5">
            {['quant', 'english', 'gs', 'pyq', 'mock'].map((k) => (
              <li key={k} className="text-sm">
                <Localized value={PLAN_UI.subjects[k]} className="font-semibold" /> <span className="tabular-nums">{score[k]}%</span>
                {bar(score[k])}
              </li>
            ))}
          </ul>
          <Localized value={PLAN_UI.biggestArea(score.weakest)} as="p" className="mt-3 font-semibold text-indigo-700 dark:text-indigo-300" />
          <Localized value={PLAN_UI.readinessRule} as="p" className="mt-2 text-xs text-slate-500 dark:text-slate-400" />
        </>
      )}
    </section>
  );
}

/** End of the day: complete or not, today's test score, topics to revise, weakest subject. */
export function DaySummaryCard({ summary }) {
  const r = summary.result;
  return (
    <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm dark:bg-slate-800/60">
      <Localized value={summary.complete ? PLAN_UI.dayComplete : PLAN_UI.dayRemaining(summary.remaining)} as="p" className="font-bold text-slate-900 dark:text-white" />
      {r && <Localized value={PLAN_UI.todaysTest(r.correct, r.total, r.accuracy)} as="p" className="mt-1" />}
      {summary.revise.length > 0 && (
        <p className="mt-1">
          ❌ {summary.revise.map((w, i) => <span key={w.topic}>{i > 0 && ', '}<Link to={chapterLink(w.subject, w.topic, 'revision')} className={linkCls}><Localized value={w.name} /></Link></span>)}
        </p>
      )}
      {summary.weakArea && <Localized value={PLAN_UI.weakArea(summary.weakArea)} as="p" className="mt-1" />}
    </div>
  );
}

/** Adaptive advice from the latest test: revise weak topics, move on from strong ones. */
export function AdviceCard({ advice }) {
  if (!advice.weak.length && !advice.strong.length) return null;
  return (
    <section aria-labelledby="advice" className={box}>
      <h2 id="advice" className="text-lg font-bold text-slate-900 dark:text-white"><Localized value={PLAN_UI.adaptiveTitle} /></h2>
      <ul className="mt-2 space-y-2 text-sm">
        {advice.weak.map((w) => (
          <li key={`w.${w.subject}.${w.topic}`}>
            <Link to={chapterLink(w.subject, w.topic, 'revision')} className="text-rose-800 hover:underline dark:text-rose-300"><Localized value={PLAN_UI.weakAdvice(w.name, w.accuracy)} /></Link>
          </li>
        ))}
        {advice.strong.map((s) => <li key={`s.${s.subject}.${s.topic}`} className="text-emerald-800 dark:text-emerald-300"><Localized value={PLAN_UI.strongAdvice(s.name, s.accuracy)} /></li>)}
      </ul>
    </section>
  );
}

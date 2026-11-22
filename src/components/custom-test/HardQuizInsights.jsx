import { Link } from 'react-router-dom';
import { CT, withNames } from '../../lib/customTestCopy';
import { learnPaths } from '../../lib/routes';
import { Localized } from '../topic-hub/Localized';

const card = 'rounded-2xl bg-white p-4 ring-1 ring-slate-200 sm:p-5 dark:bg-slate-900 dark:ring-slate-800';
const btn = 'inline-flex min-h-11 items-center justify-center gap-1.5 rounded-xl px-4 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-indigo-500';
const TONE = {
  strong: 'text-emerald-700 dark:text-emerald-300',
  ok: 'text-amber-700 dark:text-amber-300',
  weak: 'text-rose-700 dark:text-rose-300',
};
const ICON = { strong: '✓', ok: '•', weak: '⚠' };

/**
 * "Why was this hard?" after a Math test: accuracy per skill (reverse, mixed, trap, ...), the
 * Speed Challenge numbers, and one next step chosen by the server (hardQuiz.logic nextStep).
 * @param {{ r: object, subject: string, busy: string|null, onRun: (kind: string, body: object) => void, reviseLink: (subject, topic) => string }} props
 */
export default function HardQuizInsights({ r, subject, busy, onRun, reviseLink }) {
  const skills = r.skills ?? [];
  const next = r.nextStep;
  if (!skills.length && !r.speed && !next) return null;
  const strong = skills.filter((s) => s.status === 'strong');
  const weak = skills.filter((s) => s.status === 'weak');

  return (
    <section className={card} aria-labelledby="hq-why">
      <h2 id="hq-why" className="text-base font-extrabold text-slate-900 dark:text-white"><Localized value={r.custom.preset === 'speed' ? CT.hq.speedTitle : CT.hq.title} /></h2>

      {r.speed && (
        <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            [CT.hq.completed, `${r.speed.completed}/${r.speed.questions}`],
            [CT.hq.avgTime, r.speed.avgSecPerQuestion != null ? `${r.speed.avgSecPerQuestion}s` : '—'],
            [CT.hq.skipped, r.speed.skipped],
            [CT.hq.rushed, r.speed.rushedMistakes],
          ].map(([label, value]) => (
            <div key={label.en} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/60">
              <Localized value={label} as="dt" className="text-xs font-semibold text-slate-500 dark:text-slate-400" />
              <dd className="text-lg font-extrabold tabular-nums text-slate-900 dark:text-white">{value}</dd>
            </div>
          ))}
        </dl>
      )}
      {r.speed?.plannedSecPerQuestion != null && <Localized value={CT.hq.speedHint(r.speed.plannedSecPerQuestion)} as="p" className="mt-2 text-xs text-slate-500 dark:text-slate-400" />}

      {skills.length > 0 && (
        <>
          {(strong.length > 0 || weak.length > 0) && (
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {strong.length > 0 && (
                <p className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-900 ring-1 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-100 dark:ring-emerald-500/30">
                  <Localized value={CT.hq.strongIn} className="font-bold" />{' '}
                  {strong.map((s, i) => <span key={s.skill}>{i > 0 && ', '}<Localized value={CT.hq.skills[s.skill]} /></span>)}
                </p>
              )}
              {weak.length > 0 && (
                <p className="rounded-xl bg-rose-50 p-3 text-sm text-rose-900 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-100 dark:ring-rose-500/30">
                  <Localized value={CT.hq.weakIn} className="font-bold" />{' '}
                  {weak.map((s, i) => <span key={s.skill}>{i > 0 && ', '}<Localized value={CT.hq.skills[s.skill]} /></span>)}
                </p>
              )}
            </div>
          )}
          <Localized value={CT.hq.patternPerformance} as="h3" className="mt-4 text-sm font-bold text-slate-900 dark:text-white" />
          <ul className="mt-1.5 grid gap-1.5 text-sm sm:grid-cols-2">
            {skills.map((s) => (
              <li key={s.skill} className="flex items-baseline justify-between gap-2 rounded-lg px-1">
                <span className="min-w-0">
                  <Localized value={CT.hq.skills[s.skill]} className="font-medium" />
                  <Localized value={CT.hq.skillHints[s.skill]} as="span" className="block text-xs text-slate-500 dark:text-slate-400" />
                </span>
                <span className={`shrink-0 font-semibold ${TONE[s.status]}`}>
                  <span aria-hidden="true">{ICON[s.status]}</span> <Localized value={CT.hq.status[s.status]} /> · <span className="tabular-nums">{s.correct}/{s.total}</span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      {next && (
        <div className="mt-4 rounded-xl bg-indigo-50 p-3 ring-1 ring-indigo-200 dark:bg-indigo-500/10 dark:ring-indigo-500/30">
          <Localized value={CT.hq.nextTitle} as="p" className="text-xs font-bold uppercase tracking-wide text-indigo-700 dark:text-indigo-300" />
          <Localized value={withNames(CT.hq.next[next.action], next.name ?? { en: '' }, next.patternName ?? { en: '' })} as="p" className="mt-1 text-sm font-semibold text-slate-900 dark:text-white" />
          <div className="mt-2 flex flex-wrap gap-2">
            {(next.action === 'harder_mix' || next.action === 'new_pattern') && subject === 'quant' && (
              <button type="button" disabled={Boolean(busy)} onClick={() => onRun('hard', { subject, preset: 'hard', topics: r.custom.topics })} className={`${btn} bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-60`}>
                <Localized value={busy === 'hard' ? CT.starting : CT.hardPreset} />
              </button>
            )}
            {next.action === 'more_moderate' && (
              <button type="button" disabled={Boolean(busy)} onClick={() => onRun('moderate', { subject, preset: 'custom', topics: r.custom.topics.length ? r.custom.topics : r.chapters.map((c) => c.topic), difficulty: 'moderate', questionCount: 10, mode: 'practice' })} className={`${btn} bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-60`}>
                <Localized value={busy === 'moderate' ? CT.starting : CT.hq.moderateBtn} />
              </button>
            )}
            {(next.action === 'review_concept' || next.action === 'foundation') && next.topic && (
              <>
                <Link to={reviseLink(subject, next.topic)} className={`${btn} bg-indigo-600 text-white hover:bg-indigo-500`}>📖 <Localized value={withNames(CT.reviseBtn, next.name ?? { en: next.topic })} /></Link>
                {subject !== 'gs' && <Link to={learnPaths.quiz(subject, next.topic, 'beginner')} className={`${btn} ring-1 ring-slate-300 dark:ring-slate-700`}><Localized value={CT.basicQuiz} /></Link>}
              </>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

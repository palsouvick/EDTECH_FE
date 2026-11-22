import { Fragment, useEffect, useState } from 'react';
import { request } from '../lib/api';

const STATUS = {
  good: { icon: '🟢', label: 'Good coverage', tone: 'bg-emerald-50 text-emerald-900 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/30' },
  needs_more: { icon: '🟡', label: 'Needs more patterns', tone: 'bg-amber-50 text-amber-900 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-200 dark:ring-amber-500/30' },
  poor: { icon: '🔴', label: 'Poor coverage', tone: 'bg-rose-50 text-rose-900 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-200 dark:ring-rose-500/30' },
};
const FLAG = {
  many_questions_few_patterns: 'Many questions, few patterns',
  one_template_dominates: 'One question shape dominates',
  no_hard_questions: 'No hard (level 4–5) questions',
  no_challenge_level: 'No challenge (level 5) questions',
  no_hard_matrix: 'No Hard pattern matrix',
  many_untagged: 'Many questions without a pattern',
};

/**
 * /admin/math-coverage — per Math chapter: questions, patterns covered, distinct question shapes
 * (templates), level spread and flags. Quantity is not quality: 100 questions in 3 shapes is
 * worse than 60 in 15, so both are shown.
 */
export default function AdminMathCoverage() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(null);

  useEffect(() => {
    request('/admin/math-coverage').then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800">{error}</p>;
  if (!data) return <p aria-busy="true" className="h-40 animate-pulse rounded-xl bg-slate-200/60 dark:bg-slate-800" />;
  const t = data.totals;

  return (
    <div className="space-y-4 text-slate-800 dark:text-slate-100">
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          ['Questions', t.questions],
          ['Patterns covered', `${t.patternsCovered}/${t.patternsAvailable}`],
          ['🟢 Good', t.good],
          ['🟡 Needs more', t.needsMore],
          ['🔴 Poor', t.poor],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-white p-3 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
            <dt className="text-xs font-semibold text-slate-500">{k}</dt>
            <dd className="text-xl font-extrabold tabular-nums">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="text-xs text-slate-500">
        Template = a question shape (numbers and names masked). Coverage counts learning patterns plus Hard patterns. A level counts as missing below {data.thresholds.MIN_PER_LEVEL} questions.
      </p>
      <div className="overflow-x-auto rounded-xl bg-white ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
        <table className="w-full min-w-[56rem] text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
              {['Chapter', 'Status', 'Questions', 'Patterns covered', 'Hard patterns', 'Templates', 'Largest shape', 'Levels 1/2/3/4/5', 'Flags'].map((h) => <th key={h} className="px-3 py-2 font-semibold">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.chapters.map((c) => (
              <Fragment key={c.topic}>
                <tr className="cursor-pointer border-t border-slate-100 align-top hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-800/50" onClick={() => setOpen(open === c.topic ? null : c.topic)}>
                  <td className="px-3 py-2 font-semibold">{c.name?.en ?? c.topic}</td>
                  <td className="px-3 py-2"><span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ring-1 ${STATUS[c.status].tone}`}>{STATUS[c.status].icon} {STATUS[c.status].label}</span></td>
                  <td className="px-3 py-2 tabular-nums">{c.questions}{c.pyq ? <span className="text-xs text-slate-500"> ({c.pyq} PYQ)</span> : null}</td>
                  <td className="px-3 py-2 tabular-nums">{c.patternsCoveredTotal}/{c.patternsAvailable} <span className="text-xs text-slate-500">({c.coveragePct}%)</span></td>
                  <td className="px-3 py-2 tabular-nums">{c.hardPatterns ? `${c.hardPatternsCovered}/${c.hardPatterns}` : '—'}</td>
                  <td className="px-3 py-2 tabular-nums">{c.templates} <span className="text-xs text-slate-500">(~{c.questionsPerTemplate}/shape)</span></td>
                  <td className="px-3 py-2 tabular-nums">{c.largestTemplateShare}%</td>
                  <td className="px-3 py-2 tabular-nums">{[1, 2, 3, 4, 5].map((d) => <span key={d} className={c.missingLevels.includes(d) ? 'font-bold text-rose-600' : ''}>{d > 1 && '/'}{c.levels[d]}</span>)}</td>
                  <td className="px-3 py-2 text-xs">{c.flags.map((f) => FLAG[f] ?? f).join(' · ') || '—'}</td>
                </tr>
                {open === c.topic && (
                  <tr className="bg-slate-50 dark:bg-slate-800/40">
                    <td colSpan={9} className="px-3 py-2 text-xs">
                      <span className="font-semibold">Learning patterns with no questions ({c.missingPatterns.length}):</span>{' '}
                      {c.missingPatterns.length ? c.missingPatterns.join(', ') : 'none'}
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-slate-500">Generated {new Date(data.generatedAt).toLocaleString()}. Read-only; computed from published questions.</p>
    </div>
  );
}

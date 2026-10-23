import { useRef, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';
import { useDataSource } from '../app/DataSourceContext';
import { useResource } from '../hooks/useResource';
import { FUNNEL, PERF, examLabel } from '../lib/i18n';
import { paths } from '../lib/routes';
import { loginPath } from '../components/auth/AccountButton';
import { useWidth } from '../components/analytics/charts';
import { Localized } from '../components/topic-hub/Localized';
import { FlameIcon } from '../components/topic-hub/icons';
import FunnelLayout, { CardGridSkeleton, LoadError } from './funnel/FunnelLayout';

const card = 'rounded-2xl bg-white p-5 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800';
const SERIES = '#4f46e5'; // indigo-600: the one series on this page
const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

function Tile({ label, value, sub, icon }) {
  return (
    <div className={card}>
      <Localized value={label} as="div" className="text-sm text-slate-500 dark:text-slate-400" />
      <div className="mt-1 flex items-center gap-1.5 text-3xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-white">
        {icon}
        {value}
      </div>
      {sub && <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{sub}</div>}
    </div>
  );
}

/** Mock score % over time: one 2px line, 8px markers, gridlines at 0/50/100, tooltip on hover or focus. */
function ScoreTrend({ points }) {
  const box = useRef(null);
  const width = useWidth(box, 560);
  const [hover, setHover] = useState(null);
  const H = 160;
  const pad = { l: 30, r: 12, t: 12, b: 22 };
  const W = Math.max(width, 240);
  const n = points.length;
  const x = (i) => pad.l + (n === 1 ? (W - pad.l - pad.r) / 2 : (i / (n - 1)) * (W - pad.l - pad.r));
  const y = (p) => pad.t + (1 - Math.max(0, Math.min(100, p)) / 100) * (H - pad.t - pad.b);
  const path = points.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.pct)}`).join(' ');
  const hov = hover != null ? points[hover] : null;

  return (
    <div ref={box} className="relative">
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block" role="img" aria-label={`Mock scores, oldest to newest: ${points.map((p) => `${p.pct}%`).join(', ')}`}>
        {[0, 50, 100].map((g) => (
          <g key={g}>
            <line x1={pad.l} x2={W - pad.r} y1={y(g)} y2={y(g)} className="stroke-slate-200 dark:stroke-slate-800" strokeWidth="1" />
            <text x={pad.l - 6} y={y(g) + 3} textAnchor="end" className="fill-slate-400 text-[10px] tabular-nums">{g}%</text>
          </g>
        ))}
        {n > 1 && <path d={path} fill="none" stroke={SERIES} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />}
        {points.map((p, i) => (
          <g
            key={p.sessionId}
            tabIndex={0}
            role="img"
            aria-label={`${fmtDate(p.submittedAt)}: ${p.pct}%`}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            onFocus={() => setHover(i)}
            onBlur={() => setHover(null)}
            className="outline-none"
          >
            <rect x={x(i) - 14} y={pad.t} width="28" height={H - pad.t - pad.b} fill="transparent" />
            {/* 2px surface ring keeps the marker readable where it sits on the line */}
            <circle cx={x(i)} cy={y(p.pct)} r={hover === i ? 6 : 4} fill={SERIES} strokeWidth="2" className="stroke-white dark:stroke-slate-900" />
          </g>
        ))}
        {n > 0 && (
          <>
            <text x={x(0)} y={H - 6} textAnchor={n === 1 ? 'middle' : 'start'} className="fill-slate-400 text-[10px]">{fmtDate(points[0].submittedAt)}</text>
            {n > 1 && <text x={x(n - 1)} y={H - 6} textAnchor="end" className="fill-slate-400 text-[10px]">{fmtDate(points[n - 1].submittedAt)}</text>}
          </>
        )}
      </svg>
      {hov && (
        <div
          role="status"
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs text-white shadow-lg dark:bg-white dark:text-slate-900"
          style={{ left: x(hover), top: y(hov.pct) - 10 }}
        >
          <span className="font-semibold tabular-nums">{hov.pct}%</span> · {fmtDate(hov.submittedAt)}
        </div>
      )}
    </div>
  );
}

function SubjectBars({ subjects }) {
  return (
    <ul className="space-y-3">
      {subjects.map((s) => (
        <li key={s.subject}>
          <div className="mb-1 flex items-baseline justify-between gap-2 text-sm">
            {s.name ? <Localized value={s.name} className="min-w-0 truncate text-slate-700 dark:text-slate-200" /> : <span>{s.subject}</span>}
            <span className="shrink-0 tabular-nums text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-900 dark:text-white">{s.accuracyPct}%</span> · {s.correct}/{s.attempts}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" aria-hidden="true">
            <div className="h-full rounded-full" style={{ width: `${s.accuracyPct}%`, background: SERIES }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** /me: the signed-in student's practice and mock history. */
export default function PerformancePage() {
  const { status, user } = useAuth();
  const source = useDataSource();
  const location = useLocation();
  const res = useResource(user ? `performance:${user.id}` : null, () => source.getPerformance());

  if (status === 'ready' && !user) return <Navigate to={loginPath(location)} replace />;
  const d = res.data;
  const s = d?.summary;
  const crumbs = [
    { key: 'exams', name: FUNNEL.exams, to: paths.exams() },
    { key: 'me', name: PERF.title },
  ];

  return (
    <FunnelLayout crumbs={crumbs} title={PERF.title} subtitle={user && <Localized value={PERF.hello(user.name)} />}>
      {res.status === 'error' && !d ? (
        <LoadError error={res.error} onRetry={res.retry} />
      ) : !d ? (
        <CardGridSkeleton count={6} height="h-28" />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <Tile label={PERF.practiced} value={s.practiceAttempts.toLocaleString('en-IN')} />
            <Tile label={PERF.practiceAccuracy} value={s.practiceAttempts ? `${s.practiceAccuracyPct}%` : '—'} />
            <Tile label={PERF.mocksTaken} value={s.mocksTaken} />
            <Tile
              label={PERF.avgMock}
              value={s.avgMockScorePct != null ? `${s.avgMockScorePct}%` : '—'}
              sub={s.bestMockScorePct != null && <Localized value={PERF.best(s.bestMockScorePct)} />}
            />
            <Tile label={PERF.today} value={s.attemptedToday} />
            <Tile label={PERF.streak} value={s.streakDays} icon={<FlameIcon width={24} height={24} className="text-orange-500" aria-hidden="true" />} />
          </div>

          {!s.practiceAttempts && !s.mocksTaken && (
            <div className={`${card} text-center`}>
              <Localized value={PERF.empty} as="p" className="text-slate-700 dark:text-slate-200" />
              <Link to={paths.exams()} className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-500">
                <Localized value={PERF.startPractice} />
              </Link>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            {d.mockTrend.length > 0 && (
              <section className={card}>
                <Localized value={PERF.trend} as="h2" className="font-semibold text-slate-900 dark:text-white" />
                <Localized value={PERF.trendHint} as="p" className="mb-3 text-xs text-slate-500 dark:text-slate-400" />
                <ScoreTrend points={d.mockTrend} />
              </section>
            )}
            {d.subjects.length > 0 && (
              <section className={card}>
                <Localized value={PERF.bySubject} as="h2" className="mb-3 font-semibold text-slate-900 dark:text-white" />
                <SubjectBars subjects={d.subjects} />
              </section>
            )}
          </div>

          {s.practiceAttempts > 0 && (
            <section className={card}>
              <Localized value={PERF.weak} as="h2" className="font-semibold text-slate-900 dark:text-white" />
              <Localized value={PERF.weakHint(d.minAttemptsForWeak)} as="p" className="mb-3 text-xs text-slate-500 dark:text-slate-400" />
              {d.weakTopics.length ? (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {d.weakTopics.map((w) => (
                    <li key={`${w.subject}.${w.topic}`} className="flex items-center gap-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        {w.name ? <Localized value={w.name} className="font-medium text-slate-900 dark:text-white" /> : w.topic}
                        <div className="text-xs tabular-nums text-slate-500 dark:text-slate-400">
                          <span className="font-semibold text-slate-800 dark:text-slate-100">{w.accuracyPct}%</span> · <Localized value={PERF.answers(w.attempts)} />
                        </div>
                      </div>
                      {w.category && (
                        <Link
                          to={`${paths.topic(w.category, w.subject, w.topic)}?practice=15`}
                          className="inline-flex min-h-10 shrink-0 items-center rounded-lg px-3 text-sm font-semibold text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-50 dark:text-indigo-300 dark:ring-indigo-800 dark:hover:bg-indigo-950"
                        >
                          <Localized value={PERF.practice} />
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <Localized value={PERF.noWeak(d.minAttemptsForWeak)} as="p" className="text-sm text-slate-600 dark:text-slate-300" />
              )}
            </section>
          )}

          <section className={card}>
            <Localized value={PERF.recent} as="h2" className="mb-2 font-semibold text-slate-900 dark:text-white" />
            {d.recentMocks.length ? (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {d.recentMocks.map((m) => (
                  <li key={m.sessionId}>
                    <Link to={`/mock/${m.sessionId}`} className="flex items-center gap-3 rounded-lg py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-slate-900 dark:text-white">
                          {examLabel(m.category)} · {m.subjectName ? <Localized value={m.subjectName} /> : m.subject}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {fmtDate(m.submittedAt)} · <Localized value={PERF.questionsShort(m.questionCount)} />
                        </div>
                      </div>
                      <div className="text-right tabular-nums">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {m.score}/{m.maxScore}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">{m.scorePct}%</div>
                      </div>
                      <span className="sr-only"><Localized value={PERF.viewAnalysis} /></span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <Localized value={PERF.noMocks} as="p" className="text-sm text-slate-600 dark:text-slate-300" />
            )}
          </section>
        </div>
      )}
    </FunnelLayout>
  );
}

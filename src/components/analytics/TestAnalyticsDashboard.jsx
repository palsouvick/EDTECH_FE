import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useResource } from '../../hooks/useResource';
import { languageStore } from '../../hooks/useLanguagePreference';
import {
  ANALYTICS,
  MOCK,
  cutoffNone,
  overTarget,
  percentileBasis,
  percentilePending,
  practiceN,
  rankLabel,
  retryBlanks,
  retryLine,
  targetSeconds,
  tierLabel,
  vsCutoff,
  weakLine,
} from '../../lib/i18n';
import { paths } from '../../lib/routes';
import { formatClock } from '../../hooks/useExamTimer';
import { buildRetrySet } from '../../features/analytics/retryQuiz';
import { Localized } from '../topic-hub/Localized';
import { ArrowRightIcon, TrophyIcon } from '../topic-hub/icons';
import { AnswerBar, RingGauge, TimeChart, TopicAccuracyBars } from './charts';
import ReviewMatrix from './ReviewMatrix';

const WEAK_TOPIC_PRACTICE = 15;

/** "SSC · Quantitative Aptitude · Mock Test" from the analytics payload (the local exam record is gone after submit). */
const examNameFrom = (d) =>
  Object.fromEntries(
    ['en', 'bn', 'hi'].map((l) => {
      const pick = (v) => v?.[l] ?? v?.en;
      return [l, [pick(d.category.name) ?? d.category.code, pick(d.subject.name), MOCK.mockTest[l]].filter(Boolean).join(' · ')];
    }),
  );

function Card({ title, children, className = '' }) {
  return (
    <section className={`rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 sm:p-5 dark:bg-slate-900 dark:ring-slate-800 ${className}`}>
      {title && (
        <h2 className="mb-3 text-sm font-semibold text-slate-900 dark:text-white">
          <Localized value={title} />
        </h2>
      )}
      {children}
    </section>
  );
}

function Stat({ label, value, hint }) {
  return (
    <div className="min-w-0">
      <Localized value={label} as="p" className="text-xs font-medium text-slate-500 dark:text-slate-400" />
      <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-white">{value}</p>
      {hint && <div className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{hint}</div>}
    </div>
  );
}

/** Marker track 0–100% with the student's score and each official cut-off. */
function CutoffIndicator({ cutoffs, myPct, categoryName }) {
  if (!cutoffs.length) {
    return <Localized value={cutoffNone(categoryName ?? { en: 'this exam' })} as="p" className="text-sm text-slate-500 dark:text-slate-400" />;
  }
  return (
    <div>
      <div className="relative mb-8 mt-6 h-2 rounded-full bg-slate-100 dark:bg-slate-800" role="img" aria-label={`You ${myPct}%; cut-offs ${cutoffs.map((c) => `${c.reservation} ${c.pct}%`).join(', ')}`}>
        <div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.max(0, Math.min(100, myPct))}%` }} />
        {cutoffs.map((c) => (
          <span key={`${c.examCode}-${c.reservation}`} className="absolute top-1/2 h-4 w-0.5 -translate-y-1/2 bg-slate-900 dark:bg-white" style={{ left: `${c.pct}%` }} />
        ))}
        <span className="absolute -top-6 -translate-x-1/2 whitespace-nowrap text-xs font-semibold text-indigo-700 dark:text-indigo-300" style={{ left: `${Math.max(4, Math.min(96, myPct))}%` }}>
          <Localized value={ANALYTICS.you} /> {myPct}%
        </span>
      </div>
      <ul className="space-y-1.5 text-sm">
        {cutoffs.map((c) => {
          const diff = Math.round((myPct - c.pct) * 10) / 10;
          return (
            <li key={`${c.examCode}-${c.reservation}-row`} className="flex flex-wrap items-baseline justify-between gap-x-3">
              <span className="text-slate-700 dark:text-slate-200">
                {c.examName} {tierLabel(c.stage)} {c.year} · {c.reservation}:{' '}
                <span className="font-semibold tabular-nums">
                  {c.score}/{c.maxScore}
                </span>{' '}
                <span className="text-slate-500">({c.pct}%)</span>
              </span>
              <span className="flex items-center gap-2 text-xs">
                <span className={`font-semibold ${diff >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300'}`}>
                  {diff >= 0 ? '▲' : '▼'} <Localized value={vsCutoff(diff)} />
                </span>
                <a href={c.sourceUrl} target="_blank" rel="noreferrer" className="text-slate-500 underline hover:text-indigo-600">
                  <Localized value={ANALYTICS.source} />
                </a>
              </span>
            </li>
          );
        })}
      </ul>
      <Localized value={ANALYTICS.cutoffNote} as="p" className="mt-3 text-xs text-slate-500 dark:text-slate-400" />
    </div>
  );
}

/**
 * Result & deep performance analytics, shown after a mock test is submitted.
 * Data: GET /mock/session/:id/analytics (source.getMockAnalytics).
 *
 * @param {object} props
 * @param {string} props.sessionId
 * @param {object} props.source     data source
 * @param {object} [props.meta]     exam meta saved at creation (examName)
 * @param {string} [props.backTo]   "Back to topic" link
 */
export default function TestAnalyticsDashboard({ sessionId, source, meta, backTo }) {
  const res = useResource(`analytics:${sessionId}`, () => source.getMockAnalytics(sessionId));
  const [focusSeq, setFocusSeq] = useState(null);
  const d = res.data;

  const derived = useMemo(() => {
    if (!d) return null;
    const r = d.result;
    const counts = {
      CORRECT: r.counts.correct,
      INCORRECT: r.counts.incorrect,
      UNATTEMPTED: r.counts.unattempted + (r.counts.timedOut ?? 0),
    };
    const answered = d.review.filter((q) => q.timeSpentSec > 0);
    const avgTime = answered.length ? answered.reduce((s, q) => s + q.timeSpentSec, 0) / answered.length : 0;
    const targets = d.review.filter((q) => q.expectedTimeSec);
    const avgTarget = targets.length ? targets.reduce((s, q) => s + q.expectedTimeSec, 0) / targets.length : null;
    const slow = d.review.filter((q) => q.expectedTimeSec && q.timeSpentSec > q.expectedTimeSec).length;
    const pct = r.maxScore ? Math.round((r.score / r.maxScore) * 1000) / 10 : 0;
    return { counts, avgTime, avgTarget, slow, pct, retry: buildRetrySet(d.review, d.topicBreakdown) };
  }, [d]);

  if (res.status === 'error' && !d) {
    return (
      <div className="mx-auto mt-16 max-w-md px-4 text-center">
        <p className="font-semibold text-slate-900 dark:text-white">{res.error?.message}</p>
        <button type="button" onClick={res.retry} className="mt-4 min-h-11 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white">
          <Localized value={MOCK.retry} />
        </button>
      </div>
    );
  }
  if (!d) {
    return (
      <div aria-busy="true" aria-label="Loading" className="mx-auto max-w-5xl space-y-4 px-4 py-8">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-36 animate-pulse rounded-2xl bg-slate-200/70 motion-reduce:animate-none dark:bg-slate-800/70" />
        ))}
      </div>
    );
  }

  const { counts, avgTime, avgTarget, slow, pct, retry } = derived;
  const r = d.result;
  const weak = d.weakestTopic;
  const weakName = weak ? d.topicNames?.[weak.topic] ?? { en: weak.topic.replace(/_/g, ' ') } : null;
  const ui = languageStore.get();

  return (
    <div className="mx-auto max-w-5xl space-y-4 px-4 py-6 sm:py-8">
      {/* Header */}
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
            <Localized value={ANALYTICS.title} />
          </p>
          <h1 className="mt-1 truncate text-xl font-bold text-slate-900 sm:text-2xl dark:text-white">
            <Localized value={meta?.examName ?? examNameFrom(d)} />
          </h1>
        </div>
        {backTo && (
          <Link to={backTo} className="flex min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-50 dark:text-slate-200 dark:ring-slate-600 dark:hover:bg-slate-800">
            <Localized value={MOCK.backToTopic} />
          </Link>
        )}
      </header>

      {/* Executive summary */}
      <Card>
        <div className="grid items-center gap-5 sm:grid-cols-[auto_1fr]">
          <div className="flex items-center gap-4">
            <span className="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 text-white shadow-md shadow-amber-500/30">
              <TrophyIcon width={24} height={24} />
            </span>
            <div>
              <Localized value={MOCK.score} as="p" className="text-xs font-medium text-slate-500 dark:text-slate-400" />
              <p className="text-4xl font-bold tabular-nums text-slate-900 dark:text-white">
                {r.score}
                <span className="text-xl font-semibold text-slate-400"> / {r.maxScore}</span>
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                <Localized value={MOCK.negative} />: <span className="tabular-nums">{r.negativeMarksDeducted ? `−${r.negativeMarksDeducted}` : '0'}</span>
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Stat
              label={ANALYTICS.percentile}
              value={d.peers.available ? d.peers.percentile : '—'}
              hint={
                d.peers.available ? (
                  <>
                    <Localized value={rankLabel(d.peers.rank, d.peers.of)} /> · <Localized value={percentileBasis(d.peers.peers, d.peers.basis.questionCount)} />
                  </>
                ) : (
                  <Localized value={percentilePending(d.peers.minPeers)} />
                )
              }
            />
            <Stat label={MOCK.accuracy} value={`${r.accuracyPct}%`} hint={`${counts.CORRECT}/${counts.CORRECT + counts.INCORRECT}`} />
            <Stat
              label={ANALYTICS.timePerQuestion}
              // One decimal under 10 s, so very fast answers do not read as "0s".
              value={`${avgTime < 10 ? Math.round(avgTime * 10) / 10 : Math.round(avgTime)}s`}
              hint={
                <>
                  {avgTarget ? <Localized value={targetSeconds(Math.round(avgTarget))} /> : null} · <Localized value={MOCK.timeTaken} />{' '}
                  {formatClock(r.totalTimeSec * 1000, { compact: true })}
                </>
              }
            />
          </div>
        </div>
      </Card>

      {/* Retention hooks: the two things to do next */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card title={ANALYTICS.weakTitle}>
          {weak ? (
            <>
              <Localized value={weakLine(weakName, weak.incorrect, weak.unattempted, weak.marksLost)} as="p" className="text-[15px] font-semibold text-slate-900 dark:text-white" />
              <Link
                to={`${paths.topic(d.category.code, d.subject.code, weak.topic)}?practice=${WEAK_TOPIC_PRACTICE}`}
                className="mt-3 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                <Localized value={practiceN(WEAK_TOPIC_PRACTICE, weakName)} />
                <ArrowRightIcon width={18} height={18} />
              </Link>
            </>
          ) : (
            <Localized value={ANALYTICS.noWeak} as="p" className="text-sm text-slate-600 dark:text-slate-300" />
          )}
        </Card>
        <Card title={ANALYTICS.retryTitle}>
          {retry.questions.length ? (
            <>
              <Localized
                value={retry.fromIncorrect ? retryLine(retry.fromIncorrect, retry.fromUnattempted) : retryBlanks(retry.questions.length)}
                as="p"
                className="text-sm text-slate-600 dark:text-slate-300"
              />
              <Link
                to={`/mock/${sessionId}/retry`}
                className="mt-3 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 text-sm font-semibold text-white hover:bg-rose-500"
              >
                <Localized value={ANALYTICS.retryStart} />
                <span className="rounded-full bg-white/20 px-2 text-xs tabular-nums">{retry.questions.length}</span>
              </Link>
            </>
          ) : (
            <Localized value={ANALYTICS.retryNone} as="p" className="text-sm text-slate-600 dark:text-slate-300" />
          )}
        </Card>
      </div>

      <Card title={ANALYTICS.cutoffTitle}>
        <CutoffIndicator cutoffs={d.cutoffs} myPct={pct} categoryName={d.category.name} />
      </Card>

      {/* Charts */}
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <Card title={ANALYTICS.answerBreakdown}>
          <div className="flex items-center gap-5">
            <RingGauge value={Math.round(r.accuracyPct)} label={MOCK.accuracy} />
            <div className="min-w-0 flex-1">
              <AnswerBar counts={counts} />
            </div>
          </div>
        </Card>
        <Card title={ANALYTICS.topicAccuracy}>
          <TopicAccuracyBars topics={[...d.topicBreakdown].sort((a, b) => a.accuracyPct - b.accuracyPct)} topicNames={d.topicNames} />
        </Card>
      </div>
      <Card title={ANALYTICS.timeChart}>
        {slow > 0 && <Localized value={overTarget(slow)} as="p" className="-mt-1 mb-2 text-xs font-medium text-amber-700 dark:text-amber-300" />}
        <TimeChart review={d.review} onSelect={(q) => setFocusSeq(q.seq)} />
      </Card>

      <ReviewMatrix review={d.review} topicNames={d.topicNames} defaultView={ui === 'bn' ? 'bn' : 'en'} focusSeq={focusSeq} />
    </div>
  );
}

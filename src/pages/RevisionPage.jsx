import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../app/AuthContext';
import { useDataSource } from '../app/DataSourceContext';
import { loginPath } from '../components/auth/AccountButton';
import PageShell from '../components/navigation/PageShell';
import StageChip from '../components/mastery/StageChip';
import { Localized } from '../components/topic-hub/Localized';
import { ArrowRightIcon } from '../components/topic-hub/icons';
import { REV } from '../lib/revisionHubCopy';
import { chapterLink } from '../lib/studyPlan';
import { paths } from '../lib/routes';
import { GK_REVISION_PATH } from './learn/GkDashboardPage';
import { CardGridSkeleton, LoadError } from './funnel/FunnelLayout';

export const BOOKMARKS_PATH = '/revision/bookmarks';
export const VOCAB_REVIEW_PATH = '/vocabulary?tab=review';
export const PYQ_REVISE_PATH = '/revise?pyq=1';

const card = 'rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-6 dark:bg-slate-900 dark:ring-slate-800';
const linkBtn = 'inline-flex min-h-11 items-center gap-1.5 rounded-xl px-4 text-sm font-bold';

/** Reasoning has no Learn pages yet: its chapters open in the exam funnel. */
const practiseLink = (subject, topic) => (subject === 'reasoning' ? paths.topic('SSC', subject, topic) : chapterLink(subject, topic));

function Section({ id, icon, title, children, action }) {
  return (
    <section className={card} aria-labelledby={id}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 id={id} className="text-lg font-bold text-slate-900 dark:text-white">
          <span aria-hidden="true">{icon} </span>
          <Localized value={title} />
        </h2>
        {action}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Row({ to, label, count }) {
  return (
    <li>
      <Link to={to} className={`flex min-h-12 items-center gap-3 rounded-xl px-3 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 ${count ? '' : 'opacity-60'}`}>
        <Localized value={label} className="min-w-0 flex-1 font-semibold text-slate-800 dark:text-slate-100" />
        <ArrowRightIcon className="shrink-0 text-indigo-500" />
      </Link>
    </li>
  );
}

/**
 * /revision — F13: the ONE place to revise. Six sections over the existing
 * revision tools (nothing moved, nothing rescheduled): the question queue
 * (/revise), the mistake notebook (/mistakes), bookmarks, weak topics from the
 * unified mastery definition, PYQ revision (the same queue, PYQs only), GK
 * fact revision and vocabulary review.
 */
export default function RevisionPage() {
  const { status: authStatus, user } = useAuth();
  const source = useDataSource();
  const location = useLocation();
  const [state, setState] = useState({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!user) return undefined;
    let alive = true;
    setState({ status: 'loading' });
    source.getRevisionHub().then(
      (data) => alive && setState({ status: 'ready', data }),
      (error) => alive && setState({ status: 'error', error }),
    );
    return () => {
      alive = false;
    };
  }, [user, source, attempt]);

  if (authStatus === 'ready' && !user) return <Navigate to={loginPath(location)} replace />;
  const d = state.data;

  // "Start revising" opens the first store with something due.
  const startTo = d
    ? d.dueToday.questions ? '/revise' : d.dueToday.gkFacts ? GK_REVISION_PATH : d.dueToday.vocabulary ? VOCAB_REVIEW_PATH : null
    : null;

  return (
    <PageShell className="max-w-5xl pb-16 pt-6 sm:pt-10">
      <header className="rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-600 to-sky-600 p-6 text-white shadow-lg sm:p-8">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
          <span aria-hidden="true">🔁 </span>
          <Localized value={REV.title} />
        </h1>
        <Localized value={REV.sub} as="p" className="mt-2 max-w-2xl leading-relaxed text-white/95" />
        {d && (
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Localized value={d.dueToday.total ? REV.dueTotal(d.dueToday.total) : REV.nothingDue} as="p" className="text-xl font-extrabold" />
            {startTo && (
              <Link to={startTo} className={`${linkBtn} min-h-12 bg-white px-5 text-base text-teal-800 hover:bg-teal-50`}>
                <Localized value={REV.start} /> <ArrowRightIcon />
              </Link>
            )}
          </div>
        )}
      </header>

      {state.status === 'loading' && <div className="mt-6"><CardGridSkeleton count={6} height="h-40" /></div>}
      {state.status === 'error' && <div className="mt-6"><LoadError error={state.error} onRetry={() => setAttempt((n) => n + 1)} /></div>}

      {d && (
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <Section id="rev-due" icon="📅" title={REV.dueToday}>
            <ul className="space-y-1">
              <Row to="/revise" label={REV.dueQuestions(d.dueToday.questions)} count={d.dueToday.questions} />
              <Row to={GK_REVISION_PATH} label={REV.dueFacts(d.dueToday.gkFacts)} count={d.dueToday.gkFacts} />
              <Row to={VOCAB_REVIEW_PATH} label={REV.dueWords(d.dueToday.vocabulary)} count={d.dueToday.vocabulary} />
            </ul>
          </Section>

          <Section
            id="rev-mistakes"
            icon="📒"
            title={REV.mistakes}
            action={<Link to="/mistakes" className={`${linkBtn} text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-50 dark:text-indigo-300 dark:ring-indigo-500/40`}><Localized value={REV.openNotebook} /></Link>}
          >
            <Localized value={REV.mistakesLine(d.mistakes.open, d.mistakes.repeating)} as="p" className="font-semibold text-slate-800 dark:text-slate-100" />
            {d.mistakes.mastered > 0 && <Localized value={REV.masteredLine(d.mistakes.mastered)} as="p" className="text-sm text-emerald-700 dark:text-emerald-300" />}
            {d.mistakes.bySubject.filter((s) => s.open).length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-2 text-sm">
                {d.mistakes.bySubject.filter((s) => s.open).map((s) => (
                  <li key={s.subject} className="rounded-full bg-rose-50 px-3 py-1 font-semibold text-rose-800 ring-1 ring-rose-200 dark:bg-rose-500/10 dark:text-rose-200 dark:ring-rose-500/30">
                    <Localized value={s.name} /> · <span className="tabular-nums">{s.open}</span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <Section id="rev-bookmarks" icon="🔖" title={REV.bookmarked}>
            <ul className="space-y-1">
              <Row to={BOOKMARKS_PATH} label={REV.bmQuestions(d.bookmarked.questions)} count={d.bookmarked.questions} />
              <Row to={GK_REVISION_PATH} label={REV.bmFacts(d.bookmarked.gkFacts)} count={d.bookmarked.gkFacts} />
              <Row to={VOCAB_REVIEW_PATH} label={REV.bmWords(d.bookmarked.words)} count={d.bookmarked.words} />
            </ul>
          </Section>

          <Section id="rev-weak" icon="🎯" title={REV.weakTopics}>
            <Localized value={REV.weakHint} as="p" className="text-sm text-slate-500 dark:text-slate-400" />
            {d.weakTopics.length ? (
              <ul className="mt-2 space-y-1">
                {d.weakTopics.map((w) => (
                  <li key={`${w.subject}.${w.topic}`}>
                    <Link to={practiseLink(w.subject, w.topic)} className="flex min-h-12 flex-wrap items-center gap-2 rounded-xl px-3 py-2 hover:bg-indigo-50 dark:hover:bg-indigo-500/10">
                      <Localized value={w.name} className="font-semibold text-slate-800 dark:text-slate-100" />
                      <StageChip stage={w.stage} />
                      {w.accuracy != null && <Localized value={REV.accuracy(w.accuracy)} className="text-sm tabular-nums text-slate-500 dark:text-slate-400" />}
                      <ArrowRightIcon className="ml-auto shrink-0 text-indigo-500" />
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <Localized value={REV.noWeak} as="p" className="mt-2 text-slate-600 dark:text-slate-300" />
            )}
          </Section>

          <Section id="rev-pyq" icon="📝" title={REV.pyq}>
            <Localized value={d.pyq.inQueue ? REV.pyqLine(d.pyq.inQueue, d.pyq.dueToday) : REV.pyqEmpty} as="p" className="text-slate-700 dark:text-slate-200" />
            <div className="mt-3 flex flex-wrap gap-2">
              {d.pyq.dueToday > 0 && (
                <Link to={PYQ_REVISE_PATH} className={`${linkBtn} bg-indigo-600 text-white hover:bg-indigo-500`}><Localized value={REV.revisePyq} /></Link>
              )}
              <Link to="/pyq" className={`${linkBtn} text-indigo-700 ring-1 ring-indigo-200 hover:bg-indigo-50 dark:text-indigo-300 dark:ring-indigo-500/40`}><Localized value={REV.morePyq} /></Link>
            </div>
          </Section>

          <Section id="rev-vocab" icon="🔤" title={REV.vocabulary}>
            {d.vocabulary && <Localized value={REV.vocabLine(d.vocabulary.due, d.vocabulary.difficult, d.vocabulary.missed)} as="p" className="text-slate-700 dark:text-slate-200" />}
            <Link to={VOCAB_REVIEW_PATH} className={`${linkBtn} mt-3 bg-indigo-600 text-white hover:bg-indigo-500`}><Localized value={REV.reviewWords} /></Link>
          </Section>
        </div>
      )}

      {d && <Localized value={REV.sameSchedule} as="p" className="mt-6 text-sm text-slate-500 dark:text-slate-400" />}
    </PageShell>
  );
}

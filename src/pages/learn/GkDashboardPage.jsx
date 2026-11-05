import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDataSource } from '../../app/DataSourceContext';
import { useOptionalAuth } from '../../app/AuthContext';
import { GK } from '../../lib/gkCopy';
import { toSlug } from '../../lib/routes';
import PageShell from '../../components/navigation/PageShell';
import GkMockDialog from '../../components/gk/GkMockDialog';
import { Localized } from '../../components/topic-hub/Localized';
import { ArrowRightIcon } from '../../components/topic-hub/icons';
import { CardGridSkeleton, LoadError } from '../funnel/FunnelLayout';
import { SubjectTabs } from './SubjectPage';
import PriorityBadge, { PriorityLegend } from '../../components/priority/PriorityBadge';

export const gkCardPath = (code) => `/learn/gk/${toSlug(code)}`;
export const GK_REVISION_PATH = '/learn/gk/revision';

const pct = (part, whole) => (whole ? Math.round((part / whole) * 100) : 0);

/** "x of y answered correctly" with a bar; tried/accuracy below. Only for a signed-in student. */
export function CompletionBar({ progress, total, signedIn, compact = false }) {
  if (!signedIn) return null;
  if (!progress?.questionsAttempted) return <Localized value={GK.notStarted} as="p" className="text-xs font-medium text-slate-500 dark:text-slate-400" />;
  const done = pct(progress.completedCorrectly, total);
  return (
    <div>
      <Localized value={GK.completed(progress.completedCorrectly, total)} as="p" className="text-xs font-semibold text-slate-700 dark:text-slate-200" />
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" role="progressbar" aria-label={GK.yourProgress.en} aria-valuenow={done} aria-valuemin={0} aria-valuemax={100}>
        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.max(done, 2)}%` }} />
      </div>
      {!compact && <Localized value={GK.progressLine(progress.questionsAttempted, progress.accuracy)} as="p" className="mt-1 text-xs text-slate-500 dark:text-slate-400" />}
    </div>
  );
}

function GkCard({ card, signedIn }) {
  return (
    <Link
      to={gkCardPath(card.code)}
      className="group flex h-full flex-col rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 motion-reduce:transition-none dark:bg-slate-900 dark:ring-slate-800"
    >
      <div className="flex items-start gap-3">
        <span aria-hidden="true" className="grid size-12 shrink-0 place-items-center rounded-2xl bg-indigo-50 text-2xl dark:bg-indigo-500/10">{card.emoji}</span>
        <div className="min-w-0">
          <Localized value={card.title} as="h3" className="text-lg font-extrabold leading-snug text-slate-900 dark:text-white" />
          <PriorityBadge subject="gs" topics={card.topics} className="mt-1.5" />
          <Localized value={card.description} as="p" className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300" />
        </div>
      </div>
      <dl className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
        <div className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          <dt className="sr-only">Questions</dt>
          <dd><Localized value={GK.questions(card.questionCount)} /></dd>
        </div>
        <div className="rounded-full bg-indigo-50 px-2.5 py-1 text-indigo-800 dark:bg-indigo-500/10 dark:text-indigo-200">
          <dt className="sr-only">Facts</dt>
          <dd><Localized value={GK.facts(card.factCount)} /></dd>
        </div>
      </dl>
      {card.questionCount > 0 && (
        <Localized value={GK.sourceVerifiedQuestions(card.sourceVerifiedQuestionCount, card.questionCount)} as="p" className="mt-2 text-xs text-slate-500 dark:text-slate-400" />
      )}
      {card.crossListedFactCount > 0 && <Localized value={GK.alsoTagged(card.crossListedFactCount)} as="p" className="mt-1 text-xs text-slate-500 dark:text-slate-400" />}
      <div className="mt-auto space-y-3 pt-4">
        <CompletionBar progress={card.progress} total={card.questionCount} signedIn={signedIn} />
        <span className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-bold text-white group-hover:bg-indigo-500">
          <Localized value={GK.open} />
          <ArrowRightIcon className="transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}

function Section({ section, cards, signedIn, onMock }) {
  return (
    <section aria-labelledby={`gk-section-${section.code}`} className="mt-10">
      <div className="flex flex-col gap-4 rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:flex-row sm:items-end sm:justify-between dark:bg-slate-900 dark:ring-slate-800">
        <div className="min-w-0">
          <h2 id={`gk-section-${section.code}`} className="text-2xl font-extrabold text-slate-900 dark:text-white"><Localized value={section.title} /></h2>
          <Localized value={section.description} as="p" className="mt-1 text-sm text-slate-600 dark:text-slate-300" />
          <Localized value={GK.sectionTotal(section.questionCount, section.factCount)} as="p" className="mt-2 text-sm font-bold text-indigo-700 dark:text-indigo-300" />
          <div className="mt-2 max-w-md">
            <CompletionBar progress={section.progress} total={section.questionCount} signedIn={signedIn} />
          </div>
        </div>
        {section.questionCount > 0 && (
          <button
            type="button"
            onClick={() => onMock(section)}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white hover:bg-emerald-500"
          >
            <span aria-hidden="true">⏱️</span>
            <Localized value={GK.mockAll} />
          </button>
        )}
      </div>
      <ul className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <li key={c.code}>
            <GkCard card={c} signedIn={signedIn} />
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * /learn/gk: the GK dashboard. Indian GK is a section over the India cards (history,
 * geography, polity, economy, science, culture, national symbols, static GK...);
 * West Bengal GK stays its own section. Counts are real; progress is the student's own.
 */
export default function GkDashboardPage() {
  const source = useDataSource();
  const auth = useOptionalAuth();
  const userKey = auth?.user?.id ?? 'guest';
  // Not cached for the session: progress changes after every quiz.
  const [state, setState] = useState({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [mock, setMock] = useState(null);
  const retry = useCallback(() => setAttempt((n) => n + 1), []);
  useEffect(() => {
    let alive = true;
    setState((s) => (s.status === 'ready' ? s : { status: 'loading' }));
    source.getGkCards().then(
      (data) => alive && setState({ status: 'ready', data }),
      (error) => alive && setState({ status: 'error', error }),
    );
    return () => {
      alive = false;
    };
  }, [source, userKey, attempt]);
  const { status, data, error } = state;
  const topicNames = useMemo(
    () => (data ? Object.fromEntries(data.cards.flatMap((c) => c.topics.map((t) => [t, c.title]))) : {}),
    [data],
  );

  return (
    <PageShell className="max-w-6xl pb-16 pt-6 sm:pt-8">
      <section className="rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-sky-600 p-6 text-white shadow-xl shadow-emerald-500/20 sm:p-8">
        <Localized value={GK.pageTitle} as="h1" className="text-3xl font-extrabold tracking-tight sm:text-4xl" />
        <Localized value={GK.heroSub} as="p" className="mt-3 max-w-3xl leading-relaxed text-emerald-50" />
        {status === 'ready' && !data.signedIn && <Localized value={GK.signInForProgress} as="p" className="mt-3 text-sm font-semibold text-white/90" />}
        <Link to={GK_REVISION_PATH} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-bold text-teal-800 hover:bg-teal-50">
          <span aria-hidden="true">🔁</span>
          <span>
            <Localized value={GK.revisionCentre} />
            <Localized value={GK.revisionHint} as="span" className="block text-xs font-medium text-slate-500" />
          </span>
        </Link>
      </section>

      <div className="mt-8">
        <SubjectTabs subject="gs" />
      </div>
      <PriorityLegend className="mt-4 max-w-4xl" />

      {status === 'loading' && <div className="mt-6"><CardGridSkeleton count={6} height="h-64" /></div>}
      {status === 'error' && <div className="mt-6"><LoadError error={error} onRetry={retry} /></div>}
      {status === 'ready' && data.sections.map((s) => (
        <Section
          key={s.code}
          section={s}
          cards={data.cards.filter((c) => c.section === s.code)}
          signedIn={data.signedIn}
          onMock={setMock}
        />
      ))}

      {mock && (
        <GkMockDialog open onClose={() => setMock(null)} topics={mock.topics} name={mock.title} topicNames={topicNames} />
      )}
    </PageShell>
  );
}

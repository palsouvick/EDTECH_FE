import { memo, useCallback } from 'react';
import { usePersistentState } from '../../hooks/usePersistentState';
import { FUNNEL, UI, examLabel, tierLabel } from '../../lib/i18n';
import ConceptSection from './ConceptSection';
import { FormulaCard, PitfallItem, RuleCard, TrickCard } from './ConceptCards';
import { Localized } from './Localized';
import ModeCtaBar from './ModeCtaBar';
import QuickNavBar from './QuickNavBar';
import { AlertIcon, BoltIcon, SigmaIcon } from './icons';

const SECTION_IDS = ['formulas', 'tricks', 'pitfalls'];
const NO_SECTIONS = { formulas: [], derivationRules: [], speedTricks: [], commonTraps: [], syllabus: [] };

/**
 * @typedef {{ en?: string, bn?: string, hi?: string }} LocalizedText
 *
 * @typedef {object} TopicSummary   GET /api/v1/practice/topic-summary -> data.summary
 * @property {string} slug
 * @property {LocalizedText} title
 * @property {LocalizedText} [overview]
 * @property {Array<{ key: string, label: LocalizedText, latex: string,
 *   variables?: Array<{ symbol: string, meaning: LocalizedText }>, explanation?: LocalizedText }>} formulas
 * @property {Array<{ title: LocalizedText, body: LocalizedText }>} derivationRules
 * @property {Array<{ title: LocalizedText, body: LocalizedText, approxTimeSavedSec?: number }>} speedTricks
 * @property {LocalizedText[]} commonTraps
 * @property {Array<{ tier: string, examCodes: string[] }>} [syllabus]
 */

/**
 * "Topic Rule & Concept Hub": the top of the study page.
 *
 * Renders three siblings: a sticky quick-nav, the concept hub, and a fixed CTA
 * bar. Mount it directly inside the page's main scrolling container (not inside
 * a short wrapper), or `position: sticky` stops at the wrapper's end.
 *
 * Language switching never re-renders this component: see useLanguagePreference.
 *
 * @param {object} props
 * @param {{ category: {code, name: LocalizedText}, subject: {code, name: LocalizedText}, topic: {code, name: LocalizedText} }} props.breadcrumb
 * @param {TopicSummary | null} props.summary  null when the topic has no published notes yet
 * @param {{ attemptedToday?: number, dailyGoal?: number, streak?: number, activeToday?: boolean }} [props.progress]
 *        Server-side numbers; omit to use the on-device tracker.
 * @param {() => void} [props.onStartPractice]
 * @param {(cfg: { questionCount: number, timeLimitMinutes: number }) => void} [props.onLaunchMock]
 * @param {boolean} [props.launching]  disables the CTA while a mock is being created
 * @param {boolean} [props.ctaHidden]  hide the bottom CTA bar (e.g. while the Practice Arena is on screen)
 * @param {import('react').ReactNode} [props.afterTitle]  shown under the title block (the study page's learning path)
 */
function TopicSummaryHeader({ breadcrumb, summary: published, progress, onStartPractice, onLaunchMock, launching = false, ctaHidden = false, afterTitle }) {
  // Without notes the hub still anchors the page: title, nav, CTA, and a note that notes are coming.
  const summary = published ?? { ...NO_SECTIONS, slug: null, title: breadcrumb.topic?.name };
  const [openIds, setOpenIds] = usePersistentState(`hub:${summary.slug ?? breadcrumb.topic?.code}:open`, ['formulas']);

  const toggle = useCallback(
    (id) => setOpenIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id])),
    [setOpenIds],
  );
  const allOpen = SECTION_IDS.every((id) => openIds.includes(id));

  const hasFormulas = summary.formulas.length > 0 || summary.derivationRules.length > 0;
  const syllabus = summary.syllabus || [];

  return (
    <>
      <QuickNavBar breadcrumb={breadcrumb} progress={progress} />

      <section aria-labelledby="concept-hub-title" className="mx-auto max-w-3xl px-4 pb-6 pt-5 sm:pt-8">
        <div data-scroll-anchor className="mb-5">
          <Localized value={UI.eyebrow} as="p" className="text-xs font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400" />
          <h1 id="concept-hub-title" className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
            <Localized value={summary.title} />
          </h1>
          {summary.overview && (
            <Localized value={summary.overview} as="div" markdown className="mt-2 text-[15px] text-slate-600 dark:text-slate-300" />
          )}
          {!published && (
            <Localized value={FUNNEL.notesComingSoon} as="p" className="mt-2 text-[15px] text-slate-500 dark:text-slate-400" />
          )}
          {syllabus.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Syllabus">
              {syllabus.flatMap((s) =>
                (s.examCodes.length ? s.examCodes : ['']).map((code) => (
                  <li
                    key={`${s.tier}-${code}`}
                    className="rounded-md bg-white px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700"
                  >
                    {[code && examLabel(code), tierLabel(s.tier)].filter(Boolean).join(' · ')}
                  </li>
                )),
              )}
            </ul>
          )}
          {afterTitle}
        </div>

        <div className={`mb-2 flex justify-end ${published ? '' : 'hidden'}`}>
          <button
            type="button"
            onClick={() => setOpenIds(allOpen ? [] : SECTION_IDS)}
            className="rounded-md px-2 py-1 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:text-indigo-400 dark:hover:bg-indigo-500/10"
          >
            <Localized value={allOpen ? UI.collapseAll : UI.expandAll} />
          </button>
        </div>

        <div className="space-y-3">
          {hasFormulas && (
            <ConceptSection
              id="formulas"
              title={UI.coreFormulas}
              Icon={SigmaIcon}
              tone="indigo"
              count={summary.formulas.length}
              open={openIds.includes('formulas')}
              onToggle={toggle}
            >
              <div className="grid gap-3 md:grid-cols-2">
                {summary.formulas.map((f) => (
                  <FormulaCard key={f.key} formula={f} />
                ))}
              </div>
              {summary.derivationRules.length > 0 && (
                <div className="pt-2">
                  <Localized
                    value={UI.derivationRules}
                    as="h3"
                    className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400"
                  />
                  <div className="space-y-3">
                    {summary.derivationRules.map((r, i) => (
                      <RuleCard key={i} rule={r} />
                    ))}
                  </div>
                </div>
              )}
            </ConceptSection>
          )}

          {summary.speedTricks.length > 0 && (
            <ConceptSection
              id="tricks"
              title={UI.speedTricks}
              Icon={BoltIcon}
              tone="amber"
              count={summary.speedTricks.length}
              open={openIds.includes('tricks')}
              onToggle={toggle}
            >
              <div className="space-y-4">
                {summary.speedTricks.map((t, i) => (
                  <TrickCard key={i} trick={t} index={i} />
                ))}
              </div>
            </ConceptSection>
          )}

          {summary.commonTraps.length > 0 && (
            <ConceptSection
              id="pitfalls"
              title={UI.pitfalls}
              Icon={AlertIcon}
              tone="rose"
              count={summary.commonTraps.length}
              open={openIds.includes('pitfalls')}
              onToggle={toggle}
            >
              <ul className="space-y-2">
                {summary.commonTraps.map((t, i) => (
                  <PitfallItem key={i} trap={t} />
                ))}
              </ul>
            </ConceptSection>
          )}
        </div>
      </section>

      <ModeCtaBar onStartPractice={onStartPractice} onLaunchMock={onLaunchMock} busy={launching} hidden={ctaHidden} />
    </>
  );
}

export default memo(TopicSummaryHeader);

/** Placeholder with the hub's shape, for the first load. */
export function TopicSummaryHeaderSkeleton() {
  const bar = 'animate-pulse rounded bg-slate-200 motion-reduce:animate-none dark:bg-slate-800';
  return (
    <div aria-busy="true" aria-label="Loading" className="mx-auto max-w-3xl px-4 pt-5 sm:pt-8">
      <div className={`${bar} h-3 w-40`} />
      <div className={`${bar} mt-3 h-8 w-64`} />
      <div className={`${bar} mt-3 h-4 w-full`} />
      <div className={`${bar} mt-2 h-4 w-3/4`} />
      {[0, 1, 2].map((i) => (
        <div key={i} className={`${bar} mt-4 h-16 w-full rounded-2xl`} />
      ))}
    </div>
  );
}

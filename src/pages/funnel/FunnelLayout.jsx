import { ARENA, FUNNEL } from '../../lib/i18n';
import Breadcrumbs from '../../components/navigation/Breadcrumbs';
import SiteHeader from '../../components/navigation/SiteHeader';
import Footer from '../../components/navigation/Footer';
import { Localized } from '../../components/topic-hub/Localized';
import { CheckIcon } from '../../components/topic-hub/icons';

const STEPS = [FUNNEL.stepExam, FUNNEL.stepSubject, FUNNEL.stepTopic];

/** 1 Exam Ã¢â‚¬â€ 2 Subject Ã¢â‚¬â€ 3 Topic. Completed steps are links back (via the breadcrumbs too). */
function Stepper({ step }) {
  return (
    <ol className="flex items-center gap-2 text-xs font-semibold" aria-label="Progress">
      {STEPS.map((label, i) => {
        const n = i + 1;
        const state = n < step ? 'done' : n === step ? 'current' : 'todo';
        return (
          <li key={n} className="flex items-center gap-2" aria-current={state === 'current' ? 'step' : undefined}>
            {i > 0 && <span aria-hidden="true" className={`h-px w-5 sm:w-8 ${n <= step ? 'bg-indigo-400' : 'bg-slate-300 dark:bg-slate-700'}`} />}
            <span
              className={`grid size-6 place-items-center rounded-full text-[11px] ${
                state === 'done'
                  ? 'bg-indigo-600 text-white'
                  : state === 'current'
                    ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500 dark:bg-indigo-500/20 dark:text-indigo-200'
                    : 'bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {state === 'done' ? <CheckIcon width={12} height={12} strokeWidth={3} /> : n}
            </span>
            <Localized
              value={label}
              className={`hidden sm:inline ${state === 'todo' ? 'text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-200'}`}
            />
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Shell for funnel steps 1Ã¢â‚¬â€œ3: sticky bar (brand, breadcrumbs, language),
 * stepper, page title.
 */
export default function FunnelLayout({ step, crumbs, title, subtitle, aside, children }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-5 sm:pt-8">
        <Breadcrumbs items={crumbs} className="mb-5" />
        {step && <Stepper step={step} />}
        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl dark:text-white">
              <Localized value={title} />
            </h1>
            {subtitle && <div className="mt-1.5 text-[15px] text-slate-600 dark:text-slate-300">{subtitle}</div>}
          </div>
          {aside}
        </div>
        <div className="mt-6">{children}</div>
      </main>
      <Footer />
    </div>
  );
}
/** Skeleton grid while a step loads. */
export function CardGridSkeleton({ count = 4, height = 'h-36' }) {
  return (
    <div aria-busy="true" aria-label="Loading" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className={`${height} animate-pulse rounded-2xl bg-slate-200/70 motion-reduce:animate-none dark:bg-slate-800/70`} />
      ))}
    </div>
  );
}

export function LoadError({ error, onRetry }) {
  return (
    <div role="alert" className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
      <Localized value={FUNNEL.loadFailed} as="p" className="font-semibold text-slate-900 dark:text-white" />
      {error?.message && <p className="mt-1 text-sm text-slate-500">{error.message}</p>}
      <button type="button" onClick={onRetry} className="mt-4 min-h-11 rounded-xl bg-indigo-600 px-5 text-sm font-semibold text-white hover:bg-indigo-500">
        <Localized value={ARENA.retry} />
      </button>
    </div>
  );
}

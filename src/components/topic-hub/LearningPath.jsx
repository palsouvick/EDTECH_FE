import { PATTERNS } from '../../lib/patternsCopy';
import { Localized } from './Localized';

const TONES = [
  'from-sky-500 to-indigo-500',
  'from-violet-500 to-fuchsia-500',
  'from-emerald-500 to-teal-500',
  'from-amber-500 to-orange-500',
];

/**
 * Revise → Patterns → Practise → Mock test, as four big buttons at the top of
 * the study page. Each jumps to its part of the page (the mock opens its setup).
 */
export default function LearningPath({ hasNotes, hasPatterns, onJump, onMock }) {
  const steps = [
    hasNotes && { key: 'revise', target: 'formulas-section' },
    hasPatterns && { key: 'patterns', target: 'patterns' },
    { key: 'practise', target: 'practice-questions' },
    { key: 'mock' },
  ].filter(Boolean);

  return (
    <nav aria-label={PATTERNS.pathTitle.en} className="mt-5">
      <Localized value={PATTERNS.pathTitle} as="p" className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400" />
      <ol className={`grid grid-cols-2 gap-2 [&>li:last-child:nth-child(odd)]:col-span-2 sm:[&>li:last-child:nth-child(odd)]:col-span-1 ${{ 2: 'sm:grid-cols-2', 3: 'sm:grid-cols-3', 4: 'sm:grid-cols-4' }[steps.length]}`}>
        {steps.map((s, i) => {
          const copy = PATTERNS.path[s.key];
          return (
            <li key={s.key}>
              <button
                type="button"
                onClick={() => (s.target ? onJump(s.target) : onMock())}
                className={`group flex h-full w-full items-center gap-2.5 rounded-2xl bg-gradient-to-br ${TONES[i]} p-3 text-left text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 motion-reduce:transition-none`}
              >
                <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/20 text-lg" aria-hidden="true">{copy.icon}</span>
                <span className="min-w-0">
                  <span className="block text-[11px] font-bold uppercase tracking-wide text-white/75">{i + 1}</span>
                  <Localized value={copy.title} className="block text-sm font-bold leading-tight" />
                  <Localized value={copy.sub} className="block text-xs text-white/85" />
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

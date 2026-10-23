import { ARENA, milestoneMessage } from '../../lib/i18n';
import { Localized } from '../topic-hub/Localized';
import { TimerIcon, TrophyIcon } from '../topic-hub/icons';
import Dialog from './Dialog';

/** Every 10 answered: celebrate, then offer the next step up (a short timed test). */
export default function MilestoneDialog({ milestone, topicName, onKeepGoing, onTimedTest }) {
  return (
    <Dialog open={Boolean(milestone)} onClose={onKeepGoing} labelledBy="milestone-title">
      {milestone && (
        <div className="text-center">
          <span className="arena-pop mx-auto grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 text-white shadow-lg shadow-amber-500/30">
            <TrophyIcon width={28} height={28} />
          </span>
          <h2 id="milestone-title" className="mt-4 text-xl font-bold text-slate-900 dark:text-white">
            <Localized value={ARENA.milestoneTitle} />
          </h2>
          <Localized
            value={milestoneMessage(milestone.count, milestone.correct, topicName)}
            as="p"
            className="mt-2 text-[15px] text-slate-600 dark:text-slate-300"
          />
          <Localized value={ARENA.milestoneQuestion} as="p" className="mt-1 text-[15px] text-slate-600 dark:text-slate-300" />

          <div className="mt-6 grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={onKeepGoing}
              autoFocus
              className="min-h-12 rounded-xl border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <Localized value={ARENA.keepGoing} />
            </button>
            <button
              type="button"
              onClick={onTimedTest}
              className="flex min-h-12 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
            >
              <TimerIcon width={18} height={18} />
              <Localized value={ARENA.takeTimedTest} />
            </button>
          </div>
        </div>
      )}
    </Dialog>
  );
}

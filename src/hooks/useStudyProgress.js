import { useCallback, useSyncExternalStore } from 'react';
import { createPersistentStore } from '../lib/persistentStore';
import { EMPTY_PROGRESS, isProgressRecord, recordAttempt, viewProgress } from '../lib/progress';

export const progressStore = createPersistentStore('edtech:progress', EMPTY_PROGRESS, {
  validate: isProgressRecord,
});

const DEFAULT_GOAL = Number(import.meta.env.VITE_DAILY_GOAL) || 30;

/**
 * Questions attempted today + day streak, kept on-device.
 *
 * This is the client half of the tracker: it gives instant feedback and works
 * offline. For leaderboards, or a streak that follows the student across
 * devices, have the backend own these counts and seed this store from it.
 */
export function useStudyProgress({ dailyGoal = DEFAULT_GOAL } = {}) {
  const record = useSyncExternalStore(progressStore.subscribe, progressStore.get, progressStore.get);
  const view = viewProgress(record);
  const markAttempt = useCallback(() => progressStore.set((r) => recordAttempt(r)), []);
  return { ...view, dailyGoal, recordAttempt: markAttempt };
}

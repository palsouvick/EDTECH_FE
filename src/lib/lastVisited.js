import { createPersistentStore } from './persistentStore';

/**
 * The last topic a student opened, for the "Continue where you left off" card.
 * { category, subject, topic, names: { category, subject, topic } } (names are localized objects)
 */
export const lastVisitedStore = createPersistentStore('edtech:last-topic', null, {
  validate: (v) => v === null || (typeof v?.category === 'string' && typeof v?.topic === 'string'),
});

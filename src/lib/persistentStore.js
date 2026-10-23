import { preferencesAllowed } from './consent';

/**
 * Tiny external store backed by localStorage.
 *
 * - One in-memory value per key, shared by every component that reads it
 *   (via useSyncExternalStore), so subscribers never disagree.
 * - Cross-tab sync through the `storage` event.
 * - Storage failures (Safari private mode, quota, disabled cookies) degrade to
 *   in-memory state instead of throwing.
 */
export function createPersistentStore(key, fallback, { validate = () => true } = {}) {
  const listeners = new Set();
  const resolveFallback = () => (typeof fallback === 'function' ? fallback() : fallback);

  function load() {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw == null) return resolveFallback();
      const parsed = JSON.parse(raw);
      return validate(parsed) ? parsed : resolveFallback();
    } catch {
      return resolveFallback();
    }
  }

  let value = typeof window === 'undefined' ? resolveFallback() : load();

  const notify = () => listeners.forEach((l) => l());

  function onStorage(e) {
    if (e.key !== key) return;
    value = load();
    notify();
  }

  return {
    key,
    get: () => value,
    set(next) {
      const resolved = typeof next === 'function' ? next(value) : next;
      if (Object.is(resolved, value)) return;
      value = resolved;
      try {
        if (!key.startsWith('edtech:') || key === 'edtech:consent' || preferencesAllowed()) {
          window.localStorage.setItem(key, JSON.stringify(value));
        }
      } catch {
        /* keep the in-memory value */
      }
      notify();
    },
    subscribe(listener) {
      if (listeners.size === 0) window.addEventListener('storage', onStorage);
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) window.removeEventListener('storage', onStorage);
      };
    },
    /** Tests only: re-read storage. */
    reload() {
      value = load();
      notify();
    },
  };
}

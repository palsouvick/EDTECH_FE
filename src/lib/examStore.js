/**
 * Persistence for in-progress mock tests: IndexedDB, falling back to
 * sessionStorage when IndexedDB is unavailable (some private modes, old WebViews).
 *
 * One record per session, keyed by sessionId:
 *   { sessionId, meta, config, questions, entries, current, phase, savedAt, ... }
 *
 * IndexedDB because a 100-question bilingual paper is a few hundred KB, which is
 * near sessionStorage limits on some phones, and it survives tab closes too.
 */

const DB_NAME = 'edtech-exam';
const STORE = 'sessions';
const FALLBACK_PREFIX = 'edtech:exam:';

let dbPromise = null;

function openDb() {
  if (typeof indexedDB === 'undefined') return Promise.reject(new Error('no indexedDB'));
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: 'sessionId' });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
      req.onblocked = () => reject(new Error('indexedDB blocked'));
    }).catch((err) => {
      dbPromise = null;
      throw err;
    });
  }
  return dbPromise;
}

function tx(mode, run) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const req = run(t.objectStore(STORE));
        t.oncomplete = () => resolve(req?.result);
        t.onerror = () => reject(t.error);
        t.onabort = () => reject(t.error);
      }),
  );
}

const fallback = {
  get: (id) => {
    try {
      return JSON.parse(sessionStorage.getItem(FALLBACK_PREFIX + id));
    } catch {
      return null;
    }
  },
  put: (record) => {
    try {
      sessionStorage.setItem(FALLBACK_PREFIX + record.sessionId, JSON.stringify(record));
    } catch {
      /* quota: progress lives only in memory for this tab */
    }
  },
  delete: (id) => {
    try {
      sessionStorage.removeItem(FALLBACK_PREFIX + id);
    } catch {
      /* ignore */
    }
  },
};

export const examStore = {
  async get(sessionId) {
    try {
      return (await tx('readonly', (s) => s.get(sessionId))) ?? fallback.get(sessionId);
    } catch {
      return fallback.get(sessionId);
    }
  },
  async put(record) {
    const value = { ...record, savedAt: Date.now() };
    try {
      await tx('readwrite', (s) => s.put(value));
    } catch {
      fallback.put(value);
    }
  },
  async delete(sessionId) {
    fallback.delete(sessionId);
    try {
      await tx('readwrite', (s) => s.delete(sessionId));
    } catch {
      /* ignore */
    }
  },
};

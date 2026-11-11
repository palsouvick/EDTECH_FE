import { useCallback, useEffect, useRef, useState } from 'react';
import { useOptionalAuth } from '../app/AuthContext';
import { useDataSource } from '../app/DataSourceContext';
import { clearLocal, emptyProgress, readLocal, withReading, withResult, writeLocal } from '../lib/bookProgress';

/**
 * Reading progress for one book. Signed in: read from and saved to the server, and a guest's browser copy is
 * merged in once (then cleared). Guest: kept in localStorage. Updates show at once; saving happens behind.
 */
export default function useBookProgress(book) {
  const api = useDataSource();
  const auth = useOptionalAuth();
  const signedIn = Boolean(auth?.user);
  const authReady = !auth || auth.status === 'ready';
  const [progress, setProgress] = useState(() => readLocal(book));
  const [ready, setReady] = useState(false);
  const pending = useRef(Promise.resolve());

  useEffect(() => {
    if (!authReady) return undefined;
    let live = true;
    if (!signedIn) {
      setProgress(readLocal(book));
      setReady(true);
      return undefined;
    }
    (async () => {
      try {
        const local = readLocal(book);
        let server = await api.getBookProgress(book);
        const chapters = Object.entries(local.chapters).filter(([, c]) => c.read?.length).map(([chapter, c]) => ({ chapter, read: c.read }));
        if (chapters.length || local.last) {
          server = await api.saveBookReading(book, { chapters, ...(local.last && { last: { chapter: local.last.chapter, section: local.last.section } }) });
          for (const [chapter, c] of Object.entries(local.chapters)) {
            for (const mode of ['practice', 'mini']) {
              if (c[mode]?.last) server = await api.saveBookResult(book, { chapter, mode, correct: c[mode].best.correct, total: c[mode].best.total, bySection: mode === 'mini' ? c.sections || {} : {} });
            }
          }
          clearLocal(book);
        }
        if (live) setProgress({ ...emptyProgress(), ...server });
      } catch {
        if (live) setProgress(readLocal(book));
      } finally {
        if (live) setReady(true);
      }
    })();
    return () => {
      live = false;
    };
  }, [book, signedIn, authReady, api]);

  const save = useCallback(
    (fn) => {
      pending.current = pending.current.then(fn).catch(() => {});
    },
    [],
  );

  /** Marks sections of a chapter read and/or records where the student is ({ chapter, read, section, depth }). */
  const recordReading = useCallback(
    (update) => {
      setProgress((p) => {
        const next = withReading(p, update);
        if (!signedIn) writeLocal(book, next);
        return next;
      });
      if (signedIn) {
        save(() =>
          api.saveBookReading(book, {
            chapters: update.read?.length ? [{ chapter: update.chapter, read: update.read }] : [],
            ...(update.depth && { depth: update.depth }),
            ...(update.section !== undefined && { last: { chapter: update.chapter, section: update.section } }),
          }),
        );
      }
    },
    [api, book, save, signedIn],
  );

  /** Records a finished practice session or mini test ({ chapter, mode, correct, total, bySection }). */
  const recordResult = useCallback(
    (result) => {
      if (!result.total) return;
      setProgress((p) => {
        const next = withResult(p, result);
        if (!signedIn) writeLocal(book, next);
        return next;
      });
      if (signedIn) save(() => api.saveBookResult(book, result));
    },
    [api, book, save, signedIn],
  );

  return { progress, ready, signedIn, recordReading, recordResult };
}

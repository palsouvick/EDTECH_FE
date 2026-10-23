import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Session cache of loaded resources. Funnel data is small and changes rarely,
 * so going Back from a topic to the topic list renders instantly from memory.
 */
const cache = new Map();

export function clearResourceCache() {
  cache.clear();
}

/**
 * Load `loader()` once per `key`. A null key loads nothing.
 * While a new key loads, the previous data stays available as `staleData`
 * (e.g. counts from the previous language) so the page doesn't flash empty.
 *
 * @returns {{ status: 'loading'|'ready'|'error', data, staleData, error, retry }}
 */
export function useResource(key, loader) {
  const [state, setState] = useState(() =>
    key != null && cache.has(key) ? { key, status: 'ready', data: cache.get(key) } : { key, status: 'loading' },
  );
  const [attempt, setAttempt] = useState(0);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;
  const lastData = useRef(state.data);

  useEffect(() => {
    if (key == null) return undefined;
    if (cache.has(key)) {
      setState({ key, status: 'ready', data: cache.get(key) });
      return undefined;
    }
    let alive = true;
    setState({ key, status: 'loading' });
    loaderRef.current().then(
      (data) => {
        cache.set(key, data);
        if (alive) setState({ key, status: 'ready', data });
      },
      (error) => alive && setState({ key, status: 'error', error }),
    );
    return () => {
      alive = false;
    };
  }, [key, attempt]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  // Until the effect runs for a new key, the state still describes the old one.
  const current = state.key === key;
  const fromCache = !current && key != null && cache.has(key);
  const status = fromCache ? 'ready' : current ? state.status : 'loading';
  const data = fromCache ? cache.get(key) : current ? state.data : undefined;
  if (data !== undefined) lastData.current = data;

  return { status, data, staleData: lastData.current, error: current ? state.error : undefined, retry };
}

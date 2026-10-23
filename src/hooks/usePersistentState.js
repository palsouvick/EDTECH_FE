import { useCallback, useSyncExternalStore } from 'react';
import { createPersistentStore } from '../lib/persistentStore';

const registry = new Map();

function storeFor(key, initial) {
  if (!registry.has(key)) registry.set(key, createPersistentStore(key, initial));
  return registry.get(key);
}

/**
 * useState that survives reloads and stays in sync across tabs.
 * Components using the same key share one value.
 *
 *   const [open, setOpen] = usePersistentState('hub:quant.profit_loss:open', ['formulas']);
 */
export function usePersistentState(key, initial) {
  const store = storeFor(key, initial);
  const value = useSyncExternalStore(store.subscribe, store.get, store.get);
  const setValue = useCallback((next) => store.set(next), [store]);
  return [value, setValue];
}

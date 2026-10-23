import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
  sessionStorage.clear();
});

describe('examStore', () => {
  it('round-trips a test record through IndexedDB', async () => {
    const { examStore } = await import('../lib/examStore');
    await examStore.put({ sessionId: 's1', current: 7, entries: [{ answer: 'opt_x' }] });
    const back = await examStore.get('s1');
    expect(back).toMatchObject({ sessionId: 's1', current: 7, entries: [{ answer: 'opt_x' }] });
    expect(back.savedAt).toBeTypeOf('number');
    expect(sessionStorage.length).toBe(0); // IndexedDB was used, not the fallback
    await examStore.delete('s1');
    expect(await examStore.get('s1')).toBeNull();
  });

  it('falls back to sessionStorage when IndexedDB is unavailable', async () => {
    vi.stubGlobal('indexedDB', undefined);
    const { examStore } = await import('../lib/examStore');
    await examStore.put({ sessionId: 's2', current: 3 });
    expect(JSON.parse(sessionStorage.getItem('edtech:exam:s2'))).toMatchObject({ current: 3 });
    expect(await examStore.get('s2')).toMatchObject({ current: 3 });
  });
});

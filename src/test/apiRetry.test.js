import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { request } from '../lib/api';

const ok = (data) => ({ ok: true, status: 200, json: async () => ({ success: true, data }) });
const restarting = () => ({ ok: false, status: 503, json: async () => ({ success: false, error: { code: 'DB_UNAVAILABLE', message: 'starting' } }) });

describe('request: riding out a backend restart', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('an answer check (POST with retry) survives a 503 and a refused connection', async () => {
    const fetch = vi.fn()
      .mockResolvedValueOnce(restarting())
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(ok({ isCorrect: true }));
    vi.stubGlobal('fetch', fetch);
    const p = request('/practice/verify-answer', { method: 'POST', retry: true, body: { questionId: 'x' } });
    await vi.runAllTimersAsync();
    await expect(p).resolves.toEqual({ isCorrect: true });
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('other writes are still sent only once', async () => {
    const fetch = vi.fn().mockResolvedValue(restarting());
    vi.stubGlobal('fetch', fetch);
    const p = request('/mock/submit', { method: 'POST', body: {} });
    const done = expect(p).rejects.toMatchObject({ status: 503 });
    await vi.runAllTimersAsync();
    await done;
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});

const BASE = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');

// Dev builds only: identify as a test student, since local backends run without the
// auth stack. The backend honours this header only with NODE_ENV=development (or test)
// and ALLOW_DEV_USER_HEADER=true; every other backend ignores it.
const DEV_USER = import.meta.env.DEV ? import.meta.env.VITE_DEV_USER_ID : undefined;
/** True when requests carry the dev test-student header, so features work without logging in. */
export const HAS_DEV_USER = Boolean(DEV_USER);
/** For requests made outside request(): the PDF viewer (pdf.js) and upload progress (XHR). */
export const API_BASE = BASE;
export const devAuthHeaders = () => (DEV_USER ? { 'x-user-id': DEV_USER } : {});

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// A 502/503/504 means the backend is restarting, waking from sleep or briefly
// without its database: it answers again within seconds. Reads are retried a
// few times before the error reaches the screen; writes are never retried
// automatically (a submit must not be sent twice).
const TRANSIENT_STATUSES = new Set([0, 502, 503, 504]);
const RETRY_DELAYS_MS = [1500, 3000, 5000];
const TRANSIENT_MESSAGE = 'The server is restarting or waking up. Please try again in a moment.';

const isTransient = (err) => err instanceof ApiError && TRANSIENT_STATUSES.has(err.status);

function sleep(ms, signal) {
  return new Promise((resolve, reject) => {
    const abort = () => reject(new DOMException('Aborted', 'AbortError'));
    if (signal?.aborted) return abort();
    const t = setTimeout(() => {
      signal?.removeEventListener('abort', abort);
      resolve();
    }, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(t);
      abort();
    }, { once: true });
  });
}

async function send(path, { method, body, signal, headers }) {
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      signal,
      credentials: 'include',
      headers: {
        Accept: 'application/json',
        ...(body && !isFormData && { 'Content-Type': 'application/json' }),
        ...(DEV_USER && { 'x-user-id': DEV_USER }),
        ...headers,
      },
      body: body ? (isFormData ? body : JSON.stringify(body)) : undefined,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError(0, 'NETWORK_ERROR', 'Could not reach the server. Check your connection.');
  }

  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    const e = json?.error || {};
    const transient = TRANSIENT_STATUSES.has(res.status);
    throw new ApiError(
      res.status,
      e.code || (transient ? 'SERVER_UNAVAILABLE' : 'HTTP_ERROR'),
      e.message || (transient ? TRANSIENT_MESSAGE : `Request failed (${res.status})`),
      e.details,
    );
  }
  return json.data;
}

/** Unwraps the backend envelope: { success, data } | { success: false, error }. */
export async function request(path, { method = 'GET', body, signal, headers } = {}) {
  const retries = method === 'GET' ? RETRY_DELAYS_MS.length : 0;
  for (let attempt = 0; ; attempt += 1) {
    try {
      return await send(path, { method, body, signal, headers });
    } catch (err) {
      if (!isTransient(err) || attempt >= retries || signal?.aborted) throw err;
      await sleep(RETRY_DELAYS_MS[attempt], signal);
    }
  }
}

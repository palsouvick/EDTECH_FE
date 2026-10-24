const BASE = (import.meta.env.VITE_API_BASE_URL || '/api/v1').replace(/\/$/, '');

// Dev builds only: identify as a test student, since local backends run without the
// auth stack. Production backends ignore this header (NODE_ENV=production).
const DEV_USER = import.meta.env.DEV ? import.meta.env.VITE_DEV_USER_ID : undefined;
/** True when requests carry the dev test-student header, so features work without logging in. */
export const HAS_DEV_USER = Boolean(DEV_USER);

export class ApiError extends Error {
  constructor(status, code, message, details) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

/** Unwraps the backend envelope: { success, data } | { success: false, error }. */
export async function request(path, { method = 'GET', body, signal, headers } = {}) {
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
    throw new ApiError(res.status, e.code || 'HTTP_ERROR', e.message || `Request failed (${res.status})`, e.details);
  }
  return json.data;
}

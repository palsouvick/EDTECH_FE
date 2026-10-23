/**
 * Cookie / storage consent. Only two categories exist because that is all the site uses:
 *  - essential: login session cookie and in-progress mock-test state (always on)
 *  - preferences: language, study streak/progress and last visited topic kept on this device
 * There is no analytics or advertising, so none is offered.
 */
const KEY = 'edtech:consent';
const PREFERENCE_KEYS = ['edtech:lang', 'edtech:progress', 'edtech:last-topic', 'edtech:learn'];
const EVENT = 'edtech:consent-changed';

export function readConsent() {
  try {
    const c = JSON.parse(window.localStorage.getItem(KEY));
    return c && typeof c.preferences === 'boolean' ? c : null;
  } catch {
    return null;
  }
}

/** Persistence is allowed until the visitor explicitly declines preferences. */
export const preferencesAllowed = () => readConsent()?.preferences !== false;

export function saveConsent({ preferences }) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify({ preferences, at: new Date().toISOString() }));
    if (!preferences) PREFERENCE_KEYS.forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* storage unavailable: choice applies for this visit only */
  }
  window.dispatchEvent(new Event(EVENT));
}

export const openConsentSettings = () => window.dispatchEvent(new Event('edtech:consent-open'));
export const CONSENT_EVENTS = { changed: EVENT, open: 'edtech:consent-open' };

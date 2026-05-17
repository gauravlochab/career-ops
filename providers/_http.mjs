/**
 * _http.mjs — shared HTTP helper for all providers.
 *
 * makeHttpCtx() returns a lightweight context object passed to every
 * provider.fetch(entry, ctx) call. Each job gets its own ctx so retries
 * and per-call state stay isolated.
 */

const DEFAULT_HEADERS = {
  'User-Agent': 'career-ops-scanner/1.0 (job search automation; https://github.com/santifer/career-ops)',
  'Accept': 'application/json',
};

/**
 * Fetch JSON from a URL, throwing on non-2xx responses.
 * @param {string} url
 * @param {RequestInit} [options]
 * @returns {Promise<unknown>}
 */
async function fetchJson(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { ...DEFAULT_HEADERS, ...(options.headers || {}) },
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText} — ${url}`);
  }
  return res.json();
}

/**
 * Returns a fresh HTTP context for one provider.fetch() invocation.
 */
export function makeHttpCtx() {
  return { fetchJson };
}

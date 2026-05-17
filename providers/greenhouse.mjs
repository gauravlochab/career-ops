/**
 * greenhouse.mjs — Greenhouse ATS provider.
 *
 * Detects: careers_url contains greenhouse.io  OR  entry.api contains boards-api.greenhouse.io
 * API: https://boards-api.greenhouse.io/v1/boards/{board}/jobs?content=true
 *
 * If entry.api is present, uses that directly.
 * Otherwise derives the board slug from careers_url.
 */

const GREENHOUSE_DOMAIN_RE = /greenhouse\.io/i;
const BOARD_SLUG_RE = /greenhouse\.io\/([^/?#]+)/i;

function detectGreenhouseUrl(url) {
  return GREENHOUSE_DOMAIN_RE.test(url);
}

function boardSlugFromUrl(url) {
  const m = url.match(BOARD_SLUG_RE);
  return m ? m[1] : null;
}

function apiUrl(entry) {
  if (entry.api) return entry.api;
  const slug = boardSlugFromUrl(entry.careers_url || '');
  if (!slug) return null;
  return `https://boards-api.greenhouse.io/v1/boards/${slug}/jobs`;
}

export default {
  id: 'greenhouse',

  detect(entry) {
    const url = entry.careers_url || '';
    if (detectGreenhouseUrl(url)) return { url };
    if (entry.api && entry.api.includes('boards-api.greenhouse.io')) return { url };
    return null;
  },

  async fetch(entry, ctx) {
    const url = apiUrl(entry);
    if (!url) throw new Error(`greenhouse: cannot derive API URL for "${entry.name}"`);

    const data = await ctx.fetchJson(url);
    const jobs = data.jobs || [];

    return jobs.map(j => ({
      title: j.title || '',
      url: j.absolute_url || j.url || '',
      company: entry.name,
      location: (j.location?.name) || '',
    }));
  },
};

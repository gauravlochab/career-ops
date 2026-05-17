/**
 * lever.mjs — Lever ATS provider.
 *
 * Detects: careers_url contains lever.co or jobs.lever.co
 * API: https://api.lever.co/v0/postings/{companySlug}?mode=json
 */

const LEVER_DOMAIN_RE = /lever\.co/i;
const SLUG_RE = /lever\.co\/([^/?#]+)/i;

function slugFromUrl(url) {
  const m = url.match(SLUG_RE);
  return m ? m[1] : null;
}

export default {
  id: 'lever',

  detect(entry) {
    const url = entry.careers_url || '';
    if (LEVER_DOMAIN_RE.test(url)) return { url };
    return null;
  },

  async fetch(entry, ctx) {
    const slug = slugFromUrl(entry.careers_url || '');
    if (!slug) throw new Error(`lever: cannot derive slug for "${entry.name}"`);

    const url = `https://api.lever.co/v0/postings/${slug}?mode=json`;
    const jobs = await ctx.fetchJson(url);

    if (!Array.isArray(jobs)) throw new Error(`lever: unexpected response shape for "${entry.name}"`);

    return jobs.map(j => ({
      title: j.text || '',
      url: j.hostedUrl || j.applyUrl || '',
      company: entry.name,
      location: j.categories?.location || j.categories?.commitment || '',
    }));
  },
};

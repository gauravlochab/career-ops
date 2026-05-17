/**
 * ashby.mjs — Ashby ATS provider.
 *
 * Detects: careers_url contains ashbyhq.com
 * API: https://api.ashbyhq.com/posting-api/job-board/{companySlug}?includeCompensation=true
 */

const ASHBY_DOMAIN_RE = /ashbyhq\.com/i;
const SLUG_RE = /ashbyhq\.com\/([^/?#]+)/i;

function slugFromUrl(url) {
  const m = url.match(SLUG_RE);
  return m ? m[1] : null;
}

export default {
  id: 'ashby',

  detect(entry) {
    const url = entry.careers_url || '';
    if (ASHBY_DOMAIN_RE.test(url)) return { url };
    return null;
  },

  async fetch(entry, ctx) {
    const slug = slugFromUrl(entry.careers_url || '');
    if (!slug) throw new Error(`ashby: cannot derive slug for "${entry.name}"`);

    const url = `https://api.ashbyhq.com/posting-api/job-board/${slug}?includeCompensation=true`;
    const data = await ctx.fetchJson(url);
    const jobs = data.jobPostings || [];

    return jobs.map(j => ({
      title: j.title || '',
      url: j.jobUrl || j.applyUrl || '',
      company: entry.name,
      location: j.isRemote ? 'Remote' : (j.location || ''),
    }));
  },
};

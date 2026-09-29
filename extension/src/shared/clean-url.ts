/**
 * Remove tracking parameters from a link, keeping everything that changes
 * what the page shows. The list covers campaign tags and the click IDs that
 * ad and social platforms append.
 */

const TRACKERS = new Set([
  "fbclid", "gclid", "gclsrc", "dclid", "gbraid", "wbraid", "msclkid", "yclid", "twclid", "ttclid", "li_fat_id",
  "igshid", "igsh", "epik", "scid", "rb_clickid", "mc_cid", "mc_eid", "mkt_tok", "_hsenc", "_hsmi", "__hsfp",
  "__hssc", "__hstc", "hsctatracking", "vero_id", "vero_conv", "oly_anon_id", "oly_enc_id", "_ga", "_gl",
  "ref_src", "ref_url", "s_cid", "wickedid", "zanpid", "spm", "srsltid",
]);

/** Parameters that are tracking only on specific sites. */
const SITE_TRACKERS: [RegExp, string[]][] = [
  [/(^|\.)(youtube\.com|youtu\.be|spotify\.com)$/, ["si", "feature", "pp"]],
  [/(^|\.)(amazon\.[a-z.]+)$/, ["ref", "ref_", "pf_rd_r", "pf_rd_p", "pd_rd_r", "pd_rd_w", "pd_rd_wg", "content-id"]],
  [/(^|\.)(x\.com|twitter\.com)$/, ["s", "t"]],
];

export interface CleanResult {
  url: string;
  removed: string[];
}

export function cleanUrl(input: string): CleanResult {
  let u: URL;
  try {
    u = new URL(input);
  } catch {
    return { url: input, removed: [] };
  }
  if (!/^https?:$/.test(u.protocol)) return { url: input, removed: [] };
  const siteSpecific = SITE_TRACKERS.filter(([re]) => re.test(u.hostname)).flatMap(([, keys]) => keys);
  const removed: string[] = [];
  for (const key of [...u.searchParams.keys()]) {
    const k = key.toLowerCase();
    if (k.startsWith("utm_") || TRACKERS.has(k) || siteSpecific.includes(k)) {
      u.searchParams.delete(key);
      if (!removed.includes(key)) removed.push(key);
    }
  }
  return { url: u.toString(), removed };
}

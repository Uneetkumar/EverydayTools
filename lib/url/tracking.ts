/**
 * Tracking parameters in links: which ones exist, who adds them, and how to
 * remove them without changing anything else about the link.
 *
 * Shared by the UTM Builder and the browser extension's "Clean link".
 */

export interface TrackerInfo {
  /** Plain-language name. */
  name: string;
  /** Who adds it. */
  by: string;
}

/** Click IDs and tracking tokens that platforms append to links. */
export const TRACKERS: Record<string, TrackerInfo> = {
  fbclid: { name: "Facebook click ID", by: "Meta" },
  gclid: { name: "Google Ads click ID", by: "Google" },
  gclsrc: { name: "Google Ads click source", by: "Google" },
  dclid: { name: "Google display ad click ID", by: "Google" },
  gbraid: { name: "Google Ads app click ID", by: "Google" },
  wbraid: { name: "Google Ads web click ID", by: "Google" },
  srsltid: { name: "Google Merchant listing ID", by: "Google" },
  _ga: { name: "Google Analytics visitor ID", by: "Google" },
  _gl: { name: "Google Analytics cross-site ID", by: "Google" },
  msclkid: { name: "Microsoft Ads click ID", by: "Microsoft" },
  yclid: { name: "Yandex Ads click ID", by: "Yandex" },
  twclid: { name: "X (Twitter) ad click ID", by: "X" },
  ttclid: { name: "TikTok ad click ID", by: "TikTok" },
  li_fat_id: { name: "LinkedIn ad click ID", by: "LinkedIn" },
  igshid: { name: "Instagram share ID", by: "Meta" },
  igsh: { name: "Instagram share ID", by: "Meta" },
  epik: { name: "Pinterest click ID", by: "Pinterest" },
  scid: { name: "Snapchat click ID", by: "Snap" },
  rb_clickid: { name: "Rakuten affiliate click ID", by: "Rakuten" },
  mc_cid: { name: "Mailchimp campaign ID", by: "Mailchimp" },
  mc_eid: { name: "Mailchimp subscriber ID", by: "Mailchimp" },
  mkt_tok: { name: "Marketo email token", by: "Adobe Marketo" },
  _hsenc: { name: "HubSpot email tracking", by: "HubSpot" },
  _hsmi: { name: "HubSpot email tracking", by: "HubSpot" },
  __hsfp: { name: "HubSpot visitor ID", by: "HubSpot" },
  __hssc: { name: "HubSpot session ID", by: "HubSpot" },
  __hstc: { name: "HubSpot visitor ID", by: "HubSpot" },
  hsctatracking: { name: "HubSpot button tracking", by: "HubSpot" },
  vero_id: { name: "Vero email tracking", by: "Vero" },
  vero_conv: { name: "Vero conversion tracking", by: "Vero" },
  oly_anon_id: { name: "Omeda visitor ID", by: "Omeda" },
  oly_enc_id: { name: "Omeda subscriber ID", by: "Omeda" },
  ref_src: { name: "Referral source tag", by: "various sites" },
  ref_url: { name: "Referral page tag", by: "various sites" },
  s_cid: { name: "Adobe Analytics campaign ID", by: "Adobe" },
  wickedid: { name: "Wicked Reports click ID", by: "Wicked Reports" },
  zanpid: { name: "Awin (Zanox) affiliate ID", by: "Awin" },
  spm: { name: "Alibaba tracking code", by: "Alibaba" },
};

/** Parameters that are tracking only on particular sites. */
const SITE_TRACKERS: [RegExp, string[]][] = [
  [/(^|\.)(youtube\.com|youtu\.be|spotify\.com)$/, ["si", "feature", "pp"]],
  [/(^|\.)(amazon\.[a-z.]+)$/, ["ref", "ref_", "pf_rd_r", "pf_rd_p", "pd_rd_r", "pd_rd_w", "pd_rd_wg", "content-id"]],
  [/(^|\.)(x\.com|twitter\.com)$/, ["s", "t"]],
];

function siteTrackers(hostname: string): string[] {
  return SITE_TRACKERS.filter(([re]) => re.test(hostname)).flatMap(([, keys]) => keys);
}

/** Decodes a query component the way servers read it ("+" is a space). */
export function decodeQueryPart(raw: string): string {
  try {
    return decodeURIComponent(raw.replace(/\+/g, " "));
  } catch {
    return raw;
  }
}

export interface QueryParam {
  key: string;
  value: string;
  /** The pair exactly as written in the link. */
  raw: string;
}

/** The query string's pairs, in order, with their original spelling kept. */
export function queryParams(url: URL): QueryParam[] {
  return url.search
    .slice(1)
    .split("&")
    .filter(Boolean)
    .map((raw) => {
      const i = raw.indexOf("=");
      return {
        key: decodeQueryPart(i < 0 ? raw : raw.slice(0, i)),
        value: i < 0 ? "" : decodeQueryPart(raw.slice(i + 1)),
        raw,
      };
    });
}

export type ParamKind = "utm" | "tracker" | "other";

export function paramKind(key: string, hostname: string): ParamKind {
  const k = key.toLowerCase();
  if (k.startsWith("utm_")) return "utm";
  if (k in TRACKERS || siteTrackers(hostname).includes(k)) return "tracker";
  return "other";
}

export interface CleanResult {
  url: string;
  removed: string[];
}

/**
 * Removes tracking parameters (and, unless `keepUtm`, campaign tags) from a
 * link. Everything else — the other parameters, their order and exact
 * encoding, and the #fragment — is left exactly as it was.
 */
export function cleanUrl(input: string, { keepUtm = false }: { keepUtm?: boolean } = {}): CleanResult {
  let u: URL;
  try {
    u = new URL(input);
  } catch {
    return { url: input, removed: [] };
  }
  if (!/^https?:$/.test(u.protocol)) return { url: input, removed: [] };
  const removed: string[] = [];
  const kept = queryParams(u).filter((p) => {
    const kind = paramKind(p.key, u.hostname);
    const drop = kind === "tracker" || (kind === "utm" && !keepUtm);
    if (drop && !removed.includes(p.key)) removed.push(p.key);
    return !drop;
  });
  if (!removed.length) return { url: input, removed };
  u.search = kept.length ? `?${kept.map((p) => p.raw).join("&")}` : "";
  return { url: u.toString(), removed };
}

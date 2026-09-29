/**
 * UTM campaign links: building them, reading them back, and predicting the
 * Google Analytics 4 channel a visit from them will be counted under.
 *
 * The channel rules follow Google's published default channel group
 * (support.google.com/analytics/answer/9756891), evaluated in Google's order.
 * The lists of search, social, video and shopping sites are shortened
 * versions of Google's own, covering the sites people actually tag.
 */

import { decodeQueryPart, paramKind, queryParams } from "./tracking";

export type UtmKey =
  | "utm_source"
  | "utm_medium"
  | "utm_campaign"
  | "utm_term"
  | "utm_content"
  | "utm_id"
  | "utm_source_platform"
  | "utm_creative_format"
  | "utm_marketing_tactic";

export interface UtmField {
  key: UtmKey;
  label: string;
  /** What it means, in one line. */
  help: string;
  placeholder: string;
  required?: boolean;
  /** Only used by GA4 (or advanced setups); shown under "More fields". */
  advanced?: boolean;
}

export const UTM_FIELDS: UtmField[] = [
  { key: "utm_source", label: "Source", help: "Where the visit comes from: google, newsletter, instagram.", placeholder: "instagram", required: true },
  { key: "utm_medium", label: "Medium", help: "The kind of traffic: social, email, cpc, referral.", placeholder: "social", required: true },
  { key: "utm_campaign", label: "Campaign", help: "The promotion or launch: diwali_sale_2026.", placeholder: "diwali_sale_2026", required: true },
  { key: "utm_content", label: "Content", help: "Tells apart links in the same campaign: header_button, story_link.", placeholder: "header_button" },
  { key: "utm_term", label: "Term", help: "The paid-search keyword, for search ads you tag yourself.", placeholder: "running shoes" },
  { key: "utm_id", label: "Campaign ID", help: "Your ad platform's campaign ID, to join cost data in GA4.", placeholder: "abc.123", advanced: true },
  { key: "utm_source_platform", label: "Source platform", help: "The platform that bought the traffic: Search Ads 360, DV360, Meta.", placeholder: "meta", advanced: true },
  { key: "utm_creative_format", label: "Creative format", help: "Type of creative: display, native, video, search.", placeholder: "video", advanced: true },
  { key: "utm_marketing_tactic", label: "Marketing tactic", help: "Targeting used: prospecting, remarketing.", placeholder: "remarketing", advanced: true },
];

export const UTM_KEYS = UTM_FIELDS.map((f) => f.key);

export type SpaceStyle = "_" | "-" | " ";

/**
 * Tidies a value the way most teams standardise them: trimmed, single
 * spaces, optionally lower-case and with spaces replaced. Analytics treats
 * "Email" and "email" as two different sources, so consistency matters more
 * than any particular style.
 */
export function formatValue(value: string, { lowercase = true, spaces = "_" as SpaceStyle } = {}): string {
  let v = value.trim().replace(/\s+/g, " ");
  if (lowercase) v = v.toLowerCase();
  if (spaces !== " ") v = v.replace(/ /g, spaces);
  return v;
}

/** Accepts "example.com/page" as well as full addresses. */
export function parseBaseUrl(input: string): { url: URL } | { error: string } {
  const raw = input.trim();
  if (!raw) return { error: "Enter the address of the page people should land on." };
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw.replace(/^\/+/, "")}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    return { error: "That doesn't look like a web address. It should look like https://example.com/page." };
  }
  if (!/^https?:$/.test(url.protocol)) return { error: "Use a web address that starts with https:// or http://." };
  if (!url.hostname.includes(".") && url.hostname !== "localhost") {
    return { error: "Add the full domain, for example example.com." };
  }
  return { url };
}

/** Encodes a value for a query string, with spaces as %20 (never "+"). */
function encode(value: string): string {
  return encodeURIComponent(value);
}

/** Click IDs on an address (fbclid, gclid…), which a shared link must not carry. */
export function trackersIn(base: URL): string[] {
  return queryParams(base)
    .filter((p) => paramKind(p.key, base.hostname) === "tracker")
    .map((p) => p.key);
}

/**
 * Builds the tagged link. Existing utm_ tags on the address are replaced and
 * one-off click IDs (fbclid, gclid…) are dropped: they belong to a single
 * person's click, and sharing them would mix up everyone's visits. Every
 * other parameter and the #fragment are kept exactly as they were, and the
 * tags go before the fragment where analytics can read them.
 */
export function buildUtmUrl(base: URL, values: Partial<Record<UtmKey, string>>): string {
  const u = new URL(base.toString());
  const kept = queryParams(u)
    .filter((p) => paramKind(p.key, u.hostname) === "other")
    .map((p) => p.raw);
  const tags = UTM_KEYS.filter((k) => values[k]?.trim()).map((k) => `${k}=${encode(values[k]!.trim())}`);
  const all = [...kept, ...tags];
  u.search = all.length ? `?${all.join("&")}` : "";
  return u.toString();
}

/** Reads the UTM tags from a link and returns the address without them. */
export function readUtm(input: string): { base: string; values: Partial<Record<UtmKey, string>>; found: number } | null {
  const parsed = parseBaseUrl(input);
  if ("error" in parsed) return null;
  const u = parsed.url;
  const values: Partial<Record<UtmKey, string>> = {};
  let found = 0;
  const kept: string[] = [];
  for (const p of queryParams(u)) {
    const k = p.key.toLowerCase();
    if (k.startsWith("utm_")) {
      if ((UTM_KEYS as string[]).includes(k)) values[k as UtmKey] = p.value;
      found++;
    } else kept.push(p.raw);
  }
  u.search = kept.length ? `?${kept.join("&")}` : "";
  return { base: u.toString(), values, found };
}

// ------------------------------------------------------------------ GA4

const SEARCH = ["google", "bing", "yahoo", "duckduckgo", "baidu", "yandex", "ecosia", "naver", "ask", "aol", "brave", "startpage", "qwant", "seznam", "sogou", "daum"];
const SOCIAL = [
  "facebook", "fb", "instagram", "ig", "linkedin", "lnkd", "twitter", "x", "t.co", "pinterest", "reddit", "tiktok",
  "snapchat", "whatsapp", "telegram", "threads", "quora", "tumblr", "discord", "messenger", "vk", "weibo", "wechat",
  "line", "mastodon", "bluesky", "meta", "sharechat", "moj",
];
const VIDEO = ["youtube", "youtu.be", "vimeo", "twitch", "dailymotion", "wistia", "vidyard"];
const SHOPPING = ["amazon", "ebay", "etsy", "shopify", "walmart", "flipkart", "aliexpress", "mercadolibre", "meesho", "myntra", "igshopping"];

function sourceIn(source: string, list: string[]): boolean {
  if (!source) return false;
  if (list.includes(source)) return true;
  // "facebook.com", "l.instagram.com", "google_ads" — but short names like
  // "x" or "ig" only on their own, so "x_newsletter" is not taken for X.
  const tokens = source.split(/[^a-z0-9]+/).filter((t) => t.length >= 3);
  return tokens.some((t) => list.includes(t)) || list.some((d) => d.includes(".") && source.endsWith(d)) || list.some((d) => source === `${d}.com`);
}

const PAID = /^(.*cp.*|ppc|retargeting|paid.*)$/;
const EMAIL = /email|e-mail|e_mail|e mail/;
const SHOP_CAMPAIGN = /^(.*(([^a-df-z]|^)shop|shopping).*)$/;

export interface ChannelResult {
  channel: string;
  /** Why Google puts it there, in plain words. */
  why: string;
}

/**
 * The GA4 default channel a visit with these tags is counted under. Values
 * are compared in lower case here; keep real tags lower case too, because
 * reports list "Email" and "email" as separate sources.
 */
export function ga4Channel(sourceIn_: string, mediumIn: string, campaignIn = ""): ChannelResult {
  const source = sourceIn_.trim().toLowerCase();
  const medium = mediumIn.trim().toLowerCase();
  const campaign = campaignIn.trim().toLowerCase();
  const paid = PAID.test(medium);
  const shopping = sourceIn(source, SHOPPING) || SHOP_CAMPAIGN.test(campaign);

  if (campaign.includes("cross-network")) return { channel: "Cross-network", why: "the campaign name contains “cross-network”." };
  if (shopping && paid) return { channel: "Paid Shopping", why: "it's a shopping site or campaign with a paid medium." };
  if (sourceIn(source, SEARCH) && paid) return { channel: "Paid Search", why: "the source is a search engine and the medium is paid (like cpc)." };
  if (sourceIn(source, SOCIAL) && paid) return { channel: "Paid Social", why: "the source is a social network and the medium is paid (like cpc or paid_social)." };
  if (sourceIn(source, VIDEO) && paid) return { channel: "Paid Video", why: "the source is a video site and the medium is paid." };
  if (["display", "banner", "expandable", "interstitial", "cpm"].includes(medium)) return { channel: "Display", why: "the medium is a display ad type." };
  if (paid) return { channel: "Paid Other", why: "the medium is paid, but the source isn't a known search, social, video or shopping site." };
  if (shopping) return { channel: "Organic Shopping", why: "the source is a shopping site." };
  if (sourceIn(source, SOCIAL) || ["social", "social-network", "social-media", "sm", "social network", "social media"].includes(medium))
    return { channel: "Organic Social", why: "the source is a social network or the medium is social." };
  if (sourceIn(source, VIDEO) || medium.includes("video")) return { channel: "Organic Video", why: "the source is a video site or the medium mentions video." };
  if (sourceIn(source, SEARCH) || medium === "organic") return { channel: "Organic Search", why: "the source is a search engine or the medium is organic." };
  if (["referral", "app", "link"].includes(medium)) return { channel: "Referral", why: "the medium is referral, app or link." };
  if (EMAIL.test(source) || EMAIL.test(medium)) return { channel: "Email", why: "the source or medium mentions email." };
  if (medium === "affiliate") return { channel: "Affiliates", why: "the medium is affiliate." };
  if (medium === "audio") return { channel: "Audio", why: "the medium is audio." };
  if (source === "sms" || medium === "sms") return { channel: "SMS", why: "the source or medium is sms." };
  if (medium.endsWith("push") || medium.includes("mobile") || medium.includes("notification") || source === "firebase")
    return { channel: "Mobile Push Notifications", why: "the medium mentions push, mobile or notification." };
  return {
    channel: "Unassigned",
    why: medium
      ? `Google doesn't recognise the medium “${medium}”, so these visits won't appear under any channel.`
      : "without a medium Google can't place the visit in a channel.",
  };
}

/** Mediums Google recognises, for suggestions. */
export const KNOWN_MEDIUMS = ["social", "paid_social", "cpc", "email", "referral", "affiliate", "display", "video", "organic", "sms", "push", "audio"];

export const COMMON_SOURCES = ["google", "facebook", "instagram", "linkedin", "x", "youtube", "whatsapp", "newsletter", "tiktok", "pinterest", "reddit", "bing"];

export interface UtmPreset {
  id: string;
  label: string;
  source: string;
  medium: string;
  /** Shown when the preset is chosen. */
  note?: string;
}

export const UTM_PRESETS: UtmPreset[] = [
  { id: "instagram", label: "Instagram", source: "instagram", medium: "social" },
  { id: "facebook", label: "Facebook", source: "facebook", medium: "social" },
  { id: "meta-ads", label: "Facebook / Instagram ad", source: "facebook", medium: "paid_social" },
  { id: "whatsapp", label: "WhatsApp", source: "whatsapp", medium: "social" },
  { id: "linkedin", label: "LinkedIn", source: "linkedin", medium: "social" },
  { id: "x", label: "X (Twitter)", source: "x", medium: "social" },
  { id: "youtube", label: "YouTube", source: "youtube", medium: "video" },
  { id: "newsletter", label: "Newsletter", source: "newsletter", medium: "email" },
  {
    id: "google-ads",
    label: "Google Ads",
    source: "google",
    medium: "cpc",
    note: "Google Ads can tag links for you: with auto-tagging on (the default), Analytics already knows the campaign, and manual tags are only needed for other analytics tools.",
  },
  { id: "sms", label: "SMS", source: "sms", medium: "sms" },
  { id: "affiliate", label: "Affiliate", source: "partner_name", medium: "affiliate", note: "Replace partner_name with the partner's name." },
  {
    id: "qr",
    label: "QR code / print",
    source: "qr_code",
    medium: "offline",
    note: "Google has no channel for print, so these visits show as Unassigned in the default report. They are still counted under this source, medium and campaign.",
  },
];

/** Decodes a pasted value that may still be percent-encoded. */
export function cleanPastedValue(v: string): string {
  return /%[0-9a-f]{2}/i.test(v) ? decodeQueryPart(v) : v;
}

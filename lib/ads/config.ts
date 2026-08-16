/**
 * AdSense configuration.
 *
 * IMPORTANT: `data-ad-slot` must be the numeric slot ID that AdSense generates
 * when you create an ad unit (e.g. "1234567890"). Descriptive strings like
 * "tool-mid-banner" are not valid slot IDs and will never fill — the unit
 * renders as blank space and the request is discarded.
 *
 * Create each unit in AdSense → Ads → By ad unit, then paste its numeric ID
 * below (or set the matching NEXT_PUBLIC_* env var). Until a slot has a real
 * ID, `AdSlot` renders nothing at all rather than leaving an empty box on the
 * page, which is both better for layout and required by AdSense policy —
 * placeholder boxes that imply an ad is present are not permitted.
 */

export const ADSENSE_CLIENT =
  process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || "ca-pub-5552044975820319";

/** Named placements → numeric AdSense slot IDs. Empty string = not configured. */
export const AD_SLOTS = {
  toolInArticle: process.env.NEXT_PUBLIC_AD_SLOT_TOOL_INARTICLE || "",
  toolSidebar: process.env.NEXT_PUBLIC_AD_SLOT_TOOL_SIDEBAR || "",
  homeInFeed: process.env.NEXT_PUBLIC_AD_SLOT_HOME_INFEED || "",
  listingFooter: process.env.NEXT_PUBLIC_AD_SLOT_LISTING_FOOTER || "",
} as const;

export type AdPlacement = keyof typeof AD_SLOTS;

/** A numeric slot ID is the only thing AdSense will accept. */
export function isValidSlotId(slotId: string | undefined): slotId is string {
  return !!slotId && /^\d{6,}$/.test(slotId);
}

export function isAdsConfigured(): boolean {
  return (
    ADSENSE_CLIENT.startsWith("ca-pub-") &&
    Object.values(AD_SLOTS).some(isValidSlotId)
  );
}

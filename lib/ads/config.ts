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

/** AdSense ad units → numeric slot IDs. Empty string = not configured. */
export const AD_UNITS = {
  // Real unit created in AdSense (in-article, fluid). Slot IDs are public —
  // they ship in the page HTML — so committing it is fine and means every
  // environment works without extra setup. The env var still overrides.
  inArticle: process.env.NEXT_PUBLIC_AD_SLOT_TOOL_INARTICLE || "5272275416",
  // Real unit created in AdSense (display, responsive).
  sidebar: process.env.NEXT_PUBLIC_AD_SLOT_TOOL_SIDEBAR || "6393785397",
  // Real unit created in AdSense (display, responsive). A unit can serve on
  // any number of pages; it is reused for listing and homepage placements
  // until dedicated units exist (set the env vars below to split reporting).
  display: process.env.NEXT_PUBLIC_AD_SLOT_LISTING_FOOTER || "3384478673",
  homepage: process.env.NEXT_PUBLIC_AD_SLOT_HOME_INFEED || "",
} as const;

export type AdUnit = keyof typeof AD_UNITS;

/**
 * Named placements. Pages ask for a placement, never a unit or a format, so
 * where and how ads appear is decided here in one place.
 *
 * Placement rules (see also components/AdSlot.tsx):
 * - Never between a tool's heading and the tool, never inside the tool
 *   workspace, never next to a download or primary button, never in dialogs,
 *   menus or search results.
 * - At most one ad in the main column of a tool page, placed after the how-to
 *   section, well clear of any control.
 */
export interface PlacementConfig {
  unit: AdUnit;
  /** fluid = in-article layout; horizontal = banner shapes; auto = responsive. */
  format: "fluid" | "horizontal" | "auto" | "vertical";
  /**
   * Reserved height before the ad fills, to avoid layout shift. Static class
   * strings so Tailwind can see them.
   */
  heightClass: string;
  /** Only mount at or above this viewport width (px). */
  minViewport?: number;
  maxWidth: number;
}

export const AD_PLACEMENTS = {
  "homepage-section": {
    unit: "display",
    format: "horizontal",
    heightClass: "min-h-[100px] md:min-h-[90px]",
    maxWidth: 970,
  },
  "category-middle": {
    unit: "display",
    format: "horizontal",
    heightClass: "min-h-[100px] md:min-h-[90px]",
    maxWidth: 970,
  },
  "listing-middle": {
    unit: "display",
    format: "horizontal",
    heightClass: "min-h-[100px] md:min-h-[90px]",
    maxWidth: 970,
  },
  "tool-in-content": {
    unit: "inArticle",
    format: "fluid",
    heightClass: "min-h-[250px]",
    maxWidth: 728,
  },
  "content-middle": {
    unit: "inArticle",
    format: "fluid",
    heightClass: "min-h-[250px]",
    maxWidth: 728,
  },
  "tool-sidebar": {
    unit: "sidebar",
    format: "vertical",
    heightClass: "min-h-[600px]",
    // The sidebar only exists at the lg breakpoint; below it the rail stacks
    // under the article and a 600px block there is just a gap.
    minViewport: 1024,
    maxWidth: 300,
  },
} satisfies Record<string, PlacementConfig>;

export type AdPlacement = keyof typeof AD_PLACEMENTS;

/** A numeric slot ID is the only thing AdSense will accept. */
export function isValidSlotId(slotId: string | undefined): slotId is string {
  return !!slotId && /^\d{6,}$/.test(slotId);
}

export function isAdsConfigured(): boolean {
  return (
    ADSENSE_CLIENT.startsWith("ca-pub-") &&
    Object.values(AD_UNITS).some(isValidSlotId)
  );
}

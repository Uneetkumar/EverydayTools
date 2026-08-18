/**
 * Guesses the visitor's home currency so the converter opens on something
 * useful rather than always USD to INR.
 *
 * Deliberately uses only APIs already present in the browser — timezone and
 * language — rather than an IP geolocation service. No request is made and no
 * identifier leaves the device, which keeps this consistent with the rest of
 * the site. It is a convenience guess, not a claim about where you are, and
 * the user can override it with one tap.
 */

/** Timezone prefixes are a better signal than language for expatriate users. */
const ZONE_TO_CURRENCY: Record<string, string> = {
  "Asia/Kolkata": "INR", "Asia/Calcutta": "INR",
  "Asia/Dubai": "AED", "Asia/Riyadh": "SAR", "Asia/Kuwait": "KWD",
  "Asia/Qatar": "QAR", "Asia/Bahrain": "BHD", "Asia/Muscat": "OMR",
  "Asia/Karachi": "PKR", "Asia/Dhaka": "BDT", "Asia/Colombo": "LKR",
  "Asia/Kathmandu": "NPR", "Asia/Singapore": "SGD", "Asia/Hong_Kong": "HKD",
  "Asia/Tokyo": "JPY", "Asia/Seoul": "KRW", "Asia/Shanghai": "CNY",
  "Asia/Bangkok": "THB", "Asia/Jakarta": "IDR", "Asia/Manila": "PHP",
  "Asia/Kuala_Lumpur": "MYR",
  "Europe/London": "GBP", "Europe/Dublin": "EUR", "Europe/Paris": "EUR",
  "Europe/Berlin": "EUR", "Europe/Madrid": "EUR", "Europe/Rome": "EUR",
  "Europe/Amsterdam": "EUR", "Europe/Lisbon": "EUR", "Europe/Zurich": "CHF",
  "Europe/Stockholm": "SEK", "Europe/Oslo": "NOK", "Europe/Copenhagen": "DKK",
  "Europe/Warsaw": "PLN", "Europe/Moscow": "RUB", "Europe/Istanbul": "TRY",
  "America/New_York": "USD", "America/Chicago": "USD", "America/Denver": "USD",
  "America/Los_Angeles": "USD", "America/Toronto": "CAD",
  "America/Vancouver": "CAD", "America/Mexico_City": "MXN",
  "America/Sao_Paulo": "BRL",
  "Australia/Sydney": "AUD", "Australia/Melbourne": "AUD",
  "Australia/Perth": "AUD", "Pacific/Auckland": "NZD",
  "Africa/Lagos": "NGN", "Africa/Johannesburg": "ZAR", "Africa/Nairobi": "KES",
  "Africa/Cairo": "EGP",
};

/** Fallback when the timezone is unknown: the locale's region subtag. */
const REGION_TO_CURRENCY: Record<string, string> = {
  IN: "INR", US: "USD", GB: "GBP", AE: "AED", SA: "SAR", KW: "KWD",
  QA: "QAR", BH: "BHD", OM: "OMR", PK: "PKR", BD: "BDT", LK: "LKR",
  NP: "NPR", SG: "SGD", HK: "HKD", JP: "JPY", KR: "KRW", CN: "CNY",
  TH: "THB", ID: "IDR", PH: "PHP", MY: "MYR", CA: "CAD", AU: "AUD",
  NZ: "NZD", ZA: "ZAR", NG: "NGN", BR: "BRL", MX: "MXN", RU: "RUB",
  TR: "TRY", CH: "CHF", SE: "SEK", NO: "NOK", DK: "DKK", PL: "PLN",
  DE: "EUR", FR: "EUR", ES: "EUR", IT: "EUR", NL: "EUR", IE: "EUR",
  PT: "EUR", AT: "EUR", BE: "EUR", FI: "EUR", GR: "EUR",
};

/** Returns the visitor's likely currency, or null if it cannot be inferred. */
export function detectLocalCurrency(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (zone && ZONE_TO_CURRENCY[zone]) return ZONE_TO_CURRENCY[zone];
  } catch {
    // Intl can be unavailable in exotic environments; fall through.
  }

  try {
    for (const tag of navigator.languages ?? [navigator.language]) {
      const region = tag?.split("-")[1]?.toUpperCase();
      if (region && REGION_TO_CURRENCY[region]) return REGION_TO_CURRENCY[region];
    }
  } catch {
    // Ignore and give up rather than guessing wrongly.
  }

  return null;
}

/**
 * Picks a sensible opening pair for a visitor.
 * Their own currency is the more useful *target* — people convert foreign
 * prices into money they think in.
 */
export function defaultPairForCurrency(local: string | null): {
  from: string;
  to: string;
} {
  if (!local) return { from: "USD", to: "INR" };
  if (local === "USD") return { from: "USD", to: "EUR" };
  return { from: "USD", to: local };
}

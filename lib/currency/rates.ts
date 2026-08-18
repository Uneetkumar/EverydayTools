/**
 * Live exchange-rate fetching.
 *
 * NOTE ON PRIVACY CLAIMS: unlike every other tool on this site, the currency
 * converter cannot work offline — it must ask somebody what today's rate is.
 * The request contains no user data (it is a plain GET for a public rate
 * table), but the browser does contact a third party, so this tool must not
 * carry the "nothing leaves your browser" badge the others use.
 */

export interface RateTable {
  base: string;
  rates: Record<string, number>;
  /** ISO timestamp the provider last refreshed its rates. */
  updatedAt: string;
  provider: string;
}

const CACHE_KEY = "et_fx_rates_v1";
/** Providers publish roughly daily; an hour of caching is plenty. */
const CACHE_TTL_MS = 60 * 60 * 1000;

type Cached = { fetchedAt: number; table: RateTable };

function readCache(base: string): RateTable | null {
  try {
    const raw = sessionStorage.getItem(`${CACHE_KEY}_${base}`);
    if (!raw) return null;
    const parsed: Cached = JSON.parse(raw);
    if (Date.now() - parsed.fetchedAt > CACHE_TTL_MS) return null;
    return parsed.table;
  } catch {
    return null;
  }
}

function writeCache(base: string, table: RateTable) {
  try {
    const payload: Cached = { fetchedAt: Date.now(), table };
    sessionStorage.setItem(`${CACHE_KEY}_${base}`, JSON.stringify(payload));
  } catch {
    // Private browsing can throw on write; caching is an optimisation only.
  }
}

async function fetchPrimary(base: string): Promise<RateTable> {
  const res = await fetch(`https://open.er-api.com/v6/latest/${base}`);
  if (!res.ok) throw new Error(`primary ${res.status}`);
  const json = await res.json();
  if (json.result !== "success" || !json.rates) throw new Error("primary shape");
  return {
    base: json.base_code ?? base,
    rates: json.rates,
    updatedAt: json.time_last_update_utc
      ? new Date(json.time_last_update_utc).toISOString()
      : new Date().toISOString(),
    provider: "exchangerate-api.com",
  };
}

async function fetchFallback(base: string): Promise<RateTable> {
  const res = await fetch(`https://api.frankfurter.dev/v1/latest?base=${base}`);
  if (!res.ok) throw new Error(`fallback ${res.status}`);
  const json = await res.json();
  if (!json.rates) throw new Error("fallback shape");
  return {
    base: json.base ?? base,
    // Frankfurter omits the base currency from its own table.
    rates: { ...json.rates, [json.base ?? base]: 1 },
    updatedAt: new Date(`${json.date}T00:00:00Z`).toISOString(),
    provider: "frankfurter.dev (ECB)",
  };
}

export async function getRates(base: string): Promise<RateTable> {
  const cached = readCache(base);
  if (cached) return cached;

  let table: RateTable;
  try {
    table = await fetchPrimary(base);
  } catch {
    // One provider being down should not take the tool down with it.
    table = await fetchFallback(base);
  }
  writeCache(base, table);
  return table;
}

/** Currencies surfaced at the top of the picker, in rough search-volume order. */
export const POPULAR_CURRENCIES = [
  "USD", "INR", "EUR", "GBP", "AED", "AUD", "CAD", "SGD",
  "JPY", "CNY", "CHF", "SAR", "MYR", "NZD", "ZAR", "THB",
] as const;

export const CURRENCY_NAMES: Record<string, string> = {
  USD: "US Dollar", INR: "Indian Rupee", EUR: "Euro", GBP: "British Pound",
  AED: "UAE Dirham", AUD: "Australian Dollar", CAD: "Canadian Dollar",
  SGD: "Singapore Dollar", JPY: "Japanese Yen", CNY: "Chinese Yuan",
  CHF: "Swiss Franc", SAR: "Saudi Riyal", MYR: "Malaysian Ringgit",
  NZD: "New Zealand Dollar", ZAR: "South African Rand", THB: "Thai Baht",
  HKD: "Hong Kong Dollar", KRW: "South Korean Won", RUB: "Russian Ruble",
  BRL: "Brazilian Real", MXN: "Mexican Peso", IDR: "Indonesian Rupiah",
  PHP: "Philippine Peso", PKR: "Pakistani Rupee", BDT: "Bangladeshi Taka",
  LKR: "Sri Lankan Rupee", NPR: "Nepalese Rupee", KWD: "Kuwaiti Dinar",
  QAR: "Qatari Riyal", OMR: "Omani Rial", BHD: "Bahraini Dinar",
  TRY: "Turkish Lira", SEK: "Swedish Krona", NOK: "Norwegian Krone",
  DKK: "Danish Krone", PLN: "Polish Zloty", NGN: "Nigerian Naira",
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$", INR: "₹", EUR: "€", GBP: "£", JPY: "¥", CNY: "¥",
  AUD: "A$", CAD: "C$", SGD: "S$", NZD: "NZ$", HKD: "HK$", KRW: "₩",
  THB: "฿", PHP: "₱", NGN: "₦", TRY: "₺", RUB: "₽", BRL: "R$",
};

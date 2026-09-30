/**
 * Cities, time-zone names and helpers for the World Clock and meeting
 * planner. Offsets and daylight-saving changes come from the browser's
 * Intl database (the same IANA data the rest of the system uses), so they
 * follow the real rules for any date rather than a fixed table.
 */

import { wallToInstant, zoneOffset } from "./timestamp";

export interface City {
  id: string;
  name: string;
  country: string;
  zone: string;
}

const C = (id: string, name: string, country: string, zone: string): City => ({ id, name, country, zone });

export const CITIES: City[] = [
  C("utc", "UTC", "Coordinated Universal Time", "UTC"),
  C("london", "London", "United Kingdom", "Europe/London"),
  C("dublin", "Dublin", "Ireland", "Europe/Dublin"),
  C("lisbon", "Lisbon", "Portugal", "Europe/Lisbon"),
  C("paris", "Paris", "France", "Europe/Paris"),
  C("berlin", "Berlin", "Germany", "Europe/Berlin"),
  C("madrid", "Madrid", "Spain", "Europe/Madrid"),
  C("rome", "Rome", "Italy", "Europe/Rome"),
  C("amsterdam", "Amsterdam", "Netherlands", "Europe/Amsterdam"),
  C("zurich", "Zurich", "Switzerland", "Europe/Zurich"),
  C("stockholm", "Stockholm", "Sweden", "Europe/Stockholm"),
  C("athens", "Athens", "Greece", "Europe/Athens"),
  C("helsinki", "Helsinki", "Finland", "Europe/Helsinki"),
  C("istanbul", "Istanbul", "Türkiye", "Europe/Istanbul"),
  C("moscow", "Moscow", "Russia", "Europe/Moscow"),
  C("kyiv", "Kyiv", "Ukraine", "Europe/Kiev"),
  C("cairo", "Cairo", "Egypt", "Africa/Cairo"),
  C("lagos", "Lagos", "Nigeria", "Africa/Lagos"),
  C("nairobi", "Nairobi", "Kenya", "Africa/Nairobi"),
  C("johannesburg", "Johannesburg", "South Africa", "Africa/Johannesburg"),
  C("casablanca", "Casablanca", "Morocco", "Africa/Casablanca"),
  C("dubai", "Dubai", "United Arab Emirates", "Asia/Dubai"),
  C("riyadh", "Riyadh", "Saudi Arabia", "Asia/Riyadh"),
  C("tehran", "Tehran", "Iran", "Asia/Tehran"),
  C("karachi", "Karachi", "Pakistan", "Asia/Karachi"),
  C("delhi", "Delhi / Mumbai", "India", "Asia/Kolkata"),
  C("kathmandu", "Kathmandu", "Nepal", "Asia/Kathmandu"),
  C("dhaka", "Dhaka", "Bangladesh", "Asia/Dhaka"),
  C("colombo", "Colombo", "Sri Lanka", "Asia/Colombo"),
  C("bangkok", "Bangkok", "Thailand", "Asia/Bangkok"),
  C("jakarta", "Jakarta", "Indonesia", "Asia/Jakarta"),
  C("singapore", "Singapore", "Singapore", "Asia/Singapore"),
  C("kuala-lumpur", "Kuala Lumpur", "Malaysia", "Asia/Kuala_Lumpur"),
  C("hong-kong", "Hong Kong", "Hong Kong", "Asia/Hong_Kong"),
  C("shanghai", "Shanghai / Beijing", "China", "Asia/Shanghai"),
  C("taipei", "Taipei", "Taiwan", "Asia/Taipei"),
  C("manila", "Manila", "Philippines", "Asia/Manila"),
  C("seoul", "Seoul", "South Korea", "Asia/Seoul"),
  C("tokyo", "Tokyo", "Japan", "Asia/Tokyo"),
  C("perth", "Perth", "Australia", "Australia/Perth"),
  C("brisbane", "Brisbane", "Australia", "Australia/Brisbane"),
  C("sydney", "Sydney / Melbourne", "Australia", "Australia/Sydney"),
  C("auckland", "Auckland", "New Zealand", "Pacific/Auckland"),
  C("honolulu", "Honolulu", "United States", "Pacific/Honolulu"),
  C("anchorage", "Anchorage", "United States", "America/Anchorage"),
  C("los-angeles", "Los Angeles / San Francisco", "United States", "America/Los_Angeles"),
  C("vancouver", "Vancouver", "Canada", "America/Vancouver"),
  C("denver", "Denver", "United States", "America/Denver"),
  C("phoenix", "Phoenix", "United States", "America/Phoenix"),
  C("chicago", "Chicago", "United States", "America/Chicago"),
  C("mexico-city", "Mexico City", "Mexico", "America/Mexico_City"),
  C("new-york", "New York", "United States", "America/New_York"),
  C("toronto", "Toronto", "Canada", "America/Toronto"),
  C("bogota", "Bogotá", "Colombia", "America/Bogota"),
  C("lima", "Lima", "Peru", "America/Lima"),
  C("santiago", "Santiago", "Chile", "America/Santiago"),
  C("sao-paulo", "São Paulo", "Brazil", "America/Sao_Paulo"),
  C("buenos-aires", "Buenos Aires", "Argentina", "America/Argentina/Buenos_Aires"),
];

const BY_ID = new Map(CITIES.map((c) => [c.id, c]));
export const getCity = (id: string): City | undefined => BY_ID.get(id);

export function searchCities(query: string): City[] {
  const q = query.trim().toLowerCase();
  if (!q) return CITIES;
  return CITIES.filter((c) => c.name.toLowerCase().includes(q) || c.country.toLowerCase().includes(q) || c.zone.toLowerCase().includes(q) || c.id.includes(q));
}

/** The browser's own zone, or UTC if it cannot be read. */
export function localZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function isValidZone(zone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

export interface ZoneClock {
  /** Local hour (0–23), minute, second. */
  hour: number;
  minute: number;
  second: number;
  /** UTC offset in minutes at that instant. */
  offsetMin: number;
  /** "GMT+5:30", "CEST"… as the browser names it. */
  abbr: string;
  dst: boolean;
  /** YYYY-MM-DD in that zone. */
  date: string;
  weekday: string;
}

export function zoneClock(ms: number, zone: string): ZoneClock {
  const fmt = new Intl.DateTimeFormat("en-US", { timeZone: zone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", weekday: "short" });
  const parts = fmt.formatToParts(new Date(ms));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const offsetMin = zoneOffset(ms, zone);
  const year = new Date(ms).getUTCFullYear();
  const jan = zoneOffset(Date.UTC(year, 0, 1), zone);
  const jul = zoneOffset(Date.UTC(year, 6, 1), zone);
  return {
    hour: Number(get("hour")) % 24,
    minute: Number(get("minute")),
    second: Number(get("second")),
    offsetMin,
    abbr: zoneAbbreviation(ms, zone),
    dst: jan !== jul && offsetMin === Math.max(jan, jul),
    date: `${get("year")}-${get("month")}-${get("day")}`,
    weekday: get("weekday"),
  };
}

export function zoneAbbreviation(ms: number, zone: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", { timeZone: zone, timeZoneName: "short" }).formatToParts(new Date(ms)).find((p) => p.type === "timeZoneName")?.value ?? zone;
  } catch {
    return zone;
  }
}

export function offsetLabel(minutes: number): string {
  const sign = minutes < 0 ? "−" : "+";
  const a = Math.abs(minutes);
  const h = Math.floor(a / 60);
  const m = a % 60;
  return m ? `UTC${sign}${h}:${String(m).padStart(2, "0")}` : `UTC${sign}${h}`;
}

export function formatTime(c: Pick<ZoneClock, "hour" | "minute" | "second">, opts: { hour12: boolean; seconds?: boolean }): string {
  const mm = String(c.minute).padStart(2, "0");
  const ss = String(c.second).padStart(2, "0");
  if (opts.hour12) {
    const h = c.hour % 12 === 0 ? 12 : c.hour % 12;
    return `${h}:${mm}${opts.seconds ? `:${ss}` : ""} ${c.hour < 12 ? "AM" : "PM"}`;
  }
  return `${String(c.hour).padStart(2, "0")}:${mm}${opts.seconds ? `:${ss}` : ""}`;
}

/** "Today", "Tomorrow", "Yesterday" or a weekday + date, relative to another zone's calendar date. */
export function relativeDay(date: string, reference: string): string {
  const a = Date.parse(`${date}T00:00:00Z`);
  const b = Date.parse(`${reference}T00:00:00Z`);
  const d = Math.round((a - b) / 86400000);
  return d === 0 ? "Same day" : d === 1 ? "Tomorrow" : d === -1 ? "Yesterday" : d > 0 ? `+${d} days` : `${d} days`;
}

/** Part of the day, for the icon next to a clock. */
export function dayPart(hour: number): "night" | "morning" | "day" | "evening" {
  return hour < 6 || hour >= 21 ? "night" : hour < 12 ? "morning" : hour < 18 ? "day" : "evening";
}

export interface PlannerCell {
  hour: number;
  minute: number;
  /** -1, 0, +1 relative to the planner's date in the home zone. */
  dayShift: number;
  working: boolean;
}

/**
 * For each hour of one calendar day in `homeZone`, the local time in every
 * city and whether it falls inside that person's working hours.
 */
export function plan(date: string, homeZone: string, zones: string[], workStart = 9, workEnd = 18): { hourInHome: number; instant: number; cells: PlannerCell[]; score: number }[] {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return [];
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const homeDate = date;
  const rows = [];
  for (let h = 0; h < 24; h++) {
    const instant = wallToInstant(y, mo, d, h, 0, 0, 0, homeZone);
    const cells: PlannerCell[] = zones.map((z) => {
      const c = zoneClock(instant, z);
      const shift = Math.round((Date.parse(`${c.date}T00:00:00Z`) - Date.parse(`${homeDate}T00:00:00Z`)) / 86400000);
      const t = c.hour + c.minute / 60;
      return { hour: c.hour, minute: c.minute, dayShift: shift, working: t >= workStart && t < workEnd };
    });
    rows.push({ hourInHome: h, instant, cells, score: cells.filter((c) => c.working).length });
  }
  return rows;
}

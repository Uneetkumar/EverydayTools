// `cn` comes from shadcn's own class-merge package so that components added
// with `shadcn add` (which import from "cn" directly) and hand-written code
// merge Tailwind classes identically.
export { cn } from "cn";

export function formatNumber(val: number, decimals: number = 2): string {
  if (isNaN(val) || !isFinite(val)) return "0";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: decimals,
  }).format(val);
}

export function formatCurrency(val: number, currency: string = "USD"): string {
  if (isNaN(val) || !isFinite(val)) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(val);
}

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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

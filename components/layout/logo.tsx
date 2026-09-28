import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The TabBench mark: the app icon (blue squircle, screen and keypad)
 * simplified for small sizes, where the icon's keypad glyphs would not read.
 * One component so the header, mobile menu and footer can never drift apart
 * again (they previously used a calculator, a wrench and two different blues).
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-7 shrink-0", className)}>
      <rect width="32" height="32" rx="8" fill="#2563eb" />
      <rect x="7" y="7" width="18" height="6" rx="1.75" fill="#fff" fillOpacity=".28" />
      <rect x="7" y="15.5" width="4.5" height="4" rx="1.25" fill="#fff" />
      <rect x="13.75" y="15.5" width="4.5" height="4" rx="1.25" fill="#fff" />
      <rect x="20.5" y="15.5" width="4.5" height="4" rx="1.25" fill="#fff" />
      <rect x="7" y="21.5" width="4.5" height="4" rx="1.25" fill="#fff" />
      <rect x="13.75" y="21.5" width="4.5" height="4" rx="1.25" fill="#fff" />
      <rect x="20.5" y="21.5" width="4.5" height="4" rx="1.25" fill="#38bdf8" />
    </svg>
  );
}

export function Logo({ className, onClick }: { className?: string; onClick?: () => void }) {
  return (
    <Link
      href="/"
      onClick={onClick}
      className={cn("flex shrink-0 items-center gap-2 rounded-md", className)}
      aria-label="TabBench home"
    >
      <LogoMark />
      <span className="text-[1.0625rem] font-semibold tracking-tight text-foreground">
        TabBench
      </span>
    </Link>
  );
}

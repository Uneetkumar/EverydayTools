import Link from "next/link";
import { MARK, markSvgBody } from "@/lib/brand/mark";
import { cn } from "@/lib/utils";

/**
 * The TabBench mark, drawn from lib/brand/mark.ts so the header, mobile menu,
 * footer, favicon and app icons all show the same logo.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${MARK.size} ${MARK.size}`}
      aria-hidden="true"
      className={cn("size-7 shrink-0", className)}
      // Static markup built from constants in lib/brand/mark.ts, never user input.
      dangerouslySetInnerHTML={{ __html: markSvgBody() }}
    />
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

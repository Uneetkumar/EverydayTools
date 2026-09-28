import { cn } from "@/lib/utils";
import { TOOL_BADGES, categoryTone } from "@/lib/tools/visuals";
import { ToolIcon } from "./tool-icon";

const SIZES = {
  "2xs": { tile: "size-5 rounded-[5px]", icon: "size-3", badge: false },
  xs: { tile: "size-7 rounded-md", icon: "size-3.5", badge: false },
  sm: { tile: "size-9 rounded-lg", icon: "size-4", badge: true },
  md: { tile: "size-11 rounded-xl", icon: "size-5", badge: true },
  lg: { tile: "size-14 rounded-2xl", icon: "size-7", badge: true },
} as const;

/**
 * A tool's visual identity: its icon on a tile coloured by category, with a
 * format label ("PDF", "JPG", "GST") on the corner where one applies. Used on
 * every card, list and header so the same tool always looks the same.
 * Decorative: the tool's name is always next to it.
 */
export function ToolVisual({
  slug,
  iconName,
  category,
  size = "md",
  className,
}: {
  slug: string;
  iconName: string;
  category: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const s = SIZES[size];
  const tone = categoryTone(category);
  const badge = s.badge ? TOOL_BADGES[slug] : undefined;

  return (
    <span aria-hidden="true" className={cn("relative inline-flex shrink-0", className)}>
      <span className={cn("flex items-center justify-center ring-1 ring-inset", s.tile, tone.tile)}>
        <ToolIcon name={iconName} className={s.icon} strokeWidth={1.75} />
      </span>
      {badge && (
        <span
          className={cn(
            "absolute -right-1.5 -bottom-1 rounded-[5px] px-1 py-px font-mono leading-none font-bold tracking-tight ring-2 ring-card",
            size === "lg" ? "text-[10px]" : size === "sm" ? "text-[8px]" : "text-[9px]",
            tone.badge
          )}
        >
          {badge}
        </span>
      )}
    </span>
  );
}

/** Category icon on the category's colour, for category cards and headers. */
export function CategoryVisual({
  category,
  iconName,
  size = "md",
  className,
}: {
  category: string;
  iconName: string;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const s = SIZES[size];
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center ring-1 ring-inset",
        s.tile,
        categoryTone(category).tile,
        className
      )}
    >
      <ToolIcon name={iconName} className={s.icon} strokeWidth={1.75} />
    </span>
  );
}

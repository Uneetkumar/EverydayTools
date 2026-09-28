import Link from "next/link";
import { cn } from "@/lib/utils";
import { ToolVisual } from "./tool-visual";
import { FavoriteButton } from "./favorite-button";

export interface ToolCardData {
  slug: string;
  name: string;
  tagline: string;
  iconName: string;
  category: string;
}

interface ToolCardProps {
  tool: ToolCardData;
  /** Heading element for the tool name; `p` where a card is not under a section heading. */
  as?: "h3" | "h4" | "p";
  showFavorite?: boolean;
  /** Compact: single-line tagline, tighter padding (dense lists). */
  compact?: boolean;
  className?: string;
  /** Extra data attributes for analytics hooks on the link. */
  linkProps?: Record<string, string>;
}

/**
 * The one card used for tools everywhere: visual (category colour + icon +
 * format label), name, one-line explanation,
 * optional favorite. The whole card is clickable through a stretched link, so
 * there is a single tab stop per card plus the star, and the star remains a
 * real button rather than a button nested inside a link.
 */
export function ToolCard({
  tool,
  as: Heading = "h3",
  showFavorite = true,
  compact = false,
  className,
  linkProps,
}: ToolCardProps) {
  return (
    <div
      className={cn(
        "group relative flex items-start rounded-xl border bg-card text-card-foreground shadow-soft transition-colors",
        "hover:border-foreground/15 hover:bg-accent/50",
        "has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-ring",
        compact ? "gap-3 p-3" : "gap-3.5 p-4",
        className
      )}
    >
      <ToolVisual
        slug={tool.slug}
        iconName={tool.iconName}
        category={tool.category}
        size={compact ? "sm" : "md"}
        className={compact ? undefined : "mt-0.5"}
      />
      <div className="min-w-0 flex-1">
        <Heading className="type-h4 text-foreground">
          <Link
            href={`/tools/${tool.slug}`}
            className="outline-none after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none"
            {...linkProps}
          >
            {tool.name}
          </Link>
        </Heading>
        <p
          className={cn(
            "mt-0.5 text-sm text-muted-foreground",
            compact ? "line-clamp-1" : "line-clamp-3"
          )}
        >
          {tool.tagline}
        </p>
      </div>
      {showFavorite && (
        <FavoriteButton slug={tool.slug} name={tool.name} revealOnHover className="relative z-10 -mt-1 -mr-1" />
      )}
    </div>
  );
}

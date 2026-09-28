"use client";

import { Star } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toggleFavorite, useFavorites } from "@/lib/history/favorites";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  slug: string;
  name: string;
  /** Show "Save"/"Saved" next to the star (tool page header). */
  withLabel?: boolean;
  /**
   * On cards: hidden until the card is hovered or focused, on devices that
   * can hover, so a grid of cards is not a grid of stars. Always shown when
   * the tool is already a favourite, and always on touch screens.
   */
  revealOnHover?: boolean;
  className?: string;
}

export function FavoriteButton({ slug, name, withLabel = false, revealOnHover = false, className }: FavoriteButtonProps) {
  const favorites = useFavorites();
  const active = favorites.includes(slug);
  const label = active ? `Remove ${name} from favorites` : `Add ${name} to favorites`;

  const onClick = (e: React.MouseEvent) => {
    // Cards wrap a stretched link; the star must not also navigate.
    e.preventDefault();
    e.stopPropagation();
    const added = toggleFavorite(slug);
    track(added ? "favorite_added" : "favorite_removed", { tool: slug });
    toast(added ? `${name} added to favorites` : `${name} removed from favorites`, {
      description: added ? "Find it any time under the star in the header." : undefined,
    });
  };

  const button = (
    <Button
      type="button"
      variant={withLabel ? "outline" : "ghost"}
      size={withLabel ? "sm" : "icon-sm"}
      // On small screens the labelled variant collapses to its icon.
      aria-pressed={active}
      aria-label={label}
      onClick={onClick}
      className={cn(
        !withLabel && "text-muted-foreground hover:text-foreground",
        revealOnHover &&
          !active &&
          "[@media(hover:hover)]:opacity-0 group-hover:opacity-100 group-has-[a:focus-visible]:opacity-100 focus-visible:opacity-100",
        className
      )}
    >
      <Star
        className={cn(active && "fill-amber-400 text-amber-500 dark:fill-amber-400 dark:text-amber-400")}
        aria-hidden="true"
      />
      {withLabel && <span className="hidden md:inline">{active ? "Saved" : "Save"}</span>}
    </Button>
  );

  if (withLabel) return button;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent>{active ? "Remove from favorites" : "Add to favorites"}</TooltipContent>
    </Tooltip>
  );
}

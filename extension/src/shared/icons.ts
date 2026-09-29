/** Lucide icon markup, generated at build time from the same icons the site uses. */
import icons from "../generated/icons.json";

const ICONS = icons as Record<string, string>;

export function iconSvg(name: string): string {
  return ICONS[name] ?? ICONS.Wrench ?? "";
}

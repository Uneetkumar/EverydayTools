/**
 * The site's controls, rebuilt for the extension with the same classes:
 * buttons (shadcn variants), the category-coloured tool tile, segmented
 * control and switch.
 */
import { cn, h } from "./dom";
import { iconSvg } from "../shared/icons";
import type { ExtTool } from "../shared/tools";

export function icon(name: string, className = "size-4"): HTMLSpanElement {
  return h("span", { class: cn("tb-icon inline-flex shrink-0 [&>svg]:size-full", className), "aria-hidden": "true", html: iconSvg(name) });
}

const BUTTON_BASE =
  "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors outline-none select-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50";
const VARIANTS = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90",
  outline: "border border-border bg-background hover:bg-muted dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
  ghost: "hover:bg-muted text-foreground",
  secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
} as const;
const SIZES = {
  sm: "h-8 px-3",
  xs: "h-7 px-2.5 text-xs",
  icon: "size-8",
} as const;

export function button(
  label: (Node | string)[] | string,
  opts: {
    variant?: keyof typeof VARIANTS;
    size?: keyof typeof SIZES;
    onClick?: (e: MouseEvent) => void;
    title?: string;
    ariaLabel?: string;
    disabled?: boolean;
    class?: string;
  } = {}
): HTMLButtonElement {
  const children = typeof label === "string" ? [label] : label;
  return h(
    "button",
    {
      type: "button",
      class: cn(BUTTON_BASE, VARIANTS[opts.variant ?? "default"], SIZES[opts.size ?? "sm"], opts.class),
      title: opts.title,
      "aria-label": opts.ariaLabel,
      disabled: opts.disabled,
      on: opts.onClick ? { click: opts.onClick } : undefined,
    },
    ...children
  );
}

/** The tool's icon on its category colour, with the format badge — the site's ToolVisual. */
export function toolTile(tool: ExtTool, size: "sm" | "xs" = "sm"): HTMLSpanElement {
  const tile = size === "sm" ? "size-9 rounded-lg" : "size-7 rounded-md";
  const ic = size === "sm" ? "size-4" : "size-3.5";
  return h(
    "span",
    { class: "relative inline-flex shrink-0", "aria-hidden": "true" },
    h("span", { class: cn("flex items-center justify-center ring-1 ring-inset", tile, tool.tone) }, icon(tool.iconName, cn(ic, "[&_svg]:stroke-[1.75]"))),
    size === "sm" && tool.badge
      ? h(
          "span",
          {
            class: cn(
              "absolute -right-1.5 -bottom-1 rounded-[5px] px-1 py-px font-mono text-[8px] leading-none font-bold tracking-tight ring-2 ring-card",
              tool.badgeTone
            ),
          },
          tool.badge
        )
      : null
  );
}

export function segmented<T extends string>(
  value: T,
  options: { value: T; label: string }[],
  onChange: (v: T) => void,
  ariaLabel: string
): HTMLDivElement {
  const group = h("div", { role: "radiogroup", "aria-label": ariaLabel, class: "inline-flex rounded-lg border bg-muted/40 p-0.5" });
  for (const o of options) {
    const selected = o.value === value;
    group.append(
      h(
        "button",
        {
          type: "button",
          role: "radio",
          "aria-checked": String(selected),
          class: cn(
            "h-7 rounded-md px-2.5 text-xs font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            selected ? "bg-background text-foreground shadow-xs dark:bg-input/60" : "text-muted-foreground hover:text-foreground"
          ),
          on: { click: () => onChange(o.value) },
        },
        o.label
      )
    );
  }
  return group;
}

export function toggle(checked: boolean, onChange: (v: boolean) => void, id: string): HTMLButtonElement {
  return h(
    "button",
    {
      type: "button",
      role: "switch",
      id,
      "aria-checked": String(checked),
      class: cn(
        "relative inline-flex h-[18px] w-8 shrink-0 items-center rounded-full transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        checked ? "bg-primary" : "bg-input dark:bg-input/80"
      ),
      on: { click: () => onChange(!checked) },
    },
    h("span", {
      class: cn(
        "pointer-events-none block size-4 rounded-full bg-background shadow-sm transition-transform dark:bg-foreground",
        checked ? "translate-x-[15px] dark:bg-primary-foreground" : "translate-x-px"
      ),
    })
  );
}

/** The TabBench mark, identical to the site's LogoMark. */
export const LOGO_SVG = `<svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#2563eb"/><rect x="7" y="7" width="18" height="6" rx="1.75" fill="#fff" fill-opacity=".28"/><rect x="7" y="15.5" width="4.5" height="4" rx="1.25" fill="#fff"/><rect x="13.75" y="15.5" width="4.5" height="4" rx="1.25" fill="#fff"/><rect x="20.5" y="15.5" width="4.5" height="4" rx="1.25" fill="#fff"/><rect x="7" y="21.5" width="4.5" height="4" rx="1.25" fill="#fff"/><rect x="13.75" y="21.5" width="4.5" height="4" rx="1.25" fill="#fff"/><rect x="20.5" y="21.5" width="4.5" height="4" rx="1.25" fill="#38bdf8"/></svg>`;

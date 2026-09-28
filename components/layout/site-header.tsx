"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Clock, Search, ShieldCheck, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSearch } from "@/components/search/search-provider";
import { useFavorites } from "@/lib/history/favorites";
import { useRecentTools } from "@/lib/history/recent";
import { pickTools, useToolIndex } from "@/lib/tools/use-tool-index";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { MobileNav } from "./mobile-nav";
import { ThemeToggle } from "./theme-toggle";
import { CategoryVisual, ToolVisual } from "@/components/tool/tool-visual";

export interface NavTool {
  slug: string;
  name: string;
  tagline: string;
  iconName: string;
  category: string;
}

export interface NavCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export interface SiteHeaderProps {
  categories: NavCategory[];
  popular: NavTool[];
  aiTools: NavTool[];
}

export function SiteHeader({ categories, popular, aiTools }: SiteHeaderProps) {
  const { open } = useSearch();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="page-container flex h-14 items-center gap-2 md:h-16 md:gap-4">
        <Logo />

        <NavigationMenu viewport={false} className="ml-2 hidden lg:flex" aria-label="Main">
          <NavigationMenuList className="gap-1">
            <NavigationMenuItem>
              <NavigationMenuTrigger className="bg-transparent">Tools</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="grid w-[640px] grid-cols-[1fr_200px] gap-2 p-2">
                  <div>
                    <p className="type-overline px-2 pt-1 pb-2 text-muted-foreground">Popular</p>
                    <ul className="grid grid-cols-2 gap-0.5">
                      {popular.map((t) => (
                        <li key={t.slug}>
                          <NavigationMenuLink asChild>
                            <Link href={`/tools/${t.slug}`} className="flex-row items-start gap-2.5 rounded-md p-2">
                              <ToolVisual slug={t.slug} iconName={t.iconName} category={t.category} size="xs" />
                              <span className="min-w-0">
                                <span className="block text-sm font-medium">{t.name}</span>
                                <span className="line-clamp-1 text-xs text-muted-foreground">{t.tagline}</span>
                              </span>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex flex-col justify-between rounded-lg bg-muted/60 p-3">
                    <div className="space-y-1.5">
                      <p className="type-h4">Every tool, one place</p>
                      <p className="text-xs text-muted-foreground">
                        Browse the full directory, or press <Kbd>/</Kbd> anywhere to search.
                      </p>
                    </div>
                    <NavigationMenuLink asChild>
                      <Link href="/tools" className="mt-3 flex-row items-center justify-between rounded-md bg-background px-2.5 py-2 text-sm font-medium ring-1 ring-foreground/10">
                        All tools <ArrowRight className="size-4" />
                      </Link>
                    </NavigationMenuLink>
                  </div>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger className="bg-transparent">Categories</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[680px] grid-cols-3 gap-0.5 p-2">
                  {categories.map((c) => (
                    <li key={c.id}>
                      <NavigationMenuLink asChild>
                        <Link href={`/categories/${c.id}`} className="h-full flex-row items-start gap-2.5 rounded-md p-2.5">
                          <CategoryVisual category={c.id} iconName={c.icon} size="xs" />
                          <span className="min-w-0">
                            <span className="block text-sm font-medium">{c.name}</span>
                            <span className="line-clamp-2 text-xs text-muted-foreground">{c.description}</span>
                          </span>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger className="bg-transparent">AI</NavigationMenuTrigger>
              <NavigationMenuContent>
                <div className="w-[520px] p-2">
                  <ul className="grid grid-cols-2 gap-0.5">
                    {aiTools.map((t) => (
                      <li key={t.slug}>
                        <NavigationMenuLink asChild>
                          <Link href={`/tools/${t.slug}`} className="flex-row items-start gap-2.5 rounded-md p-2">
                            <ToolVisual slug={t.slug} iconName={t.iconName} category={t.category} size="xs" />
                            <span className="min-w-0">
                              <span className="block text-sm font-medium">{t.name}</span>
                              <span className="line-clamp-1 text-xs text-muted-foreground">{t.tagline}</span>
                            </span>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 flex items-start gap-2 rounded-md bg-muted/60 p-2.5 text-xs text-muted-foreground">
                    <ShieldCheck className="mt-px size-3.5 shrink-0 text-success" aria-hidden="true" />
                    AI tools run on your device by default. A cloud model is only used when you switch to it.
                  </p>
                </div>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuLink asChild active={pathname?.startsWith("/guides")}>
                <Link href="/guides" className={cn(navigationMenuTriggerStyle(), "bg-transparent")}>
                  Guides
                </Link>
              </NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <div className="ml-auto flex items-center gap-1 md:gap-1.5">
          <Button
            variant="outline"
            onClick={() => open()}
            className="hidden h-9 w-56 justify-start gap-2 px-3 font-normal text-muted-foreground shadow-none md:flex xl:w-72"
            aria-label="Search tools"
            aria-keyshortcuts="Control+K Meta+K /"
          >
            <Search aria-hidden="true" />
            <span className="flex-1 text-left">Search tools…</span>
            <Kbd>⌘K</Kbd>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => open()}
            className="md:hidden"
            aria-label="Search tools"
          >
            <Search aria-hidden="true" />
          </Button>

          <div className="hidden items-center gap-0.5 md:flex">
            <SavedToolsMenu kind="favorites" />
            <SavedToolsMenu kind="recent" />
            <ThemeToggle />
          </div>

          <MobileNav categories={categories} popular={popular} aiTools={aiTools} />
        </div>
      </div>
    </header>
  );
}

/* ---------------------------------------------------------------------------
   Favorites / Recently used menus. The list is rendered inside the menu
   content, which Radix only mounts when open, so the tool index is fetched
   the first time someone opens one — not on every page load.
--------------------------------------------------------------------------- */
function SavedToolsMenu({ kind }: { kind: "favorites" | "recent" }) {
  const Icon = kind === "favorites" ? Star : Clock;
  const label = kind === "favorites" ? "Favorites" : "Recently used";
  return (
    // Non-modal: a small list of links should not lock the page. Radix's
    // default modal mode sets pointer-events:none and overflow:hidden on
    // <body> while open, so the whole site froze until the menu was closed.
    <DropdownMenu modal={false}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label={label}>
              <Icon aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>{label}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>{label}</DropdownMenuLabel>
        <SavedToolsList kind={kind} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SavedToolsList({ kind }: { kind: "favorites" | "recent" }) {
  const index = useToolIndex();
  const favorites = useFavorites();
  const recent = useRecentTools();
  const slugs = kind === "favorites" ? favorites : recent.map((r) => r.slug);
  const tools = pickTools(index, slugs).slice(0, 8);

  if (slugs.length === 0) {
    return (
      <p className="px-2 pt-1 pb-2 text-sm text-muted-foreground">
        {kind === "favorites"
          ? "Tap the star on any tool to keep it here."
          : "Tools you open will appear here. Stored only in this browser."}
      </p>
    );
  }

  if (!index) {
    return <p className="px-2 pb-2 text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <>
      {tools.map((t) => (
        <DropdownMenuItem key={t.slug} asChild>
          <Link href={`/tools/${t.slug}`} className="gap-2.5">
            <ToolVisual slug={t.slug} iconName={t.iconName} category={t.category} size="2xs" />
            <span className="truncate">{t.name}</span>
          </Link>
        </DropdownMenuItem>
      ))}
      {kind === "recent" && (
        <>
          <DropdownMenuSeparator />
          <p className="px-2 py-1 text-xs text-muted-foreground">Stored only in this browser.</p>
        </>
      )}
    </>
  );
}

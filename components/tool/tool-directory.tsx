"use client";

import * as React from "react";
import Link from "next/link";
import { Search, Star, X } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { Button } from "@/components/ui/button";
import { Toggle } from "@/components/ui/toggle";
import AdSlot from "@/components/AdSlot";
import { searchTools } from "@/lib/tools/search";
import { useFavorites } from "@/lib/history/favorites";
import { track } from "@/lib/analytics";
import { wallClock } from "@/lib/time/timers";
import { cn } from "@/lib/utils";
import { ToolCard } from "./tool-card";
import { ToolEmptyState } from "./tool-states";
import { CategoryVisual } from "./tool-visual";
import type { ExplorerTool } from "./tool-explorer";

const subscribeNever = () => () => {};
const readQueryParam = () => (new URLSearchParams(window.location.search).get("q") ?? "").slice(0, 100);

export interface DirectoryCategory {
  id: string;
  group: string;
  name: string;
  shortName: string;
  description: string;
  icon: string;
}

interface DirectoryProps {
  tools: ExplorerTool[];
  categories: DirectoryCategory[];
  groups: Array<{ id: string; name: string }>;
  /** One-tap searches shown under the search box. */
  suggestions: Array<{ label: string; query: string }>;
}

/**
 * Where a scrolled section counts as "current": just under the sticky header
 * (and, on small screens, the category bar). Sections are far taller than this,
 * so it only needs to be roughly right.
 */
const SPY_LINE = 144;

/**
 * The full directory. Every tool is listed under its category in the static
 * HTML (all links crawlable), with three ways in:
 *
 *   - browse: a sticky category list (chip bar on phones) that jumps to a
 *     section and follows the scroll, so 100+ tools read as a dozen short lists;
 *   - search: ranked across everything, with per-category counts to narrow;
 *   - favorites: your own starred tools.
 *
 * The category list has one job at a time. While browsing it jumps; while a
 * search or the favorites filter is active it narrows the results instead, and
 * says so ("Jump to" / "Narrow results") so the same control is never a guess.
 */
export function ToolDirectory({ tools, categories, groups, suggestions }: DirectoryProps) {
  // `/tools?q=pdf` opens the directory already searched — the target of the
  // WebSite SearchAction in lib/seo/jsonld.ts. Read after hydration (the
  // server snapshot is ""), and only until the visitor types. The page's
  // canonical stays /tools, so ?q= URLs never compete with it.
  const urlQuery = React.useSyncExternalStore(subscribeNever, readQueryParam, () => "");
  const [typed, setTyped] = React.useState<string | null>(null);
  const query = typed ?? urlQuery;
  const [scope, setScope] = React.useState("all");
  const [favoritesOnly, setFavoritesOnly] = React.useState(false);
  const [active, setActive] = React.useState(categories[0]?.id ?? "");
  const favorites = useFavorites();
  const searchRef = React.useRef<HTMLInputElement>(null);
  const chipBarRef = React.useRef<HTMLElement>(null);
  const spyLockUntil = React.useRef(0);

  const trimmed = query.trim();
  const searching = trimmed.length > 0 || favoritesOnly;

  // What the search and favorites filter match, before narrowing to one category.
  const matches = React.useMemo(() => {
    let list = trimmed ? searchTools(tools, trimmed) : tools;
    if (favoritesOnly) list = list.filter((t) => favorites.includes(t.slug));
    return list;
  }, [tools, trimmed, favoritesOnly, favorites]);

  const results = scope === "all" ? matches : matches.filter((t) => t.category === scope);

  // Counts follow the search, so the category list doubles as a facet.
  const counts = React.useMemo(() => {
    const map = new Map<string, number>();
    for (const t of searching ? matches : tools) map.set(t.category, (map.get(t.category) ?? 0) + 1);
    return map;
  }, [tools, matches, searching]);

  const updateQuery = (value: string) => {
    setTyped(value);
    // Leaving search mode also leaves the narrowing it set up, so the next
    // search does not start inside a category nobody can see.
    if (!value.trim() && !favoritesOnly) setScope("all");
  };
  const updateFavorites = (on: boolean) => {
    setFavoritesOnly(on);
    if (!on && !trimmed) setScope("all");
  };
  const clearAll = () => {
    setTyped("");
    setFavoritesOnly(false);
    setScope("all");
  };

  React.useEffect(() => {
    if (!trimmed) return;
    const id = setTimeout(
      () =>
        track("search_used", {
          query_length: trimmed.length,
          results: results.length,
          source: "directory",
        }),
      900,
    );
    return () => clearTimeout(id);
  }, [trimmed, results.length]);

  // Scroll-spy: the category whose section heading was passed last is current.
  React.useEffect(() => {
    if (searching) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      if (wallClock() < spyLockUntil.current) return;
      let current = categories[0]?.id ?? "";
      for (const c of categories) {
        const el = document.getElementById(c.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= SPY_LINE) current = c.id;
        else break;
      }
      setActive(current);
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [searching, categories]);

  // Keep the current chip in view in the phone category bar.
  React.useEffect(() => {
    const bar = chipBarRef.current;
    if (!bar || searching) return;
    const chip = bar.querySelector<HTMLElement>(`[data-cat="${active}"]`);
    if (!chip || bar.clientWidth === 0) return;
    bar.scrollTo({
      left: chip.offsetLeft - (bar.clientWidth - chip.offsetWidth) / 2,
      behavior: "smooth",
    });
  }, [active, searching]);

  const jumpTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    // The scroll handler would otherwise flick through every category on the way.
    spyLockUntil.current = wallClock() + 900;
    setActive(id);
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: calm ? "auto" : "smooth", block: "start" });
    window.history.replaceState(null, "", `#${id}`);
  };

  const onPick = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    if (searching) setScope((current) => (current === id ? "all" : id));
    else jumpTo(id);
  };

  const scopeName = categories.find((c) => c.id === scope)?.name;

  return (
    <div>
      {/* Search ------------------------------------------------------------ */}
      <div className="flex items-center gap-2 sm:gap-3">
        <InputGroup className="h-11 flex-1 sm:max-w-lg">
          <InputGroupAddon>
            <Search aria-hidden="true" />
          </InputGroupAddon>
          <InputGroupInput
            ref={searchRef}
            type="search"
            value={query}
            onChange={(e) => updateQuery(e.target.value)}
            placeholder={`Search ${tools.length} tools…`}
            aria-label="Search all tools"
            className="[&::-webkit-search-cancel-button]:hidden"
          />
          {query && (
            <InputGroupAddon align="inline-end">
              <InputGroupButton size="icon-xs" aria-label="Clear search" onClick={() => updateQuery("")}>
                <X />
              </InputGroupButton>
            </InputGroupAddon>
          )}
        </InputGroup>
        <Toggle
          variant="outline"
          pressed={favoritesOnly}
          onPressedChange={updateFavorites}
          aria-label="Show favorites only"
          className="h-11 shrink-0 px-3 sm:px-3.5"
        >
          <Star className={favoritesOnly ? "fill-amber-400 text-amber-500" : ""} aria-hidden="true" />
          <span className="hidden sm:inline">Favorites</span>
          {favorites.length > 0 && <span className="text-muted-foreground tabular-nums">{favorites.length}</span>}
        </Toggle>
      </div>

      {!searching && suggestions.length > 0 && (
        <div className="mt-3 -mb-1 flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
          <span className="shrink-0 text-sm text-muted-foreground">Try</span>
          {suggestions.map((s) => (
            <button
              key={s.query}
              type="button"
              onClick={() => {
                updateQuery(s.query);
                searchRef.current?.focus();
              }}
              className="shrink-0 rounded-full border bg-card px-3 py-1 text-sm text-foreground shadow-soft transition-colors hover:border-foreground/20 hover:bg-accent"
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* Category bar: phones and tablets. Sticky under the site header. ----- */}
      <div className="sticky top-14 z-30 -mx-4 mt-4 border-b bg-background/90 px-4 backdrop-blur sm:-mx-6 sm:px-6 md:top-16 lg:hidden">
        <nav
          ref={chipBarRef}
          aria-label="Categories"
          className="flex gap-2 overflow-x-auto py-2.5 [scrollbar-width:none] [mask-image:linear-gradient(to_right,black_calc(100%-2rem),transparent)]"
        >
          {searching && (
            <CategoryChip
              label="All results"
              count={matches.length}
              selected={scope === "all"}
              searching
              onClick={() => setScope("all")}
            />
          )}
          {categories
            .filter((c) => !searching || (counts.get(c.id) ?? 0) > 0)
            .map((c) => (
              <CategoryChip
                key={c.id}
                id={c.id}
                label={c.shortName}
                fullName={c.name}
                count={counts.get(c.id) ?? 0}
                selected={searching ? scope === c.id : active === c.id}
                searching={searching}
                onClick={onPick(c.id)}
              />
            ))}
        </nav>
      </div>

      <div className="mt-6 lg:mt-8 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-x-10">
        {/* Category list: desktop. Sticky, follows the scroll. --------------- */}
        <aside className="hidden lg:block">
          <nav
            aria-label="Categories"
            className="sticky top-24 -mr-2 max-h-[calc(100dvh-7.5rem)] space-y-5 overflow-y-auto pr-2 pb-4"
          >
            {searching && (
              <div>
                <p className="type-overline px-2.5 pb-1.5 text-muted-foreground">Narrow results</p>
                <SideEntry
                  label="All results"
                  count={matches.length}
                  selected={scope === "all"}
                  searching
                  onClick={() => setScope("all")}
                />
              </div>
            )}
            {groups.map((g) => {
              // While searching, categories with no match are left out rather
              // than shown greyed: a column of zeros is noise, not navigation.
              const visible = categories.filter((c) => c.group === g.id && (!searching || (counts.get(c.id) ?? 0) > 0));
              if (visible.length === 0) return null;
              return (
                <div key={g.id}>
                  <p className="px-2.5 pb-1.5 text-xs font-medium text-muted-foreground">{g.name}</p>
                  <ul className="space-y-0.5">
                    {visible.map((c) => (
                      <li key={c.id}>
                        <SideEntry
                          id={c.id}
                          label={c.name}
                          icon={<CategoryVisual category={c.id} iconName={c.icon} size="xs" />}
                          count={counts.get(c.id) ?? 0}
                          selected={searching ? scope === c.id : active === c.id}
                          searching={searching}
                          onClick={onPick(c.id)}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0">
          {searching ? (
            <section aria-labelledby="directory-results">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                <h2 id="directory-results" className="type-h3 text-foreground" aria-live="polite">
                  {results.length} {results.length === 1 ? "tool" : "tools"}
                  {trimmed && <span className="font-normal text-muted-foreground"> for “{trimmed}”</span>}
                  {scopeName && <span className="font-normal text-muted-foreground"> in {scopeName}</span>}
                  {favoritesOnly && !trimmed && (
                    <span className="font-normal text-muted-foreground"> in your favorites</span>
                  )}
                </h2>
                {(scope !== "all" || favoritesOnly) && (
                  <Button variant="ghost" size="sm" onClick={clearAll} className="text-muted-foreground">
                    Clear filters
                  </Button>
                )}
              </div>
              {results.length === 0 ? (
                <ToolEmptyState
                  icon={favoritesOnly && !trimmed ? <Star /> : <Search />}
                  title={favoritesOnly && !trimmed ? "No favorites here yet" : "No tools match"}
                  description={
                    favoritesOnly && !trimmed
                      ? "Tap the star on any tool to keep it one click away."
                      : "Try a shorter word, or a different category."
                  }
                >
                  <Button variant="outline" size="sm" onClick={clearAll}>
                    Show all tools
                  </Button>
                </ToolEmptyState>
              ) : (
                <ul className="grid gap-3 sm:grid-cols-2">
                  {results.map((t) => (
                    <li key={t.slug}>
                      <ToolCard tool={t} compact />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : (
            <div className="space-y-12 lg:space-y-14">
              {categories.map((c, i) => {
                const inCat = tools.filter((t) => t.category === c.id);
                if (inCat.length === 0) return null;
                return (
                  <React.Fragment key={c.id}>
                    <section id={c.id} aria-labelledby={`cat-${c.id}`} className="scroll-mt-28 lg:scroll-mt-24">
                      <div className="mb-4 flex items-start gap-3">
                        <CategoryVisual category={c.id} iconName={c.icon} size="md" className="hidden sm:flex" />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-baseline justify-between gap-3">
                            <h2 id={`cat-${c.id}`} className="type-h2 text-foreground">
                              <Link href={`/categories/${c.id}`} className="hover:underline hover:underline-offset-4">
                                {c.name}
                              </Link>
                            </h2>
                            <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
                              {inCat.length} tools
                            </span>
                          </div>
                          <p className="mt-1 type-body-sm text-muted-foreground">{c.description}</p>
                        </div>
                      </div>
                      <ul className="grid gap-3 sm:grid-cols-2">
                        {inCat.map((t) => (
                          <li key={t.slug}>
                            <ToolCard tool={t} compact />
                          </li>
                        ))}
                      </ul>
                    </section>
                    {/* One ad partway down the listing, between groups — never
                        between cards within a group, where it would read as one. */}
                    {i === 1 && <AdSlot placement="listing-middle" />}
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
   Category list entries. While browsing they are real links (`#section`), so
   they work without JavaScript and can be copied; while searching they are
   toggle buttons that narrow the results.
--------------------------------------------------------------------------- */
interface EntryProps {
  id?: string;
  label: string;
  fullName?: string;
  icon?: React.ReactNode;
  count: number;
  selected: boolean;
  searching: boolean;
  onClick: (e: React.MouseEvent) => void;
}

function SideEntry({ id, label, icon, count, selected, searching, onClick }: EntryProps) {
  const empty = searching && count === 0;
  const cls = cn(
    "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors",
    selected
      ? "bg-brand-subtle font-medium text-brand-subtle-foreground"
      : "text-muted-foreground hover:bg-accent hover:text-foreground",
    empty && "pointer-events-none opacity-40",
  );
  const inner = (
    <>
      {icon}
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span className="text-xs tabular-nums opacity-80">{count}</span>
    </>
  );
  if (searching || !id) {
    return (
      <button type="button" className={cls} onClick={onClick} aria-pressed={selected} disabled={empty}>
        {inner}
      </button>
    );
  }
  return (
    <a href={`#${id}`} className={cls} onClick={onClick} aria-current={selected ? "location" : undefined}>
      {inner}
    </a>
  );
}

function CategoryChip({ id, label, fullName, count, selected, searching, onClick }: EntryProps) {
  const empty = searching && count === 0;
  const cls = cn(
    "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-sm whitespace-nowrap transition-colors",
    selected
      ? "border-transparent bg-brand-subtle font-medium text-brand-subtle-foreground"
      : "bg-card text-muted-foreground hover:bg-accent hover:text-foreground",
    empty && "pointer-events-none opacity-40",
  );
  const inner = (
    <>
      {label}
      <span className="text-xs tabular-nums opacity-70">{count}</span>
    </>
  );
  const common = {
    "data-cat": id,
    "aria-label": fullName ? `${fullName}, ${count} tools` : undefined,
  };
  if (searching || !id) {
    return (
      <button type="button" className={cls} onClick={onClick} aria-pressed={selected} disabled={empty} {...common}>
        {inner}
      </button>
    );
  }
  return (
    <a href={`#${id}`} className={cls} onClick={onClick} aria-current={selected ? "location" : undefined} {...common}>
      {inner}
    </a>
  );
}

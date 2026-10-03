"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InstallAppButton } from "./install-app-button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useSearch } from "@/components/search/search-provider";
import { useFavorites } from "@/lib/history/favorites";
import { useRecentTools } from "@/lib/history/recent";
import { pickTools, useToolIndex } from "@/lib/tools/use-tool-index";
import { Logo } from "./logo";
import { ThemeToggle } from "./theme-toggle";
import type { NavCategory, NavTool } from "./site-header";
import { CategoryVisual } from "@/components/tool/tool-visual";

interface MobileNavProps {
  categories: NavCategory[];
  popular: NavTool[];
  aiTools: NavTool[];
}

/**
 * Mobile navigation: search first, then the user's own tools, then popular
 * tools and categories. The full desktop mega-menus are not squeezed in here;
 * search covers everything else.
 */
export function MobileNav({ categories, popular }: MobileNavProps) {
  const [open, setOpen] = React.useState(false);
  const { open: openSearch } = useSearch();
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open menu">
          <Menu aria-hidden="true" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[88vw] gap-0 p-0 sm:max-w-sm">
        <SheetHeader className="border-b px-4 py-3">
          <SheetTitle asChild>
            <div>
              <Logo onClick={close} />
            </div>
          </SheetTitle>
          <SheetDescription className="sr-only">Site navigation</SheetDescription>
        </SheetHeader>

        <nav aria-label="Mobile" className="flex-1 overflow-y-auto overscroll-contain px-3 py-3">
          <Button
            variant="outline"
            className="h-10 w-full justify-start gap-2 font-normal text-muted-foreground"
            onClick={() => {
              close();
              openSearch();
            }}
          >
            <Search aria-hidden="true" /> Search tools…
          </Button>

          {open && <YourTools onNavigate={close} />}

          <Section title="Popular">
            {popular.slice(0, 8).map((t) => (
              <NavRow key={t.slug} href={`/tools/${t.slug}`} icon={t.iconName} category={t.category} label={t.name} onNavigate={close} />
            ))}
          </Section>

          <Section title="Categories">
            {categories.map((c) => (
              <NavRow key={c.id} href={`/categories/${c.id}`} icon={c.icon} category={c.id} label={c.name} onNavigate={close} />
            ))}
          </Section>

          <Separator className="my-3" />
          <div className="grid grid-cols-2 gap-1 text-sm">
            {[
              ["/tools", "All tools"],
              ["/guides", "Guides"],
              ["/about", "About"],
              ["/contact", "Contact"],
              ["/privacy", "Privacy"],
              ["/terms", "Terms"],
            ].map(([href, label]) => (
              <Link key={href} href={href} onClick={close} className="rounded-md px-2 py-2 text-muted-foreground hover:bg-accent hover:text-foreground">
                {label}
              </Link>
            ))}
          </div>
        </nav>

        <div className="flex items-center justify-between border-t px-3 py-2">
          <InstallAppButton variant="footer" onClick={close} />
          <ThemeToggle />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5">
      <p className="type-overline px-2 pb-1.5 text-muted-foreground">{title}</p>
      <ul className="space-y-0.5">{children}</ul>
    </div>
  );
}

function NavRow({
  href,
  icon,
  category,
  label,
  onNavigate,
}: {
  href: string;
  icon: string;
  category: string;
  label: string;
  onNavigate: () => void;
}) {
  return (
    <li>
      <Link
        href={href}
        onClick={onNavigate}
        className="flex items-center gap-3 rounded-md px-2 py-2 text-sm hover:bg-accent"
      >
        <CategoryVisual category={category} iconName={icon} size="xs" />
        <span className="truncate">{label}</span>
      </Link>
    </li>
  );
}

/** Favorites and recently used, only rendered while the menu is open. */
function YourTools({ onNavigate }: { onNavigate: () => void }) {
  const favorites = useFavorites();
  const recent = useRecentTools();
  const index = useToolIndex();
  if (favorites.length === 0 && recent.length === 0) return null;
  const favTools = pickTools(index, favorites).slice(0, 5);
  const recentTools = pickTools(index, recent.map((r) => r.slug)).slice(0, 5);

  return (
    <>
      {favTools.length > 0 && (
        <Section title="Favorites">
          {favTools.map((t) => (
            <NavRow key={t.slug} href={`/tools/${t.slug}`} icon={t.iconName} category={t.category} label={t.name} onNavigate={onNavigate} />
          ))}
        </Section>
      )}
      {recentTools.length > 0 && (
        <Section title="Recently used">
          {recentTools.map((t) => (
            <NavRow key={t.slug} href={`/tools/${t.slug}`} icon={t.iconName} category={t.category} label={t.name} onNavigate={onNavigate} />
          ))}
        </Section>
      )}
    </>
  );
}

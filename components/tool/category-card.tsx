import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ToolCategory, ToolDefinition } from "@/lib/tools/registry";
import { CategoryVisual } from "./tool-visual";

/**
 * A category explains what someone can get done there ("Merge, split,
 * compress…"), not just how many tools it holds, and offers three direct
 * starting points so a visitor can skip the category page entirely.
 */
export function CategoryCard({
  category,
  toolCount,
  starters,
  headingLevel: Heading = "h3",
}: {
  category: ToolCategory;
  toolCount: number;
  starters: ToolDefinition[];
  headingLevel?: "h2" | "h3";
}) {
  return (
    <div className="group relative flex h-full flex-col rounded-xl border bg-card p-5 shadow-soft transition-colors hover:border-foreground/15">
      <div className="flex items-start gap-3">
        <CategoryVisual category={category.id} iconName={category.icon} size="md" />
        <div className="min-w-0">
          <Heading className="type-h3 text-foreground">
            <Link href={`/categories/${category.id}`} className="hover:underline hover:underline-offset-4">
              {category.name}
            </Link>
          </Heading>
          <p className="mt-1 type-body-sm text-muted-foreground">{category.description}</p>
        </div>
      </div>
      <ul className="mt-4 flex flex-wrap gap-1.5">
        {starters.map((t) => (
          <li key={t.slug}>
            <Link
              href={`/tools/${t.slug}`}
              className="inline-flex rounded-md bg-muted px-2 py-1 text-xs text-foreground transition-colors hover:bg-accent-foreground/10"
            >
              {t.shortName}
            </Link>
          </li>
        ))}
      </ul>
      <Link
        href={`/categories/${category.id}`}
        className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-medium text-link hover:underline"
        aria-label={`All ${toolCount} ${category.name} tools`}
      >
        All {toolCount} tools <ArrowRight aria-hidden="true" className="size-3.5" />
      </Link>
    </div>
  );
}

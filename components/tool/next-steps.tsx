import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ToolDefinition } from "@/lib/tools/registry";
import { ToolVisual } from "./tool-visual";

/**
 * "What would you like to do next?" — the workflow continuation shown right
 * under a tool (compress → resize → convert to WebP). Subtle by design: a row
 * of links, not a second set of cards competing with the result.
 */
export function NextSteps({ from, tools }: { from: string; tools: ToolDefinition[] }) {
  if (tools.length === 0) return null;
  return (
    <nav aria-labelledby="next-steps-heading" className="mt-4">
      <h2 id="next-steps-heading" className="type-label text-muted-foreground">
        What would you like to do next?
      </h2>
      <ul className="mt-2.5 flex flex-wrap gap-2">
        {tools.map((t) => (
          <li key={t.slug}>
            <Link
              href={`/tools/${t.slug}`}
              data-track-related="next-steps"
              data-from={from}
              data-to={t.slug}
              className="group inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-sm text-foreground shadow-soft transition-colors hover:border-foreground/20 hover:bg-accent"
            >
              <ToolVisual slug={t.slug} iconName={t.iconName} category={t.category} size="2xs" />
              {t.shortName}
              <ArrowRight
                aria-hidden="true"
                className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

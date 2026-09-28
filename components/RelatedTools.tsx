import React from "react";
import type { ToolDefinition } from "@/lib/tools/registry";
import { ToolCard } from "@/components/tool/tool-card";

interface RelatedToolsProps {
  tools: ToolDefinition[];
  /** Slug of the page the links are on, for related_tool_clicked analytics. */
  from?: string;
  title?: string;
}

export default function RelatedTools({ tools, from, title = "Related tools" }: RelatedToolsProps) {
  if (!tools || tools.length === 0) return null;

  return (
    <section aria-labelledby="related-heading" className="scroll-mt-24">
      <h2 id="related-heading" className="type-h2 text-foreground">
        {title}
      </h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {tools.map((tool) => (
          <li key={tool.slug}>
            <ToolCard
              tool={tool}
              linkProps={
                from
                  ? { "data-track-related": "related", "data-from": from, "data-to": tool.slug }
                  : undefined
              }
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

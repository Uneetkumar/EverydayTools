import * as React from "react";
import Breadcrumbs from "@/components/Breadcrumbs";
import { cn } from "@/lib/utils";

/**
 * Layout for the long-form site pages (about, contact, privacy, terms,
 * editorial policy): breadcrumb, H1, lead, an optional "last updated" line,
 * then readable prose at ~70 characters a line. Typography for the body is
 * applied here so the pages themselves stay plain semantic HTML.
 */
export function ProsePage({
  breadcrumb,
  path,
  title,
  lead,
  updated,
  children,
  className,
}: {
  breadcrumb: string;
  /** This page’s path, used as the last crumb’s URL in the breadcrumb JSON-LD. */
  path?: string;
  title: string;
  lead?: React.ReactNode;
  /** Human-readable date, e.g. "September 28, 2026". */
  updated?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="page-container py-8 md:py-12">
      <Breadcrumbs items={[{ name: breadcrumb, url: path }]} />
      <header className="mt-6 max-w-3xl">
        <h1 className="type-h1 text-foreground">{title}</h1>
        {lead && <p className="mt-4 type-body text-muted-foreground md:text-lg">{lead}</p>}
        {updated && <p className="mt-3 type-caption text-muted-foreground">Last updated: {updated}</p>}
      </header>
      <div className={cn("prose-body mt-10 max-w-3xl", className)}>{children}</div>
    </div>
  );
}

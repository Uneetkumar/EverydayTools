import React from "react";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { JsonLd } from "@/components/seo/json-ld";
import { generateBreadcrumbJsonLd } from "@/lib/seo/jsonld";

interface BreadcrumbItemData {
  name: string;
  /** Link target. On the last item (the current page) it is not rendered as
   *  a link, but it is still used as that crumb's URL in the JSON-LD. */
  url?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItemData[];
  className?: string;
  /** Emit the matching BreadcrumbList JSON-LD. On by default. */
  jsonLd?: boolean;
}

/**
 * Visible trail plus its BreadcrumbList structured data, generated from the
 * same list — so what users see and what search engines are told cannot
 * drift apart (they used to be two hand-synced copies on every page).
 * Always starts at Home.
 */
export default function Breadcrumbs({ items, className, jsonLd = true }: BreadcrumbsProps) {
  return (
    <>
      {jsonLd && (
        <JsonLd
          data={generateBreadcrumbJsonLd([
            { name: "Home", path: "/" },
            ...items.map((item) => ({ name: item.name, path: item.url })),
          ])}
        />
      )}
      <Breadcrumb className={className}>
        <BreadcrumbList className="flex-nowrap overflow-x-auto text-xs sm:text-sm [scrollbar-width:none]">
          <BreadcrumbItem className="shrink-0">
            <BreadcrumbLink asChild>
              <Link href="/">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            return (
              <React.Fragment key={`${item.name}-${index}`}>
                <BreadcrumbSeparator className="shrink-0" />
                <BreadcrumbItem className={isLast ? "min-w-0" : "shrink-0"}>
                  {item.url && !isLast ? (
                    <BreadcrumbLink asChild>
                      <Link href={item.url}>{item.name}</Link>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage className="truncate">{item.name}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    </>
  );
}

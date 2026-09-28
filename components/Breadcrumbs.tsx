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

interface BreadcrumbItemData {
  name: string;
  url?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItemData[];
  className?: string;
}

/**
 * Visible trail. Always starts at Home and mirrors the BreadcrumbList JSON-LD
 * each page emits, so what users see matches what search engines are told.
 */
export default function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  return (
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
  );
}

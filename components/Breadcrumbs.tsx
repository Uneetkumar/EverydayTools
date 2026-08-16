import React from "react";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

interface BreadcrumbItem {
  name: string;
  url?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400 py-2 overflow-x-auto"
    >
      <Link
        href="/"
        className="flex items-center hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
      >
        <Home className="w-3.5 h-3.5 mr-1" />
        <span>Home</span>
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        return (
          <React.Fragment key={index}>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {item.url && !isLast ? (
              <Link
                href={item.url}
                className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate max-w-[200px]"
              >
                {item.name}
              </Link>
            ) : (
              <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[250px]">
                {item.name}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TOOL_CATEGORIES,
  getAllTools,
  getPopularTools,
  ToolDefinition,
} from "@/lib/tools/registry";
import AdSlot from "@/components/AdSlot";
import {
  Search,
  Percent,
  TrendingUp,
  Type,
  Code,
  Clock,
  Calculator,
  ArrowRight,
  Sparkles,
  Zap,
  ShieldCheck,
  CheckCircle2,
  X,
  Star,
  Image as ImageIcon,
  FileText,
  Shield,
  Binary,
  Key,
  Hash,
  Link as LinkIcon,
  QrCode,
  Calendar,
  Receipt,
  Tag,
  Lock,
  GitCompare,
  Layers,
  Crop,
  ChevronRight,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  Percent,
  TrendingUp,
  Type,
  Code,
  Clock,
  Calculator,
  FileText,
  Shield,
  Binary,
  Key,
  Hash,
  Link: LinkIcon,
  QrCode,
  Image: ImageIcon,
  Calendar,
  Receipt,
  Tag,
  Lock,
  GitCompare,
  Sparkles,
  FileCheck: FileText,
  FilePlus: FileText,
  Crop,
};

const CATEGORY_COLORS: Record<
  string,
  { bg: string; text: string; border: string; glow: string }
> = {
  calculators: {
    bg: "bg-blue-50 dark:bg-blue-950/80",
    text: "text-blue-600 dark:text-blue-400",
    border: "group-hover:border-blue-300 dark:group-hover:border-blue-700",
    glow: "group-hover:shadow-blue-500/10",
  },
  "date-time": {
    bg: "bg-violet-50 dark:bg-violet-950/80",
    text: "text-violet-600 dark:text-violet-400",
    border: "group-hover:border-violet-300 dark:group-hover:border-violet-700",
    glow: "group-hover:shadow-violet-500/10",
  },
  text: {
    bg: "bg-emerald-50 dark:bg-emerald-950/80",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "group-hover:border-emerald-300 dark:group-hover:border-emerald-700",
    glow: "group-hover:shadow-emerald-500/10",
  },
  developer: {
    bg: "bg-indigo-50 dark:bg-indigo-950/80",
    text: "text-indigo-600 dark:text-indigo-400",
    border: "group-hover:border-indigo-300 dark:group-hover:border-indigo-700",
    glow: "group-hover:shadow-indigo-500/10",
  },
  "image-media": {
    bg: "bg-sky-50 dark:bg-sky-950/80",
    text: "text-sky-600 dark:text-sky-400",
    border: "group-hover:border-sky-300 dark:group-hover:border-sky-700",
    glow: "group-hover:shadow-sky-500/10",
  },
  "pdf-docs": {
    bg: "bg-rose-50 dark:bg-rose-950/80",
    text: "text-rose-600 dark:text-rose-400",
    border: "group-hover:border-rose-300 dark:group-hover:border-rose-700",
    glow: "group-hover:shadow-rose-500/10",
  },
  security: {
    bg: "bg-amber-50 dark:bg-amber-950/80",
    text: "text-amber-600 dark:text-amber-400",
    border: "group-hover:border-amber-300 dark:group-hover:border-amber-700",
    glow: "group-hover:shadow-amber-500/10",
  },
  business: {
    bg: "bg-emerald-50 dark:bg-emerald-950/80",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "group-hover:border-emerald-300 dark:group-hover:border-emerald-700",
    glow: "group-hover:shadow-emerald-500/10",
  },
  "ai-tools": {
    bg: "bg-purple-50 dark:bg-purple-950/80",
    text: "text-purple-600 dark:text-purple-400",
    border: "group-hover:border-purple-300 dark:group-hover:border-purple-700",
    glow: "group-hover:shadow-purple-500/10",
  },
};

export default function HomePage() {
  const router = useRouter();
  const allTools = useMemo(() => getAllTools(), []);
  const popularTools = useMemo(() => getPopularTools(), []);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  const filteredTools = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      if (selectedCategory === "all") return allTools;
      return allTools.filter((t) => t.category === selectedCategory);
    }

    return allTools.filter((tool) => {
      const matchesCategory =
        selectedCategory === "all" || tool.category === selectedCategory;
      const matchesQuery =
        tool.name.toLowerCase().includes(query) ||
        tool.shortName.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query) ||
        tool.keywords.some((k) => k.toLowerCase().includes(query)) ||
        tool.categoryName.toLowerCase().includes(query);

      return matchesCategory && matchesQuery;
    });
  }, [allTools, searchQuery, selectedCategory]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return allTools.filter(
      (tool) =>
        tool.name.toLowerCase().includes(q) ||
        tool.shortName.toLowerCase().includes(q) ||
        tool.description.toLowerCase().includes(q) ||
        tool.keywords.some((k) => k.toLowerCase().includes(q))
    ).slice(0, 7);
  }, [allTools, searchQuery]);

  useEffect(() => {
    setSelectedIndex(0);
    if (searchQuery.trim().length > 0) {
      setIsDropdownOpen(true);
    } else {
      setIsDropdownOpen(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isDropdownOpen || searchResults.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % searchResults.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev === 0 ? searchResults.length - 1 : prev - 1
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      const targetTool = searchResults[selectedIndex] || searchResults[0];
      if (targetTool) {
        setIsDropdownOpen(false);
        router.push(`/tools/${targetTool.slug}`);
      }
    } else if (e.key === "Escape") {
      setIsDropdownOpen(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {/* 1. Hero Section */}
      <section className="text-center max-w-4xl mx-auto space-y-5 pt-4">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-50/90 dark:bg-blue-950/80 border border-blue-200/80 dark:border-blue-800/80 text-blue-700 dark:text-blue-300 text-xs font-semibold shadow-xs backdrop-blur-xs">
          <Sparkles className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
          <span>22+ Everyday Utilities • 100% Client-Side Private • Zero Latency</span>
        </div>

        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
          Everyday Online Utilities & Tools
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Fast, private browser utilities for students, developers, and creators. All calculations and file conversions run locally on your device.
        </p>

        {/* Live Search Bar with Instant Autocomplete Dropdown */}
        <div className="relative max-w-2xl mx-auto pt-2 z-30" ref={searchContainerRef}>
          <div className="relative flex items-center">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (searchQuery.trim().length > 0) setIsDropdownOpen(true);
              }}
              placeholder="Search 22+ tools (e.g. crop image, compress, pdf to word, emi, json)..."
              className="w-full pl-12 pr-10 py-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-sm text-slate-900 dark:text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setIsDropdownOpen(false);
                }}
                className="absolute right-3.5 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Autocomplete Results Dropdown (Same rich UX as header modal) */}
          {isDropdownOpen && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 p-2 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-1 text-left animate-in fade-in-50 zoom-in-95 duration-150">
              <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex justify-between">
                <span>Matching Tools ({searchResults.length})</span>
                <span className="text-slate-400 font-normal">Press Enter to launch</span>
              </div>

              {searchResults.map((tool, idx) => {
                const Icon = ICON_MAP[tool.iconName] || Calculator;
                const isSelected = idx === selectedIndex;

                return (
                  <Link
                    key={tool.slug}
                    href={`/tools/${tool.slug}`}
                    onClick={() => setIsDropdownOpen(false)}
                    className={`flex items-center justify-between p-3 rounded-xl transition group ${
                      isSelected
                        ? "bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                          {tool.name}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                          {tool.description}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 shrink-0 ml-3">
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                        {tool.categoryName}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Category Filter Chips */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
          <button
            onClick={() => {
              setSelectedCategory("all");
              setSearchQuery("");
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              selectedCategory === "all" && !searchQuery
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            All Tools ({allTools.length})
          </button>
          {TOOL_CATEGORIES.map((cat) => {
            const count = allTools.filter((t) => t.category === cat.id).length;
            const isCatActive = selectedCategory === cat.id && !searchQuery;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setSearchQuery("");
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  isCatActive
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Main Popular Tools Section (Above the Fold) */}
      {selectedCategory === "all" && !searchQuery && (
        <section id="popular" className="scroll-mt-24 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-lg bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Most Popular Tools
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-medium">Top High-Use Utilities</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {popularTools.map((tool) => {
              const Icon = ICON_MAP[tool.iconName] || Calculator;
              const colorInfo = CATEGORY_COLORS[tool.category] || CATEGORY_COLORS.calculators;

              return (
                <Link
                  key={tool.slug}
                  href={`/tools/${tool.slug}`}
                  className={`p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xs hover:bg-white dark:hover:bg-slate-900 ${colorInfo.border} tool-card-glow transition-all flex flex-col justify-between group relative overflow-hidden`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className={`w-8 h-8 rounded-xl ${colorInfo.bg} ${colorInfo.text} flex items-center justify-center group-hover:scale-110 transition`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        Free
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition line-clamp-1">
                        {tool.shortName}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-tight mt-0.5">
                        {tool.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center text-[11px] font-semibold text-blue-600 dark:text-blue-400 mt-3 group-hover:translate-x-0.5 transition">
                    <span>Launch</span>
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* 3. Category Sections or Filtered Grid */}
      {filteredTools.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 space-y-3">
          <p className="text-base font-semibold text-slate-800 dark:text-slate-200">
            No tools found matching &quot;{searchQuery}&quot;
          </p>
          <button
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("all");
              setIsDropdownOpen(false);
            }}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition"
          >
            Reset Search
          </button>
        </div>
      ) : selectedCategory === "all" && !searchQuery ? (
        /* Full Category Breakdown */
        <div className="space-y-12">
          {TOOL_CATEGORIES.map((cat) => {
            const categoryTools = allTools.filter((t) => t.category === cat.id);
            if (categoryTools.length === 0) return null;

            const CatIcon = ICON_MAP[cat.icon] || Calculator;
            const colorInfo = CATEGORY_COLORS[cat.id] || CATEGORY_COLORS.calculators;

            return (
              <section
                key={cat.id}
                id={cat.id}
                className="scroll-mt-24 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 backdrop-blur-xs p-6 sm:p-8 shadow-xs space-y-6"
              >
                {/* Category Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-2">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-xl ${colorInfo.bg} ${colorInfo.text} flex items-center justify-center`}>
                      <CatIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        {cat.name}
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {cat.description}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 w-fit">
                    {categoryTools.length} {categoryTools.length === 1 ? "tool" : "tools"}
                  </span>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryTools.map((tool) => {
                    const Icon = ICON_MAP[tool.iconName] || Calculator;
                    return (
                      <Link
                        key={tool.slug}
                        href={`/tools/${tool.slug}`}
                        className={`group p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 hover:bg-white dark:hover:bg-slate-900 ${colorInfo.border} tool-card-glow transition flex flex-col justify-between`}
                      >
                        <div className="space-y-2.5">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-lg ${colorInfo.bg} ${colorInfo.text} flex items-center justify-center shrink-0 group-hover:scale-105 transition`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                              {tool.name}
                            </h3>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                            {tool.description}
                          </p>
                        </div>

                        <div className="flex items-center text-xs font-semibold text-blue-600 dark:text-blue-400 mt-4 group-hover:translate-x-1 transition">
                          <span>Open tool</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      ) : (
        /* Filtered Grid */
        <div className="space-y-4">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Showing {filteredTools.length} tools
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTools.map((tool) => {
              const Icon = ICON_MAP[tool.iconName] || Calculator;
              const colorInfo = CATEGORY_COLORS[tool.category] || CATEGORY_COLORS.calculators;

              return (
                <Link
                  key={tool.slug}
                  href={`/tools/${tool.slug}`}
                  className={`group p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 ${colorInfo.border} tool-card-glow transition flex flex-col justify-between`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className={`w-8 h-8 rounded-lg ${colorInfo.bg} ${colorInfo.text} flex items-center justify-center`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-400">
                        {tool.categoryName}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                      {tool.name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2">
                      {tool.description}
                    </p>
                  </div>

                  <div className="flex items-center text-xs font-semibold text-blue-600 dark:text-blue-400 mt-4 group-hover:translate-x-1 transition">
                    <span>Open tool</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

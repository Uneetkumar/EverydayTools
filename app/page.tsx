"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  TOOL_CATEGORIES,
  getAllTools,
  ToolDefinition,
} from "@/lib/tools/registry";
import { searchTools } from "@/lib/tools/search";
import RecentTools from "@/components/RecentTools";
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
  Crop,
  ChevronRight,
  LayoutGrid,
  Flame,
  Film,
  Briefcase,
  Smartphone,
  CornerDownRight,
  Scale,
  FileSpreadsheet,
  Palette,
  DollarSign,
  Eye,
  Monitor,
  Camera,
  Table,
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
  Film,
  Briefcase,
  Smartphone,
  Scale,
  FileSpreadsheet,
  Palette,
  DollarSign,
  Eye,
  Monitor,
  Camera,
  Table,
};

const CATEGORY_COLORS: Record<
  string,
  { bg: string; text: string; border: string; glow: string; iconBg: string }
> = {
  all: {
    bg: "bg-blue-50 dark:bg-blue-950/80",
    text: "text-blue-600 dark:text-blue-400",
    border: "group-hover:border-blue-300 dark:group-hover:border-blue-700",
    glow: "group-hover:shadow-blue-500/10",
    iconBg: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20",
  },
  calculators: {
    bg: "bg-blue-50 dark:bg-blue-950/80",
    text: "text-blue-600 dark:text-blue-400",
    border: "group-hover:border-blue-300 dark:group-hover:border-blue-700",
    glow: "group-hover:shadow-blue-500/10",
    iconBg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
  },
  "date-time": {
    bg: "bg-violet-50 dark:bg-violet-950/80",
    text: "text-violet-600 dark:text-violet-400",
    border: "group-hover:border-violet-300 dark:group-hover:border-violet-700",
    glow: "group-hover:shadow-violet-500/10",
    iconBg: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20",
  },
  text: {
    bg: "bg-emerald-50 dark:bg-emerald-950/80",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "group-hover:border-emerald-300 dark:group-hover:border-emerald-700",
    glow: "group-hover:shadow-emerald-500/10",
    iconBg: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20",
  },
  developer: {
    bg: "bg-indigo-50 dark:bg-indigo-950/80",
    text: "text-indigo-600 dark:text-indigo-400",
    border: "group-hover:border-indigo-300 dark:group-hover:border-indigo-700",
    glow: "group-hover:shadow-indigo-500/10",
    iconBg: "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20",
  },
  "image-media": {
    bg: "bg-sky-50 dark:bg-sky-950/80",
    text: "text-sky-600 dark:text-sky-400",
    border: "group-hover:border-sky-300 dark:group-hover:border-sky-700",
    glow: "group-hover:shadow-sky-500/10",
    iconBg: "bg-pink-500/15 text-pink-600 dark:text-pink-400 border border-pink-500/20",
  },
  "pdf-docs": {
    bg: "bg-rose-50 dark:bg-rose-950/80",
    text: "text-rose-600 dark:text-rose-400",
    border: "group-hover:border-rose-300 dark:group-hover:border-rose-700",
    glow: "group-hover:shadow-rose-500/10",
    iconBg: "bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/20",
  },
  security: {
    bg: "bg-amber-50 dark:bg-amber-950/80",
    text: "text-amber-600 dark:text-amber-400",
    border: "group-hover:border-amber-300 dark:group-hover:border-amber-700",
    glow: "group-hover:shadow-amber-500/10",
    iconBg: "bg-teal-500/15 text-teal-600 dark:text-teal-400 border border-teal-500/20",
  },
  business: {
    bg: "bg-emerald-50 dark:bg-emerald-950/80",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "group-hover:border-emerald-300 dark:group-hover:border-emerald-700",
    glow: "group-hover:shadow-emerald-500/10",
    iconBg: "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20",
  },
  "ai-tools": {
    bg: "bg-purple-50 dark:bg-purple-950/80",
    text: "text-purple-600 dark:text-purple-400",
    border: "group-hover:border-purple-300 dark:group-hover:border-purple-700",
    glow: "group-hover:shadow-purple-500/10",
    iconBg: "bg-violet-500/15 text-violet-600 dark:text-violet-400 border border-violet-500/20",
  },
};

const CATEGORY_CARDS_META: Array<{
  id: string;
  name: string;
  subtext: string;
  icon: React.ElementType;
}> = [
  {
    id: "all",
    name: "All Tools",
    subtext: "View all utilities",
    icon: LayoutGrid,
  },
  {
    id: "calculators",
    name: "Calculators & Finance",
    subtext: "EMI, GST, Percentage & more",
    icon: Calculator,
  },
  {
    id: "date-time",
    name: "Date & Time",
    subtext: "Age, Date Difference",
    icon: Calendar,
  },
  {
    id: "text",
    name: "Text & Writing",
    subtext: "Word Counter, Case & more",
    icon: Type,
  },
  {
    id: "developer",
    name: "Developer & Data",
    subtext: "JSON, Base64, UUID & more",
    icon: Code,
  },
  {
    id: "image-media",
    name: "Image & Media",
    subtext: "Compress, Convert, Crop & more",
    icon: ImageIcon,
  },
  {
    id: "pdf-docs",
    name: "PDF & Documents",
    subtext: "Edit, Convert, Merge & more",
    icon: FileText,
  },
  {
    id: "security",
    name: "Security & Generators",
    subtext: "Password, Hash, QR & more",
    icon: Lock,
  },
  {
    id: "business",
    name: "Business & Marketing",
    subtext: "Invoice, ROI & more",
    icon: Briefcase,
  },
  {
    id: "ai-tools",
    name: "AI-Powered Tools",
    subtext: "Smart utilities & helpers",
    icon: Sparkles,
  },
];

const POPULAR_TOOLS_SHOWCASE = [
  {
    name: "PDF Editor",
    slug: "pdf-editor",
    description: "Edit text, images & more in PDF",
    icon: FileText,
    color: "bg-rose-500/15 text-rose-500 border-rose-500/20",
  },
  {
    name: "Image Compressor",
    slug: "image-compressor",
    description: "Compress JPG, PNG, WebP images",
    icon: ImageIcon,
    color: "bg-emerald-500/15 text-emerald-500 border-emerald-500/20",
  },
  {
    name: "Percentage Calculator",
    slug: "percentage-calculator",
    description: "Calculate percentage, increase, decrease",
    icon: Percent,
    color: "bg-purple-500/15 text-purple-500 border-purple-500/20",
  },
  {
    name: "Sample Video Generator",
    slug: "sample-video-generator",
    description: "Generate sample videos instantly",
    icon: Film,
    color: "bg-blue-500/15 text-blue-500 border-blue-500/20",
  },
  {
    name: "Crop Image",
    slug: "crop-image",
    description: "Crop images to any size or ratio",
    icon: Crop,
    color: "bg-amber-500/15 text-amber-500 border-amber-500/20",
  },
  {
    name: "Word Counter",
    slug: "word-counter",
    description: "Count words, characters & reading time",
    icon: Type,
    color: "bg-indigo-500/15 text-indigo-500 border-indigo-500/20",
  },
];

const ALL_TOOLS = getAllTools();
const CATEGORY_MAP_STATIC = TOOL_CATEGORIES.reduce((acc, cat) => {
  acc[cat.id] = ALL_TOOLS.filter((t) => t.category === cat.id);
  return acc;
}, {} as Record<string, ToolDefinition[]>);

export default function HomePage() {
  // Driven off the registry so adding an AI tool surfaces it here with no
  // second place to remember to update.
  const aiTools = getAllTools().filter((t) => t.category === "ai-tools");
  const router = useRouter();
  const allTools = ALL_TOOLS;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const searchContainerRef = useRef<HTMLDivElement>(null);

  const filteredTools = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      if (selectedCategory === "all") return ALL_TOOLS;
      return CATEGORY_MAP_STATIC[selectedCategory] || [];
    }

    const matches = searchTools(ALL_TOOLS, query);
    return selectedCategory === "all"
      ? matches
      : matches.filter((t) => t.category === selectedCategory);
  }, [searchQuery, selectedCategory]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchTools(ALL_TOOLS, searchQuery, 7);
  }, [searchQuery]);

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
        setSearchQuery("");
        router.push(`/tools/${targetTool.slug}`);
      }
    } else if (e.key === "Escape") {
      setIsDropdownOpen(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchResults.length > 0) {
      const targetTool = searchResults[selectedIndex] || searchResults[0];
      if (targetTool) {
        setIsDropdownOpen(false);
        setSearchQuery("");
        router.push(`/tools/${targetTool.slug}`);
      }
    } else {
      setIsDropdownOpen(false);
    }
  };

  const handleCategoryClick = (catId: string) => {
    setSearchQuery("");
    if (selectedCategory === catId) {
      setSelectedCategory("all");
    } else {
      setSelectedCategory(catId);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">
      {/* 1. Hero Section */}
      <section className="text-center max-w-4xl mx-auto space-y-4 pt-1">
        {/* Sparkle Badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full bg-blue-50/90 dark:bg-blue-950/80 border border-blue-200/80 dark:border-blue-800/80 text-blue-700 dark:text-blue-300 text-xs font-semibold shadow-xs backdrop-blur-xs">
          <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>{allTools.length}+ Free Tools • 100% Client-Side Private • Zero Latency</span>
        </div>

        {/* Title */}
        <h1 className="text-3xl sm:text-5xl lg:text-5.5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
          Free Online Tools &amp;{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500 dark:from-blue-400 dark:to-indigo-400">
            Calculators
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Fast, private browser utilities for students, developers, and creators. All calculations and file conversions run locally on your device.
        </p>

        {/* Search Bar with Search Button */}
        <div className="relative max-w-2xl mx-auto pt-1 z-30" ref={searchContainerRef}>
          <form onSubmit={handleSearchSubmit} className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => {
                if (searchQuery.trim().length > 0) setIsDropdownOpen(true);
              }}
              placeholder={`Search ${allTools.length} tools (e.g. crop image, compress, pdf to word, emi, json)...`}
              className="w-full pl-11 pr-28 py-3 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md text-xs sm:text-sm text-slate-900 dark:text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setIsDropdownOpen(false);
                }}
                className="absolute right-24 p-1 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold shadow-xs transition"
            >
              Search
            </button>
          </form>

          {/* Autocomplete Dropdown */}
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
                    onClick={() => {
                      setIsDropdownOpen(false);
                      setSearchQuery("");
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-xl transition group ${
                      isSelected
                        ? "bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800"
                        : "hover:bg-slate-50 dark:hover:bg-slate-800/80 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
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

        {/* "Or browse by category" label */}
        <div className="flex items-center justify-center space-x-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium pt-1">
          <span>Or browse by category</span>
          <CornerDownRight className="w-3.5 h-3.5 text-blue-500" />
        </div>
      </section>

      {/* 2. Sleek 10-Card Category Grid (2 rows of 5 on desktop) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
        {CATEGORY_CARDS_META.map((cat) => {
          const count =
            cat.id === "all"
              ? allTools.length
              : allTools.filter((t) => t.category === cat.id).length;
          const CatIcon = cat.icon;
          const color = CATEGORY_COLORS[cat.id] || CATEGORY_COLORS.all;
          const isSelected = selectedCategory === cat.id && !searchQuery;

          return (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className={`p-3 rounded-2xl border transition-all duration-200 flex items-center space-x-3 text-left group backdrop-blur-xs ${
                isSelected
                  ? "bg-blue-50/80 dark:bg-blue-950/50 border-blue-500 ring-1 ring-blue-500 shadow-sm"
                  : "bg-white/70 dark:bg-slate-900/70 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-white dark:hover:bg-slate-850"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${color.iconBg}`}
              >
                <CatIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-blue-500 transition">
                    {cat.name}
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                    {count}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {cat.subtext}
                </p>
              </div>
            </button>
          );
        })}
      </section>

      {/* 3. Popular Tools Showcase (Directly below Category Grid) */}
      {!searchQuery && selectedCategory === "all" && (
        <section className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/50 backdrop-blur-xs p-4 sm:p-5 space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Flame className="w-4 h-4 text-orange-500 fill-orange-500" />
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Popular Tools
              </h2>
            </div>
            <button
              onClick={() => {
                const el = document.getElementById("all-categories");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1 group"
            >
              <span>View all tools</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3">
            {POPULAR_TOOLS_SHOWCASE.map((tool) => {
              const ToolIcon = tool.icon;
              return (
                <Link
                  key={tool.slug}
                  href={`/tools/${tool.slug}`}
                  className="p-3 sm:p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 hover:bg-white dark:hover:bg-slate-850 hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between group h-full"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-105 ${tool.color}`}
                      >
                        <ToolIcon className="w-4 h-4" />
                      </div>
                    </div>

                    <div>
                      <h3 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-500 transition line-clamp-1">
                        {tool.name}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-tight mt-0.5">
                        {tool.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2 text-slate-400 group-hover:text-blue-500 transition">
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* 4. Trust Badges & Feature Highlights */}
      {!searchQuery && selectedCategory === "all" && (
        <section className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white/40 dark:bg-slate-900/30 backdrop-blur-xs p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-start space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4.5 h-4.5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">100% Private</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                Everything runs in your browser. Your data never leaves your device.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Zap className="w-4.5 h-4.5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Zero Latency</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                Instant results. No uploads, no waiting, no server delays.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20 flex items-center justify-center shrink-0">
              <Lock className="w-4.5 h-4.5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Secure &amp; Trusted</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                Safe, reliable and ad-light experience for everyone.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center shrink-0">
              <Smartphone className="w-4.5 h-4.5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">Works Offline</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                Most tools work without internet connection.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* 5. Recently Used Tools */}
      {selectedCategory === "all" && !searchQuery && (
        <RecentTools variant="compact" />
      )}

      {/* 6. Filtered View / Full Category Breakdown (Restored to Exact Previous Card View) */}
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
      ) : selectedCategory !== "all" || searchQuery ? (
        /* Filtered Grid View */
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/80 dark:border-slate-800">
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {searchQuery
                ? `Showing ${filteredTools.length} matching tools for "${searchQuery}"`
                : `Showing ${filteredTools.length} tools in ${CATEGORY_CARDS_META.find((c) => c.id === selectedCategory)?.name || "Category"}`}
            </div>
            <button
              onClick={() => {
                setSelectedCategory("all");
                setSearchQuery("");
              }}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Show all tools
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTools.map((tool) => {
              const Icon = ICON_MAP[tool.iconName] || Calculator;
              const colorInfo = CATEGORY_COLORS[tool.category] || CATEGORY_COLORS.calculators;

              return (
                <Link
                  key={tool.slug}
                  href={`/tools/${tool.slug}`}
                  title={`Open ${tool.name} free online tool`}
                  aria-label={`Open ${tool.name}`}
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
                    <span>Open {tool.shortName}</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      ) : (
        /* Full Category Breakdown with Original Card Layout */
        <div id="all-categories" className="space-y-12">
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
                  <Link
                    href={`/categories/${cat.id}`}
                    title={`Explore all ${cat.name} tools`}
                    aria-label={`Explore all ${cat.name} tools`}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 flex items-center space-x-1"
                  >
                    <span>View all {categoryTools.length} tools</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                {/* Tools Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryTools.map((tool) => {
                    const ToolIcon = ICON_MAP[tool.iconName] || Calculator;

                    return (
                      <Link
                        key={tool.slug}
                        href={`/tools/${tool.slug}`}
                        title={`Open ${tool.name} free online tool`}
                        aria-label={`Open ${tool.name}`}
                        className="group p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/90 dark:bg-slate-950/40 hover:bg-white dark:hover:bg-slate-900 tool-card-glow transition flex flex-col justify-between"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <div className={`w-8 h-8 rounded-lg ${colorInfo.bg} ${colorInfo.text} flex items-center justify-center group-hover:scale-105 transition`}>
                              <ToolIcon className="w-4 h-4" />
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
                          <span>Explore {tool.shortName}</span>
                          <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </section>
            );
          })}

          {/* AI tools get their own band rather than being buried in the
              category grid. They are the newest capability here and the one
              users are least likely to guess exists, so discoverability
              matters more than alphabetical tidiness. The privacy line is not
              marketing: on-device is the default and the distinction is the
              reason to trust the section at all. */}
          {aiTools.length > 0 && (
            <section className="rounded-3xl border border-blue-200/70 dark:border-blue-900/50 bg-gradient-to-br from-blue-50/80 to-indigo-50/60 dark:from-blue-950/30 dark:to-indigo-950/20 p-6 sm:p-8 space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-2xl space-y-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-600 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">
                    <Sparkles className="h-3 w-3" /> New
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                    AI tools that keep your files private
                  </h2>
                  <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                    Most AI tools upload whatever you give them. Ours run the model
                    on your own device by default, so a scanned ID or a bank
                    statement never leaves your browser. Where a cloud model is
                    genuinely better &mdash; handwriting, tables, other scripts &mdash;
                    it is an explicit choice, clearly labelled, never the default.
                  </p>
                </div>
                <Link
                  href="/categories/ai-tools"
                  className="shrink-0 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Browse AI tools
                </Link>
              </div>

              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {aiTools.map((tool) => (
                  <li key={tool.slug}>
                    <Link
                      href={`/tools/${tool.slug}`}
                      className="group flex h-full flex-col rounded-2xl border border-white/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/70 p-4 transition hover:border-blue-300 hover:shadow-md dark:hover:border-blue-700"
                    >
                      <span className="flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-950/70 dark:text-blue-400">
                          <Sparkles className="h-4 w-4" />
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          {tool.name}
                        </h3>
                      </span>
                      <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                        {tool.description}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Comprehensive SEO Long-Form Article & Feature Guide */}
          <section className="rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/60 p-8 sm:p-10 space-y-8">
            <div className="max-w-3xl space-y-3">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Why Choose TabBench? 100% Free, Private &amp; Instant
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                TabBench is an open, high-performance web utility suite engineered for students, software engineers, accountants, designers, and creators worldwide. Unlike traditional online conversion platforms that upload your sensitive documents, passwords, or images to third-party cloud servers, our architecture computes 100% of calculations and file operations directly inside your browser memory.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Zero Server Uploads</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Your PDF files, photos, JSON payloads, and passwords never leave your device. All processing happens in local browser memory via HTML5 Canvas, WebAssembly, and WebCrypto.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/80 text-blue-600 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Zero-Latency Speed</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  No queue times, no server bottlenecks, and no waiting for uploads. Everything computes in real time at the native speed of your device hardware.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200/60 dark:border-slate-800 space-y-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950/80 text-amber-600 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">100% Free Forever</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  No paywalls, no monthly subscription fees, and no required registration. Enjoy unlimited access to all {allTools.length}+ online calculators, formatters, and converters.
                </p>
              </div>
            </div>

            {/* Homepage FAQs */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Frequently Asked Questions
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800 space-y-1.5">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Are the tools really completely free to use?
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Yes. All {allTools.length}+ utilities on TabBench are 100% free with unlimited usage for personal, commercial, and educational purposes. No credit card or account is ever required.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/60 dark:border-slate-800 space-y-1.5">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Do you store or look at my uploaded images or files?
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    No. Our platform uses client-side JavaScript execution. Files you drop into the cropper, compressor, or PDF tools are processed locally inside your web browser and are destroyed when you close the tab.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

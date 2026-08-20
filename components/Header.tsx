"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { TOOL_CATEGORIES, getAllTools } from "@/lib/tools/registry";
import {
  Search,
  Sun,
  Moon,
  Menu,
  X,
  Calculator,
  ChevronDown,
  Sparkles,
  TrendingUp,
  Type,
  Code,
  Clock,
  Image as ImageIcon,
  FileText,
  Shield,
  Star,
  Download,
} from "lucide-react";
import QuickSearchModal from "./QuickSearchModal";

const ICON_MAP: Record<string, React.ElementType> = {
  calculators: Calculator,
  "date-time": Clock,
  text: Type,
  developer: Code,
  "image-media": ImageIcon,
  "pdf-docs": FileText,
  security: Shield,
  business: TrendingUp,
  "ai-tools": Sparkles,
};

const TOP_POPULAR_TOOLS = [
  { name: "Compress Image", slug: "image-compressor" },
  { name: "PDF to Word", slug: "pdf-to-word" },
  { name: "Percentage", slug: "percentage-calculator" },
  { name: "QR Generator", slug: "qr-code-generator" },
];

export default function Header() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Global search shortcut. Lives here because this component owns the state;
  // "/" is included since it is the convention most sites use.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      const typing =
        !!el &&
        (el.tagName === "INPUT" ||
          el.tagName === "TEXTAREA" ||
          el.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen((open) => !open);
      } else if (e.key === "/" && !typing) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCategoriesDropdownOpen, setIsCategoriesDropdownOpen] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const allTools = getAllTools();

  useEffect(() => {
    setMounted(true);
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsCategoriesDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const toggleTheme = () => {
    const nextTheme = (resolvedTheme === "dark" || theme === "dark") ? "light" : "dark";
    setTheme(nextTheme);
  };

  const isDarkMode = mounted && (resolvedTheme === "dark" || theme === "dark");

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo & Main Nav */}
          <div className="flex items-center space-x-6">
            <Link href="/" className="flex items-center space-x-2.5 group shrink-0">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition">
                <Calculator className="w-4 h-4" />
              </div>
              <span className="font-bold text-lg tracking-tight text-slate-900 dark:text-white">
                Tab<span className="text-blue-600 dark:text-blue-400">Bench</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              {/* Categories Mega Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsCategoriesDropdownOpen(!isCategoriesDropdownOpen)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl transition ${
                    isCategoriesDropdownOpen
                      ? "bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400"
                      : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  <span>Categories</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 transition-transform duration-200 ${
                      isCategoriesDropdownOpen ? "rotate-180 text-blue-600" : "text-slate-400"
                    }`}
                  />
                </button>

                {/* Dropdown Menu */}
                {isCategoriesDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-[480px] p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl grid grid-cols-2 gap-1.5 animate-in fade-in-50 zoom-in-95 duration-150 z-50">
                    {TOOL_CATEGORIES.map((cat) => {
                      const Icon = ICON_MAP[cat.id] || Calculator;
                      const count = allTools.filter((t) => t.category === cat.id).length;

                      return (
                        <Link
                          key={cat.id}
                          href={`/categories/${cat.id}`}
                          onClick={() => setIsCategoriesDropdownOpen(false)}
                          className="flex items-center space-x-3 p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                              {cat.name}
                            </div>
                            <div className="text-[11px] text-slate-400">
                              {count} {count === 1 ? "tool" : "tools"}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-1.5" />

              {/* Handpicked Most Popular Items */}
              {TOP_POPULAR_TOOLS.map((tool) => (
                <Link
                  key={tool.slug}
                  href={`/tools/${tool.slug}`}
                  className="px-2.5 py-1.5 text-xs font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition truncate"
                >
                  {tool.name}
                </Link>
              ))}

              <Link
                href="/tools"
                className="flex items-center space-x-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition"
              >
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                <span>More</span>
              </Link>
            </nav>
          </div>

          {/* Right Controls: Search, Theme Toggle, Mobile Menu */}
          <div className="flex items-center space-x-2.5 shrink-0">
            <button
              onClick={() => setIsSearchOpen(true)}
              className="flex items-center space-x-2 px-3.5 py-1.5 text-xs rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
              title="Search tools (Cmd+K)"
              aria-label="Search tools"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Search tools...</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-400">
                ⌘K
              </kbd>
            </button>

            <button
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("tabbench-trigger-install"));
                }
              }}
              className="hidden sm:flex items-center space-x-1 px-2.5 py-1.5 text-xs font-semibold rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/60 transition shadow-xs cursor-pointer"
              title="Install TabBench as an app on your device"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Install App</span>
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              aria-label="Toggle dark/light theme"
              title="Toggle color theme"
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-600" />
              )}
            </button>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsMobileMenuOpen(true);
              }}
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              aria-label="Open navigation menu"
              title="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Root-Level Mobile Side Drawer & Backdrop (Outside Sticky Header) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[9999] lg:hidden flex justify-end">
          {/* Backdrop Blur Overlay */}
          <div
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
          />

          {/* Slide-In Drawer Panel */}
          <aside
            className="relative w-[320px] max-w-[85vw] h-full bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl z-10 flex flex-col justify-between overflow-y-auto overscroll-contain animate-in slide-in-from-right duration-250 ml-auto"
          >
            <div className="p-5 space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <Link
                  href="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center space-x-2"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
                    Tab<span className="text-blue-600 dark:text-blue-400">Bench</span>
                  </span>
                </Link>

                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    title="Toggle theme"
                  >
                    {isDarkMode ? (
                      <Sun className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Moon className="w-4 h-4 text-slate-600" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                    title="Close menu"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Quick Search Action */}
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsSearchOpen(true);
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium transition shadow-xs cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <Search className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span>Search all 40+ tools...</span>
                </div>
                <kbd className="px-1.5 py-0.5 text-[10px] font-mono rounded bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-400">
                  ⌘K
                </kbd>
              </button>

              {/* Mobile Install App Action */}
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(new CustomEvent("tabbench-trigger-install"));
                  }
                }}
                className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md hover:shadow-blue-500/20 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Install TabBench App</span>
              </button>

              {/* Top Popular Tools */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                  Popular Tools
                </div>
                <div className="grid grid-cols-1 gap-1">
                  {TOP_POPULAR_TOOLS.map((tool) => (
                    <Link
                      key={tool.slug}
                      href={`/tools/${tool.slug}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between px-3 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-blue-950/40 hover:text-blue-600 dark:hover:text-blue-400 transition"
                    >
                      <span>{tool.name}</span>
                      <span className="text-[10px] text-blue-600 dark:text-blue-400">&rarr;</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Categories
                  </span>
                  <Link
                    href="/tools"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    All Tools
                  </Link>
                </div>
                <div className="grid grid-cols-1 gap-1">
                  {TOOL_CATEGORIES.map((cat) => {
                    const Icon = ICON_MAP[cat.id] || Calculator;
                    const count = allTools.filter((t) => t.category === cat.id).length;

                    return (
                      <Link
                        key={cat.id}
                        href={`/categories/${cat.id}`}
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center justify-between px-3 py-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800/80 transition group"
                      >
                        <div className="flex items-center space-x-2.5 min-w-0">
                          <div className="w-6 h-6 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs font-medium text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 truncate">
                            {cat.name}
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-slate-400">
                          {count}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Drawer Footer Links */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-2">
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
                <Link href="/about" onClick={() => setIsMobileMenuOpen(false)} className="hover:underline">
                  About
                </Link>
                <Link href="/guides" onClick={() => setIsMobileMenuOpen(false)} className="hover:underline">
                  Guides
                </Link>
                <Link href="/editorial-policy" onClick={() => setIsMobileMenuOpen(false)} className="hover:underline">
                  Editorial
                </Link>
                <Link href="/privacy" onClick={() => setIsMobileMenuOpen(false)} className="hover:underline">
                  Privacy
                </Link>
                <Link href="/terms" onClick={() => setIsMobileMenuOpen(false)} className="hover:underline">
                  Terms
                </Link>
                <Link href="/contact" onClick={() => setIsMobileMenuOpen(false)} className="hover:underline">
                  Contact
                </Link>
              </div>
              <div className="text-[10px] text-slate-400">
                TabBench &bull; 100% Client-Side Private
              </div>
            </div>
          </aside>
        </div>
      )}

      <QuickSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </>
  );
}

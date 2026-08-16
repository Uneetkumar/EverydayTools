import React from "react";
import Link from "next/link";
import { TOOL_CATEGORIES, getAllTools } from "@/lib/tools/registry";
import { ShieldCheck, Heart, Wrench } from "lucide-react";

export default function Footer() {
  const tools = getAllTools();

  return (
    <footer className="border-t border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-950/70 mt-20 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Col 1: Brand & Mission */}
          <div className="md:col-span-2 space-y-4">
            <Link href="/" className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-400 flex items-center justify-center text-white shadow-sm">
                <Wrench className="w-4 h-4" />
              </div>
              <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white">
                Everyday<span className="text-indigo-600 dark:text-indigo-400">Tools</span>
              </span>
            </Link>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm">
              Free, fast, and privacy-first online tools for everyday calculations, text formatting, developer utilities, and date conversions. 100% client-side computing with no tracking of your private inputs.
            </p>
            <div className="flex items-center space-x-2 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 rounded-lg border border-emerald-200/60 dark:border-emerald-900/40 w-fit">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Zero-Storage Client-Side Privacy</span>
            </div>
          </div>

          {/* Col 2: Categories */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
              Categories
            </h3>
            <ul className="space-y-2 text-xs">
              {TOOL_CATEGORIES.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/#${cat.id}`}
                    className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Popular Tools */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
              Popular Tools
            </h3>
            <ul className="space-y-2 text-xs">
              {tools.slice(0, 5).map((tool) => (
                <li key={tool.slug}>
                  <Link
                    href={`/tools/${tool.slug}`}
                    className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                  >
                    {tool.shortName}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Trust & Legal */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-white mb-3">
              Company & Legal
            </h3>
            <ul className="space-y-2 text-xs">
              <li>
                <Link
                  href="/about"
                  className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Contact & Support
                </Link>
              </li>
              <li>
                <Link
                  href="/editorial-policy"
                  className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Editorial & Math Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 mt-8 border-t border-slate-200/80 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div>
            © {new Date().getFullYear()} EverydayTools. Built for speed, clarity, and utility.
          </div>
          <div className="flex items-center space-x-4 mt-4 sm:mt-0">
            <span>Global English Edition</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

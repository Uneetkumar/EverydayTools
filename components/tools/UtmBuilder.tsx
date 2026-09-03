"use client";

import React, { useState, useMemo } from "react";
import { Copy, Check, Link2, Sparkles, Trash2, ArrowRightLeft, ShieldCheck } from "lucide-react";

export default function UtmBuilder() {
  const [baseUrl, setBaseUrl] = useState<string>("https://tabbench.com/tools/percentage-calculator");
  const [utmSource, setUtmSource] = useState<string>("twitter");
  const [utmMedium, setUtmMedium] = useState<string>("social");
  const [utmCampaign, setUtmCampaign] = useState<string>("spring_launch_2026");
  const [utmTerm, setUtmTerm] = useState<string>("free_calculators");
  const [utmContent, setUtmContent] = useState<string>("hero_cta_button");
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedClean, setCopiedClean] = useState<boolean>(false);

  // Full constructed URL
  const generatedUrl = useMemo(() => {
    if (!baseUrl.trim()) return "";
    try {
      const url = new URL(baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`);
      if (utmSource.trim()) url.searchParams.set("utm_source", utmSource.trim());
      if (utmMedium.trim()) url.searchParams.set("utm_medium", utmMedium.trim());
      if (utmCampaign.trim()) url.searchParams.set("utm_campaign", utmCampaign.trim());
      if (utmTerm.trim()) url.searchParams.set("utm_term", utmTerm.trim());
      if (utmContent.trim()) url.searchParams.set("utm_content", utmContent.trim());
      return url.toString();
    } catch {
      return baseUrl;
    }
  }, [baseUrl, utmSource, utmMedium, utmCampaign, utmTerm, utmContent]);

  // Clean URL stripped of all UTM and tracker params
  const cleanUrl = useMemo(() => {
    if (!baseUrl.trim()) return "";
    try {
      const url = new URL(baseUrl.startsWith("http") ? baseUrl : `https://${baseUrl}`);
      const paramsToDelete: string[] = [];
      url.searchParams.forEach((_, key) => {
        if (key.startsWith("utm_") || key === "fbclid" || key === "gclid" || key === "mc_cid") {
          paramsToDelete.push(key);
        }
      });
      paramsToDelete.forEach((p) => url.searchParams.delete(p));
      return url.toString();
    } catch {
      return baseUrl;
    }
  }, [baseUrl]);

  // Parse pasted URL into individual fields
  const handlePasteFullUrl = (val: string) => {
    setBaseUrl(val);
    try {
      const url = new URL(val.startsWith("http") ? val : `https://${val}`);
      if (url.searchParams.get("utm_source")) setUtmSource(url.searchParams.get("utm_source") || "");
      if (url.searchParams.get("utm_medium")) setUtmMedium(url.searchParams.get("utm_medium") || "");
      if (url.searchParams.get("utm_campaign")) setUtmCampaign(url.searchParams.get("utm_campaign") || "");
      if (url.searchParams.get("utm_term")) setUtmTerm(url.searchParams.get("utm_term") || "");
      if (url.searchParams.get("utm_content")) setUtmContent(url.searchParams.get("utm_content") || "");
    } catch {}
  };

  const handleCopy = () => {
    if (!generatedUrl) return;
    navigator.clipboard.writeText(generatedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyClean = () => {
    if (!cleanUrl) return;
    navigator.clipboard.writeText(cleanUrl);
    setCopiedClean(true);
    setTimeout(() => setCopiedClean(false), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Inputs */}
        <div className="lg:col-span-6 space-y-4 p-5 sm:p-6 rounded-2xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Link2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              Campaign Parameters
            </h2>
            <button
              onClick={() => {
                setUtmSource("");
                setUtmMedium("");
                setUtmCampaign("");
                setUtmTerm("");
                setUtmContent("");
              }}
              className="text-xs font-semibold text-slate-400 hover:text-rose-500 transition-colors"
            >
              Reset UTMs
            </button>
          </div>

          {/* Website URL */}
          <div className="space-y-1.5">
            <label htmlFor="utm-url-input" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Website Landing URL *
            </label>
            <input
              id="utm-url-input"
              type="text"
              value={baseUrl}
              onChange={(e) => handlePasteFullUrl(e.target.value)}
              placeholder="https://example.com/pricing"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Campaign Source */}
            <div className="space-y-1.5">
              <label htmlFor="utm-source-input" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Source (utm_source) *
              </label>
              <input
                id="utm-source-input"
                type="text"
                value={utmSource}
                onChange={(e) => setUtmSource(e.target.value)}
                placeholder="google, newsletter, twitter"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Campaign Medium */}
            <div className="space-y-1.5">
              <label htmlFor="utm-medium-input" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Medium (utm_medium) *
              </label>
              <input
                id="utm-medium-input"
                type="text"
                value={utmMedium}
                onChange={(e) => setUtmMedium(e.target.value)}
                placeholder="cpc, banner, email, social"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Campaign Name */}
          <div className="space-y-1.5">
            <label htmlFor="utm-campaign-input" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Campaign Name (utm_campaign) *
            </label>
            <input
              id="utm-campaign-input"
              type="text"
              value={utmCampaign}
              onChange={(e) => setUtmCampaign(e.target.value)}
              placeholder="summer_sale_2026"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Campaign Term */}
            <div className="space-y-1.5">
              <label htmlFor="utm-term-input" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Keyword Term (utm_term)
              </label>
              <input
                id="utm-term-input"
                type="text"
                value={utmTerm}
                onChange={(e) => setUtmTerm(e.target.value)}
                placeholder="online_tools"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            {/* Campaign Content */}
            <div className="space-y-1.5">
              <label htmlFor="utm-content-input" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Ad Content (utm_content)
              </label>
              <input
                id="utm-content-input"
                type="text"
                value={utmContent}
                onChange={(e) => setUtmContent(e.target.value)}
                placeholder="blue_sidebar_banner"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        </div>

        {/* Output Cards */}
        <div className="lg:col-span-6 space-y-4">
          {/* Tagged Campaign URL */}
          <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Generated Tracking URL
            </span>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200/80 dark:border-slate-800/80 font-mono text-xs text-blue-600 dark:text-blue-400 break-all select-all leading-relaxed">
              {generatedUrl || "https://..."}
            </div>

            <button
              onClick={handleCopy}
              disabled={!generatedUrl}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Copied Campaign URL!" : "Copy Full Campaign URL"}
            </button>
          </div>

          {/* Clean URL Tool */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                Stripped & Clean URL (Tracker-Free)
              </span>
              <button
                onClick={handleCopyClean}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                {copiedClean ? "Copied!" : "Copy Clean"}
              </button>
            </div>
            <p className="font-mono text-xs text-slate-600 dark:text-slate-400 break-all truncate">
              {cleanUrl}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

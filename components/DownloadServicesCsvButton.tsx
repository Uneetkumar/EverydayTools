"use client";

import React, { useState } from "react";
import { Download, FileSpreadsheet, Check } from "lucide-react";
import confetti from "canvas-confetti";
import { getAllTools, TOOL_CATEGORIES } from "@/lib/tools/registry";
import { SITE_CONFIG } from "@/lib/seo/metadata";

export default function DownloadServicesCsvButton() {
  const [downloaded, setDownloaded] = useState(false);

  const handleDownloadAllServicesCsv = () => {
    const tools = getAllTools();
    const catMap = new Map(TOOL_CATEGORIES.map((c) => [c.id, c.name]));

    const header = "Name,Slug,Category,Description,URL,Type\n";
    const rows = tools
      .map((t) => {
        const catName = catMap.get(t.category) || t.category;
        const nameEscaped = `"${t.name.replace(/"/g, '""')}"`;
        const slugEscaped = `"${t.slug.replace(/"/g, '""')}"`;
        const catEscaped = `"${catName.replace(/"/g, '""')}"`;
        const descEscaped = `"${(t.description || "").replace(/"/g, '""')}"`;
        const urlEscaped = `"${SITE_CONFIG.domain}/tools/${t.slug}"`;
        const typeEscaped = `"Browser Service"`;
        return `${nameEscaped},${slugEscaped},${catEscaped},${descEscaped},${urlEscaped},${typeEscaped}`;
      })
      .join("\n");

    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tabbench-all-services-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
    confetti({ particleCount: 35, spread: 55, origin: { y: 0.85 } });
  };

  return (
    <button
      type="button"
      onClick={handleDownloadAllServicesCsv}
      className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition active:scale-[0.98]"
      title="Download entire catalog of tools and services as a CSV file"
    >
      {downloaded ? (
        <>
          <Check className="w-3.5 h-3.5 text-emerald-300" />
          <span>Downloaded Services CSV!</span>
        </>
      ) : (
        <>
          <FileSpreadsheet className="w-3.5 h-3.5" />
          <span>Download All Services (.CSV)</span>
        </>
      )}
    </button>
  );
}

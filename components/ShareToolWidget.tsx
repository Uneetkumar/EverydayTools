"use client";

import React, { useState, useEffect } from "react";
import { Share2, Check, Copy, MessageCircle, Code, Globe, Send } from "lucide-react";
import confetti from "canvas-confetti";
import { SITE_CONFIG } from "@/lib/seo/metadata";

interface ShareToolWidgetProps {
  toolName: string;
  toolSlug: string;
  category: string;
}

export default function ShareToolWidget({ toolName, toolSlug }: ShareToolWidgetProps) {
  const [copied, setCopied] = useState(false);
  const [embedCopied, setEmbedCopied] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [toolUrl, setToolUrl] = useState(`${SITE_CONFIG.domain}/tools/${toolSlug}`);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setToolUrl(`${window.location.origin}/tools/${toolSlug}`);
    }
  }, [toolSlug]);

  const shareText = `Check out this 100% free and private ${toolName} online:`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(toolUrl);
      setCopied(true);
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.85 } });
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.warn("Clipboard copy failed", e);
    }
  };

  const copyEmbedCode = async () => {
    const embedCode = `<iframe src="${toolUrl}" width="100%" height="600" frameborder="0" title="${toolName} by EverydayTools" style="border-radius:16px;box-shadow:0 4px 20px rgba(0,0,0,0.08);"></iframe>`;
    try {
      await navigator.clipboard.writeText(embedCode);
      setEmbedCopied(true);
      confetti({ particleCount: 35, spread: 55, origin: { y: 0.85 } });
      setTimeout(() => setEmbedCopied(false), 2500);
    } catch (e) {
      console.warn("Embed code copy failed", e);
    }
  };

  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(`${shareText} ${toolUrl}`)}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(toolUrl)}&via=EverydayToolsHQ`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(toolUrl)}`;

  return (
    <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2 text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
          <Share2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>Share Free Tool</span>
        </div>
        <button
          onClick={() => setShowEmbedModal(!showEmbedModal)}
          className="text-[11px] font-semibold text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 flex items-center space-x-1"
          title="Get embed code for your website or blog"
        >
          <Code className="w-3 h-3" />
          <span>Embed</span>
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Share on WhatsApp"
          className="flex flex-col items-center justify-center p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition text-[10px] font-medium"
        >
          <MessageCircle className="w-4 h-4 mb-0.5" />
          <span>WhatsApp</span>
        </a>

        <a
          href={twitterUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Share on X (Twitter)"
          className="flex flex-col items-center justify-center p-2 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-900/50 transition text-[10px] font-medium"
        >
          <Send className="w-4 h-4 mb-0.5" />
          <span>X / Post</span>
        </a>

        <a
          href={linkedinUrl}
          target="_blank"
          rel="noopener noreferrer"
          title="Share on LinkedIn"
          className="flex flex-col items-center justify-center p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition text-[10px] font-medium"
        >
          <Globe className="w-4 h-4 mb-0.5" />
          <span>LinkedIn</span>
        </a>

        <button
          onClick={copyToClipboard}
          title="Copy Link to Clipboard"
          className="flex flex-col items-center justify-center p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition text-[10px] font-medium"
        >
          {copied ? <Check className="w-4 h-4 mb-0.5 text-emerald-600" /> : <Copy className="w-4 h-4 mb-0.5" />}
          <span>{copied ? "Copied!" : "Copy Link"}</span>
        </button>
      </div>

      {showEmbedModal && (
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-left animate-in fade-in-50 duration-150">
          <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
            Embed this tool on your website or blog:
          </div>
          <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 font-mono text-[10px] text-slate-600 dark:text-slate-400 break-all select-all">
            {`<iframe src="${toolUrl}" width="100%" height="600" frameborder="0"></iframe>`}
          </div>
          <button
            onClick={copyEmbedCode}
            className="w-full py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-semibold transition flex items-center justify-center space-x-1"
          >
            {embedCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            <span>{embedCopied ? "Embed Code Copied!" : "Copy Embed HTML Code"}</span>
          </button>
        </div>
      )}
    </div>
  );
}

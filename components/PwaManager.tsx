"use client";

import React, { useState, useEffect, useRef } from "react";
import { Download, X, Share, PlusSquare } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LogoMark } from "@/components/layout/logo";
import { readRecent } from "@/lib/history/recent";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

const DISMISS_KEY = "tabbench_pwa_banner_dismissed";
const DISMISS_MS = 30 * 86400000;
/**
 * Only offer the install banner to returning users (three or more tools
 * used), and never on a tool page, where it would sit over the work.
 */
const MIN_TOOLS_USED = 3;

export default function PwaManager() {
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const isIos = useRef(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);

  const install = async () => {
    const prompt = deferredPrompt.current;
    if (prompt) {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === "accepted") setShowBanner(false);
      deferredPrompt.current = null;
    } else if (isIos.current) {
      setShowIosModal(true);
    } else {
      toast("Install from your browser menu", {
        description: "Look for “Install app” or the install icon in the address bar.",
      });
    }
  };

  const installRef = useRef(install);
  useEffect(() => {
    installRef.current = install;
  });

  useEffect(() => {
    // 1. Register the service worker after load so it never competes with first
    //    paint. Not in development: a worker there caches pages from earlier
    //    edits and keeps answering with them, so new tools "don't appear" on
    //    localhost until someone clears site data. Any worker a previous run
    //    registered is removed instead.
    if ("serviceWorker" in navigator && process.env.NODE_ENV !== "production") {
      void navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => void r.unregister());
        if (regs.length > 0 && "caches" in window) {
          void caches.keys().then((keys) => keys.forEach((k) => void caches.delete(k)));
        }
      });
    } else if ("serviceWorker" in navigator) {
      const registerSW = () => {
        navigator.serviceWorker.register("/sw.js").catch((err) => {
          console.warn("PWA Service Worker registration skipped:", err);
        });
      };
      if (document.readyState === "complete") setTimeout(registerSW, 1500);
      else window.addEventListener("load", () => setTimeout(registerSW, 1500), { once: true });
    }

    // 2. Already installed: nothing to offer.
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    const idStandalone = setTimeout(() => setIsStandalone(standalone), 0);
    if (standalone) return () => clearTimeout(idStandalone);

    isIos.current = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());

    let dismissed = false;
    try {
      const dismissedAt = localStorage.getItem(DISMISS_KEY);
      dismissed = !!dismissedAt && Date.now() - parseInt(dismissedAt, 10) < DISMISS_MS;
    } catch {
      /* storage unavailable: treat as not dismissed */
    }

    let bannerTimer: ReturnType<typeof setTimeout> | undefined;

    // 3. Chromium's install prompt (desktop Chrome/Edge, Android). The banner
    //    is held back for first-time visitors: someone who has used one tool
    //    has not yet shown they will come back.
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      if (!dismissed && readRecent().length >= MIN_TOOLS_USED && !window.location.pathname.startsWith("/tools/")) {
        bannerTimer = setTimeout(() => setShowBanner(true), 3000);
      }
    };

    const handleAppInstalled = () => {
      deferredPrompt.current = null;
      setShowBanner(false);
      toast.success("TabBench installed", { description: "Open it any time from your apps." });
    };

    // 4. Manual trigger from the header menu and footer.
    const handleTriggerInstall = () => {
      void installRef.current();
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("tabbench-trigger-install", handleTriggerInstall);
    return () => {
      clearTimeout(idStandalone);
      if (bannerTimer) clearTimeout(bannerTimer);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("tabbench-trigger-install", handleTriggerInstall);
    };
  }, []);

  const dismissBanner = () => {
    setShowBanner(false);
    try {
      localStorage.setItem(DISMISS_KEY, Date.now().toString());
    } catch {
      /* ignore */
    }
  };

  if (isStandalone) return null;

  return (
    <>
      {showBanner && (
        <div
          role="region"
          aria-label="Install TabBench"
          className="fixed inset-x-4 bottom-4 z-40 animate-in duration-300 slide-in-from-bottom-5 sm:right-6 sm:left-auto sm:w-[26rem]"
        >
          <div className="flex items-center gap-3 rounded-xl border bg-popover p-3 text-popover-foreground shadow-raised">
            <LogoMark className="size-10 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">Install TabBench</p>
              <p className="text-xs text-muted-foreground">Open your tools from the home screen or dock.</p>
            </div>
            <Button size="sm" onClick={install}>
              <Download aria-hidden="true" />
              Install
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={dismissBanner} aria-label="Dismiss install suggestion">
              <X aria-hidden="true" />
            </Button>
          </div>
        </div>
      )}

      <Dialog open={showIosModal} onOpenChange={setShowIosModal}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add TabBench to your Home Screen</DialogTitle>
            <DialogDescription>Three taps in Safari.</DialogDescription>
          </DialogHeader>
          <ol className="space-y-2 text-sm">
            <li className="flex items-center gap-3 rounded-lg border p-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">1</span>
              <span className="flex-1">
                Tap <strong>Share</strong> in the Safari toolbar
              </span>
              <Share className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </li>
            <li className="flex items-center gap-3 rounded-lg border p-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">2</span>
              <span className="flex-1">
                Choose <strong>Add to Home Screen</strong>
              </span>
              <PlusSquare className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </li>
            <li className="flex items-center gap-3 rounded-lg border p-3">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">3</span>
              <span className="flex-1">
                Tap <strong>Add</strong>
              </span>
            </li>
          </ol>
          <DialogFooter>
            <Button onClick={() => setShowIosModal(false)}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

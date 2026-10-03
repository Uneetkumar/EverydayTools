"use client";

import React, { useState, useEffect, useRef } from "react";
import { Download, X, Share, PlusSquare, Monitor, Bookmark, Laptop } from "lucide-react";
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
const MIN_TOOLS_USED = 3;

type PlatformGuidance = "ios" | "macos-safari" | "generic";

export default function PwaManager() {
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [guidanceModal, setGuidanceModal] = useState<PlatformGuidance | null>(null);

  const detectPlatform = (): PlatformGuidance => {
    if (typeof window === "undefined" || !window.navigator) return "generic";
    const ua = window.navigator.userAgent.toLowerCase();
    const isIpadOS = /macintosh/.test(ua) && (navigator.maxTouchPoints ?? 0) > 1;
    if (/iphone|ipad|ipod/.test(ua) || isIpadOS) return "ios";
    if (/macintosh/.test(ua) && /safari/.test(ua) && !/chrome|chromium|edg|opr|brave/.test(ua)) {
      return "macos-safari";
    }
    return "generic";
  };

  const install = async () => {
    const prompt = deferredPrompt.current;
    if (prompt) {
      try {
        await prompt.prompt();
        const choice = await prompt.userChoice;
        if (choice.outcome === "accepted") {
          setShowBanner(false);
        }
        deferredPrompt.current = null;
      } catch (err) {
        console.warn("PWA install prompt error:", err);
      }
    } else {
      const platform = detectPlatform();
      setGuidanceModal(platform);
    }
  };

  const installRef = useRef(install);
  useEffect(() => {
    installRef.current = install;
  });

  useEffect(() => {
    // 1. Register the service worker after load so it never competes with first
    //    paint. Not in development: a worker there caches pages from earlier
    //    edits and keeps answering with them.
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

    let dismissed = false;
    try {
      const dismissedAt = localStorage.getItem(DISMISS_KEY);
      dismissed = !!dismissedAt && Date.now() - parseInt(dismissedAt, 10) < DISMISS_MS;
    } catch {
      /* storage unavailable: treat as not dismissed */
    }

    let bannerTimer: ReturnType<typeof setTimeout> | undefined;

    // 3. Chromium's install prompt (desktop Chrome/Edge, Android).
    // The banner is offered once user has used at least MIN_TOOLS_USED tools.
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      if (!dismissed && readRecent().length >= MIN_TOOLS_USED) {
        bannerTimer = setTimeout(() => setShowBanner(true), 3000);
      }
    };

    const handleAppInstalled = () => {
      deferredPrompt.current = null;
      setShowBanner(false);
      setGuidanceModal(null);
      toast.success("TabBench installed", { description: "Open it any time from your apps or home screen." });
    };

    // 4. Manual trigger from header, hero, tool bar, and footer.
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
              <p className="text-sm font-medium">Install TabBench Offline</p>
              <p className="text-xs text-muted-foreground">Work without internet from your home screen or dock.</p>
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

      {/* Cross-Browser Install Guidance Modal */}
      <Dialog open={guidanceModal !== null} onOpenChange={(open) => !open && setGuidanceModal(null)}>
        <DialogContent className="sm:max-w-md">
          {guidanceModal === "ios" && (
            <>
              <DialogHeader>
                <DialogTitle>Add TabBench to your Home Screen</DialogTitle>
                <DialogDescription>Install on iPhone or iPad in three quick taps.</DialogDescription>
              </DialogHeader>
              <ol className="space-y-2 text-sm">
                <li className="flex items-center gap-3 rounded-lg border p-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">1</span>
                  <span className="flex-1">
                    Tap <strong>Share</strong> in the Safari bottom toolbar
                  </span>
                  <Share className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                </li>
                <li className="flex items-center gap-3 rounded-lg border p-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">2</span>
                  <span className="flex-1">
                    Scroll down and choose <strong>Add to Home Screen</strong>
                  </span>
                  <PlusSquare className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                </li>
                <li className="flex items-center gap-3 rounded-lg border p-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">3</span>
                  <span className="flex-1">
                    Tap <strong>Add</strong> in the top right corner
                  </span>
                </li>
              </ol>
            </>
          )}

          {guidanceModal === "macos-safari" && (
            <>
              <DialogHeader>
                <DialogTitle>Add TabBench to your Mac Dock</DialogTitle>
                <DialogDescription>Install as a standalone Mac application from Safari.</DialogDescription>
              </DialogHeader>
              <ol className="space-y-2 text-sm">
                <li className="flex items-center gap-3 rounded-lg border p-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">1</span>
                  <span className="flex-1">
                    In Safari menu bar, click <strong>File</strong> (or click <strong>Share</strong> in toolbar)
                  </span>
                  <Laptop className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                </li>
                <li className="flex items-center gap-3 rounded-lg border p-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">2</span>
                  <span className="flex-1">
                    Select <strong>Add to Dock…</strong>
                  </span>
                </li>
                <li className="flex items-center gap-3 rounded-lg border p-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">3</span>
                  <span className="flex-1">
                    Click <strong>Add</strong> to launch TabBench right from your Dock offline
                  </span>
                </li>
              </ol>
            </>
          )}

          {guidanceModal === "generic" && (
            <>
              <DialogHeader>
                <DialogTitle>Offline Caching Ready</DialogTitle>
                <DialogDescription>TabBench works 100% offline in this browser.</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3 rounded-lg border p-3">
                  <Monitor className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">Desktop Browser Install</p>
                    <p className="text-xs text-muted-foreground">
                      Look for the install icon on the right side of your address bar, or open the browser menu (⋮ or ⋯) and click <strong>Install TabBench</strong>.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg border p-3">
                  <Bookmark className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">Service Worker Offline Cache</p>
                    <p className="text-xs text-muted-foreground">
                      All tools run in your browser. Visited tools are automatically cached locally so you can use them even without an internet connection.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          <DialogFooter className="flex-row items-center justify-between sm:justify-end gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href="/offline">Offline Settings</a>
            </Button>
            <Button size="sm" onClick={() => setGuidanceModal(null)}>
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

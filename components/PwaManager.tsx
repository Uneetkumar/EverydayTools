"use client";

import React, { useState, useEffect } from "react";
import { Download, X, Share, PlusSquare, Sparkles, Check, Smartphone, Monitor } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export default function PwaManager() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [showIosModal, setShowIosModal] = useState(false);
  const [installedSuccessfully, setInstalledSuccessfully] = useState(false);

  useEffect(() => {
    // 1. Register Service Worker
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("PWA Service Worker registered:", reg.scope);
        })
        .catch((err) => {
          console.warn("PWA Service Worker registration skipped:", err);
        });
    }

    // 2. Detect if already running in standalone (installed) mode
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    setIsStandalone(isStandaloneMode);

    if (isStandaloneMode) return;

    // 3. Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // 4. Check if user dismissed banner recently (within 5 days)
    const dismissedAt = localStorage.getItem("tabbench_pwa_banner_dismissed");
    const isDismissed = dismissedAt && Date.now() - parseInt(dismissedAt, 10) < 5 * 86400000;

    // 5. Handle standard Chromium beforeinstallprompt event (Desktop Chrome, Edge, Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
      if (!isDismissed) {
        // Show floating install banner after 3 seconds of engagement
        setTimeout(() => setShowBanner(true), 3000);
      }
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // 6. Handle app installed event
    const handleAppInstalled = () => {
      setIsInstallable(false);
      setDeferredPrompt(null);
      setShowBanner(false);
      setInstalledSuccessfully(true);
      setTimeout(() => setInstalledSuccessfully(false), 5000);
    };

    window.addEventListener("appinstalled", handleAppInstalled);

    // 7. Listen for manual install trigger from Header / Mobile Drawer
    const handleTriggerInstall = () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === "accepted") {
            setShowBanner(false);
          }
          setDeferredPrompt(null);
        });
      } else if (isIosDevice) {
        setShowIosModal(true);
      } else {
        setShowBanner(true);
      }
    };

    window.addEventListener("tabbench-trigger-install", handleTriggerInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("tabbench-trigger-install", handleTriggerInstall);
    };
  }, [deferredPrompt]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        setShowBanner(false);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      setShowIosModal(true);
    } else {
      // Fallback guide for other browsers
      alert("To install TabBench: click the Install icon (💻/📱) in your browser address bar or menu.");
    }
  };

  const handleDismissBanner = () => {
    setShowBanner(false);
    localStorage.setItem("tabbench_pwa_banner_dismissed", Date.now().toString());
  };

  if (isStandalone) return null;

  return (
    <>
      {/* 1. Floating Bottom Install Banner for Mobile & Desktop */}
      {showBanner && !isStandalone && (
        <div className="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-6 sm:max-w-md z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div className="p-4 rounded-3xl bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md border border-slate-800 text-white shadow-2xl flex items-center justify-between gap-3">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-white flex items-center space-x-1.5 truncate">
                  <span>Install TabBench App</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/30 text-blue-300 font-normal">
                    Free
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 truncate">
                  Fast 0-latency tools on your home screen &amp; desktop.
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 shrink-0">
              <button
                onClick={handleInstallClick}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition flex items-center space-x-1 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install</span>
              </button>

              <button
                onClick={handleDismissBanner}
                className="p-2 text-slate-400 hover:text-white transition rounded-xl hover:bg-slate-800"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Success Toast */}
      {installedSuccessfully && (
        <div className="fixed bottom-4 right-6 z-50 p-4 rounded-2xl bg-emerald-600 text-white shadow-2xl flex items-center space-x-2 text-xs font-semibold animate-in fade-in duration-200">
          <Check className="w-4 h-4" />
          <span>TabBench installed successfully! Launch it anytime from your apps.</span>
        </div>
      )}

      {/* 3. iOS Safari Step-by-Step Installation Modal */}
      {showIosModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5 animate-in slide-in-from-bottom duration-250">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Install on iOS / Safari
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Add TabBench to your Home Screen
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowIosModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-600 dark:text-slate-300">
              <div className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  1
                </div>
                <div className="flex-1 flex items-center justify-between">
                  <span>Tap the <strong>Share</strong> button in Safari toolbar</span>
                  <Share className="w-4 h-4 text-blue-600 shrink-0" />
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  2
                </div>
                <div className="flex-1 flex items-center justify-between">
                  <span>Scroll down and select <strong>&quot;Add to Home Screen&quot;</strong></span>
                  <PlusSquare className="w-4 h-4 text-slate-600 dark:text-slate-400 shrink-0" />
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                  3
                </div>
                <div className="flex-1">
                  <span>Tap <strong>Add</strong> in the top-right corner</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIosModal(false)}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition"
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
}

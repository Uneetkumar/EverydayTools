"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { track } from "@/lib/analytics";

/**
 * Page views. The Firebase SDK is loaded lazily by lib/analytics.ts, so it is
 * no longer part of every page's initial JavaScript; the event still fires on
 * first interaction or after 2.5s idle, as before.
 */
export default function FirebaseAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const trackPageView = () => {
      const url =
        pathname +
        (searchParams?.toString() ? `?${searchParams.toString()}` : "");
      track("page_view", {
        page_path: url,
        page_location: window.location.href,
        page_title: document.title,
      });
    };

    // On user interaction or after 2.5s idle, trigger analytics tracking
    const onUserInteract = () => {
      cleanup();
      trackPageView();
    };

    // Fallback idle timer. Declared before cleanup reads it.
    const timeoutId = setTimeout(() => onUserInteract(), 2500);

    const cleanup = () => {
      clearTimeout(timeoutId);
      window.removeEventListener("scroll", onUserInteract);
      window.removeEventListener("pointerdown", onUserInteract);
      window.removeEventListener("touchstart", onUserInteract);
      window.removeEventListener("keydown", onUserInteract);
    };

    window.addEventListener("scroll", onUserInteract, { once: true, passive: true });
    window.addEventListener("pointerdown", onUserInteract, { once: true, passive: true });
    window.addEventListener("touchstart", onUserInteract, { once: true, passive: true });
    window.addEventListener("keydown", onUserInteract, { once: true, passive: true });

    return cleanup;
  }, [pathname, searchParams]);

  return null;
}

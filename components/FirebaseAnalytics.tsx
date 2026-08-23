"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { initAnalytics } from "@/lib/firebase";
import { logEvent } from "firebase/analytics";

export default function FirebaseAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const trackPageView = async () => {
      try {
        const analytics = await initAnalytics();
        if (analytics) {
          const url =
            pathname +
            (searchParams?.toString() ? `?${searchParams.toString()}` : "");
          logEvent(analytics, "page_view", {
            page_path: url,
            page_location: window.location.href,
            page_title: document.title,
          });
        }
      } catch {
        // Safe fallback
      }
    };

    // On user interaction or after 2.5s idle, trigger analytics tracking
    const onUserInteract = () => {
      cleanup();
      trackPageView();
    };

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

    // Fallback idle timer
    timeoutId = setTimeout(onUserInteract, 2500);

    return cleanup;
  }, [pathname, searchParams]);

  return null;
}

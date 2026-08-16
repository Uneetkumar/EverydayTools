"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { initAnalytics } from "@/lib/firebase";
import { logEvent } from "firebase/analytics";

export default function FirebaseAnalytics() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    initAnalytics().then((analytics) => {
      if (analytics) {
        const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : "");
        logEvent(analytics, "page_view", {
          page_path: url,
          page_location: window.location.href,
          page_title: document.title,
        });
      }
    });
  }, [pathname, searchParams]);

  return null;
}

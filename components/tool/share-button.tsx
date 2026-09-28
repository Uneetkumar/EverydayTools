"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

/**
 * Native share sheet where available (mobile), otherwise copy the link.
 * Replaces the sidebar share widget: sharing is a one-tap action, not a panel.
 */
export function ShareButton({ title, path }: { title: string; path: string }) {
  const onClick = async () => {
    const url = `${window.location.origin}${path}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (e) {
        // User dismissed the sheet: nothing to do.
        if ((e as DOMException)?.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy the link", { description: url });
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={onClick} aria-label={`Share ${title}`}>
      <Share2 aria-hidden="true" />
      <span className="hidden md:inline">Share</span>
    </Button>
  );
}

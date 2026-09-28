"use client";

import { toast } from "sonner";
import { markToolCompleted } from "@/lib/analytics";

/**
 * Copy text, the same way everywhere.
 *
 * The async Clipboard API can be refused (permissions, an iframe, an older
 * browser), and several tools called it without handling that — so they said
 * "Copied!" while the clipboard stayed empty. This tries the API, falls back
 * to the legacy selection copy, and tells the user if both fail. Resolves to
 * whether the text is now on the clipboard.
 */
export async function copyText(text: string): Promise<boolean> {
  if (!text) return false;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      markToolCompleted();
      return true;
    }
  } catch {
    /* fall through to the legacy path */
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.cssText = "position:fixed;top:0;left:0;opacity:0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    if (ok) {
      markToolCompleted();
      return true;
    }
  } catch {
    /* reported below */
  }
  toast.error("Couldn't copy to the clipboard", {
    description: "Your browser blocked it. Select the text and copy it manually.",
  });
  return false;
}

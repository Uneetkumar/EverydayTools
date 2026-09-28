"use client";

import React, { useState } from "react";
import { Trash2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { clearResults } from "@/lib/history/results";
import { clearRecent } from "@/lib/history/recent";
import { favoritesStore } from "@/lib/history/favorites";
import { searchesStore } from "@/lib/history/searches";

/**
 * One control that removes everything this site has written to the device.
 *
 * A privacy policy that describes local storage but offers no way to clear it
 * puts the burden on the reader to go digging through browser settings. This
 * is the actionable half of the disclosure.
 */
export default function ClearLocalData() {
  const [done, setDone] = useState(false);
  const [working, setWorking] = useState(false);

  const clearEverything = async () => {
    setWorking(true);
    try {
      await clearResults();
      clearRecent();
      // Every key this site writes uses one of these prefixes:
      //   et_           notes, exchange-rate cache, recently used tools
      //   edt_persist_  saved tool inputs (usePersistentState, 3-day TTL)
      //   qr_           QR generator preferences
      //   tb_           favorites and recent searches
      //   tabbench_     install-banner dismissal
      // edt_persist_ was previously missed, so the button left every saved
      // tool input behind while saying it had cleared everything.
      try {
        const prefixes = ["et_", "edt_", "qr_", "tb_", "tabbench_"];
        const keys = Object.keys(localStorage).filter((k) =>
          prefixes.some((p) => k.startsWith(p))
        );
        keys.forEach((k) => localStorage.removeItem(k));
      } catch {
        /* storage may be unavailable */
      }
      // Stores keep an in-memory snapshot; tell them the data is gone.
      favoritesStore.clear();
      searchesStore.clear();
      setDone(true);
      setTimeout(() => setDone(false), 4000);
    } finally {
      setWorking(false);
    }
  };

  return (
    <div className="rounded-xl border bg-card p-5 shadow-soft">
      <p className="text-sm text-muted-foreground">
        This removes every saved file, your recently used tools, favorites, recent searches, notes and all saved
        tool inputs from this browser immediately. It cannot be undone.
      </p>
      <Button type="button" variant="destructive" onClick={clearEverything} disabled={working} className="mt-3">
        {done ? <Check aria-hidden="true" /> : <Trash2 aria-hidden="true" />}
        {done ? "Everything cleared" : "Clear all local data"}
      </Button>
      <p role="status" className="sr-only">
        {done ? "All local data cleared" : ""}
      </p>
    </div>
  );
}

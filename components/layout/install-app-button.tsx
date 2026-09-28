"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Hands off to PwaManager, which owns the install prompt and iOS instructions. */
export function InstallAppButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => window.dispatchEvent(new CustomEvent("tabbench-trigger-install"))}
    >
      <Download aria-hidden="true" /> Install TabBench app
    </Button>
  );
}

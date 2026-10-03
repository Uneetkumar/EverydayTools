"use client";

import * as React from "react";
import { Check, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export interface InstallAppButtonProps {
  variant?: "header" | "hero" | "tool-bar" | "footer" | "icon";
  className?: string;
  onClick?: () => void;
}

/** Hands off to PwaManager, which owns the install prompt and cross-browser instructions. */
export function InstallAppButton({ variant = "footer", className, onClick }: InstallAppButtonProps) {
  const [isStandalone, setIsStandalone] = React.useState(false);

  React.useEffect(() => {
    const checkStandalone = () => {
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
      setIsStandalone(standalone);
    };
    checkStandalone();
    const media = window.matchMedia("(display-mode: standalone)");
    media.addEventListener?.("change", checkStandalone);
    return () => media.removeEventListener?.("change", checkStandalone);
  }, []);

  const triggerInstall = () => {
    onClick?.();
    window.dispatchEvent(new CustomEvent("tabbench-trigger-install"));
  };

  if (isStandalone) {
    if (variant === "header" || variant === "tool-bar" || variant === "icon") {
      return null;
    }
    return (
      <div className={cn("inline-flex items-center gap-1.5 text-xs text-muted-foreground", className)}>
        <Check className="size-3.5 text-success" aria-hidden="true" />
        <span>Installed offline</span>
      </div>
    );
  }

  if (variant === "header") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            onClick={triggerInstall}
            className={cn(
              "h-8 gap-1.5 px-2.5 text-xs font-medium text-foreground border-primary/20 hover:border-primary/40 hover:bg-primary/5 hover:text-primary shadow-none transition-colors",
              className
            )}
            aria-label="Install app for offline use"
          >
            <Download className="size-3.5 text-primary" aria-hidden="true" />
            <span className="hidden lg:inline">Install app</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>Install TabBench for 100% offline access</TooltipContent>
      </Tooltip>
    );
  }

  if (variant === "hero") {
    return (
      <Button
        variant="default"
        size="sm"
        onClick={triggerInstall}
        className={cn(
          "gap-1.5 rounded-full font-medium shadow-sm transition-all hover:scale-[1.02]",
          className
        )}
      >
        <Download className="size-3.5" aria-hidden="true" />
        <span>Install App</span>
      </Button>
    );
  }

  if (variant === "tool-bar") {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={triggerInstall}
        className={cn(
          "h-8 gap-1.5 px-2 sm:px-2.5 text-xs font-medium text-foreground hover:text-primary transition-colors",
          className
        )}
        title="Install TabBench for offline use"
        aria-label="Install TabBench for offline use"
      >
        <Download className="size-3.5 text-primary" aria-hidden="true" />
        <span className="hidden sm:inline">Install offline</span>
      </Button>
    );
  }

  if (variant === "icon") {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={triggerInstall}
            className={cn("text-muted-foreground hover:text-foreground", className)}
            aria-label="Install app for offline use"
          >
            <Download className="size-4" aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Install TabBench app</TooltipContent>
      </Tooltip>
    );
  }

  // "footer" or default
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={triggerInstall}
      className={className}
    >
      <Download aria-hidden="true" /> Install TabBench app
    </Button>
  );
}

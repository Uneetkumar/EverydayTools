import { Cloud, ShieldCheck, Wifi } from "lucide-react";
import type { ToolDefinition } from "@/lib/tools/registry";
import { cn } from "@/lib/utils";

/**
 * One accurate sentence about where the user's data goes. Replaces the
 * previous row of badges ("100% Free for All", "Client-Side Private",
 * "Auto-saved (3 days)"), which competed with the tool for attention and, for
 * network tools, was either missing or blunt.
 */
export function PrivacyNote({ tool, className }: { tool: ToolDefinition; className?: string }) {
  const { privacy, privacyNote } = tool;

  const { Icon, text, tone } =
    privacy === "network"
      ? { Icon: Wifi, text: privacyNote ?? "Needs an internet connection.", tone: "text-muted-foreground" }
      : privacy === "cloud-optional"
        ? {
            Icon: Cloud,
            text: "Runs on your device by default. The optional cloud AI mode sends your input to Google Gemini.",
            tone: "text-muted-foreground",
          }
        : {
            Icon: ShieldCheck,
            text: "Runs in your browser. Nothing you add is uploaded.",
            tone: "text-muted-foreground",
          };

  return (
    <p className={cn("flex items-start gap-2 text-sm", tone, className)}>
      <Icon
        aria-hidden="true"
        className={cn("mt-0.5 size-4 shrink-0", privacy === "local" ? "text-success" : "text-muted-foreground")}
      />
      <span>{text}</span>
    </p>
  );
}

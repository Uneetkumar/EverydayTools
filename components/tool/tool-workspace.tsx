"use client";

import * as React from "react";
import { markToolError, markToolStarted } from "@/lib/analytics";
import { ToolErrorState } from "./tool-states";

/** Controls whose first use means the visitor has started using the tool. */
const CONTROL = "button, input, select, textarea, label, a, canvas, video, [role=button], [role=tab], [role=radio], [role=slider], [contenteditable]";

/**
 * The card every tool renders in. Two jobs beyond layout:
 *
 * - Reports `tool_started` on the first real interaction with a control
 *   (typing, choosing a file, pressing a button). Nothing about the
 *   interaction itself is recorded.
 * - Contains a crash inside one tool, so a bug in a tool shows a recoverable
 *   message in place of the tool instead of taking down the whole page with
 *   its explanation, FAQ and navigation.
 */
export function ToolWorkspace({ name, children }: { name: string; children: React.ReactNode }) {
  const ref = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const events = ["input", "change", "drop", "pointerdown"] as const;
    const onEvent = (e: Event) => {
      if (e.type === "pointerdown" && !(e.target as Element | null)?.closest?.(CONTROL)) return;
      markToolStarted();
      for (const type of events) el.removeEventListener(type, onEvent, true);
    };
    for (const type of events) el.addEventListener(type, onEvent, true);
    return () => {
      for (const type of events) el.removeEventListener(type, onEvent, true);
    };
  }, []);

  return (
    <section
      ref={ref}
      aria-label={name}
      data-tool-workspace=""
      className="@container rounded-2xl border bg-card p-4 text-card-foreground shadow-soft sm:p-6"
    >
      <ToolErrorBoundary>{children}</ToolErrorBoundary>
    </section>
  );
}

class ToolErrorBoundary extends React.Component<{ children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    // Chunk failures mean the network dropped while the tool's code loaded;
    // everything else is a bug in the tool. Only the category is reported.
    const chunk = error instanceof Error && /chunk|dynamically imported module/i.test(error.message);
    markToolError(chunk ? "load_failed" : "crash");
    console.error(error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <ToolErrorState
        title="This tool stopped working"
        description="Something went wrong inside the tool. Your files and text were not sent anywhere. Try again, or reload the page if it keeps happening."
        onRetry={() => this.setState({ failed: false })}
      />
    );
  }
}

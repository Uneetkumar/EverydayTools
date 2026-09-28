import * as React from "react";
import { AlertCircle, CheckCircle2, Inbox, RotateCcw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

/**
 * The four states every tool moves through, so they look and read the same
 * everywhere: empty → loading → success | error. Copy defaults follow the
 * product voice; pass specifics where the tool knows more.
 */

export function ToolEmptyState({
  title = "Enter your data to get started",
  description,
  icon,
  children,
  className,
}: {
  title?: string;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <Empty className={cn("border", className)}>
      <EmptyHeader>
        <EmptyMedia variant="icon">{icon ?? <Inbox />}</EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        {description && <EmptyDescription>{description}</EmptyDescription>}
      </EmptyHeader>
      {children && <EmptyContent>{children}</EmptyContent>}
    </Empty>
  );
}

/** Used while a tool's code loads, and by tools while they process. */
export function ToolLoadingState({
  label,
  className,
}: {
  /** When set, shows a spinner with this text ("Compressing…"); otherwise a skeleton. */
  label?: string;
  className?: string;
}) {
  if (label) {
    return (
      <div
        role="status"
        className={cn("flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground", className)}
      >
        <Spinner /> {label}
      </div>
    );
  }
  return (
    <div role="status" aria-label="Loading tool" className={cn("space-y-4 py-2", className)}>
      <Skeleton className="h-10 w-full" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="h-10 w-40" />
    </div>
  );
}

export function ToolErrorState({
  title = "We couldn't process this input",
  description = "Check the input and try again.",
  onRetry,
  className,
}: {
  title?: string;
  description?: React.ReactNode;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <p>{description}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="mt-2">
            <RotateCcw aria-hidden="true" /> Try again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}

export function ToolSuccessState({
  title = "Done",
  description,
  className,
  children,
}: {
  title?: string;
  description?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <Alert className={cn("border-success/30 bg-success/5", className)}>
      <CheckCircle2 className="text-success" />
      <AlertTitle>{title}</AlertTitle>
      {(description || children) && (
        <AlertDescription>
          {description && <p>{description}</p>}
          {children}
        </AlertDescription>
      )}
    </Alert>
  );
}

"use client";

/**
 * Building blocks for tool interfaces, so every tool is laid out, labelled
 * and spaced the same way:
 *
 *   <ToolSection title="Settings">            a titled group (no nested card)
 *     <Field label="Target size" hint="…">    label above, hint below
 *       <UnitInput unit="KB" … />             number + unit, aligned
 *     </Field>
 *     <Segmented … />  <Chips … />            one choice / quick presets
 *   </ToolSection>
 *   <Notice tone="success">…</Notice>         status line
 *   <StatGrid><Stat … /></StatGrid>           key numbers
 *   <ActionBar>…buttons…</ActionBar>          primary action last on the right
 *
 * The workspace card around every tool already provides the surface, so these
 * add structure with spacing and hairlines rather than more boxes.
 */

import * as React from "react";
import { AlertTriangle, CheckCircle2, Info, XCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

export function ToolSection({
  title,
  description,
  actions,
  children,
  className,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  const id = React.useId();
  return (
    <section aria-labelledby={title ? id : undefined} className={cn("space-y-4", className)}>
      {(title || actions) && (
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="min-w-0">
            {title && (
              <h3 id={id} className="text-sm font-semibold text-foreground">
                {title}
              </h3>
            )}
            {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
          </div>
          {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: {
  label: React.ReactNode;
  htmlFor?: string;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

/** Shared look for native inputs, textareas and selects inside tools. */
export const controlClass =
  "w-full rounded-lg border border-input bg-background text-base text-foreground outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive md:text-sm dark:bg-input/30";

export function TextInput({ className, ...props }: React.ComponentProps<"input">) {
  return <input {...props} className={cn(controlClass, "h-10 px-3", className)} />;
}

export function TextArea({ className, ...props }: React.ComponentProps<"textarea">) {
  return <textarea {...props} className={cn(controlClass, "min-h-20 px-3 py-2 leading-relaxed", className)} />;
}

export function SelectInput({ className, ...props }: React.ComponentProps<"select">) {
  return <select {...props} className={cn(controlClass, "h-10 px-2.5", className)} />;
}

/** An on/off setting: label and optional description on the left, switch on the right. */
export function ToggleRow({
  id,
  label,
  description,
  checked,
  onCheckedChange,
  className,
}: {
  id: string;
  label: React.ReactNode;
  description?: React.ReactNode;
  checked: boolean;
  onCheckedChange: (v: boolean) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-4", className)}>
      <div className="min-w-0">
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} className="mt-0.5" />
    </div>
  );
}

/** One-of-several choice where each option needs a short explanation. */
export function OptionCards<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  className,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: React.ReactNode; description?: React.ReactNode }[];
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} className={cn("grid gap-2", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "rounded-lg border px-3 py-2.5 text-left transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
              active ? "border-primary/50 bg-brand-subtle" : "bg-background hover:bg-muted dark:bg-input/20 dark:hover:bg-input/40"
            )}
          >
            <span className={cn("block text-sm font-medium", active ? "text-brand-subtle-foreground" : "text-foreground")}>
              {o.label}
            </span>
            {o.description && <span className="mt-0.5 block text-xs text-muted-foreground">{o.description}</span>}
          </button>
        );
      })}
    </div>
  );
}

/** A number (or text) input with its unit inside the field, vertically centred. */
export function UnitInput({
  unit,
  className,
  inputClassName,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { unit: string; inputClassName?: string }) {
  return (
    <div
      className={cn(
        "flex h-10 items-center rounded-lg border border-input bg-background transition-colors dark:bg-input/30",
        "focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
        "has-[input[aria-invalid=true]]:border-destructive",
        className
      )}
    >
      <input
        {...props}
        className={cn(
          "h-full w-full min-w-0 bg-transparent px-3 text-base tabular-nums text-foreground outline-none placeholder:text-muted-foreground md:text-sm",
          inputClassName
        )}
      />
      <span className="pr-3 text-sm text-muted-foreground select-none">{unit}</span>
    </div>
  );
}

/** One-of-several choice shown as a segmented control. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  size = "default",
  className,
  fill = false,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: React.ReactNode }[];
  ariaLabel: string;
  size?: "sm" | "default";
  className?: string;
  /** Stretch items to share the full width. */
  fill?: boolean;
}) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      size={size}
      spacing={0}
      value={value}
      onValueChange={(v) => v && onChange(v as T)}
      aria-label={ariaLabel}
      className={cn(fill && "w-full", className)}
    >
      {options.map((o) => (
        <ToggleGroupItem
          key={o.value}
          value={o.value}
          className={cn("px-3.5", size === "default" && "h-10", fill && "flex-1")}
        >
          {o.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

/** Quick presets as small pills; the selected one is highlighted. */
export function Chips<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  className,
}: {
  value: T | null;
  onChange: (v: T) => void;
  options: { value: T; label: React.ReactNode }[];
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div role="group" aria-label={ariaLabel} className={cn("flex flex-wrap gap-1.5", className)}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "h-7 rounded-full border px-3 text-xs font-medium transition-colors outline-none",
              "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
              active
                ? "border-primary/50 bg-brand-subtle text-brand-subtle-foreground"
                : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

const NOTICE = {
  success: { icon: CheckCircle2, cls: "border-success/30 bg-success/5", iconCls: "text-success" },
  warning: { icon: AlertTriangle, cls: "border-warning/30 bg-warning/5", iconCls: "text-warning" },
  info: { icon: Info, cls: "border-border bg-muted/50", iconCls: "text-muted-foreground" },
  error: { icon: XCircle, cls: "border-destructive/30 bg-destructive/5", iconCls: "text-destructive" },
} as const;

export function Notice({
  tone = "info",
  children,
  className,
}: {
  tone?: keyof typeof NOTICE;
  children: React.ReactNode;
  className?: string;
}) {
  const { icon: Icon, cls, iconCls } = NOTICE[tone];
  return (
    <div
      role={tone === "error" || tone === "warning" ? "alert" : "status"}
      className={cn("flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm text-foreground", cls, className)}
    >
      <Icon className={cn("mt-0.5 size-4 shrink-0", iconCls)} aria-hidden="true" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

export function StatGrid({ children, className }: { children: React.ReactNode; className?: string }) {
  return <dl className={cn("grid grid-cols-2 gap-2.5 @xl:grid-cols-4", className)}>{children}</dl>;
}

export function Stat({
  label,
  value,
  hint,
  tone,
}: {
  label: React.ReactNode;
  value: React.ReactNode;
  hint?: React.ReactNode;
  tone?: "success" | "warning";
}) {
  return (
    <div className="min-w-0 rounded-lg border bg-background px-3.5 py-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "mt-0.5 truncate text-lg font-semibold tabular-nums",
          tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-foreground"
        )}
      >
        {value}
      </dd>
      {hint && <dd className="mt-0.5 text-xs text-muted-foreground">{hint}</dd>}
    </div>
  );
}

export function ActionBar({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex flex-wrap items-center justify-end gap-2", className)}>{children}</div>;
}

/** Hairline between the input half and the output half of a tool. */
export function ToolDivider() {
  return <hr className="border-border" />;
}

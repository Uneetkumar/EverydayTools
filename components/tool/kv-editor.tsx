"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { TextInput } from "@/components/tool/kit";

export interface KvRow {
  id: string;
  key: string;
  value: string;
  enabled: boolean;
}

let seq = 0;
export const newRow = (key = "", value = "", enabled = true): KvRow => ({ id: `kv${++seq}${Math.random().toString(36).slice(2, 6)}`, key, value, enabled });

/** Rows that have a name or a value and are switched on — what should actually be sent or written. */
export const activeRows = (rows: KvRow[]) => rows.filter((r) => r.enabled && (r.key.trim() !== "" || r.value !== ""));

/**
 * An editable list of name/value pairs: headers, query parameters, form
 * fields. Each row can be switched off without losing it, and an empty row is
 * always available at the end so typing never needs an "add" click.
 */
export function KeyValueEditor({
  rows,
  onChange,
  label,
  keyPlaceholder = "Name",
  valuePlaceholder = "Value",
  suggestions,
  toggle = true,
  monospace = true,
}: {
  rows: KvRow[];
  onChange: (rows: KvRow[]) => void;
  /** Used in each control's accessible name ("Header name", "Header value"). */
  label: string;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  suggestions?: string[];
  toggle?: boolean;
  monospace?: boolean;
}) {
  const listId = React.useId();
  const set = (id: string, patch: Partial<KvRow>) => onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const mono = monospace ? "font-mono" : "";
  return (
    <div className="space-y-2">
      {suggestions && (
        <datalist id={listId}>
          {suggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      )}
      {rows.map((r) => (
        <div key={r.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-2 @md:grid-cols-[auto_minmax(0,1fr)_minmax(0,1.4fr)_auto]">
          {toggle ? <Switch checked={r.enabled} onCheckedChange={(v) => set(r.id, { enabled: v })} aria-label={`Use this ${label.toLowerCase()}`} /> : <span aria-hidden="true" />}
          <TextInput aria-label={`${label} name`} list={suggestions ? listId : undefined} value={r.key} onChange={(e) => set(r.id, { key: e.target.value })} placeholder={keyPlaceholder} spellCheck={false} autoCapitalize="off" autoComplete="off" className={mono} />
          <Button type="button" variant="ghost" size="icon" aria-label={`Remove ${label.toLowerCase()}`} onClick={() => onChange(rows.filter((x) => x.id !== r.id))} className="@md:order-last">
            <Trash2 aria-hidden="true" />
          </Button>
          <TextInput aria-label={`${label} value`} value={r.value} onChange={(e) => set(r.id, { value: e.target.value })} placeholder={valuePlaceholder} spellCheck={false} autoCapitalize="off" autoComplete="off" className={`col-span-3 ${mono} @md:col-span-1`} />
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...rows, newRow()])}>
        <Plus aria-hidden="true" /> Add {label.toLowerCase()}
      </Button>
    </div>
  );
}

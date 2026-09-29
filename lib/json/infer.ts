/**
 * Types from JSON samples, the way quicktype and similar tools do it: every
 * item of an array is looked at (not just the first), keys missing from some
 * objects become optional, mixed values become unions, and objects with the
 * same shape share one type while different shapes get distinct names.
 */

type Prim = "string" | "integer" | "number" | "boolean" | "null";

interface Shape {
  prims: Set<Prim>;
  object: ObjShape | null;
  array: Shape | null;
  /** An array was seen, even if every one was empty. */
  sawArray: boolean;
}

interface ObjShape {
  seen: number;
  fields: Map<string, { shape: Shape; count: number }>;
}

const empty = (): Shape => ({ prims: new Set(), object: null, array: null, sawArray: false });

function add(shape: Shape, v: unknown): void {
  if (v === null) shape.prims.add("null");
  else if (typeof v === "string") shape.prims.add("string");
  else if (typeof v === "boolean") shape.prims.add("boolean");
  else if (typeof v === "number") shape.prims.add(Number.isInteger(v) ? "integer" : "number");
  else if (Array.isArray(v)) {
    shape.sawArray = true;
    for (const item of v) {
      shape.array ??= empty();
      add(shape.array, item);
    }
  } else if (typeof v === "object") {
    shape.object ??= { seen: 0, fields: new Map() };
    const o = shape.object;
    o.seen++;
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      let f = o.fields.get(k);
      if (!f) {
        f = { shape: empty(), count: 0 };
        o.fields.set(k, f);
      }
      f.count++;
      add(f.shape, val);
    }
  }
}

export function inferShape(value: unknown): Shape {
  const s = empty();
  add(s, value);
  return s;
}

// ── Names ──────────────────────────────────────────────────────────────────

export function pascalCase(s: string): string {
  const words = s
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean);
  let name = words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("");
  if (!name) name = "Item";
  if (/^\d/.test(name)) name = `T${name}`;
  return name;
}

/** "categories" → "Category", "addresses" → "Address", "data" → "DataItem". */
export function singular(name: string): string {
  if (/ies$/i.test(name) && name.length > 4) return name.slice(0, -3) + "y";
  if (/(ss|us|is)$/i.test(name)) return `${name}Item`;
  if (/(ses|xes|zes|ches|shes)$/i.test(name)) return name.slice(0, -2);
  if (/s$/i.test(name) && name.length > 2) return name.slice(0, -1);
  return `${name}Item`;
}

const IDENT = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
const propKey = (k: string) => (IDENT.test(k) ? k : JSON.stringify(k));

// ── Output ─────────────────────────────────────────────────────────────────

export type OutputKind = "interface" | "type" | "zod";

export interface EmitOptions {
  rootName: string;
  kind: OutputKind;
  readonly: boolean;
  /** Mark every field optional, not only the ones missing from some samples. */
  allOptional: boolean;
}

interface Decl {
  name: string;
  signature: string;
  fields: { key: string; type: string; zod: string; optional: boolean }[];
}

export interface Emitted {
  code: string;
  /** Names of the types produced, root first. */
  names: string[];
}

export function emit(value: unknown, o: EmitOptions): Emitted {
  const root = inferShape(value);
  const decls: Decl[] = [];
  const bySignature = new Map<string, string>();
  const used = new Set<string>();

  const uniqueName = (base: string) => {
    let name = base;
    for (let n = 2; used.has(name); n++) name = `${base}${n}`;
    used.add(name);
    return name;
  };

  /** Returns [TypeScript type, Zod schema] for a shape. */
  function typeOf(s: Shape, hint: string): [string, string] {
    const ts: string[] = [];
    const zod: string[] = [];
    const prims = new Set(s.prims);
    if (prims.has("integer") && prims.has("number")) prims.delete("integer");
    const both = (t: string, z: string) => {
      ts.push(t);
      zod.push(z);
    };
    if (prims.has("string")) both("string", "z.string()");
    if (prims.has("number")) both("number", "z.number()");
    if (prims.has("integer")) both("number", "z.number().int()");
    if (prims.has("boolean")) both("boolean", "z.boolean()");
    if (s.object) {
      const name = objectType(s.object, hint);
      ts.push(name);
      zod.push(`${name}Schema`);
    }
    if (s.sawArray) {
      const [inner, innerZod] = s.array ? typeOf(s.array, singular(hint)) : ["unknown", "z.unknown()"];
      ts.push(/[|&]/.test(inner) ? `(${inner})[]` : `${inner}[]`);
      zod.push(`z.array(${innerZod})`);
    }
    const nullable = prims.has("null");
    if (nullable) ts.push("null");
    if (!ts.length) return ["unknown", "z.unknown()"];
    const nonNullZod = zod.length === 0 ? "z.null()" : zod.length === 1 ? zod[0] : `z.union([${zod.join(", ")}])`;
    return [ts.join(" | "), nullable && zod.length ? `${nonNullZod}.nullable()` : nonNullZod];
  }

  function objectType(obj: ObjShape, hint: string): string {
    const fields = [...obj.fields.entries()].map(([key, f]) => {
      const [type, zod] = typeOf(f.shape, pascalCase(key));
      return { key, type, zod, optional: o.allOptional || f.count < obj.seen };
    });
    const signature = fields.map((f) => `${f.key}${f.optional ? "?" : ""}:${f.type}`).join(";");
    const existing = bySignature.get(signature);
    if (existing) return existing;
    const name = uniqueName(pascalCase(hint));
    bySignature.set(signature, name);
    decls.push({ name, signature, fields });
    return name;
  }

  const rootBase = pascalCase(o.rootName || "Root");
  let rootAlias: [string, string] | null = null;
  if (root.object && !root.sawArray && root.prims.size === 0) {
    objectType(root.object, rootBase);
  } else {
    // An array or a plain value at the top gets an alias: type Root = RootItem[].
    used.add(rootBase);
    rootAlias = typeOf(root, rootBase);
  }

  // Nested types are declared before the types that use them; show the root first for TypeScript.
  const ordered = [...decls].reverse();
  const ro = o.readonly ? "readonly " : "";
  let code: string;
  if (o.kind === "zod") {
    const parts = ['import { z } from "zod";', ""];
    for (const d of decls) {
      const body = d.fields.map((f) => `  ${propKey(f.key)}: ${f.zod}${f.optional ? ".optional()" : ""},`).join("\n");
      parts.push(`export const ${d.name}Schema = z.object({\n${body}\n})${o.readonly ? ".readonly()" : ""};`);
      parts.push(`export type ${d.name} = z.infer<typeof ${d.name}Schema>;`, "");
    }
    if (rootAlias) {
      parts.push(`export const ${rootBase}Schema = ${rootAlias[1]};`);
      parts.push(`export type ${rootBase} = z.infer<typeof ${rootBase}Schema>;`, "");
    }
    code = parts.join("\n").trimEnd();
  } else {
    const blocks: string[] = [];
    if (rootAlias) blocks.push(`export type ${rootBase} = ${rootAlias[0]};`);
    for (const d of ordered) {
      const body = d.fields.map((f) => `  ${ro}${propKey(f.key)}${f.optional ? "?" : ""}: ${f.type};`).join("\n");
      blocks.push(o.kind === "interface" ? `export interface ${d.name} {\n${body}\n}` : `export type ${d.name} = {\n${body}\n};`);
    }
    code = blocks.join("\n\n");
  }
  return { code, names: [...(rootAlias ? [rootBase] : []), ...ordered.map((d) => d.name)] };
}

/** JSON.parse with the line and column of the problem in the message. */
export function parseJson(input: string): { value: unknown } | { error: string } {
  try {
    return { value: JSON.parse(input) };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Invalid JSON";
    const pos = /position (\d+)/.exec(msg);
    if (pos) {
      const at = Number(pos[1]);
      const before = input.slice(0, at);
      const line = before.split("\n").length;
      const col = at - before.lastIndexOf("\n");
      return { error: `${msg.replace(/ in JSON at position \d+.*$/, "").replace(/\s*\(line \d+ column \d+\)$/, "")} — line ${line}, column ${col}.` };
    }
    return { error: msg };
  }
}

"use client";

import React, { useState } from "react";
import { Check, Minus } from "lucide-react";
import Link from "next/link";
import { CodeBlock } from "@/components/tool/code-block";
import { Chips, Segmented, ToolDivider, ToolSection } from "@/components/tool/kit";
import { HTTP_METHODS, METHOD_ADVICE, METHOD_FACTS, type HttpMethod } from "@/lib/http/methods";
import { getStatus } from "@/lib/http/status";
import { cn } from "@/lib/utils";

function Flag({ on, label }: { on: boolean; label: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 text-sm", on ? "font-medium text-success" : "text-muted-foreground")} aria-label={`${label}: ${on ? "yes" : "no"}`}>
      {on ? <Check aria-hidden="true" className="size-4" /> : <Minus aria-hidden="true" className="size-4" />}
      {on ? "Yes" : "No"}
    </span>
  );
}

const BODY: Record<HttpMethod["requestBody"], string> = { none: "No body", optional: "Optional", expected: "Expected" };
const CACHE: Record<HttpMethod["cacheable"], string> = { yes: "Yes", conditional: "Only with explicit freshness", no: "No" };

type Group = "main" | "webdav";

export default function HttpMethodReference() {
  const [group, setGroup] = useState<Group>("main");
  const [selected, setSelected] = useState("GET");
  const list = HTTP_METHODS.filter((m) => (group === "main" ? m.group !== "webdav" : m.group === "webdav"));
  const current = HTTP_METHODS.find((m) => m.name === selected && list.includes(m)) ?? list[0];

  return (
    <div className="space-y-8">
      <ToolSection title="Compare the methods" description="Safe, idempotent and cacheable, as RFC 9110 defines them. Select a method for details.">
        <Segmented
          ariaLabel="Method family"
          value={group}
          onChange={(g) => {
            setGroup(g);
            setSelected(HTTP_METHODS.find((m) => (g === "main" ? m.group !== "webdav" : m.group === "webdav"))!.name);
          }}
          options={[
            { value: "main", label: "Web and API methods" },
            { value: "webdav", label: "WebDAV" },
          ]}
        />
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full min-w-[34rem] text-left text-sm">
            <thead className="bg-muted text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-3 py-2 font-medium">Method</th>
                {METHOD_FACTS.map((f) => (
                  <th key={f.label} scope="col" className="px-3 py-2 font-medium" title={f.help}>
                    {f.label}
                  </th>
                ))}
                <th scope="col" className="px-3 py-2 font-medium">Request body</th>
                <th scope="col" className="px-3 py-2 font-medium">Typical use</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {list.map((m) => (
                <tr key={m.name} className={cn("transition-colors", m.name === current.name && "bg-brand-subtle/60")}>
                  <th scope="row" className="px-3 py-2 text-left">
                    <button type="button" onClick={() => setSelected(m.name)} aria-pressed={m.name === current.name} className="rounded font-mono text-sm font-semibold text-foreground underline-offset-4 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/50">
                      {m.name}
                    </button>
                  </th>
                  <td className="px-3 py-2">
                    <Flag on={m.safe} label="Safe" />
                  </td>
                  <td className="px-3 py-2">
                    <Flag on={m.idempotent} label="Idempotent" />
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{m.cacheable === "yes" ? <Flag on label="Cacheable" /> : m.cacheable === "no" ? <Flag on={false} label="Cacheable" /> : <span title={CACHE[m.cacheable]}>Conditional</span>}</td>
                  <td className="px-3 py-2 text-muted-foreground">{BODY[m.requestBody]}</td>
                  <td className="px-3 py-2 text-muted-foreground">{m.rest ?? m.purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ToolSection>

      <ToolDivider />

      <ToolSection title={current.name} description={current.purpose} actions={<span className="text-xs text-muted-foreground">{current.spec}</span>}>
        <Chips ariaLabel="Choose a method" value={current.name} onChange={setSelected} options={list.map((m) => ({ value: m.name, label: m.name }))} />
        <dl className="grid gap-3 @md:grid-cols-2 @2xl:grid-cols-4">
          {[
            { label: "Safe", value: <Flag on={current.safe} label="Safe" />, help: "Does not change anything on the server." },
            { label: "Idempotent", value: <Flag on={current.idempotent} label="Idempotent" />, help: "Repeating it leaves the same result, so retries are safe." },
            { label: "Cacheable", value: <span className="text-sm text-foreground">{CACHE[current.cacheable]}</span>, help: "Whether caches may store the response." },
            { label: "Request body", value: <span className="text-sm text-foreground">{BODY[current.requestBody]}</span>, help: "Whether a body is normally sent." },
          ].map((f) => (
            <div key={f.label} className="rounded-lg border bg-background px-3.5 py-3">
              <dt className="text-xs text-muted-foreground">{f.label}</dt>
              <dd className="mt-1">{f.value}</dd>
              <dd className="mt-1 text-xs text-muted-foreground">{f.help}</dd>
            </div>
          ))}
        </dl>
        <div>
          <h4 className="text-sm font-semibold text-foreground">Usual success responses</h4>
          <p className="mt-1 flex flex-wrap gap-1.5">
            {current.success.map((c) => (
              <Link key={c} href={`/tools/http-status-code-lookup#${c}`} className="rounded-full border bg-background px-2.5 py-1 text-xs text-foreground transition-colors hover:bg-muted outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                <span className="font-mono">{c}</span> {getStatus(c)?.name}
              </Link>
            ))}
          </p>
        </div>
        <ul className="list-disc space-y-1.5 pl-5 text-sm text-foreground">
          {current.notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
        <CodeBlock label="Example request" code={current.example} maxHeight="12rem" />
      </ToolSection>

      <ToolDivider />

      <ToolSection title="Which one should I use?">
        <div className="divide-y rounded-lg border">
          {METHOD_ADVICE.map((a) => (
            <div key={a.question} className="px-3.5 py-3">
              <h4 className="text-sm font-semibold text-foreground">{a.question}</h4>
              <p className="mt-1 text-sm text-muted-foreground">{a.answer}</p>
            </div>
          ))}
        </div>
      </ToolSection>
    </div>
  );
}

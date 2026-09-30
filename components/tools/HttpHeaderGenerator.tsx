"use client";

import React, { useId, useMemo, useState } from "react";
import { CodeBlock } from "@/components/tool/code-block";
import { Chips, Field, Notice, OptionCards, SelectInput, Segmented, TextInput, ToggleRow, ToolDivider, ToolSection, UnitInput } from "@/components/tool/kit";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import {
  CACHE_PRESETS,
  CSP_DIRECTIVES,
  CSP_PRESETS,
  DEFAULT_CORS,
  DEFAULT_SECURITY,
  PERMISSION_FEATURES,
  REFERRER_POLICIES,
  TARGETS,
  cacheRecipe,
  corsRecipe,
  cspRecipe,
  downloadRecipe,
  renderHeaders,
  securityRecipe,
  type CacheOptions,
  type CorsOptions,
  type CspValues,
  type DownloadOptions,
  type Recipe,
  type SecurityOptions,
  type Target,
} from "@/lib/http/header-gen";

type Kind = "security" | "cors" | "cache" | "csp" | "download";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

function num(v: string): number | null {
  if (v.trim() === "") return null;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function SecurityForm({ o, set }: { o: SecurityOptions; set: (o: SecurityOptions) => void }) {
  const id = useId();
  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <ToggleRow id={`${id}-hsts`} label="Strict-Transport-Security (HSTS)" description="Browsers use only HTTPS for your site after the first visit." checked={o.hsts} onCheckedChange={(hsts) => set({ ...o, hsts })} />
        {o.hsts && (
          <div className="grid gap-4 border-l-2 pl-4 @md:grid-cols-2">
            <Field label="max-age" htmlFor={`${id}-age`} hint="Seconds. 31536000 is one year, 63072000 two.">
              <UnitInput id={`${id}-age`} type="number" min={0} unit="seconds" value={o.hstsMaxAge} onChange={(e) => set({ ...o, hstsMaxAge: Number(e.target.value) || 0 })} />
            </Field>
            <div className="space-y-3">
              <ToggleRow id={`${id}-sub`} label="includeSubDomains" checked={o.hstsSubdomains} onCheckedChange={(hstsSubdomains) => set({ ...o, hstsSubdomains })} />
              <ToggleRow id={`${id}-pre`} label="preload" description="Only after testing: this is very hard to undo." checked={o.hstsPreload} onCheckedChange={(hstsPreload) => set({ ...o, hstsPreload })} />
            </div>
          </div>
        )}
      </div>
      <ToggleRow id={`${id}-nosniff`} label="X-Content-Type-Options: nosniff" description="Stops browsers from guessing file types." checked={o.nosniff} onCheckedChange={(nosniff) => set({ ...o, nosniff })} />
      <Field label="Framing (clickjacking)" htmlFor={`${id}-frame`}>
        <SelectInput id={`${id}-frame`} value={o.frame} onChange={(e) => set({ ...o, frame: e.target.value as SecurityOptions["frame"] })}>
          <option value="SAMEORIGIN">SAMEORIGIN — only your own site may embed it</option>
          <option value="DENY">DENY — nobody may embed it</option>
          <option value="off">Don&apos;t send X-Frame-Options</option>
        </SelectInput>
      </Field>
      <Field label="Referrer-Policy" htmlFor={`${id}-ref`} hint="How much of the URL is shared when someone follows a link from your page.">
        <SelectInput id={`${id}-ref`} value={o.referrer} onChange={(e) => set({ ...o, referrer: e.target.value })}>
          {REFERRER_POLICIES.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
          <option value="">Don&apos;t send Referrer-Policy</option>
        </SelectInput>
      </Field>
      <Field label="Permissions-Policy: turn these browser features off" hint="Turn off what your site does not use.">
        <div role="group" aria-label="Features to disable" className="flex flex-wrap gap-1.5">
          {PERMISSION_FEATURES.map((f) => {
            const on = o.disabledFeatures.includes(f);
            return (
              <button
                key={f}
                type="button"
                aria-pressed={on}
                onClick={() => set({ ...o, disabledFeatures: on ? o.disabledFeatures.filter((x) => x !== f) : [...o.disabledFeatures, f] })}
                className={`h-7 rounded-full border px-3 text-xs font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${on ? "border-primary/50 bg-brand-subtle text-brand-subtle-foreground" : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"}`}
              >
                {f}
              </button>
            );
          })}
        </div>
      </Field>
      <div className="grid gap-4 @md:grid-cols-3">
        <Field label="Cross-Origin-Opener-Policy" htmlFor={`${id}-coop`}>
          <SelectInput id={`${id}-coop`} value={o.coop} onChange={(e) => set({ ...o, coop: e.target.value as SecurityOptions["coop"] })}>
            <option value="off">Not set</option>
            <option value="same-origin">same-origin</option>
            <option value="same-origin-allow-popups">same-origin-allow-popups</option>
            <option value="unsafe-none">unsafe-none</option>
          </SelectInput>
        </Field>
        <Field label="Cross-Origin-Resource-Policy" htmlFor={`${id}-corp`}>
          <SelectInput id={`${id}-corp`} value={o.corp} onChange={(e) => set({ ...o, corp: e.target.value as SecurityOptions["corp"] })}>
            <option value="off">Not set</option>
            <option value="same-origin">same-origin</option>
            <option value="same-site">same-site</option>
            <option value="cross-origin">cross-origin</option>
          </SelectInput>
        </Field>
        <Field label="Cross-Origin-Embedder-Policy" htmlFor={`${id}-coep`}>
          <SelectInput id={`${id}-coep`} value={o.coep} onChange={(e) => set({ ...o, coep: e.target.value as SecurityOptions["coep"] })}>
            <option value="off">Not set</option>
            <option value="require-corp">require-corp</option>
            <option value="credentialless">credentialless</option>
          </SelectInput>
        </Field>
      </div>
    </div>
  );
}

function CorsForm({ o, set }: { o: CorsOptions; set: (o: CorsOptions) => void }) {
  const id = useId();
  return (
    <div className="space-y-5">
      <Field label="Allowed origin" htmlFor={`${id}-origin`} hint="One origin: scheme, host and port, no path. Use * only for public data.">
        <TextInput id={`${id}-origin`} value={o.origin} onChange={(e) => set({ ...o, origin: e.target.value })} placeholder="https://app.example.com" spellCheck={false} className="font-mono" />
        <div className="mt-2">
          <Chips ariaLabel="Quick origins" value={o.origin} onChange={(origin) => set({ ...o, origin })} options={[{ value: "*", label: "* (any site)" }, { value: "https://app.example.com", label: "One site" }, { value: "http://localhost:3000", label: "localhost:3000" }]} />
        </div>
      </Field>
      <Field label="Allowed methods">
        <div role="group" aria-label="Allowed methods" className="flex flex-wrap gap-1.5">
          {METHODS.map((m) => {
            const on = o.methods.includes(m);
            return (
              <button
                key={m}
                type="button"
                aria-pressed={on}
                onClick={() => set({ ...o, methods: on ? o.methods.filter((x) => x !== m) : [...o.methods, m] })}
                className={`h-7 rounded-full border px-3 font-mono text-xs font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${on ? "border-primary/50 bg-brand-subtle text-brand-subtle-foreground" : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground"}`}
              >
                {m}
              </button>
            );
          })}
        </div>
      </Field>
      <div className="grid gap-4 @md:grid-cols-2">
        <Field label="Allowed request headers" htmlFor={`${id}-ah`} hint="Headers your frontend sends beyond the basics (Content-Type for JSON, Authorization…).">
          <TextInput id={`${id}-ah`} value={o.allowHeaders} onChange={(e) => set({ ...o, allowHeaders: e.target.value })} spellCheck={false} className="font-mono" />
        </Field>
        <Field label="Response headers scripts may read" htmlFor={`${id}-eh`} hint="Optional. For example X-Request-Id, ETag.">
          <TextInput id={`${id}-eh`} value={o.exposeHeaders} onChange={(e) => set({ ...o, exposeHeaders: e.target.value })} spellCheck={false} className="font-mono" />
        </Field>
      </div>
      <div className="grid gap-4 @md:grid-cols-2">
        <ToggleRow id={`${id}-cred`} label="Allow credentials (cookies)" description="Needed when the page sends cookies or an Authorization header with credentials: include." checked={o.credentials} onCheckedChange={(credentials) => set({ ...o, credentials })} />
        <Field label="Cache preflight for" htmlFor={`${id}-maxage`}>
          <UnitInput id={`${id}-maxage`} type="number" min={0} unit="seconds" value={o.maxAge} onChange={(e) => set({ ...o, maxAge: Number(e.target.value) || 0 })} />
        </Field>
      </div>
    </div>
  );
}

function CacheForm({ o, set }: { o: CacheOptions; set: (o: CacheOptions) => void }) {
  const id = useId();
  const matching = CACHE_PRESETS.find((p) => JSON.stringify(p.options) === JSON.stringify(o))?.id ?? null;
  return (
    <div className="space-y-5">
      <Field label="Start from">
        <OptionCards ariaLabel="Caching preset" value={(matching ?? "") as string} onChange={(id) => set(CACHE_PRESETS.find((p) => p.id === id)!.options)} options={CACHE_PRESETS.map((p) => ({ value: p.id, label: p.label, description: p.description }))} className="@xl:grid-cols-2" />
      </Field>
      <div className="grid gap-4 @md:grid-cols-2">
        <Field label="Who may cache it" htmlFor={`${id}-scope`}>
          <SelectInput id={`${id}-scope`} value={o.scope} onChange={(e) => set({ ...o, scope: e.target.value as CacheOptions["scope"] })}>
            <option value="unset">Leave to defaults</option>
            <option value="public">public — browsers and CDNs</option>
            <option value="private">private — only the user&apos;s browser</option>
          </SelectInput>
        </Field>
        <Field label="max-age (browser)" htmlFor={`${id}-age`}>
          <UnitInput id={`${id}-age`} type="number" min={0} unit="seconds" value={o.maxAge ?? ""} placeholder="not set" onChange={(e) => set({ ...o, maxAge: num(e.target.value) })} />
        </Field>
        <Field label="s-maxage (CDN / shared cache)" htmlFor={`${id}-sage`}>
          <UnitInput id={`${id}-sage`} type="number" min={0} unit="seconds" value={o.sMaxAge ?? ""} placeholder="not set" onChange={(e) => set({ ...o, sMaxAge: num(e.target.value) })} />
        </Field>
        <Field label="stale-while-revalidate" htmlFor={`${id}-swr`} hint="Serve an old copy while a new one loads.">
          <UnitInput id={`${id}-swr`} type="number" min={0} unit="seconds" value={o.staleWhileRevalidate ?? ""} placeholder="not set" onChange={(e) => set({ ...o, staleWhileRevalidate: num(e.target.value) })} />
        </Field>
      </div>
      <div className="grid gap-3 @md:grid-cols-2">
        <ToggleRow id={`${id}-nc`} label="no-cache" description="Store it, but revalidate before every use." checked={o.noCache} onCheckedChange={(noCache) => set({ ...o, noCache })} />
        <ToggleRow id={`${id}-ns`} label="no-store" description="Never store it anywhere." checked={o.noStore} onCheckedChange={(noStore) => set({ ...o, noStore })} />
        <ToggleRow id={`${id}-mr`} label="must-revalidate" description="Never serve it stale, even on errors." checked={o.mustRevalidate} onCheckedChange={(mustRevalidate) => set({ ...o, mustRevalidate })} />
        <ToggleRow id={`${id}-im`} label="immutable" description="The content never changes while fresh." checked={o.immutable} onCheckedChange={(immutable) => set({ ...o, immutable })} />
      </div>
    </div>
  );
}

function CspForm({ values, set, upgrade, setUpgrade, reportOnly, setReportOnly, reportUri, setReportUri }: { values: CspValues; set: (v: CspValues) => void; upgrade: boolean; setUpgrade: (v: boolean) => void; reportOnly: boolean; setReportOnly: (v: boolean) => void; reportUri: string; setReportUri: (v: string) => void }) {
  const id = useId();
  return (
    <div className="space-y-5">
      <Field label="Start from">
        <OptionCards
          ariaLabel="CSP preset"
          value={(CSP_PRESETS.find((p) => JSON.stringify(p.values) === JSON.stringify(values))?.id ?? "") as string}
          onChange={(pid) => {
            const p = CSP_PRESETS.find((x) => x.id === pid)!;
            set(p.values);
            setUpgrade(p.upgrade);
          }}
          options={CSP_PRESETS.map((p) => ({ value: p.id, label: p.label, description: p.description }))}
          className="@xl:grid-cols-2"
        />
      </Field>
      <div className="space-y-3">
        {CSP_DIRECTIVES.map((d) => (
          <Field key={d.name} label={<span className="font-mono text-[13px]">{d.name}</span>} htmlFor={`${id}-${d.name}`} hint={d.help}>
            <TextInput id={`${id}-${d.name}`} value={values[d.name] ?? ""} onChange={(e) => set({ ...values, [d.name]: e.target.value })} placeholder="not set" spellCheck={false} autoCapitalize="off" className="font-mono" />
          </Field>
        ))}
      </div>
      <div className="grid gap-3 @md:grid-cols-2">
        <ToggleRow id={`${id}-up`} label="upgrade-insecure-requests" description="Loads http:// resources over https://." checked={upgrade} onCheckedChange={setUpgrade} />
        <ToggleRow id={`${id}-ro`} label="Report-only mode" description="Report violations without blocking. Use it to test a new policy." checked={reportOnly} onCheckedChange={setReportOnly} />
      </div>
      <Field label="Report violations to (optional)" htmlFor={`${id}-ru`} hint="A URL that accepts CSP reports.">
        <TextInput id={`${id}-ru`} value={reportUri} onChange={(e) => setReportUri(e.target.value)} placeholder="https://example.com/csp-reports" spellCheck={false} className="font-mono" />
      </Field>
    </div>
  );
}

function DownloadForm({ o, set }: { o: DownloadOptions; set: (o: DownloadOptions) => void }) {
  const id = useId();
  return (
    <div className="space-y-5">
      <Field label="What should the browser do?">
        <Segmented ariaLabel="Disposition" value={o.disposition} onChange={(disposition) => set({ ...o, disposition })} options={[{ value: "attachment", label: "Download it" }, { value: "inline", label: "Show it in the page" }]} />
      </Field>
      <div className="grid gap-4 @md:grid-cols-2">
        <Field label="File name" htmlFor={`${id}-name`} hint="Non-ASCII names are handled with the UTF-8 form.">
          <TextInput id={`${id}-name`} value={o.filename} onChange={(e) => set({ ...o, filename: e.target.value })} placeholder="report.pdf" spellCheck={false} />
        </Field>
        <Field label="Content-Type" htmlFor={`${id}-ct`}>
          <TextInput id={`${id}-ct`} value={o.contentType} onChange={(e) => set({ ...o, contentType: e.target.value })} placeholder="application/pdf" spellCheck={false} className="font-mono" />
        </Field>
      </div>
      <ToggleRow id={`${id}-ns`} label="X-Content-Type-Options: nosniff" description="Recommended for downloads, so the browser trusts the Content-Type." checked={o.nosniff} onCheckedChange={(nosniff) => set({ ...o, nosniff })} />
    </div>
  );
}

export default function HttpHeaderGenerator() {
  const id = useId();
  const [kind, setKind] = useState<Kind>("security");
  const [target, setTarget] = usePersistentState<Target>("header-gen-target", "nginx");
  const [security, setSecurity] = usePersistentState<SecurityOptions>("header-gen-security", DEFAULT_SECURITY);
  const [cors, setCors] = usePersistentState<CorsOptions>("header-gen-cors", DEFAULT_CORS);
  const [cache, setCache] = usePersistentState<CacheOptions>("header-gen-cache", CACHE_PRESETS[0].options);
  const [csp, setCsp] = usePersistentState<CspValues>("header-gen-csp", CSP_PRESETS[0].values);
  const [upgrade, setUpgrade] = usePersistentState<boolean>("header-gen-csp-up", true);
  const [reportOnly, setReportOnly] = useState(false);
  const [reportUri, setReportUri] = useState("");
  const [download, setDownload] = usePersistentState<DownloadOptions>("header-gen-download", { disposition: "attachment", filename: "report.pdf", contentType: "application/pdf", nosniff: true });

  const recipe: Recipe = useMemo(() => {
    switch (kind) {
      case "security":
        return securityRecipe(security);
      case "cors":
        return corsRecipe(cors);
      case "cache":
        return cacheRecipe(cache);
      case "csp":
        return cspRecipe(csp, { upgrade, reportOnly, reportUri });
      case "download":
        return downloadRecipe(download);
    }
  }, [kind, security, cors, cache, csp, upgrade, reportOnly, reportUri, download]);

  const rendered = useMemo(() => renderHeaders(recipe.headers, target), [recipe, target]);
  const targetInfo = TARGETS.find((t) => t.id === target)!;

  return (
    <div className="space-y-8">
      <Segmented
        ariaLabel="Which headers?"
        value={kind}
        onChange={setKind}
        options={[
          { value: "security", label: "Security" },
          { value: "cors", label: "CORS" },
          { value: "cache", label: "Caching" },
          { value: "csp", label: "CSP" },
          { value: "download", label: "Downloads" },
        ]}
      />

      <ToolSection title="Options">
        {kind === "security" && <SecurityForm o={security} set={setSecurity} />}
        {kind === "cors" && <CorsForm o={cors} set={setCors} />}
        {kind === "cache" && <CacheForm o={cache} set={setCache} />}
        {kind === "csp" && <CspForm values={csp} set={setCsp} upgrade={upgrade} setUpgrade={setUpgrade} reportOnly={reportOnly} setReportOnly={setReportOnly} reportUri={reportUri} setReportUri={setReportUri} />}
        {kind === "download" && <DownloadForm o={download} set={setDownload} />}
      </ToolSection>

      <ToolDivider />

      <ToolSection title="Your headers">
        <Field label="Format for" htmlFor={`${id}-target`} hint={targetInfo.file ? `Goes in: ${targetInfo.file}` : undefined}>
          <SelectInput id={`${id}-target`} value={target} onChange={(e) => setTarget(e.target.value as Target)}>
            {TARGETS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </SelectInput>
        </Field>
        <CodeBlock label={targetInfo.label} code={rendered.code} empty="Choose at least one option to generate headers." wrap={target === "raw"} />
        {recipe.warnings.map((w) => (
          <Notice key={w} tone="warning">
            {w}
          </Notice>
        ))}
        {rendered.notes.map((n) => (
          <Notice key={n} tone="info">
            {n}
          </Notice>
        ))}
      </ToolSection>
    </div>
  );
}

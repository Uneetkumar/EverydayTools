"use client";

import React, { useEffect, useId, useMemo, useState } from "react";
import { Bot, Cpu, Globe, Laptop, Layers, MonitorSmartphone, Smartphone, Tablet, Tv } from "lucide-react";
import { toast } from "sonner";
import { CodeBlock } from "@/components/tool/code-block";
import { Field, Notice, Segmented, TextArea, ToolDivider, ToolSection } from "@/components/tool/kit";
import { Button } from "@/components/ui/button";
import { SAMPLE_USER_AGENTS, explainUserAgent, parseUserAgent, type DeviceType, type ParsedUserAgent } from "@/lib/http/ua";
import { copyText } from "@/lib/utils/clipboard";

interface UAData {
  brands?: { brand: string; version: string }[];
  mobile?: boolean;
  platform?: string;
  getHighEntropyValues?: (hints: string[]) => Promise<Record<string, unknown>>;
}

const DEVICE_LABEL: Record<DeviceType, string> = {
  desktop: "Desktop or laptop",
  mobile: "Mobile phone",
  tablet: "Tablet",
  tv: "Smart TV",
  console: "Game console",
  wearable: "Wearable",
  bot: "Crawler / bot",
  library: "HTTP library or tool",
  unknown: "Unknown",
};

const DEVICE_ICON: Record<DeviceType, React.ComponentType<{ className?: string }>> = {
  desktop: Laptop,
  mobile: Smartphone,
  tablet: Tablet,
  tv: Tv,
  console: MonitorSmartphone,
  wearable: MonitorSmartphone,
  bot: Bot,
  library: Bot,
  unknown: MonitorSmartphone,
};

const BOT_KIND: Record<NonNullable<ParsedUserAgent["bot"]>["kind"], string> = {
  search: "Search engine crawler",
  ai: "AI / data crawler",
  social: "Link-preview bot",
  seo: "SEO tool crawler",
  monitor: "Monitoring or testing tool",
  library: "API client or command-line tool",
  other: "Automated client",
};

function Tile({ icon: Icon, label, value, detail }: { icon: React.ComponentType<{ className?: string }>; label: string; value: React.ReactNode; detail?: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-lg border bg-background px-3.5 py-3">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Icon className="size-3.5" aria-hidden />
        {label}
      </div>
      <div className="mt-1 truncate text-base font-semibold text-foreground">{value}</div>
      {detail && <div className="mt-0.5 truncate text-xs text-muted-foreground">{detail}</div>}
    </div>
  );
}

const part = (p: { name: string; version?: string }) => (p.name === "Unknown" ? "Unknown" : p.version ? `${p.name} ${p.version}` : p.name);

export default function UserAgentParser() {
  const id = useId();
  const [mode, setMode] = useState<"one" | "many">("one");
  const [ua, setUa] = useState("");
  const [many, setMany] = useState("");
  const [mine, setMine] = useState("");
  const [hints, setHints] = useState<Record<string, unknown> | null>(null);

  // Start with the visitor's own browser, which is what most people want to see.
  useEffect(() => {
    const t = setTimeout(() => {
      const own = navigator.userAgent;
      setMine(own);
      setUa((cur) => cur || own);
    }, 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const data = (navigator as unknown as { userAgentData?: UAData }).userAgentData;
    if (!data?.getHighEntropyValues || ua !== mine || !mine) return;
    let cancelled = false;
    data
      .getHighEntropyValues(["architecture", "bitness", "model", "platformVersion", "uaFullVersion", "fullVersionList", "wow64"])
      .then((v) => !cancelled && setHints({ ...v, brands: data.brands, mobile: data.mobile, platform: data.platform }))
      .catch(() => !cancelled && setHints(null));
    return () => {
      cancelled = true;
    };
  }, [ua, mine]);

  const parsed = useMemo(() => parseUserAgent(ua), [ua]);
  const tokens = useMemo(() => (ua.trim() ? explainUserAgent(ua.trim()) : []), [ua]);
  const rows = useMemo(() => many.split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 500).map((l) => ({ raw: l, p: parseUserAgent(l) })), [many]);

  const windows11 = useMemo(() => {
    const v = hints?.platformVersion;
    if (parsed.os.name === "Windows" && typeof v === "string") return Number(v.split(".")[0]) >= 13 ? "Windows 11" : "Windows 10";
    return null;
  }, [hints, parsed.os.name]);

  const csv = useMemo(() => {
    const esc = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
    return ["browser,browser_version,engine,os,os_version,device_type,bot,user_agent", ...rows.map(({ raw, p }) => [p.browser.name, p.browser.version ?? "", p.engine.name, p.os.name, p.os.version ?? "", p.device.type, p.bot?.name ?? "", raw].map(esc).join(","))].join("\n");
  }, [rows]);

  const DevIcon = DEVICE_ICON[parsed.device.type];
  const deviceName = [parsed.device.vendor, parsed.device.model].filter(Boolean).join(" ");

  return (
    <div className="space-y-8">
      <Segmented ariaLabel="How many?" value={mode} onChange={setMode} options={[{ value: "one", label: "One User-Agent" }, { value: "many", label: "Many at once" }]} />

      {mode === "one" ? (
        <>
          <ToolSection title="User-Agent string" description="Paste a User-Agent header or navigator.userAgent value. It starts with your own browser's.">
            <Field label="User-Agent" htmlFor={`${id}-ua`}>
              <TextArea id={`${id}-ua`} rows={3} value={ua} onChange={(e) => setUa(e.target.value)} placeholder="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 …" spellCheck={false} className="font-mono" />
            </Field>
            <div className="flex flex-wrap items-center gap-1.5">
              {mine && ua !== mine && (
                <Button type="button" variant="outline" size="sm" onClick={() => setUa(mine)}>
                  Use my browser
                </Button>
              )}
              <span className="mx-1 text-xs text-muted-foreground">Try</span>
              {SAMPLE_USER_AGENTS.map((s) => (
                <button key={s.label} type="button" onClick={() => setUa(s.ua)} className="rounded-full border bg-background px-2.5 py-1 text-xs text-foreground transition-colors hover:bg-muted outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50">
                  {s.label}
                </button>
              ))}
            </div>
          </ToolSection>

          {ua.trim() ? (
            <>
              <ToolDivider />
              <ToolSection title="What it says">
                {parsed.bot && (
                  <Notice tone="info">
                    <strong className="font-semibold">{parsed.bot.name}</strong> — {BOT_KIND[parsed.bot.kind]}
                    {parsed.bot.operator ? `, operated by ${parsed.bot.operator}` : ""}. This is not a person using a browser.
                  </Notice>
                )}
                <div className="grid gap-2.5 @xl:grid-cols-2 @3xl:grid-cols-3">
                  <Tile icon={Globe} label={parsed.bot ? "Client" : "Browser"} value={part(parsed.browser)} detail={parsed.inApp ? `inside the ${parsed.inApp} app` : undefined} />
                  <Tile icon={Layers} label="Rendering engine" value={part(parsed.engine)} />
                  <Tile icon={Laptop} label="Operating system" value={windows11 ?? part(parsed.os)} detail={windows11 ? "confirmed by Client Hints" : undefined} />
                  <Tile icon={DevIcon} label="Device" value={DEVICE_LABEL[parsed.device.type]} detail={deviceName || undefined} />
                  <Tile icon={Cpu} label="Processor" value={parsed.cpu ?? "Not stated"} />
                </div>
                {parsed.notes.map((n) => (
                  <Notice key={n} tone="info">
                    {n}
                  </Notice>
                ))}
              </ToolSection>

              {tokens.length > 0 && (
                <ToolSection title="Reading the string, piece by piece" description="Why every User-Agent starts with “Mozilla/5.0” and mentions engines it isn't.">
                  <div className="overflow-x-auto rounded-lg border">
                    <table className="w-full min-w-[32rem] text-left text-sm">
                      <thead className="bg-muted text-xs text-muted-foreground">
                        <tr>
                          <th scope="col" className="px-3 py-2 font-medium">Part</th>
                          <th scope="col" className="px-3 py-2 font-medium">Meaning</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {tokens.map((t, i) => (
                          <tr key={`${t.text}-${i}`} className="align-top">
                            <td className="px-3 py-2 font-mono text-[13px] break-all text-foreground">{t.text}</td>
                            <td className="px-3 py-2 text-muted-foreground">{t.meaning || "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </ToolSection>
              )}

              {hints && ua === mine && (
                <ToolSection title="What your browser reports through Client Hints" description="The modern replacement for the User-Agent string: structured, and more accurate where the string is frozen. Shown for your own browser only.">
                  <dl className="divide-y rounded-lg border text-sm">
                    {[
                      ["Platform", hints.platform],
                      ["Platform version", hints.platformVersion],
                      ["Architecture", hints.architecture ? `${hints.architecture}${hints.bitness ? `, ${hints.bitness}-bit` : ""}` : undefined],
                      ["Device model", hints.model],
                      ["Mobile", typeof hints.mobile === "boolean" ? (hints.mobile ? "Yes" : "No") : undefined],
                      ["Full browser version", hints.uaFullVersion],
                      ["Brands", Array.isArray(hints.brands) ? (hints.brands as { brand: string; version: string }[]).map((b) => `${b.brand} ${b.version}`).join(", ") : undefined],
                    ]
                      .filter(([, v]) => v !== undefined && v !== "")
                      .map(([k, v]) => (
                        <div key={String(k)} className="grid gap-1 px-3.5 py-2 @md:grid-cols-[11rem_1fr] @md:gap-4">
                          <dt className="text-muted-foreground">{String(k)}</dt>
                          <dd className="font-mono text-[13px] break-all text-foreground">{String(v)}</dd>
                        </div>
                      ))}
                  </dl>
                </ToolSection>
              )}

              <ToolSection title="Use it in code">
                <CodeBlock
                  label="JavaScript"
                  code={`// Browser: the same string this page is parsing\nnavigator.userAgent;\n\n// Node.js / Express: from the request\nconst ua = req.get('user-agent');`}
                  maxHeight="10rem"
                />
              </ToolSection>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Paste a User-Agent string above.</p>
          )}
        </>
      ) : (
        <>
          <ToolSection title="User-Agent strings, one per line" description="Paste a column from an access log to see what visits your site. Up to 500 lines.">
            <Field label="User-Agents" htmlFor={`${id}-many`}>
              <TextArea id={`${id}-many`} rows={8} value={many} onChange={(e) => setMany(e.target.value)} placeholder={SAMPLE_USER_AGENTS.slice(0, 3).map((s) => s.ua).join("\n")} spellCheck={false} className="font-mono" wrap="off" />
            </Field>
            <div>
              <Button type="button" variant="outline" size="sm" onClick={() => setMany(SAMPLE_USER_AGENTS.map((s) => s.ua).join("\n"))}>
                Fill with examples
              </Button>
            </div>
          </ToolSection>
          {rows.length > 0 && (
            <>
              <ToolDivider />
              <ToolSection
                title={`${rows.length} parsed`}
                actions={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      if (await copyText(csv)) toast.success("CSV copied");
                    }}
                  >
                    Copy as CSV
                  </Button>
                }
              >
                <div className="max-h-[28rem] overflow-auto rounded-lg border">
                  <table className="w-full min-w-[38rem] text-left text-sm">
                    <thead className="sticky top-0 bg-muted text-xs text-muted-foreground">
                      <tr>
                        <th scope="col" className="px-3 py-2 font-medium">Browser / client</th>
                        <th scope="col" className="px-3 py-2 font-medium">OS</th>
                        <th scope="col" className="px-3 py-2 font-medium">Device</th>
                        <th scope="col" className="px-3 py-2 font-medium">Engine</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {rows.map(({ raw, p }, i) => (
                        <tr key={`${i}-${raw.slice(0, 20)}`}>
                          <td className="px-3 py-2 text-foreground" title={raw}>
                            {part(p.browser)}
                            {p.bot && <span className="ml-1.5 rounded border px-1 text-[11px] text-muted-foreground">bot</span>}
                          </td>
                          <td className="px-3 py-2 text-muted-foreground">{part(p.os)}</td>
                          <td className="px-3 py-2 text-muted-foreground">{DEVICE_LABEL[p.device.type]}</td>
                          <td className="px-3 py-2 text-muted-foreground">{part(p.engine)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ToolSection>
            </>
          )}
        </>
      )}
    </div>
  );
}

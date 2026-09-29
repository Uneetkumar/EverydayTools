"use client";

import React, { useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Copy, Download, ExternalLink, QrCode, RotateCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Chips,
  Field,
  Notice,
  Segmented,
  Stat,
  StatGrid,
  TextInput,
  ToggleRow,
  ToolDivider,
  ToolSection,
} from "@/components/tool/kit";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import { copyText } from "@/lib/utils/clipboard";
import { downloadText } from "@/lib/utils/download";
import { markToolCompleted } from "@/lib/analytics";
import { sendToTool } from "@/lib/tools/handoff";
import { TRACKERS, cleanUrl, paramKind, queryParams } from "@/lib/url/tracking";
import {
  COMMON_SOURCES,
  KNOWN_MEDIUMS,
  UTM_FIELDS,
  UTM_KEYS,
  UTM_PRESETS,
  buildUtmUrl,
  cleanPastedValue,
  formatValue,
  ga4Channel,
  parseBaseUrl,
  readUtm,
  trackersIn,
  type SpaceStyle,
  type UtmKey,
} from "@/lib/url/utm";
import { cn } from "@/lib/utils";

type Values = Record<UtmKey, string>;

const EMPTY: Values = Object.fromEntries(UTM_KEYS.map((k) => [k, ""])) as Values;

interface SavedLink {
  url: string;
  source: string;
  medium: string;
  campaign: string;
  content: string;
  term: string;
  at: number;
}

const HISTORY_MAX = 25;

/** The link with its tags set apart, so the tags can be checked at a glance. */
function LinkPreview({ url }: { url: string }) {
  const q = url.indexOf("?");
  const hash = url.indexOf("#");
  const end = hash >= 0 ? hash : url.length;
  if (q < 0 || q > end) return <span className="text-muted-foreground">{url}</span>;
  const pairs = url.slice(q + 1, end).split("&");
  return (
    <>
      <span className="text-muted-foreground">{url.slice(0, q)}</span>
      {pairs.map((pair, i) => {
        const eq = pair.indexOf("=");
        const key = eq < 0 ? pair : pair.slice(0, eq);
        const isUtm = key.toLowerCase().startsWith("utm_");
        return (
          <React.Fragment key={i}>
            <span className="text-muted-foreground">{i === 0 ? "?" : "&"}</span>
            <span className={isUtm ? "font-semibold text-foreground" : "text-muted-foreground"}>{key}</span>
            {eq >= 0 && (
              <>
                <span className="text-muted-foreground">=</span>
                <span className={isUtm ? "text-brand-subtle-foreground" : "text-muted-foreground"}>{pair.slice(eq + 1)}</span>
              </>
            )}
          </React.Fragment>
        );
      })}
      {hash >= 0 && <span className="text-muted-foreground">{url.slice(hash)}</span>}
    </>
  );
}

function ChannelCard({ source, medium, campaign }: { source: string; medium: string; campaign: string }) {
  const { channel, why } = ga4Channel(source, medium, campaign);
  const unassigned = channel === "Unassigned";
  return (
    <div className={cn("rounded-lg border px-3.5 py-3", unassigned ? "border-warning/30 bg-warning/5" : "bg-muted/40")}>
      <p className="text-xs text-muted-foreground">Google Analytics 4 channel</p>
      <p className={cn("mt-0.5 text-base font-semibold", unassigned ? "text-warning" : "text-foreground")}>{channel}</p>
      <p className="mt-0.5 text-sm text-muted-foreground">
        {unassigned ? why : `Because ${why}`}
        {unassigned && medium ? ` Try one Google recognises: ${KNOWN_MEDIUMS.slice(0, 6).join(", ")}.` : ""}
      </p>
    </div>
  );
}

export default function UtmBuilder() {
  const id = useId();
  const router = useRouter();
  const [mode, setMode] = useState<"build" | "check">("build");
  const [url, setUrl] = useState("");
  const [values, setValues] = useState<Values>(EMPTY);
  const [preset, setPreset] = useState<string | null>(null);
  const [readCount, setReadCount] = useState(0);
  const [showMore, setShowMore] = useState(false);
  const [format, setFormat] = usePersistentState<{ lowercase: boolean; spaces: SpaceStyle }>("utm-format", {
    lowercase: true,
    spaces: "_",
  });
  const [history, setHistory] = usePersistentState<SavedLink[]>("utm-history", []);
  const [checkInput, setCheckInput] = useState("");
  const [keepTags, setKeepTags] = useState(false);

  const base = useMemo(() => (url.trim() ? parseBaseUrl(url) : null), [url]);
  const formatted = useMemo(
    () => Object.fromEntries(UTM_KEYS.map((k) => [k, formatValue(values[k], format)])) as Values,
    [values, format]
  );
  const missing = (["utm_source", "utm_medium", "utm_campaign"] as UtmKey[]).filter((k) => !formatted[k]);
  const output = base && "url" in base ? buildUtmUrl(base.url, formatted) : "";
  const droppedIds = base && "url" in base ? trackersIn(base.url) : [];
  const ready = !!output && missing.length === 0;

  // Checks that catch the mistakes that most often spoil campaign reports.
  const warnings = useMemo(() => {
    const list: { tone: "warning" | "info"; text: React.ReactNode }[] = [];
    const all = UTM_KEYS.map((k) => formatted[k]).join(" ");
    // Campaign IDs are often long numbers, so they are not taken for phone numbers.
    const personal = UTM_KEYS.filter((k) => k !== "utm_id").map((k) => formatted[k]).join(" ");
    if (/@|\b\d{10,}\b/.test(personal)) {
      list.push({
        tone: "warning",
        text: "A tag looks like it contains an email address or phone number. Personal details must not go into campaign tags: they end up in your analytics reports, which Google Analytics does not allow.",
      });
    }
    if (formatted.utm_medium && COMMON_SOURCES.includes(formatted.utm_medium.toLowerCase()) && !KNOWN_MEDIUMS.includes(formatted.utm_medium.toLowerCase())) {
      list.push({
        tone: "warning",
        text: (
          <>
            “{formatted.utm_medium}” is a site, so it belongs in <b>Source</b>. <b>Medium</b> is the kind of traffic, such as social, email or cpc.
          </>
        ),
      });
    }
    if (!format.lowercase && /[A-Z]/.test(all)) {
      list.push({
        tone: "info",
        text: "Some tags have capital letters. Analytics lists “Email” and “email” as two different sources, so use the same spelling on every link.",
      });
    }
    if (format.spaces === " " && / /.test(all)) {
      list.push({ tone: "info", text: "Spaces are sent as %20. That works, but underscores or hyphens are easier to read in reports." });
    }
    if (output.length > 2000) {
      list.push({ tone: "warning", text: `The link is ${output.length} characters long. Some apps cut links over 2,000 characters; shorten the tags or use a link shortener.` });
    }
    return list;
  }, [formatted, format, output]);

  const onUrlChange = (value: string) => {
    // A pasted link that already has tags: move them into the fields.
    const read = /[?&]utm_/i.test(value) ? readUtm(value) : null;
    if (read && read.found) {
      setUrl(read.base);
      setValues((v) => ({ ...v, ...Object.fromEntries(Object.entries(read.values).map(([k, x]) => [k, x ?? ""])) }));
      setReadCount(read.found);
      setPreset(null);
      if (Object.keys(read.values).some((k) => UTM_FIELDS.find((f) => f.key === k)?.advanced)) setShowMore(true);
    } else {
      setUrl(value);
      setReadCount(0);
    }
  };

  const setValue = (key: UtmKey, value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (key === "utm_source" || key === "utm_medium") setPreset(null);
  };

  const applyPreset = (pid: string) => {
    const p = UTM_PRESETS.find((x) => x.id === pid);
    if (!p) return;
    setPreset(pid);
    setValues((v) => ({ ...v, utm_source: p.source, utm_medium: p.medium }));
  };

  const remember = () => {
    if (!ready) return;
    const entry: SavedLink = {
      url: output,
      source: formatted.utm_source,
      medium: formatted.utm_medium,
      campaign: formatted.utm_campaign,
      content: formatted.utm_content,
      term: formatted.utm_term,
      at: Date.now(),
    };
    setHistory((h) => [entry, ...h.filter((x) => x.url !== output)].slice(0, HISTORY_MAX));
  };

  const copyLink = async () => {
    if (!ready) return;
    if (await copyText(output)) {
      toast.success("Tracking link copied");
      markToolCompleted();
      remember();
    }
  };

  const openLink = () => {
    if (!ready) return;
    window.open(output, "_blank", "noopener,noreferrer");
    remember();
  };

  const makeQr = () => {
    if (!ready) return;
    remember();
    sendToTool("qr-code-generator", { kind: "url", url: output }, "UTM Builder");
    router.push("/tools/qr-code-generator");
  };

  const reset = () => {
    setValues(EMPTY);
    setPreset(null);
    setReadCount(0);
  };

  const loadSaved = (s: SavedLink) => {
    setMode("build");
    onUrlChange(s.url);
  };

  const exportCsv = () => {
    const esc = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);
    const rows = [
      ["created", "link", "source", "medium", "campaign", "content", "term"],
      ...history.map((h) => [new Date(h.at).toISOString(), h.url, h.source, h.medium, h.campaign, h.content, h.term]),
    ];
    downloadText(rows.map((r) => r.map(esc).join(",")).join("\n"), "utm-links.csv", "text/csv;charset=utf-8");
  };

  // ------------------------------------------------------------ check mode

  const checked = useMemo(() => {
    const raw = checkInput.trim();
    if (!raw) return null;
    const parsed = parseBaseUrl(raw);
    if ("error" in parsed) return { error: parsed.error };
    const u = parsed.url;
    const params = queryParams(u).map((p) => ({ ...p, kind: paramKind(p.key, u.hostname) }));
    const utm = Object.fromEntries(params.filter((p) => p.kind === "utm").map((p) => [p.key.toLowerCase(), p.value]));
    return {
      url: u.toString(),
      params,
      utm,
      clean: cleanUrl(u.toString(), { keepUtm: keepTags }),
    };
  }, [checkInput, keepTags]);

  const counts = checked && !("error" in checked)
    ? {
        utm: checked.params.filter((p) => p.kind === "utm").length,
        tracker: checked.params.filter((p) => p.kind === "tracker").length,
        other: checked.params.filter((p) => p.kind === "other").length,
      }
    : null;

  const describe = (key: string, kind: string): string => {
    const k = key.toLowerCase();
    if (kind === "utm") {
      const f = UTM_FIELDS.find((x) => x.key === k);
      return f ? `${f.label}. ${f.help}` : "A campaign tag that Google Analytics does not read.";
    }
    if (kind === "tracker") {
      const t = TRACKERS[k];
      return t ? `${t.name}, added by ${t.by}.` : "Tracking added by this site.";
    }
    return "Part of the page address. Kept.";
  };

  const sources = [...new Set([...history.map((h) => h.source), ...COMMON_SOURCES])].filter(Boolean);
  const campaigns = [...new Set(history.map((h) => h.campaign))].filter(Boolean);

  const renderField = (key: UtmKey) => {
    const f = UTM_FIELDS.find((x) => x.key === key)!;
    const shown = formatted[key];
    const changed = values[key].trim() && shown !== values[key].trim();
    const list = key === "utm_source" ? `${id}-sources` : key === "utm_medium" ? `${id}-mediums` : key === "utm_campaign" ? `${id}-campaigns` : undefined;
    return (
      <Field
        key={key}
        label={
          <>
            {f.label}
            {f.required && <span className="text-muted-foreground"> (required)</span>}
            <span className="ml-1.5 font-mono text-xs font-normal text-muted-foreground">{key}</span>
          </>
        }
        htmlFor={`${id}-${key}`}
        hint={changed ? <>Sent as <span className="font-mono text-foreground">{shown}</span></> : f.help}
      >
        <TextInput
          id={`${id}-${key}`}
          value={values[key]}
          placeholder={f.placeholder}
          list={list}
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => setValue(key, cleanPastedValue(e.target.value))}
        />
      </Field>
    );
  };

  return (
    <div className="space-y-6">
      <Segmented
        ariaLabel="What do you want to do?"
        value={mode}
        onChange={setMode}
        options={[
          { value: "build", label: "Build a link" },
          { value: "check", label: "Check or clean a link" },
        ]}
      />

      {mode === "build" ? (
        <>
          <ToolSection title="Page to send people to">
            <Field
              label="Website address"
              htmlFor={`${id}-url`}
              error={base && "error" in base ? base.error : undefined}
              hint="Paste a link that already has tags to edit them."
            >
              <TextInput
                id={`${id}-url`}
                type="url"
                inputMode="url"
                autoComplete="url"
                spellCheck={false}
                placeholder="https://example.com/pricing"
                value={url}
                aria-invalid={base && "error" in base ? true : undefined}
                onChange={(e) => onUrlChange(e.target.value)}
              />
            </Field>
            {droppedIds.length > 0 && (
              <Notice tone="info">
                {droppedIds.join(", ")} {droppedIds.length === 1 ? "is a click ID" : "are click IDs"} from one person&apos;s visit, so{" "}
                {droppedIds.length === 1 ? "it is" : "they are"} left out of your link.
              </Notice>
            )}
            {readCount > 0 && (
              <Notice tone="info">
                Read {readCount === 1 ? "1 tag" : `${readCount} tags`} from the link into the fields below. The new link replaces them.
              </Notice>
            )}
          </ToolSection>

          <ToolSection title="Where will you share it?" description="Fills in Source and Medium with values Google Analytics recognises.">
            <Chips ariaLabel="Where the link will be shared" value={preset} onChange={applyPreset} options={UTM_PRESETS.map((p) => ({ value: p.id, label: p.label }))} />
            {preset && UTM_PRESETS.find((p) => p.id === preset)?.note && (
              <Notice tone="info">{UTM_PRESETS.find((p) => p.id === preset)!.note}</Notice>
            )}
          </ToolSection>

          <ToolSection
            title="Campaign tags"
            actions={
              <Button variant="ghost" size="sm" onClick={reset} disabled={UTM_KEYS.every((k) => !values[k])}>
                <RotateCcw aria-hidden="true" /> Clear tags
              </Button>
            }
          >
            <div className="grid gap-4 @md:grid-cols-2">
              {renderField("utm_source")}
              {renderField("utm_medium")}
            </div>
            {renderField("utm_campaign")}
            <div className="grid gap-4 @md:grid-cols-2">
              {renderField("utm_content")}
              {renderField("utm_term")}
            </div>

            <div>
              <button
                type="button"
                aria-expanded={showMore}
                onClick={() => setShowMore((v) => !v)}
                className="inline-flex items-center gap-1 rounded-md text-sm font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <ChevronDown className={cn("size-4 transition-transform", showMore && "rotate-180")} aria-hidden="true" />
                More fields for Google Analytics 4
              </button>
              {showMore && (
                <div className="mt-4 grid gap-4 @md:grid-cols-2">
                  {UTM_FIELDS.filter((f) => f.advanced).map((f) => renderField(f.key))}
                </div>
              )}
            </div>

            <div className="grid gap-4 rounded-lg border px-3.5 py-3 @md:grid-cols-[1fr_auto] @md:items-center">
              <ToggleRow
                id={`${id}-lower`}
                label="Lower case"
                description="Keeps “Email” and “email” from showing as two sources."
                checked={format.lowercase}
                onCheckedChange={(v) => setFormat((f) => ({ ...f, lowercase: v }))}
              />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Spaces become</p>
                <Segmented
                  size="sm"
                  ariaLabel="Spaces become"
                  value={format.spaces}
                  onChange={(v) => setFormat((f) => ({ ...f, spaces: v }))}
                  options={[
                    { value: "_", label: "_" },
                    { value: "-", label: "-" },
                    { value: " ", label: "Keep" },
                  ]}
                />
              </div>
            </div>

            <datalist id={`${id}-sources`}>
              {sources.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
            <datalist id={`${id}-mediums`}>
              {KNOWN_MEDIUMS.map((m) => (
                <option key={m} value={m} />
              ))}
            </datalist>
            <datalist id={`${id}-campaigns`}>
              {campaigns.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </ToolSection>

          <ToolDivider />

          <ToolSection title="Your tracking link">
            <div
              aria-live="polite"
              className="min-h-16 rounded-lg border bg-muted/40 px-3.5 py-3 font-mono text-sm leading-relaxed [overflow-wrap:anywhere]"
            >
              {output ? <LinkPreview url={output} /> : <span className="text-muted-foreground">Enter a website address to start.</span>}
            </div>

            {output && missing.length > 0 && (
              <Notice tone="info">
                Fill in {missing.map((k) => UTM_FIELDS.find((f) => f.key === k)!.label).join(", ").replace(/, ([^,]*)$/, " and $1")} to finish the link.
              </Notice>
            )}

            {(formatted.utm_source || formatted.utm_medium) && (
              <ChannelCard source={formatted.utm_source} medium={formatted.utm_medium} campaign={formatted.utm_campaign} />
            )}

            {warnings.map((w, i) => (
              <Notice key={i} tone={w.tone}>
                {w.text}
              </Notice>
            ))}

            <div className="flex flex-wrap justify-end gap-2">
              <Button variant="outline" size="lg" onClick={openLink} disabled={!ready}>
                <ExternalLink aria-hidden="true" /> Test link
              </Button>
              <Button variant="outline" size="lg" onClick={makeQr} disabled={!ready}>
                <QrCode aria-hidden="true" /> Make a QR code
              </Button>
              <Button size="lg" onClick={copyLink} disabled={!ready}>
                <Copy aria-hidden="true" /> Copy link
              </Button>
            </div>
          </ToolSection>

          {history.length > 0 && (
            <ToolSection
              title="Recent links"
              description="Saved on this device when you copy, test or make a QR code, for 3 days. Reuse the same names so reports stay tidy."
              actions={
                <>
                  <Button variant="ghost" size="sm" onClick={() => setHistory([])}>
                    <Trash2 aria-hidden="true" /> Clear
                  </Button>
                  <Button variant="outline" size="sm" onClick={exportCsv}>
                    <Download aria-hidden="true" /> Export CSV
                  </Button>
                </>
              }
            >
              <ul className="divide-y rounded-lg border">
                {history.map((h) => (
                  <li key={h.url} className="flex items-center gap-3 px-3.5 py-2.5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{h.campaign}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {h.source} / {h.medium}
                        {h.content ? ` · ${h.content}` : ""} · {new URL(h.url).hostname}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => loadSaved(h)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Copy the ${h.campaign} link`}
                      onClick={async () => {
                        if (await copyText(h.url)) toast.success("Link copied");
                      }}
                    >
                      <Copy aria-hidden="true" />
                    </Button>
                  </li>
                ))}
              </ul>
            </ToolSection>
          )}
        </>
      ) : (
        <>
          <ToolSection title="Link to check" description="See what's inside a link, and get a copy without the tracking.">
            <Field label="Link" htmlFor={`${id}-check`} error={checked && "error" in checked ? checked.error : undefined}>
              <TextInput
                id={`${id}-check`}
                type="url"
                inputMode="url"
                spellCheck={false}
                placeholder="https://shop.example/product?id=7&utm_source=facebook&fbclid=…"
                value={checkInput}
                onChange={(e) => setCheckInput(e.target.value)}
              />
            </Field>
          </ToolSection>

          {checked && !("error" in checked) && counts && (
            <>
              <StatGrid className="grid-cols-3 @xl:grid-cols-3">
                <Stat label="Campaign tags" value={counts.utm} />
                <Stat label="Tracking IDs" value={counts.tracker} tone={counts.tracker ? "warning" : undefined} />
                <Stat label="Other parameters" value={counts.other} />
              </StatGrid>

              {checked.params.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
                      <tr>
                        <th scope="col" className="px-3.5 py-2 font-medium">Parameter</th>
                        <th scope="col" className="px-3.5 py-2 font-medium">Value</th>
                        <th scope="col" className="px-3.5 py-2 font-medium">What it is</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {checked.params.map((p, i) => (
                        <tr key={i} className="align-top">
                          <td className="px-3.5 py-2 font-mono text-xs whitespace-nowrap text-foreground">{p.key}</td>
                          <td className="max-w-56 min-w-28 px-3.5 py-2 font-mono text-xs [overflow-wrap:anywhere] text-muted-foreground">{p.value || "—"}</td>
                          <td className="px-3.5 py-2 text-muted-foreground">{describe(p.key, p.kind)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <Notice tone="success">This link has no parameters, so it carries no campaign tags or tracking IDs.</Notice>
              )}

              {(checked.utm.utm_source || checked.utm.utm_medium) && (
                <ChannelCard source={checked.utm.utm_source ?? ""} medium={checked.utm.utm_medium ?? ""} campaign={checked.utm.utm_campaign ?? ""} />
              )}

              {(counts.utm > 0 || counts.tracker > 0) && (
                <ToolSection title="Clean link">
                  <ToggleRow
                    id={`${id}-keep`}
                    label="Keep campaign tags"
                    description="Remove only tracking IDs, so the site still sees which campaign sent you."
                    checked={keepTags}
                    onCheckedChange={setKeepTags}
                  />
                  <div className="rounded-lg border bg-muted/40 px-3.5 py-3 font-mono text-sm leading-relaxed [overflow-wrap:anywhere]">
                    <LinkPreview url={checked.clean.url} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {checked.clean.removed.length
                      ? `Removed ${checked.clean.removed.join(", ")}. Everything else is exactly as it was.`
                      : "Nothing to remove."}
                  </p>
                  <div className="flex flex-wrap justify-end gap-2">
                    {counts.utm > 0 && (
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => {
                          setMode("build");
                          onUrlChange(checked.url);
                        }}
                      >
                        Edit the tags
                      </Button>
                    )}
                    <Button
                      size="lg"
                      onClick={async () => {
                        if (await copyText(checked.clean.url)) toast.success("Clean link copied");
                      }}
                    >
                      <Copy aria-hidden="true" /> Copy clean link
                    </Button>
                  </div>
                </ToolSection>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

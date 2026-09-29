"use client";

import React, { useId, useMemo, useState } from "react";
import { ArrowLeftRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ColorField } from "@/components/color/color-field";
import { Notice, Segmented, ToolDivider, ToolSection } from "@/components/tool/kit";
import { useIsClient } from "@/lib/hooks/useIsClient";
import { WCAG, contrast, css, nearestPassing, over, parseColor, ratioText, readColor, simulate, toHex, type Rgba, type Vision } from "@/lib/color/color";
import { cn } from "@/lib/utils";

const VISIONS: { id: Vision; label: string; note: string }[] = [
  { id: "deuteranopia", label: "Deuteranopia", note: "green-blind, the most common" },
  { id: "protanopia", label: "Protanopia", note: "red-blind" },
  { id: "tritanopia", label: "Tritanopia", note: "blue-blind, rare" },
  { id: "achromatopsia", label: "Achromatopsia", note: "no colour" },
];

const WHITE: Rgba = { r: 1, g: 1, b: 1, a: 1 };

export default function ContrastChecker() {
  const id = useId();
  // Names ("navy") are read by the browser, so wait for it before showing results.
  const isClient = useIsClient();
  const [fgText, setFg] = useState("#FFFFFF");
  const [bgText, setBg] = useState("#1E40AF");
  const [target, setTarget] = useState<"4.5" | "7">("4.5");

  const fg = useMemo(() => (isClient ? readColor(fgText) : parseColor(fgText)), [fgText, isClient]);
  const bgRaw = useMemo(() => (isClient ? readColor(bgText) : parseColor(bgText)), [bgText, isClient]);
  // A see-through background is shown over white, as on most pages.
  const bg = bgRaw && bgRaw.a < 1 ? over(bgRaw, WHITE) : bgRaw;
  const ratio = fg && bg ? contrast(fg, bg) : null;
  const goal = Number(target);

  const fixes = useMemo(() => {
    if (!fg || !bg || ratio === null || ratio >= goal) return null;
    return { text: nearestPassing(fg, bg, goal, true), background: nearestPassing(bg, fg, goal, false) };
  }, [fg, bg, ratio, goal]);

  const swap = () => {
    setFg(bgText);
    setBg(fgText);
  };

  const passes = WCAG.filter((w) => ratio !== null && ratio >= w.min).length;

  return (
    <div className="space-y-8">
      <ToolSection
        title="Colours"
        actions={
          <Button variant="ghost" size="sm" onClick={swap}>
            <ArrowLeftRight aria-hidden="true" /> Swap
          </Button>
        }
      >
        <div className="grid gap-4 @lg:grid-cols-2">
          <ColorField id={`${id}-fg`} label="Text (foreground)" value={fgText} onChange={setFg} hint="Any CSS colour. Transparency is allowed." />
          <ColorField id={`${id}-bg`} label="Background" value={bgText} onChange={setBg} />
        </div>
        {fg && fg.a < 1 && bg && (
          <p className="text-xs text-muted-foreground">
            The text is {Math.round(fg.a * 100)}% opaque, so it is checked as it appears over the background: {toHex(over(fg, bg), false)}.
          </p>
        )}
      </ToolSection>

      <ToolDivider />

      {fg && bg && ratio !== null ? (
        <>
          <div className="grid gap-4 @2xl:grid-cols-[1.2fr_1fr]">
            <div className="space-y-3 rounded-xl border p-5" style={{ background: css(bg), color: css(fg) }}>
              <p className="text-base">Normal text, 16 px. The quick brown fox jumps over the lazy dog.</p>
              <p className="text-2xl font-normal">Large text, 24 px</p>
              <p className="text-lg font-bold">Large bold text, 18.66 px</p>
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 items-center rounded-lg border-2 px-3 text-sm font-medium" style={{ borderColor: css(fg) }}>
                  Button outline
                </span>
                <Check className="size-6" aria-hidden="true" />
              </div>
            </div>
            <div className="flex flex-col justify-center rounded-xl border p-5">
              <p className="text-xs font-medium text-muted-foreground">Contrast ratio</p>
              <p className="mt-1 text-4xl font-semibold text-foreground tabular-nums">{ratioText(ratio)}:1</p>
              <p className={cn("mt-1 text-sm font-medium", ratio >= 4.5 ? "text-success" : ratio >= 3 ? "text-warning" : "text-destructive")}>
                {ratio >= 7 ? "Excellent — passes every level" : ratio >= 4.5 ? "Good — passes AA for all text" : ratio >= 3 ? "Only for large text and icons" : "Too low for any text"}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Passes {passes} of {WCAG.length} WCAG 2.2 checks. Ratios are cut, not rounded, so 4.49 never shows as 4.50.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-xs text-muted-foreground">
                <tr>
                  <th scope="col" className="px-3.5 py-2 font-medium">Check</th>
                  <th scope="col" className="px-3.5 py-2 font-medium">Needs</th>
                  <th scope="col" className="px-3.5 py-2 font-medium">Result</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {WCAG.map((w) => {
                  const ok = ratio >= w.min;
                  return (
                    <tr key={w.id}>
                      <td className="px-3.5 py-2 text-foreground">
                        {w.level} · {w.what} <span className="text-xs text-muted-foreground">(SC {w.sc})</span>
                      </td>
                      <td className="px-3.5 py-2 text-muted-foreground tabular-nums">{w.min}:1</td>
                      <td className="px-3.5 py-2">
                        <span className={cn("inline-flex items-center gap-1 font-medium", ok ? "text-success" : "text-destructive")}>
                          {ok ? <Check className="size-4" aria-hidden="true" /> : <X className="size-4" aria-hidden="true" />}
                          {ok ? "Pass" : "Fail"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-muted-foreground">
            Large text means at least 24 px, or 18.66 px (14 pt) bold. Logos and disabled controls have no contrast requirement.
          </p>

          <ToolSection
            title="Fix it"
            description="The nearest colours that pass, keeping the same hue."
            actions={
              <Segmented
                size="sm"
                ariaLabel="Target"
                value={target}
                onChange={setTarget}
                options={[
                  { value: "4.5", label: "AA 4.5:1" },
                  { value: "7", label: "AAA 7:1" },
                ]}
              />
            }
          >
            {!fixes ? (
              <Notice tone="success">This pair already reaches {target}:1.</Notice>
            ) : (
              <div className="grid gap-3 @lg:grid-cols-2">
                {[
                  { key: "text", label: "Change the text", c: fixes.text, apply: (c: Rgba) => setFg(toHex(c)), preview: (c: Rgba) => ({ background: css(bg), color: css(c) }), ratio: (c: Rgba) => contrast(c, bg) },
                  { key: "bg", label: "Change the background", c: fixes.background, apply: (c: Rgba) => setBg(toHex(c)), preview: (c: Rgba) => ({ background: css(c), color: css(fg) }), ratio: (c: Rgba) => contrast(fg, c) },
                ].map((f) => (
                  <div key={f.key} className="space-y-2.5 rounded-lg border p-3.5">
                    <p className="text-sm font-medium text-foreground">{f.label}</p>
                    {f.c ? (
                      <>
                        <div className="rounded-md px-3 py-2 text-sm" style={f.preview(f.c)}>
                          Sample text {ratioText(f.ratio(f.c))}:1
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <code className="font-mono text-sm text-foreground">{toHex(f.c)}</code>
                          <Button size="sm" variant="outline" onClick={() => f.apply(f.c!)}>
                            Use this
                          </Button>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">No shade of this colour reaches {target}:1 here.</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </ToolSection>

          <ToolSection title="Colour vision" description="How the pair looks to people with colour blindness. Contrast comes from lightness, so a good ratio stays readable.">
            <div className="grid grid-cols-2 gap-2 @xl:grid-cols-4">
              {VISIONS.map((v) => {
                const f = simulate(fg.a < 1 ? over(fg, bg) : fg, v.id);
                const b = simulate(bg, v.id);
                return (
                  <figure key={v.id} className="overflow-hidden rounded-lg border">
                    <div className="px-3 py-3 text-sm font-medium" style={{ background: css(b), color: css(f) }}>
                      Aa · {ratioText(contrast(f, b))}:1
                    </div>
                    <figcaption className="px-3 py-2 text-xs text-muted-foreground">
                      <span className="font-medium text-foreground">{v.label}</span> — {v.note}
                    </figcaption>
                  </figure>
                );
              })}
            </div>
          </ToolSection>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Enter two colours to check them.</p>
      )}
    </div>
  );
}

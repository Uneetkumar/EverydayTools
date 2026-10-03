"use client";

import React, { useState, useMemo } from "react";
import { Copy, Check, ArrowRightLeft, Globe } from "lucide-react";
import { toast } from "sonner";
import {
  ToolSection,
  Field,
  TextInput,
  Segmented,
  Chips,
  Notice,
  ActionBar,
  ToolDivider,
} from "@/components/tool/kit";
import { Button } from "@/components/ui/button";

const SAMPLE_IPV4 = [
  { label: "Cloudflare (1.1.1.1)", ip: "1.1.1.1" },
  { label: "Google DNS (8.8.8.8)", ip: "8.8.8.8" },
  { label: "Local Gateway (192.168.1.1)", ip: "192.168.1.1" },
  { label: "Documentation IP (192.0.2.1)", ip: "192.0.2.1" },
];

const SAMPLE_IPV6 = [
  { label: "Google Public DNS", ip: "2001:4860:4860::8888" },
  { label: "Cloudflare DNS", ip: "2606:4700:4700::1111" },
  { label: "Loopback", ip: "::1" },
];

function expandIpv6(ipv6: string): string | null {
  try {
    let s = ipv6.trim().toLowerCase();
    if (!s || s.includes(":::")) return null;
    const parts = s.split("::");
    if (parts.length > 2) return null;

    let left = parts[0] ? parts[0].split(":") : [];
    let right = parts.length === 2 && parts[1] ? parts[1].split(":") : [];

    // Handle embedded IPv4 at the end
    const lastPart = right.length > 0 ? right[right.length - 1] : left[left.length - 1];
    if (lastPart && lastPart.includes(".")) {
      const v4octets = lastPart.split(".");
      if (v4octets.length !== 4) return null;
      const h1 = ((parseInt(v4octets[0], 10) << 8) + parseInt(v4octets[1], 10)).toString(16);
      const h2 = ((parseInt(v4octets[2], 10) << 8) + parseInt(v4octets[3], 10)).toString(16);
      if (right.length > 0) {
        right.pop();
        right.push(h1, h2);
      } else {
        left.pop();
        left.push(h1, h2);
      }
    }

    const totalHeptets = left.length + right.length;
    if (totalHeptets > 8) return null;

    let middle: string[] = [];
    if (parts.length === 2) {
      middle = Array(8 - totalHeptets).fill("0000");
    } else if (totalHeptets !== 8) {
      return null;
    }

    const all = [...left, ...middle, ...right].map((h) => h.padStart(4, "0"));
    return all.join(":");
  } catch {
    return null;
  }
}

function compressIpv6(expanded: string): string {
  const parts = expanded.split(":").map((p) => p.replace(/^0+(?!$)/, ""));
  let maxZeroStart = -1;
  let maxZeroLen = 0;
  let currZeroStart = -1;
  let currZeroLen = 0;

  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === "0") {
      if (currZeroStart === -1) {
        currZeroStart = i;
        currZeroLen = 1;
      } else {
        currZeroLen++;
      }
      if (currZeroLen > maxZeroLen) {
        maxZeroStart = currZeroStart;
        maxZeroLen = currZeroLen;
      }
    } else {
      currZeroStart = -1;
      currZeroLen = 0;
    }
  }

  if (maxZeroLen > 1) {
    const left = parts.slice(0, maxZeroStart).join(":");
    const right = parts.slice(maxZeroStart + maxZeroLen).join(":");
    return `${left}::${right}`;
  }
  return parts.join(":");
}

export default function Ipv4ToIpv6Converter() {
  const [mode, setMode] = useState<"v4-to-v6" | "v6-tools">("v4-to-v6");
  const [ipv4, setIpv4] = useState("192.0.2.1");
  const [ipv6, setIpv6] = useState("2001:db8::1");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Convert IPv4
  const v4Results = useMemo(() => {
    const parts = ipv4.trim().split(".");
    if (parts.length !== 4) return null;
    const octets = [];
    for (const p of parts) {
      const n = parseInt(p, 10);
      if (isNaN(n) || n < 0 || n > 255 || p.trim() === "") return null;
      octets.push(n);
    }

    const hex1 = ((octets[0] << 8) + octets[1]).toString(16).padStart(4, "0");
    const hex2 = ((octets[2] << 8) + octets[3]).toString(16).padStart(4, "0");
    const hexRaw = `${hex1}${hex2}`;
    const intVal = ((octets[0] << 24) | (octets[1] << 16) | (octets[2] << 8) | octets[3]) >>> 0;
    const binary = octets.map((o) => o.toString(2).padStart(8, "0")).join(".");

    const v4MappedDot = `::ffff:${ipv4.trim()}`;
    const v4MappedHex = `::ffff:${hex1}:${hex2}`;
    const v4CompatDot = `::${ipv4.trim()}`;
    const v4CompatHex = `::${hex1}:${hex2}`;
    const sixToFour = `2002:${hex1}:${hex2}::/48`;
    const siit = `::ffff:0:${ipv4.trim()}`;
    const inAddrArpa = `${octets[3]}.${octets[2]}.${octets[1]}.${octets[0]}.in-addr.arpa`;

    // IPv6 reverse DNS for 6to4
    const ip6Nibbles = `2002${hex1}${hex2}000000000000000000000000`.split("").reverse().join(".");
    const ip6Arpa = `${ip6Nibbles}.ip6.arpa`;

    return {
      ipv4: ipv4.trim(),
      v4MappedDot,
      v4MappedHex,
      v4CompatDot,
      v4CompatHex,
      sixToFour,
      siit,
      hexRaw: `0x${hexRaw.toUpperCase()}`,
      intVal: intVal.toString(),
      binary,
      inAddrArpa,
      ip6Arpa,
    };
  }, [ipv4]);

  // IPv6 Expand/Compress
  const v6Results = useMemo(() => {
    const expanded = expandIpv6(ipv6);
    if (!expanded) return null;
    const compressed = compressIpv6(expanded);
    const nibbles = expanded.replace(/:/g, "").split("").reverse().join(".");
    const reverseDns = `${nibbles}.ip6.arpa`;

    return {
      expanded,
      compressed,
      reverseDns,
    };
  }, [ipv6]);

  return (
    <div className="space-y-6">
      <Segmented
        value={mode}
        onChange={(v) => setMode(v as "v4-to-v6" | "v6-tools")}
        options={[
          { value: "v4-to-v6", label: "IPv4 to IPv6 Converter" },
          { value: "v6-tools", label: "IPv6 Expander & Compressor" },
        ]}
        ariaLabel="Conversion mode"
        fill
      />

      {mode === "v4-to-v6" && (
        <>
          <ToolSection
            title="IPv4 Address Input"
            description="Enter any valid IPv4 address to generate mapped, compatible, 6to4, and hexadecimal representations."
          >
            <Chips
              value={null}
              onChange={(val) => {
                const item = SAMPLE_IPV4.find((x) => x.label === val);
                if (item) setIpv4(item.ip);
              }}
              options={SAMPLE_IPV4.map((s) => ({ value: s.label, label: s.label }))}
              ariaLabel="Sample IPv4 addresses"
            />

            <Field label="IPv4 Address" hint="e.g. 192.0.2.1">
              <TextInput
                value={ipv4}
                onChange={(e) => setIpv4(e.target.value)}
                placeholder="192.0.2.1"
                aria-label="IPv4 Address"
              />
            </Field>
          </ToolSection>

          {v4Results ? (
            <>
              <ToolDivider />

              <ToolSection title="IPv6 Equivalent Mappings">
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { label: "IPv4-Mapped IPv6 (Dotted)", val: v4Results.v4MappedDot, key: "m_dot" },
                    { label: "IPv4-Mapped IPv6 (Hexadecimal)", val: v4Results.v4MappedHex, key: "m_hex" },
                    { label: "6to4 Prefix (RFC 3056)", val: v4Results.sixToFour, key: "6to4" },
                    { label: "Stateless IP/ICMP Translation (SIIT)", val: v4Results.siit, key: "siit" },
                    { label: "IPv4-Compatible IPv6 (Deprecated)", val: v4Results.v4CompatDot, key: "c_dot" },
                    { label: "IPv4-Compatible (Hexadecimal)", val: v4Results.v4CompatHex, key: "c_hex" },
                  ].map((row) => (
                    <div
                      key={row.key}
                      className="flex items-center justify-between rounded-lg border bg-card p-3 shadow-soft"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="text-xs font-medium text-muted-foreground">{row.label}</span>
                        <p className="truncate font-mono text-sm font-semibold text-foreground">{row.val}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => copyToClipboard(row.val, row.key)}
                        aria-label={`Copy ${row.label}`}
                      >
                        {copiedKey === row.key ? (
                          <Check className="size-3.5 text-success" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </ToolSection>

              <ToolSection title="Alternative Formats & DNS">
                <div className="space-y-3">
                  {[
                    { label: "Hexadecimal (Base 16)", val: v4Results.hexRaw, key: "hex" },
                    { label: "Integer (Base 10)", val: v4Results.intVal, key: "int" },
                    { label: "Binary (32-bit)", val: v4Results.binary, key: "bin" },
                    { label: "Reverse DNS Zone (IPv4 in-addr.arpa)", val: v4Results.inAddrArpa, key: "dns4" },
                  ].map((row) => (
                    <div
                      key={row.key}
                      className="flex items-center justify-between rounded-lg border bg-card p-3 shadow-soft"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="text-xs font-medium text-muted-foreground">{row.label}</span>
                        <p className="truncate font-mono text-sm font-semibold text-foreground">{row.val}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => copyToClipboard(row.val, row.key)}
                        aria-label={`Copy ${row.label}`}
                      >
                        {copiedKey === row.key ? (
                          <Check className="size-3.5 text-success" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </ToolSection>
            </>
          ) : (
            <Notice tone="error">
              Invalid IPv4 address format. Please enter four decimal numbers between 0 and 255 separated by dots.
            </Notice>
          )}
        </>
      )}

      {mode === "v6-tools" && (
        <>
          <ToolSection
            title="IPv6 Address Input"
            description="Enter an IPv6 address in compressed or expanded form to compress, expand, or calculate its reverse DNS."
          >
            <Chips
              value={null}
              onChange={(val) => {
                const item = SAMPLE_IPV6.find((x) => x.label === val);
                if (item) setIpv6(item.ip);
              }}
              options={SAMPLE_IPV6.map((s) => ({ value: s.label, label: s.label }))}
              ariaLabel="Sample IPv6 addresses"
            />

            <Field label="IPv6 Address" hint="e.g. 2001:db8::1 or 2001:0db8:0000:0000:0000:0000:0000:0001">
              <TextInput
                value={ipv6}
                onChange={(e) => setIpv6(e.target.value)}
                placeholder="2001:db8::1"
                aria-label="IPv6 Address"
              />
            </Field>
          </ToolSection>

          {v6Results ? (
            <>
              <ToolDivider />

              <ToolSection title="Expanded & Compressed Results">
                <div className="space-y-3">
                  {[
                    { label: "Fully Expanded (32 Hex Digits)", val: v6Results.expanded, key: "exp" },
                    { label: "Canonical Compressed (RFC 5952)", val: v6Results.compressed, key: "comp" },
                    { label: "Reverse DNS Pointer (ip6.arpa)", val: v6Results.reverseDns, key: "rdns" },
                  ].map((row) => (
                    <div
                      key={row.key}
                      className="flex items-center justify-between rounded-lg border bg-card p-3 shadow-soft"
                    >
                      <div className="min-w-0 pr-2">
                        <span className="text-xs font-medium text-muted-foreground">{row.label}</span>
                        <p className="truncate font-mono text-sm font-semibold text-foreground break-all">
                          {row.val}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => copyToClipboard(row.val, row.key)}
                        aria-label={`Copy ${row.label}`}
                      >
                        {copiedKey === row.key ? (
                          <Check className="size-3.5 text-success" />
                        ) : (
                          <Copy className="size-3.5" />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </ToolSection>
            </>
          ) : (
            <Notice tone="error">
              Invalid IPv6 address. Ensure it contains valid hexadecimal heptets separated by colons.
            </Notice>
          )}
        </>
      )}
    </div>
  );
}

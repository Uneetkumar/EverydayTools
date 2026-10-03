"use client";

import React, { useState, useMemo } from "react";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import {
  ToolSection,
  Field,
  TextInput,
  SelectInput,
  Segmented,
  StatGrid,
  Stat,
  Chips,
  Notice,
  ActionBar,
  ToolDivider,
} from "@/components/tool/kit";
import { Button } from "@/components/ui/button";

interface SubnetResult {
  ip: string;
  cidr: number;
  netmask: string;
  wildcard: string;
  networkAddress: string;
  broadcastAddress: string;
  firstUsableIp: string;
  lastUsableIp: string;
  totalHosts: number;
  usableHosts: number;
  ipClass: string;
  ipType: string;
  binaryNetmask: string[];
  binaryIp: string[];
  inAddrArpa: string;
}

interface Ipv6SubnetResult {
  ip: string;
  prefix: number;
  networkAddress: string;
  compressedNetwork: string;
  firstIp: string;
  lastIp: string;
  totalAddresses: string;
  totalSubnets64: string;
  ipType: string;
  ip6Arpa: string;
}

const PRESETS_V4 = [
  { label: "Home LAN (192.168.1.0/24)", ip: "192.168.1.1", cidr: "24" },
  { label: "VPC Subnet (10.0.0.0/16)", ip: "10.0.0.1", cidr: "16" },
  { label: "AWS Small VPC (172.31.0.0/20)", ip: "172.31.0.1", cidr: "20" },
  { label: "Point-to-Point (/30)", ip: "192.168.1.1", cidr: "30" },
  { label: "Loopback (127.0.0.1/8)", ip: "127.0.0.1", cidr: "8" },
];

const PRESETS_V6 = [
  { label: "Global Unicast (2001:db8:abcd::/48)", ip: "2001:db8:abcd::1", prefix: "48" },
  { label: "Standard Subnet (/64)", ip: "2001:db8:abcd:0012::1", prefix: "64" },
  { label: "Unique Local ULA (fd00::/48)", ip: "fd00:abcd:1234::1", prefix: "48" },
  { label: "Link-Local (fe80::/64)", ip: "fe80::1", prefix: "64" },
  { label: "Host Single IP (/128)", ip: "2001:db8::1", prefix: "128" },
];

function ipToLong(ip: string): number {
  return ip
    .split(".")
    .reduce((acc, octet) => ((acc << 8) + parseInt(octet, 10)) >>> 0, 0);
}

function longToIp(long: number): string {
  return [
    (long >>> 24) & 255,
    (long >>> 16) & 255,
    (long >>> 8) & 255,
    long & 255,
  ].join(".");
}

function toBinaryOctets(long: number): string[] {
  return [
    ((long >>> 24) & 255).toString(2).padStart(8, "0"),
    ((long >>> 16) & 255).toString(2).padStart(8, "0"),
    ((long >>> 8) & 255).toString(2).padStart(8, "0"),
    (long & 255).toString(2).padStart(8, "0"),
  ];
}

function calculateSubnet(ipStr: string, cidrNum: number): SubnetResult | null {
  let cleanedIp = ipStr.trim();
  if (cleanedIp.includes("/")) {
    cleanedIp = cleanedIp.split("/")[0].trim();
  }
  const parts = cleanedIp.split(".");
  if (parts.length !== 4) return null;
  for (const p of parts) {
    const n = Number(p);
    if (isNaN(n) || n < 0 || n > 255 || p.trim() === "") return null;
  }
  if (cidrNum < 0 || cidrNum > 32) return null;

  const ipLong = ipToLong(cleanedIp);
  const maskLong = cidrNum === 0 ? 0 : (~0 << (32 - cidrNum)) >>> 0;
  const wildcardLong = ~maskLong >>> 0;
  const networkLong = (ipLong & maskLong) >>> 0;
  const broadcastLong = (networkLong | wildcardLong) >>> 0;

  const totalHosts = Math.pow(2, 32 - cidrNum);
  let usableHosts = 0;
  let firstUsableLong = networkLong;
  let lastUsableLong = broadcastLong;

  if (cidrNum === 32) {
    usableHosts = 1;
    firstUsableLong = networkLong;
    lastUsableLong = networkLong;
  } else if (cidrNum === 31) {
    usableHosts = 2; // RFC 3021 point-to-point links
    firstUsableLong = networkLong;
    lastUsableLong = broadcastLong;
  } else {
    usableHosts = Math.max(0, totalHosts - 2);
    firstUsableLong = networkLong + 1;
    lastUsableLong = broadcastLong - 1;
  }

  // Determine Class
  const firstOctet = parseInt(parts[0], 10);
  let ipClass = "Class A";
  if (firstOctet >= 128 && firstOctet <= 191) ipClass = "Class B";
  else if (firstOctet >= 192 && firstOctet <= 223) ipClass = "Class C";
  else if (firstOctet >= 224 && firstOctet <= 239) ipClass = "Class D (Multicast)";
  else if (firstOctet >= 240) ipClass = "Class E (Reserved)";

  // Determine Scope
  let ipType = "Public Internet";
  if (firstOctet === 10) ipType = "Private (RFC 1918)";
  else if (firstOctet === 172 && parseInt(parts[1], 10) >= 16 && parseInt(parts[1], 10) <= 31)
    ipType = "Private (RFC 1918)";
  else if (firstOctet === 192 && parseInt(parts[1], 10) === 168) ipType = "Private (RFC 1918)";
  else if (firstOctet === 127) ipType = "Loopback (RFC 1122)";
  else if (firstOctet === 169 && parseInt(parts[1], 10) === 254) ipType = "Link-Local / APIPA";

  const inAddrArpa = `${parts[3]}.${parts[2]}.${parts[1]}.${parts[0]}.in-addr.arpa`;

  return {
    ip: cleanedIp,
    cidr: cidrNum,
    netmask: longToIp(maskLong),
    wildcard: longToIp(wildcardLong),
    networkAddress: longToIp(networkLong),
    broadcastAddress: longToIp(broadcastLong),
    firstUsableIp: longToIp(firstUsableLong),
    lastUsableIp: longToIp(lastUsableLong),
    totalHosts,
    usableHosts,
    ipClass,
    ipType,
    binaryNetmask: toBinaryOctets(maskLong),
    binaryIp: toBinaryOctets(ipLong),
    inAddrArpa,
  };
}

// Parse IPv6 to 128-bit BigInt
function parseIpv6ToBigInt(str: string): bigint | null {
  let s = str.trim().toLowerCase();
  if (s.includes("/")) s = s.split("/")[0].trim();
  if (!s || s.includes(":::")) return null;
  const parts = s.split("::");
  if (parts.length > 2) return null;

  const left = parts[0] ? parts[0].split(":") : [];
  const right = parts.length === 2 && parts[1] ? parts[1].split(":") : [];
  if (left.length + right.length > 8) return null;

  const middle = parts.length === 2 ? Array(8 - left.length - right.length).fill("0") : [];
  const all = [...left, ...middle, ...right];
  if (all.length !== 8) return null;

  let val = BigInt(0);
  for (const h of all) {
    if (!/^[0-9a-f]{1,4}$/i.test(h)) return null;
    val = (val << BigInt(16)) | BigInt(parseInt(h, 16));
  }
  return val;
}

function bigIntToIpv6Expanded(val: bigint): string {
  const parts: string[] = [];
  for (let i = 7; i >= 0; i--) {
    const part = Number((val >> BigInt(i * 16)) & BigInt(0xffff));
    parts.push(part.toString(16).padStart(4, "0"));
  }
  return parts.join(":");
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

function calculateIpv6Subnet(ipStr: string, prefixNum: number): Ipv6SubnetResult | null {
  const val = parseIpv6ToBigInt(ipStr);
  if (val === null || prefixNum < 0 || prefixNum > 128) return null;

  const mask = prefixNum === 0 ? BigInt(0) : (((BigInt(1) << BigInt(prefixNum)) - BigInt(1)) << BigInt(128 - prefixNum));
  const network = val & mask;
  const last = network | (~mask & ((BigInt(1) << BigInt(128)) - BigInt(1)));

  const expNet = bigIntToIpv6Expanded(network);
  const compNet = compressIpv6(expNet);
  const firstIp = compNet;
  const lastIp = compressIpv6(bigIntToIpv6Expanded(last));

  // Total addresses formatted
  const hostBits = 128 - prefixNum;
  const totalAddressesBig = BigInt(1) << BigInt(hostBits);
  let totalAddresses = totalAddressesBig.toString();
  if (totalAddresses.length > 15) {
    totalAddresses = `${totalAddresses.slice(0, 4)} × 10^${totalAddresses.length - 1} (${totalAddressesBig.toString()})`;
  }

  // Total /64 subnets
  let totalSubnets64 = "1";
  if (prefixNum <= 64) {
    totalSubnets64 = (BigInt(1) << BigInt(64 - prefixNum)).toLocaleString();
  } else {
    totalSubnets64 = "N/A (Subnet is smaller than /64)";
  }

  // Determine Type/Scope
  let ipType = "Global Unicast (2000::/3)";
  const top16 = Number(val >> BigInt(112));
  if ((top16 & 0xfe00) === 0xfc00) {
    ipType = "Unique Local Address (ULA, RFC 4193)";
  } else if ((top16 & 0xffc0) === 0xfe80) {
    ipType = "Link-Local Unicast (fe80::/10, RFC 4291)";
  } else if ((top16 & 0xff00) === 0xff00) {
    ipType = "Multicast (ff00::/8, RFC 4291)";
  } else if (val === BigInt(1)) {
    ipType = "Loopback (::1/128, RFC 4291)";
  } else if (val === BigInt(0)) {
    ipType = "Unspecified (::/128)";
  }

  // Reverse DNS zone for prefix
  const hex32 = expNet.replace(/:/g, "");
  const nibblesInPrefix = Math.floor(prefixNum / 4);
  const prefixNibbles = hex32.slice(0, nibblesInPrefix).split("").reverse().join(".");
  const ip6Arpa = prefixNibbles ? `${prefixNibbles}.ip6.arpa` : "ip6.arpa";

  return {
    ip: ipStr.trim().split("/")[0],
    prefix: prefixNum,
    networkAddress: expNet,
    compressedNetwork: compNet,
    firstIp,
    lastIp,
    totalAddresses,
    totalSubnets64,
    ipType,
    ip6Arpa,
  };
}

export default function SubnetCalculator() {
  const [protocol, setProtocol] = useState<"ipv4" | "ipv6">("ipv4");

  // IPv4 state
  const [ip, setIp] = useState("192.168.1.1");
  const [cidr, setCidr] = useState("24");

  // IPv6 state
  const [ipv6, setIpv6] = useState("2001:db8:abcd:0012::1");
  const [ipv6Prefix, setIpv6Prefix] = useState("64");

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Auto-split IP/CIDR if pasted together
  const handleIpv4Change = (val: string) => {
    if (val.includes("/")) {
      const [ipPart, cidrPart] = val.split("/");
      setIp(ipPart.trim());
      const c = parseInt(cidrPart.trim(), 10);
      if (!isNaN(c) && c >= 0 && c <= 32) setCidr(c.toString());
    } else {
      setIp(val);
    }
  };

  const handleIpv6Change = (val: string) => {
    if (val.includes("/")) {
      const [ipPart, pfxPart] = val.split("/");
      setIpv6(ipPart.trim());
      const p = parseInt(pfxPart.trim(), 10);
      if (!isNaN(p) && p >= 0 && p <= 128) setIpv6Prefix(p.toString());
    } else {
      setIpv6(val);
    }
  };

  const resultV4 = useMemo(() => {
    return calculateSubnet(ip, parseInt(cidr, 10));
  }, [ip, cidr]);

  const resultV6 = useMemo(() => {
    return calculateIpv6Subnet(ipv6, parseInt(ipv6Prefix, 10));
  }, [ipv6, ipv6Prefix]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const copyAllSummaryV4 = () => {
    if (!resultV4) return;
    const summary = [
      `IP Address: ${resultV4.ip}/${resultV4.cidr}`,
      `Network Address: ${resultV4.networkAddress}`,
      `Usable Host Range: ${resultV4.firstUsableIp} - ${resultV4.lastUsableIp}`,
      `Broadcast Address: ${resultV4.broadcastAddress}`,
      `Subnet Mask: ${resultV4.netmask}`,
      `Wildcard Mask: ${resultV4.wildcard}`,
      `Usable Hosts: ${resultV4.usableHosts.toLocaleString()}`,
      `Total Addresses: ${resultV4.totalHosts.toLocaleString()}`,
      `Type: ${resultV4.ipType} (${resultV4.ipClass})`,
    ].join("\n");
    copyToClipboard(summary, "summary");
  };

  const copyAllSummaryV6 = () => {
    if (!resultV6) return;
    const summary = [
      `IPv6 Prefix: ${resultV6.compressedNetwork}/${resultV6.prefix}`,
      `Expanded Network: ${resultV6.networkAddress}`,
      `Subnet Range: ${resultV6.firstIp} – ${resultV6.lastIp}`,
      `Total /64 Subnets: ${resultV6.totalSubnets64}`,
      `Total Addresses: ${resultV6.totalAddresses}`,
      `Type & Scope: ${resultV6.ipType}`,
      `Reverse DNS Zone: ${resultV6.ip6Arpa}`,
    ].join("\n");
    copyToClipboard(summary, "summary");
  };

  return (
    <div className="space-y-6">
      <Segmented
        value={protocol}
        onChange={(v) => setProtocol(v as "ipv4" | "ipv6")}
        options={[
          { value: "ipv4", label: "IPv4 Subnet Calculator" },
          { value: "ipv6", label: "IPv6 CIDR Subnet Calculator" },
        ]}
        ariaLabel="Subnet Protocol"
        fill
      />

      {protocol === "ipv4" ? (
        <>
          <ToolSection
            title="IPv4 Subnet Configuration"
            description="Enter any IPv4 address (e.g. 192.168.1.1 or 10.0.0.1/16) and CIDR prefix to calculate network boundaries, host ranges, and binary masks."
          >
            <div className="flex flex-wrap gap-2">
              <Chips
                value={null}
                onChange={(val) => {
                  const p = PRESETS_V4.find((x) => x.label === val);
                  if (p) {
                    setIp(p.ip);
                    setCidr(p.cidr);
                  }
                }}
                options={PRESETS_V4.map((p) => ({ value: p.label, label: p.label }))}
                ariaLabel="IPv4 Subnet presets"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <Field label="IP Address" hint="e.g. 192.168.1.1 or paste with /24">
                  <TextInput
                    value={ip}
                    onChange={(e) => handleIpv4Change(e.target.value)}
                    placeholder="192.168.1.1"
                    aria-label="IPv4 Address"
                  />
                </Field>
              </div>
              <div>
                <Field label="CIDR Prefix (/mask)" hint="Subnet mask prefix">
                  <SelectInput
                    value={cidr}
                    onChange={(e) => setCidr(e.target.value)}
                    aria-label="CIDR Prefix"
                  >
                    {Array.from({ length: 33 }, (_, i) => 32 - i).map((n) => (
                      <option key={n} value={n.toString()}>
                        /{n} — {longToIp(n === 0 ? 0 : (~0 << (32 - n)) >>> 0)}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
              </div>
            </div>
          </ToolSection>

          {resultV4 ? (
            <>
              <ToolDivider />

              <ToolSection title="Calculation Results">
                <StatGrid>
                  <Stat label="Usable Hosts" value={resultV4.usableHosts.toLocaleString()} tone="success" />
                  <Stat label="Total IP Addresses" value={resultV4.totalHosts.toLocaleString()} />
                  <Stat label="Subnet Mask" value={resultV4.netmask} />
                  <Stat label="Network Type" value={resultV4.ipType.split(" ")[0]} hint={resultV4.ipClass} />
                </StatGrid>

                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { label: "Network Address", val: `${resultV4.networkAddress}/${resultV4.cidr}`, key: "net" },
                    { label: "Usable Host Range", val: `${resultV4.firstUsableIp} – ${resultV4.lastUsableIp}`, key: "range" },
                    { label: "Broadcast Address", val: resultV4.broadcastAddress, key: "bcast" },
                    { label: "Wildcard Mask", val: resultV4.wildcard, key: "wild" },
                    { label: "IP Class & Scope", val: `${resultV4.ipClass} · ${resultV4.ipType}`, key: "scope" },
                    { label: "Reverse DNS Zone", val: resultV4.inAddrArpa, key: "rdns" },
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

                {/* Binary Bit Diagram */}
                <div className="space-y-2 rounded-lg border bg-muted/40 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground">Binary Bit Breakdown</span>
                    <span className="text-xs text-muted-foreground">
                      {resultV4.cidr} Network bits (1s) · {32 - resultV4.cidr} Host bits (0s)
                    </span>
                  </div>
                  <div className="space-y-1 font-mono text-xs">
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                      <span className="w-16 text-muted-foreground">Mask:</span>
                      {resultV4.binaryNetmask.map((octet, idx) => (
                        <span
                          key={idx}
                          className="rounded bg-background px-1.5 py-0.5 border text-foreground"
                        >
                          {octet}
                        </span>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                      <span className="w-16 text-muted-foreground">IP:</span>
                      {resultV4.binaryIp.map((octet, idx) => (
                        <span
                          key={idx}
                          className="rounded bg-background px-1.5 py-0.5 border text-foreground"
                        >
                          {octet}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <ActionBar>
                  <Button variant="outline" size="sm" onClick={copyAllSummaryV4}>
                    {copiedKey === "summary" ? <Check className="size-3.5 text-success mr-1" /> : <Copy className="size-3.5 mr-1" />}
                    Copy Full IPv4 Summary
                  </Button>
                </ActionBar>
              </ToolSection>

              {/* Quick CIDR Reference Table */}
              <ToolSection title="IPv4 CIDR Quick Reference Table">
                <div className="overflow-x-auto rounded-lg border bg-card">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="border-b bg-muted/60 text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2">CIDR</th>
                        <th className="px-3 py-2">Subnet Mask</th>
                        <th className="px-3 py-2">Total IPs</th>
                        <th className="px-3 py-2">Usable Hosts</th>
                        <th className="px-3 py-2">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {[32, 30, 29, 28, 27, 26, 25, 24, 23, 22, 20, 16, 8].map((c) => {
                        const mask = longToIp(c === 0 ? 0 : (~0 << (32 - c)) >>> 0);
                        const total = Math.pow(2, 32 - c);
                        const usable = c === 32 ? 1 : c === 31 ? 2 : Math.max(0, total - 2);
                        const isSelected = parseInt(cidr, 10) === c;
                        return (
                          <tr
                            key={c}
                            className={isSelected ? "bg-primary/10 font-semibold" : "hover:bg-muted/40"}
                          >
                            <td className="px-3 py-1.5">/{c}</td>
                            <td className="px-3 py-1.5">{mask}</td>
                            <td className="px-3 py-1.5">{total.toLocaleString()}</td>
                            <td className="px-3 py-1.5">{usable.toLocaleString()}</td>
                            <td className="px-3 py-1.5">
                              <button
                                type="button"
                                onClick={() => setCidr(c.toString())}
                                className="text-primary hover:underline"
                              >
                                Apply
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </ToolSection>
            </>
          ) : (
            <Notice tone="error">
              Invalid IPv4 address format. Please enter four numbers separated by dots between 0 and 255 (e.g. 192.168.1.1).
            </Notice>
          )}
        </>
      ) : (
        /* IPv6 Calculator Section */
        <>
          <ToolSection
            title="IPv6 CIDR Configuration"
            description="Enter an IPv6 address and prefix length (/0 to /128) to compute network prefix, /64 subnet pools, address ranges, and reverse DNS."
          >
            <div className="flex flex-wrap gap-2">
              <Chips
                value={null}
                onChange={(val) => {
                  const p = PRESETS_V6.find((x) => x.label === val);
                  if (p) {
                    setIpv6(p.ip);
                    setIpv6Prefix(p.prefix);
                  }
                }}
                options={PRESETS_V6.map((p) => ({ value: p.label, label: p.label }))}
                ariaLabel="IPv6 Presets"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="sm:col-span-2">
                <Field label="IPv6 Address" hint="e.g. 2001:db8:abcd::1 or paste with /64">
                  <TextInput
                    value={ipv6}
                    onChange={(e) => handleIpv6Change(e.target.value)}
                    placeholder="2001:db8:abcd:0012::1"
                    aria-label="IPv6 Address"
                  />
                </Field>
              </div>
              <div>
                <Field label="Prefix Length (/mask)" hint="Common: /48, /56, /64, /128">
                  <SelectInput
                    value={ipv6Prefix}
                    onChange={(e) => setIpv6Prefix(e.target.value)}
                    aria-label="IPv6 Prefix"
                  >
                    {[128, 126, 124, 120, 112, 96, 64, 60, 56, 48, 32, 16].map((p) => (
                      <option key={p} value={p.toString()}>
                        /{p} — {p === 128 ? "Single Host" : p === 64 ? "Standard Subnet" : p === 48 ? "Site Allocation" : p === 32 ? "ISP Allocation" : `Prefix /${p}`}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
              </div>
            </div>
          </ToolSection>

          {resultV6 ? (
            <>
              <ToolDivider />

              <ToolSection title="IPv6 Calculation Results">
                <StatGrid>
                  <Stat label="Total /64 Subnets" value={resultV6.totalSubnets64} tone="success" />
                  <Stat label="Prefix Length" value={`/${resultV6.prefix}`} />
                  <Stat label="Network Base" value={resultV6.compressedNetwork} />
                  <Stat label="Scope" value={resultV6.ipType.split(" ")[0]} hint={resultV6.ipType} />
                </StatGrid>

                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { label: "Subnet Prefix", val: `${resultV6.compressedNetwork}/${resultV6.prefix}`, key: "v6_net" },
                    { label: "Expanded Network", val: resultV6.networkAddress, key: "v6_exp" },
                    { label: "First Address", val: resultV6.firstIp, key: "v6_first" },
                    { label: "Last Address", val: resultV6.lastIp, key: "v6_last" },
                    { label: "Type & Scope", val: resultV6.ipType, key: "v6_type" },
                    { label: "Reverse DNS Zone", val: resultV6.ip6Arpa, key: "v6_rdns" },
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

                <div className="rounded-lg border bg-muted/40 p-4 space-y-2">
                  <span className="text-xs font-semibold text-foreground">Total Addresses in Subnet</span>
                  <p className="font-mono text-xs break-all text-muted-foreground">{resultV6.totalAddresses}</p>
                </div>

                <ActionBar>
                  <Button variant="outline" size="sm" onClick={copyAllSummaryV6}>
                    {copiedKey === "summary" ? <Check className="size-3.5 text-success mr-1" /> : <Copy className="size-3.5 mr-1" />}
                    Copy Full IPv6 Summary
                  </Button>
                </ActionBar>
              </ToolSection>

              {/* IPv6 Reference Table */}
              <ToolSection title="IPv6 CIDR Prefix Reference">
                <div className="overflow-x-auto rounded-lg border bg-card">
                  <table className="w-full text-left text-xs font-mono">
                    <thead className="border-b bg-muted/60 text-muted-foreground">
                      <tr>
                        <th className="px-3 py-2">Prefix</th>
                        <th className="px-3 py-2">Standard Usage</th>
                        <th className="px-3 py-2">Number of /64 Subnets</th>
                        <th className="px-3 py-2">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {[
                        { p: 32, label: "ISP / Regional Allocation", subnets: "4,294,967,296" },
                        { p: 48, label: "Enterprise / Site Network", subnets: "65,536" },
                        { p: 56, label: "Small Business / Branch", subnets: "256" },
                        { p: 60, label: "Residential / Home Lab", subnets: "16" },
                        { p: 64, label: "Standard Local LAN Subnet", subnets: "1" },
                        { p: 126, label: "Router Point-to-Point Link", subnets: "N/A" },
                        { p: 128, label: "Single Host / Loopback", subnets: "N/A" },
                      ].map((item) => (
                        <tr
                          key={item.p}
                          className={parseInt(ipv6Prefix, 10) === item.p ? "bg-primary/10 font-semibold" : "hover:bg-muted/40"}
                        >
                          <td className="px-3 py-1.5">/{item.p}</td>
                          <td className="px-3 py-1.5 font-sans">{item.label}</td>
                          <td className="px-3 py-1.5">{item.subnets}</td>
                          <td className="px-3 py-1.5">
                            <button
                              type="button"
                              onClick={() => setIpv6Prefix(item.p.toString())}
                              className="text-primary hover:underline"
                            >
                              Apply
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </ToolSection>
            </>
          ) : (
            <Notice tone="error">
              Invalid IPv6 address. Please enter a valid hexadecimal IPv6 address (e.g. 2001:db8:abcd::1).
            </Notice>
          )}
        </>
      )}
    </div>
  );
}

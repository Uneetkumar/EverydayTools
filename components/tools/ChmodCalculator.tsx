"use client";

import React, { useState, useMemo } from "react";
import { Copy, Check, Terminal, Shield, FolderKey } from "lucide-react";
import { toast } from "sonner";
import {
  ToolSection,
  Field,
  TextInput,
  StatGrid,
  Stat,
  Chips,
  ActionBar,
  ToolDivider,
} from "@/components/tool/kit";
import { Button } from "@/components/ui/button";

interface PermissionsState {
  uR: boolean;
  uW: boolean;
  uX: boolean;
  gR: boolean;
  gW: boolean;
  gX: boolean;
  oR: boolean;
  oW: boolean;
  oX: boolean;
  suid: boolean;
  sgid: boolean;
  sticky: boolean;
}

const PRESETS = [
  { label: "Standard Folder (755)", octal: "755" },
  { label: "Standard File (644)", octal: "644" },
  { label: "SSH Private Key (600)", octal: "600" },
  { label: "SSH Folder ~/.ssh (700)", octal: "700" },
  { label: "Executable Script (755)", octal: "755" },
  { label: "Shared /tmp Dir (1777)", octal: "1777" },
  { label: "Read-Only (444)", octal: "444" },
  { label: "Full Access (777)", octal: "777" },
];

export default function ChmodCalculator() {
  const [perms, setPerms] = useState<PermissionsState>({
    uR: true,
    uW: true,
    uX: true,
    gR: true,
    gW: false,
    gX: true,
    oR: true,
    oW: false,
    oX: true,
    suid: false,
    sgid: false,
    sticky: false,
  });

  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Derive Octal Numbers
  const specialOctal = (perms.suid ? 4 : 0) + (perms.sgid ? 2 : 0) + (perms.sticky ? 1 : 0);
  const userOctal = (perms.uR ? 4 : 0) + (perms.uW ? 2 : 0) + (perms.uX ? 1 : 0);
  const groupOctal = (perms.gR ? 4 : 0) + (perms.gW ? 2 : 0) + (perms.gX ? 1 : 0);
  const othersOctal = (perms.oR ? 4 : 0) + (perms.oW ? 2 : 0) + (perms.oX ? 1 : 0);

  const octal3 = `${userOctal}${groupOctal}${othersOctal}`;
  const octal4 = `${specialOctal}${octal3}`;

  // Symbolic representation (-rwxr-xr-x)
  const symbolic = useMemo(() => {
    let uXChar = perms.uX ? "x" : "-";
    if (perms.suid) uXChar = perms.uX ? "s" : "S";

    let gXChar = perms.gX ? "x" : "-";
    if (perms.sgid) gXChar = perms.gX ? "s" : "S";

    let oXChar = perms.oX ? "x" : "-";
    if (perms.sticky) oXChar = perms.oX ? "t" : "T";

    return [
      "-",
      perms.uR ? "r" : "-",
      perms.uW ? "w" : "-",
      uXChar,
      perms.gR ? "r" : "-",
      perms.gW ? "w" : "-",
      gXChar,
      perms.oR ? "r" : "-",
      perms.oW ? "w" : "-",
      oXChar,
    ].join("");
  }, [perms]);

  // Symbolic UGO format (u=rwx,g=rx,o=rx)
  const symbolicUgo = useMemo(() => {
    const getParts = (r: boolean, w: boolean, x: boolean) => {
      let s = "";
      if (r) s += "r";
      if (w) s += "w";
      if (x) s += "x";
      return s || "-";
    };
    return `u=${getParts(perms.uR, perms.uW, perms.uX)},g=${getParts(perms.gR, perms.gW, perms.gX)},o=${getParts(perms.oR, perms.oW, perms.oX)}`;
  }, [perms]);

  const applyOctal = (val: string) => {
    const clean = val.replace(/[^0-7]/g, "");
    if (clean.length === 3 || clean.length === 4) {
      const padded = clean.padStart(4, "0");
      const s = parseInt(padded[0], 10);
      const u = parseInt(padded[1], 10);
      const g = parseInt(padded[2], 10);
      const o = parseInt(padded[3], 10);

      setPerms({
        suid: (s & 4) === 4,
        sgid: (s & 2) === 2,
        sticky: (s & 1) === 1,
        uR: (u & 4) === 4,
        uW: (u & 2) === 2,
        uX: (u & 1) === 1,
        gR: (g & 4) === 4,
        gW: (g & 2) === 2,
        gX: (g & 1) === 1,
        oR: (o & 4) === 4,
        oW: (o & 2) === 2,
        oX: (o & 1) === 1,
      });
    }
  };

  const applySymbolic = (sym: string) => {
    let s = sym.trim();
    if (s.length === 10 && (s[0] === "-" || s[0] === "d" || s[0] === "l")) s = s.slice(1);
    if (s.length !== 9) return;
    const uR = s[0] === "r";
    const uW = s[1] === "w";
    const uX = s[2] === "x" || s[2] === "s";
    const suid = s[2] === "s" || s[2] === "S";

    const gR = s[3] === "r";
    const gW = s[4] === "w";
    const gX = s[5] === "x" || s[5] === "s";
    const sgid = s[5] === "s" || s[5] === "S";

    const oR = s[6] === "r";
    const oW = s[7] === "w";
    const oX = s[8] === "x" || s[8] === "t";
    const sticky = s[8] === "t" || s[8] === "T";

    setPerms({ uR, uW, uX, suid, gR, gW, gX, sgid, oR, oW, oX, sticky });
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const currentOctal = specialOctal > 0 ? octal4 : octal3;

  return (
    <div className="space-y-6">
      <ToolSection
        title="Linux / Unix Permissions Matrix"
        description="Toggle read, write, and execute bits for Owner, Group, and Others. Syncs instantly with octal, symbolic, and recursive commands."
      >
        <Chips
          value={null}
          onChange={(val) => {
            const p = PRESETS.find((x) => x.label === val);
            if (p) applyOctal(p.octal);
          }}
          options={PRESETS.map((p) => ({ value: p.label, label: p.label }))}
          ariaLabel="Permissions Presets"
        />

        {/* Real-time Octal & Symbolic Input Sync */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Octal Notation (e.g. 755 or 1777)" hint="Type 3 or 4 digits to sync checkboxes">
            <TextInput
              value={currentOctal}
              onChange={(e) => applyOctal(e.target.value)}
              placeholder="755"
              className="font-mono font-bold text-sm"
              aria-label="Octal Permission Value"
            />
          </Field>
          <Field label="Symbolic Notation (e.g. -rwxr-xr-x)" hint="Type 9 or 10 characters to sync">
            <TextInput
              value={symbolic}
              onChange={(e) => applySymbolic(e.target.value)}
              placeholder="-rwxr-xr-x"
              className="font-mono font-bold text-sm"
              aria-label="Symbolic Permission Value"
            />
          </Field>
        </div>

        {/* 3x3 Permission Matrix Table */}
        <div className="overflow-x-auto rounded-lg border bg-card p-4">
          <table className="w-full text-center">
            <thead>
              <tr className="border-b text-xs font-semibold text-muted-foreground">
                <th className="pb-3 text-left">Role</th>
                <th className="pb-3">Read (4)</th>
                <th className="pb-3">Write (2)</th>
                <th className="pb-3">Execute (1)</th>
                <th className="pb-3">Octal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm">
              <tr>
                <td className="py-3 text-left font-medium text-foreground">
                  Owner / User (<code className="text-xs">u</code>)
                </td>
                <td className="py-3">
                  <input
                    type="checkbox"
                    checked={perms.uR}
                    onChange={(e) => setPerms((p) => ({ ...p, uR: e.target.checked }))}
                    className="size-4 rounded accent-primary cursor-pointer"
                  />
                </td>
                <td className="py-3">
                  <input
                    type="checkbox"
                    checked={perms.uW}
                    onChange={(e) => setPerms((p) => ({ ...p, uW: e.target.checked }))}
                    className="size-4 rounded accent-primary cursor-pointer"
                  />
                </td>
                <td className="py-3">
                  <input
                    type="checkbox"
                    checked={perms.uX}
                    onChange={(e) => setPerms((p) => ({ ...p, uX: e.target.checked }))}
                    className="size-4 rounded accent-primary cursor-pointer"
                  />
                </td>
                <td className="py-3 font-mono font-bold text-primary">{userOctal}</td>
              </tr>
              <tr>
                <td className="py-3 text-left font-medium text-foreground">
                  Group (<code className="text-xs">g</code>)
                </td>
                <td className="py-3">
                  <input
                    type="checkbox"
                    checked={perms.gR}
                    onChange={(e) => setPerms((p) => ({ ...p, gR: e.target.checked }))}
                    className="size-4 rounded accent-primary cursor-pointer"
                  />
                </td>
                <td className="py-3">
                  <input
                    type="checkbox"
                    checked={perms.gW}
                    onChange={(e) => setPerms((p) => ({ ...p, gW: e.target.checked }))}
                    className="size-4 rounded accent-primary cursor-pointer"
                  />
                </td>
                <td className="py-3">
                  <input
                    type="checkbox"
                    checked={perms.gX}
                    onChange={(e) => setPerms((p) => ({ ...p, gX: e.target.checked }))}
                    className="size-4 rounded accent-primary cursor-pointer"
                  />
                </td>
                <td className="py-3 font-mono font-bold text-primary">{groupOctal}</td>
              </tr>
              <tr>
                <td className="py-3 text-left font-medium text-foreground">
                  Others / Public (<code className="text-xs">o</code>)
                </td>
                <td className="py-3">
                  <input
                    type="checkbox"
                    checked={perms.oR}
                    onChange={(e) => setPerms((p) => ({ ...p, oR: e.target.checked }))}
                    className="size-4 rounded accent-primary cursor-pointer"
                  />
                </td>
                <td className="py-3">
                  <input
                    type="checkbox"
                    checked={perms.oW}
                    onChange={(e) => setPerms((p) => ({ ...p, oW: e.target.checked }))}
                    className="size-4 rounded accent-primary cursor-pointer"
                  />
                </td>
                <td className="py-3">
                  <input
                    type="checkbox"
                    checked={perms.oX}
                    onChange={(e) => setPerms((p) => ({ ...p, oX: e.target.checked }))}
                    className="size-4 rounded accent-primary cursor-pointer"
                  />
                </td>
                <td className="py-3 font-mono font-bold text-primary">{othersOctal}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Special Bits */}
        <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
          <span className="text-xs font-semibold text-foreground">Special Attributes</span>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={perms.suid}
                onChange={(e) => setPerms((p) => ({ ...p, suid: e.target.checked }))}
                className="size-4 rounded accent-primary"
              />
              <span>SUID (SetUID = 4000)</span>
            </label>
            <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={perms.sgid}
                onChange={(e) => setPerms((p) => ({ ...p, sgid: e.target.checked }))}
                className="size-4 rounded accent-primary"
              />
              <span>SGID (SetGID = 2000)</span>
            </label>
            <label className="flex items-center gap-2 text-xs font-medium text-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={perms.sticky}
                onChange={(e) => setPerms((p) => ({ ...p, sticky: e.target.checked }))}
                className="size-4 rounded accent-primary"
              />
              <span>Sticky Bit (1000)</span>
            </label>
          </div>
        </div>
      </ToolSection>

      <ToolDivider />

      <ToolSection title="Permissions Output">
        <StatGrid>
          <Stat label="Octal Notation" value={specialOctal > 0 ? octal4 : octal3} tone="success" />
          <Stat label="Symbolic Notation" value={symbolic} />
          <Stat label="Symbolic UGO" value={symbolicUgo} />
          <Stat label="File Mode" value={specialOctal > 0 ? `0${octal4}` : `0${octal3}`} />
        </StatGrid>

        <div className="space-y-3">
          {[
            {
              label: "Standard Chmod Command",
              cmd: `chmod ${specialOctal > 0 ? octal4 : octal3} filename`,
              key: "cmd_std",
            },
            {
              label: "Recursive Directory Command",
              cmd: `chmod -R ${specialOctal > 0 ? octal4 : octal3} /path/to/dir`,
              key: "cmd_rec",
            },
            {
              label: "UGO Symbolic Command",
              cmd: `chmod ${symbolicUgo} filename`,
              key: "cmd_ugo",
            },
            {
              label: "Fix Web Permissions (Directories 755 / Files 644)",
              cmd: `find . -type d -exec chmod 755 {} + && find . -type f -exec chmod 644 {} +`,
              key: "cmd_web",
            },
          ].map((row) => (
            <div
              key={row.key}
              className="flex items-center justify-between rounded-lg border bg-card p-3 shadow-soft"
            >
              <div className="min-w-0 pr-2">
                <span className="text-xs font-medium text-muted-foreground">{row.label}</span>
                <p className="truncate font-mono text-xs font-semibold text-foreground">{row.cmd}</p>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => copyToClipboard(row.cmd, row.key)}
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
    </div>
  );
}

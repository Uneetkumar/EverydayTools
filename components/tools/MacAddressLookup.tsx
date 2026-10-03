"use client";

import React, { useState, useMemo } from "react";
import { Copy, Check, Dices, Info, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import {
  ToolSection,
  Field,
  TextInput,
  StatGrid,
  Stat,
  Chips,
  Notice,
  ActionBar,
  ToolDivider,
} from "@/components/tool/kit";
import { Button } from "@/components/ui/button";

// Comprehensive offline database of common IEEE OUI prefixes (first 3 bytes: 6 hex chars)
const OUI_DATABASE: Record<string, string> = {
  // Apple
  "0017F2": "Apple, Inc.",
  "001B63": "Apple, Inc.",
  "001E52": "Apple, Inc.",
  "002312": "Apple, Inc.",
  "002500": "Apple, Inc.",
  "00254B": "Apple, Inc.",
  "002608": "Apple, Inc.",
  "0026B0": "Apple, Inc.",
  "28CFE9": "Apple, Inc.",
  "3C0754": "Apple, Inc.",
  "406C8F": "Apple, Inc.",
  "ACDE48": "Apple, Inc.",
  "F01898": "Apple, Inc.",
  "FCFC48": "Apple, Inc.",
  // Cisco
  "00000C": "Cisco Systems, Inc.",
  "000142": "Cisco Systems, Inc.",
  "000143": "Cisco Systems, Inc.",
  "000163": "Cisco Systems, Inc.",
  "000196": "Cisco Systems, Inc.",
  "000197": "Cisco Systems, Inc.",
  "000216": "Cisco Systems, Inc.",
  "000217": "Cisco Systems, Inc.",
  "00024A": "Cisco Systems, Inc.",
  "00024B": "Cisco Systems, Inc.",
  "0002B9": "Cisco Systems, Inc.",
  "0002BA": "Cisco Systems, Inc.",
  "0002FC": "Cisco Systems, Inc.",
  // Intel
  "0002B3": "Intel Corporation",
  "000347": "Intel Corporation",
  "000423": "Intel Corporation",
  "0007E9": "Intel Corporation",
  "000E0C": "Intel Corporation",
  "001302": "Intel Corporation",
  "001320": "Intel Corporation",
  "0013E8": "Intel Corporation",
  "001500": "Intel Corporation",
  "001517": "Intel Corporation",
  "3413E8": "Intel Corporation",
  "6805CA": "Intel Corporation",
  // Samsung
  "0000F0": "Samsung Electronics",
  "000278": "Samsung Electronics",
  "0007AB": "Samsung Electronics",
  "000918": "Samsung Electronics",
  "000D44": "Samsung Electronics",
  "000DE0": "Samsung Electronics",
  "001247": "Samsung Electronics",
  "0012FB": "Samsung Electronics",
  "001377": "Samsung Electronics",
  "001599": "Samsung Electronics",
  "00166B": "Samsung Electronics",
  "549B12": "Samsung Electronics",
  "88365F": "Samsung Electronics",
  // Google
  "001A11": "Google, Inc.",
  "3C5AB4": "Google, Inc.",
  "546009": "Google, Inc.",
  "94EB2C": "Google, Inc.",
  "F4F5DB": "Google, Inc.",
  "F88FCA": "Google, Inc.",
  // Microsoft
  "0003FF": "Microsoft Corporation",
  "000D3A": "Microsoft Corporation",
  "00125A": "Microsoft Corporation",
  "00155D": "Microsoft Corporation (Hyper-V)",
  "0017FA": "Microsoft Corporation",
  "001D60": "Microsoft Corporation",
  "281878": "Microsoft Corporation",
  "7C1E52": "Microsoft Corporation",
  "DCB4C4": "Microsoft Corporation",
  // Dell
  "00065B": "Dell Inc.",
  "000874": "Dell Inc.",
  "000BDB": "Dell Inc.",
  "000D56": "Dell Inc.",
  "000F1F": "Dell Inc.",
  "001143": "Dell Inc.",
  "00123F": "Dell Inc.",
  "14FE76": "Dell Inc.",
  "B82A72": "Dell Inc.",
  // HP / Hewlett Packard
  "0001E6": "Hewlett Packard Enterprise",
  "0002A5": "Hewlett Packard Enterprise",
  "000802": "Hewlett Packard Enterprise",
  "000B86": "Hewlett Packard Enterprise",
  "000E7F": "Hewlett Packard Enterprise",
  "00110A": "Hewlett Packard Enterprise",
  "0014C2": "Hewlett Packard Enterprise",
  // Raspberry Pi
  "B827EB": "Raspberry Pi Foundation",
  "DCA632": "Raspberry Pi Trading Ltd",
  "E45F01": "Raspberry Pi Trading Ltd",
  "28CDC1": "Raspberry Pi Ltd",
  // TP-Link
  "000A37": "TP-Link Technologies Co., Ltd.",
  "001478": "TP-Link Technologies Co., Ltd.",
  "0019E0": "TP-Link Technologies Co., Ltd.",
  "002127": "TP-Link Technologies Co., Ltd.",
  "0023CD": "TP-Link Technologies Co., Ltd.",
  "002586": "TP-Link Technologies Co., Ltd.",
  "50C7BF": "TP-Link Technologies Co., Ltd.",
  "984827": "TP-Link Technologies Co., Ltd.",
  // Netgear
  "00095B": "Netgear",
  "000FB5": "Netgear",
  "00146C": "Netgear",
  "00184D": "Netgear",
  "001B2F": "Netgear",
  "001E2A": "Netgear",
  "204E7F": "Netgear",
  "841B5E": "Netgear",
  // Huawei
  "000B98": "Huawei Technologies Co., Ltd.",
  "000FE2": "Huawei Technologies Co., Ltd.",
  "001882": "Huawei Technologies Co., Ltd.",
  "001E10": "Huawei Technologies Co., Ltd.",
  "00259E": "Huawei Technologies Co., Ltd.",
  "200BC7": "Huawei Technologies Co., Ltd.",
  "404D8E": "Huawei Technologies Co., Ltd.",
  // Sony
  "00014A": "Sony Corporation",
  "00041F": "Sony Corporation",
  "000A27": "Sony Interactive Entertainment",
  "000D8F": "Sony Corporation",
  "001315": "Sony Corporation",
  "0019C5": "Sony Interactive Entertainment",
  "709E29": "Sony Interactive Entertainment",
  // Xiaomi
  "009E68": "Xiaomi Communications Co., Ltd.",
  "14F65A": "Xiaomi Communications Co., Ltd.",
  "286C07": "Xiaomi Communications Co., Ltd.",
  "640980": "Xiaomi Communications Co., Ltd.",
  "7C49EB": "Xiaomi Communications Co., Ltd.",
  // Asus / ASUSTek
  "000C6E": "ASUSTek Computer Inc.",
  "000E08": "ASUSTek Computer Inc.",
  "0011D8": "ASUSTek Computer Inc.",
  "0013D4": "ASUSTek Computer Inc.",
  "0015F2": "ASUSTek Computer Inc.",
  "049226": "ASUSTek Computer Inc.",
  // Amazon
  "00FC8B": "Amazon Technologies Inc.",
  "38F73D": "Amazon Technologies Inc.",
  "44650D": "Amazon Technologies Inc.",
  "68545A": "Amazon Technologies Inc.",
  "747548": "Amazon Technologies Inc.",
  "AC63BE": "Amazon Technologies Inc.",
  // Realtek
  "00070E": "Realtek Semiconductor Corp.",
  "000EC6": "Realtek Semiconductor Corp.",
  "00184A": "Realtek Semiconductor Corp.",
  "00E04C": "Realtek Semiconductor Corp.",
  "525400": "QEMU / Realtek Virtual NIC",
  // VMware & VirtualBox
  "000569": "VMware, Inc.",
  "000C29": "VMware, Inc.",
  "001C14": "VMware, Inc.",
  "005056": "VMware, Inc.",
  "080027": "Oracle VirtualBox",
};

const SAMPLE_MACS = [
  { label: "Apple iPhone", mac: "3C:07:54:12:34:56" },
  { label: "Raspberry Pi", mac: "B8:27:EB:AA:BB:CC" },
  { label: "Cisco Router", mac: "00:00:0C:07:AC:01" },
  { label: "Intel NIC", mac: "00:02:B3:99:88:77" },
  { label: "VirtualBox VM", mac: "08:00:27:11:22:33" },
];

export default function MacAddressLookup() {
  const [input, setInput] = useState("3C:07:54:12:34:56");
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Normalize: extract all hex digits
  const cleanHex = useMemo(() => {
    return input.replace(/[^0-9A-Fa-f]/g, "").toUpperCase();
  }, [input]);

  const parsed = useMemo(() => {
    if (cleanHex.length !== 12 && cleanHex.length !== 6) return null;
    const isOuiOnly = cleanHex.length === 6;

    const octets = [];
    for (let i = 0; i < cleanHex.length; i += 2) {
      octets.push(cleanHex.slice(i, i + 2));
    }

    const colon = isOuiOnly ? `${octets.join(":")}:XX:XX:XX` : octets.join(":");
    const hyphen = isOuiOnly ? `${octets.join("-")}-XX-XX-XX` : octets.join("-");
    const dot = isOuiOnly
      ? `${octets[0]}${octets[1]}.${octets[2]}xx.xxxx`.toLowerCase()
      : `${octets[0]}${octets[1]}.${octets[2]}${octets[3]}.${octets[4]}${octets[5]}`.toLowerCase();
    const ouiKey = cleanHex.slice(0, 6);
    const vendor = OUI_DATABASE[ouiKey] ?? "Unknown Vendor (Private or Unregistered OUI)";

    // First byte bit analysis
    const firstByte = parseInt(octets[0], 16);
    const isMulticast = (firstByte & 1) === 1; // Bit 0 (I/G bit)
    const isLocal = (firstByte & 2) === 2; // Bit 1 (U/L bit)

    // Binary representation
    const binary = octets.map((o) => parseInt(o, 16).toString(2).padStart(8, "0")).join(" ");

    // BigInt for integer representation
    const integer = BigInt("0x" + cleanHex).toString();

    return {
      colon,
      hyphen,
      dot,
      raw: cleanHex,
      ouiKey: `${octets[0]}:${octets[1]}:${octets[2]}`,
      vendor,
      isMulticast,
      isLocal,
      binary,
      integer,
      octets,
      isOuiOnly,
    };
  }, [cleanHex]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const generateRandomMac = (type: "unicast" | "multicast" | "local") => {
    const bytes = [];
    for (let i = 0; i < 6; i++) {
      bytes.push(Math.floor(Math.random() * 256));
    }
    if (type === "unicast") {
      bytes[0] = bytes[0] & ~1; // Clear bit 0
      bytes[0] = bytes[0] | 2; // Set bit 1 (local)
    } else if (type === "multicast") {
      bytes[0] = bytes[0] | 1; // Set bit 0
    } else if (type === "local") {
      bytes[0] = (bytes[0] & ~1) | 2; // Clear bit 0, set bit 1
    }
    const hex = bytes.map((b) => b.toString(16).padStart(2, "0").toUpperCase()).join(":");
    setInput(hex);
  };

  return (
    <div className="space-y-6">
      <ToolSection
        title="MAC Address Input"
        description="Enter a MAC address in any format (00:11:22:33:44:55, 00-11-22-33-44-55, 0011.2233.4455, or raw hex)."
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Chips
            value={null}
            onChange={(val) => {
              const item = SAMPLE_MACS.find((x) => x.label === val);
              if (item) setInput(item.mac);
            }}
            options={SAMPLE_MACS.map((m) => ({ value: m.label, label: m.label }))}
            ariaLabel="Sample MAC addresses"
          />

          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" onClick={() => generateRandomMac("unicast")}>
              <Dices className="size-3.5" /> Random MAC
            </Button>
          </div>
        </div>

        <Field label="MAC Address / EUI-48" hint="Case-insensitive, separators are automatically normalized">
          <TextInput
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="00:1A:2B:3C:4D:5E"
            aria-label="MAC Address Input"
          />
        </Field>
      </ToolSection>

      {parsed ? (
        <>
          <ToolDivider />

          <ToolSection title="Vendor & OUI Details">
            <StatGrid>
              <Stat label="Hardware Vendor" value={parsed.vendor.split(" ")[0]} hint={parsed.vendor} tone="success" />
              <Stat label="OUI Prefix" value={parsed.ouiKey} hint="IEEE Organization Block" />
              <Stat
                label="Transmission Type"
                value={parsed.isMulticast ? "Multicast / Group" : "Unicast (Individual)"}
              />
              <Stat
                label="Administration"
                value={parsed.isLocal ? "Locally Administered" : "Globally Unique (OUI)"}
              />
            </StatGrid>
          </ToolSection>

          <ToolSection title="Normalized Formats">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: "Standard Colon (Linux/Unix/macOS)", val: parsed.colon, key: "colon" },
                { label: "Hyphen Notation (Windows)", val: parsed.hyphen, key: "hyphen" },
                { label: "Cisco Quad-Dot Notation", val: parsed.dot, key: "dot" },
                { label: "Raw Hexadecimal (Clean)", val: parsed.raw, key: "raw" },
                { label: "Integer (Base 10)", val: parsed.integer, key: "int" },
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
                <span className="text-xs font-semibold text-foreground">48-Bit Binary Representation</span>
                <span className="text-xs text-muted-foreground">EUI-48 Bit Stream</span>
              </div>
              <p className="font-mono text-xs text-foreground break-all">{parsed.binary}</p>
              <div className="pt-2 text-xs text-muted-foreground">
                <p>
                  • <strong>I/G Bit (Bit 0):</strong> {parsed.isMulticast ? "1 = Group / Multicast" : "0 = Individual / Unicast"}
                </p>
                <p>
                  • <strong>U/L Bit (Bit 1):</strong> {parsed.isLocal ? "1 = Locally Administered (Software/Virtual)" : "0 = Universally Administered (IEEE Burned-In)"}
                </p>
              </div>
            </div>
          </ToolSection>
        </>
      ) : (
        <Notice tone="error">
          Please enter a valid 12-digit hexadecimal MAC address (e.g. 00:1A:2B:3C:4D:5E). Currently {cleanHex.length}/12 hex characters.
        </Notice>
      )}
    </div>
  );
}

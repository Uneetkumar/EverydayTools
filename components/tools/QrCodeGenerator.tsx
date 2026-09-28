"use client";

import React, { useState, useRef, useMemo } from "react";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import JSZip from "jszip";
import { toast } from "sonner";
import {
  Archive,
  ArrowRightLeft,
  Calendar,
  Check,
  Copy,
  CreditCard,
  Download,
  FileSpreadsheet,
  FileText,
  FileUp,
  FolderDown,
  Globe,
  Mail,
  MapPin,
  MessageSquare,
  MessageSquareText,
  Phone,
  Plus,
  QrCode,
  RefreshCw,
  Trash2,
  Upload,
  User,
  Wifi,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Field,
  Notice,
  OptionCards,
  Segmented,
  SelectInput,
  TextArea,
  TextInput,
  ToggleRow,
  ToolDivider,
  ToolSection,
} from "@/components/tool/kit";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import { downloadBlob, downloadDataUrl } from "@/lib/utils/download";
import { copyText } from "@/lib/utils/clipboard";
import { markToolCompleted } from "@/lib/analytics";
import { cn } from "@/lib/utils";

type QrTab =
  | "url"
  | "vcard"
  | "wifi"
  | "phone"
  | "sms"
  | "email"
  | "whatsapp"
  | "event"
  | "geo"
  | "payment"
  | "text"
  | "batch";
type FrameStyle = "none" | "badge" | "card";
type ErrorLevel = "L" | "M" | "Q" | "H";

const TYPES: { id: QrTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "url", label: "Link", icon: Globe },
  { id: "text", label: "Text", icon: FileText },
  { id: "wifi", label: "Wi-Fi", icon: Wifi },
  { id: "vcard", label: "Contact", icon: User },
  { id: "email", label: "Email", icon: Mail },
  { id: "phone", label: "Phone", icon: Phone },
  { id: "sms", label: "SMS", icon: MessageSquareText },
  { id: "whatsapp", label: "WhatsApp", icon: MessageSquare },
  { id: "event", label: "Event", icon: Calendar },
  { id: "geo", label: "Location", icon: MapPin },
  { id: "payment", label: "Payment", icon: CreditCard },
  { id: "batch", label: "Bulk (CSV)", icon: FileSpreadsheet },
];

const ERROR_LEVELS: Record<ErrorLevel, string> = {
  L: "Low — survives about 7% damage",
  M: "Medium — about 15%",
  Q: "Quartile — about 25%",
  H: "High — about 30%, needed for a logo",
};

interface PresetTheme {
  id: string;
  name: string;
  fg: string;
  bg: string;
}

const COLOR_PRESETS: PresetTheme[] = [
  { id: "midnight", name: "Midnight", fg: "#0f172a", bg: "#ffffff" },
  { id: "ocean", name: "Ocean blue", fg: "#1d4ed8", bg: "#eff6ff" },
  { id: "emerald", name: "Emerald", fg: "#047857", bg: "#f0fdf4" },
  { id: "violet", name: "Royal purple", fg: "#6d28d9", bg: "#f5f3ff" },
  { id: "rose", name: "Sunset rose", fg: "#be123c", bg: "#fff1f2" },
  { id: "amber", name: "Warm amber", fg: "#b45309", bg: "#fffbeb" },
  { id: "cyber", name: "Cyan on navy", fg: "#06b6d4", bg: "#0f172a" },
  { id: "mono-dark", name: "White on black", fg: "#f8fafc", bg: "#090d16" },
];

const BUILT_IN_LOGOS: { id: string; name: string; src: string }[] = [
  { id: "none", name: "None", src: "" },
  {
    id: "globe",
    name: "Web",
    src: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 24 24' fill='none' stroke='%232563eb' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><circle cx='12' cy='12' r='10'/><path d='M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20'/><path d='M2 12h20'/></svg>",
  },
  {
    id: "wifi",
    name: "Wi-Fi",
    src: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 24 24' fill='none' stroke='%23059669' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M5 13a10 10 0 0 1 14 0'/><path d='M8.5 16.5a5 5 0 0 1 7 0'/><path d='M2 8.82a15 15 0 0 1 20 0'/><line x1='12' x2='12.01' y1='20' y2='20'/></svg>",
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    src: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 24 24' fill='none' stroke='%2310b981' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><path d='M7.9 20A9 9 0 1 0 4 16.1L2 22Z'/><path d='M8 10h.01'/><path d='M12 10h.01'/><path d='M16 10h.01'/></svg>",
  },
  {
    id: "mail",
    name: "Email",
    src: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 24 24' fill='none' stroke='%238b5cf6' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><rect width='20' height='16' x='2' y='4' rx='2'/><path d='m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7'/></svg>",
  },
];

/** Wi-Fi QR fields must escape \ ; , : and " or phones misread the network. */
const escWifi = (s: string) => s.replace(/([\\;,:"])/g, "\\$1");
/** vCard / iCalendar text values escape \ , ; and newlines. */
const escText = (s: string) => s.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/([,;])/g, "\\$1");

interface QrHistoryItem {
  id: string;
  payload: string;
  tab: QrTab;
  fgColor: string;
  bgColor: string;
  timestamp: number;
}

interface BatchCsvItem {
  id: string;
  title: string;
  type: string;
  value: string;
}

async function renderQrPng(value: string, opts: { size: number; fg: string; bg: string; level: ErrorLevel; margin: number }) {
  const QRCode = (await import("qrcode")).default;
  const canvas = document.createElement("canvas");
  await QRCode.toCanvas(canvas, value, {
    width: opts.size,
    margin: opts.margin,
    color: { dark: opts.fg, light: opts.bg },
    errorCorrectionLevel: opts.level,
  });
  return canvas;
}

export default function QrCodeGenerator() {
  const [tab, setTab] = usePersistentState<QrTab>("qr_tab", "url");

  // Inputs
  const [url, setUrl] = usePersistentState<string>("qr_url", "https://tabbench.com");
  const [text, setText] = usePersistentState<string>("qr_text", "TabBench — Fast, Private Utilities");

  // Wi-Fi
  const [wifiSsid, setWifiSsid] = usePersistentState<string>("qr_wifi_ssid", "Office_WiFi");
  const [wifiPass, setWifiPass] = usePersistentState<string>("qr_wifi_pass", "SuperSecret123!");
  const [wifiType, setWifiType] = usePersistentState<string>("qr_wifi_type", "WPA");
  const [wifiHidden, setWifiHidden] = useState<boolean>(false);

  // Email
  const [emailTo, setEmailTo] = usePersistentState<string>("qr_email_to", "hello@example.com");
  const [emailSubject, setEmailSubject] = usePersistentState<string>("qr_email_sub", "General Inquiry");
  const [emailBody, setEmailBody] = usePersistentState<string>("qr_email_body", "Hi there,\n\nI would like to inquire about...");

  // WhatsApp
  const [waPhone, setWaPhone] = usePersistentState<string>("qr_wa_phone", "14155552671");
  const [waMsg, setWaMsg] = usePersistentState<string>("qr_wa_msg", "Hi! I found your QR code on TabBench.");

  // vCard
  const [vcardFirstName, setVcardFirstName] = usePersistentState<string>("qr_vc_fname", "Alex");
  const [vcardLastName, setVcardLastName] = usePersistentState<string>("qr_vc_lname", "Morgan");
  const [vcardOrg, setVcardOrg] = usePersistentState<string>("qr_vc_org", "TabBench Inc.");
  const [vcardTitle, setVcardTitle] = usePersistentState<string>("qr_vc_title", "Senior Product Designer");
  const [vcardCell, setVcardCell] = usePersistentState<string>("qr_vc_cell", "+1 (555) 234-5678");
  const [vcardPhone, setVcardPhone] = usePersistentState<string>("qr_vc_phone", "+1 (555) 876-5432");
  const [vcardEmail, setVcardEmail] = usePersistentState<string>("qr_vc_email", "alex@example.com");
  const [vcardUrl, setVcardUrl] = usePersistentState<string>("qr_vc_url", "https://tabbench.com");
  const [vcardStreet, setVcardStreet] = usePersistentState<string>("qr_vc_street", "100 Pine Street, Suite 500");
  const [vcardCity, setVcardCity] = usePersistentState<string>("qr_vc_city", "San Francisco");
  const [vcardState, setVcardState] = usePersistentState<string>("qr_vc_state", "CA");
  const [vcardZip, setVcardZip] = usePersistentState<string>("qr_vc_zip", "94111");
  const [vcardCountry, setVcardCountry] = usePersistentState<string>("qr_vc_country", "USA");
  const [vcardNote, setVcardNote] = usePersistentState<string>("qr_vc_note", "Connect with me for developer tools and workflow inquiries.");

  // Phone / SMS
  const [phoneNum, setPhoneNum] = usePersistentState<string>("qr_phone_num", "+15552345678");
  const [smsPhone, setSmsPhone] = usePersistentState<string>("qr_sms_phone", "+15552345678");
  const [smsMessage, setSmsMessage] = usePersistentState<string>("qr_sms_msg", "Hi! I got your contact info via QR code.");

  // Event
  const [eventTitle, setEventTitle] = usePersistentState<string>("qr_ev_title", "Product Roadmap Discussion");
  const [eventLocation, setEventLocation] = usePersistentState<string>("qr_ev_loc", "Main Conference Room & Online");
  const [eventStart, setEventStart] = usePersistentState<string>("qr_ev_start", "2026-10-15T09:00");
  const [eventEnd, setEventEnd] = usePersistentState<string>("qr_ev_end", "2026-10-15T10:30");
  const [eventDesc, setEventDesc] = usePersistentState<string>("qr_ev_desc", "Review quarterly features and key roadmap milestones.");

  // Location
  const [geoLat, setGeoLat] = usePersistentState<string>("qr_geo_lat", "37.7749");
  const [geoLng, setGeoLng] = usePersistentState<string>("qr_geo_lng", "-122.4194");
  const [geoQuery, setGeoQuery] = usePersistentState<string>("qr_geo_query", "Market Street, San Francisco");

  // Payment
  const [payType, setPayType] = usePersistentState<"upi" | "bitcoin" | "paypal">("qr_pay_type", "upi");
  const [payUpiVpa, setPayUpiVpa] = usePersistentState<string>("qr_pay_upi_vpa", "merchant@bank");
  const [payUpiName, setPayUpiName] = usePersistentState<string>("qr_pay_upi_name", "TabBench Store");
  const [payUpiAmount, setPayUpiAmount] = usePersistentState<string>("qr_pay_upi_amt", "150.00");
  const [payBtcAddress, setPayBtcAddress] = usePersistentState<string>("qr_pay_btc_addr", "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa");
  const [payBtcAmount, setPayBtcAmount] = usePersistentState<string>("qr_pay_btc_amt", "0.0025");
  const [payPaypalUser, setPayPaypalUser] = usePersistentState<string>("qr_pay_pp_user", "tabbench");

  // Style
  const [fgColor, setFgColor] = usePersistentState<string>("qr_fg", "#0f172a");
  const [bgColor, setBgColor] = usePersistentState<string>("qr_bg", "#ffffff");
  const [transparentBg, setTransparentBg] = useState<boolean>(false);
  const [errorLevel, setErrorLevel] = usePersistentState<ErrorLevel>("qr_level", "H");
  const [marginSize, setMarginSize] = usePersistentState<number>("qr_margin", 2);
  const [frameStyle, setFrameStyle] = usePersistentState<FrameStyle>("qr_frame_style", "none");
  const [frameText, setFrameText] = usePersistentState<string>("qr_frame_text", "Scan me");
  const [frameSubtext, setFrameSubtext] = usePersistentState<string>("qr_frame_subtext", "");
  const [logoOption, setLogoOption] = useState<string>("none");
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(null);

  // History & actions
  const [recentQrs, setRecentQrs] = usePersistentState<QrHistoryItem[]>("recent_qrs_history", []);
  const [copiedImage, setCopiedImage] = useState(false);
  const [copiedSvg, setCopiedSvg] = useState(false);
  const [downloadRes, setDownloadRes] = useState<number>(1024);

  // Export reads from its own full-resolution canvas. Using the small preview
  // canvas as the source upscaled a 240px bitmap, so downloads were blurry.
  const exportCanvasRef = useRef<HTMLDivElement>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvFileInputRef = useRef<HTMLInputElement>(null);

  // Bulk (CSV)
  const [batchItems, setBatchItems] = useState<BatchCsvItem[]>([
    { id: "1", title: "Web Design Service", type: "url", value: "https://tabbench.com/services/web-design" },
    { id: "2", title: "Mobile App Development", type: "url", value: "https://tabbench.com/services/mobile-apps" },
    { id: "3", title: "Support Phone Line", type: "phone", value: "+1 (555) 234-5678" },
    { id: "4", title: "Customer Care Email", type: "email", value: "hello@tabbench.com" },
    { id: "5", title: "Alex Morgan Contact", type: "vcard", value: "BEGIN:VCARD\nVERSION:3.0\nFN:Alex Morgan\nORG:TabBench\nTEL:+15552345678\nEND:VCARD" },
    { id: "6", title: "Store Guest Wi-Fi", type: "wifi", value: "WIFI:T:WPA;S:Store_Guest_5G;P:secretPass99;;" },
  ]);
  const [batchIsExporting, setBatchIsExporting] = useState<boolean>(false);
  const [selectedBatchIndex, setSelectedBatchIndex] = useState<number>(0);
  const [newBatchTitle, setNewBatchTitle] = useState<string>("");
  const [newBatchType, setNewBatchType] = useState<string>("url");
  const [newBatchValue, setNewBatchValue] = useState<string>("");

  const handleAddBatchItem = () => {
    if (!newBatchValue.trim()) return;
    const newItem: BatchCsvItem = {
      id: String(Date.now()),
      title: newBatchTitle.trim() || `Item ${batchItems.length + 1}`,
      type: newBatchType,
      value: newBatchValue.trim(),
    };
    setBatchItems((prev) => [...prev, newItem]);
    setNewBatchTitle("");
    setNewBatchValue("");
  };

  const handleRemoveBatchItem = (id: string) => {
    setBatchItems((prev) => {
      const next = prev.filter((it) => it.id !== id);
      if (selectedBatchIndex >= next.length) setSelectedBatchIndex(Math.max(0, next.length - 1));
      return next;
    });
  };

  const handleCsvUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) return;
      const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length === 0) return;

      const parsed: BatchCsvItem[] = [];
      const first = lines[0].toLowerCase();
      const startIdx = first.includes("value") || first.includes("title") || first.includes("service") ? 1 : 0;

      for (let i = startIdx; i < lines.length; i++) {
        const cols = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((c) => c.replace(/^"|"$/g, "").trim());
        if (cols.length === 1 && cols[0]) {
          parsed.push({ id: String(Date.now() + i), title: `Item ${i + 1}`, type: "text", value: cols[0] });
        } else if (cols.length === 2) {
          parsed.push({ id: String(Date.now() + i), title: cols[0] || `Item ${i + 1}`, type: "url", value: cols[1] });
        } else if (cols.length >= 3) {
          parsed.push({ id: String(Date.now() + i), title: cols[0] || `Item ${i + 1}`, type: cols[1] || "text", value: cols[2] });
        }
      }

      if (parsed.length > 0) {
        setBatchItems(parsed);
        setSelectedBatchIndex(0);
        markToolCompleted();
        toast.success(`Loaded ${parsed.length} ${parsed.length === 1 ? "row" : "rows"}`);
      } else {
        toast.error("No rows found", { description: "Use the columns Title, Type, Value — the sample CSV shows the format." });
      }
    };
    reader.readAsText(file);
  };

  const downloadSampleCsv = () => {
    const sample = `Title,Type,Value
Website Design Service,url,https://tabbench.com/services/web-design
Mobile Development,url,https://tabbench.com/services/mobile-apps
Customer Support Call,phone,+15552345678
Inquiries Email,email,hello@tabbench.com
Staff Contact Card,vcard,"BEGIN:VCARD\\nVERSION:3.0\\nFN:Alex Morgan\\nORG:TabBench Inc\\nTEL:+15552345678\\nEND:VCARD"
Store Guest Wi-Fi,wifi,"WIFI:T:WPA;S:Store_Guest_5G;P:secretPass99;;"
Payment Service,upi,upi://pay?pa=merchant@bank&pn=TabBenchStore&am=250.00`;
    // A template, not a result, so it isn't added to the recent-files list.
    downloadDataUrl(URL.createObjectURL(new Blob([sample], { type: "text/csv;charset=utf-8" })), "sample-qr-codes.csv", true);
  };

  const downloadAllBatchCsv = () => {
    if (batchItems.length === 0) return;
    const nowIso = new Date().toISOString();
    const rows = batchItems
      .map((item) => `"${item.title.replace(/"/g, '""')}","${item.type}","${item.value.replace(/"/g, '""')}","${nowIso}"`)
      .join("\n");
    downloadBlob(
      new Blob(["Title,Type,Value,GeneratedDate\n" + rows], { type: "text/csv;charset=utf-8" }),
      `qr-codes-${Date.now()}.csv`,
      "qr-code-generator"
    );
    markToolCompleted();
  };

  const downloadAllBatchZip = async () => {
    if (batchItems.length === 0) return;
    setBatchIsExporting(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder("qr-codes");
      for (let i = 0; i < batchItems.length; i++) {
        const item = batchItems[i];
        const canvas = await renderQrPng(item.value, {
          size: 1024,
          fg: fgColor,
          bg: transparentBg ? "#00000000" : bgColor,
          level: errorLevel,
          margin: marginSize,
        });
        const base64Data = canvas.toDataURL("image/png").replace(/^data:image\/png;base64,/, "");
        const safeTitle = item.title.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase().slice(0, 30);
        folder?.file(`${String(i + 1).padStart(2, "0")}-${safeTitle || "qrcode"}.png`, base64Data, { base64: true });
      }
      const manifest =
        "Index,Title,Type,Value\n" +
        batchItems.map((it, idx) => `${idx + 1},"${it.title.replace(/"/g, '""')}","${it.type}","${it.value.replace(/"/g, '""')}"`).join("\n");
      zip.file("manifest.csv", manifest);
      const content = await zip.generateAsync({ type: "blob" });
      downloadBlob(content, `qr-codes-${Date.now()}.zip`, "qr-code-generator");
      markToolCompleted();
    } catch (err) {
      console.error("Batch ZIP export error:", err);
      toast.error("Couldn't create the ZIP", { description: "One of the rows may be too long to fit in a QR code." });
    } finally {
      setBatchIsExporting(false);
    }
  };

  // RFC 5545 local date-time (floating): 2026-10-15T09:00 → 20261015T090000
  const formatIcalDate = (dtStr: string): string => {
    if (!dtStr) return "";
    const clean = dtStr.replace(/[-:]/g, "");
    if (clean.includes("T")) return clean.length === 13 ? `${clean}00` : clean;
    return clean;
  };

  // Whether the current type has enough input to encode something useful.
  const hasContent = useMemo(() => {
    switch (tab) {
      case "url":
        return url.trim() !== "";
      case "text":
        return text.trim() !== "";
      case "wifi":
        return wifiSsid.trim() !== "";
      case "vcard":
        return `${vcardFirstName}${vcardLastName}${vcardOrg}`.trim() !== "";
      case "phone":
        return phoneNum.trim() !== "";
      case "sms":
        return smsPhone.trim() !== "";
      case "email":
        return emailTo.trim() !== "";
      case "whatsapp":
        return waPhone.replace(/\D/g, "") !== "";
      case "event":
        return eventTitle.trim() !== "" || eventStart !== "";
      case "geo":
        return (geoLat.trim() !== "" && geoLng.trim() !== "") || geoQuery.trim() !== "";
      case "payment":
        return payType === "upi" ? payUpiVpa.trim() !== "" : payType === "bitcoin" ? payBtcAddress.trim() !== "" : payPaypalUser.trim() !== "";
      case "batch":
        return batchItems.length > 0;
    }
  }, [tab, url, text, wifiSsid, vcardFirstName, vcardLastName, vcardOrg, phoneNum, smsPhone, emailTo, waPhone, eventTitle, eventStart, geoLat, geoLng, geoQuery, payType, payUpiVpa, payBtcAddress, payPaypalUser, batchItems.length]);

  const payload = useMemo((): string => {
    switch (tab) {
      case "url": {
        const u = url.trim();
        if (!u) return "https://tabbench.com";
        return /^[a-z][a-z0-9+.-]*:/i.test(u) ? u : `https://${u}`;
      }
      case "wifi":
        return `WIFI:T:${wifiType};S:${escWifi(wifiSsid)};P:${wifiType === "nopass" ? "" : escWifi(wifiPass)};H:${wifiHidden ? "true" : "false"};;`;
      case "phone":
        return `tel:${phoneNum.replace(/[^\d+]/g, "")}`;
      case "sms":
        return `SMSTO:${smsPhone.replace(/[^\d+]/g, "")}:${smsMessage}`;
      case "email":
        return `mailto:${emailTo.trim()}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      case "whatsapp":
        return `https://wa.me/${waPhone.replace(/\D/g, "")}${waMsg ? `?text=${encodeURIComponent(waMsg)}` : ""}`;
      case "vcard": {
        const fullName = `${vcardFirstName} ${vcardLastName}`.trim();
        const parts = [
          "BEGIN:VCARD",
          "VERSION:3.0",
          `N:${escText(vcardLastName)};${escText(vcardFirstName)};;;`,
          `FN:${escText(fullName || vcardOrg)}`,
          vcardOrg ? `ORG:${escText(vcardOrg)}` : "",
          vcardTitle ? `TITLE:${escText(vcardTitle)}` : "",
          vcardCell ? `TEL;TYPE=CELL,VOICE:${vcardCell}` : "",
          vcardPhone ? `TEL;TYPE=WORK,VOICE:${vcardPhone}` : "",
          vcardEmail ? `EMAIL;TYPE=PREF,INTERNET:${vcardEmail}` : "",
          vcardUrl ? `URL:${vcardUrl}` : "",
          vcardStreet || vcardCity || vcardState || vcardZip || vcardCountry
            ? `ADR;TYPE=WORK:;;${escText(vcardStreet)};${escText(vcardCity)};${escText(vcardState)};${escText(vcardZip)};${escText(vcardCountry)}`
            : "",
          vcardNote ? `NOTE:${escText(vcardNote)}` : "",
          "END:VCARD",
        ];
        return parts.filter(Boolean).join("\n");
      }
      case "event": {
        const start = formatIcalDate(eventStart);
        const end = formatIcalDate(eventEnd);
        return [
          "BEGIN:VCALENDAR",
          "VERSION:2.0",
          "BEGIN:VEVENT",
          `SUMMARY:${escText(eventTitle || "Event")}`,
          eventLocation ? `LOCATION:${escText(eventLocation)}` : "",
          start ? `DTSTART:${start}` : "",
          end ? `DTEND:${end}` : "",
          eventDesc ? `DESCRIPTION:${escText(eventDesc)}` : "",
          "END:VEVENT",
          "END:VCALENDAR",
        ]
          .filter(Boolean)
          .join("\n");
      }
      case "geo":
        if (geoLat.trim() && geoLng.trim()) {
          return `https://maps.google.com/?q=${encodeURIComponent(geoLat.trim())},${encodeURIComponent(geoLng.trim())}`;
        }
        return `https://maps.google.com/?q=${encodeURIComponent(geoQuery)}`;
      case "payment":
        if (payType === "upi") {
          let str = `upi://pay?pa=${encodeURIComponent(payUpiVpa.trim())}&pn=${encodeURIComponent(payUpiName)}`;
          if (payUpiAmount) str += `&am=${encodeURIComponent(payUpiAmount)}&cu=INR`;
          return str;
        } else if (payType === "bitcoin") {
          return `bitcoin:${payBtcAddress.trim()}${payBtcAmount ? `?amount=${payBtcAmount}` : ""}`;
        }
        return `https://paypal.me/${encodeURIComponent(payPaypalUser.trim())}`;
      case "batch":
        return batchItems[selectedBatchIndex]?.value || "https://tabbench.com";
      case "text":
      default:
        return text || "TabBench";
    }
  }, [
    tab, batchItems, selectedBatchIndex, url, wifiType, wifiSsid, wifiPass, wifiHidden, phoneNum, smsPhone, smsMessage,
    emailTo, emailSubject, emailBody, waPhone, waMsg, vcardFirstName, vcardLastName, vcardOrg, vcardTitle, vcardCell,
    vcardPhone, vcardEmail, vcardUrl, vcardStreet, vcardCity, vcardState, vcardZip, vcardCountry, vcardNote, eventTitle,
    eventLocation, eventStart, eventEnd, eventDesc, geoLat, geoLng, geoQuery, payType, payUpiVpa, payUpiName, payUpiAmount,
    payBtcAddress, payBtcAmount, payPaypalUser, text,
  ]);

  // A QR code holds at most ~2,900 bytes (less at higher error correction).
  const tooLong = new TextEncoder().encode(payload).length > (errorLevel === "H" ? 1270 : errorLevel === "Q" ? 1660 : errorLevel === "M" ? 2330 : 2950);

  const contrastInfo = useMemo(() => {
    const hexToRgb = (hex: string) => {
      const clean = hex.replace("#", "");
      if (clean.length === 3) return [0, 1, 2].map((i) => parseInt(clean[i] + clean[i], 16) || 0);
      return [0, 2, 4].map((i) => parseInt(clean.slice(i, i + 2), 16) || 0);
    };
    const lum = ([r, g, b]: number[]) => {
      const a = [r, g, b].map((v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    };
    const l1 = lum(hexToRgb(fgColor));
    const l2 = lum(hexToRgb(transparentBg ? "#ffffff" : bgColor));
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    return { ratio: ratio.toFixed(1), isGood: ratio >= 3.0, inverted: l1 > l2 };
  }, [fgColor, bgColor, transparentBg]);

  const activeLogoSrc = useMemo(() => {
    if (customLogoUrl) return customLogoUrl;
    return BUILT_IN_LOGOS.find((l) => l.id === logoOption)?.src ?? "";
  }, [customLogoUrl, logoOption]);

  const handleCustomLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setCustomLogoUrl(ev.target.result as string);
        setLogoOption("custom");
        setErrorLevel("H"); // A logo covers modules, so use the highest recovery
      }
    };
    reader.readAsDataURL(file);
  };

  const removeCustomLogo = () => {
    setCustomLogoUrl(null);
    setLogoOption("none");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const saveToHistory = () => {
    const item: QrHistoryItem = { id: String(Date.now()), payload, tab, fgColor, bgColor, timestamp: Date.now() };
    setRecentQrs((prev = []) => [item, ...prev.filter((q) => q.payload !== item.payload)].slice(0, 4));
  };

  const handleDownloadPng = () => {
    const canvas = exportCanvasRef.current?.querySelector("canvas");
    if (!canvas) return;

    const exportCanvas = document.createElement("canvas");
    const exportSize = downloadRes;
    const font = `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;

    if (frameStyle === "card" || frameStyle === "badge") {
      const padding = Math.round(exportSize * 0.08);
      const headerH = frameStyle === "card" ? Math.round(exportSize * 0.16) : Math.round(exportSize * 0.12);
      const footerH = frameStyle === "card" && frameSubtext ? Math.round(exportSize * 0.1) : frameStyle === "card" ? padding : 0;

      exportCanvas.width = exportSize;
      exportCanvas.height = exportSize + headerH + footerH;
      const ctx = exportCanvas.getContext("2d");
      if (!ctx) return;
      if (!transparentBg) {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
      }

      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (frameStyle === "badge") {
        const pillW = Math.round(exportSize * 0.6);
        const pillH = Math.round(headerH * 0.6);
        const pillX = (exportCanvas.width - pillW) / 2;
        const pillY = Math.round(headerH * 0.25);
        ctx.fillStyle = fgColor;
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pillW, pillH, pillH / 2);
        ctx.fill();
        ctx.fillStyle = transparentBg ? "#ffffff" : bgColor;
        ctx.font = `600 ${Math.round(pillH * 0.45)}px ${font}`;
        ctx.fillText(frameText.toUpperCase(), exportCanvas.width / 2, pillY + pillH / 2);
      } else {
        ctx.fillStyle = fgColor;
        ctx.font = `600 ${Math.round(headerH * 0.35)}px ${font}`;
        ctx.fillText(frameText.toUpperCase(), exportCanvas.width / 2, headerH / 2);
      }

      const qrDrawSize = exportSize - padding * 2;
      ctx.drawImage(canvas, padding, headerH, qrDrawSize, qrDrawSize);

      if (frameStyle === "card" && frameSubtext) {
        ctx.fillStyle = fgColor;
        ctx.globalAlpha = 0.7;
        ctx.font = `500 ${Math.round(exportSize * 0.035)}px ${font}`;
        ctx.fillText(frameSubtext, exportCanvas.width / 2, headerH + qrDrawSize + (exportCanvas.height - headerH - qrDrawSize) / 2);
        ctx.globalAlpha = 1;
      }
    } else {
      exportCanvas.width = exportSize;
      exportCanvas.height = exportSize;
      const ctx = exportCanvas.getContext("2d");
      if (!ctx) return;
      if (!transparentBg) {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, exportSize, exportSize);
      }
      ctx.drawImage(canvas, 0, 0, exportSize, exportSize);
    }

    downloadDataUrl(exportCanvas.toDataURL("image/png"), `qrcode-${tab}-${Date.now()}.png`);
    saveToHistory();
    markToolCompleted();
  };

  const svgMarkup = () => {
    const svgElem = svgContainerRef.current?.querySelector("svg");
    return svgElem ? new XMLSerializer().serializeToString(svgElem) : null;
  };

  const handleDownloadSvg = () => {
    const svg = svgMarkup();
    if (!svg) return;
    downloadBlob(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }), `qrcode-${tab}-${Date.now()}.svg`, "qr-code-generator");
    saveToHistory();
    markToolCompleted();
  };

  const handleCopyImage = () => {
    const canvas = exportCanvasRef.current?.querySelector("canvas");
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      try {
        if (typeof ClipboardItem === "undefined") throw new Error("unsupported");
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        setCopiedImage(true);
        markToolCompleted();
        setTimeout(() => setCopiedImage(false), 2000);
      } catch {
        toast.error("Couldn't copy the image", { description: "Your browser doesn't allow copying images. Download the PNG instead." });
      }
    });
  };

  const handleCopySvg = async () => {
    const svg = svgMarkup();
    if (!svg) return;
    if (await copyText(svg)) {
      setCopiedSvg(true);
      setTimeout(() => setCopiedSvg(false), 2000);
    }
  };

  const downloadHistoryItem = async (item: QrHistoryItem) => {
    try {
      const canvas = await renderQrPng(item.payload, { size: 1024, fg: item.fgColor, bg: item.bgColor, level: "H", margin: 2 });
      downloadDataUrl(canvas.toDataURL("image/png"), `qrcode-${item.tab}-${item.id}.png`);
      markToolCompleted();
    } catch {
      toast.error("Couldn't create this QR code again");
    }
  };

  const canExport = hasContent && !tooLong;
  const logoRatio = 0.16;

  return (
    <div className="space-y-6">
      {/* What to encode */}
      <div role="radiogroup" aria-label="QR code type" className="grid grid-cols-3 gap-1.5 @md:grid-cols-4 @2xl:grid-cols-6">
        {TYPES.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex h-10 items-center justify-center gap-1.5 rounded-lg border px-2 text-sm font-medium transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                active
                  ? "border-primary/50 bg-brand-subtle text-brand-subtle-foreground"
                  : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground dark:bg-input/20"
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              <span className="truncate">{t.label}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 items-start gap-8 @4xl:grid-cols-12">
        {/* Settings */}
        <div className="@container space-y-6 @4xl:col-span-7">
          <ToolSection title="Content">
            {tab === "url" && (
              <Field label="Website address" htmlFor="qr-url" hint="Links without http(s):// get https:// added.">
                <TextInput id="qr-url" type="url" inputMode="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" />
              </Field>
            )}

            {tab === "text" && (
              <Field label="Text" htmlFor="qr-text" hint={`${text.length} characters`}>
                <TextArea id="qr-text" rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder="Any text, a serial number, a note…" />
              </Field>
            )}

            {tab === "wifi" && (
              <div className="space-y-4">
                <Field label="Network name (SSID)" htmlFor="qr-ssid">
                  <TextInput id="qr-ssid" value={wifiSsid} onChange={(e) => setWifiSsid(e.target.value)} placeholder="MyHomeNetwork" autoComplete="off" />
                </Field>
                <div className="grid grid-cols-1 gap-4 @md:grid-cols-2">
                  <Field label="Security" htmlFor="qr-wifi-type">
                    <SelectInput id="qr-wifi-type" value={wifiType} onChange={(e) => setWifiType(e.target.value)}>
                      <option value="WPA">WPA / WPA2 / WPA3</option>
                      <option value="WEP">WEP (old routers)</option>
                      <option value="nopass">None (open network)</option>
                    </SelectInput>
                  </Field>
                  {wifiType !== "nopass" && (
                    <Field label="Password" htmlFor="qr-wifi-pass">
                      <TextInput id="qr-wifi-pass" value={wifiPass} onChange={(e) => setWifiPass(e.target.value)} autoComplete="off" spellCheck={false} />
                    </Field>
                  )}
                </div>
                <ToggleRow
                  id="qr-wifi-hidden"
                  label="Hidden network"
                  description="Turn on if the network name isn't broadcast."
                  checked={wifiHidden}
                  onCheckedChange={setWifiHidden}
                />
              </div>
            )}

            {tab === "vcard" && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">Phones offer to save this contact when the code is scanned.</p>
                <div className="grid grid-cols-1 gap-4 @sm:grid-cols-2">
                  <Field label="First name" htmlFor="vc-first">
                    <TextInput id="vc-first" value={vcardFirstName} onChange={(e) => setVcardFirstName(e.target.value)} autoComplete="off" />
                  </Field>
                  <Field label="Last name" htmlFor="vc-last">
                    <TextInput id="vc-last" value={vcardLastName} onChange={(e) => setVcardLastName(e.target.value)} autoComplete="off" />
                  </Field>
                  <Field label="Company" htmlFor="vc-org">
                    <TextInput id="vc-org" value={vcardOrg} onChange={(e) => setVcardOrg(e.target.value)} autoComplete="off" />
                  </Field>
                  <Field label="Job title" htmlFor="vc-title">
                    <TextInput id="vc-title" value={vcardTitle} onChange={(e) => setVcardTitle(e.target.value)} autoComplete="off" />
                  </Field>
                  <Field label="Mobile" htmlFor="vc-cell">
                    <TextInput id="vc-cell" type="tel" value={vcardCell} onChange={(e) => setVcardCell(e.target.value)} autoComplete="off" />
                  </Field>
                  <Field label="Work phone" htmlFor="vc-phone">
                    <TextInput id="vc-phone" type="tel" value={vcardPhone} onChange={(e) => setVcardPhone(e.target.value)} autoComplete="off" />
                  </Field>
                  <Field label="Email" htmlFor="vc-email">
                    <TextInput id="vc-email" type="email" value={vcardEmail} onChange={(e) => setVcardEmail(e.target.value)} autoComplete="off" />
                  </Field>
                  <Field label="Website" htmlFor="vc-url">
                    <TextInput id="vc-url" type="url" value={vcardUrl} onChange={(e) => setVcardUrl(e.target.value)} autoComplete="off" />
                  </Field>
                </div>
                <Field label="Street address" htmlFor="vc-street">
                  <TextInput id="vc-street" value={vcardStreet} onChange={(e) => setVcardStreet(e.target.value)} autoComplete="off" />
                </Field>
                <div className="grid grid-cols-2 gap-4 @md:grid-cols-4">
                  <Field label="City" htmlFor="vc-city">
                    <TextInput id="vc-city" value={vcardCity} onChange={(e) => setVcardCity(e.target.value)} autoComplete="off" />
                  </Field>
                  <Field label="State" htmlFor="vc-state">
                    <TextInput id="vc-state" value={vcardState} onChange={(e) => setVcardState(e.target.value)} autoComplete="off" />
                  </Field>
                  <Field label="Postcode" htmlFor="vc-zip">
                    <TextInput id="vc-zip" value={vcardZip} onChange={(e) => setVcardZip(e.target.value)} autoComplete="off" />
                  </Field>
                  <Field label="Country" htmlFor="vc-country">
                    <TextInput id="vc-country" value={vcardCountry} onChange={(e) => setVcardCountry(e.target.value)} autoComplete="off" />
                  </Field>
                </div>
                <Field label="Note" htmlFor="vc-note" hint="Optional.">
                  <TextInput id="vc-note" value={vcardNote} onChange={(e) => setVcardNote(e.target.value)} autoComplete="off" />
                </Field>
              </div>
            )}

            {tab === "phone" && (
              <Field label="Phone number" htmlFor="qr-phone" hint="Include the country code, e.g. +91 98765 43210. Scanning opens the dialler.">
                <TextInput id="qr-phone" type="tel" value={phoneNum} onChange={(e) => setPhoneNum(e.target.value)} placeholder="+1 555 019 2834" />
              </Field>
            )}

            {tab === "sms" && (
              <div className="space-y-4">
                <Field label="Phone number" htmlFor="qr-sms-phone" hint="Include the country code.">
                  <TextInput id="qr-sms-phone" type="tel" value={smsPhone} onChange={(e) => setSmsPhone(e.target.value)} />
                </Field>
                <Field label="Message" htmlFor="qr-sms-msg" hint="Opens the Messages app with this text filled in.">
                  <TextArea id="qr-sms-msg" rows={3} value={smsMessage} onChange={(e) => setSmsMessage(e.target.value)} />
                </Field>
              </div>
            )}

            {tab === "email" && (
              <div className="space-y-4">
                <Field label="To" htmlFor="qr-email-to">
                  <TextInput id="qr-email-to" type="email" value={emailTo} onChange={(e) => setEmailTo(e.target.value)} placeholder="support@example.com" />
                </Field>
                <Field label="Subject" htmlFor="qr-email-sub">
                  <TextInput id="qr-email-sub" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} />
                </Field>
                <Field label="Message" htmlFor="qr-email-body">
                  <TextArea id="qr-email-body" rows={3} value={emailBody} onChange={(e) => setEmailBody(e.target.value)} />
                </Field>
              </div>
            )}

            {tab === "whatsapp" && (
              <div className="space-y-4">
                <Field label="WhatsApp number" htmlFor="qr-wa-phone" hint="Country code and number; spaces and + are ignored.">
                  <TextInput id="qr-wa-phone" type="tel" value={waPhone} onChange={(e) => setWaPhone(e.target.value)} placeholder="14155552671" />
                </Field>
                <Field label="Message" htmlFor="qr-wa-msg" hint="Optional. Filled in when the chat opens.">
                  <TextArea id="qr-wa-msg" rows={2} value={waMsg} onChange={(e) => setWaMsg(e.target.value)} />
                </Field>
              </div>
            )}

            {tab === "event" && (
              <div className="space-y-4">
                <Field label="Event title" htmlFor="qr-ev-title">
                  <TextInput id="qr-ev-title" value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} />
                </Field>
                <Field label="Location or link" htmlFor="qr-ev-loc">
                  <TextInput id="qr-ev-loc" value={eventLocation} onChange={(e) => setEventLocation(e.target.value)} />
                </Field>
                <div className="grid grid-cols-1 gap-4 @sm:grid-cols-2">
                  <Field label="Starts" htmlFor="qr-ev-start">
                    <TextInput id="qr-ev-start" type="datetime-local" value={eventStart} onChange={(e) => setEventStart(e.target.value)} />
                  </Field>
                  <Field label="Ends" htmlFor="qr-ev-end">
                    <TextInput id="qr-ev-end" type="datetime-local" value={eventEnd} onChange={(e) => setEventEnd(e.target.value)} />
                  </Field>
                </div>
                <Field label="Description" htmlFor="qr-ev-desc" hint="Times are saved in the scanner's local time zone.">
                  <TextArea id="qr-ev-desc" rows={2} value={eventDesc} onChange={(e) => setEventDesc(e.target.value)} />
                </Field>
              </div>
            )}

            {tab === "geo" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Latitude" htmlFor="qr-lat">
                    <TextInput id="qr-lat" inputMode="decimal" value={geoLat} onChange={(e) => setGeoLat(e.target.value)} placeholder="37.7749" />
                  </Field>
                  <Field label="Longitude" htmlFor="qr-lng">
                    <TextInput id="qr-lng" inputMode="decimal" value={geoLng} onChange={(e) => setGeoLng(e.target.value)} placeholder="-122.4194" />
                  </Field>
                </div>
                <Field label="Or a place name or address" htmlFor="qr-geo-q" hint="Used when latitude or longitude is empty.">
                  <TextInput id="qr-geo-q" value={geoQuery} onChange={(e) => setGeoQuery(e.target.value)} placeholder="Eiffel Tower, Paris" />
                </Field>
              </div>
            )}

            {tab === "payment" && (
              <div className="space-y-4">
                <Segmented
                  value={payType}
                  onChange={setPayType}
                  ariaLabel="Payment method"
                  options={[
                    { value: "upi", label: "UPI" },
                    { value: "bitcoin", label: "Bitcoin" },
                    { value: "paypal", label: "PayPal.me" },
                  ]}
                />
                {payType === "upi" && (
                  <>
                    <Field label="UPI ID" htmlFor="qr-upi" hint="Works with Google Pay, PhonePe, Paytm and any UPI app.">
                      <TextInput id="qr-upi" value={payUpiVpa} onChange={(e) => setPayUpiVpa(e.target.value)} placeholder="name@okhdfcbank" autoComplete="off" />
                    </Field>
                    <div className="grid grid-cols-1 gap-4 @sm:grid-cols-2">
                      <Field label="Payee name" htmlFor="qr-upi-name">
                        <TextInput id="qr-upi-name" value={payUpiName} onChange={(e) => setPayUpiName(e.target.value)} />
                      </Field>
                      <Field label="Amount (₹)" htmlFor="qr-upi-amt" hint="Optional. Leave empty to let the payer choose.">
                        <TextInput id="qr-upi-amt" type="number" min="0" step="0.01" inputMode="decimal" value={payUpiAmount} onChange={(e) => setPayUpiAmount(e.target.value)} />
                      </Field>
                    </div>
                  </>
                )}
                {payType === "bitcoin" && (
                  <>
                    <Field label="Bitcoin address" htmlFor="qr-btc">
                      <TextInput id="qr-btc" value={payBtcAddress} onChange={(e) => setPayBtcAddress(e.target.value)} className="font-mono" autoComplete="off" spellCheck={false} />
                    </Field>
                    <Field label="Amount (BTC)" htmlFor="qr-btc-amt" hint="Optional.">
                      <TextInput id="qr-btc-amt" inputMode="decimal" value={payBtcAmount} onChange={(e) => setPayBtcAmount(e.target.value)} className="font-mono" />
                    </Field>
                  </>
                )}
                {payType === "paypal" && (
                  <Field label="PayPal.me username" htmlFor="qr-pp" hint={`Links to paypal.me/${payPaypalUser || "username"}`}>
                    <TextInput id="qr-pp" value={payPaypalUser} onChange={(e) => setPayPaypalUser(e.target.value)} autoComplete="off" />
                  </Field>
                )}
                <p className="text-xs text-muted-foreground">Scan and check the payment code yourself before you print or share it.</p>
              </div>
            )}

            {tab === "batch" && (
              <div className="space-y-4">
                <input
                  ref={csvFileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleCsvUpload(e.target.files[0]);
                      e.target.value = "";
                    }
                  }}
                />
                <p className="text-sm text-muted-foreground">
                  Make many codes at once from a CSV with the columns <code className="rounded bg-muted px-1 py-0.5 text-xs">Title, Type, Value</code>. Select a row to preview it; download them all as a ZIP of PNGs.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" onClick={() => csvFileInputRef.current?.click()}>
                    <FileUp aria-hidden="true" />
                    Upload CSV
                  </Button>
                  <Button type="button" variant="outline" onClick={downloadSampleCsv}>
                    <FolderDown aria-hidden="true" />
                    Sample CSV
                  </Button>
                </div>

                <div className="grid grid-cols-1 gap-2 @md:grid-cols-12">
                  <TextInput aria-label="Title for the new row" value={newBatchTitle} onChange={(e) => setNewBatchTitle(e.target.value)} placeholder="Title" className="@md:col-span-4" />
                  <SelectInput aria-label="Type for the new row" value={newBatchType} onChange={(e) => setNewBatchType(e.target.value)} className="@md:col-span-3">
                    <option value="url">Link</option>
                    <option value="text">Text</option>
                    <option value="vcard">Contact</option>
                    <option value="wifi">Wi-Fi</option>
                    <option value="phone">Phone</option>
                    <option value="email">Email</option>
                  </SelectInput>
                  <TextInput
                    aria-label="Content for the new row"
                    value={newBatchValue}
                    onChange={(e) => setNewBatchValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddBatchItem()}
                    placeholder="Link or text"
                    className="@md:col-span-3"
                  />
                  <Button type="button" variant="outline" onClick={handleAddBatchItem} disabled={!newBatchValue.trim()} className="h-10 @md:col-span-2">
                    <Plus aria-hidden="true" />
                    Add
                  </Button>
                </div>

                <div className="overflow-hidden rounded-lg border">
                  <div className="flex items-center justify-between border-b bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                    <span>
                      {batchItems.length} {batchItems.length === 1 ? "row" : "rows"}
                    </span>
                    {batchItems.length > 0 && (
                      <button type="button" onClick={() => setBatchItems([])} className="hover:text-foreground">
                        Clear all
                      </button>
                    )}
                  </div>
                  {batchItems.length === 0 ? (
                    <p className="p-6 text-center text-sm text-muted-foreground">No rows yet. Upload a CSV or add one above.</p>
                  ) : (
                    <ul className="max-h-72 divide-y overflow-y-auto">
                      {batchItems.map((item, idx) => {
                        const selected = selectedBatchIndex === idx;
                        return (
                          <li key={item.id} className={cn("flex items-center gap-2 pr-2", selected && "bg-brand-subtle/60")}>
                            <button
                              type="button"
                              onClick={() => setSelectedBatchIndex(idx)}
                              aria-pressed={selected}
                              className="min-w-0 flex-1 px-3 py-2.5 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                            >
                              <span className="flex items-center gap-2">
                                <span className="truncate text-sm font-medium text-foreground">{item.title}</span>
                                <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">{item.type}</span>
                              </span>
                              <span className="mt-0.5 block truncate font-mono text-xs text-muted-foreground">{item.value}</span>
                            </button>
                            <Button type="button" variant="ghost" size="icon-sm" onClick={() => handleRemoveBatchItem(item.id)} aria-label={`Remove ${item.title}`}>
                              <X aria-hidden="true" />
                            </Button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button type="button" onClick={downloadAllBatchZip} disabled={batchItems.length === 0 || batchIsExporting}>
                    <Archive aria-hidden="true" />
                    {batchIsExporting ? "Creating ZIP…" : `Download all as PNG (ZIP)`}
                  </Button>
                  <Button type="button" variant="outline" onClick={downloadAllBatchCsv} disabled={batchItems.length === 0}>
                    <FileSpreadsheet aria-hidden="true" />
                    Download list (CSV)
                  </Button>
                </div>
              </div>
            )}
          </ToolSection>

          <ToolDivider />

          <ToolSection
            title="Colours"
            actions={
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFgColor(bgColor);
                  setBgColor(fgColor);
                }}
                disabled={transparentBg}
              >
                <ArrowRightLeft aria-hidden="true" />
                Swap
              </Button>
            }
          >
            <div role="radiogroup" aria-label="Colour presets" className="flex flex-wrap gap-2">
              {COLOR_PRESETS.map((p) => {
                const selected = fgColor === p.fg && bgColor === p.bg && !transparentBg;
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={p.name}
                    title={p.name}
                    onClick={() => {
                      setFgColor(p.fg);
                      setBgColor(p.bg);
                      setTransparentBg(false);
                    }}
                    className={cn(
                      "flex size-10 items-center justify-center rounded-lg border outline-none transition-shadow focus-visible:ring-3 focus-visible:ring-ring/50",
                      selected && "ring-2 ring-primary ring-offset-2 ring-offset-background"
                    )}
                    style={{ backgroundColor: p.bg }}
                  >
                    <span className="size-4 rounded-sm" style={{ backgroundColor: p.fg }} />
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 gap-4 @sm:grid-cols-2">
              <Field label="Code colour" htmlFor="qr-fg-hex">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    aria-label="Pick code colour"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border bg-background p-1"
                  />
                  <TextInput id="qr-fg-hex" value={fgColor} onChange={(e) => setFgColor(e.target.value)} className="font-mono" spellCheck={false} />
                </div>
              </Field>
              <Field label="Background" htmlFor="qr-bg-hex">
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    aria-label="Pick background colour"
                    value={bgColor}
                    disabled={transparentBg}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border bg-background p-1 disabled:cursor-not-allowed disabled:opacity-40"
                  />
                  <TextInput
                    id="qr-bg-hex"
                    value={transparentBg ? "Transparent" : bgColor}
                    disabled={transparentBg}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="font-mono"
                    spellCheck={false}
                  />
                </div>
              </Field>
            </div>

            <ToggleRow
              id="qr-transparent"
              label="Transparent background"
              description="For placing the code on a coloured design. Applies to PNG and SVG."
              checked={transparentBg}
              onCheckedChange={setTransparentBg}
            />

            {!contrastInfo.isGood ? (
              <Notice tone="warning">
                Contrast is {contrastInfo.ratio}:1. Phones may not scan it; aim for at least 3:1 with a dark code on a light background.
              </Notice>
            ) : contrastInfo.inverted ? (
              <Notice tone="info">A light code on a dark background works with most phone cameras, but some older scanners can&apos;t read it.</Notice>
            ) : (
              <p className="text-xs text-muted-foreground">Contrast {contrastInfo.ratio}:1 — easy to scan.</p>
            )}
          </ToolSection>

          <ToolDivider />

          <ToolSection title="Logo and frame">
            <Field label="Centre logo">
              <div className="flex flex-wrap items-center gap-1.5">
                {BUILT_IN_LOGOS.map((item) => {
                  const selected = logoOption === item.id && !customLogoUrl;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => {
                        setLogoOption(item.id);
                        setCustomLogoUrl(null);
                        if (item.id !== "none") setErrorLevel("H");
                      }}
                      className={cn(
                        "flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                        selected
                          ? "border-primary/50 bg-brand-subtle text-brand-subtle-foreground"
                          : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground dark:bg-input/20"
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      {item.src && <img src={item.src} alt="" className="size-3.5 rounded-full bg-white p-px" />}
                      {item.name}
                    </button>
                  );
                })}
                <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" onChange={handleCustomLogoUpload} className="hidden" />
                <button
                  type="button"
                  aria-pressed={!!customLogoUrl}
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    "flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    customLogoUrl
                      ? "border-primary/50 bg-brand-subtle text-brand-subtle-foreground"
                      : "bg-background text-muted-foreground hover:bg-muted hover:text-foreground dark:bg-input/20"
                  )}
                >
                  <Upload className="size-3.5" aria-hidden="true" />
                  {customLogoUrl ? "Your logo" : "Upload logo"}
                </button>
                {customLogoUrl && (
                  <Button type="button" variant="ghost" size="icon-sm" onClick={removeCustomLogo} aria-label="Remove your logo">
                    <X aria-hidden="true" />
                  </Button>
                )}
              </div>
            </Field>

            <Field label="Frame">
              <OptionCards
                value={frameStyle}
                onChange={setFrameStyle}
                ariaLabel="Frame"
                className="grid-cols-3"
                options={[
                  { value: "none", label: "None", description: "Just the code" },
                  { value: "badge", label: "Badge", description: "Label above" },
                  { value: "card", label: "Card", description: "Title and caption" },
                ]}
              />
            </Field>

            {frameStyle !== "none" && (
              <div className="grid grid-cols-1 gap-4 @md:grid-cols-2">
                <Field label="Label" htmlFor="qr-frame-text">
                  <TextInput id="qr-frame-text" value={frameText} onChange={(e) => setFrameText(e.target.value)} placeholder="Scan me" maxLength={32} />
                </Field>
                {frameStyle === "card" && (
                  <Field label="Caption" htmlFor="qr-frame-sub" hint="Optional.">
                    <TextInput id="qr-frame-sub" value={frameSubtext} onChange={(e) => setFrameSubtext(e.target.value)} placeholder="e.g. Menu and prices" maxLength={48} />
                  </Field>
                )}
              </div>
            )}
          </ToolSection>

          <ToolDivider />

          <ToolSection title="Advanced">
            <div className="grid grid-cols-1 gap-4 @lg:grid-cols-2">
              <Field label="Quiet zone" hint="White space around the code. Scanners need some.">
                <Segmented
                  value={String(marginSize)}
                  onChange={(v) => setMarginSize(Number(v))}
                  ariaLabel="Quiet zone"
                  fill
                  options={[
                    { value: "0", label: "None" },
                    { value: "1", label: "1×" },
                    { value: "2", label: "2×" },
                    { value: "4", label: "4×" },
                  ]}
                />
              </Field>
              <Field label="Error correction" hint={ERROR_LEVELS[errorLevel]}>
                <Segmented
                  value={errorLevel}
                  onChange={setErrorLevel}
                  ariaLabel="Error correction"
                  fill
                  options={(["L", "M", "Q", "H"] as ErrorLevel[]).map((l) => ({ value: l, label: l }))}
                />
              </Field>
            </div>
          </ToolSection>
        </div>

        {/* Preview & download */}
        <div className="space-y-4 @4xl:sticky @4xl:top-24 @4xl:col-span-5">
          <div className="space-y-5 rounded-xl border bg-muted/30 p-5">
            <div className="flex min-h-72 items-center justify-center">
              {!hasContent ? (
                <div className="flex flex-col items-center gap-2 text-center">
                  <QrCode className="size-10 text-muted-foreground/50" aria-hidden="true" />
                  <p className="text-sm text-muted-foreground">Fill in the content to see your QR code.</p>
                </div>
              ) : tooLong ? (
                <Notice tone="warning">
                  This is too much content for one QR code. Shorten it, or lower the error correction under Advanced.
                </Notice>
              ) : (
                <div
                  className={cn(
                    "flex w-full max-w-[300px] flex-col items-center rounded-xl",
                    frameStyle !== "none" && "shadow-sm",
                    transparentBg &&
                      "bg-[length:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0] bg-[linear-gradient(45deg,#cbd5e1_25%,transparent_25%),linear-gradient(-45deg,#cbd5e1_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#cbd5e1_75%),linear-gradient(-45deg,transparent_75%,#cbd5e1_75%)]"
                  )}
                  style={{
                    backgroundColor: transparentBg ? undefined : bgColor,
                    padding: frameStyle === "card" ? "22px 20px 18px" : frameStyle === "badge" ? "18px" : "12px",
                    border: transparentBg ? "1px dashed #94a3b8" : `1px solid ${frameStyle === "none" ? "var(--border)" : fgColor + "20"}`,
                  }}
                >
                  {frameStyle === "badge" && (
                    <div
                      className="mb-4 rounded-full px-4 py-1.5 text-sm font-semibold tracking-wide uppercase"
                      style={{ backgroundColor: fgColor, color: transparentBg ? "#ffffff" : bgColor }}
                    >
                      {frameText}
                    </div>
                  )}
                  {frameStyle === "card" && (
                    <div className="mb-3 text-center text-sm font-semibold tracking-wide uppercase" style={{ color: fgColor }}>
                      {frameText}
                    </div>
                  )}
                  <div className="flex w-full max-w-[260px] items-center justify-center">
                    <QRCodeCanvas
                      value={payload}
                      // 2× the display box so the canvas is downscaled, keeping module edges crisp.
                      size={520}
                      fgColor={fgColor}
                      bgColor={transparentBg ? "rgba(0,0,0,0)" : bgColor}
                      level={errorLevel}
                      marginSize={marginSize}
                      imageSettings={activeLogoSrc ? { src: activeLogoSrc, height: 520 * logoRatio, width: 520 * logoRatio, excavate: true } : undefined}
                      // qrcode.react sets an inline pixel width/height; override it so the canvas stays square.
                      style={{ width: "100%", height: "auto" }}
                      role="img"
                      aria-label="QR code preview"
                    />
                  </div>
                  {frameStyle === "card" && frameSubtext && (
                    <div className="mt-3 text-center text-xs font-medium opacity-80" style={{ color: fgColor }}>
                      {frameSubtext}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Full-resolution canvas and SVG used only as export sources. */}
            {hasContent && !tooLong && (
              <>
                <div ref={exportCanvasRef} className="hidden">
                  <QRCodeCanvas
                    value={payload}
                    size={downloadRes}
                    fgColor={fgColor}
                    bgColor={transparentBg ? "rgba(0,0,0,0)" : bgColor}
                    level={errorLevel}
                    marginSize={marginSize}
                    imageSettings={activeLogoSrc ? { src: activeLogoSrc, height: Math.round(downloadRes * logoRatio), width: Math.round(downloadRes * logoRatio), excavate: true } : undefined}
                  />
                </div>
                <div ref={svgContainerRef} className="hidden">
                  <QRCodeSVG
                    value={payload}
                    size={1024}
                    fgColor={fgColor}
                    bgColor={transparentBg ? "rgba(0,0,0,0)" : bgColor}
                    level={errorLevel}
                    marginSize={marginSize}
                    imageSettings={activeLogoSrc ? { src: activeLogoSrc, height: 1024 * logoRatio, width: 1024 * logoRatio, excavate: true } : undefined}
                  />
                </div>
              </>
            )}

            {hasContent && (
              <p className="truncate text-center font-mono text-xs text-muted-foreground" title={payload}>
                {payload.split("\n")[0]}
                {payload.includes("\n") ? " …" : ""}
              </p>
            )}

            <Field label="PNG size">
              <Segmented
                value={String(downloadRes)}
                onChange={(v) => setDownloadRes(Number(v))}
                ariaLabel="PNG size"
                size="sm"
                fill
                options={[512, 1024, 2048].map((r) => ({ value: String(r), label: `${r} px` }))}
              />
            </Field>

            <div className="space-y-2">
              <Button type="button" size="lg" className="h-10 w-full" onClick={handleDownloadPng} disabled={!canExport}>
                <Download aria-hidden="true" />
                Download PNG
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant="outline" onClick={handleDownloadSvg} disabled={!canExport}>
                  <Download aria-hidden="true" />
                  SVG
                </Button>
                <Button type="button" variant="outline" onClick={handleCopyImage} disabled={!canExport}>
                  {copiedImage ? <Check aria-hidden="true" className="text-success" /> : <Copy aria-hidden="true" />}
                  {copiedImage ? "Copied" : "Copy image"}
                </Button>
              </div>
              <Button type="button" variant="ghost" size="sm" className="w-full text-muted-foreground" onClick={handleCopySvg} disabled={!canExport}>
                {copiedSvg ? <Check aria-hidden="true" className="text-success" /> : <Copy aria-hidden="true" />}
                {copiedSvg ? "SVG code copied" : "Copy SVG code"}
              </Button>
              {frameStyle !== "none" && <p className="text-center text-xs text-muted-foreground">The frame is added to the PNG only; SVG and copy give the plain code.</p>}
            </div>
          </div>
        </div>
      </div>

      {recentQrs && recentQrs.length > 0 && (
        <section aria-labelledby="qr-recent" className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 id="qr-recent" className="text-sm font-semibold text-foreground">
              Recent downloads
            </h3>
            <Button type="button" variant="ghost" size="sm" onClick={() => setRecentQrs([])} className="text-muted-foreground">
              <Trash2 aria-hidden="true" />
              Clear
            </Button>
          </div>
          <ul className="grid grid-cols-1 gap-3 @md:grid-cols-2 @3xl:grid-cols-4">
            {recentQrs.map((item, idx) => {
              const canLoad = item.tab === "url" || item.tab === "text";
              return (
                <li key={item.id || idx} className="flex items-center gap-3 rounded-lg border bg-background p-2.5 dark:bg-input/20">
                  <div className="shrink-0 rounded-md border p-1" style={{ backgroundColor: item.bgColor }}>
                    <QRCodeCanvas value={item.payload} size={56} fgColor={item.fgColor} bgColor={item.bgColor} level="M" marginSize={1} aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground" title={item.payload}>
                      {item.payload.split("\n")[0]}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {TYPES.find((t) => t.id === item.tab)?.label ?? item.tab} ·{" "}
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <div className="mt-1 flex gap-1">
                      {canLoad && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          onClick={() => {
                            if (item.tab === "url") setUrl(item.payload);
                            else setText(item.payload);
                            setTab(item.tab);
                            setFgColor(item.fgColor);
                            setBgColor(item.bgColor);
                          }}
                        >
                          <RefreshCw aria-hidden="true" />
                          Edit
                        </Button>
                      )}
                      <Button type="button" variant="ghost" size="xs" onClick={() => void downloadHistoryItem(item)}>
                        <Download aria-hidden="true" />
                        PNG
                      </Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

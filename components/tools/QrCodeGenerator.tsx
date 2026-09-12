"use client";

import React, { useState, useRef, useId, useMemo } from "react";
import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import { downloadDataUrl } from "@/lib/utils/download";
import {
  Download,
  QrCode,
  Copy,
  Check,
  Sparkles,
  Wifi,
  Globe,
  FileText,
  Mail,
  MessageSquare,
  Palette,
  Layers,
  Upload,
  RefreshCw,
  Sliders,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Eye,
  Trash2,
  ExternalLink,
  User,
  ArrowRightLeft,
  X,
  Phone,
  MessageSquareText,
  Calendar,
  MapPin,
  CreditCard,
  Building,
  Briefcase,
  Map,
  FileSpreadsheet,
  Archive,
  FolderDown,
  FileUp,
} from "lucide-react";
import confetti from "canvas-confetti";
import JSZip from "jszip";

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
type FrameStyle = "none" | "badge" | "card" | "phone";
type ErrorLevel = "L" | "M" | "Q" | "H";

interface PresetTheme {
  id: string;
  name: string;
  fg: string;
  bg: string;
  gradient?: string;
}

const COLOR_PRESETS: PresetTheme[] = [
  { id: "midnight", name: "Midnight", fg: "#0f172a", bg: "#ffffff" },
  { id: "ocean", name: "Ocean Blue", fg: "#1d4ed8", bg: "#eff6ff" },
  { id: "emerald", name: "Emerald", fg: "#047857", bg: "#f0fdf4" },
  { id: "violet", name: "Royal Purple", fg: "#6d28d9", bg: "#f5f3ff" },
  { id: "rose", name: "Sunset Rose", fg: "#be123c", bg: "#fff1f2" },
  { id: "amber", name: "Warm Amber", fg: "#b45309", bg: "#fffbeb" },
  { id: "cyber", name: "Cyberpunk", fg: "#06b6d4", bg: "#0f172a" },
  { id: "mono-dark", name: "Onyx Dark", fg: "#f8fafc", bg: "#090d16" },
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

interface QrHistoryItem {
  id: string;
  payload: string;
  tab: QrTab;
  fgColor: string;
  bgColor: string;
  timestamp: number;
}

export default function QrCodeGenerator() {
  const [tab, setTab] = usePersistentState<QrTab>("qr_tab", "url");

  // Inputs
  const [url, setUrl] = usePersistentState<string>("qr_url", "https://tabbench.com");
  const [text, setText] = usePersistentState<string>("qr_text", "TabBench — Fast, Private Utilities");

  // WiFi Fields
  const [wifiSsid, setWifiSsid] = usePersistentState<string>("qr_wifi_ssid", "Office_WiFi");
  const [wifiPass, setWifiPass] = usePersistentState<string>("qr_wifi_pass", "SuperSecret123!");
  const [wifiType, setWifiType] = usePersistentState<string>("qr_wifi_type", "WPA");
  const [wifiHidden, setWifiHidden] = useState<boolean>(false);

  // Email Fields
  const [emailTo, setEmailTo] = usePersistentState<string>("qr_email_to", "hello@example.com");
  const [emailSubject, setEmailSubject] = usePersistentState<string>("qr_email_sub", "General Inquiry");
  const [emailBody, setEmailBody] = usePersistentState<string>("qr_email_body", "Hi there,\n\nI would like to inquire about...");

  // WhatsApp
  const [waPhone, setWaPhone] = usePersistentState<string>("qr_wa_phone", "14155552671");
  const [waMsg, setWaMsg] = usePersistentState<string>("qr_wa_msg", "Hi! I found your QR code on TabBench.");

  // vCard / Contact
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

  // Direct Phone Call
  const [phoneNum, setPhoneNum] = usePersistentState<string>("qr_phone_num", "+15552345678");

  // SMS Text Message
  const [smsPhone, setSmsPhone] = usePersistentState<string>("qr_sms_phone", "+15552345678");
  const [smsMessage, setSmsMessage] = usePersistentState<string>("qr_sms_msg", "Hi! I got your contact info via QR code.");

  // Calendar Event
  const [eventTitle, setEventTitle] = usePersistentState<string>("qr_ev_title", "Product Roadmap Discussion");
  const [eventLocation, setEventLocation] = usePersistentState<string>("qr_ev_loc", "Main Conference Room & Online");
  const [eventStart, setEventStart] = usePersistentState<string>("qr_ev_start", "2026-10-15T09:00");
  const [eventEnd, setEventEnd] = usePersistentState<string>("qr_ev_end", "2026-10-15T10:30");
  const [eventDesc, setEventDesc] = usePersistentState<string>("qr_ev_desc", "Review quarterly features and key roadmap milestones.");

  // Geo Location
  const [geoLat, setGeoLat] = usePersistentState<string>("qr_geo_lat", "37.7749");
  const [geoLng, setGeoLng] = usePersistentState<string>("qr_geo_lng", "-122.4194");
  const [geoQuery, setGeoQuery] = usePersistentState<string>("qr_geo_query", "Market Street, San Francisco");

  // Payment (UPI, Bitcoin, PayPal)
  const [payType, setPayType] = usePersistentState<"upi" | "bitcoin" | "paypal">("qr_pay_type", "upi");
  const [payUpiVpa, setPayUpiVpa] = usePersistentState<string>("qr_pay_upi_vpa", "merchant@bank");
  const [payUpiName, setPayUpiName] = usePersistentState<string>("qr_pay_upi_name", "TabBench Store");
  const [payUpiAmount, setPayUpiAmount] = usePersistentState<string>("qr_pay_upi_amt", "150.00");
  const [payBtcAddress, setPayBtcAddress] = usePersistentState<string>("qr_pay_btc_addr", "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa");
  const [payBtcAmount, setPayBtcAmount] = usePersistentState<string>("qr_pay_btc_amt", "0.0025");
  const [payPaypalUser, setPayPaypalUser] = usePersistentState<string>("qr_pay_pp_user", "tabbench");

  // Styling & Customization
  const [fgColor, setFgColor] = usePersistentState<string>("qr_fg", "#0f172a");
  const [bgColor, setBgColor] = usePersistentState<string>("qr_bg", "#ffffff");
  const [transparentBg, setTransparentBg] = useState<boolean>(false);
  const [errorLevel, setErrorLevel] = usePersistentState<ErrorLevel>("qr_level", "H");
  const [marginSize, setMarginSize] = usePersistentState<number>("qr_margin", 2);
  const [frameStyle, setFrameStyle] = usePersistentState<FrameStyle>("qr_frame_style", "none");
  const [frameText, setFrameText] = usePersistentState<string>("qr_frame_text", "SCAN WITH CAMERA");
  const [frameSubtext, setFrameSubtext] = usePersistentState<string>("qr_frame_subtext", "100% Client-Side & Private");
  const [logoOption, setLogoOption] = useState<string>("none");
  const [customLogoUrl, setCustomLogoUrl] = useState<string | null>(null);

  // History & Action states
  const [recentQrs, setRecentQrs] = usePersistentState<QrHistoryItem[]>("recent_qrs_history", []);
  const [copiedImage, setCopiedImage] = useState(false);
  const [copiedSvg, setCopiedSvg] = useState(false);
  const [downloadRes, setDownloadRes] = useState<number>(1024);

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  // Export reads from its own full-resolution canvas. Using the small
  // preview canvas as the export source upscaled a 240px bitmap to
  // 1024/2048, so every "high-res" download was blurry.
  const exportCanvasRef = useRef<HTMLDivElement>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvFileInputRef = useRef<HTMLInputElement>(null);

  // Batch CSV State
  interface BatchCsvItem {
    id: string;
    title: string;
    type: string;
    value: string;
  }

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
      title: newBatchTitle.trim() || `Service #${batchItems.length + 1}`,
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
      if (selectedBatchIndex >= next.length) {
        setSelectedBatchIndex(Math.max(0, next.length - 1));
      }
      return next;
    });
  };

  const handleCsvUpload = (file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) return;
      const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length === 0) return;

      const parsed: BatchCsvItem[] = [];
      const startIdx = lines[0].toLowerCase().includes("value") || lines[0].toLowerCase().includes("title") || lines[0].toLowerCase().includes("service") ? 1 : 0;

      for (let i = startIdx; i < lines.length; i++) {
        const line = lines[i];
        const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map((c) => c.replace(/^"|"$/g, "").trim());
        if (cols.length === 1 && cols[0]) {
          parsed.push({
            id: String(Date.now() + i),
            title: `Service #${i + 1}`,
            type: "text",
            value: cols[0],
          });
        } else if (cols.length === 2) {
          parsed.push({
            id: String(Date.now() + i),
            title: cols[0] || `Service #${i + 1}`,
            type: "url",
            value: cols[1],
          });
        } else if (cols.length >= 3) {
          parsed.push({
            id: String(Date.now() + i),
            title: cols[0] || `Service #${i + 1}`,
            type: cols[1] || "text",
            value: cols[2],
          });
        }
      }

      if (parsed.length > 0) {
        setBatchItems(parsed);
        confetti({ particleCount: 30, spread: 50, origin: { y: 0.85 } });
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

    const blob = new Blob([sample], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sample-services-qrcode.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAllBatchCsv = () => {
    if (batchItems.length === 0) return;
    const header = "Title,Type,Value,GeneratedDate\n";
    const nowIso = new Date().toISOString();
    const rows = batchItems
      .map(
        (item) =>
          `"${item.title.replace(/"/g, '""')}","${item.type}","${item.value.replace(/"/g, '""')}","${nowIso}"`
      )
      .join("\n");

    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `all-services-qrcodes-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.85 } });
  };

  const downloadAllBatchZip = async () => {
    if (batchItems.length === 0) return;
    setBatchIsExporting(true);

    try {
      const zip = new JSZip();
      const folder = zip.folder("qr-codes");
      const QRCode = (await import("qrcode")).default;

      for (let i = 0; i < batchItems.length; i++) {
        const item = batchItems[i];
        const canvas = document.createElement("canvas");
        await QRCode.toCanvas(canvas, item.value, {
          width: 1024,
          margin: 2,
          color: {
            dark: fgColor,
            light: transparentBg ? "#00000000" : bgColor,
          },
          errorCorrectionLevel: "H",
        });

        const dataUrl = canvas.toDataURL("image/png");
        const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
        const safeTitle = item.title.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase().slice(0, 30);
        const fileName = `${String(i + 1).padStart(2, "0")}-${safeTitle || "qrcode"}.png`;
        folder?.file(fileName, base64Data, { base64: true });
      }

      const header = "Index,Title,Type,Value\n";
      const csvContent = header + batchItems.map((it, idx) => `${idx + 1},"${it.title.replace(/"/g, '""')}","${it.type}","${it.value.replace(/"/g, '""')}"`).join("\n");
      zip.file("services-manifest.csv", csvContent);

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = `all-services-qrcodes-${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      confetti({ particleCount: 45, spread: 60, origin: { y: 0.85 } });
    } catch (err) {
      console.error("Batch ZIP export error:", err);
    } finally {
      setBatchIsExporting(false);
    }
  };

  // Helper for formatting RFC 5545 iCalendar dates
  const formatIcalDate = (dtStr: string): string => {
    if (!dtStr) return "";
    const clean = dtStr.replace(/[-:]/g, "");
    if (clean.includes("T")) {
      return clean.length === 13 ? `${clean}00` : clean;
    }
    return clean;
  };

  // Compute standard payload string
  const payload = useMemo((): string => {
    switch (tab) {
      case "url":
        if (!url.trim()) return "https://tabbench.com";
        return url.startsWith("http://") || url.startsWith("https://")
          ? url.trim()
          : `https://${url.trim()}`;

      case "wifi":
        return `WIFI:T:${wifiType};S:${wifiSsid};P:${wifiPass};H:${wifiHidden ? "true" : "false"};;`;

      case "phone":
        return `tel:${phoneNum.trim()}`;

      case "sms":
        return `SMSTO:${smsPhone.trim()}:${smsMessage}`;

      case "email":
        return `mailto:${emailTo.trim()}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

      case "whatsapp": {
        const cleanPhone = waPhone.replace(/\D/g, "");
        return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMsg)}`;
      }

      case "vcard": {
        const fullName = `${vcardFirstName} ${vcardLastName}`.trim() || "Alex Morgan";
        const parts = [
          "BEGIN:VCARD",
          "VERSION:3.0",
          `N:${vcardLastName};${vcardFirstName};;;`,
          `FN:${fullName}`,
          vcardOrg ? `ORG:${vcardOrg}` : "",
          vcardTitle ? `TITLE:${vcardTitle}` : "",
          vcardCell ? `TEL;TYPE=CELL,VOICE:${vcardCell}` : "",
          vcardPhone ? `TEL;TYPE=WORK,VOICE:${vcardPhone}` : "",
          vcardEmail ? `EMAIL;TYPE=PREF,INTERNET:${vcardEmail}` : "",
          vcardUrl ? `URL:${vcardUrl}` : "",
          vcardStreet || vcardCity || vcardState || vcardZip || vcardCountry
            ? `ADR;TYPE=WORK:;;${vcardStreet};${vcardCity};${vcardState};${vcardZip};${vcardCountry}`
            : "",
          vcardNote ? `NOTE:${vcardNote}` : "",
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
          `SUMMARY:${eventTitle || "Event"}`,
          eventLocation ? `LOCATION:${eventLocation}` : "",
          start ? `DTSTART:${start}` : "",
          end ? `DTEND:${end}` : "",
          eventDesc ? `DESCRIPTION:${eventDesc}` : "",
          "END:VEVENT",
          "END:VCALENDAR",
        ]
          .filter(Boolean)
          .join("\n");
      }

      case "geo":
        if (geoLat && geoLng) {
          return `https://maps.google.com/?q=${encodeURIComponent(geoLat)},${encodeURIComponent(geoLng)}`;
        }
        return `https://maps.google.com/?q=${encodeURIComponent(geoQuery)}`;

      case "payment":
        if (payType === "upi") {
          let str = `upi://pay?pa=${encodeURIComponent(payUpiVpa)}&pn=${encodeURIComponent(payUpiName)}`;
          if (payUpiAmount) str += `&am=${encodeURIComponent(payUpiAmount)}&cu=INR`;
          return str;
        } else if (payType === "bitcoin") {
          return `bitcoin:${payBtcAddress}${payBtcAmount ? `?amount=${payBtcAmount}` : ""}`;
        } else {
          return `https://paypal.me/${encodeURIComponent(payPaypalUser)}`;
        }

      case "batch":
        return batchItems[selectedBatchIndex]?.value || "https://tabbench.com";

      case "text":
      default:
        return text || "TabBench";
    }
  }, [
    tab,
    batchItems,
    selectedBatchIndex,
    url,
    wifiType,
    wifiSsid,
    wifiPass,
    wifiHidden,
    phoneNum,
    smsPhone,
    smsMessage,
    emailTo,
    emailSubject,
    emailBody,
    waPhone,
    waMsg,
    vcardFirstName,
    vcardLastName,
    vcardOrg,
    vcardTitle,
    vcardCell,
    vcardPhone,
    vcardEmail,
    vcardUrl,
    vcardStreet,
    vcardCity,
    vcardState,
    vcardZip,
    vcardCountry,
    vcardNote,
    eventTitle,
    eventLocation,
    eventStart,
    eventEnd,
    eventDesc,
    geoLat,
    geoLng,
    geoQuery,
    payType,
    payUpiVpa,
    payUpiName,
    payUpiAmount,
    payBtcAddress,
    payBtcAmount,
    payPaypalUser,
    text,
  ]);

  // Contrast check helper
  const contrastInfo = useMemo(() => {
    const hexToRgb = (hex: string) => {
      const clean = hex.replace("#", "");
      if (clean.length === 3) {
        return [
          parseInt(clean[0] + clean[0], 16),
          parseInt(clean[1] + clean[1], 16),
          parseInt(clean[2] + clean[2], 16),
        ];
      }
      return [
        parseInt(clean.slice(0, 2), 16) || 0,
        parseInt(clean.slice(2, 4), 16) || 0,
        parseInt(clean.slice(4, 6), 16) || 0,
      ];
    };

    const getLuminance = (r: number, g: number, b: number) => {
      const a = [r, g, b].map((v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    };

    const [r1, g1, b1] = hexToRgb(fgColor);
    const [r2, g2, b2] = hexToRgb(transparentBg ? "#ffffff" : bgColor);
    const l1 = getLuminance(r1, g1, b1);
    const l2 = getLuminance(r2, g2, b2);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

    return {
      ratio: ratio.toFixed(1),
      isGood: ratio >= 3.0,
      isExcellent: ratio >= 4.5,
    };
  }, [fgColor, bgColor, transparentBg]);

  // Active Logo Source
  const activeLogoSrc = useMemo(() => {
    if (customLogoUrl) return customLogoUrl;
    const found = BUILT_IN_LOGOS.find((l) => l.id === logoOption);
    return found ? found.src : "";
  }, [customLogoUrl, logoOption]);

  const handleCustomLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setCustomLogoUrl(ev.target.result as string);
          setLogoOption("custom");
          setErrorLevel("H"); // Boost error correction for center logo
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeCustomLogo = () => {
    setCustomLogoUrl(null);
    setLogoOption("none");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const swapColors = () => {
    const temp = fgColor;
    setFgColor(bgColor);
    setBgColor(temp);
  };

  const saveToHistory = () => {
    const newQrItem: QrHistoryItem = {
      id: String(Date.now()),
      payload,
      tab,
      fgColor,
      bgColor,
      timestamp: Date.now(),
    };
    setRecentQrs((prev = []) => [
      newQrItem,
      ...prev.filter((q) => q.payload !== newQrItem.payload),
    ].slice(0, 4));
  };

  const handleDownloadPng = () => {
    const canvas = exportCanvasRef.current?.querySelector("canvas");
    if (!canvas) return;

    const exportCanvas = document.createElement("canvas");
    const exportSize = downloadRes;
    const finalBgColor = transparentBg ? "transparent" : bgColor;

    if (frameStyle === "card" || frameStyle === "badge") {
      const padding = Math.round(exportSize * 0.08);
      const headerH = frameStyle === "card" ? Math.round(exportSize * 0.16) : Math.round(exportSize * 0.12);
      const footerH = frameStyle === "card" ? Math.round(exportSize * 0.1) : 0;
      
      exportCanvas.width = exportSize;
      exportCanvas.height = exportSize + headerH + footerH;
      const ctx = exportCanvas.getContext("2d");
      if (!ctx) return;

      if (!transparentBg) {
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
      }

      // Draw top header pill/banner
      if (frameStyle === "badge") {
        ctx.fillStyle = fgColor;
        const pillW = Math.round(exportSize * 0.6);
        const pillH = Math.round(headerH * 0.6);
        const pillX = (exportCanvas.width - pillW) / 2;
        const pillY = Math.round(headerH * 0.25);
        ctx.beginPath();
        ctx.roundRect(pillX, pillY, pillW, pillH, pillH / 2);
        ctx.fill();

        ctx.fillStyle = bgColor;
        ctx.font = `bold ${Math.round(pillH * 0.45)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(frameText.toUpperCase(), exportCanvas.width / 2, pillY + pillH / 2);
      } else if (frameStyle === "card") {
        ctx.fillStyle = fgColor;
        ctx.font = `bold ${Math.round(headerH * 0.35)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(frameText.toUpperCase(), exportCanvas.width / 2, headerH / 2);
      }

      // Draw QR Canvas
      const qrDrawSize = exportSize - padding * 2;
      ctx.drawImage(canvas, padding, headerH, qrDrawSize, qrDrawSize);

      // Draw Card footer
      if (frameStyle === "card" && frameSubtext) {
        ctx.fillStyle = fgColor;
        ctx.globalAlpha = 0.7;
        ctx.font = `500 ${Math.round(footerH * 0.35)}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(frameSubtext, exportCanvas.width / 2, exportSize + headerH + footerH / 2);
        ctx.globalAlpha = 1.0;
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

    const dataUrl = exportCanvas.toDataURL("image/png");
    downloadDataUrl(dataUrl, `qrcode-${tab}-${Date.now()}.png`);
    saveToHistory();
    confetti({ particleCount: 35, spread: 55, origin: { y: 0.85 } });
  };

  const handleDownloadSvg = () => {
    const svgElem = svgContainerRef.current?.querySelector("svg");
    if (!svgElem) return;

    const svgData = new XMLSerializer().serializeToString(svgElem);
    const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const svgUrl = URL.createObjectURL(svgBlob);
    
    const downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = `qrcode-${tab}-${Date.now()}.svg`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
    URL.revokeObjectURL(svgUrl);

    saveToHistory();
    confetti({ particleCount: 35, spread: 55, origin: { y: 0.85 } });
  };

  const handleCopyImage = async () => {
    const canvas = exportCanvasRef.current?.querySelector("canvas");
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (blob) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob }),
          ]);
          setCopiedImage(true);
          confetti({ particleCount: 25, spread: 45, origin: { y: 0.85 } });
          setTimeout(() => setCopiedImage(false), 2200);
        } catch (e) {
          console.error("Clipboard copy failed:", e);
        }
      }
    });
  };

  const handleCopySvg = async () => {
    const svgElem = svgContainerRef.current?.querySelector("svg");
    if (!svgElem) return;
    const svgData = new XMLSerializer().serializeToString(svgElem);
    try {
      await navigator.clipboard.writeText(svgData);
      setCopiedSvg(true);
      setTimeout(() => setCopiedSvg(false), 2200);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Category Tabs Header */}
      <div className="p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-wrap gap-1">
        {[
          { id: "url", label: "Website URL", icon: Globe },
          { id: "vcard", label: "vCard Contact", icon: User },
          { id: "wifi", label: "Wi-Fi", icon: Wifi },
          { id: "phone", label: "Phone Call", icon: Phone },
          { id: "sms", label: "SMS Message", icon: MessageSquareText },
          { id: "email", label: "Email", icon: Mail },
          { id: "whatsapp", label: "WhatsApp", icon: MessageSquare },
          { id: "event", label: "Event / iCal", icon: Calendar },
          { id: "geo", label: "Map / Geo", icon: MapPin },
          { id: "payment", label: "Pay / UPI", icon: CreditCard },
          { id: "text", label: "Plain Text", icon: FileText },
          { id: "batch", label: "Batch CSV (Bulk)", icon: FileSpreadsheet },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = tab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id as QrTab)}
              className={`flex items-center space-x-1.5 px-3 py-2 text-xs font-semibold rounded-xl transition ${
                isActive
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Studio Layout */}
      <div className="grid grid-cols-1 @4xl:grid-cols-12 gap-6 @4xl:gap-8 items-start">
        {/* Left Column: Configuration Controls */}
        <div className="@container @4xl:col-span-7 space-y-5">
          {/* Section 1: Content Input */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>QR Data & Content</span>
              </div>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                Instant Live Preview
              </span>
            </div>

            {/* Tab 1: URL */}
            {tab === "url" && (
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                  Target Website URL
                </label>
                <div className="relative flex items-center">
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://yourwebsite.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400">Quick test URLs:</span>
                  {[
                    "https://google.com",
                    "https://github.com",
                    "https://tabbench.com",
                  ].map((testUrl) => (
                    <button
                      key={testUrl}
                      onClick={() => setUrl(testUrl)}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600 transition"
                    >
                      {testUrl.replace("https://", "")}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 2: Rich vCard 3.0 Contact */}
            {tab === "vcard" && (
              <div className="space-y-3.5">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Generates an RFC 2426 compliant vCard 3.0. When scanned with any mobile camera, phones immediately offer to save this contact directly into their address book.
                </div>

                <div className="grid grid-cols-1 @sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={vcardFirstName}
                      onChange={(e) => setVcardFirstName(e.target.value)}
                      placeholder="Alex"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={vcardLastName}
                      onChange={(e) => setVcardLastName(e.target.value)}
                      placeholder="Morgan"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 @sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Organization / Company
                    </label>
                    <input
                      type="text"
                      value={vcardOrg}
                      onChange={(e) => setVcardOrg(e.target.value)}
                      placeholder="Company Inc."
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Job Title
                    </label>
                    <input
                      type="text"
                      value={vcardTitle}
                      onChange={(e) => setVcardTitle(e.target.value)}
                      placeholder="Lead Developer / Designer"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 @sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Mobile / Cell Phone
                    </label>
                    <input
                      type="tel"
                      value={vcardCell}
                      onChange={(e) => setVcardCell(e.target.value)}
                      placeholder="+1 (555) 234-5678"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Work / Office Phone
                    </label>
                    <input
                      type="tel"
                      value={vcardPhone}
                      onChange={(e) => setVcardPhone(e.target.value)}
                      placeholder="+1 (555) 876-5432"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 @sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={vcardEmail}
                      onChange={(e) => setVcardEmail(e.target.value)}
                      placeholder="alex@company.com"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Website URL
                    </label>
                    <input
                      type="url"
                      value={vcardUrl}
                      onChange={(e) => setVcardUrl(e.target.value)}
                      placeholder="https://example.com"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium"
                    />
                  </div>
                </div>

                {/* Postal Address */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5">
                  <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider block">
                    Postal Address & Notes
                  </span>
                  <div className="grid grid-cols-1 @sm:grid-cols-3 gap-2.5">
                    <div className="@sm:col-span-3">
                      <input
                        type="text"
                        value={vcardStreet}
                        onChange={(e) => setVcardStreet(e.target.value)}
                        placeholder="Street Address (e.g. 100 Pine St, Suite 500)"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={vcardCity}
                        onChange={(e) => setVcardCity(e.target.value)}
                        placeholder="City (e.g. San Francisco)"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={vcardState}
                        onChange={(e) => setVcardState(e.target.value)}
                        placeholder="State / Region (e.g. CA)"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={vcardZip}
                        onChange={(e) => setVcardZip(e.target.value)}
                        placeholder="ZIP / Postal Code"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={vcardNote}
                      onChange={(e) => setVcardNote(e.target.value)}
                      placeholder="Note / Bio / Memo (optional)"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Wi-Fi */}
            {tab === "wifi" && (
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Wi-Fi Network Name (SSID)
                  </label>
                  <input
                    type="text"
                    value={wifiSsid}
                    onChange={(e) => setWifiSsid(e.target.value)}
                    placeholder="e.g. MyHomeNetwork"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 @md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Password
                    </label>
                    <input
                      type="text"
                      value={wifiPass}
                      onChange={(e) => setWifiPass(e.target.value)}
                      placeholder="Network Password"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Encryption Type
                    </label>
                    <select
                      value={wifiType}
                      onChange={(e) => setWifiType(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="WPA">WPA / WPA2 / WPA3 (Default)</option>
                      <option value="WEP">WEP (Legacy)</option>
                      <option value="nopass">None (Open Network)</option>
                    </select>
                  </div>
                </div>

                <label className="flex items-center space-x-2 text-xs text-slate-600 dark:text-slate-400 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={wifiHidden}
                    onChange={(e) => setWifiHidden(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                  />
                  <span>This is a hidden network (SSID not broadcasted)</span>
                </label>
              </div>
            )}

            {/* Tab 4: Direct Phone Call */}
            {tab === "phone" && (
              <div className="space-y-3">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Scanning this QR code prompts the phone's dialer to instantly place a call to the specified number.
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Phone Number (with Country Code)
                  </label>
                  <div className="relative flex items-center">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                    <input
                      type="tel"
                      value={phoneNum}
                      onChange={(e) => setPhoneNum(e.target.value)}
                      placeholder="+1 (555) 019-2834"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Tab 5: SMS Text Message */}
            {tab === "sms" && (
              <div className="space-y-3">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Opens the native SMS/Messages app on the user's phone with the recipient number and text pre-filled.
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Recipient Phone Number
                  </label>
                  <div className="relative flex items-center">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                    <input
                      type="tel"
                      value={smsPhone}
                      onChange={(e) => setSmsPhone(e.target.value)}
                      placeholder="+1 (555) 234-5678"
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Pre-filled SMS Message
                  </label>
                  <textarea
                    rows={3}
                    value={smsMessage}
                    onChange={(e) => setSmsMessage(e.target.value)}
                    placeholder="Hello! Reaching out regarding your listing..."
                    className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* Tab 6: Email */}
            {tab === "email" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Recipient Email Address
                  </label>
                  <input
                    type="email"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    placeholder="support@domain.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Pre-filled Subject
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Subject line"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Message Body
                  </label>
                  <textarea
                    rows={2}
                    value={emailBody}
                    onChange={(e) => setEmailBody(e.target.value)}
                    placeholder="Hello..."
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* Tab 7: WhatsApp */}
            {tab === "whatsapp" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number (with Country Code, no + or spaces)
                  </label>
                  <input
                    type="tel"
                    value={waPhone}
                    onChange={(e) => setWaPhone(e.target.value)}
                    placeholder="14155552671"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Default Message
                  </label>
                  <textarea
                    rows={2}
                    value={waMsg}
                    onChange={(e) => setWaMsg(e.target.value)}
                    placeholder="Hi! Reaching out via QR..."
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* Tab 8: Calendar Event (iCal) */}
            {tab === "event" && (
              <div className="space-y-3">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Generates an iCalendar (RFC 5545) event. Scanning adds the meeting, conference, or party directly to Apple Calendar or Google Calendar.
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Event Title / Summary
                  </label>
                  <input
                    type="text"
                    value={eventTitle}
                    onChange={(e) => setEventTitle(e.target.value)}
                    placeholder="Product Launch & Keynote"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Location / Link
                  </label>
                  <input
                    type="text"
                    value={eventLocation}
                    onChange={(e) => setEventLocation(e.target.value)}
                    placeholder="Grand Ballroom & Online Zoom"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium"
                  />
                </div>
                <div className="grid grid-cols-1 @sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Start Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={eventStart}
                      onChange={(e) => setEventStart(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      End Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={eventEnd}
                      onChange={(e) => setEventEnd(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Event Description
                  </label>
                  <textarea
                    rows={2}
                    value={eventDesc}
                    onChange={(e) => setEventDesc(e.target.value)}
                    placeholder="Event description, agenda, and notes..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium"
                  />
                </div>
              </div>
            )}

            {/* Tab 9: Geo Location */}
            {tab === "geo" && (
              <div className="space-y-3">
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  Points phones directly to coordinates or locations in Google Maps / Apple Maps.
                </div>
                <div className="grid grid-cols-1 @sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Latitude
                    </label>
                    <input
                      type="text"
                      value={geoLat}
                      onChange={(e) => setGeoLat(e.target.value)}
                      placeholder="37.7749"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Longitude
                    </label>
                    <input
                      type="text"
                      value={geoLng}
                      onChange={(e) => setGeoLng(e.target.value)}
                      placeholder="-122.4194"
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Location Name or Address Query
                  </label>
                  <input
                    type="text"
                    value={geoQuery}
                    onChange={(e) => setGeoQuery(e.target.value)}
                    placeholder="Times Square, New York or Eiffel Tower, Paris"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium"
                  />
                </div>
              </div>
            )}

            {/* Tab 10: Payment & Crypto */}
            {tab === "payment" && (
              <div className="space-y-3.5">
                <div className="flex items-center gap-2">
                  {[
                    { id: "upi", label: "UPI (India / GPay / PhonePe)" },
                    { id: "bitcoin", label: "Bitcoin (BTC)" },
                    { id: "paypal", label: "PayPal.me" },
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setPayType(p.id as "upi" | "bitcoin" | "paypal")}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                        payType === p.id
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>

                {payType === "upi" && (
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        UPI VPA / ID
                      </label>
                      <input
                        type="text"
                        value={payUpiVpa}
                        onChange={(e) => setPayUpiVpa(e.target.value)}
                        placeholder="username@okhdfcbank"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium"
                      />
                    </div>
                    <div className="grid grid-cols-1 @sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Payee / Merchant Name
                        </label>
                        <input
                          type="text"
                          value={payUpiName}
                          onChange={(e) => setPayUpiName(e.target.value)}
                          placeholder="Acme Store"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Amount (INR, Optional)
                        </label>
                        <input
                          type="number"
                          value={payUpiAmount}
                          onChange={(e) => setPayUpiAmount(e.target.value)}
                          placeholder="250.00"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {payType === "bitcoin" && (
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Bitcoin Wallet Address
                      </label>
                      <input
                        type="text"
                        value={payBtcAddress}
                        onChange={(e) => setPayBtcAddress(e.target.value)}
                        placeholder="1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-mono font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        Amount (BTC, Optional)
                      </label>
                      <input
                        type="text"
                        value={payBtcAmount}
                        onChange={(e) => setPayBtcAmount(e.target.value)}
                        placeholder="0.005"
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-mono font-medium"
                      />
                    </div>
                  </div>
                )}

                {payType === "paypal" && (
                  <div className="space-y-3 pt-1">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                        PayPal.me Username
                      </label>
                      <div className="relative flex items-center">
                        <span className="text-xs font-semibold text-slate-400 absolute left-3.5 pointer-events-none">
                          paypal.me/
                        </span>
                        <input
                          type="text"
                          value={payPaypalUser}
                          onChange={(e) => setPayPaypalUser(e.target.value)}
                          placeholder="yourusername"
                          className="w-full pl-24 pr-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 11: Plain Text */}
            {tab === "text" && (
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Text Content or Code
                </label>
                <textarea
                  rows={4}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter text, serial numbers, cryptographic keys, or notes..."
                  className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                  <span>Standard UTF-8 encoded text</span>
                  <span>{text.length} characters</span>
                </div>
              </div>
            )}

            {/* Tab 12: Batch CSV (Bulk Services Processing) */}
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

                <div className="p-3.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs text-blue-800 dark:text-blue-300 flex flex-col gap-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>Bulk Services CSV Processing</span>
                  </div>
                  <p className="text-[11px] text-blue-700/80 dark:text-blue-300/80 leading-relaxed">
                    Upload your service list, inventory, or contact roster via CSV (columns: <code>Title, Type, Value</code>). Preview any QR code in real-time, and download all generated codes at once as a CSV manifest or packed ZIP archive.
                  </p>
                </div>

                {/* Batch Action Toolbar */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => csvFileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition"
                  >
                    <FileUp className="w-3.5 h-3.5" />
                    <span>Upload CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={downloadSampleCsv}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition"
                  >
                    <FolderDown className="w-3.5 h-3.5" />
                    <span>Download Sample CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={downloadAllBatchCsv}
                    disabled={batchItems.length === 0}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition disabled:opacity-50"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Download All as CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={downloadAllBatchZip}
                    disabled={batchItems.length === 0 || batchIsExporting}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition disabled:opacity-50"
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>{batchIsExporting ? "Generating ZIP..." : "Download All as ZIP (Images)"}</span>
                  </button>

                  {batchItems.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setBatchItems([])}
                      className="ml-auto flex items-center gap-1 px-2.5 py-2 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition"
                      title="Clear All Items"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Clear All</span>
                    </button>
                  )}
                </div>

                {/* Add New Item Form */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <div className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Add Single Service / Row
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                    <input
                      type="text"
                      value={newBatchTitle}
                      onChange={(e) => setNewBatchTitle(e.target.value)}
                      placeholder="Service Title (e.g. VIP Lounge Wi-Fi)"
                      className="sm:col-span-4 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                    <select
                      value={newBatchType}
                      onChange={(e) => setNewBatchType(e.target.value)}
                      className="sm:col-span-3 px-2 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    >
                      <option value="url">Website URL</option>
                      <option value="vcard">vCard Contact</option>
                      <option value="wifi">Wi-Fi</option>
                      <option value="phone">Phone</option>
                      <option value="email">Email</option>
                      <option value="text">Plain Text</option>
                    </select>
                    <input
                      type="text"
                      value={newBatchValue}
                      onChange={(e) => setNewBatchValue(e.target.value)}
                      placeholder="Payload or URL..."
                      className="sm:col-span-3 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                      onKeyDown={(e) => e.key === "Enter" && handleAddBatchItem()}
                    />
                    <button
                      type="button"
                      onClick={handleAddBatchItem}
                      disabled={!newBatchValue.trim()}
                      className="sm:col-span-2 px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 transition"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Items List Table */}
                <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <span>Loaded Items ({batchItems.length})</span>
                    <span className="text-[10px] text-slate-500 font-normal">Click row to preview QR</span>
                  </div>

                  {batchItems.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      No services loaded. Upload a CSV file or click "Download Sample CSV" to get started.
                    </div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
                      {batchItems.map((item, idx) => {
                        const isSelected = selectedBatchIndex === idx;
                        return (
                          <div
                            key={item.id}
                            onClick={() => setSelectedBatchIndex(idx)}
                            className={`flex items-center justify-between p-3 cursor-pointer transition text-xs ${
                              isSelected
                                ? "bg-blue-50/80 dark:bg-blue-950/40 border-l-4 border-blue-600 pl-2"
                                : "hover:bg-slate-50 dark:hover:bg-slate-800/40"
                            }`}
                          >
                            <div className="min-w-0 flex-1 pr-3">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-900 dark:text-white truncate">
                                  #{idx + 1} {item.title}
                                </span>
                                <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-md uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                  {item.type}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-mono">
                                {item.value}
                              </p>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <span
                                className={`text-[10px] font-medium px-2 py-1 rounded-lg ${
                                  isSelected
                                    ? "bg-blue-600 text-white"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                                }`}
                              >
                                {isSelected ? "Previewing" : "Preview"}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveBatchItem(item.id);
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                                title="Delete row"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Colors & Theme Presets */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
                <Palette className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Color Palette & Themes</span>
              </div>
              <button
                onClick={swapColors}
                className="text-[11px] font-semibold text-slate-500 hover:text-blue-600 flex items-center space-x-1"
                title="Swap Foreground and Background colors"
              >
                <ArrowRightLeft className="w-3 h-3" />
                <span>Invert Colors</span>
              </button>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-2 @md:grid-cols-3 @xl:grid-cols-4 gap-2.5">
              {COLOR_PRESETS.map((p) => {
                const isSelected = fgColor === p.fg && bgColor === p.bg && !transparentBg;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setFgColor(p.fg);
                      setBgColor(p.bg);
                      setTransparentBg(false);
                    }}
                    title={p.name}
                    className={`p-2.5 rounded-2xl border flex items-center gap-2 min-h-[52px] transition text-left ${
                      isSelected
                        ? "border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/40 dark:bg-blue-950/30"
                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <div
                      className="w-7 h-7 rounded-xl border border-black/10 shadow-xs flex items-center justify-center shrink-0"
                      style={{ backgroundColor: p.bg }}
                    >
                      <div className="w-3.5 h-3.5 rounded-md" style={{ backgroundColor: p.fg }} />
                    </div>
                    {/* Wraps instead of truncating. At three-per-row these
                        labels were being cut to "M...", "O...", "E..." — which
                        made the palette impossible to use. */}
                    <span className="text-[11px] font-medium leading-tight text-slate-700 dark:text-slate-300">
                      {p.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom Color Pickers */}
            <div className="grid grid-cols-1 @sm:grid-cols-2 @xl:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Foreground (Dots)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-8 h-8 rounded-xl cursor-pointer border-0 bg-transparent shrink-0"
                  />
                  <input
                    type="text"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-full text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-1 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
                  Background
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    disabled={transparentBg}
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-8 h-8 rounded-xl cursor-pointer border-0 bg-transparent shrink-0 disabled:opacity-40"
                  />
                  <input
                    type="text"
                    disabled={transparentBg}
                    value={transparentBg ? "Transparent" : bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-full text-xs font-mono font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-1 rounded-lg text-slate-900 dark:text-white disabled:opacity-40"
                  />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col justify-center">
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Transparent BG
                </label>
                <button
                  onClick={() => setTransparentBg(!transparentBg)}
                  className={`w-full py-1.5 px-3 rounded-xl text-xs font-semibold border transition ${
                    transparentBg
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800"
                  }`}
                >
                  {transparentBg ? "Alpha (ON)" : "Solid Fill"}
                </button>
              </div>
            </div>

            {/* Contrast validation badge */}
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/80 text-xs">
              <div className="flex items-center space-x-2">
                {contrastInfo.isGood ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                )}
                <span className="font-medium text-slate-700 dark:text-slate-300">
                  {contrastInfo.isGood
                    ? "Optimal camera readability contrast"
                    : "Low contrast detected — phones may struggle to scan"}
                </span>
              </div>
              <span className="font-mono font-bold text-slate-500">
                {contrastInfo.ratio}:1
              </span>
            </div>
          </div>

          {/* Section 3: QR Structure, Center Logo & Frame Options */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
              <Sliders className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Center Icon & Frame Template</span>
            </div>

            {/* Center Icon Presets */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Center Icon / Brand Logo
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {BUILT_IN_LOGOS.map((item) => {
                  const isSelected = logoOption === item.id && !customLogoUrl;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setLogoOption(item.id);
                        setCustomLogoUrl(null);
                        if (item.id !== "none") setErrorLevel("H");
                      }}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition ${
                        isSelected
                          ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                          : "bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100"
                      }`}
                    >
                      {item.src && (
                        <img src={item.src} alt={item.name} className="w-3.5 h-3.5 rounded-full bg-white p-0.5" />
                      )}
                      <span>{item.name}</span>
                    </button>
                  );
                })}

                {/* Custom Upload Button */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/svg+xml,image/webp"
                  onChange={handleCustomLogoUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition ${
                    customLogoUrl
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-100"
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{customLogoUrl ? "Custom Logo Active" : "Upload Custom Logo"}</span>
                </button>

                {customLogoUrl && (
                  <button
                    onClick={removeCustomLogo}
                    className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                    title="Remove custom logo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Frame Style Selector */}
            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Presentation Template / Frame
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "none", label: "Clean QR Code", desc: "No frame or borders" },
                  { id: "badge", label: "Modern Badge", desc: "Pill header banner" },
                  { id: "card", label: "Card Frame", desc: "Title & subtitle card" },
                ].map((item) => {
                  const isSelected = frameStyle === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setFrameStyle(item.id as FrameStyle)}
                      className={`p-3 rounded-2xl border text-left transition ${
                        isSelected
                          ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 ring-2 ring-blue-500/20"
                          : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                      }`}
                    >
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {item.label}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{item.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Frame Text Inputs (if frame enabled) */}
            {frameStyle !== "none" && (
              <div className="grid grid-cols-1 @md:grid-cols-2 gap-3 pt-2 animate-in fade-in duration-200">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    Call To Action Title
                  </label>
                  <input
                    type="text"
                    value={frameText}
                    onChange={(e) => setFrameText(e.target.value)}
                    placeholder="SCAN WITH CAMERA"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold"
                  />
                </div>
                {frameStyle === "card" && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Card Footer Subtitle
                    </label>
                    <input
                      type="text"
                      value={frameSubtext}
                      onChange={(e) => setFrameSubtext(e.target.value)}
                      placeholder="100% Client-Side & Private"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Advanced Structural Settings: Margin & Error Level */}
            <div className="grid grid-cols-1 @lg:grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div>
                <div className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  <span>Quiet Zone Margin:</span>
                  <span className="font-bold font-mono">{marginSize} blocks</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2, 4].map((m) => (
                    <button
                      key={m}
                      onClick={() => setMarginSize(m)}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-xl border transition ${
                        marginSize === m
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800"
                      }`}
                    >
                      {m === 0 ? "None" : `${m}x`}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  <span>Error Correction Level:</span>
                  <span className="font-bold font-mono">{errorLevel} (High)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {(["L", "M", "Q", "H"] as ErrorLevel[]).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setErrorLevel(lvl)}
                      className={`flex-1 py-1.5 text-xs font-semibold rounded-xl border transition ${
                        errorLevel === lvl
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800"
                      }`}
                      title={
                        lvl === "L"
                          ? "Low (7% recovery)"
                          : lvl === "M"
                          ? "Medium (15% recovery)"
                          : lvl === "Q"
                          ? "Quartile (25% recovery)"
                          : "High (30% recovery - Recommended for logos)"
                      }
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Card Preview & High-Res Export */}
        <div className="@container @4xl:col-span-5 space-y-5 @4xl:sticky @4xl:top-24">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col items-center justify-center space-y-6">
            <div className="w-full flex items-center justify-between">
              <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-1.5">
                <QrCode className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>Live QR Card Preview</span>
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                Level {errorLevel}
              </div>
            </div>

            {/* The Visual Presentation Container */}
            <div
              className={`w-full max-w-[340px] rounded-3xl transition-all duration-200 flex flex-col items-center justify-center ${
                frameStyle === "none" ? "" : "shadow-lg"
              } ${
                transparentBg
                  ? "bg-[length:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0] bg-[linear-gradient(45deg,#cbd5e1_25%,transparent_25%),linear-gradient(-45deg,#cbd5e1_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#cbd5e1_75%),linear-gradient(-45deg,transparent_75%,#cbd5e1_75%)]"
                  : ""
              }`}
              style={{
                backgroundColor: transparentBg ? undefined : bgColor,
                // "Clean QR Code" means exactly that: quiet-zone padding only,
                // no decorative chrome. The framed styles get room for their
                // header and subtitle.
                padding:
                  frameStyle === "card"
                    ? "24px 20px 20px"
                    : frameStyle === "badge"
                    ? "20px"
                    : "16px",
                border: transparentBg
                  ? "1px dashed #94a3b8"
                  : frameStyle === "none"
                  ? "none"
                  : `1px solid ${fgColor}20`,
              }}
            >
              {/* Optional Header Badge */}
              {frameStyle === "badge" && (
                <div
                  className="px-4 py-1.5 rounded-full text-[11px] font-extrabold tracking-wider uppercase mb-4 shadow-xs"
                  style={{
                    backgroundColor: fgColor,
                    color: transparentBg ? "#ffffff" : bgColor,
                  }}
                >
                  {frameText}
                </div>
              )}

              {/* Optional Card Title */}
              {frameStyle === "card" && (
                <div
                  className="text-xs font-extrabold tracking-wider uppercase mb-3 text-center"
                  style={{ color: fgColor }}
                >
                  {frameText}
                </div>
              )}

              {/* QR Code Container */}
              {/* No tinted wrapper here. The previous
                  bg-white/40 dark:bg-black/10 backdrop-blur layer painted a
                  translucent panel over the chosen background colour, which in
                  dark mode washed the code out and showed as a grey box around
                  it. The canvas paints its own background, so the wrapper only
                  needs to size and centre it. */}
              <div
                ref={canvasContainerRef}
                className="w-full max-w-[260px] flex items-center justify-center"
              >
                <QRCodeCanvas
                  value={payload}
                  // Rendered at 2x the display box so the canvas is downscaled
                  // rather than stretched — upscaling a 240px canvas to fill
                  // 260px softened the module edges that scanners rely on.
                  size={520}
                  fgColor={fgColor}
                  bgColor={transparentBg ? "rgba(0,0,0,0)" : bgColor}
                  level={errorLevel}
                  marginSize={marginSize}
                  imageSettings={
                    activeLogoSrc
                      ? {
                          src: activeLogoSrc,
                          height: 82,
                          width: 82,
                          excavate: true,
                        }
                      : undefined
                  }
                  // qrcode.react writes an inline `width/height: {size}px`.
                  // Inside this flex box that inline width gets shrunk to the
                  // container while the inline height does not, which squashed
                  // the code to a 1:2.5 aspect ratio. qrcode.react spreads the
                  // caller's `style` last, so setting it here wins and keeps
                  // the canvas square at its intrinsic ratio.
                  style={{ width: "100%", height: "auto" }}
                  className="rounded-lg"
                />
              </div>

              {/* Full-resolution canvas used only as the export source. */}
              <div ref={exportCanvasRef} className="hidden">
                <QRCodeCanvas
                  value={payload}
                  size={downloadRes}
                  fgColor={fgColor}
                  bgColor={transparentBg ? "rgba(0,0,0,0)" : bgColor}
                  level={errorLevel}
                  marginSize={marginSize}
                  imageSettings={
                    activeLogoSrc
                      ? {
                          src: activeLogoSrc,
                          height: Math.round(downloadRes * 0.16),
                          width: Math.round(downloadRes * 0.16),
                          excavate: true,
                        }
                      : undefined
                  }
                />
              </div>

              {/* Hidden SVG Renderer for Perfect Vector Exports */}
              <div ref={svgContainerRef} className="hidden">
                <QRCodeSVG
                  value={payload}
                  size={1024}
                  fgColor={fgColor}
                  bgColor={transparentBg ? "rgba(0,0,0,0)" : bgColor}
                  level={errorLevel}
                  marginSize={marginSize}
                  imageSettings={
                    activeLogoSrc
                      ? {
                          src: activeLogoSrc,
                          height: 160,
                          width: 160,
                          excavate: true,
                        }
                      : undefined
                  }
                />
              </div>

              {/* Optional Card Subtitle */}
              {frameStyle === "card" && frameSubtext && (
                <div
                  className="mt-3 text-[10px] font-medium tracking-wide opacity-80 text-center"
                  style={{ color: fgColor }}
                >
                  {frameSubtext}
                </div>
              )}
            </div>

            {/* Quick Resolution Selector */}
            <div className="w-full flex items-center justify-between text-xs pt-1 px-1">
              <span className="font-semibold text-slate-600 dark:text-slate-400">
                Export Resolution:
              </span>
              <div className="flex items-center space-x-1">
                {[512, 1024, 2048].map((res) => (
                  <button
                    key={res}
                    onClick={() => setDownloadRes(res)}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold transition ${
                      downloadRes === res
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-blue-600"
                    }`}
                  >
                    {res}px
                  </button>
                ))}
              </div>
            </div>

            {/* Primary & Secondary Export Actions */}
            <div className="w-full space-y-2.5">
              <button
                onClick={handleDownloadPng}
                className="w-full flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md hover:shadow-blue-500/20 transition-all cursor-pointer active:scale-[0.99]"
              >
                <Download className="w-4 h-4" />
                <span>Download High-Res PNG ({downloadRes} × {downloadRes})</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleDownloadSvg}
                  className="flex items-center justify-center space-x-1.5 px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition"
                  title="Download scalable vector SVG file for print"
                >
                  <Download className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Download SVG</span>
                </button>

                <button
                  onClick={handleCopyImage}
                  className="flex items-center justify-center space-x-1.5 px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition"
                  title="Copy raster image directly to your clipboard"
                >
                  {copiedImage ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedImage ? "Copied PNG!" : "Copy PNG"}</span>
                </button>
              </div>

              <button
                onClick={handleCopySvg}
                className="w-full py-2 px-3 text-[11px] font-medium text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 flex items-center justify-center space-x-1 transition"
              >
                {copiedSvg ? (
                  <Check className="w-3 h-3 text-emerald-600" />
                ) : (
                  <Copy className="w-3 h-3" />
                )}
                <span>{copiedSvg ? "SVG Vector Markup Copied!" : "Copy Raw SVG Markup"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Recent QR Codes History */}
      {recentQrs && recentQrs.length > 0 && (
        <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Recent Generated QR Codes ({recentQrs.length}/4)
              </span>
              <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                Saved locally on your browser
              </span>
            </div>
            <button
              onClick={() => setRecentQrs([])}
              className="text-[11px] font-semibold text-rose-500 hover:text-rose-700 hover:underline transition flex items-center space-x-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear History</span>
            </button>
          </div>

          <div className="grid grid-cols-1 @md:grid-cols-2 @3xl:grid-cols-4 gap-3.5">
            {recentQrs.map((item, idx) => (
              <div
                key={item.id || idx}
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex flex-col space-y-3 group hover:border-blue-500/50 transition shadow-xs"
              >
                {/* QR Preview */}
                <div
                  className="w-full h-32 rounded-xl p-2.5 flex items-center justify-center border shadow-xs"
                  style={{ backgroundColor: item.bgColor }}
                >
                  <QRCodeCanvas
                    value={item.payload}
                    size={96}
                    fgColor={item.fgColor}
                    bgColor={item.bgColor}
                    level="H"
                    marginSize={1}
                  />
                </div>

                {/* Info */}
                <div className="space-y-0.5 text-xs flex-1">
                  <div className="font-semibold text-slate-900 dark:text-white truncate" title={item.payload}>
                    {item.payload}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span className="capitalize">{item.tab} QR</span>
                    <span>
                      {new Date(item.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-1.5 pt-1">
                  <button
                    onClick={() => {
                      if (item.tab === "url") setUrl(item.payload);
                      else if (item.tab === "text") setText(item.payload);
                      setTab(item.tab);
                      setFgColor(item.fgColor);
                      setBgColor(item.bgColor);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="flex items-center justify-center space-x-1 py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-semibold transition"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Load</span>
                  </button>

                  <button
                    onClick={() => {
                      const exportCanvas = document.createElement("canvas");
                      exportCanvas.width = 1024;
                      exportCanvas.height = 1024;
                      const expCtx = exportCanvas.getContext("2d");
                      if (expCtx) {
                        expCtx.fillStyle = item.bgColor;
                        expCtx.fillRect(0, 0, 1024, 1024);
                      }
                      downloadDataUrl(exportCanvas.toDataURL("image/png"), `qrcode-${item.id}.png`);
                      confetti({ particleCount: 25, spread: 45, origin: { y: 0.85 } });
                    }}
                    className="flex items-center justify-center space-x-1 py-1.5 px-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-semibold transition shadow-xs"
                  >
                    <Download className="w-3 h-3" />
                    <span>Export</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import jsQR from "jsqr";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import { downloadDataUrl } from "@/lib/utils/download";
import {
  Camera,
  Upload,
  Clipboard,
  Sparkles,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  Download,
  Wifi,
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  FileText,
  CreditCard,
  Code,
  Trash2,
  RefreshCw,
  AlertCircle,
  Volume2,
  VolumeX,
  FlipHorizontal,
  Zap,
  ZapOff,
} from "lucide-react";
import confetti from "canvas-confetti";

export type DetectedQrType =
  | "url"
  | "vcard"
  | "wifi"
  | "email"
  | "phone"
  | "sms"
  | "event"
  | "geo"
  | "upi"
  | "json"
  | "text";

export interface ParsedVcard {
  fullName: string;
  firstName?: string;
  lastName?: string;
  organization?: string;
  title?: string;
  phone?: string;
  cellPhone?: string;
  email?: string;
  url?: string;
  address?: string;
  note?: string;
}

export interface ParsedWifi {
  ssid: string;
  password?: string;
  authType: string;
  hidden: boolean;
}

export interface ParsedEvent {
  title: string;
  location?: string;
  start?: string;
  end?: string;
  description?: string;
}

export interface ParsedEmail {
  to: string;
  subject?: string;
  body?: string;
}

export interface ParsedSms {
  phone: string;
  message?: string;
}

export interface ParsedGeo {
  lat: string;
  lng: string;
  query?: string;
}

export interface ParsedUpi {
  pa: string;
  pn?: string;
  am?: string;
  cu?: string;
}

export interface QrExtractionResult {
  raw: string;
  type: DetectedQrType;
  parsedUrl?: string;
  vcard?: ParsedVcard;
  wifi?: ParsedWifi;
  event?: ParsedEvent;
  email?: ParsedEmail;
  sms?: ParsedSms;
  geo?: ParsedGeo;
  upi?: ParsedUpi;
  phone?: string;
  jsonObj?: unknown;
}

interface ScanHistoryItem {
  id: string;
  raw: string;
  type: DetectedQrType;
  title: string;
  timestamp: number;
}

export function parseQrData(raw: string): QrExtractionResult {
  const trimmed = raw.trim();

  // 1. vCard check
  if (trimmed.toUpperCase().includes("BEGIN:VCARD")) {
    const lines = trimmed.split(/\r?\n/);
    const vcard: ParsedVcard = { fullName: "" };

    for (const line of lines) {
      const upper = line.toUpperCase();
      if (upper.startsWith("FN:")) {
        vcard.fullName = line.slice(3).trim();
      } else if (upper.startsWith("N:")) {
        const parts = line.slice(2).split(";");
        vcard.lastName = parts[0]?.trim();
        vcard.firstName = parts[1]?.trim();
      } else if (upper.startsWith("ORG:")) {
        vcard.organization = line.slice(4).trim();
      } else if (upper.startsWith("TITLE:")) {
        vcard.title = line.slice(6).trim();
      } else if (upper.startsWith("TEL;TYPE=CELL") || upper.startsWith("TEL;CELL:")) {
        vcard.cellPhone = line.split(":").slice(1).join(":").trim();
      } else if (upper.startsWith("TEL")) {
        const num = line.split(":").slice(1).join(":").trim();
        if (!vcard.phone) vcard.phone = num;
        else if (!vcard.cellPhone) vcard.cellPhone = num;
      } else if (upper.startsWith("EMAIL")) {
        vcard.email = line.split(":").slice(1).join(":").trim();
      } else if (upper.startsWith("URL")) {
        vcard.url = line.split(":").slice(1).join(":").trim();
      } else if (upper.startsWith("ADR")) {
        const adrParts = line.split(":").slice(1).join(":").split(";").filter(Boolean);
        vcard.address = adrParts.join(", ").trim();
      } else if (upper.startsWith("NOTE:")) {
        vcard.note = line.slice(5).trim();
      }
    }

    if (!vcard.fullName && (vcard.firstName || vcard.lastName)) {
      vcard.fullName = `${vcard.firstName || ""} ${vcard.lastName || ""}`.trim();
    }
    if (!vcard.fullName) vcard.fullName = "Contact Card";

    return { raw, type: "vcard", vcard };
  }

  // 2. Wi-Fi check: WIFI:T:WPA;S:MySSID;P:mypass;H:false;;
  if (trimmed.toUpperCase().startsWith("WIFI:")) {
    const wifi: ParsedWifi = {
      ssid: "",
      authType: "WPA",
      hidden: false,
    };
    const body = trimmed.slice(5);
    const tokens = body.split(";");
    for (const token of tokens) {
      if (token.startsWith("S:")) wifi.ssid = token.slice(2);
      else if (token.startsWith("P:")) wifi.password = token.slice(2);
      else if (token.startsWith("T:")) wifi.authType = token.slice(2);
      else if (token.startsWith("H:")) wifi.hidden = token.slice(2).toLowerCase() === "true";
    }
    return { raw, type: "wifi", wifi };
  }

  // 3. Calendar Event (iCal)
  if (trimmed.toUpperCase().includes("BEGIN:VEVENT")) {
    const lines = trimmed.split(/\r?\n/);
    const ev: ParsedEvent = { title: "Calendar Event" };
    for (const line of lines) {
      const upper = line.toUpperCase();
      if (upper.startsWith("SUMMARY:")) ev.title = line.slice(8).trim();
      else if (upper.startsWith("LOCATION:")) ev.location = line.slice(9).trim();
      else if (upper.startsWith("DESCRIPTION:")) ev.description = line.slice(12).trim();
      else if (upper.startsWith("DTSTART:")) ev.start = line.slice(8).trim();
      else if (upper.startsWith("DTEND:")) ev.end = line.slice(6).trim();
    }
    return { raw, type: "event", event: ev };
  }

  // 4. UPI Payment
  if (trimmed.toLowerCase().startsWith("upi://pay")) {
    try {
      const urlObj = new URL(trimmed);
      const pa = urlObj.searchParams.get("pa") || "";
      const pn = urlObj.searchParams.get("pn") || undefined;
      const am = urlObj.searchParams.get("am") || undefined;
      const cu = urlObj.searchParams.get("cu") || "INR";
      return { raw, type: "upi", upi: { pa, pn, am, cu } };
    } catch {
      return { raw, type: "text" };
    }
  }

  // 5. Email (mailto: or MATMSG:)
  if (trimmed.toLowerCase().startsWith("mailto:")) {
    try {
      const urlObj = new URL(trimmed);
      const to = urlObj.pathname;
      const subject = urlObj.searchParams.get("subject") || undefined;
      const body = urlObj.searchParams.get("body") || undefined;
      return { raw, type: "email", email: { to, subject, body } };
    } catch {
      const emailPart = trimmed.slice(7).split("?")[0];
      return { raw, type: "email", email: { to: emailPart } };
    }
  }

  if (trimmed.toUpperCase().startsWith("MATMSG:")) {
    const to = trimmed.match(/TO:([^;]+)/i)?.[1] || "";
    const subject = trimmed.match(/SUB:([^;]+)/i)?.[1] || "";
    const body = trimmed.match(/BODY:([^;]+)/i)?.[1] || "";
    return { raw, type: "email", email: { to, subject, body } };
  }

  // 6. SMS (SMSTO: or sms:)
  if (trimmed.toUpperCase().startsWith("SMSTO:")) {
    const parts = trimmed.slice(6).split(":");
    const phone = parts[0] || "";
    const message = parts.slice(1).join(":");
    return { raw, type: "sms", sms: { phone, message } };
  }
  if (trimmed.toLowerCase().startsWith("sms:")) {
    const rest = trimmed.slice(4);
    const [phonePart, query] = rest.split("?");
    const message = query ? new URLSearchParams(query).get("body") || "" : "";
    return { raw, type: "sms", sms: { phone: phonePart, message } };
  }

  // 7. Phone call (tel:)
  if (trimmed.toLowerCase().startsWith("tel:")) {
    const phone = trimmed.slice(4).trim();
    return { raw, type: "phone", phone };
  }

  // 8. Geo Location (geo: or maps.google.com)
  if (trimmed.toLowerCase().startsWith("geo:")) {
    const coordPart = trimmed.slice(4).split("?")[0];
    const [lat, lng] = coordPart.split(",");
    const query = new URLSearchParams(trimmed.split("?")[1] || "").get("q") || undefined;
    return { raw, type: "geo", geo: { lat: lat?.trim() || "", lng: lng?.trim() || "", query } };
  }

  // 9. URL (http://, https://, or www.)
  if (/^(https?:\/\/|www\.)[^\s/$.?#].[^\s]*$/i.test(trimmed)) {
    const fullUrl = trimmed.startsWith("www.") ? `https://${trimmed}` : trimmed;
    return { raw, type: "url", parsedUrl: fullUrl };
  }

  // 10. JSON check
  if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
    try {
      const parsed = JSON.parse(trimmed);
      return { raw, type: "json", jsonObj: parsed };
    } catch {
      // not valid JSON, treat as text
    }
  }

  // 11. Fallback Plain Text
  return { raw, type: "text" };
}

export default function QrCodeScanner() {
  const [activeMode, setActiveMode] = useState<"camera" | "upload">("upload");
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [soundEnabled, setSoundEnabled] = usePersistentState<boolean>("qr_scan_sound", true);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [torchSupported, setTorchSupported] = useState<boolean>(false);

  // Scan Results
  const [scanResult, setScanResult] = useState<QrExtractionResult | null>(null);
  const [activeViewTab, setActiveViewTab] = useState<"extracted" | "raw">("extracted");
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Scan History
  const [history, setHistory] = usePersistentState<ScanHistoryItem[]>("qr_scan_history", []);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Beep sound generator
  const playBeep = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.13);
    } catch {
      // Audio context might be restricted before user gesture
    }
  }, [soundEnabled]);

  // Save to history helper
  const recordScan = useCallback(
    (extracted: QrExtractionResult) => {
      let title = extracted.raw.slice(0, 40);
      if (extracted.type === "url" && extracted.parsedUrl) {
        try {
          title = new URL(extracted.parsedUrl).hostname;
        } catch {
          title = extracted.parsedUrl;
        }
      } else if (extracted.type === "vcard" && extracted.vcard?.fullName) {
        title = extracted.vcard.fullName;
      } else if (extracted.type === "wifi" && extracted.wifi?.ssid) {
        title = `Wi-Fi: ${extracted.wifi.ssid}`;
      } else if (extracted.type === "event" && extracted.event?.title) {
        title = extracted.event.title;
      }

      const item: ScanHistoryItem = {
        id: String(Date.now()),
        raw: extracted.raw,
        type: extracted.type,
        title,
        timestamp: Date.now(),
      };

      setHistory((prev = []) => [item, ...prev.filter((p) => p.raw !== item.raw)].slice(0, 8));
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.85 } });
      playBeep();
    },
    [playBeep, setHistory]
  );

  // Decode ImageData using jsQR
  const decodeCanvasImageData = useCallback((imgData: ImageData): string | null => {
    const code = jsQR(imgData.data, imgData.width, imgData.height, {
      inversionAttempts: "attemptBoth",
    });
    return code ? code.data : null;
  }, []);

  // Process an Image File or URL
  const processImageElement = useCallback(
    (img: HTMLImageElement) => {
      let canvas = canvasRef.current;
      if (!canvas) {
        canvas = document.createElement("canvas");
        canvasRef.current = canvas;
      }
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const decoded = decodeCanvasImageData(imgData);

      if (decoded) {
        const result = parseQrData(decoded);
        setScanResult(result);
        recordScan(result);
      } else {
        alert("No valid QR code was detected in this image. Please ensure the QR code is clearly visible and well-lit.");
      }
      setIsProcessing(false);
    },
    [decodeCanvasImageData, recordScan]
  );

  const handleFileUpload = useCallback(
    (file: File) => {
      if (!file) return;
      setIsProcessing(true);
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result as string;
        setPreviewImage(src);
        const img = new Image();
        img.onload = () => processImageElement(img);
        img.src = src;
      };
      reader.readAsDataURL(file);
    },
    [processImageElement]
  );

  // Clipboard Paste Handler
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) {
            handleFileUpload(file);
            setActiveMode("upload");
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [handleFileUpload]);

  // Enumerate video devices
  useEffect(() => {
    if (navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((devs) => {
        const videoDevs = devs.filter((d) => d.kind === "videoinput");
        setDevices(videoDevs);
        if (videoDevs.length > 0 && !selectedDeviceId) {
          // Prefer environment/back camera on mobile
          const back = videoDevs.find((d) => d.label.toLowerCase().includes("back") || d.label.toLowerCase().includes("rear"));
          setSelectedDeviceId(back ? back.deviceId : videoDevs[0].deviceId);
        }
      });
    }
  }, [selectedDeviceId]);

  // Start / Stop Camera Stream
  const stopCamera = useCallback(() => {
    if (animFrameIdRef.current) {
      cancelAnimationFrame(animFrameIdRef.current);
      animFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setTorchOn(false);
    setTorchSupported(false);
  }, []);

  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);

    try {
      const constraints: MediaStreamConstraints = {
        video: selectedDeviceId
          ? { deviceId: { exact: selectedDeviceId } }
          : { facingMode: "environment" },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraActive(true);

        // Check if torch is supported
        const track = stream.getVideoTracks()[0];
        const caps = (track.getCapabilities ? track.getCapabilities() : {}) as { torch?: boolean };
        if (caps.torch) {
          setTorchSupported(true);
        }
      }
    } catch (err: unknown) {
      console.error("Camera access error:", err);
      setCameraError("Camera access was blocked or is unavailable. Please check browser camera permissions.");
      setCameraActive(false);
    }
  }, [selectedDeviceId, stopCamera]);

  // Toggle Torch
  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    try {
      const newTorchState = !torchOn;
      await (track as MediaStreamTrack & { applyConstraints: (c: unknown) => Promise<void> }).applyConstraints({
        advanced: [{ torch: newTorchState }],
      });
      setTorchOn(newTorchState);
    } catch (err) {
      console.warn("Torch failed:", err);
    }
  };

  // Live Camera Scan Loop
  useEffect(() => {
    if (!cameraActive) return;

    let scanCanvas = canvasRef.current;
    if (!scanCanvas) {
      scanCanvas = document.createElement("canvas");
      canvasRef.current = scanCanvas;
    }

    let isScanning = true;

    const scanFrame = () => {
      if (!isScanning) return;

      const video = videoRef.current;
      if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
        scanCanvas.width = video.videoWidth;
        scanCanvas.height = video.videoHeight;
        const ctx = scanCanvas.getContext("2d", { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, scanCanvas.width, scanCanvas.height);
          const imgData = ctx.getImageData(0, 0, scanCanvas.width, scanCanvas.height);
          const decoded = decodeCanvasImageData(imgData);

          if (decoded) {
            const parsed = parseQrData(decoded);
            setScanResult(parsed);
            recordScan(parsed);
            stopCamera();
            return;
          }
        }
      }

      animFrameIdRef.current = requestAnimationFrame(scanFrame);
    };

    animFrameIdRef.current = requestAnimationFrame(scanFrame);

    return () => {
      isScanning = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [cameraActive, decodeCanvasImageData, recordScan, stopCamera]);

  // Stop camera when switching tabs
  useEffect(() => {
    if (activeMode !== "camera") {
      stopCamera();
    }
  }, [activeMode, stopCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Copy helper
  const copyToClipboard = (textToCopy: string, fieldKey?: string) => {
    navigator.clipboard.writeText(textToCopy);
    if (fieldKey) {
      setCopiedField(fieldKey);
      setTimeout(() => setCopiedField(null), 1800);
    } else {
      setCopiedRaw(true);
      setTimeout(() => setCopiedRaw(false), 1800);
    }
  };

  // Download .vcf contact file
  const downloadVcf = () => {
    if (!scanResult || scanResult.type !== "vcard") return;
    const blob = new Blob([scanResult.raw], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const name = scanResult.vcard?.fullName ? scanResult.vcard.fullName.replace(/\s+/g, "_") : "contact";
    link.download = `${name}.vcf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Download .ics calendar event
  const downloadIcs = () => {
    if (!scanResult || scanResult.type !== "event") return;
    const blob = new Blob([scanResult.raw], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `event-${Date.now()}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Quick Sample QR Tests
  const loadSampleQr = (sampleKind: "vcard" | "wifi" | "url" | "event") => {
    let sampleRaw = "";
    if (sampleKind === "vcard") {
      sampleRaw = `BEGIN:VCARD\nVERSION:3.0\nN:Morgan;Alex;;;\nFN:Alex Morgan\nORG:TabBench Inc.\nTITLE:Principal Engineer\nTEL;TYPE=CELL,VOICE:+1 (555) 234-5678\nTEL;TYPE=WORK,VOICE:+1 (555) 876-5432\nEMAIL;TYPE=PREF,INTERNET:alex@tabbench.com\nURL:https://tabbench.com\nADR;TYPE=WORK:;;100 Pine Street;San Francisco;CA;94111;USA\nNOTE:Leading engineering team for privacy-first web utilities.\nEND:VCARD`;
    } else if (sampleKind === "wifi") {
      sampleRaw = `WIFI:T:WPA;S:CoffeeShop_Guest_5G;P:Espresso2026!;H:false;;`;
    } else if (sampleKind === "url") {
      sampleRaw = `https://tabbench.com/tools/qr-code-generator`;
    } else if (sampleKind === "event") {
      sampleRaw = `BEGIN:VCALENDAR\nVERSION:2.0\nBEGIN:VEVENT\nSUMMARY:Global Tech Summit 2026\nLOCATION:Moscone Center, San Francisco\nDTSTART:20261110T090000Z\nDTEND:20261110T170000Z\nDESCRIPTION:Annual keynote, workshop sessions, and networking.\nEND:VEVENT\nEND:VCALENDAR`;
    }

    const result = parseQrData(sampleRaw);
    setScanResult(result);
    recordScan(result);
  };

  return (
    <div className="space-y-6">
      {/* Top Controls: Mode Selector & Sound Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveMode("upload")}
            className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2 text-xs font-semibold rounded-xl transition ${
              activeMode === "upload"
                ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Image or Paste</span>
          </button>

          <button
            onClick={() => {
              setActiveMode("camera");
              startCamera();
            }}
            className={`flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2 text-xs font-semibold rounded-xl transition ${
              activeMode === "camera"
                ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Live Camera Scanner</span>
          </button>
        </div>

        <div className="flex items-center justify-end px-2 space-x-2">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-1.5 rounded-xl border text-xs font-medium flex items-center space-x-1.5 transition ${
              soundEnabled
                ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border-slate-200 dark:border-slate-700"
                : "text-slate-400 border-transparent hover:bg-slate-200 dark:hover:bg-slate-800"
            }`}
            title="Toggle scan confirmation audio beep"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span className="text-[11px]">{soundEnabled ? "Audio On" : "Muted"}</span>
          </button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 @4xl:grid-cols-12 gap-6 items-start">
        {/* Left Column: Scanner Viewport */}
        <div className="@container @4xl:col-span-6 space-y-4">
          {/* Mode 1: File Upload & Clipboard */}
          {activeMode === "upload" && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
                  <Upload className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Image Upload & Clipboard</span>
                </div>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                  Ctrl + V Anywhere
                </span>
              </div>

              {/* Drag & Drop Target */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) handleFileUpload(file);
                }}
                onClick={() => fileInputRef.current?.click()}
                className="group border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-3xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[220px] bg-slate-50/50 dark:bg-slate-950/40 hover:bg-blue-50/30 dark:hover:bg-blue-950/20"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml,image/bmp"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  className="hidden"
                />

                <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform shadow-xs">
                  <QrCode className="w-7 h-7" />
                </div>

                <div className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                  Drop a QR code image here or click to browse
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mb-3">
                  Supports PNG, JPG, WebP, SVG screenshots & photos. Or press <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">Ctrl+V</kbd> / <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">Cmd+V</kbd> to paste.
                </div>

                <div className="inline-flex items-center space-x-1 px-3 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-xs">
                  <Clipboard className="w-3.5 h-3.5 text-blue-500" />
                  <span>Choose Image File</span>
                </div>
              </div>

              {/* Sample QR Codes Quick Bar */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Try Quick Sample QR Codes:</span>
                  <Sparkles className="w-3 h-3 text-amber-500" />
                </div>
                <div className="grid grid-cols-2 @sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => loadSampleQr("vcard")}
                    className="py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:text-blue-600 text-[11px] font-semibold transition text-left truncate"
                  >
                    👤 vCard Contact
                  </button>
                  <button
                    onClick={() => loadSampleQr("wifi")}
                    className="py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:text-blue-600 text-[11px] font-semibold transition text-left truncate"
                  >
                    📶 Wi-Fi Network
                  </button>
                  <button
                    onClick={() => loadSampleQr("url")}
                    className="py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:text-blue-600 text-[11px] font-semibold transition text-left truncate"
                  >
                    🌐 Website URL
                  </button>
                  <button
                    onClick={() => loadSampleQr("event")}
                    className="py-1.5 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:text-blue-600 text-[11px] font-semibold transition text-left truncate"
                  >
                    📅 iCal Event
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Mode 2: Live Camera Viewport */}
          {activeMode === "camera" && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
                  <Camera className="w-3.5 h-3.5 text-rose-500" />
                  <span>Real-Time Camera Scan</span>
                </div>
                {cameraActive && (
                  <span className="flex items-center space-x-1.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Scanning</span>
                  </span>
                )}
              </div>

              {/* Camera Error Message */}
              {cameraError && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start space-x-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>{cameraError}</div>
                </div>
              )}

              {/* Viewfinder Frame */}
              <div className="relative w-full aspect-square max-h-[360px] mx-auto rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${cameraActive ? "block" : "hidden"}`}
                />

                {!cameraActive && !cameraError && (
                  <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div className="text-xs font-semibold text-slate-300">
                      Camera feed is paused
                    </div>
                    <button
                      onClick={startCamera}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
                    >
                      Start Camera Scanner
                    </button>
                  </div>
                )}

                {/* Laser Overlay & Target Box */}
                {cameraActive && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-3/4 h-3/4 border-2 border-dashed border-blue-400/80 rounded-2xl relative">
                      {/* Animated scanning laser line */}
                      <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_8px_#f43f5e] animate-[bounce_2s_infinite]" />
                    </div>
                  </div>
                )}
              </div>

              {/* Camera Controls Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                {devices.length > 1 && (
                  <select
                    value={selectedDeviceId}
                    onChange={(e) => {
                      setSelectedDeviceId(e.target.value);
                      if (cameraActive) startCamera();
                    }}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-700 dark:text-slate-300"
                  >
                    {devices.map((d, i) => (
                      <option key={d.deviceId || i} value={d.deviceId}>
                        {d.label || `Camera ${i + 1}`}
                      </option>
                    ))}
                  </select>
                )}

                <div className="flex items-center space-x-2">
                  {torchSupported && (
                    <button
                      onClick={toggleTorch}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition ${
                        torchOn
                          ? "bg-amber-500 text-white border-amber-500"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {torchOn ? <Zap className="w-3.5 h-3.5" /> : <ZapOff className="w-3.5 h-3.5" />}
                      <span>{torchOn ? "Flashlight On" : "Flashlight"}</span>
                    </button>
                  )}

                  {cameraActive ? (
                    <button
                      onClick={stopCamera}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-200 text-xs font-semibold transition"
                    >
                      Pause
                    </button>
                  ) : (
                    <button
                      onClick={startCamera}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition"
                    >
                      Resume Camera
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Extracted Structured Data & Actions */}
        <div className="@container @4xl:col-span-6 space-y-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Extracted QR Data</span>
              </div>

              {scanResult && (
                <div className="flex items-center space-x-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl">
                  <button
                    onClick={() => setActiveViewTab("extracted")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                      activeViewTab === "extracted"
                        ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Structured
                  </button>
                  <button
                    onClick={() => setActiveViewTab("raw")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                      activeViewTab === "raw"
                        ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    Raw Payload
                  </button>
                </div>
              )}
            </div>

            {/* Empty State */}
            {!scanResult && (
              <div className="p-10 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center space-y-3 min-h-[300px]">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                  <QrCode className="w-6 h-6" />
                </div>
                <div className="text-xs font-semibold text-slate-900 dark:text-white">
                  No QR Code scanned yet
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs">
                  Upload an image, hold a QR code up to your camera, or click one of the quick sample buttons on the left.
                </div>
              </div>
            )}

            {/* Structured Card View */}
            {scanResult && activeViewTab === "extracted" && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* 1. URL Result Card */}
                {scanResult.type === "url" && scanResult.parsedUrl && (
                  <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                          <ExternalLink className="w-4 h-4" />
                        </span>
                        <span className="text-xs font-bold text-blue-950 dark:text-blue-200">
                          Website Destination
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 font-semibold">
                        HTTPS Link
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                      <a
                        href={scanResult.parsedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline break-all"
                      >
                        {scanResult.parsedUrl}
                      </a>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={scanResult.parsedUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition shadow-xs"
                      >
                        <span>Open Website</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => copyToClipboard(scanResult.parsedUrl || "", "url")}
                        className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold flex items-center space-x-1 transition"
                      >
                        {copiedField === "url" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedField === "url" ? "Copied" : "Copy Link"}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 2. vCard Contact Card */}
                {scanResult.type === "vcard" && scanResult.vcard && (
                  <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300">
                          <User className="w-4 h-4" />
                        </span>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">
                            {scanResult.vcard.fullName}
                          </div>
                          {(scanResult.vcard.title || scanResult.vcard.organization) && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {[scanResult.vcard.title, scanResult.vcard.organization].filter(Boolean).join(" • ")}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
                        vCard 3.0
                      </span>
                    </div>

                    {/* Contact details rows */}
                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                      {scanResult.vcard.cellPhone && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5" /> Mobile:
                          </span>
                          <a href={`tel:${scanResult.vcard.cellPhone}`} className="font-semibold text-blue-600 hover:underline">
                            {scanResult.vcard.cellPhone}
                          </a>
                        </div>
                      )}
                      {scanResult.vcard.phone && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5" /> Work:
                          </span>
                          <a href={`tel:${scanResult.vcard.phone}`} className="font-semibold text-blue-600 hover:underline">
                            {scanResult.vcard.phone}
                          </a>
                        </div>
                      )}
                      {scanResult.vcard.email && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5" /> Email:
                          </span>
                          <a href={`mailto:${scanResult.vcard.email}`} className="font-semibold text-blue-600 hover:underline">
                            {scanResult.vcard.email}
                          </a>
                        </div>
                      )}
                      {scanResult.vcard.url && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400 flex items-center gap-1.5">
                            <ExternalLink className="w-3.5 h-3.5" /> Website:
                          </span>
                          <a href={scanResult.vcard.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-blue-600 hover:underline truncate max-w-[200px]">
                            {scanResult.vcard.url}
                          </a>
                        </div>
                      )}
                      {scanResult.vcard.address && (
                        <div className="flex items-start justify-between gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-slate-400 flex items-center gap-1.5 shrink-0">
                            <MapPin className="w-3.5 h-3.5" /> Address:
                          </span>
                          <span className="font-medium text-slate-700 dark:text-slate-300 text-right">
                            {scanResult.vcard.address}
                          </span>
                        </div>
                      )}
                      {scanResult.vcard.note && (
                        <div className="pt-1 text-[11px] text-slate-500 italic">
                          "{scanResult.vcard.note}"
                        </div>
                      )}
                    </div>

                    {/* Actions: Download .VCF */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={downloadVcf}
                        className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Save to Phone Contacts (.vcf)</span>
                      </button>
                      <button
                        onClick={() => copyToClipboard(scanResult.raw, "vcard")}
                        className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold flex items-center space-x-1 transition"
                      >
                        {copiedField === "vcard" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Copy</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 3. Wi-Fi Card */}
                {scanResult.type === "wifi" && scanResult.wifi && (
                  <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300">
                          <Wifi className="w-4 h-4" />
                        </span>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">
                            {scanResult.wifi.ssid || "Hidden Network"}
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400">
                            Encryption: {scanResult.wifi.authType} {scanResult.wifi.hidden ? "(Hidden)" : ""}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300">
                        Wi-Fi Credentials
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-medium">Network Name (SSID):</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {scanResult.wifi.ssid}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 font-medium">Password:</span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {scanResult.wifi.password || "No password (Open)"}
                        </span>
                      </div>
                    </div>

                    {scanResult.wifi.password && (
                      <button
                        onClick={() => copyToClipboard(scanResult.wifi?.password || "", "wifipass")}
                        className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition shadow-xs"
                      >
                        {copiedField === "wifipass" ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedField === "wifipass" ? "Password Copied to Clipboard!" : "Copy Wi-Fi Password"}</span>
                      </button>
                    )}
                  </div>
                )}

                {/* 4. Calendar Event */}
                {scanResult.type === "event" && scanResult.event && (
                  <div className="p-4 rounded-2xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300">
                          <Calendar className="w-4 h-4" />
                        </span>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">
                            {scanResult.event.title}
                          </div>
                          {scanResult.event.location && (
                            <div className="text-[11px] text-slate-500">
                              {scanResult.event.location}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                        iCal Event
                      </span>
                    </div>

                    {scanResult.event.description && (
                      <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                        {scanResult.event.description}
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        onClick={downloadIcs}
                        className="flex-1 py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition shadow-xs"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Add to Calendar (.ics)</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 5. UPI / Payment */}
                {scanResult.type === "upi" && scanResult.upi && (
                  <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300">
                          <CreditCard className="w-4 h-4" />
                        </span>
                        <div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">
                            {scanResult.upi.pn || "UPI Merchant"}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500">
                            {scanResult.upi.pa}
                          </div>
                        </div>
                      </div>
                      {scanResult.upi.am && (
                        <span className="text-xs font-bold font-mono px-2 py-1 rounded-lg bg-amber-200/60 dark:bg-amber-900 text-amber-900 dark:text-amber-200">
                          ₹{scanResult.upi.am}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => copyToClipboard(scanResult.upi?.pa || "", "upi")}
                      className="w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition shadow-xs"
                    >
                      {copiedField === "upi" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy UPI Virtual Address (VPA)</span>
                    </button>
                  </div>
                )}

                {/* 6. Plain Text / JSON */}
                {(scanResult.type === "text" || scanResult.type === "json") && (
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                        <FileText className="w-3.5 h-3.5" />
                        <span>Decoded Text Data</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {scanResult.raw.length} characters
                      </span>
                    </div>

                    <pre className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 max-h-60 overflow-auto whitespace-pre-wrap break-all">
                      {scanResult.type === "json"
                        ? JSON.stringify(scanResult.jsonObj, null, 2)
                        : scanResult.raw}
                    </pre>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copyToClipboard(scanResult.raw, "rawtext")}
                        className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition shadow-xs"
                      >
                        {copiedField === "rawtext" ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>Copy Decoded Text</span>
                      </button>
                      <button
                        onClick={() => {
                          const blob = new Blob([scanResult.raw], { type: "text/plain;charset=utf-8" });
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement("a");
                          link.href = url;
                          link.download = `qr-data-${Date.now()}.txt`;
                          link.click();
                          URL.revokeObjectURL(url);
                        }}
                        className="py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold flex items-center space-x-1 transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Save .TXT</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Raw Payload View */}
            {scanResult && activeViewTab === "raw" && (
              <div className="space-y-3 animate-in fade-in duration-200">
                <textarea
                  readOnly
                  rows={8}
                  value={scanResult.raw}
                  className="w-full p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-mono text-xs text-slate-900 dark:text-white"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(scanResult.raw)}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition"
                  >
                    {copiedRaw ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedRaw ? "Copied Raw Data!" : "Copy Raw Payload"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Scan History Section */}
      {history && history.length > 0 && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Recent Scanned QR History ({history.length}/8)
              </span>
              <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                Stored in your browser
              </span>
            </div>
            <button
              onClick={() => setHistory([])}
              className="text-[11px] font-semibold text-rose-500 hover:text-rose-700 transition flex items-center space-x-1"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear History</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {history.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setScanResult(parseQrData(item.raw));
                  window.scrollTo({ top: 120, behavior: "smooth" });
                }}
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 hover:border-blue-500/50 cursor-pointer transition flex flex-col justify-between space-y-2 group"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                    <span className="uppercase font-semibold text-blue-600 dark:text-blue-400">
                      {item.type}
                    </span>
                    <span>
                      {new Date(item.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-slate-900 dark:text-white truncate group-hover:text-blue-600 transition">
                    {item.title}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400">
                  <span>Click to view details</span>
                  <ExternalLink className="w-3 h-3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useRef } from "react";
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
  Phone,
  MessageSquare,
  Palette,
  Layers,
  Share2,
} from "lucide-react";
import confetti from "canvas-confetti";

type QrTab = "url" | "text" | "wifi" | "email" | "whatsapp";
type PresetTheme = {
  id: string;
  name: string;
  fg: string;
  bg: string;
};

const COLOR_PRESETS: PresetTheme[] = [
  { id: "slate", name: "Classic Slate", fg: "#0f172a", bg: "#ffffff" },
  { id: "blue", name: "Royal Blue", fg: "#2563eb", bg: "#eff6ff" },
  { id: "indigo", name: "Deep Violet", fg: "#4f46e5", bg: "#eef2ff" },
  { id: "emerald", name: "Emerald Pro", fg: "#059669", bg: "#f0fdf4" },
  { id: "rose", name: "Sunset Rose", fg: "#e11d48", bg: "#fff1f2" },
  { id: "dark", name: "Cyber Neon", fg: "#38bdf8", bg: "#090d16" },
];

export default function QrCodeGenerator() {
  const [tab, setTab] = usePersistentState<QrTab>("qr_tab", "url");

  // Inputs
  const [url, setUrl] = usePersistentState<string>("qr_url", "https://everydaytools-s.web.app");
  const [text, setText] = usePersistentState<string>("qr_text", "EverydayTools — Fast, Private Utilities");

  // WiFi Fields
  const [wifiSsid, setWifiSsid] = usePersistentState<string>("qr_wifi_ssid", "Home_WiFi_5G");
  const [wifiPass, setWifiPass] = usePersistentState<string>("qr_wifi_pass", "SecurePassword@123");
  const [wifiType, setWifiType] = usePersistentState<string>("qr_wifi_type", "WPA");

  // Email Fields
  const [emailTo, setEmailTo] = usePersistentState<string>("qr_email_to", "contact@everydaytools.io");
  const [emailSubject, setEmailSubject] = usePersistentState<string>("qr_email_sub", "Inquiry");
  const [emailBody, setEmailBody] = usePersistentState<string>("qr_email_body", "Hello, I have a question regarding...");

  // WhatsApp
  const [waPhone, setWaPhone] = usePersistentState<string>("qr_wa_phone", "1234567890");
  const [waMsg, setWaMsg] = usePersistentState<string>("qr_wa_msg", "Hello! Reaching out via QR Code.");

  // Styling
  const [fgColor, setFgColor] = usePersistentState<string>("qr_fg", "#0f172a");
  const [bgColor, setBgColor] = usePersistentState<string>("qr_bg", "#ffffff");
  const [size, setSize] = usePersistentState<number>("qr_size", 320);
  const [level, setLevel] = usePersistentState<"L" | "M" | "Q" | "H">("qr_level", "H");
  const [frameBadge, setFrameBadge] = usePersistentState<boolean>("qr_frame_badge", true);
  const [centerIcon, setCenterIcon] = usePersistentState<string>("qr_center_icon", "none");

  const [copied, setCopied] = useState(false);
  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Compute standard payload string
  const getPayload = (): string => {
    switch (tab) {
      case "url":
        return url.startsWith("http://") || url.startsWith("https://")
          ? url
          : `https://${url}`;
      case "wifi":
        return `WIFI:S:${wifiSsid};T:${wifiType};P:${wifiPass};;`;
      case "email":
        return `mailto:${emailTo}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      case "whatsapp":
        const cleanPhone = waPhone.replace(/\D/g, "");
        return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMsg)}`;
      case "text":
      default:
        return text || "EverydayTools";
    }
  };

  const applyPreset = (preset: PresetTheme) => {
    setFgColor(preset.fg);
    setBgColor(preset.bg);
  };

  const handleDownloadPng = () => {
    const canvas = canvasContainerRef.current?.querySelector("canvas");
    if (!canvas) return;

    // Create high-res export canvas (1024x1024)
    const exportCanvas = document.createElement("canvas");
    const exportSize = 1024;
    exportCanvas.width = exportSize;
    exportCanvas.height = frameBadge ? exportSize + 140 : exportSize;
    const ctx = exportCanvas.getContext("2d");
    if (!ctx) return;

    // Background fill
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    if (frameBadge) {
      // Header Banner
      ctx.fillStyle = fgColor;
      ctx.fillRect(0, 0, exportCanvas.width, 100);
      ctx.fillStyle = bgColor;
      ctx.font = "bold 38px -apple-system, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("SCAN ME WITH PHONE CAMERA", exportCanvas.width / 2, 65);

      // Draw QR Canvas centered below banner
      ctx.drawImage(canvas, 100, 120, exportSize - 200, exportSize - 200);
    } else {
      ctx.drawImage(canvas, 0, 0, exportSize, exportSize);
    }

    const dataUrl = exportCanvas.toDataURL("image/png");
    downloadDataUrl(dataUrl, `custom-qrcode-${Date.now()}.png`);
    confetti({ particleCount: 45, spread: 60, origin: { y: 0.85 } });
  };

  const handleCopyImage = async () => {
    const canvas = canvasContainerRef.current?.querySelector("canvas");
    if (!canvas) return;
    canvas.toBlob(async (blob) => {
      if (blob) {
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ "image/png": blob }),
          ]);
          setCopied(true);
          confetti({ particleCount: 30, spread: 50, origin: { y: 0.85 } });
          setTimeout(() => setCopied(false), 2000);
        } catch (e) {
          console.error(e);
        }
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-1.5 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
        {[
          { id: "url", label: "Website URL", icon: Globe },
          { id: "wifi", label: "Wi-Fi Access", icon: Wifi },
          { id: "text", label: "Plain Text", icon: FileText },
          { id: "email", label: "Email", icon: Mail },
          { id: "whatsapp", label: "WhatsApp", icon: MessageSquare },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = tab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id as QrTab)}
              className={`flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition ${
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form Panel */}
        <div className="lg:col-span-7 space-y-5">
          {/* Dynamic Content Inputs */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center justify-between">
              <span>QR Content</span>
              <span className="text-[10px] text-slate-400 font-normal">Real-time update</span>
            </div>

            {tab === "url" && (
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Target Website URL
                </label>
                <div className="relative flex items-center">
                  <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {tab === "wifi" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                    Wi-Fi Network Name (SSID)
                  </label>
                  <input
                    type="text"
                    value={wifiSsid}
                    onChange={(e) => setWifiSsid(e.target.value)}
                    placeholder="Home_WiFi_Network"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Password
                    </label>
                    <input
                      type="text"
                      value={wifiPass}
                      onChange={(e) => setWifiPass(e.target.value)}
                      placeholder="WiFiPassword123"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                      Security
                    </label>
                    <select
                      value={wifiType}
                      onChange={(e) => setWifiType(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-white"
                    >
                      <option value="WPA">WPA / WPA2 (Standard)</option>
                      <option value="WEP">WEP</option>
                      <option value="nopass">None (Open Network)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {tab === "text" && (
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Message / Text Content
                </label>
                <textarea
                  rows={4}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Enter text, instructions, or notes to encode..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}

            {tab === "email" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Recipient Email
                  </label>
                  <input
                    type="email"
                    value={emailTo}
                    onChange={(e) => setEmailTo(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Email Subject"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium"
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
                    placeholder="Pre-filled email body..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium"
                  />
                </div>
              </div>
            )}

            {tab === "whatsapp" && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Phone Number (with Country Code)
                  </label>
                  <input
                    type="tel"
                    value={waPhone}
                    onChange={(e) => setWaPhone(e.target.value)}
                    placeholder="e.g. 14155552671"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium"
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
                    placeholder="Hi, reaching out via QR code..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Color & Aesthetic Presets */}
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center justify-between">
              <span>Color Themes & Styling</span>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {COLOR_PRESETS.map((p) => {
                const isSelected = fgColor === p.fg && bgColor === p.bg;
                return (
                  <button
                    key={p.id}
                    onClick={() => applyPreset(p)}
                    className={`p-2 rounded-xl border flex flex-col items-center space-y-1.5 transition ${
                      isSelected
                        ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/40"
                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-lg border border-black/10 shadow-xs flex items-center justify-center"
                      style={{ backgroundColor: p.bg }}
                    >
                      <div className="w-3 h-3 rounded-xs" style={{ backgroundColor: p.fg }} />
                    </div>
                    <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 truncate w-full text-center">
                      {p.name.split(" ")[0]}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom Color Pickers & Frame Options */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Dots Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-8 h-8 rounded-xl cursor-pointer border-0 bg-transparent"
                  />
                  <span className="text-xs font-mono font-semibold">{fgColor}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Background
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-8 h-8 rounded-xl cursor-pointer border-0 bg-transparent"
                  />
                  <span className="text-xs font-mono font-semibold">{bgColor}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  &quot;Scan Me&quot; Banner
                </label>
                <button
                  onClick={() => setFrameBadge(!frameBadge)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition ${
                    frameBadge
                      ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                      : "bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800"
                  }`}
                >
                  {frameBadge ? "Enabled (Pro)" : "Disabled"}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Live Preview & Download Panel */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col items-center justify-center space-y-5">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Live Interactive QR Card
            </div>

            {/* Visual Glassmorphic Frame Card */}
            <div
              ref={canvasContainerRef}
              className="p-5 rounded-3xl shadow-xl border flex flex-col items-center justify-center transition-all"
              style={{
                backgroundColor: bgColor,
                borderColor: fgColor + "33",
              }}
            >
              {frameBadge && (
                <div
                  className="px-4 py-1 rounded-full text-[11px] font-black tracking-wider uppercase mb-3 shadow-xs"
                  style={{
                    backgroundColor: fgColor,
                    color: bgColor,
                  }}
                >
                  📱 SCAN ME
                </div>
              )}

              <div className="p-2 rounded-2xl bg-white/50 backdrop-blur-xs flex items-center justify-center">
                <QRCodeCanvas
                  value={getPayload()}
                  size={size}
                  fgColor={fgColor}
                  bgColor={bgColor}
                  level={level}
                  includeMargin={false}
                />
              </div>

              <div
                className="mt-3 text-[10px] font-mono font-semibold tracking-wide opacity-75"
                style={{ color: fgColor }}
              >
                100% PRIVATE • CLIENT-SIDE
              </div>
            </div>

            {/* Quick Actions */}
            <div className="w-full space-y-2.5 pt-2">
              <button
                onClick={handleDownloadPng}
                className="w-full flex items-center justify-center space-x-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
              >
                <Download className="w-4 h-4" />
                <span>Download High-Res (1024 × 1024 PNG)</span>
              </button>

              <button
                onClick={handleCopyImage}
                className="w-full flex items-center justify-center space-x-2 px-5 py-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied to Clipboard!" : "Copy QR Image to Clipboard"}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

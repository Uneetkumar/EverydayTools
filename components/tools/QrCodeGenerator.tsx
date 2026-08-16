"use client";

import React, { useState, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Download, QrCode, Copy, Check, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";

export default function QrCodeGenerator() {
  const [text, setText] = useState<string>("https://everydaytools.io");
  const [fgColor, setFgColor] = useState<string>("#0f172a");
  const [bgColor, setBgColor] = useState<string>("#ffffff");
  const [size, setSize] = useState<number>(256);
  const [level, setLevel] = useState<"L" | "M" | "Q" | "H">("H");
  const [tab, setTab] = useState<"url" | "text" | "wifi">("url");

  // WiFi Fields
  const [wifiSsid, setWifiSsid] = useState("");
  const [wifiPass, setWifiPass] = useState("");
  const [wifiType, setWifiType] = useState("WPA");

  const canvasRef = useRef<HTMLDivElement>(null);

  const getPayload = () => {
    if (tab === "wifi") {
      return `WIFI:S:${wifiSsid};T:${wifiType};P:${wifiPass};;`;
    }
    return text || "https://everydaytools.io";
  };

  const handleDownload = () => {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = "qrcode.png";
    link.href = url;
    link.click();
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.85 } });
  };

  return (
    <div className="space-y-6">
      {/* Type Tabs */}
      <div className="flex space-x-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setTab("url")}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition ${
            tab === "url"
              ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400"
          }`}
        >
          Website URL
        </button>
        <button
          onClick={() => setTab("text")}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition ${
            tab === "text"
              ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400"
          }`}
        >
          Plain Text
        </button>
        <button
          onClick={() => setTab("wifi")}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition ${
            tab === "wifi"
              ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs"
              : "text-slate-600 dark:text-slate-400"
          }`}
        >
          Wi-Fi Network
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        {/* Left Inputs */}
        <div className="md:col-span-7 space-y-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          {tab === "wifi" ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Network Name (SSID)
                </label>
                <input
                  type="text"
                  placeholder="MyHomeWifi"
                  value={wifiSsid}
                  onChange={(e) => setWifiSsid(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Wi-Fi Password
                </label>
                <input
                  type="text"
                  placeholder="Password123"
                  value={wifiPass}
                  onChange={(e) => setWifiPass(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-white"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                {tab === "url" ? "Target URL" : "Message / Text Content"}
              </label>
              <textarea
                rows={4}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={tab === "url" ? "https://yourwebsite.com" : "Enter text here..."}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Color and size controls */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Foreground Color
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                />
                <span className="text-xs font-mono">{fgColor}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Background Color
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                />
                <span className="text-xs font-mono">{bgColor}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right QR Canvas Preview & Download */}
        <div className="md:col-span-5 flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4">
          <div
            ref={canvasRef}
            className="p-4 rounded-2xl bg-white shadow-md border border-slate-200"
          >
            <QRCodeCanvas
              value={getPayload()}
              size={size}
              fgColor={fgColor}
              bgColor={bgColor}
              level={level}
              includeMargin={true}
            />
          </div>

          <button
            onClick={handleDownload}
            className="w-full flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition"
          >
            <Download className="w-4 h-4" />
            <span>Download High-Res PNG</span>
          </button>
        </div>
      </div>
    </div>
  );
}

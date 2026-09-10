"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { BrowserMultiFormatReader, BarcodeFormat } from "@zxing/library";
import JsBarcode from "jsbarcode";
import { usePersistentState } from "@/lib/hooks/usePersistentState";
import { downloadDataUrl } from "@/lib/utils/download";
import {
  Barcode,
  Camera,
  Upload,
  Copy,
  Check,
  ExternalLink,
  Download,
  Trash2,
  RefreshCw,
  AlertCircle,
  Volume2,
  VolumeX,
  Layers,
  Sparkles,
  Search,
  CheckCircle2,
  Package,
} from "lucide-react";
import confetti from "canvas-confetti";

interface ScannedBarcode {
  id: string;
  text: string;
  format: string;
  timestamp: number;
}

export default function BarcodeScanner() {
  const [activeMode, setActiveMode] = useState<"camera" | "upload">("upload");
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
  const [soundEnabled, setSoundEnabled] = usePersistentState<boolean>("bc_scan_sound", true);
  const [batchMode, setBatchMode] = usePersistentState<boolean>("bc_batch_mode", false);

  // Results
  const [latestScan, setLatestScan] = useState<ScannedBarcode | null>(null);
  const [batchList, setBatchList] = useState<ScannedBarcode[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [copiedValue, setCopiedValue] = useState(false);

  // History
  const [history, setHistory] = usePersistentState<ScannedBarcode[]>("bc_scan_history", []);

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const codeReaderRef = useRef<BrowserMultiFormatReader | null>(null);
  const lastScannedTextRef = useRef<string>("");
  const lastScannedTimeRef = useRef<number>(0);

  // Beep sound
  const playBeep = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(1200, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.11);
    } catch {
      // Audio context may require prior user interaction
    }
  }, [soundEnabled]);

  // Handle successful decode
  const handleDecodeSuccess = useCallback(
    (text: string, formatName: string) => {
      const now = Date.now();
      // Debounce identical scans within 1.5s in batch/camera mode
      if (text === lastScannedTextRef.current && now - lastScannedTimeRef.current < 1500) {
        return;
      }
      lastScannedTextRef.current = text;
      lastScannedTimeRef.current = now;

      const newScan: ScannedBarcode = {
        id: String(now),
        text,
        format: formatName,
        timestamp: now,
      };

      setLatestScan(newScan);
      setBatchList((prev) => [newScan, ...prev]);
      setHistory((prev = []) => [newScan, ...prev.filter((p) => p.text !== newScan.text)].slice(0, 15));

      playBeep();
      confetti({ particleCount: 25, spread: 45, origin: { y: 0.85 } });
    },
    [playBeep, setHistory]
  );

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (codeReaderRef.current) {
      codeReaderRef.current.reset();
    }
    setCameraActive(false);
  }, []);

  // Start camera stream using ZXing
  const startCamera = useCallback(async () => {
    stopCamera();
    setCameraError(null);

    try {
      if (!codeReaderRef.current) {
        codeReaderRef.current = new BrowserMultiFormatReader();
      }

      setCameraActive(true);

      const deviceId = selectedDeviceId || null;
      await codeReaderRef.current.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result, err) => {
          if (result) {
            const rawText = result.getText();
            const formatEnum = result.getBarcodeFormat();
            const formatName = BarcodeFormat[formatEnum] || "BARCODE";
            handleDecodeSuccess(rawText, formatName);

            // If not in batch mode, automatically pause camera
            if (!batchMode) {
              stopCamera();
            }
          }
        }
      );
    } catch (err: unknown) {
      console.error("Camera scan error:", err);
      setCameraError("Unable to access camera. Please verify camera permissions in your browser.");
      setCameraActive(false);
    }
  }, [batchMode, handleDecodeSuccess, selectedDeviceId, stopCamera]);

  // Enumerate video devices
  useEffect(() => {
    if (navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices().then((devs) => {
        const videoDevs = devs.filter((d) => d.kind === "videoinput");
        setDevices(videoDevs);
        if (videoDevs.length > 0 && !selectedDeviceId) {
          const back = videoDevs.find((d) => d.label.toLowerCase().includes("back") || d.label.toLowerCase().includes("rear"));
          setSelectedDeviceId(back ? back.deviceId : videoDevs[0].deviceId);
        }
      });
    }
  }, [selectedDeviceId]);

  // Process image file
  const processImageFile = useCallback(
    async (file: File) => {
      if (!file) return;
      setIsProcessing(true);

      try {
        if (!codeReaderRef.current) {
          codeReaderRef.current = new BrowserMultiFormatReader();
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
          const src = e.target?.result as string;
          const img = new Image();
          img.onload = async () => {
            try {
              const result = await codeReaderRef.current!.decodeFromImageElement(img);
              if (result) {
                const rawText = result.getText();
                const formatEnum = result.getBarcodeFormat();
                const formatName = BarcodeFormat[formatEnum] || "BARCODE";
                handleDecodeSuccess(rawText, formatName);
              }
            } catch {
              alert("No recognizable barcode detected. Please ensure the barcode is sharp, level, and well-lit.");
            } finally {
              setIsProcessing(false);
            }
          };
          img.src = src;
        };
        reader.readAsDataURL(file);
      } catch (err) {
        console.error("Decode image file error:", err);
        setIsProcessing(false);
      }
    },
    [handleDecodeSuccess]
  );

  // Clipboard paste
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith("image/")) {
          const file = items[i].getAsFile();
          if (file) {
            processImageFile(file);
            setActiveMode("upload");
            break;
          }
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [processImageFile]);

  // Cleanup on unmount or tab switch
  useEffect(() => {
    if (activeMode !== "camera") {
      stopCamera();
    }
  }, [activeMode, stopCamera]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Copy value helper
  const copyValue = (val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedValue(true);
    setTimeout(() => setCopiedValue(false), 2000);
  };

  // Export Batch to CSV
  const exportBatchCsv = () => {
    if (batchList.length === 0) return;
    const header = "Timestamp,Format,Barcode Value\n";
    const rows = batchList
      .map((item) => `"${new Date(item.timestamp).toISOString()}","${item.format}","${item.text.replace(/"/g, '""')}"`)
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `scanned-barcodes-${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Quick Test Sample Barcodes
  const loadSample = (sampleVal: string, sampleFormat: string) => {
    const canvas = document.createElement("canvas");
    try {
      JsBarcode(canvas, sampleVal, {
        format: sampleFormat,
        width: 2,
        height: 80,
        displayValue: true,
      });

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], "sample-barcode.png", { type: "image/png" });
          processImageFile(file);
        }
      });
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header: Mode & Batch Switcher */}
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

        <div className="flex items-center justify-end px-2 space-x-3">
          <label className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={batchMode}
              onChange={(e) => setBatchMode(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
            />
            <span>Batch Scan Mode</span>
          </label>

          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`p-1.5 rounded-xl border text-xs font-medium flex items-center space-x-1 transition ${
              soundEnabled
                ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border-slate-200 dark:border-slate-700"
                : "text-slate-400 border-transparent hover:bg-slate-200 dark:hover:bg-slate-800"
            }`}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 @4xl:grid-cols-12 gap-6 items-start">
        {/* Left Column: Viewport */}
        <div className="@container @4xl:col-span-6 space-y-4">
          {/* Mode 1: File Upload */}
          {activeMode === "upload" && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
                  <Upload className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Upload Barcode Photo</span>
                </div>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                  Ctrl + V to Paste
                </span>
              </div>

              {/* Drop Target */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const file = e.dataTransfer.files[0];
                  if (file) processImageFile(file);
                }}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 rounded-3xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center min-h-[220px] bg-slate-50/50 dark:bg-slate-950/40 hover:bg-blue-50/30"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) processImageFile(file);
                  }}
                  className="hidden"
                />

                <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 shadow-xs">
                  <Barcode className="w-8 h-8" />
                </div>

                <div className="text-xs font-bold text-slate-900 dark:text-white mb-1">
                  Drop a barcode image here or click to browse
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mb-3">
                  Reads EAN-13, UPC-A, Code 128, Code 39, ITF, Codabar, and 2D codes.
                </div>

                <div className="px-3 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-xs">
                  {isProcessing ? "Processing Barcode..." : "Select Image File"}
                </div>
              </div>

              {/* Sample Barcodes Bar */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>Test Sample Barcodes:</span>
                  <Sparkles className="w-3 h-3 text-amber-500" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => loadSample("9780201379624", "EAN13")}
                    className="py-1.5 px-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:text-blue-600 text-[11px] font-semibold transition text-center truncate"
                  >
                    📦 EAN-13 Book
                  </button>
                  <button
                    onClick={() => loadSample("012345678905", "UPC")}
                    className="py-1.5 px-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:text-blue-600 text-[11px] font-semibold transition text-center truncate"
                  >
                    🏷️ UPC-A Retail
                  </button>
                  <button
                    onClick={() => loadSample("TB-SHIP-84920", "CODE128")}
                    className="py-1.5 px-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:text-blue-600 text-[11px] font-semibold transition text-center truncate"
                  >
                    🚚 Code 128 SKU
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Mode 2: Camera Viewfinder */}
          {activeMode === "camera" && (
            <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
                  <Camera className="w-3.5 h-3.5 text-rose-500" />
                  <span>Real-Time Barcode Scanner</span>
                </div>
                {cameraActive && (
                  <span className="flex items-center space-x-1.5 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Live</span>
                  </span>
                )}
              </div>

              {cameraError && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-start space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>{cameraError}</div>
                </div>
              )}

              <div className="relative w-full aspect-video max-h-[340px] mx-auto rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${cameraActive ? "block" : "hidden"}`}
                />

                {!cameraActive && (
                  <div className="flex flex-col items-center justify-center p-6 text-center space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center">
                      <Camera className="w-6 h-6" />
                    </div>
                    <div className="text-xs font-semibold text-slate-300">
                      Camera scanner paused
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
                    <div className="w-4/5 h-1/2 border-2 border-dashed border-rose-400/80 rounded-2xl relative">
                      <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_8px_#f43f5e] animate-[bounce_1.5s_infinite]" />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
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
                  {cameraActive ? (
                    <button
                      onClick={stopCamera}
                      className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold"
                    >
                      Pause
                    </button>
                  ) : (
                    <button
                      onClick={startCamera}
                      className="px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold"
                    >
                      Resume
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Scan Result Card & Batch List */}
        <div className="@container @4xl:col-span-6 space-y-4">
          <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center space-x-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Decoded Barcode Result</span>
              </div>
              {latestScan && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-bold">
                  {latestScan.format}
                </span>
              )}
            </div>

            {/* Empty State */}
            {!latestScan && (
              <div className="p-10 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center flex flex-col items-center justify-center space-y-3 min-h-[220px]">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                  <Barcode className="w-6 h-6" />
                </div>
                <div className="text-xs font-semibold text-slate-900 dark:text-white">
                  No Barcode scanned yet
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs">
                  Upload an image file, hold a barcode up to your camera, or click one of the test samples on the left.
                </div>
              </div>
            )}

            {/* Result Card */}
            {latestScan && (
              <div className="p-5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 space-y-4 animate-in fade-in duration-200">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wider">
                      Detected Format
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {latestScan.format}
                    </div>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400">
                    {new Date(latestScan.timestamp).toLocaleTimeString()}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="text-[10px] text-slate-400 uppercase font-semibold mb-1">
                    Barcode Data / Serial Number
                  </div>
                  <div className="font-mono text-lg font-extrabold text-slate-900 dark:text-white tracking-wider break-all">
                    {latestScan.text}
                  </div>
                </div>

                {/* Actions: Copy & Search Product */}
                <div className="grid grid-cols-1 @sm:grid-cols-2 gap-2">
                  <button
                    onClick={() => copyValue(latestScan.text)}
                    className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center space-x-1.5 transition shadow-xs"
                  >
                    {copiedValue ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedValue ? "Copied Barcode!" : "Copy Barcode Value"}</span>
                  </button>

                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(latestScan.text)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center space-x-1.5 transition"
                  >
                    <Search className="w-3.5 h-3.5 text-blue-500" />
                    <span>Search Product Info</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                </div>
              </div>
            )}

            {/* Batch List Section (if batch mode active or items present) */}
            {batchList.length > 0 && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Current Session Batch ({batchList.length})</span>
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={exportBatchCsv}
                      className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>Export CSV</span>
                    </button>
                    <button
                      onClick={() => setBatchList([])}
                      className="text-[11px] font-semibold text-rose-500 hover:underline flex items-center space-x-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Clear</span>
                    </button>
                  </div>
                </div>

                <div className="max-h-48 overflow-auto space-y-1.5 pr-1">
                  {batchList.map((item, idx) => (
                    <div
                      key={item.id + idx}
                      className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-semibold text-slate-700 dark:text-slate-300">
                          {item.format}
                        </span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white truncate">
                          {item.text}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400 shrink-0">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Persistent Scan History */}
      {history && history.length > 0 && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Recent Scanned Barcodes ({history.length}/15)
              </span>
              <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                Saved in your browser
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {history.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  setLatestScan(item);
                  window.scrollTo({ top: 120, behavior: "smooth" });
                }}
                className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 hover:border-blue-500/50 cursor-pointer transition flex items-center justify-between group"
              >
                <div>
                  <div className="text-[10px] font-mono text-slate-400 mb-0.5">
                    {item.format} •{" "}
                    {new Date(item.timestamp).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                  <div className="text-xs font-mono font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition truncate max-w-[200px]">
                    {item.text}
                  </div>
                </div>
                <div className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-500 group-hover:text-blue-600 transition">
                  <RefreshCw className="w-3.5 h-3.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

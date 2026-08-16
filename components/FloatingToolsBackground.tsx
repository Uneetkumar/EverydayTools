"use client";

import React, { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

interface FloatingNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  label: string;
  subLabel: string;
  color: string;
  pulsePhase: number;
}

const TOOL_SYMBOLS = [
  { label: "%", sub: "Percentage", color: "#3b82f6" },
  { label: "{ }", sub: "JSON", color: "#6366f1" },
  { label: "QR", sub: "Code", color: "#10b981" },
  { label: "PDF", sub: "Docs", color: "#f43f5e" },
  { label: "IMG", sub: "Compress", color: "#0ea5e9" },
  { label: "KEY", sub: "JWT", color: "#8b5cf6" },
  { label: "∑", sub: "Math", color: "#3b82f6" },
  { label: "🔒", sub: "Password", color: "#f59e0b" },
  { label: "DOC", sub: "Word", color: "#3b82f6" },
  { label: "24h", sub: "Time", color: "#a855f7" },
  { label: "#", sub: "UUID", color: "#06b6d4" },
  { label: "✂", sub: "Crop", color: "#ec4899" },
];

export default function FloatingToolsBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme, theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Initialize floating nodes with random positions and velocities
    const nodes: FloatingNode[] = TOOL_SYMBOLS.map((tool, idx) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.7,
      vy: (Math.random() - 0.5) * 0.7,
      size: 26,
      label: tool.label,
      subLabel: tool.sub,
      color: tool.color,
      pulsePhase: Math.random() * Math.PI * 2,
    }));

    // Mouse interaction coordinates
    let mouseX = -1000;
    let mouseY = -1000;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    window.addEventListener("mousemove", handleMouseMove);

    const render = () => {
      const isDark = resolvedTheme === "dark" || theme === "dark";
      ctx.clearRect(0, 0, width, height);

      // Draw connecting constellation lines
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 180) {
            const alpha = (1 - dist / 180) * (isDark ? 0.12 : 0.08);
            ctx.beginPath();
            ctx.moveTo(nodes[i].x, nodes[i].y);
            ctx.lineTo(nodes[j].x, nodes[j].y);
            ctx.strokeStyle = isDark ? `rgba(99, 102, 241, ${alpha})` : `rgba(59, 130, 246, ${alpha})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
      }

      // Update & Draw each floating tool badge
      nodes.forEach((node) => {
        // Move along velocity vector
        node.x += node.vx;
        node.y += node.vy;
        node.pulsePhase += 0.02;

        // Bounce off canvas boundaries
        if (node.x < 40 || node.x > width - 40) node.vx *= -1;
        if (node.y < 40 || node.y > height - 40) node.vy *= -1;

        // Gentle mouse avoidance
        const mdx = node.x - mouseX;
        const mdy = node.y - mouseY;
        const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mDist < 120 && mDist > 0) {
          const force = (120 - mDist) / 120;
          node.x += (mdx / mDist) * force * 1.5;
          node.y += (mdy / mDist) * force * 1.5;
        }

        const pillWidth = 84;
        const pillHeight = 32;
        const radius = 16;
        const pulse = Math.sin(node.pulsePhase) * 2;

        // Pill background
        ctx.save();
        ctx.translate(node.x, node.y);

        // Soft outer glow
        ctx.shadowColor = node.color;
        ctx.shadowBlur = isDark ? 10 : 6;

        ctx.beginPath();
        ctx.roundRect(-pillWidth / 2, -pillHeight / 2, pillWidth, pillHeight, radius);
        ctx.fillStyle = isDark ? "rgba(17, 24, 39, 0.75)" : "rgba(255, 255, 255, 0.85)";
        ctx.fill();

        // Border
        ctx.strokeStyle = isDark ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.08)";
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.shadowBlur = 0; // reset shadow for crisp text

        // Icon / Symbol
        ctx.font = "bold 12px monospace";
        ctx.fillStyle = node.color;
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(node.label, -pillWidth / 2 + 10, 0);

        // Subtitle text
        ctx.font = "bold 9px sans-serif";
        ctx.fillStyle = isDark ? "rgba(255, 255, 255, 0.6)" : "rgba(15, 23, 42, 0.6)";
        ctx.fillText(node.subLabel, -pillWidth / 2 + 34, 0);

        ctx.restore();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [resolvedTheme, theme]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {/* Dynamic Ambient Gradient Blobs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-transparent rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-gradient-to-tl from-emerald-500/10 via-sky-500/10 to-transparent rounded-full blur-3xl animate-pulse" />

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:28px_28px] opacity-30" />

      {/* Live Moving Floating Tools Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}

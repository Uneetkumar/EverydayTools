"use client";

import React, { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

export default function FloatingToolsBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { resolvedTheme, theme } = useTheme();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = 0;
    let height = 0;

    const handleResize = () => {
      if (!canvas || !ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      ctx.setTransform(1, 0, 0, 1, 0, 0); // reset transform
      ctx.scale(dpr, dpr);
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    // Subtle micro-particles restricted to the side margins (outer 25% on each side)
    const particleCount = 14;
    const particles = Array.from({ length: particleCount }).map((_, i) => {
      const isLeft = i % 2 === 0;
      return {
        x: isLeft ? Math.random() * (width * 0.2) : width - Math.random() * (width * 0.2),
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        radius: Math.random() * 2 + 1.5,
        isLeft,
      };
    });

    const render = () => {
      const isDark = resolvedTheme === "dark" || theme === "dark";
      ctx.clearRect(0, 0, width, height);

      // Draw faint constellation lines on the sides
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 140) {
            const alpha = (1 - dist / 140) * (isDark ? 0.08 : 0.05);
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = isDark ? `rgba(99, 102, 241, ${alpha})` : `rgba(59, 130, 246, ${alpha})`;
            ctx.lineWidth = 0.75;
            ctx.stroke();
          }
        }
      }

      // Draw subtle micro dots on the edges
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        // Keep particles within outer margins
        if (p.isLeft) {
          if (p.x < 10 || p.x > width * 0.25) p.vx *= -1;
        } else {
          if (p.x < width * 0.75 || p.x > width - 10) p.vx *= -1;
        }
        if (p.y < 10 || p.y > height - 10) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = isDark ? "rgba(99, 102, 241, 0.25)" : "rgba(59, 130, 246, 0.2)";
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
    };
  }, [resolvedTheme, theme]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {/* Soft Ambient Radial Gradient Blobs */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[400px] bg-gradient-to-tl from-emerald-500/5 via-sky-500/5 to-transparent rounded-full blur-3xl" />

      {/* Subtle Dot Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:32px_32px] opacity-20" />

      {/* Subtle edge particles canvas with DPR zoom scaling */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
}

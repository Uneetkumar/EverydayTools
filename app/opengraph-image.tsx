import { ImageResponse } from "next/og";
import { getAllTools } from "@/lib/tools/registry";

// Required with `output: export` — the image is rendered once at build time.
export const dynamic = "force-static";

export const alt =
  "TabBench - Free, fast and private online calculators and utilities";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)",
          color: "white",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 30,
            fontWeight: 600,
            color: "#93c5fd",
            marginBottom: 28,
          }}
        >
          tabbench
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 76,
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: "-0.03em",
            marginBottom: 28,
          }}
        >
          {getAllTools().length} free tools that run in your browser
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 32,
            color: "#cbd5e1",
            lineHeight: 1.4,
          }}
        >
          Calculators, PDF utilities, image converters and developer tools.
          No upload, no signup, no tracking.
        </div>
      </div>
    ),
    { ...size }
  );
}

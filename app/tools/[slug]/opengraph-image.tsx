import { ImageResponse } from "next/og";
import { getAllTools, getToolBySlug } from "@/lib/tools/registry";

// Required with `output: export` — one PNG is rendered per tool at build time.
export const dynamic = "force-static";

export const alt = "TabBench";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return getAllTools().map((tool) => ({ slug: tool.slug }));
}

export default async function ToolOpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tool = getToolBySlug(slug);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)",
          color: "white",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 28,
            fontWeight: 600,
            color: "#93c5fd",
          }}
        >
          tabbench {tool ? `· ${tool.categoryName}` : ""}
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              fontSize: 68,
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: "-0.03em",
              marginBottom: 24,
            }}
          >
            {tool ? tool.name : "Free Online Tools"}
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 30,
              color: "#cbd5e1",
              lineHeight: 1.4,
            }}
          >
            {tool ? tool.description : "Fast, free and private browser tools."}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            fontSize: 26,
            color: "#94a3b8",
          }}
        >
          Free · No signup · Runs entirely in your browser
        </div>
      </div>
    ),
    { ...size }
  );
}

import { renderBrandIcon } from "@/lib/seo/brand-icon";

export const dynamic = "force-static";
export const dynamicParams = false;

/**
 * PNG app icons for the web manifest (Android install, Chrome's app list)
 * and the Organization logo in the site JSON-LD.
 */
const ICONS = {
  "icon-192.png": { size: 192, variant: "rounded" },
  "icon-512.png": { size: 512, variant: "rounded" },
  "maskable-512.png": { size: 512, variant: "full-bleed" },
} as const;

export function generateStaticParams() {
  return Object.keys(ICONS).map((file) => ({ file }));
}

export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const icon = ICONS[(await params).file as keyof typeof ICONS];
  if (!icon) return new Response("Not found", { status: 404 });
  return renderBrandIcon(icon.size, icon.variant);
}

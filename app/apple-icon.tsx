import { renderBrandIcon } from "@/lib/seo/brand-icon";

// Rendered once at build time (`output: "export"`).
export const dynamic = "force-static";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** Home-screen icon for iOS, which does not accept SVG. Square: iOS rounds it. */
export default function AppleIcon() {
  return renderBrandIcon(180, "full-bleed");
}

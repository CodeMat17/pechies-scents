import { OG_ALT, OG_SIZE, renderOgImage } from "@/lib/og-image";

// Rendered per request so it always matches the hero set in the dashboard.
export const dynamic = "force-dynamic";
export const alt = OG_ALT;
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderOgImage();
}

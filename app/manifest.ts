import type { MetadataRoute } from "next";
import { SITE_NAME, TAGLINE } from "@/lib/store";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: "Pe’chies",
    description: `${TAGLINE} Premium oud, oil perfumes, body mists and body sprays in Nigeria.`,
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0c0c0f",
    theme_color: "#0c0c0f",
    categories: ["shopping", "lifestyle"],
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}

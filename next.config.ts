import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Cloudinary already serves optimised images (f_auto, q_auto, resized on upload),
    // so skip Next's optimiser — also required on Cloudflare Workers.
    unoptimized: true,
    remotePatterns: [
      { protocol: "https", hostname: "res.cloudinary.com" },
      // Test photos used by convex/seed.ts
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

import type { MetadataRoute } from "next";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { SITE_URL } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await fetchQuery(api.products.list);
  return [
    { url: SITE_URL, changeFrequency: "daily", priority: 1 },
    ...products.map((p) => ({
      url: `${SITE_URL}/product/${p.slug}`,
      lastModified: new Date(p._creationTime),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}

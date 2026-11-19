import { preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { SiteChrome } from "@/components/SiteChrome";
import { Storefront } from "@/components/Storefront";
import { storeJsonLd } from "@/lib/seo";

export default async function Home() {
  const [preloaded, preloadedHero] = await Promise.all([
    preloadQuery(api.products.list),
    preloadQuery(api.hero.get),
  ]);
  return (
    <SiteChrome>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(storeJsonLd).replace(/</g, "\\u003c") }}
      />
      <Storefront preloaded={preloaded} preloadedHero={preloadedHero} />
    </SiteChrome>
  );
}

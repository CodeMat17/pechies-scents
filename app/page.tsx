import { preloadQuery } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { SiteChrome } from "@/components/SiteChrome";
import { Storefront } from "@/components/Storefront";

export default async function Home() {
  const [preloaded, preloadedHero] = await Promise.all([
    preloadQuery(api.products.list),
    preloadQuery(api.hero.get),
  ]);
  return (
    <SiteChrome>
      <Storefront preloaded={preloaded} preloadedHero={preloadedHero} />
    </SiteChrome>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { fetchQuery, preloadQuery, preloadedQueryResult } from "convex/nextjs";
import { api } from "@/convex/_generated/api";
import { SiteChrome } from "@/components/SiteChrome";
import { ProductView } from "@/components/ProductView";
import { SITE_NAME, SITE_URL, categoryLabel, formatPrice } from "@/lib/store";

export async function generateMetadata({
  params,
}: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const p = await fetchQuery(api.products.getBySlug, { slug });
  if (!p) return { title: "Product not found" };
  const title = `${p.name} — ${categoryLabel(p.category)}`;
  const description = `${p.description} ${formatPrice(p.price)}. Order on WhatsApp from ${SITE_NAME}.`;
  return {
    title,
    description,
    alternates: { canonical: `/product/${p.slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/product/${p.slug}`,
      images: p.imageUrl ? [{ url: p.imageUrl, alt: p.name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: p.imageUrl ? [{ url: p.imageUrl, alt: p.name }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const preloaded = await preloadQuery(api.products.getBySlug, { slug });
  const p = preloadedQueryResult(preloaded);
  if (!p) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description,
    image: p.imageUrl,
    category: categoryLabel(p.category),
    brand: { "@type": "Brand", name: SITE_NAME },
    offers: {
      "@type": "Offer",
      priceCurrency: "NGN",
      price: p.price,
      availability: p.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      url: `${SITE_URL}/product/${p.slug}`,
    },
  };

  return (
    <SiteChrome variant="product">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <ProductView preloaded={preloaded} />
    </SiteChrome>
  );
}

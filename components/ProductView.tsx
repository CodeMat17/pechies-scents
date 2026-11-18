"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { usePreloadedQuery, useQuery, type Preloaded } from "convex/react";
import {
  CheckIcon,
  ChevronDownIcon,
  Share2Icon,
  ShieldCheckIcon,
  ShoppingBagIcon,
  TruckIcon,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import { useCart } from "./cart";
import { ProductImage } from "./ProductImage";
import { Rail } from "./ProductCard";
import { Stepper, WhatsAppIcon } from "./SiteChrome";
import { cn } from "@/lib/utils";
import {
  SITE_URL,
  categoryLabel,
  collectionLabel,
  formatPrice,
  genderLabel,
  productMessage,
  whatsappLink,
} from "@/lib/store";

export function ProductView({
  preloaded,
}: {
  preloaded: Preloaded<typeof api.products.getBySlug>;
}) {
  const product = usePreloadedQuery(preloaded); // live updates
  const all = useQuery(api.products.list);
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [shared, setShared] = useState(false);

  const related = useMemo(() => {
    if (!product || !all) return [];
    const others = all.filter((p) => p._id !== product._id && p.inStock);
    const score = (p: (typeof others)[number]) =>
      (p.category === product.category ? 2 : 0) +
      (p.gender === product.gender || p.gender === "unisex" ? 1 : 0) +
      p.tags.filter((t) => product.tags.includes(t)).length * 0.5;
    return [...others].sort((a, b) => score(b) - score(a)).slice(0, 8);
  }, [all, product]);

  if (!product) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col items-center px-5 py-32 text-center">
        <p className="font-serif text-3xl italic">This fragrance is no longer available.</p>
        <Link href="/#shop" className="btn-outline mt-8">Back to the collection</Link>
      </div>
    );
  }

  const notes = product.notes?.split(/\s*[·•,|]\s*/).filter(Boolean) ?? [];
  const order = whatsappLink(productMessage(product, qty));
  const notify = whatsappLink(
    `Hello Pe’chies Scents & Accessories, please let me know when “${product.name}” is back in stock.`,
  );

  const share = async () => {
    const url = `${SITE_URL}/product/${product.slug}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, text: `${product.name} — ${formatPrice(product.price)}`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setShared(true);
      setTimeout(() => setShared(false), 1800);
    } catch {}
  };

  return (
    <>
      <div className="mx-auto max-w-7xl md:px-6 md:pt-10">
        <nav className="mb-6 hidden text-[0.68rem] tracking-[0.2em] text-ivory/45 uppercase md:block">
          <Link href="/" className="hover:text-champagne">Home</Link>
          <span className="mx-2">/</span>
          <Link href={`/?category=${product.category}#shop`} className="hover:text-champagne">
            {categoryLabel(product.category)}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-ivory/70">{product.name}</span>
        </nav>

        <div className="grid md:grid-cols-2 md:gap-14 lg:gap-20">
          {/* Image */}
          <div className="md:sticky md:top-24 md:self-start">
            <div className="group relative aspect-4/5 overflow-hidden rounded-b-[28px] bg-graphite md:rounded-[32px] md:ring-1 md:ring-white/[0.06]">
              <ProductImage product={product} priority sizes="(max-width: 768px) 100vw, 50vw" />
              <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/40 to-transparent md:hidden" />
              <button
                onClick={share}
                aria-label="Share this fragrance"
                className="pressable absolute top-4 right-4 flex h-10 items-center gap-2 rounded-full bg-ink/60 px-3.5 text-xs font-semibold text-ivory backdrop-blur-md hover:bg-ink/80"
              >
                {shared ? <CheckIcon className="size-4 text-champagne" /> : <Share2Icon className="size-4" />}
                {shared ? "Link copied" : "Share"}
              </button>
              {!product.inStock && (
                <span className="absolute top-4 left-4 rounded-full bg-ink/80 px-3 py-1.5 text-[0.6rem] font-bold tracking-[0.2em] text-ivory/80 uppercase backdrop-blur-md">
                  Sold out
                </span>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="px-5 pt-6 md:px-0 md:pt-4">
            <p className="eyebrow">
              {categoryLabel(product.category)} · For {genderLabel(product.gender)}
            </p>
            <h1 className="mt-3 font-serif text-[2.6rem] leading-[1] font-medium md:text-6xl">{product.name}</h1>

            <div className="mt-4 flex items-center gap-3">
              <p className="text-2xl font-semibold text-champagne tabular-nums">{formatPrice(product.price)}</p>
              <span
                className={cn(
                  "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.68rem] font-semibold",
                  product.inStock ? "bg-emerald-400/10 text-emerald-300" : "bg-white/[0.06] text-ivory/55",
                )}
              >
                <span className={cn("size-1.5 rounded-full", product.inStock ? "bg-emerald-300" : "bg-ivory/40")} />
                {product.inStock ? "In stock" : "Out of stock"}
              </span>
            </div>

            {notes.length > 0 && (
              <div className="mt-7">
                <p className="eyebrow text-ivory/50">Scent notes</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {notes.map((n) => (
                    <span
                      key={n}
                      className="rounded-full border border-champagne/25 bg-champagne/[0.06] px-3.5 py-1.5 font-serif text-[1.05rem] text-ivory/90 italic"
                    >
                      {n}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <p className="mt-7 text-[0.95rem] leading-relaxed text-ivory/70">{product.description}</p>

            {product.tags.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-x-4 gap-y-1">
                {product.tags.map((t) => (
                  <Link
                    key={t}
                    href={`/?collection=${t}#shop`}
                    className="text-[0.62rem] font-semibold tracking-[0.2em] text-bronze uppercase hover:text-champagne"
                  >
                    {collectionLabel(t)}
                  </Link>
                ))}
              </div>
            )}

            {/* Desktop purchase block */}
            <div className="mt-9 hidden space-y-3 md:block">
              {product.inStock ? (
                <>
                  <div className="flex items-center gap-4 pb-2">
                    <span className="text-sm text-ivory/60">Quantity</span>
                    <Stepper value={qty} onChange={(n) => setQty(Math.max(1, n))} label={product.name} />
                    {qty > 1 && (
                      <span className="text-sm text-ivory/50 tabular-nums">= {formatPrice(product.price * qty)}</span>
                    )}
                  </div>
                  <a href={order} target="_blank" rel="noopener noreferrer" className="btn-gold w-full">
                    <WhatsAppIcon /> Order now on WhatsApp
                  </a>
                  <button onClick={() => add(product._id, qty)} className="btn-outline w-full">
                    <ShoppingBagIcon className="size-4" /> Add to bag
                  </button>
                </>
              ) : (
                <a href={notify} target="_blank" rel="noopener noreferrer" className="btn-outline w-full">
                  <WhatsAppIcon /> Notify me when it’s back
                </a>
              )}
            </div>

            {/* Mobile quantity */}
            {product.inStock && (
              <div className="mt-8 flex items-center justify-between rounded-2xl border border-white/[0.07] bg-white/[0.02] py-2 pr-2 pl-4 md:hidden">
                <span>
                  <span className="block text-sm">Quantity</span>
                  <span className="block text-xs text-ivory/45 tabular-nums">
                    Total {formatPrice(product.price * qty)}
                  </span>
                </span>
                <Stepper value={qty} onChange={(n) => setQty(Math.max(1, n))} label={product.name} />
              </div>
            )}

            <div className="mt-8 grid grid-cols-2 gap-3">
              <Perk icon={<TruckIcon className="size-4" />} title="Nationwide delivery" text="Anywhere in Nigeria" />
              <Perk icon={<ShieldCheckIcon className="size-4" />} title="Authentic" text="Carefully selected" />
            </div>

            <div className="mt-6 divide-y divide-white/[0.06] border-y border-white/[0.06]">
              <Details title="How ordering works">
                Tap <strong className="text-ivory">Order on WhatsApp</strong> and your order message is written for
                you. Just send it — we’ll confirm availability, payment and delivery personally. No account needed.
              </Details>
              <Details title="Delivery & payment">
                We deliver across Nigeria. Delivery fees and timelines depend on your location and are confirmed with
                you on WhatsApp before you pay.
              </Details>
            </div>
          </div>
        </div>
      </div>

      <Rail eyebrow="Curated for you" title={<>You may also <em className="text-champagne">love</em></>} products={related} />

      {/* Mobile sticky purchase bar */}
      <div className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.07] bg-ink/85 backdrop-blur-xl backdrop-saturate-150 md:hidden">
        <div className="flex items-center gap-2.5 px-4 py-3">
          {product.inStock ? (
            <>
              <button
                onClick={() => add(product._id, qty)}
                aria-label={`Add ${qty} to bag`}
                className="pressable flex size-[3.25rem] shrink-0 items-center justify-center rounded-full border border-champagne/40 bg-white/[0.03] text-ivory"
              >
                <ShoppingBagIcon className="size-5" strokeWidth={1.7} />
              </button>
              <a href={order} target="_blank" rel="noopener noreferrer" className="btn-gold flex-1 px-4">
                <WhatsAppIcon /> Order · {formatPrice(product.price * qty)}
              </a>
            </>
          ) : (
            <a href={notify} target="_blank" rel="noopener noreferrer" className="btn-outline flex-1">
              <WhatsAppIcon /> Notify me when it’s back
            </a>
          )}
        </div>
      </div>
    </>
  );
}

function Perk({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-champagne/10 text-champagne">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[0.78rem] leading-tight font-semibold">{title}</span>
        <span className="block text-[0.7rem] text-ivory/45">{text}</span>
      </span>
    </div>
  );
}

function Details({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="group py-1">
      <summary className="flex cursor-pointer list-none items-center justify-between py-3.5 text-sm font-semibold [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDownIcon className="size-4 text-champagne transition-transform duration-300 group-open:rotate-180" />
      </summary>
      <p className="pb-4 text-sm leading-relaxed text-ivory/60">{children}</p>
    </details>
  );
}

"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, PlusIcon } from "lucide-react";
import { useCart } from "./cart";
import { ProductImage } from "./ProductImage";
import { cn } from "@/lib/utils";
import { categoryLabel, formatPrice, type Product } from "@/lib/store";

function badgeFor(p: Product) {
  if (!p.inStock) return null;
  if (p.tags.includes("new")) return "New";
  if (p.tags.includes("bestseller")) return "Bestseller";
  if (p.tags.includes("gift")) return "Gift";
  return null;
}

export function ProductCard({
  product,
  priority,
  sizes = "(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw",
}: {
  product: Product;
  priority?: boolean;
  sizes?: string;
}) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  const badge = badgeFor(product);
  const href = `/product/${product.slug}`;

  useEffect(() => {
    if (!added) return;
    const t = setTimeout(() => setAdded(false), 1400);
    return () => clearTimeout(t);
  }, [added]);

  return (
    <article className="group flex flex-col">
      <div className="relative">
        <Link
          href={href}
          className="relative block aspect-4/5 overflow-hidden rounded-2xl bg-graphite ring-1 ring-white/[0.05] transition-transform duration-300 active:scale-[0.98]"
        >
          <ProductImage product={product} priority={priority} sizes={sizes} />
          <span className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/45 to-transparent" />
          {badge && (
            <span className="absolute top-2.5 left-2.5 rounded-full bg-ink/70 px-2.5 py-1 text-[0.56rem] font-bold tracking-[0.18em] text-champagne uppercase backdrop-blur-md">
              {badge}
            </span>
          )}
          {!product.inStock && (
            <span className="absolute inset-0 flex items-end justify-center bg-ink/45 pb-4">
              <span className="rounded-full bg-ink/85 px-3 py-1.5 text-[0.58rem] font-bold tracking-[0.2em] text-ivory/75 uppercase">
                Sold out
              </span>
            </span>
          )}
        </Link>
        {product.inStock && (
          <button
            onClick={() => {
              add(product._id);
              setAdded(true);
            }}
            aria-label={`Add ${product.name} to bag`}
            className={cn(
              "pressable absolute right-2.5 bottom-2.5 flex size-10 items-center justify-center rounded-full shadow-lg shadow-black/40 backdrop-blur-md transition-colors",
              added ? "bg-champagne text-ink" : "bg-ivory/90 text-ink hover:bg-champagne",
            )}
          >
            {added ? <CheckIcon className="size-[18px]" strokeWidth={2.4} /> : <PlusIcon className="size-[18px]" strokeWidth={2.2} />}
          </button>
        )}
      </div>

      <Link href={href} className="mt-3 flex flex-1 flex-col px-0.5">
        <span className="text-[0.58rem] font-semibold tracking-[0.22em] text-bronze uppercase">
          {categoryLabel(product.category)}
        </span>
        <span className="mt-1 line-clamp-2 font-serif text-[1.15rem] leading-[1.15] font-medium transition-colors group-hover:text-champagne md:text-xl">
          {product.name}
        </span>
        {product.notes && (
          <span className="mt-1 line-clamp-1 text-[0.72rem] text-ivory/45">{product.notes}</span>
        )}
        <span className="mt-auto pt-2 text-sm font-semibold text-champagne tabular-nums">
          {formatPrice(product.price)}
        </span>
      </Link>
    </article>
  );
}

/** Horizontally swipeable product rail with snap points (arrow buttons on desktop). */
export function Rail({
  eyebrow,
  title,
  action,
  products,
}: {
  eyebrow: string;
  title: ReactNode;
  action?: ReactNode;
  products: Product[];
}) {
  const track = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });

  const update = () => {
    const el = track.current;
    if (!el) return;
    setEdges({
      start: el.scrollLeft < 8,
      end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 8,
    });
  };
  useEffect(update, [products.length]);

  const scrollBy = (dir: 1 | -1) =>
    track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.85, behavior: "smooth" });

  if (products.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl pt-14 md:px-6 md:pt-20">
      <div className="flex items-end justify-between gap-4 px-5 md:px-0">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="mt-1.5 font-serif text-[2rem] leading-none font-medium md:text-5xl">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          {action}
          <div className="hidden gap-2 md:flex">
            <button
              onClick={() => scrollBy(-1)}
              disabled={edges.start}
              aria-label="Scroll left"
              className="pressable flex size-10 items-center justify-center rounded-full border border-white/10 text-ivory/80 hover:border-champagne hover:text-champagne disabled:opacity-25"
            >
              <ChevronLeftIcon className="size-5" />
            </button>
            <button
              onClick={() => scrollBy(1)}
              disabled={edges.end}
              aria-label="Scroll right"
              className="pressable flex size-10 items-center justify-center rounded-full border border-white/10 text-ivory/80 hover:border-champagne hover:text-champagne disabled:opacity-25"
            >
              <ChevronRightIcon className="size-5" />
            </button>
          </div>
        </div>
      </div>
      <div
        ref={track}
        onScroll={update}
        className="no-scrollbar mt-6 flex snap-x snap-mandatory scroll-px-5 gap-3 overflow-x-auto px-5 pb-2 md:scroll-px-0 md:gap-5 md:px-0"
      >
        {products.map((p) => (
          <div key={p._id} className="w-[44vw] max-w-60 shrink-0 snap-start md:w-[calc((100%-3*1.25rem)/4)] md:max-w-none">
            <ProductCard product={p} sizes="(max-width: 768px) 44vw, 25vw" />
          </div>
        ))}
      </div>
    </section>
  );
}

"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { usePreloadedQuery, type Preloaded } from "convex/react";
import {
  ArrowRightIcon,
  GiftIcon,
  SearchIcon,
  ShieldCheckIcon,
  SlidersHorizontalIcon,
  SparklesIcon,
  TruckIcon,
  XIcon,
} from "lucide-react";
import type { api } from "@/convex/_generated/api";
import type { Doc } from "@/convex/_generated/dataModel";
import { ProductCard, Rail } from "./ProductCard";
import { ProductImage } from "./ProductImage";
import { SEARCH_EVENT, WhatsAppIcon } from "./SiteChrome";
import { Sheet } from "./ui/sheet";
import { cn } from "@/lib/utils";
import {
  CATEGORIES,
  COLLECTIONS,
  GENDERS,
  TAGLINE,
  categoryLabel,
  collectionLabel,
  genderLabel,
  whatsappLink,
  type Product,
} from "@/lib/store";

const SORTS = [
  { value: "featured", label: "Featured" },
  { value: "low", label: "Price: low to high" },
  { value: "high", label: "Price: high to low" },
] as const;

type Filters = { category: string; gender: string; collection: string; sort: string };
const DEFAULTS: Filters = { category: "all", gender: "all", collection: "all", sort: "featured" };

export function Storefront({
  preloaded,
  preloadedHero,
}: {
  preloaded: Preloaded<typeof api.products.list>;
  preloadedHero: Preloaded<typeof api.hero.get>;
}) {
  // Live: re-renders automatically whenever products / hero change in Convex
  const products = usePreloadedQuery(preloaded);
  const hero = usePreloadedQuery(preloadedHero);

  // Filters live in the URL so they survive "back" from a product page and can be shared.
  const params = useSearchParams();
  const pathname = usePathname();
  const filters: Filters = {
    category: params.get("category") ?? DEFAULTS.category,
    gender: params.get("for") ?? DEFAULTS.gender,
    collection: params.get("collection") ?? DEFAULTS.collection,
    sort: params.get("sort") ?? DEFAULTS.sort,
  };
  const { category, gender, collection, sort } = filters;

  const [search, setSearch] = useState(() => params.get("q") ?? "");
  const [sheetOpen, setSheetOpen] = useState(false);
  const searchInput = useRef<HTMLInputElement>(null);
  const shopRef = useRef<HTMLElement>(null);

  const writeUrl = useCallback(
    (patch: Partial<Filters> & { q?: string }) => {
      const next = new URLSearchParams(window.location.search);
      const keys: Record<string, string> = { category: "category", gender: "for", collection: "collection", sort: "sort", q: "q" };
      for (const [k, v] of Object.entries(patch)) {
        const key = keys[k];
        if (!v || v === "all" || (k === "sort" && v === "featured")) next.delete(key);
        else next.set(key, v);
      }
      const qs = next.toString();
      window.history.replaceState(null, "", `${pathname}${qs ? `?${qs}` : ""}${window.location.hash}`);
    },
    [pathname],
  );

  const set = (patch: Partial<Filters>) => writeUrl(patch);
  const onSearch = (v: string) => {
    setSearch(v);
    writeUrl({ q: v.trim() });
  };

  const scrollToShop = () => shopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const jumpTo = (patch: Partial<Filters>) => {
    setSearch("");
    writeUrl({ ...DEFAULTS, q: "", ...patch });
    requestAnimationFrame(scrollToShop);
  };

  const resetAll = () => {
    setSearch("");
    writeUrl({ ...DEFAULTS, q: "" });
  };

  // Header / tab-bar search buttons
  useEffect(() => {
    const focus = () => {
      searchInput.current?.focus({ preventScroll: true });
      scrollToShop();
    };
    window.addEventListener(SEARCH_EVENT, focus);
    if (window.location.hash === "#search") focus();
    return () => window.removeEventListener(SEARCH_EVENT, focus);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = products.filter(
      (p) =>
        (category === "all" || p.category === category) &&
        (gender === "all" || p.gender === gender) &&
        (collection === "all" || p.tags.includes(collection)) &&
        (!q ||
          `${p.name} ${p.notes ?? ""} ${categoryLabel(p.category)} ${p.description}`
            .toLowerCase()
            .includes(q)),
    );
    if (sort === "low") return [...list].sort((a, b) => a.price - b.price);
    if (sort === "high") return [...list].sort((a, b) => b.price - a.price);
    return list;
  }, [products, category, gender, collection, sort, search]);

  const featured = useMemo(
    () =>
      products.find((p) => p.inStock && p.imageUrl && p.tags.includes("luxury") && p.tags.includes("bestseller")) ??
      products.find((p) => p.inStock && p.imageUrl && p.tags.includes("bestseller")) ??
      products.find((p) => p.inStock && p.imageUrl) ??
      products[0],
    [products],
  );
  const bestsellers = products.filter((p) => p.inStock && p.tags.includes("bestseller"));
  const newIn = products.filter((p) => p.inStock && p.tags.includes("new"));

  const activeChips = [
    category !== "all" && { key: "category" as const, label: categoryLabel(category) },
    gender !== "all" && { key: "gender" as const, label: `For ${genderLabel(gender)}` },
    collection !== "all" && { key: "collection" as const, label: collectionLabel(collection) },
    sort !== "featured" && { key: "sort" as const, label: SORTS.find((s) => s.value === sort)?.label ?? sort },
  ].filter(Boolean) as { key: keyof Filters; label: string }[];
  const sheetFilterCount = [gender, collection, sort].filter((v) => v !== "all" && v !== "featured").length;

  const heading =
    collection !== "all" && category === "all"
      ? collectionLabel(collection)
      : category !== "all"
        ? categoryLabel(category)
        : "All Fragrances";

  return (
    <>
      <Hero hero={hero} featured={featured} onBestsellers={() => jumpTo({ collection: "bestseller" })} />

      <TrustStrip />

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-5 pt-14 md:px-6 md:pt-20">
        <p className="eyebrow">Shop by category</p>
        <h2 className="mt-1.5 font-serif text-[2rem] leading-none font-medium md:text-5xl">
          Find your <em className="text-champagne">signature</em>
        </h2>
        <div className="mt-6 grid grid-cols-2 gap-3 md:mt-8 md:grid-cols-4 md:gap-5">
          {CATEGORIES.map((c, i) => {
            const items = products.filter((p) => p.category === c.value);
            const cover = items.find((p) => p.imageUrl) ?? items[0];
            return (
              <button
                key={c.value}
                onClick={() => jumpTo({ category: c.value })}
                className="group pressable relative aspect-square overflow-hidden rounded-2xl bg-graphite text-left ring-1 ring-white/[0.05] md:aspect-4/5"
              >
                {cover ? (
                  <ProductImage product={cover} sizes="(max-width: 768px) 50vw, 25vw" />
                ) : (
                  <span className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#2f2a26,#101014)]" />
                )}
                <span className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/5" />
                <span className="absolute top-3 left-3 text-[0.6rem] font-semibold tracking-[0.25em] text-ivory/60">
                  0{i + 1}
                </span>
                <span className="absolute inset-x-3 bottom-3 md:inset-x-5 md:bottom-5">
                  <span className="block font-serif text-[1.4rem] leading-tight text-ivory md:text-3xl">{c.label}</span>
                  <span className="mt-0.5 flex items-center gap-1 text-[0.68rem] text-ivory/60">
                    {items.length} {items.length === 1 ? "scent" : "scents"}
                    <ArrowRightIcon className="size-3 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <Rail
        eyebrow="Most loved"
        title="Bestsellers"
        products={bestsellers}
        action={<SeeAll onClick={() => jumpTo({ collection: "bestseller" })} />}
      />
      <Rail
        eyebrow="Just landed"
        title={<>New <em className="text-champagne">arrivals</em></>}
        products={newIn}
        action={<SeeAll onClick={() => jumpTo({ collection: "new" })} />}
      />

      {/* Shop */}
      <section id="shop" ref={shopRef} className="mx-auto max-w-7xl scroll-mt-[calc(3.5rem+env(safe-area-inset-top))] pt-14 md:scroll-mt-16 md:px-6 md:pt-24">
        <div id="search" className="px-5 md:px-0">
          <p className="eyebrow">The collection</p>
          <h2 className="mt-1.5 font-serif text-[2.4rem] leading-none font-medium md:text-6xl">{heading}</h2>
        </div>

        {/* Sticky toolbar */}
        <div className="sticky top-[calc(3.5rem+env(safe-area-inset-top))] z-30 mt-5 border-b border-white/[0.06] bg-ink/85 backdrop-blur-xl backdrop-saturate-150 md:top-16 md:mt-8 md:rounded-b-2xl md:border-x md:px-4">
          <div className="flex items-center gap-2 px-5 pt-3 md:px-0">
            <label className="relative flex-1">
              <span className="sr-only">Search fragrances</span>
              <SearchIcon className="pointer-events-none absolute top-1/2 left-4 size-[18px] -translate-y-1/2 text-ivory/40" strokeWidth={1.8} />
              <input
                ref={searchInput}
                type="search"
                inputMode="search"
                enterKeyHint="search"
                autoComplete="off"
                value={search}
                onChange={(e) => onSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                placeholder="Search scents, notes…"
                className="field rounded-full py-2.5 pr-10 pl-11 [&::-webkit-search-cancel-button]:hidden"
              />
              {search && (
                <button
                  onClick={() => {
                    onSearch("");
                    searchInput.current?.focus();
                  }}
                  aria-label="Clear search"
                  className="absolute top-1/2 right-2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full text-ivory/50 hover:text-ivory"
                >
                  <XIcon className="size-4" />
                </button>
              )}
            </label>
            <button
              onClick={() => setSheetOpen(true)}
              className="pressable relative flex h-[2.875rem] shrink-0 items-center gap-2 rounded-full border border-graphite bg-onyx px-4 text-xs font-semibold tracking-[0.12em] uppercase hover:border-champagne/50"
              aria-label={`Filter and sort${sheetFilterCount ? ` (${sheetFilterCount} active)` : ""}`}
            >
              <SlidersHorizontalIcon className="size-4 text-champagne" strokeWidth={1.8} />
              <span className="hidden sm:inline">Filter</span>
              {sheetFilterCount > 0 && (
                <span className="flex size-5 items-center justify-center rounded-full bg-champagne text-[0.62rem] font-bold text-ink">
                  {sheetFilterCount}
                </span>
              )}
            </button>
          </div>

          <div className="no-scrollbar flex gap-2 overflow-x-auto px-5 py-3 md:px-0">
            {[{ value: "all", label: "All" }, ...CATEGORIES].map((c) => (
              <Pill key={c.value} active={category === c.value} onClick={() => set({ category: c.value })}>
                {c.label}
              </Pill>
            ))}
          </div>
        </div>

        <div className="flex min-h-9 flex-wrap items-center gap-2 px-5 pt-4 md:px-0">
          <p className="mr-1 text-xs text-ivory/45">
            {filtered.length} {filtered.length === 1 ? "fragrance" : "fragrances"}
          </p>
          {activeChips
            .filter((c) => c.key !== "category")
            .map((c) => (
              <button
                key={c.key}
                onClick={() => set({ [c.key]: DEFAULTS[c.key] })}
                className="pressable flex items-center gap-1 rounded-full bg-champagne/12 py-1 pr-2 pl-3 text-[0.7rem] text-champagne"
              >
                {c.label}
                <XIcon className="size-3.5" />
              </button>
            ))}
          {(activeChips.length > 0 || search) && (
            <button onClick={resetAll} className="text-[0.7rem] text-ivory/50 underline underline-offset-4 hover:text-ivory">
              Clear all
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-20 text-center">
            <span className="flex size-16 items-center justify-center rounded-full border border-champagne/25 bg-champagne/[0.06]">
              <SearchIcon className="size-6 text-champagne" strokeWidth={1.4} />
            </span>
            <p className="mt-5 font-serif text-2xl italic">No fragrances match</p>
            <p className="mt-2 max-w-xs text-sm text-ivory/55">
              Try another note or category — or tell us what you love and we’ll recommend something.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button onClick={resetAll} className="btn-outline">Clear filters</button>
              <a
                href={whatsappLink(`Hello Pe’chies Scents & Accessories, I’m looking for a fragrance${search ? ` like “${search}”` : ""}. Can you recommend one?`)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ghost"
              >
                <WhatsAppIcon /> Ask for a recommendation
              </a>
            </div>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-8 px-5 sm:grid-cols-3 md:gap-x-5 md:gap-y-12 md:px-0 lg:grid-cols-4">
            {filtered.map((p, i) => (
              <ProductCard key={p._id} product={p} priority={i < 2} />
            ))}
          </div>
        )}
      </section>

      <HowToOrder />

      <FilterSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        filters={filters}
        set={set}
        reset={() => set({ gender: "all", collection: "all", sort: "featured", category: "all" })}
        count={filtered.length}
      />
    </>
  );
}

function SeeAll({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="pressable flex items-center gap-1 rounded-full px-1 py-2 text-[0.7rem] font-semibold tracking-[0.15em] text-champagne uppercase hover:text-ivory"
    >
      See all <ArrowRightIcon className="size-3.5" />
    </button>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "pressable shrink-0 rounded-full border px-4 py-2 text-[0.72rem] font-semibold tracking-[0.06em] whitespace-nowrap",
        active
          ? "border-champagne bg-champagne text-ink"
          : "border-white/[0.09] bg-white/[0.03] text-ivory/75 hover:border-champagne/50 hover:text-ivory",
      )}
    >
      {children}
    </button>
  );
}

function Hero({
  hero,
  featured,
  onBestsellers,
}: {
  hero: Doc<"hero"> | null;
  featured?: Product;
  onBestsellers: () => void;
}) {
  const [first, second] = TAGLINE.split(". ");
  // Dashboard-set card wins; until a hero image is uploaded, fall back to the auto-picked product.
  const card = hero?.imageUrl
    ? { imageUrl: hero.imageUrl, label: hero.label, title: hero.title, subtitle: hero.subtitle }
    : featured
      ? { imageUrl: featured.imageUrl, label: hero?.label || "Signature pick", title: featured.name, subtitle: featured.notes }
      : null;
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[36rem] w-[52rem] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(201,168,120,0.22),transparent)] md:left-[70%]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="relative mx-auto grid max-w-7xl gap-10 px-5 pt-8 pb-12 md:grid-cols-[1.1fr_0.9fr] md:items-center md:gap-16 md:px-6 md:pt-10 md:pb-14">
        <div>
          <p className="eyebrow animate-rise">Fragrance House · Nigeria</p>
          <h1 className="mt-4 animate-rise font-serif text-[3.3rem] leading-[0.95] font-medium tracking-[-0.01em] [animation-delay:80ms] sm:text-7xl md:mt-6 md:text-[5.5rem]">
            {first}.
            <br />
            <em className="bg-gradient-to-r from-gold-light via-champagne to-bronze bg-clip-text text-transparent">
              {second}
            </em>
          </h1>
          <p className="mt-5 max-w-md animate-rise text-[0.95rem] leading-relaxed text-ivory/65 [animation-delay:160ms] md:mt-7 md:text-base">
            Oud, oil perfumes, body mists and sprays — carefully chosen for every personality and
            occasion. Pick your scent, order in seconds on WhatsApp.
          </p>
          <div className="mt-8 flex animate-rise flex-col gap-3 [animation-delay:240ms] sm:flex-row">
            <a href="#shop" className="btn-gold">
              Shop the collection <ArrowRightIcon className="size-4" />
            </a>
            <button onClick={onBestsellers} className="btn-outline">
              <SparklesIcon className="size-4 text-champagne" /> Bestsellers
            </button>
          </div>
        </div>

        {card && (
          <div className="group relative animate-rise overflow-hidden rounded-[28px] bg-graphite ring-1 ring-white/[0.07] [animation-delay:320ms] md:rounded-[36px]">
            <div className="relative aspect-[4/3.6] md:aspect-auto md:h-[clamp(22rem,calc(100svh-10rem),40rem)]">
              {card.imageUrl ? (
                <Image
                  src={card.imageUrl}
                  alt={card.title || "Pe’chies Scents"}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 45vw"
                  className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
                />
              ) : (
                featured && <ProductImage product={featured} priority />
              )}
              <span className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
            </div>
            {(card.label || card.title || card.subtitle) && (
              <div className="absolute inset-x-0 bottom-0 p-5 md:p-7">
                {card.label && (
                  <p className="text-[0.6rem] font-bold tracking-[0.25em] text-champagne uppercase">{card.label}</p>
                )}
                {card.title && (
                  <p className="mt-1 font-serif text-[1.65rem] leading-tight md:text-4xl">{card.title}</p>
                )}
                {card.subtitle && <p className="mt-0.5 text-sm text-ivory/70">{card.subtitle}</p>}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function TrustStrip() {
  const items = [
    { icon: TruckIcon, title: "Nationwide delivery", text: "Anywhere in Nigeria" },
    { icon: ShieldCheckIcon, title: "Authentic scents", text: "Carefully selected" },
    { icon: WhatsAppIcon, title: "Order on WhatsApp", text: "Fast, personal service" },
    { icon: GiftIcon, title: "Gift-ready", text: "Sets for every occasion" },
  ];
  return (
    <div className="border-y border-white/[0.06] bg-onyx/50">
      <div className="no-scrollbar mx-auto flex max-w-7xl snap-x gap-6 overflow-x-auto px-5 py-4 md:grid md:grid-cols-4 md:px-6 md:py-6">
        {items.map(({ icon: Icon, title, text }) => (
          <div key={title} className="flex shrink-0 snap-start items-center gap-3">
            <span className="flex size-9 items-center justify-center rounded-full bg-champagne/10 text-champagne">
              <Icon className="size-4" size={16} />
            </span>
            <span>
              <span className="block text-[0.78rem] font-semibold whitespace-nowrap">{title}</span>
              <span className="block text-[0.7rem] whitespace-nowrap text-ivory/45">{text}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HowToOrder() {
  const steps = [
    { n: "01", title: "Choose your scent", text: "Browse the collection and add your favourites to your bag." },
    { n: "02", title: "Send on WhatsApp", text: "Your order is written for you — just tap send. No forms, no account." },
    { n: "03", title: "Delivered to you", text: "We confirm payment and delivery personally, anywhere in Nigeria." },
  ];
  return (
    <section className="mx-auto max-w-7xl px-5 pt-20 md:px-6 md:pt-28">
      <div className="overflow-hidden rounded-[28px] border border-white/[0.07] bg-[radial-gradient(ellipse_at_top_right,rgba(201,168,120,0.14),transparent_60%)] bg-onyx p-6 md:rounded-[36px] md:p-12">
        <p className="eyebrow">How ordering works</p>
        <h2 className="mt-1.5 font-serif text-[2rem] leading-[1.05] font-medium md:text-5xl">
          Effortless, from <em className="text-champagne">bag to doorstep</em>
        </h2>
        <ol className="mt-8 grid gap-6 md:mt-12 md:grid-cols-3 md:gap-10">
          {steps.map((s) => (
            <li key={s.n} className="flex gap-4 md:flex-col md:gap-3">
              <span className="font-serif text-3xl leading-none text-champagne/70 italic md:text-5xl">{s.n}</span>
              <span>
                <span className="block font-semibold">{s.title}</span>
                <span className="mt-1 block text-sm leading-relaxed text-ivory/55">{s.text}</span>
              </span>
            </li>
          ))}
        </ol>
        <a
          href={whatsappLink("Hello Pe’chies Scents & Accessories, I’d love some help choosing a fragrance.")}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-gold mt-10 w-full md:w-auto"
        >
          <WhatsAppIcon /> Get personal scent advice
        </a>
      </div>
    </section>
  );
}

function FilterSheet({
  open,
  onOpenChange,
  filters,
  set,
  reset,
  count,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  filters: Filters;
  set: (patch: Partial<Filters>) => void;
  reset: () => void;
  count: number;
}) {
  const group = (
    label: string,
    key: keyof Filters,
    options: readonly { value: string; label: string }[],
  ) => (
    <fieldset className="border-b border-white/[0.06] py-5 last:border-0">
      <legend className="eyebrow mb-3">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <Pill key={o.value} active={filters[key] === o.value} onClick={() => set({ [key]: o.value })}>
            {o.label}
          </Pill>
        ))}
      </div>
    </fieldset>
  );

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title="Filter & Sort"
      subtitle="Refine the collection"
      footer={
        <div className="flex gap-3">
          <button onClick={reset} className="btn-ghost flex-1">Reset</button>
          <button onClick={() => onOpenChange(false)} className="btn-gold flex-[2]">
            Show {count} {count === 1 ? "result" : "results"}
          </button>
        </div>
      }
    >
      <div className="-mt-2">
        {group("Sort by", "sort", SORTS)}
        {group("Category", "category", [{ value: "all", label: "All" }, ...CATEGORIES])}
        {group("Made for", "gender", [{ value: "all", label: "Everyone" }, ...GENDERS])}
        {group("Collection", "collection", [{ value: "all", label: "All" }, ...COLLECTIONS])}
      </div>
    </Sheet>
  );
}

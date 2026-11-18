"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import {
  ArrowRightIcon,
  ChevronLeftIcon,
  HouseIcon,
  LayoutGridIcon,
  MinusIcon,
  PlusIcon,
  SearchIcon,
  ShoppingBagIcon,
  Trash2Icon,
} from "lucide-react";
import { useCart } from "./cart";
import { ProductImage } from "./ProductImage";
import { Sheet } from "./ui/sheet";
import { cn } from "@/lib/utils";
import { cartMessage, categoryLabel, formatPrice, TAGLINE, whatsappLink } from "@/lib/store";

export const SEARCH_EVENT = "pechies:search";

/**
 * App shell. `variant="product"` swaps the mobile tab bar for the page's own
 * sticky purchase bar and shows a back button in the header.
 */
export function SiteChrome({
  children,
  variant = "home",
}: {
  children: ReactNode;
  variant?: "home" | "product";
}) {
  const tabBar = variant === "home";
  return (
    <div className={cn(tabBar ? "pb-tabbar md:pb-0" : "pb-[calc(5.5rem+env(safe-area-inset-bottom))] md:pb-0")}>
      <Header variant={variant} />
      <main>{children}</main>
      <Footer />
      {tabBar && <TabBar />}
      <CartSheet />
      <AddedToast raised={tabBar ? "tabbar" : "buybar"} />
    </div>
  );
}

function useScrolled(threshold = 8) {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > threshold);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, [threshold]);
  return scrolled;
}

function useGoSearch() {
  const pathname = usePathname();
  const router = useRouter();
  return () => {
    if (pathname === "/") window.dispatchEvent(new Event(SEARCH_EVENT));
    else router.push("/#search");
  };
}

function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("pressable leading-none", className)} aria-label="Pe’chies Scents & Accessories — home">
      <span className="block font-serif text-[1.6rem] leading-none font-semibold tracking-wide text-ivory md:text-[1.75rem]">
        Pe’chies
      </span>
      <span className="mt-0.5 block text-[0.5rem] font-semibold tracking-[0.38em] text-champagne uppercase">
        Scents &amp; Accessories
      </span>
    </Link>
  );
}

function IconButton({
  label,
  onClick,
  children,
  className,
}: {
  label: string;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        "pressable relative flex size-11 items-center justify-center rounded-full text-ivory/85 hover:bg-white/[0.06] hover:text-ivory",
        className,
      )}
    >
      {children}
    </button>
  );
}

function BagButton({ className }: { className?: string }) {
  const { count, setOpen } = useCart();
  return (
    <IconButton label={`Open bag (${count} items)`} onClick={() => setOpen(true)} className={className}>
      <ShoppingBagIcon className="size-[21px]" strokeWidth={1.6} />
      {count > 0 && (
        <span
          key={count}
          className="absolute top-1 right-0.5 flex h-[18px] min-w-[18px] animate-bump items-center justify-center rounded-full bg-champagne px-1 text-[0.62rem] font-bold text-ink"
        >
          {count}
        </span>
      )}
    </IconButton>
  );
}

function Header({ variant }: { variant: "home" | "product" }) {
  const scrolled = useScrolled();
  const router = useRouter();
  const goSearch = useGoSearch();

  const back = () => {
    if (window.history.length > 1) router.back();
    else router.push("/");
  };

  return (
    <header
      className={cn(
        "pt-safe sticky top-0 z-40 transition-[background-color,border-color,box-shadow] duration-300",
        scrolled
          ? "border-b border-white/[0.06] bg-ink/80 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.6)] backdrop-blur-xl backdrop-saturate-150"
          : "border-b border-transparent bg-ink/40 backdrop-blur-md",
      )}
    >
      <div className="mx-auto grid h-14 max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-2 md:h-16 md:grid-cols-[auto_1fr_auto] md:px-6">
        {/* left */}
        <div className="flex items-center md:hidden">
          {variant === "product" ? (
            <IconButton label="Go back" onClick={back}>
              <ChevronLeftIcon className="size-6" strokeWidth={1.6} />
            </IconButton>
          ) : (
            <IconButton label="Search" onClick={goSearch}>
              <SearchIcon className="size-[21px]" strokeWidth={1.6} />
            </IconButton>
          )}
        </div>

        <Logo className="justify-self-center text-center md:justify-self-start md:text-left" />

        {/* desktop nav */}
        <nav className="hidden items-center justify-center gap-8 text-[0.7rem] font-semibold tracking-[0.2em] text-ivory/70 uppercase md:flex">
          <Link href="/#shop" className="transition-colors hover:text-champagne">Shop all</Link>
          <Link href="/?collection=bestseller#shop" className="transition-colors hover:text-champagne">Bestsellers</Link>
          <Link href="/?collection=new#shop" className="transition-colors hover:text-champagne">New in</Link>
          <Link href="/?collection=gift#shop" className="transition-colors hover:text-champagne">Gifts</Link>
        </nav>

        {/* right */}
        <div className="flex items-center justify-self-end">
          <IconButton label="Search" onClick={goSearch} className="hidden md:flex">
            <SearchIcon className="size-[20px]" strokeWidth={1.6} />
          </IconButton>
          {variant === "home" ? (
            <a
              href={whatsappLink("Hello Pe’chies Scents & Accessories, I have an enquiry.")}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Chat with us on WhatsApp"
              className="pressable flex size-11 items-center justify-center rounded-full text-ivory/85 hover:bg-white/[0.06] md:hidden"
            >
              <WhatsAppIcon size={20} />
            </a>
          ) : (
            <BagButton className="md:hidden" />
          )}
          <BagButton className="hidden md:flex" />
        </div>
      </div>
    </header>
  );
}

function TabBar() {
  const pathname = usePathname();
  const { count, setOpen, open } = useCart();
  const goSearch = useGoSearch();
  const [section, setSection] = useState<"home" | "shop">("home");

  // Highlight "Shop" once the catalogue is on screen
  useEffect(() => {
    const el = document.getElementById("shop");
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => setSection(e.isIntersecting || e.boundingClientRect.top < 0 ? "shop" : "home"),
      { rootMargin: "0px 0px -60% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [pathname]);

  const item = "pressable flex flex-1 flex-col items-center justify-center gap-1 text-[0.6rem] font-semibold tracking-[0.12em] uppercase";
  const on = "text-champagne";
  const off = "text-ivory/55";

  return (
    <nav
      aria-label="Primary"
      className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.07] bg-ink/85 backdrop-blur-xl backdrop-saturate-150 md:hidden"
    >
      <div className="mx-auto flex h-16 max-w-md items-stretch px-2">
        <Link
          href="/"
          onClick={() => pathname === "/" && window.scrollTo({ top: 0 })}
          className={cn(item, !open && section === "home" ? on : off)}
        >
          <HouseIcon className="size-[22px]" strokeWidth={1.6} />
          Home
        </Link>
        <Link href="/#shop" className={cn(item, !open && section === "shop" ? on : off)}>
          <LayoutGridIcon className="size-[22px]" strokeWidth={1.6} />
          Shop
        </Link>
        <button onClick={goSearch} className={cn(item, off)}>
          <SearchIcon className="size-[22px]" strokeWidth={1.6} />
          Search
        </button>
        <button onClick={() => setOpen(true)} className={cn(item, "relative", open ? on : off)} aria-label={`Bag (${count} items)`}>
          <span className="relative">
            <ShoppingBagIcon className="size-[22px]" strokeWidth={1.6} />
            {count > 0 && (
              <span
                key={count}
                className="absolute -top-1.5 -right-2.5 flex h-[17px] min-w-[17px] animate-bump items-center justify-center rounded-full bg-champagne px-1 text-[0.6rem] font-bold tracking-normal text-ink"
              >
                {count}
              </span>
            )}
          </span>
          Bag
        </button>
      </div>
    </nav>
  );
}

function Footer() {
  return (
    <footer className="mt-20 border-t border-white/[0.06] bg-onyx/60 md:mt-28">
      <div className="mx-auto max-w-7xl px-5 py-12 md:px-6 md:py-16">
        <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-serif text-3xl leading-tight text-ivory md:text-4xl">
              Pe’chies Scents
              <br className="md:hidden" /> &amp; Accessories
            </p>
            <p className="mt-2 font-serif text-xl text-champagne italic">{TAGLINE}</p>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm text-ivory/60 md:flex md:gap-10">
            <Link href="/#shop" className="hover:text-champagne">Shop all</Link>
            <Link href="/?collection=bestseller#shop" className="hover:text-champagne">Bestsellers</Link>
            <Link href="/?collection=new#shop" className="hover:text-champagne">New arrivals</Link>
            <Link href="/?collection=gift#shop" className="hover:text-champagne">Gift sets</Link>
          </div>
        </div>
        <a
          href={whatsappLink("Hello Pe’chies Scents & Accessories, I have an enquiry.")}
          target="_blank"
          rel="noopener noreferrer"
          className="pressable mt-10 flex items-center justify-between gap-4 rounded-2xl border border-white/[0.07] bg-white/[0.03] px-5 py-4 hover:border-champagne/40"
        >
          <span className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-full bg-[#25D366]/15 text-[#25D366]">
              <WhatsAppIcon size={18} />
            </span>
            <span>
              <span className="block text-sm font-semibold">Chat with us on WhatsApp</span>
              <span className="block text-xs text-ivory/50">Orders, enquiries & scent advice</span>
            </span>
          </span>
          <ArrowRightIcon className="size-4 text-champagne" />
        </a>
        <p className="mt-10 text-xs text-ivory/40">
          © {new Date().getFullYear()} Pe’chies Scents & Accessories · Delivering across Nigeria
        </p>
      </div>
    </footer>
  );
}

function CartSheet() {
  const { lines, open, setOpen, setQty, remove, count } = useCart();
  const available = lines.filter((l) => l.product.inStock);
  const unavailable = lines.filter((l) => !l.product.inStock);
  const total = available.reduce((s, l) => s + l.qty * l.product.price, 0);

  return (
    <Sheet
      open={open}
      onOpenChange={setOpen}
      title="Your Bag"
      subtitle={count ? `${count} ${count === 1 ? "item" : "items"}` : "Nothing here yet"}
      footer={
        lines.length > 0 ? (
          <>
            <div className="mb-1 flex items-baseline justify-between">
              <span className="text-sm text-ivory/60">Subtotal</span>
              <span className="font-serif text-[1.75rem] leading-none">{formatPrice(total)}</span>
            </div>
            <p className="mb-4 text-xs text-ivory/45">
              {unavailable.length > 0
                ? "Out-of-stock items won’t be included. "
                : ""}
              Delivery & payment confirmed on WhatsApp.
            </p>
            <a
              href={available.length ? whatsappLink(cartMessage(available)) : undefined}
              target="_blank"
              rel="noopener noreferrer"
              aria-disabled={!available.length}
              className="btn-gold w-full"
            >
              <WhatsAppIcon /> Checkout on WhatsApp
            </a>
          </>
        ) : undefined
      }
    >
      {lines.length === 0 ? (
        <div className="flex flex-col items-center px-4 pt-8 pb-12 text-center">
          <span className="flex size-20 items-center justify-center rounded-full border border-champagne/25 bg-champagne/[0.06]">
            <ShoppingBagIcon className="size-8 text-champagne" strokeWidth={1.3} />
          </span>
          <p className="mt-6 font-serif text-2xl italic">Your bag is empty</p>
          <p className="mt-2 max-w-xs text-sm text-ivory/55">
            Discover a scent that feels like you — then order in seconds on WhatsApp.
          </p>
          <Link href="/#shop" onClick={() => setOpen(false)} className="btn-outline mt-8">
            Explore the collection
          </Link>
        </div>
      ) : (
        <ul className="pb-2">
          {lines.map(({ product, qty }) => (
            <li key={product._id} className="flex gap-4 border-b border-white/[0.06] py-4 last:border-0">
              <Link
                href={`/product/${product.slug}`}
                onClick={() => setOpen(false)}
                className="group relative h-[6.5rem] w-[5.25rem] shrink-0 overflow-hidden rounded-xl bg-graphite"
              >
                <ProductImage product={product} sizes="84px" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-[0.6rem] font-semibold tracking-[0.2em] text-bronze uppercase">
                      {categoryLabel(product.category)}
                    </p>
                    <p className="truncate font-serif text-lg leading-tight">{product.name}</p>
                  </div>
                  <button
                    onClick={() => remove(product._id)}
                    className="pressable -mt-1 -mr-2 flex size-9 shrink-0 items-center justify-center rounded-full text-ivory/40 hover:text-red-300"
                    aria-label={`Remove ${product.name}`}
                  >
                    <Trash2Icon className="size-4" strokeWidth={1.6} />
                  </button>
                </div>
                {!product.inStock && <p className="mt-0.5 text-xs text-red-300/90">Currently out of stock</p>}
                <div className="mt-auto flex items-center justify-between pt-2">
                  <Stepper
                    value={qty}
                    onChange={(n) => setQty(product._id, n)}
                    min={0}
                    size="sm"
                    label={product.name}
                  />
                  <span className="text-sm font-semibold text-champagne">
                    {formatPrice(product.price * qty)}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}

export function Stepper({
  value,
  onChange,
  min = 1,
  size = "md",
  label,
}: {
  value: number;
  onChange: (n: number) => void;
  min?: number;
  size?: "sm" | "md";
  label: string;
}) {
  const btn = cn(
    "pressable flex items-center justify-center rounded-full text-ivory/80 hover:bg-white/[0.08] hover:text-ivory disabled:opacity-30",
    size === "sm" ? "size-8" : "size-11",
  );
  return (
    <div className="inline-flex items-center rounded-full border border-white/[0.09] bg-white/[0.03] p-0.5">
      <button
        className={btn}
        onClick={() => onChange(value - 1)}
        disabled={value <= min}
        aria-label={`Decrease quantity of ${label}`}
      >
        {value === 1 && min === 0 ? <Trash2Icon className="size-3.5" /> : <MinusIcon className="size-4" />}
      </button>
      <span className={cn("text-center font-semibold tabular-nums", size === "sm" ? "w-7 text-sm" : "w-9")} aria-live="polite">
        {value}
      </span>
      <button className={btn} onClick={() => onChange(value + 1)} aria-label={`Increase quantity of ${label}`}>
        <PlusIcon className="size-4" />
      </button>
    </div>
  );
}

function AddedToast({ raised }: { raised: "tabbar" | "buybar" }) {
  const { toast, lines, setOpen, dismissToast, count } = useCart();
  const line = toast && lines.find((l) => l.product._id === toast.id);
  if (!toast || !line) return null;

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-x-0 z-[45] flex justify-center px-3 md:inset-x-auto md:right-6 md:bottom-6",
        raised === "tabbar"
          ? "bottom-[calc(4.75rem+env(safe-area-inset-bottom))]"
          : "bottom-[calc(6.25rem+env(safe-area-inset-bottom))]",
      )}
    >
      <div
        key={toast.key}
        role="status"
        className="pointer-events-auto flex w-full max-w-md animate-toast-in items-center gap-3 rounded-2xl border border-white/[0.08] bg-graphite/95 p-2.5 pr-3 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.85)] backdrop-blur-xl md:w-96"
      >
        <div className="relative h-12 w-10 shrink-0 overflow-hidden rounded-lg bg-ink">
          <ProductImage product={line.product} sizes="40px" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[0.62rem] font-semibold tracking-[0.18em] text-champagne uppercase">
            Added to bag
          </p>
          <p className="truncate text-sm">{line.product.name}</p>
        </div>
        <button
          onClick={() => {
            dismissToast();
            setOpen(true);
          }}
          className="pressable shrink-0 rounded-full bg-ivory px-4 py-2 text-[0.68rem] font-bold tracking-[0.12em] text-ink uppercase"
        >
          View ({count})
        </button>
      </div>
    </div>
  );
}

export function WhatsAppIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.8-1.2.2-.6.2-1.1.1-1.2l-.5-.4Z" />
    </svg>
  );
}

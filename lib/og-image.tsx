/**
 * Social share card (Open Graph / Twitter) built from the homepage hero.
 * Used by app/opengraph-image.tsx and app/twitter-image.tsx.
 *
 * Mirrors the Hero in components/Storefront.tsx: the dashboard-set hero image wins,
 * otherwise the same auto-picked featured product is shown.
 */
import { ImageResponse } from "next/og";
import { fetchQuery } from "convex/nextjs";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { api } from "@/convex/_generated/api";
import { SITE_NAME, SITE_URL, TAGLINE, type Product } from "@/lib/store";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_ALT = `${SITE_NAME} — ${TAGLINE} Premium oud, oil perfumes, body mists and sprays in Nigeria.`;

const C = {
  bg: "#0c0c0f",
  graphite: "#26262b",
  champagne: "#c9a878",
  goldLight: "#e6cfa4",
  bronze: "#8a6b52",
  ivory: "#f3eee5",
};

type Card = { imageUrl?: string; label?: string; title?: string; subtitle?: string };

async function getCard(): Promise<Card | null> {
  const [hero, products] = await Promise.all([
    fetchQuery(api.hero.get).catch(() => null),
    fetchQuery(api.products.list).catch(() => [] as Product[]),
  ]);
  if (hero?.imageUrl) return hero;
  const featured =
    products.find((p) => p.inStock && p.imageUrl && p.tags.includes("luxury") && p.tags.includes("bestseller")) ??
    products.find((p) => p.inStock && p.imageUrl && p.tags.includes("bestseller")) ??
    products.find((p) => p.inStock && p.imageUrl) ??
    products[0];
  if (!featured) return null;
  return {
    imageUrl: featured.imageUrl,
    label: hero?.label || "Signature pick",
    title: featured.name,
    subtitle: featured.notes,
  };
}

/** Ask the CDN for a JPEG sized for the card (the renderer can't decode WebP/AVIF). */
function jpegUrl(url: string, w: number, h: number) {
  if (url.includes("res.cloudinary.com") && url.includes("/upload/")) {
    return url.replace("/upload/", `/upload/f_jpg,q_auto,c_fill,g_auto,w_${w},h_${h}/`);
  }
  if (url.includes("images.unsplash.com")) {
    const u = new URL(url);
    u.searchParams.delete("auto");
    u.searchParams.set("fm", "jpg");
    u.searchParams.set("w", String(w));
    u.searchParams.set("h", String(h));
    u.searchParams.set("fit", "crop");
    return u.toString();
  }
  return url;
}

/** Fetch the photo and inline it, so a slow or unsupported image never breaks the card. */
async function loadImage(url: string, w: number, h: number): Promise<string | null> {
  try {
    const res = await fetch(jpegUrl(url, w, h), { headers: { Accept: "image/jpeg,image/png" } });
    const type = res.headers.get("content-type") ?? "";
    if (!res.ok || !/image\/(jpe?g|png)/.test(type)) return null;
    const bytes = new Uint8Array(await res.arrayBuffer());
    let bin = "";
    for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    return `data:${type};base64,${btoa(bin)}`;
  } catch {
    return null;
  }
}

/** Load a Google font (TTF) subset to just the characters drawn. Cached per worker instance. */
const fontCache = new Map<string, Promise<ArrayBuffer>>();
function loadFont(family: string, weight: number, italic: boolean, text: string) {
  const key = `${family}|${weight}|${italic}|${text}`;
  let p = fontCache.get(key);
  if (!p) {
    p = fetchFont(family, weight, italic, text);
    p.catch(() => fontCache.delete(key));
    fontCache.set(key, p);
  }
  return p;
}

async function fetchFont(family: string, weight: number, italic: boolean, text: string) {
  const params = `family=${family.replace(/ /g, "+")}:ital,wght@${italic ? 1 : 0},${weight}&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(`https://fonts.googleapis.com/css2?${params}`)).text();
  const src = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
  if (!src) throw new Error(`No TTF for ${family}`);
  return (await fetch(src)).arrayBuffer();
}

/** Minimal shape of the Cloudflare Images binding (wrangler.jsonc → "images"). */
type ImagesBinding = {
  input(stream: ReadableStream<Uint8Array>): {
    output(opts: { format: string; quality?: number }): Promise<{ image(): ReadableStream<Uint8Array> }>;
  };
};

/**
 * The card is a PNG, and a PNG with a photo in it is ~550 KB, too heavy for WhatsApp,
 * which silently drops previews over ~300 KB. Re-encode it as JPEG (~60–100 KB) with the
 * Cloudflare Images binding. Falls back to the PNG (e.g. in `next dev`) if that fails.
 */
async function toJpeg(png: Response): Promise<Response> {
  const fallback = png.clone();
  try {
    const { env } = await getCloudflareContext({ async: true });
    const images = (env as unknown as { IMAGES?: ImagesBinding }).IMAGES;
    if (!images || !png.body) return fallback;
    const jpeg = await images.input(png.body).output({ format: "image/jpeg", quality: 82 });
    return new Response(jpeg.image(), {
      headers: { "content-type": "image/jpeg", "cache-control": "public, max-age=3600" },
    });
  } catch {
    return fallback;
  }
}

export async function renderOgImage() {
  return toJpeg(await renderPng());
}

async function renderPng() {
  const [first, second] = TAGLINE.replace(/\.$/, "").split(". ");
  const eyebrow = "FRAGRANCE HOUSE · NIGERIA";
  const blurb = "Oud, oil perfumes, body mists & sprays — order in seconds on WhatsApp.";
  const domain = new URL(SITE_URL).hostname;

  const card = await getCard();
  const CARD_W = 440;
  const CARD_H = 530;
  const image = card?.imageUrl ? await loadImage(card.imageUrl, CARD_W * 2, CARD_H * 2) : null;

  const serifText = `${first}. ${second}. P ${card?.title ?? ""}`;
  const sansText = `${eyebrow} ${blurb} ${domain} ${card?.label?.toUpperCase() ?? ""} ${card?.subtitle ?? ""}`;
  const fonts = await Promise.all([
    loadFont("Cormorant Garamond", 500, false, serifText).then((data) => ({ name: "Cormorant", data, weight: 500 as const, style: "normal" as const })),
    loadFont("Cormorant Garamond", 500, true, serifText).then((data) => ({ name: "Cormorant", data, weight: 500 as const, style: "italic" as const })),
    loadFont("Manrope", 500, false, sansText).then((data) => ({ name: "Manrope", data, weight: 500 as const, style: "normal" as const })),
    loadFont("Manrope", 700, false, sansText).then((data) => ({ name: "Manrope", data, weight: 700 as const, style: "normal" as const })),
  ]).catch(() => undefined); // fall back to built-in font rather than failing the share card

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          position: "relative",
          background: C.bg,
          color: C.ivory,
          fontFamily: "Manrope",
          padding: "0 50px 0 72px",
        }}
      >
        {/* champagne glow, like the hero */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            background:
              "radial-gradient(circle at 78% 8%, rgba(201,168,120,0.26) 0%, rgba(201,168,120,0.08) 32%, rgba(201,168,120,0) 60%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 2,
            display: "flex",
            background: "linear-gradient(90deg, rgba(201,168,120,0), rgba(201,168,120,0.6), rgba(201,168,120,0))",
          }}
        />

        {/* Left: brand + tagline */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, paddingRight: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 56,
                height: 56,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 9999,
                border: "2px solid rgba(201,168,120,0.55)",
                color: C.champagne,
                fontFamily: "Cormorant",
                fontStyle: "italic",
                fontSize: 34,
                paddingBottom: 4,
              }}
            >
              P
            </div>
            <div style={{ display: "flex", fontSize: 17, fontWeight: 700, letterSpacing: 5, color: C.champagne }}>
              {eyebrow}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: 34,
              fontFamily: "Cormorant",
              fontSize: 104,
              lineHeight: 0.95,
              letterSpacing: -1,
            }}
          >
            <div style={{ display: "flex" }}>{first}.</div>
            <div
              style={{
                display: "flex",
                fontStyle: "italic",
                backgroundImage: `linear-gradient(90deg, ${C.goldLight}, ${C.champagne}, ${C.bronze})`,
                backgroundClip: "text",
                color: "transparent",
                paddingBottom: 8,
              }}
            >
              {second}.
            </div>
          </div>

          <div style={{ display: "flex", marginTop: 26, fontSize: 25, lineHeight: 1.45, color: "rgba(243,238,229,0.68)", maxWidth: 560 }}>
            {blurb}
          </div>

          <div style={{ display: "flex", marginTop: 38 }}>
            <div
              style={{
                display: "flex",
                padding: "14px 28px",
                borderRadius: 9999,
                background: `linear-gradient(180deg, ${C.goldLight} 0%, ${C.champagne} 55%, #b89262 100%)`,
                color: C.bg,
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: 0.5,
              }}
            >
              {domain}
            </div>
          </div>
        </div>

        {/* Right: hero card */}
        {card && (
          <div
            style={{
              width: CARD_W,
              height: CARD_H,
              display: "flex",
              position: "relative",
              overflow: "hidden",
              borderRadius: 36,
              background: image ? C.graphite : "radial-gradient(ellipse at top, #2f2a26, #101014)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 40px 80px -20px rgba(0,0,0,0.7)",
            }}
          >
            {image && (
              // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
              <img src={image} width={CARD_W} height={CARD_H} style={{ position: "absolute", inset: 0, width: CARD_W, height: CARD_H, objectFit: "cover" }} />
            )}
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                background: "linear-gradient(0deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 50%, rgba(0,0,0,0) 100%)",
              }}
            />
            <div style={{ position: "absolute", left: 30, right: 30, bottom: 28, display: "flex", flexDirection: "column" }}>
              {card.label && (
                <div style={{ display: "flex", fontSize: 14, fontWeight: 700, letterSpacing: 4, color: C.champagne }}>
                  {card.label.toUpperCase()}
                </div>
              )}
              {card.title && (
                <div style={{ display: "flex", marginTop: 6, fontFamily: "Cormorant", fontSize: 44, lineHeight: 1.1 }}>
                  {card.title}
                </div>
              )}
              {card.subtitle && (
                <div style={{ display: "flex", marginTop: 4, fontSize: 18, color: "rgba(243,238,229,0.72)" }}>
                  {card.subtitle}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    ),
    { ...OG_SIZE, fonts },
  );
}

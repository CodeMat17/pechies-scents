import type { Doc } from "@/convex/_generated/dataModel";

export type Product = Doc<"products">;

export const SITE_URL = "https://pechiesscent.com";
export const SITE_NAME = "Pe’chies Scents & Accessories";
export const TAGLINE = "Your Scent. Your Signature.";

export const CATEGORIES = [
  { value: "body-spray", label: "Body Sprays" },
  { value: "body-mist", label: "Body Mists" },
  { value: "oud", label: "Oud Perfumes" },
  { value: "oil", label: "Oil Perfumes" },
] as const;

export const GENDERS = [
  { value: "men", label: "Men" },
  { value: "women", label: "Women" },
  { value: "unisex", label: "Unisex" },
] as const;

export const COLLECTIONS = [
  { value: "bestseller", label: "Bestsellers" },
  { value: "new", label: "New Arrivals" },
  { value: "gift", label: "Gift Collections" },
  { value: "affordable", label: "Affordable" },
  { value: "luxury", label: "Luxury" },
] as const;

export const categoryLabel = (v: string) =>
  CATEGORIES.find((c) => c.value === v)?.label ?? v;
export const genderLabel = (v: string) =>
  GENDERS.find((g) => g.value === v)?.label ?? v;
export const collectionLabel = (v: string) =>
  COLLECTIONS.find((c) => c.value === v)?.label ?? v;

const ngn = new Intl.NumberFormat("en-NG", {
  style: "currency",
  currency: "NGN",
  maximumFractionDigits: 0,
});
export const formatPrice = (n: number) => ngn.format(n);

// ---------- WhatsApp ----------

export function whatsappLink(message: string) {
  const number = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(/\D/g, "");
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export type CartLine = { product: Product; qty: number };

export function productMessage(p: Product, qty = 1) {
  return [
    `Hello Pe’chies Scents & Accessories,`,
    ``,
    `I would like to order:`,
    ``,
    `• ${p.name} (${categoryLabel(p.category)})`,
    `  Qty: ${qty} × ${formatPrice(p.price)} = ${formatPrice(p.price * qty)}`,
    `  ${SITE_URL}/product/${p.slug}`,
    ``,
    `Please confirm availability, payment details and delivery. Thank you.`,
  ].join("\n");
}

export function cartMessage(lines: CartLine[]) {
  const total = lines.reduce((s, l) => s + l.product.price * l.qty, 0);
  return [
    `Hello Pe’chies Scents & Accessories,`,
    ``,
    `I would like to place an order:`,
    ``,
    ...lines.map(
      (l, i) =>
        `${i + 1}. ${l.product.name} — ${l.qty} × ${formatPrice(l.product.price)} = ${formatPrice(l.product.price * l.qty)}`,
    ),
    ``,
    `Order total: ${formatPrice(total)}`,
    ``,
    `Please confirm availability, payment details and delivery. Thank you.`,
  ].join("\n");
}

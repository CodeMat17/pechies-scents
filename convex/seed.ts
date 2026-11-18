import { internalMutation } from "./_generated/server";

type Seed = {
  name: string;
  description: string;
  notes: string;
  price: number;
  category: "body-spray" | "body-mist" | "oud" | "oil";
  gender: "men" | "women" | "unisex";
  tags: string[];
  imageUrl?: string;
};

/** Free-to-use Unsplash test photos, cropped to a 4:5 portrait. */
const img = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=1200&h=1500&fit=crop&crop=entropy&q=80&auto=format`;

const samples: Seed[] = [
  { name: "Noir Saffron Oud", description: "A deep, smoky oud wrapped in saffron and warm resins. Made for evenings that deserve to be remembered.", notes: "Saffron · Oud · Amber", price: 45000, category: "oud", gender: "unisex", tags: ["luxury", "bestseller"], imageUrl: img("1588405748880-12d1d2a59f75") },
  { name: "Royal Amber Oud", description: "Rich amber and aged agarwood with a soft leather trail. Bold, confident and long-lasting.", notes: "Amber · Agarwood · Leather", price: 38000, category: "oud", gender: "men", tags: ["luxury"], imageUrl: img("1622618991746-fe6004db3a47") },
  { name: "Rose Majesty Oud", description: "Velvety Taif rose layered over oud — romantic, regal and unforgettable.", notes: "Taif Rose · Oud · Musk", price: 42000, category: "oud", gender: "women", tags: ["luxury", "new"], imageUrl: img("1590736704728-f4730bb30770") },
  { name: "White Musk Oil", description: "A clean, skin-close musk oil that feels like freshly washed linen. Alcohol-free.", notes: "White Musk · Powder · Cotton", price: 9500, category: "oil", gender: "unisex", tags: ["affordable", "bestseller"], imageUrl: img("1617897903246-719242758050") },
  { name: "Vanilla Silk Oil", description: "Creamy vanilla and tonka in a smooth oil that warms beautifully on the skin.", notes: "Vanilla · Tonka · Sandalwood", price: 11000, category: "oil", gender: "women", tags: ["affordable"], imageUrl: img("1608571423902-eed4a5ad8108") },
  { name: "Black Sandal Oil", description: "Earthy sandalwood with a hint of spice. Quietly powerful.", notes: "Sandalwood · Cardamom · Vetiver", price: 12500, category: "oil", gender: "men", tags: ["new"], imageUrl: img("1588514912908-8f5891714f8d") },
  { name: "Citrus Bloom Mist", description: "Bright mandarin and neroli in a light, refreshing body mist for everyday wear.", notes: "Mandarin · Neroli · Petals", price: 7500, category: "body-mist", gender: "women", tags: ["affordable", "new"], imageUrl: img("1613521140785-e85e427f8002") },
  { name: "Pink Velvet Mist", description: "Sweet berries and soft florals — playful, feminine and easy to love.", notes: "Berries · Peony · Sugar", price: 8000, category: "body-mist", gender: "women", tags: ["bestseller", "gift"], imageUrl: img("1557170334-a9632e77c6e4") },
  { name: "Coconut Breeze Mist", description: "Coconut milk and sea salt for a carefree, sun-kissed glow.", notes: "Coconut · Sea Salt · Vanilla", price: 7000, category: "body-mist", gender: "unisex", tags: ["affordable"], imageUrl: img("1631729371254-42c2892f0e6e") },
  { name: "Midnight Edge Spray", description: "A sharp, modern body spray with cool spice and woods. Made for the confident man.", notes: "Black Pepper · Lavender · Cedar", price: 6500, category: "body-spray", gender: "men", tags: ["affordable", "bestseller"], imageUrl: img("1608528577891-eb055944f2e7") },
  { name: "Ocean Drift Spray", description: "Aquatic freshness with a clean musky finish. Light enough for daily wear.", notes: "Marine · Bergamot · Musk", price: 6000, category: "body-spray", gender: "men", tags: ["affordable"], imageUrl: img("1587017539504-67cfbddac569") },
  { name: "Golden Hour Gift Set", description: "A curated trio — oud, oil and mist — presented in a signature gift box.", notes: "Oud · Musk · Florals", price: 55000, category: "oud", gender: "unisex", tags: ["gift", "luxury"], imageUrl: img("1615634260167-c8cdede054de") },
];

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/** Run once: npx convex run seed:run */
export const run = internalMutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db.query("products").first();
    if (existing) return "Products already exist — skipped.";
    for (const p of samples) {
      await ctx.db.insert("products", { ...p, slug: slugify(p.name), inStock: true });
    }
    return `Inserted ${samples.length} sample products.`;
  },
});

/**
 * Backfill test photos onto existing sample products that have no image yet.
 * Run: npx convex run seed:addImages
 */
export const addImages = internalMutation({
  args: {},
  handler: async (ctx) => {
    let updated = 0;
    for (const p of samples) {
      if (!p.imageUrl) continue;
      const doc = await ctx.db
        .query("products")
        .withIndex("by_slug", (q) => q.eq("slug", slugify(p.name)))
        .unique();
      if (doc && !doc.imageUrl) {
        await ctx.db.patch(doc._id, { imageUrl: p.imageUrl });
        updated++;
      }
    }
    return `Added images to ${updated} products.`;
  },
});

import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const category = v.union(
  v.literal("body-spray"),
  v.literal("body-mist"),
  v.literal("oud"),
  v.literal("oil"),
);

export const gender = v.union(
  v.literal("men"),
  v.literal("women"),
  v.literal("unisex"),
);

export const productFields = {
  name: v.string(),
  slug: v.string(),
  description: v.string(),
  notes: v.optional(v.string()), // e.g. "Rose · Saffron · Amber"
  price: v.number(), // NGN
  category,
  gender,
  // collections: bestseller, new, gift, affordable, luxury
  tags: v.array(v.string()),
  imageUrl: v.optional(v.string()),
  imagePublicId: v.optional(v.string()),
  inStock: v.boolean(),
};

// Right-hand card of the homepage hero. Single row, edited from /dashboard.
export const heroFields = {
  imageUrl: v.optional(v.string()),
  imagePublicId: v.optional(v.string()),
  label: v.optional(v.string()), // small caps line, e.g. "Signature pick"
  title: v.optional(v.string()),
  subtitle: v.optional(v.string()),
};

export default defineSchema({
  hero: defineTable(heroFields),
  products: defineTable(productFields)
    .index("by_slug", ["slug"])
    .index("by_category", ["category"]),
  sessions: defineTable({
    token: v.string(),
    expiresAt: v.number(),
  }).index("by_token", ["token"]),
});

import { v, ConvexError } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { productFields } from "./schema";
import { requireAdmin } from "./auth";

// ---------- Public ----------

export const list = query({
  args: {},
  handler: async (ctx) => {
    const products = await ctx.db.query("products").order("desc").collect();
    // In-stock first, newest first
    return products.sort((a, b) => Number(b.inStock) - Number(a.inStock));
  },
});

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) =>
    ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique(),
});

// ---------- Admin ----------

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function uniqueSlug(
  ctx: MutationCtx,
  name: string,
  ignoreId?: Id<"products">,
) {
  const base = slugify(name) || "product";
  let slug = base;
  let n = 2;
  while (true) {
    const existing = await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .unique();
    if (!existing || existing._id === ignoreId) return slug;
    slug = `${base}-${n++}`;
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const { slug: _slug, ...editable } = productFields;
const input = v.object(editable);

function validate(p: { name: string; price: number }) {
  if (!p.name.trim()) throw new ConvexError("Name is required.");
  if (!Number.isFinite(p.price) || p.price < 0)
    throw new ConvexError("Price must be a positive number.");
}

export const create = mutation({
  args: { token: v.string(), product: input },
  handler: async (ctx, { token, product }) => {
    await requireAdmin(ctx, token);
    validate(product);
    const slug = await uniqueSlug(ctx, product.name);
    return ctx.db.insert("products", { ...product, slug });
  },
});

export const update = mutation({
  args: { token: v.string(), id: v.id("products"), product: input },
  handler: async (ctx, { token, id, product }) => {
    await requireAdmin(ctx, token);
    validate(product);
    const current = await ctx.db.get(id);
    if (!current) throw new ConvexError("Product not found.");
    const slug =
      current.name === product.name
        ? current.slug
        : await uniqueSlug(ctx, product.name, id);
    await ctx.db.replace(id, { ...product, slug });
  },
});

export const setStock = mutation({
  args: { token: v.string(), id: v.id("products"), inStock: v.boolean() },
  handler: async (ctx, { token, id, inStock }) => {
    await requireAdmin(ctx, token);
    await ctx.db.patch(id, { inStock });
  },
});

export const remove = mutation({
  args: { token: v.string(), id: v.id("products") },
  handler: async (ctx, { token, id }) => {
    await requireAdmin(ctx, token);
    await ctx.db.delete(id);
  },
});

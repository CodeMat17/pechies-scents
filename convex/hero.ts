import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { heroFields } from "./schema";
import { requireAdmin } from "./auth";

/** The homepage hero card (null until it is first saved in the dashboard). */
export const get = query({
  args: {},
  handler: async (ctx) => ctx.db.query("hero").first(),
});

export const save = mutation({
  args: { token: v.string(), hero: v.object(heroFields) },
  handler: async (ctx, { token, hero }) => {
    await requireAdmin(ctx, token);
    const clean = {
      imageUrl: hero.imageUrl,
      imagePublicId: hero.imagePublicId,
      label: hero.label?.trim() || undefined,
      title: hero.title?.trim() || undefined,
      subtitle: hero.subtitle?.trim() || undefined,
    };
    const existing = await ctx.db.query("hero").first();
    if (existing) await ctx.db.replace(existing._id, clean);
    else await ctx.db.insert("hero", clean);
  },
});

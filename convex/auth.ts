import { v, ConvexError } from "convex/values";
import {
  mutation,
  query,
  internalQuery,
  type QueryCtx,
} from "./_generated/server";

const SESSION_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function randomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

// Constant-time-ish string comparison
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function isValidSession(ctx: QueryCtx, token: string | undefined) {
  if (!token) return false;
  const session = await ctx.db
    .query("sessions")
    .withIndex("by_token", (q) => q.eq("token", token))
    .unique();
  return !!session && session.expiresAt > Date.now();
}

export async function requireAdmin(ctx: QueryCtx, token: string) {
  if (!(await isValidSession(ctx, token))) {
    throw new ConvexError("Not authorised. Please log in again.");
  }
}

export const login = mutation({
  args: { password: v.string() },
  handler: async (ctx, { password }) => {
    const expected = process.env.ADMIN_PASSWORD;
    if (!expected) {
      throw new ConvexError("ADMIN_PASSWORD is not set in Convex.");
    }
    if (!safeEqual(password, expected)) {
      throw new ConvexError("Incorrect password.");
    }
    // Clean up expired sessions
    const now = Date.now();
    for (const s of await ctx.db.query("sessions").collect()) {
      if (s.expiresAt < now) await ctx.db.delete(s._id);
    }
    const token = randomToken();
    await ctx.db.insert("sessions", { token, expiresAt: now + SESSION_MS });
    return token;
  },
});

export const logout = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_token", (q) => q.eq("token", token))
      .unique();
    if (session) await ctx.db.delete(session._id);
  },
});

export const check = query({
  args: { token: v.optional(v.string()) },
  handler: async (ctx, { token }) => isValidSession(ctx, token),
});

export const checkInternal = internalQuery({
  args: { token: v.string() },
  handler: async (ctx, { token }) => isValidSession(ctx, token),
});

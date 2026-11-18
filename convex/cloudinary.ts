import { v, ConvexError } from "convex/values";
import { action } from "./_generated/server";
import { internal } from "./_generated/api";

async function sha1Hex(input: string) {
  const data = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest("SHA-1", data);
  return Array.from(new Uint8Array(hash), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}

/**
 * Returns a signed upload payload so the dashboard can upload an image
 * straight to Cloudinary without exposing the API secret.
 */
export const signUpload = action({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const ok = await ctx.runQuery(internal.auth.checkInternal, { token });
    if (!ok) throw new ConvexError("Not authorised. Please log in again.");

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!cloudName || !apiKey || !apiSecret) {
      throw new ConvexError(
        "Cloudinary env vars are missing in Convex (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET).",
      );
    }

    const timestamp = Math.round(Date.now() / 1000);
    const folder = "pechies-scents/products";
    // Params must be sorted alphabetically for the signature
    const toSign = `folder=${folder}&timestamp=${timestamp}`;
    const signature = await sha1Hex(toSign + apiSecret);

    return { cloudName, apiKey, timestamp, folder, signature };
  },
});

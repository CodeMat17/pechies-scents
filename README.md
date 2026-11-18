# Pe’chies Scents & Accessories

Next.js storefront + Convex database + Cloudinary images. Orders go through WhatsApp.

- `/` — store (hero, category tiles, filters, product grid, cart)
- `/product/[slug]` — product page (order on WhatsApp / add to cart)
- `/dashboard` — password-protected product management

The public pages update live whenever products change in Convex. No redeploy is needed.

## Setup

1. `npm install`
2. `npx convex dev`: links or creates the Convex project and writes `NEXT_PUBLIC_CONVEX_URL` to `.env.local`.
3. Add these to `.env.local`:
   ```
   NEXT_PUBLIC_WHATSAPP_NUMBER=2348012345678   # digits only, with country code
   ```
4. Set the server secrets in Convex (they never reach the browser):
   ```
   npx convex env set ADMIN_PASSWORD "a-strong-password"
   npx convex env set CLOUDINARY_CLOUD_NAME your-cloud-name
   npx convex env set CLOUDINARY_API_KEY your-api-key
   npx convex env set CLOUDINARY_API_SECRET your-api-secret
   ```
5. Optional: load 12 sample products with `npx convex run seed:run`
6. `npm run dev`, then open http://localhost:3000 and http://localhost:3000/dashboard

## Deploying (Vercel)

- Build command: `npx convex deploy --cmd 'npm run build'`
- Vercel env vars: `CONVEX_DEPLOY_KEY` (from the Convex dashboard) and `NEXT_PUBLIC_WHATSAPP_NUMBER`
- Set the step 4 variables on the **production** deployment as well: `npx convex env set --prod ...`

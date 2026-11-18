# Deploying Pechies Scents to Cloudflare Workers

The site runs on **Cloudflare Workers** through the OpenNext adapter (`@opennextjs/cloudflare`).
The backend (products, admin login, image upload signing) runs on **Convex**, and images live on **Cloudinary**.

Two things get deployed separately:

| What | Where | Command |
| --- | --- | --- |
| Backend (`convex/` folder) | Convex | `yarn convex deploy` |
| Website (everything else) | Cloudflare | `yarn deploy` |

> This project uses **Yarn 1 (classic)**. Don't use `npm install` (it creates a second lockfile) and don't use `yarn dlx` (Yarn 1 doesn't have it; use `npx`).

Already in the repo, nothing to do: `wrangler.jsonc`, `open-next.config.ts`, the `preview`/`deploy` scripts in `package.json`, `images.unoptimized: true` in `next.config.ts`, and `.open-next` / `.wrangler` in `.gitignore`.

---

## Environment files: which one is used when

Next.js loads env files in this order (**first match wins**):

| Command | Files read, highest priority first |
| --- | --- |
| `yarn dev` | `.env.development.local` → `.env.local` → `.env.development` → `.env` |
| `yarn preview` / `yarn deploy` (production build) | `.env.production.local` → `.env.local` → `.env.production` → `.env` |

**Important:** `.env.local` beats `.env.production`. `npx convex dev` writes your **dev** Convex URL into `.env.local`, so any production value in `.env.production` would be silently overridden and the live site would talk to the dev database.

The fix is to put production values in **`.env.production.local`**. It wins over `.env.local` for builds and is ignored by `yarn dev`.

| File | Used by | Contains |
| --- | --- | --- |
| `.env.local` | `yarn dev`, `npx convex dev` | `CONVEX_DEPLOYMENT`, dev `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_WHATSAPP_NUMBER` |
| `.env.production.local` | `yarn preview`, `yarn deploy` | prod `NEXT_PUBLIC_CONVEX_URL`, `NEXT_PUBLIC_WHATSAPP_NUMBER` |

Both files are git-ignored (`.env*`), so they are never committed. Don't create a plain `.env.production`.

---

## Part A — First deploy (step by step)

### Step 1. Stop the dev servers
Stop `yarn dev` and `npx convex dev` if they're running (Ctrl+C). On Windows they lock files that the build needs.

### Step 2. Install dependencies
```bash
yarn install
```
Only `yarn.lock` should exist. If you see a `package-lock.json`, delete it and run `yarn install` again.

### Step 3. Deploy the Convex backend to production
```bash
yarn convex deploy
```
- Answer **yes** when it asks to push to the production deployment.
- Copy the URL it prints: `https://<prod-name>.convex.cloud`.

Then open the [Convex dashboard](https://dashboard.convex.dev), switch to the **Production** deployment, go to **Settings → Environment Variables**, and add:
- `ADMIN_PASSWORD`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

(Dev and production have **separate** env vars and **separate** data. The products you added in dev are not in production; add them again from `/dashboard` on the live site.)

### Step 4. Create `.env.production.local`
In the project root:
```
NEXT_PUBLIC_CONVEX_URL=https://<prod-name>.convex.cloud
NEXT_PUBLIC_WHATSAPP_NUMBER=234XXXXXXXXXX
```
Use the **production** URL from step 3, not the dev one in `.env.local`. These values are baked in at **build time**, so after changing one, run `yarn deploy` again.

### Step 5. Log in to Cloudflare
```bash
yarn wrangler login
```
A browser window opens; approve it. Check with `yarn wrangler whoami`.

### Step 6. Test locally on the Workers runtime (optional, recommended)
```bash
yarn preview
```
Open http://localhost:8787 and check the home page, a product page and `/dashboard`. Press Ctrl+C to stop.

### Step 7. Deploy
```bash
yarn deploy
```
This builds the site (about 2 minutes) and uploads it. When it finishes it prints the live URL:
`https://pechies-scents.<your-subdomain>.workers.dev`

If this is your first Worker, wrangler may ask you to pick a `workers.dev` subdomain. Choose any name.

### Step 8. Connect your domain
The domain's DNS must be on Cloudflare. If it isn't, go to **Add a domain** in Cloudflare, then change the nameservers at your registrar to the two Cloudflare gives you. Wait until the domain shows **Active**.

Then:
1. Go to **Workers & Pages** and click **pechies-scents**.
2. Open **Settings → Domains & Routes**.
3. Click **+ Add → Custom domain**, enter `pechiesscents.com`, and save.
4. Repeat for `www.pechiesscents.com` if you want it.

Cloudflare creates the DNS records and SSL certificate automatically (a few minutes).

The sitemap, canonical links and social previews use `SITE_URL` in `lib/store.ts` (`https://pechiesscents.com`). If you use a different domain, change it there and redeploy.

### Step 9. Check the live site
- Home page shows products (an empty list means production Convex has no products yet; add them in `/dashboard`).
- Log in to `/dashboard` with the production `ADMIN_PASSWORD`, then upload an image to confirm Cloudinary works.
- The WhatsApp button opens the right number.

---

## Part B — Every later deploy

```bash
yarn convex deploy   # only if anything in convex/ changed
yarn deploy          # build + upload the site
```

Products and the hero image edited in `/dashboard` save straight to Convex and show up on the live site immediately. You don't need to redeploy for those.

---

## Optional — Auto-deploy on every git push

Instead of running `yarn deploy` by hand:

1. Push the repo to GitHub.
2. In Cloudflare, open **Workers & Pages → pechies-scents → Settings → Build** and connect the GitHub repo (or **Create → Import a repository** if you haven't deployed yet). The Worker name must stay `pechies-scents` to match `wrangler.jsonc`.
3. Use these settings:
   - **Build command:** `yarn opennextjs-cloudflare build`
   - **Deploy command:** `yarn opennextjs-cloudflare deploy`
4. Under **Build → Variables and secrets**, add `NEXT_PUBLIC_CONVEX_URL` (production URL) and `NEXT_PUBLIC_WHATSAPP_NUMBER`. Cloudflare can't see your local `.env.production.local`.

Convex changes still need `yarn convex deploy` from your machine.

---

## Troubleshooting

- **Live site shows dev products / dev data:** the build used the dev Convex URL. Make sure the production URL is in `.env.production.local` (not `.env.production`, which `.env.local` overrides), then run `yarn deploy` again.
- **Site loads but shows no products:** production Convex is empty (add products in `/dashboard`) or `NEXT_PUBLIC_CONVEX_URL` is missing.
- **Dashboard login or image upload fails:** the Convex **production** env vars from step 3 are missing.
- **"Could not find public function" errors:** you changed `convex/` but didn't run `yarn convex deploy`.
- **`EPERM: operation not permitted ... esbuild.exe` during install/build:** `yarn dev` or `npx convex dev` is still running. Stop them and retry.
- **`error Command "dlx" not found`:** you're on Yarn 1. Use `npx` instead.
- **`Authentication error` from wrangler:** run `yarn wrangler login` again.
- **Custom domain option is missing:** the Worker only appears in Workers & Pages after the first `yarn deploy`.

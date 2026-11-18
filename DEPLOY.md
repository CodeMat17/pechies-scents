# Deploying Pechies Scents to Cloudflare

The site runs on **Cloudflare Workers** through the OpenNext adapter (`@opennextjs/cloudflare`).
The backend (products, admin login, image upload signing) runs on **Convex**, and images live on **Cloudinary**.

Two things get deployed separately:

| What | Where | Command |
|---|---|---|
| Backend (`convex/` folder) | Convex | `yarn convex deploy` |
| Website (everything else) | Cloudflare | `yarn deploy` |

> This project uses **Yarn 1 (classic)**. Yarn 1 has no `dlx` command, so the one-off tool in step 3 runs with `npx`, which comes with Node. Everything else uses `yarn`.

---

## Part A — One-time setup

Do this once per machine/project. Skip any step already done.

### 1. Use Yarn (not npm)
Only one lockfile should exist: `yarn.lock`. If a `package-lock.json` exists:
```bash
rm package-lock.json
rm -rf node_modules
yarn install
```
Commit `yarn.lock`.

### 2. Create the production Convex backend
```bash
yarn convex deploy
```
- Copy the production URL it prints: `https://<name>.convex.cloud`.
- In the Convex dashboard, switch to the **Production** deployment, go to **Settings → Environment Variables**, and add:
  - `ADMIN_PASSWORD`
  - `CLOUDINARY_CLOUD_NAME`
  - `CLOUDINARY_API_KEY`
  - `CLOUDINARY_API_SECRET`

### 3. Add the Cloudflare adapter
```bash
npx @opennextjs/cloudflare migrate
```
This command:
- installs `@opennextjs/cloudflare` and `wrangler`
- creates `wrangler.jsonc` and `open-next.config.ts`
- adds `preview` and `deploy` scripts to `package.json`
- adds `.open-next` to `.gitignore`

Afterwards:
- If a `package-lock.json` appears, delete it and run `yarn install`.
- Check that `wrangler.jsonc` and `open-next.config.ts` are in the project root, and that `package.json` has the `preview` and `deploy` scripts. *(For this project they're already done. `migrate` stopped part-way on Windows, so they were created by hand.)*
- In `wrangler.jsonc`, `"name"` and the `services[0].service` value must both be `pechies-scents`. That name becomes the Worker's name in Cloudflare.

> Image optimisation is already turned off in `next.config.ts` (`images.unoptimized: true`), because Cloudinary handles it. Nothing to do here.

### 4. Create `.env.production`
Create this file in the project root. It is git-ignored, so it never gets committed.
```
NEXT_PUBLIC_CONVEX_URL=https://<your-prod-name>.convex.cloud
NEXT_PUBLIC_WHATSAPP_NUMBER=234XXXXXXXXXX
```
These values are baked into the site at **build time**. If you change one, rebuild and redeploy.

### 5. Log in to Cloudflare
```bash
yarn wrangler login
```

### 6. Connect the domain (after the first deploy)
The domain's DNS must be on Cloudflare. If it isn't, add the site in Cloudflare and switch your registrar's nameservers to Cloudflare's.

**Domains & Routes only shows up after `yarn deploy` has run once.** Until then, Workers & Pages says "No projects found" and there is nothing to click. After the first deploy:

1. Go to **Workers & Pages** and click the **pechies-scents** card in the list.
2. Open the **Settings** tab.
3. Under **Domains & Routes**, click **+ Add** → **Custom domain**, enter `pechiesscents.com`, and save. Repeat for `www.pechiesscents.com` if you want it too.

The sitemap, canonical links and social previews use `SITE_URL` in `lib/store.ts`, so the live domain must match it.

---

## Part B — Every deploy

```bash
yarn convex deploy   # only if anything in convex/ changed
yarn preview         # optional: test on the Workers runtime at http://localhost:8787
yarn deploy          # build + upload the site
```
The site is live at `https://pechies-scents.<subdomain>.workers.dev` and at your custom domain.

Products and the hero image edited in `/dashboard` save straight to Convex and show up on the live site immediately. You don't need to redeploy for those.

---

## Optional — Auto-deploy on every git push

Instead of running `yarn deploy` by hand:

1. Push the repo to GitHub.
2. In Cloudflare, go to **Workers & Pages → Create → Import a repository** and pick the repo.
3. Use these settings:
   - **Build command:** `yarn opennextjs-cloudflare build`
   - **Deploy command:** `yarn opennextjs-cloudflare deploy`
4. Under **Settings → Build → Variables**, add `NEXT_PUBLIC_CONVEX_URL` and `NEXT_PUBLIC_WHATSAPP_NUMBER`. Cloudflare can't see `.env.production`.

Convex changes still need `yarn convex deploy` from your machine.

---

## Troubleshooting

- **`error Command "dlx" not found`:** you're on Yarn 1. Use `npx` for that command instead.
- **`EPERM: operation not permitted ... esbuild.exe` during `yarn add`/`install`:** `next dev` or `convex dev` is holding the file open. Stop them, then rerun.
- **Build fails on Windows:** run the commands inside WSL, or use the auto-deploy option, where Cloudflare builds on Linux.
- **Site loads but shows no products:** `NEXT_PUBLIC_CONVEX_URL` is missing or points at the dev deployment. Fix it, then rebuild and redeploy.
- **Dashboard login or image upload fails:** the Convex **production** env vars from step 2 are missing.
- **"Function not found" errors:** you changed `convex/` but didn't run `yarn convex deploy`.

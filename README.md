# Pool Log

A single-page tool for tracking pool chemical readings (Free Chlorine, Combined
Chlorine, pH, Alkalinity, Cyanuric Acid, Calcium Hardness) with a dashboard,
test history, target-range editor, and a history chart per parameter.

It's one self-contained file: `index.html`. No build step, no dependencies to
install.

## Running it locally

Just open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Deploying

Any static host works, since it's a single HTML file.

**GitHub Pages**
1. Push this repo to GitHub.
2. Repo Settings → Pages → Source: deploy from the `main` branch, root folder.
3. Your site will be live at `https://<username>.github.io/<repo>/`.

**Netlify / Vercel / Cloudflare Pages**
- Drag-and-drop the folder in Netlify's dashboard, or
- `vercel` / `netlify deploy` from this directory, or
- Connect the GitHub repo for automatic deploys on push.

No build command or output directory is needed — it's a static file.

## Data storage

The page tries, in order:

1. **Claude's artifact storage** — automatic, only applies when this file is
   opened inside a claude.ai artifact.
2. **A Cloudflare Pages Function + KV API** (`/api/pool-tests`, `/api/pool-ranges`)
   — if you set it up (see below), this makes your data the same across every
   device and browser, since it's stored server-side instead of locally.
3. **`localStorage`** — the fallback with no setup required. Data stays on
   whichever device/browser you're using; nothing syncs.

If you skip the Cloudflare setup entirely, the site still works fine on tier 3
— you'll just want to use **Export**/**Import** to move data between devices.

### Setting up cross-device sync (Cloudflare KV)

This repo already includes the Function (`functions/api/[key].js`) and a
`wrangler.toml` with a placeholder KV binding. To turn it on:

1. **Create the KV namespace:**
   ```bash
   wrangler kv namespace create POOL_KV
   ```
   This prints an `id` — put it in `wrangler.toml` in place of
   `REPLACE_WITH_YOUR_KV_NAMESPACE_ID`.

2. **Bind it in the Cloudflare dashboard** (needed for the deployed site, not
   just local dev): Pages project → Settings → Functions → KV namespace
   bindings → add `POOL_KV` pointing at the namespace you just created.

3. **Set a passcode:** Pages project → Settings → Environment variables → add
   `POOL_PASSCODE` with a value only you know. This protects the API — without
   it, anyone with your site's URL could read or overwrite your data.

   For local dev, copy `.dev.vars.example` to `.dev.vars` and put your
   passcode there instead (it's gitignored, so it won't get committed).

4. **Deploy** (push to GitHub with the repo connected to Pages, or
   `wrangler pages deploy .`).

5. **First visit after that:** the site will prompt you once for the
   passcode, then remember it in that browser's `localStorage` under
   `pool-api-key`. Enter the same passcode on each device you use, and
   they'll all read/write the same data.

This is a single shared passcode, not real per-user auth — enough to keep a
personal tool private, but don't reuse a password you use elsewhere for it.

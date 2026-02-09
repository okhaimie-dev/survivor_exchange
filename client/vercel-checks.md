# Vercel 404 – Checks to run

Use this to confirm your app builds and to compare with Vercel.

## 1. Local build (same as Vercel)

From the **repo root** (same as Vercel):

```bash
cd client
npm install
npm run build
```

- Must finish with **no errors**.
- You should see: `✓ Compiled successfully`, `✓ Generating static pages`, and a list of routes.

Then check output:

```bash
# From repo root
ls -la client/.next
ls -la client/.next/static
```

- `client/.next` and `client/.next/static` must exist after a successful build.

## 2. Local production serve (optional)

```bash
cd client
npm run build
npm run start
```

- Open http://localhost:3000 – the app should load (no 404).
- If it works locally but not on Vercel, the problem is in Vercel config or the deployed branch.

## 3. Vercel project settings

In [Vercel Dashboard](https://vercel.com/dashboard) → your project → **Settings**:

| Setting | Expected value |
|--------|-----------------|
| **Root Directory** | `client` (no leading `/`) |
| **Framework Preset** | Next.js |
| **Build Command** | (empty – use default) or `npm run build` |
| **Output Directory** | (empty – use default) |
| **Install Command** | (empty) or `npm install` |

- **Override** is off for Build/Output/Install unless you need a custom value.

## 4. Vercel build logs

In **Deployments** → latest deployment → **Building**:

- **Installing dependencies** should run inside `client` (path in logs should include `client`).
- You should see `next build` (or `npm run build`).
- Look for: `✓ Compiled successfully`, `✓ Generating static pages`, and the **Route (app)** table with `/`, `/auction/[id]`, etc.

If you see **"No Output"** or no routes, the build didn’t produce a valid Next.js output.

## 5. Deployed branch and repo layout

- **Which branch** is set as Production (e.g. main)?
- That branch **must** contain a **`client`** folder at the repo root with:
  - `package.json`
  - `next.config.ts`
  - `app/layout.tsx`
  - `app/page.tsx`

Check on GitHub:

- Repo → switch to that branch → confirm `client/` exists and has the app (not only docs/scripts).

If the deployed branch doesn’t have `client/` (e.g. empty main or different layout), set **Root Directory** to the folder that actually contains the Next.js app, or deploy a branch that has `client/` at the root.

## 6. Quick branch layout check (from repo root)

```bash
git show HEAD:client/package.json 2>/dev/null | head -5 || echo "No client/package.json on current branch"
git show HEAD:client/app/page.tsx 2>/dev/null | head -3 || echo "No client/app/page.tsx on current branch"
```

- If both commands print content, the current branch has the app under `client/`.
- Run with the branch Vercel deploys (e.g. `git show main:client/package.json`) to confirm that branch.

## 7. Redeploy after changes

After changing **Root Directory** or **Framework Preset**:

- **Deployments** → **…** on latest → **Redeploy** (no cache if you want a clean build).

---

**Summary:** Build must succeed in `client/` locally. On Vercel, Root Directory must be `client`, the deployed branch must contain `client/` with the app, and the build logs must show a successful Next.js build and a list of routes. If the deployed branch doesn’t have `client/`, fix the branch (e.g. merge or push the correct tree) or point Root Directory at the folder that does.

# Free deploy — Neon + Vercel

Everything here is on a free tier: **$0/month**, no credit card needed (Neon
only asks for one if you enable paid features — skip that).

| Piece | Service | Free allowance |
| ----- | ------- | --------------- |
| Database | [Neon](https://neon.tech) Postgres | 0.5 GB, ~1919 compute-hours/month, auto-suspends when idle |
| Hosting | [Vercel](https://vercel.com) | 100 GB bandwidth/month, hobby plan |

---

## Step 1 — Get your free Neon URL (about 2 minutes)

1. Go to **https://console.neon.tech** and sign up (Google/GitHub login is fine).
2. Click **Create a project**.
   - **Project name:** `lumistream2`
   - **Postgres version:** 16 or 17 (either works)
   - **Region:** closest to your users — e.g. `AWS Europe (Frankfurt)` or
     `AWS US East (Ohio)`
   - **Plan:** choose the **Free** plan
3. Neon may then offer a "Launch it with GitHub, Vercel, or Cloudflare" panel.
   **Close it.** You will connect it manually in Step 4 so nothing is created
   twice.
4. When the project exists you land in the console. Open the **Connection
   details** panel (bottom right, or the `Connect` button).
5. Copy the **Pooled connection** string. It looks like:

   ```
   postgresql://lumistream2:AbCdEf123456@ep-cool-name-a1b2c3de-f34g.us-east-2.aws.neon.tech/lumistream2?sslmode=require
   ```

   > The host contains `-pooler`. That is the pooled endpoint and it is the
   > right one for a serverless deployment.

6. Treat the string like a password — anyone holding it can read and write your
   database.

**You now have the one value you need: the Neon connection string.**

---

## Step 2 — Push your code to GitHub

```bash
git init
git add .
git commit -m "ready for free deploy"
git remote add origin https://github.com/YOURNAME/lumistream2.git
git push -u origin main
```

`.env` is gitignored, so your secrets stay on your machine. Only `.env.example`
is committed.

---

## Step 3 — Create the schema on Neon

Install the Postgres driver Prisma needs, once:

```bash
npm install pg @types/pg
```

Then, with your Neon URL in `.env`:

```bash
npx prisma db push        # creates every table
node prisma/seed.mjs      # optional: demo channels, packages, admin account
```

Use `db push`, not `migrate` — this is a fresh database with no history to
replay.

---

## Step 4 — Deploy to Vercel

1. **https://vercel.com** → **Add New…** → **Project** → import your repo.
2. **Framework Preset:** Next.js (detected automatically).
3. Click **Deploy**.

The build runs `prisma generate` via the `postinstall` script, so there is
nothing to change under Build & Deployment.

### Add the environment variables

Project → **Settings** → **Environment Variables**. Add these for **Production**
(and for **Preview** as well if you want preview deployments to work):

| Name | Value |
| ---- | ----- |
| `DATABASE_URL` | your Neon pooled connection string |
| `JWT_SECRET` | long random string (generate below) |
| `STREAM_SECRET` | another long random string |
| `NEXT_PUBLIC_SITE_URL` | `https://your-app.vercel.app` |
| `ADMIN_EMAIL` | `admin@yourdomain.com` |
| `ADMIN_PASSWORD` | a strong password |
| `ADMIN_NAME` | `Platform Admin` |
| `PAYMENT_PROVIDER` | `manual` |
| `PAYMENT_WEBHOOK_SECRET` | another random string |

Generate the three secrets locally — they never leave your machine except into
Vercel's encrypted store:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Run it three times.

### Redeploy

Saving environment variables does **not** restart the app. Afterwards go to
**Deployments → ⋯ → Redeploy**.

---

## Step 5 — Verify

1. Open the deployment URL — the LumiStream home page should load.
2. Go to `/login` and sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
3. Open `/admin`. The dashboard must load with your seeded data.

An empty dashboard means the seed did not run. Do it from your machine:

```bash
node prisma/seed.mjs
```
---

## Optional — attach Neon to Vercel properly

The manual `DATABASE_URL` above works fine. If you would rather have Vercel
inject it: Project → **Integrations** → add **Neon** → pick the project. Vercel
sets `DATABASE_URL`, `PGHOST`, `DATABASE_USER` and friends for you.

---

## Troubleshooting

**`Can't reach database server at ...`**
The URL has a typo. Neon URLs must keep `?sslmode=require`.

**`P1001` right after the project auto-suspended**
Neon wakes on first connect but can take about a second. Retry the page once.

**`error: relation "User" does not exist`**
`prisma db push` never ran against this database. Go back to Step 3.

**Home page loads but pages error in the browser console**
`DATABASE_URL` is missing, or was set for Preview only.

**Build fails with "Prisma schema validation" errors**
The generated client is stale: `npx prisma generate`, then rebuild.

**Deploys intermittently fail with `too many connections`**
You are on the direct endpoint. Re-copy the URL from Neon and check the host
contains `-pooler`.

---

## Keeping the cost at zero

Neon suspends compute after 5 minutes idle and keeps your data, so an app nobody
visits costs nothing. The free plan gives 0.5 GB of storage, ~1919
compute-hours/month and one project — the schema plus a year of demo traffic
fits comfortably.

If you need more headroom later, the other free options are
[Supabase](https://supabase.com) (500 MB), [Turso](https://turso.tech) (5 GB
libSQL) and [Railway](https://railway.app) (trial credit, persistent volume for
SQLite). Swapping is just a different connection string — the app is otherwise
provider-agnostic, and the `Json` columns Postgres supports natively.

---

## Running locally against the same database

Nothing above is production-only. To develop locally against your free Neon DB
instead of Docker, put the same Neon URL in `.env`:

```
DATABASE_URL="postgresql://...@ep-....neon.tech/lumistream2?sslmode=require"
```

Then `npm run setup`. One schema, one database, no extra installs.

If you prefer a purely local database, `docker-compose.yml` is included:

```bash
docker compose up -d
npm run setup
```

The credentials in that file are throwaway local ones and must never be used
anywhere else.
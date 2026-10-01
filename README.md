# LumiStream 2

A full-stack OTT / IPTV platform: live TV channels, an on-demand catalogue,
packages with entitlements, a checkout flow, a support desk and a complete
back office. Built with **Next.js 16 (App Router)**, **React 19**, **Prisma**
and **PostgreSQL**.

> Deploying for free? See **[FREE_DEPLOY.md](./FREE_DEPLOY.md)** — a
> step-by-step Neon + Vercel walkthrough on $0/month.

---

## Quick start

```bash
npm install          # installs deps and generates the Prisma client
cp .env.example .env # then set a strong JWT_SECRET before deploying
docker compose up -d # local PostgreSQL on :5432
npm run setup        # prisma generate + db push + seed
npm run dev          # http://localhost:3000
```

Prefer not to install Docker? Put a hosted Postgres URL in `.env` instead —
the same database production will use — then run `npm run setup`. See
[Running locally against the same database](./FREE_DEPLOY.md#running-locally-against-the-same-database).

Seeded accounts:

| Role        | Email                     | Password       |
| ----------- | ------------------------- | -------------- |
| Admin       | `admin@lumistream.local`  | `ChangeMe!2024` |
| Demo viewer | `viewer@lumistream.local` | `Viewer!2024`  |

> Change both passwords immediately on any non-local deployment. The demo
> catalogue streams from Apple and Mux public HLS test assets — replace every
> `streamUrl` from **Admin > Channels** with your own licensed sources.

---

## What is included

### Public site
- **Home** — admin-editable hero, category tiles, featured/trending channel
  rails, latest releases, popular packages, how-it-works, CTA.
- **Channels** — search plus category / country / language / quality filters,
  all URL-driven so results are shareable and server-rendered.
- **Channel detail** — HLS player, entitlement gate, favourite toggle, the
  packages that include the channel, related channels.
- **Packages** and **Checkout** — plan comparison, order summary, card form
  (demo gateway) that activates the subscription on success.
- **Movies & Content** — type / genre / sort filters, detail pages with cast,
  director, trailer and genres.
- **Favourites**, **My account** (profile, password, subscription, billing,
  support tickets), **Support**, **About**, 404, and a password-reset flow.

### Admin (`/admin`)
Dashboard with KPIs and a 7-day traffic chart, CRUD for users, channels,
content, packages and languages, payments with a "mark as paid" action, the
support desk with replies and status workflow, analytics, audit log, appearance
and settings editors, and JSON backup / restore.

Every mutation runs through a Server Function in `app/admin/actions.ts` that
re-checks the admin role server-side, sanitises each field by name, writes an
audit entry and revalidates the affected routes.

---

## Architecture

```
app/
  layout.tsx           root layout — theme CSS vars, SiteProvider, toasts
  (site)/              public shell: header, footer, WhatsApp FAB
    channels/          list + [slug] detail
    content/           list + [slug] detail
    packages/  checkout/[slug]/  favorites/  account/
    about/  support/  login/  register/  forgot-password/  reset-password/
  admin/               back office (own chrome, admin-gated)
  api/
    auth/              login, register, logout, forgot/reset password
    account/           profile, password, subscription
    favorites/  locale/  me/  track/  support/
    payments/checkout/ demo gateway + subscription activation
    stream/[id]/       token (entitlement) + p (encrypted HLS proxy)
    admin/             backup export + restore
components/
  ui/                  Button, Input, Primitives, Icons, ToastProvider
  layout/  home/  cards/  forms/  player/  channels/  content/  account/  admin/
lib/
  auth.ts  prisma.ts  settings.ts  i18n/  data.ts  admin.ts  admin-lists.ts
  entitlements.ts  payments.ts  hls.ts  stream-token.ts  audit.ts
  validation.ts  rate-limit.ts  utils.ts  constants.ts  admin-fields.ts
prisma/
  schema.prisma        PostgreSQL — see the header comment for the Json notes
docker-compose.yml     local Postgres
```

### Database notes
PostgreSQL is the only supported provider — a serverless filesystem is
ephemeral and cannot hold a SQLite file. The move off SQLite also unlocked
native `jsonb`, so `Package.features`, `AuditLog.meta`, `AnalyticsEvent.meta`
and `Payment.metadata` are real `Json` columns instead of serialised strings.
Comma-separated display lists (`Channel.tags`, `Content.genres`,
`Content.cast`) intentionally stay `String`.

### Security model
- **Sessions** — httpOnly `ls_session` cookie holding a signed JWT.
- **Playback** — the browser never sees an upstream URL. It requests
  `/api/stream/[id]/token`, which checks entitlement and issues a short-lived
  HMAC token; `/api/stream/[id]/p` then decrypts the target (AES-256-GCM) and
  rewrites the manifest so **every** segment routes back through the proxy.
- **Entitlements** — admins always pass; `demoMode` opens the catalogue for
  evaluation; otherwise an active, unexpired subscription whose package
  contains the channel is required.
- **Optimistic routing** — `proxy.ts` (Next 16 `middleware`) only checks for the
  *presence* of a session cookie; the authoritative checks are `requireUser()`
  / `requireAdmin()` in `lib/auth.ts`.
- **Payments** — no card data is ever persisted, only a gateway reference.
- **Input** — every admin and public form is sanitised through
  `lib/validation.ts` (hex colours, http(s)-only URLs, internal-path-only
  links, length clamps).

---

## Scripts

| Command              | Purpose                                      |
| -------------------- | -------------------------------------------- |
| `npm run dev`        | Development server                           |
| `npm run build`      | Production build                             |
| `npm run start`      | Serve the production build                   |
| `npm run typecheck`  | `tsc --noEmit`                               |
| `npm run lint`       | ESLint                                       |
| `npm run db:push`    | Sync the schema to the database              |
| `npm run db:seed`    | Seed settings, languages, catalogue, accounts |
| `npm run db:reset`   | Drop, re-push and re-seed                    |
| `npm run db:studio`  | Prisma Studio                                |
| `npm run db:backup`  | Write a JSON snapshot to `backups/`          |
| `npm run db:restore` | Restore a snapshot (`-- --yes` to confirm)   |

`scripts/check-dict.mjs` verifies that all four locale bundles export exactly the
same key set as the English reference.

---

## Internationalisation

Four bundled locales — **ar** (default, RTL), **en**, **fr**, **es**. `en` is
the reference bundle; the others are typed against it, so a missing key is a
compile error. The root layout serialises the active dictionary into
`SiteProvider`, so client components call `t()` without shipping every bundle.

Add a language from **Admin > Languages**; locales without a bundle fall back
to English while still being selectable.

---

## Configuration

| Variable                   | Required | Notes                                        |
| -------------------------- | -------- | -------------------------------------------- |
| `DATABASE_URL`              | yes      | Postgres connection string                   |
| `JWT_SECRET`               | yes      | 16+ chars; 32+ in production                 |
| `STREAM_SECRET`            | no       | Separate secret for playback tokens          |
| `NEXT_PUBLIC_SITE_URL`     | yes      | Canonical URL for metadata                   |
| `ADMIN_EMAIL/PASSWORD/NAME` | no     | Bootstrap admin used by the seed             |
| `PAYMENT_PROVIDER`         | no       | `manual` (default) — see `lib/payments.ts`  |
| `PAYMENT_WEBHOOK_SECRET`   | no       | Signature check for gateway webhooks         |
| `NEXT_PUBLIC_DEMO_MODE`    | no       | Demo content banner                          |

---

## Deployment

1. Set a strong `JWT_SECRET` (and ideally `STREAM_SECRET`).
2. Provision Postgres — free Neon in 2 minutes, see
   [FREE_DEPLOY.md](./FREE_DEPLOY.md).
3. `npm run setup` to create the schema, then `npm run build && npm run start`
   (or deploy to Vercel, which runs the build for you).
4. Replace every seeded demo `streamUrl` and the admin password.

There is no mail transport wired up: `POST /api/auth/forgot-password` returns
the reset link in the response body **outside production** so the flow is
testable locally — send it with your mailer before going live.
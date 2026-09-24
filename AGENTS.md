# AGENTS.md

Guidance for anyone (developer or coding agent) changing the code in this repository.
Start with README.md to run it; the other docs are listed there.

## What this is

LeBonBureau — a French-language e-commerce storefront for ergonomic desks aimed at the
Tunisian market (prices in **DT**, cash-on-delivery, French copy throughout). Next.js 15
(App Router) + React 19 + TypeScript shop at the repo root, with a **Medusa v2** backend in
`backend/` (Postgres; Redis in production).

## Commands

```bash
# Shop (repo root)
npm run dev          # dev server → http://localhost:3000 (3001 if taken)
npm run build        # production build (also the fastest full typecheck — there is no separate test suite)

# Backend (backend/) — needs Postgres; DATABASE_URL in backend/.env
npm run dev          # Medusa API → http://localhost:9000, admin → http://localhost:9000/app
npx medusa db:migrate
npm run seed         # store setup + 6 desks; safe to run again, adds only what's missing (SEED.md)
npx medusa user -e <email> -p <password>   # create an admin
npx tsc --noEmit -p .                     # backend typecheck (admin widgets: -p src/admin)
```

There are **no automated tests**. Verify with `npm run build` (shop), the backend typecheck,
and by running both apps. The shop's pages need the backend running (they fetch from it on
every request). Deployment: `DEPLOY.md` (Docker Compose + Caddy on a VPS).

**Database:** local dev uses Postgres.app (PostgreSQL 18) on `127.0.0.1:5434`, database
`lebonbureau`, user `postgres`, no password — see `DATABASE.md` (also DBeaver setup).

Shop env (`.env.local`): `NEXT_PUBLIC_MEDUSA_BACKEND_URL`, `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`
(printed by the seed), optional `MEDUSA_BACKEND_URL` (internal URL for server rendering),
`NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_META_PIXEL_ID`, `NEXT_PUBLIC_GA_ID`. `NEXT_PUBLIC_*` values
are baked in at build time. Backend env: `backend/.env.example`.

## Architecture

**Two apps.** The shop (`app/`, `components/`, `lib/`) only talks to Medusa's Store API. The
admin is Medusa's own dashboard, extended with widgets in `backend/src/admin/widgets/`; the
shop's `/admin` just redirects there. `app/layout.tsx` wraps everything in `CartProvider` +
`ToastProvider` and loads the Meta Pixel / GA4 scripts when their IDs are set.

**Single Medusa client.** `lib/medusa.ts` exports one `sdk` (JS SDK + publishable key) and
`getRegionId()` (the one Tunisia region). **Never call the SDK from a component** — go
through the `lib/` helpers:
- `lib/products.ts` — `getProducts` / `getProduct(handle)` (maps `StoreProduct` → `Product`),
  `getCategories`, `featuredProduct`. Everything that fetches from Medusa is `force-dynamic`
  (the backend isn't reachable at build time); the storefront layout is too, because the
  footer lists the categories.
- `lib/cart.tsx` — `CartProvider` + `useCart`. The cart lives in Medusa; only its id is in
  localStorage (`lbb_cart_id`). Line items carry `{color, size, category}` metadata.
- `lib/orders.ts` — `placeOrder(cartId, delivery)` / `placeExpressOrder(entry, delivery)`:
  address → first shipping option → `pp_system_default` payment session → `cart.complete`.
- `lib/track.ts` — Meta Pixel helpers and traffic-source capture; `trackingContext()` is
  merged into the cart metadata at checkout.
- `lib/data.ts` — the `Product` / `Variant` types, governorates, price/image helpers.

**Nothing about the catalogue is hard-coded in the shop.** Products, prices, stock, photos,
categories and the landing page's featured content all come from Medusa:
- Hero: the desk badged `Best-seller` (else the first) + the number of desks.
- Green band: a photo of the desk badged `Nouveau` (else another desk).
- Listing chips and footer catalogue links: Medusa categories; `/?categorie=<handle>` pre-filters.
Only editorial copy (FAQ, legal pages, trust bar) is written in the code.

**Product mapping.** Options titled `Finition` (colours) and `Dimensions` (sizes) drive the buy
box; each combination is a variant with its own price and stock. `oldPrice` = the variant's
`original_amount` when a sale price list applies. Shop-only fields live in `product.metadata`:
`blurb`, `badge`, `rating`, `reviews`, `colors` (name → hex), `specs`, `features`
(`[label, value][]`), `orders_count` (kept by a subscriber). The admin "Fiche produit" widget
edits them — when you add one, update `toProduct` in `lib/products.ts` and that widget together.

**Backend custom code** (`backend/src/`):
- `api/admin/orders/[id]/cod-status/route.ts` — COD status: `nouvelle → vue → appelee →
  livree` (+ `annulee`), stored in `order.metadata.cod_status`. `livree` fulfils, marks
  delivered, captures payment and completes the order; `annulee` runs `cancelOrderWorkflow`;
  `appelee` sends the Meta `Purchase` event once (`lib/meta-capi.ts`).
- `subscribers/order-cart-details.ts` — copies cart metadata onto the order (Medusa doesn't).
- `subscribers/product-order-count.ts` — `order.placed` / `order.canceled` → `orders_count`.
- `admin/widgets/` — order COD box, "Commandes à traiter" list, product sheet editor.
- `scripts/seed.ts` — store setup (once, skipped if the "Tunisie" region exists) + the sample
  catalogue: creates only the categories/desks whose handle doesn't exist yet, never updates
  existing ones, never recreates a desk deleted in the admin. Details in `SEED.md`.

## Design system — the one hard rule

Read `DESIGN.md` before touching UI. **Never hardcode a colour, radius, shadow, spacing, or
button style** — reference a CSS variable (token) from `app/globals.css` `:root`, and reach
for an existing component before writing new markup. Every CTA is `<Button variant size block
href>`. Landing blocks are individual components in `components/sections/`. CSS is split:
`app/globals.css` (tokens + primitives), `styles/storefront.css` (page sections). Admin
widgets use `@medusajs/ui` instead. Sample product photos come from the Pexels CDN.

## Conventions

- Comments and UI copy are in **French**; keep that voice. Money is DT, payment is COD.
- Path alias `@/*` maps to the repo root (the root `tsconfig.json` excludes `backend/`).
- Order refs shown to customers are `#LBB-<display_id>`, matching the admin's order number.
- Docs are in English and use plain words: README (run), DATABASE, SEED, DEPLOY, DESIGN, AGENTS.
  Update the matching doc when you change how something is run or set up.
- `credentials.md` (git-ignored) holds local logins. Never commit secrets or `.env` files.

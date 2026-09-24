# LeBonBureau

French e-commerce shop for ergonomic gaming / programming desks, built for the
Tunisian market (prices in **DT**, cash on delivery, French copy).

- **Shop:** Next.js (App Router) + TypeScript, in this folder.
- **Backend:** [Medusa](https://medusajs.com) v2 in `backend/`. It runs the
  catalogue, stock, cart, orders, cash-on-delivery payment and the admin dashboard.

## Docs

| File | What it covers |
| --- | --- |
| [README.md](README.md) | This page: run the project, routes, structure |
| [DATABASE.md](DATABASE.md) | Local and production database, connecting with DBeaver |
| [SEED.md](SEED.md) | The seed script: what it creates and how to run it |
| [DEPLOY.md](DEPLOY.md) | Putting it online on a VPS (Docker Compose + HTTPS) |
| [DESIGN.md](DESIGN.md) | Design system rules for the shop UI |
| [AGENTS.md](AGENTS.md) | Architecture and code rules for anyone changing the code |

## Run locally

You need **Node 20+** and **PostgreSQL 15+** ([Postgres.app](https://postgresapp.com)
on a Mac). Redis is not needed locally.

### First time

```bash
# 1. Database (see DATABASE.md). Postgres.app uses port 5432 unless you changed it.
/Applications/Postgres.app/Contents/Versions/latest/bin/createdb -h 127.0.0.1 -p 5432 -U postgres lebonbureau

# 2. Backend
cd backend
npm install
cp .env.example .env              # check DATABASE_URL (port and database name)
npx medusa db:migrate             # create the tables
npm run seed                      # store, Tunisia/DT, COD, free delivery, 6 desks; prints a pk_ key
npx medusa user -e admin@lebonbureau.tn -p lebonbureau   # local admin login

# 3. Shop (from the project root)
cd ..
npm install
cp .env.example .env.local        # paste the pk_ key into NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
```

### Every day

Make sure Postgres.app is running, then use two terminals:

```bash
# Terminal 1: backend (API on http://localhost:9000, admin on http://localhost:9000/app)
cd backend && npm run dev
```

```bash
# Terminal 2: shop (http://localhost:3000, or 3001 if 3000 is taken)
npm run dev
```

Start the backend first: the shop loads every product from it, so its pages fail
while the backend is down. The admin shows "Failed to fetch" for the same reason.

`npm run build` is the full typecheck for the shop. `cd backend && npx tsc --noEmit -p .`
checks the backend. There is no test suite.

## Routes

| Route | Page |
| --- | --- |
| `/` | Landing: hero, catalogue listing (filterable by category, also with `?categorie=<handle>`), green band, "bien choisir", contact |
| `/product/[handle]` | Product detail: gallery, finish/size, add to cart, **express cash-on-delivery order**, specs, related |
| `/cart` | Cart with live quantity / remove + order summary |
| `/checkout` | 3-step delivery form → inline confirmation |
| `/faq` · `/livraison-retours` · `/mentions-legales` | Content / legal pages |
| `/admin` | Redirects to the Medusa admin (`<backend>/app`) |
| `/sitemap.xml` · `/robots.txt` | SEO |

## Structure

```
app/                      Next.js pages (storefront route group + sitemap/robots)
components/               Button, SiteHeader/Footer, ProductCard, ProductBuyBox, Analytics, sections/
lib/
  medusa.ts               The one Medusa JS SDK client + Tunisia region lookup
  products.ts             getProducts / getProduct / getCategories (Store API → shop types)
  cart.tsx                CartProvider + useCart — the cart lives in Medusa, its id in localStorage
  orders.ts               placeOrder / placeExpressOrder (address → free delivery → COD → order)
  track.ts                Meta Pixel events + traffic source (UTM, referrer, Facebook click id)
  data.ts                 Product type, governorates, price/image helpers
styles/                   storefront.css (page sections)
app/globals.css           Design system (tokens, primitives)
backend/
  medusa-config.ts        Medusa settings (Redis modules turn on when REDIS_URL is set)
  src/scripts/seed.ts     Store setup + sample catalogue, safe to run again (SEED.md)
  src/api/admin/orders/[id]/cod-status/   COD status route (vue → appelée → livrée / annulée)
  src/lib/meta-capi.ts    Sends the confirmed Purchase to Meta (Conversions API)
  src/subscribers/        Copy cart details onto the order; keep each desk's order count
  src/admin/widgets/      Admin add-ons: COD tracker, "Commandes à traiter", product sheet editor
```

## How the shop uses Medusa

- **Products** are Medusa products. Finishes and sizes are the `Finition` and
  `Dimensions` options, and each combination is a variant with its own stock.
  A crossed-out price comes from a *sale* price list ("Soldes"). Shop-only text
  (short blurb, badge, rating, specs, highlights, swatch colours) lives in
  `product.metadata` and is edited in the admin under **Fiche produit (boutique)**.
- **Categories** are Medusa categories. The filter chips on the landing page and
  the footer's catalogue links follow them.
- **Landing page:** the hero shows the desk whose badge is **Best-seller** (else
  the first desk) and the number of desks. The green band shows a photo of the
  desk badged **Nouveau**. Change the badge in the admin to change what's shown.
- **Orders** go through the normal Medusa cart flow and are paid with Medusa's
  manual provider (`pp_system_default`), which is cash on delivery.
  The delivery landmark, notes and traffic source are saved in the order metadata.
- **Order follow-up** happens in the Medusa admin. On each order, the
  **Paiement à la livraison** box moves it through *Nouvelle → Vue → Appelée →
  Livrée* (or *Annulée*). *Livrée* creates the shipment, marks it delivered,
  records the cash payment and closes the order in one click. The orders list
  starts with a **Commandes à traiter** panel.
- **Tracking:** set `NEXT_PUBLIC_META_PIXEL_ID` (shop) plus `META_PIXEL_ID` /
  `META_CAPI_TOKEN` (backend). See DEPLOY.md, section 9.

Product photos come from the Pexels CDN in the sample data. Photos uploaded in
the admin are stored by Medusa (`backend/static`, or a Docker volume in production).

## Demo

[Open the demo](https://lebonbureau.alabaganne.com).

![LeBonBureau screenshot](https://raw.githubusercontent.com/alabaganne/Portfolio/main/public/projects/lebonbureau-demo.jpg)

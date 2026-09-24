# Seed script

`backend/src/scripts/seed.ts` fills an empty Medusa database with everything the
shop needs. Run it on every new database: your computer, a new developer's
computer, or the VPS.

## What it creates

The first time (when there is no "Tunisie" region yet):

- The store "LeBonBureau", with the Tunisian dinar (DT) as its only currency.
- The **Tunisie** region, paid by cash on delivery (`pp_system_default`).
- A tax region for Tunisia.
- The stock location "Entrepôt LeBonBureau" (Tunis).
- Delivery: one shipping option, "Livraison offerte", free, anywhere in Tunisia.
- The **publishable API key** the shop uses to call Medusa, linked to the sales channel.

Every time:

- The categories from `CATEGORIES`: Assis-debout, Programmation, Gaming.
- The desks from `DESKS`: Atlas, Nova, Vector, Pulse, Quartz, Liné. For each desk:
  - options `Finition` (colours) and `Dimensions` (sizes), with one variant per pair;
  - photos (Pexels CDN), text, and shop fields in `metadata` (blurb, badge, specs,
    highlights, swatch colours);
  - stock at the warehouse (`stock`, per variant);
  - a sale price when `oldPrice` is set. The base price is the old price, and the
    **Soldes** price list holds the real price, so the shop shows it crossed out.

At the end it prints the publishable key (`pk_...`).

## Safe to run again

Running the seed a second time does not duplicate anything:

- The store setup runs only once. If the "Tunisie" region exists, it is skipped.
- A category or desk is added only if no item with the same handle exists.
- A desk you **deleted in the admin is not created again**.
- An existing desk is **never changed**. Edit prices, stock, photos and text in
  the admin, not in the seed.

So to add a new sample desk to an existing store: add it to `DESKS` and run the
seed again. Only the new desk is created.

## How to run it

### On your computer

The backend `.env` must point at your database (see [DATABASE.md](DATABASE.md)).

```bash
cd backend
npx medusa db:migrate    # create or update the tables
npm run seed             # prints the pk_ key at the end
```

From the project root, `npm run backend:seed` does the same as `npm run seed`.

Then:

1. Put the `pk_` key in the shop's `.env.local`, as
   `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=pk_...`, and restart the shop.
2. Create an admin account (the seed does not create users):

   ```bash
   cd backend
   npx medusa user -e admin@lebonbureau.tn -p lebonbureau
   ```

You can find the key again later in the admin: *Settings → Publishable API Keys*.

### On the VPS (Docker)

Medusa runs its migrations by itself when it starts. Then:

```bash
docker compose exec medusa npx medusa exec ./src/scripts/seed.js
```

In the Docker image the script is already compiled, which is why it ends in `.js`.
Put the printed key in the VPS `.env` (`MEDUSA_PUBLISHABLE_KEY`) and rebuild the
shop. See [DEPLOY.md](DEPLOY.md), steps 5 and 6.

## Start again from zero (local only)

This deletes all local products, orders and users.

```bash
PG=/Applications/Postgres.app/Contents/Versions/latest/bin
$PG/dropdb -h 127.0.0.1 -p 5434 -U postgres lebonbureau
$PG/createdb -h 127.0.0.1 -p 5434 -U postgres lebonbureau
cd backend
npx medusa db:migrate
npm run seed
npx medusa user -e admin@lebonbureau.tn -p lebonbureau
```

A new database gets a new `pk_` key, so update `.env.local` afterwards.

## Notes on the sample data

- The photos are placeholders from Pexels. Replace them with real photos of your
  desks in the admin (product page → Media).
- Pulse, Quartz and Liné start with a stock of 10 per variant. Set the real
  numbers in the admin (*Inventory*).
- `rating` and `reviews` in the metadata are sample numbers. The product page
  shows them only once a desk has 10 real orders, and they are never sent to
  Google. Clear them in the admin (*Fiche produit*) before launch, or replace
  them with real reviews.

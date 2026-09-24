# Deploying LeBonBureau on a VPS

Everything runs on one VPS with Docker Compose:

| Service | What it does | Public address |
| --- | --- | --- |
| `caddy` | HTTPS (free Let's Encrypt certificates) and routing | ports 80 / 443 |
| `storefront` | The Next.js shop | `https://DOMAIN` |
| `medusa` | Medusa API + admin dashboard | `https://API_DOMAIN` (admin at `/app`) |
| `postgres` | Database | not public (DBeaver through SSH: see DATABASE.md) |
| `redis` | Events, jobs and locks for Medusa | not public |

The files involved are `docker-compose.yml`, `Caddyfile`, `Dockerfile` (shop),
`backend/Dockerfile` (Medusa) and `deploy.env.example`.

## 1. What you need

- A VPS running Ubuntu 22.04 or 24.04 with **at least 2 GB of RAM** (4 GB is more
  comfortable, because the builds use a lot of memory).
- A domain name. In your DNS, add two `A` records that point to the VPS IP:
  - `lebonbureau.tn` (and `www.lebonbureau.tn` if you want it)
  - `api.lebonbureau.tn`
- Ports 80 and 443 open in the VPS firewall.

## 2. Install Docker

```bash
ssh root@YOUR_VPS_IP
curl -fsSL https://get.docker.com | sh
docker compose version    # should print a version
```

With only 2 GB of RAM, add some swap so the builds don't run out of memory:

```bash
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

## 3. Get the code and fill in the settings

```bash
git clone https://github.com/YOUR_ACCOUNT/lebonbureau.git
cd lebonbureau
cp deploy.env.example .env
nano .env
```

In `.env`:

- `DOMAIN` and `API_DOMAIN`: your two domains.
- `POSTGRES_PASSWORD`, `JWT_SECRET`, `COOKIE_SECRET`: run `openssl rand -hex 32`
  three times and paste one value into each.
- Leave `MEDUSA_PUBLISHABLE_KEY` empty for now (step 5 gives it to you).
- The Meta and Google fields are optional (see section 8).

`.env` holds secrets. It is git-ignored; never commit it.

## 4. Start the database and Medusa

```bash
docker compose up -d --build postgres redis medusa
docker compose logs -f medusa     # wait for "Server is ready on port: 9000", then Ctrl+C
```

Database migrations run by themselves each time Medusa starts.

## 5. Load the store setup (once)

```bash
docker compose exec medusa npx medusa exec ./src/scripts/seed.js
```

This creates the Tunisia region (DT), free delivery, cash on delivery, the stock
location, the categories and the six sample desks. At the end it prints a key
that starts with `pk_`. Put it in `.env`:

```bash
nano .env    # MEDUSA_PUBLISHABLE_KEY=pk_...
```

Running it again is safe: it only adds categories and desks that don't exist yet
and never changes the ones you edited in the admin. Details in [SEED.md](SEED.md).

## 6. Create your admin account

```bash
docker compose exec medusa npx medusa user -e you@lebonbureau.tn -p 'A-STRONG-PASSWORD'
```

## 7. Start the shop and HTTPS

```bash
docker compose up -d --build storefront caddy
```

Caddy gets the HTTPS certificates on its own the first time someone visits.
This only works once DNS points at the VPS.

## 8. Check that it works

- `https://DOMAIN`: the shop.
- `https://API_DOMAIN/app`: the Medusa admin. Log in with the account from step 6,
  then pick French under *Settings → Profile → Language*.
- `https://API_DOMAIN/health`: should answer `OK`.
- Place a test order, then open it in the admin. The **Paiement à la livraison**
  box on the right shows its status.

## 9. Meta Pixel, Conversions API and traffic sources

In Meta Events Manager, open your pixel:

1. Copy the **Pixel ID** into `META_PIXEL_ID`.
2. Under *Settings → Conversions API → Generate access token*, copy the token into
   `META_CAPI_TOKEN`.
3. Optional: under *Test events*, copy the test code into `META_TEST_EVENT_CODE`
   so you can watch events arrive live. Empty it once you're done.
4. Apply the changes. The pixel ID is baked into the shop at build time, so the
   shop must be rebuilt:

   ```bash
   docker compose up -d --build storefront medusa
   ```

What gets sent:

| Event | Sent from | When |
| --- | --- | --- |
| `PageView`, `ViewContent`, `AddToCart`, `InitiateCheckout` | the browser (pixel) | while the visitor shops |
| `Purchase` | the server (Conversions API) | when you click **"Client appelé : commande confirmée"** on the order in the admin |

`Purchase` is sent only once the customer has confirmed on the phone, so Meta
learns from real buyers instead of fake orders. It carries the hashed phone,
name and city, plus the visitor's Facebook cookies (`_fbp` / `_fbc`), so Meta can
match it to the ad click. Meta accepts it up to 7 days after the order.

**Where your sales come from:** every order stores its source (UTM tags, the
referring site, or "Accès direct"). You see it in the order's **Paiement à la
livraison** box. Tag your ad links, for example:

```
https://lebonbureau.tn/product/atlas?utm_source=facebook&utm_medium=cpc&utm_campaign=rentree
```

For a full traffic report (visits, pages, countries), set `GA_ID` to a Google
Analytics 4 measurement ID (`G-XXXXXXX`) and rebuild the shop.

## 10. Updating the site

```bash
cd lebonbureau
git pull
docker compose up -d --build
```

Rebuild the shop (`--build storefront`) whenever you change a value it bakes in
at build time: `DOMAIN`, `API_DOMAIN`, `MEDUSA_PUBLISHABLE_KEY`, `META_PIXEL_ID`
or `GA_ID`.

## 11. Backups

The database and the uploaded product photos live in Docker volumes (`pg_data`,
`medusa_static`). Back up the database every night:

```bash
mkdir -p /root/backups
crontab -e
# add this line:
0 3 * * * cd /root/lebonbureau && docker compose exec -T postgres pg_dump -U medusa medusa | gzip > /root/backups/medusa-$(date +\%F).sql.gz
```

To restore a backup:

```bash
gunzip -c /root/backups/medusa-2026-01-01.sql.gz | docker compose exec -T postgres psql -U medusa medusa
```

Copy the backups somewhere off the VPS too (your computer, or cloud storage).

## 12. When something goes wrong

```bash
docker compose ps                    # is everything "running"?
docker compose logs -f medusa        # backend errors
docker compose logs -f storefront    # shop errors
docker compose logs -f caddy         # HTTPS / certificate problems
docker compose restart medusa
```

- **The shop shows no products or can't add to cart:** check
  `MEDUSA_PUBLISHABLE_KEY`, then rebuild the shop.
- **CORS error in the browser console:** `DOMAIN` / `API_DOMAIN` in `.env` must
  exactly match the addresses you open (no `www`, no trailing `/`).
- **No HTTPS certificate:** DNS doesn't point at the VPS yet, or port 80/443 is closed.
- **Build killed / out of memory:** add swap (section 2).

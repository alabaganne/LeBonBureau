# Database

Medusa keeps everything in one PostgreSQL database: products, stock, prices,
carts, orders, customers and admin users. The shop never talks to the database
directly; it goes through Medusa's API.

## Local database (Postgres.app)

This Mac runs PostgreSQL 18 with [Postgres.app](https://postgresapp.com). It
starts by itself when you log in and keeps its data in
`~/Library/Application Support/Postgres/var-18`, so nothing is lost when you restart.

| Setting | Value |
| --- | --- |
| Host | `127.0.0.1` (or `localhost`) |
| Port | `5434` |
| Database | `lebonbureau` |
| User | `postgres` |
| Password | none (leave it empty) |

The backend reads it from `backend/.env`:

```
DATABASE_URL=postgres://postgres@127.0.0.1:5434/lebonbureau
```

If the backend can't reach the database, open Postgres.app and check that
"PostgreSQL 18" shows *Running*. Click *Start* if it doesn't.

### New computer

1. Install [Postgres.app](https://postgresapp.com) and click *Initialize*. It
   uses port `5432` by default; use that port in `DATABASE_URL` (or change the
   port in Postgres.app's server settings).
2. Create the database:

   ```bash
   /Applications/Postgres.app/Contents/Versions/latest/bin/createdb -h 127.0.0.1 -p 5432 -U postgres lebonbureau
   ```

3. Fill the tables and create an admin: see [SEED.md](SEED.md).

Any other PostgreSQL 15+ works too (Homebrew, Docker). Only `DATABASE_URL` changes.

## Connect with DBeaver

1. *Database → New Database Connection → PostgreSQL → Next*.
2. *Main* tab:
   - Connect by: **Host**
   - Host: `localhost`, Port: `5434`
   - Database: `lebonbureau`
   - Authentication: *Database Native*, Username: `postgres`, Password: empty
3. Click *Test Connection*. If DBeaver offers to download the PostgreSQL driver, accept.
4. The first time, Postgres.app may ask whether DBeaver may connect. Click *OK*.
5. *Finish*. The tables are under `lebonbureau → Schemas → public → Tables`.

### Useful tables

| Table | What's in it |
| --- | --- |
| `product` | Desks (`handle`, `title`, `status`, `metadata` with the shop fields) |
| `product_variant` | One row per finish × size (`sku`, `title`) |
| `product_category` | Categories |
| `price`, `price_list` | Prices; the "Soldes" price list holds the sale prices |
| `inventory_item`, `inventory_level` | Stock per variant (`stocked_quantity`, `reserved_quantity`) |
| `order`, `order_item`, `order_address` | Orders; `order.metadata` holds the COD status (`cod_status`), landmark, notes and traffic source |
| `user` | Admin accounts |
| `api_key` | The publishable key used by the shop (`type = 'publishable'`) |

Most tables have a `deleted_at` column. A row with a date there was deleted in
the admin, so add `where deleted_at is null` to your queries.

Use DBeaver to **look** at data. Make changes in the Medusa admin
(http://localhost:9000/app): it keeps prices, stock, links and events in sync,
and editing tables by hand can break that.

## Production database (VPS)

In production, Postgres runs in Docker (see [DEPLOY.md](DEPLOY.md)). It only
listens on the VPS itself (`127.0.0.1:5432`), never on the internet.

| Setting | Value |
| --- | --- |
| Database | `medusa` |
| User | `medusa` |
| Password | `POSTGRES_PASSWORD` in the VPS `.env` |

**DBeaver (through SSH):** create a PostgreSQL connection with Host `localhost`,
Port `5432`, Database `medusa`, User `medusa` and the password above. Then, in
the *SSH* tab, tick *Use SSH Tunnel* and enter the VPS IP, user `root` and your
SSH key. DBeaver goes through SSH, so the database stays closed to the internet.

**Terminal on the VPS:**

```bash
docker compose exec postgres psql -U medusa medusa
```

Backups and restores are in [DEPLOY.md](DEPLOY.md), section 11.

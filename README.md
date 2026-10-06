# GadgetHub

**Genuine gadgets, delivered across Nigeria.**

GadgetHub is a full-stack electronics store: shoppers browse and filter
phones, laptops, wearables, gaming gear and accessories, pick a colour and
storage size, check out with Paystack or pay on delivery, and follow each
order from packing to their door. The shop's team runs everything from an
admin dashboard: products and photos, stock, sales, orders and customers.
Nothing in the shop is mock data; every product comes from the admin.

It is an npm-workspaces monorepo with a Vite React frontend and a TypeScript
Express API on MongoDB.

## 1. What it does

| For | Features |
| --- | --- |
| **Shoppers** | Home page with trending products, categories with live counts, **flash deals with a countdown** to the end of the sale, and new arrivals; shop page with search, category, price, brand, rating, stock and sale filters, sorting and pagination (all in the URL, so filtered pages can be shared); product pages with a photo gallery, colour and storage choices, specs, related products and share |
| **Cart & checkout** | Cart drawer and cart page that re-check prices and stock; checkout with saved addresses, all 36 states + FCT and their LGAs, doorstep delivery or free pickup, and **Paystack** (card, transfer, USSD) or pay on delivery |
| **Accounts** | Sign up, login, password reset by email; profile and address book; order history with a **tracking timeline**; pay again for an unpaid order, cancel before it ships, buy again; wishlist; **verified-buyer reviews** once an order is delivered |
| **Admin** | Dashboard with paid revenue, a 14-day revenue chart, orders to fulfil, low stock and recent orders; **add and edit products** with up to 6 photos (uploaded to Cloudinary), price and sale price with an end date, stock, trending, colours, storage options and specs; orders with search and filters, one-click status updates, recording cash payments and re-checking Paystack; customers with orders and spend |

## 2. Repository map

```text
apps/
  Client/              Vite + React 19 + Tailwind v4 web app (@gadgethub/client)
    src/Pages/         Shop, product, cart, checkout, wishlist, auth, account, admin
    src/Components/    Buttons, fields, cards, modals, the photo manager, the revenue chart
    src/Context/       Auth, cart and wishlist
    src/API/           One axios client + a service per area
  Server/              TypeScript Express + MongoDB API (@gadgethub/server)
    src/Routes/        Every route, in one file
    src/controller/    Request parsing (Zod) -> services
    src/Services/      The rules: catalog, orders and stock, Paystack, reviews, accounts
    src/Models/        Mongoose models
    src/emails/        Branded email templates
    src/db/migrate.ts  Converts the first version's data on start
    src/seeds/         The admin account and a starter catalog
packages/
  shared/              Types shared by Client and Server: the one place to edit them
scripts/
  sync-shared.mjs      Copies packages/shared into each app (src/types/shared.ts)
```

## 3. Getting started

You need Node 20+ and a MongoDB database (MongoDB Atlas free tier works).

```powershell
npm install                                       # from the repo root, installs every workspace
copy apps\Server\.env.example apps\Server\.env    # then fill in MONGO_URI and JWT_SECRET_KEY
npm run dev                                       # API on :5050, web app on :5173
```

Then make yourself an admin and, if you like, add the starter catalog:

```powershell
$env:ADMIN_EMAIL="you@example.com"; $env:ADMIN_PASSWORD="a-long-password"; npm run seed:admin
npm run seed:catalog    # 15 products with photos (needs the Cloudinary keys)
```

Sign in at `/admin/login`. The Client needs no `.env` locally; it talks to
the API on port 5050.

| Command | What it does |
| --- | --- |
| `npm run dev` | Runs the API and the web app together |
| `npm run typecheck` | Type checks every workspace |
| `npm run build` | Builds every workspace |
| `npm run seed:admin` | Creates the admin from `ADMIN_EMAIL` / `ADMIN_PASSWORD`, or promotes that account and resets its password |
| `npm run seed:catalog` | Adds 15 starter products, uploading their photos to Cloudinary. Skips names that exist |
| `npm run sync:shared` | Copies the shared types into each app (`build` and `typecheck` run it first) |

## 4. How the rules work

- **Prices come from the database.** The cart only says what and how many;
  the server prices every order, adds the delivery fee and keeps a copy of
  each item, so orders read the same after a product changes or is deleted.
- **Stock** is taken atomically when an order is placed (two people can't buy
  the last one), and goes back when an order is cancelled or a Paystack
  payment never starts.
- **Orders** move `pending` → `processing` → `shipped` → `delivered`, never
  backwards, and can be cancelled until delivered. A paid Paystack order goes
  straight to processing; a pay-on-delivery order is marked paid when
  delivered. Each step emails the customer.
- **Payments.** Paystack is confirmed twice over: when the shopper returns
  (the API verifies the reference and the amount with Paystack) and by the
  signed webhook. Either is enough; repeats change nothing.
- **Sales.** A product is on sale while its original price is above its price
  and its end date hasn't passed. The home page counts down to the first sale
  that ends.
- **Reviews** are only open to customers who received the product, one each.
- **Security.** Bcrypt passwords; logins revoked on password change; hashed,
  single-use reset links (30 min); roles checked on every admin request;
  rate limits on sign-in, resets, orders and uploads; photos uploaded through
  the API and only accepted from our Cloudinary account; only whitelisted
  fields accepted on every write.

## 5. Deployment

Both apps deploy from this repository: the web app on Vercel, the API on
Render. Pushing to `main` redeploys both.

| App | Host | Settings |
| --- | --- | --- |
| `apps/Client` | Vercel, https://gadget-hub-psi.vercel.app | Root Directory `apps/Client`, framework Vite, build `npm run build`, output `dist` |
| `apps/Server` | Render, https://gadgethub-server.onrender.com | Root Directory empty, build `npm ci --include=dev && npm run build -w @gadgethub/server`, start `npm run start -w @gadgethub/server`, health check `/api/health` |

**Render environment:** `MONGO_URI`, `JWT_SECRET_KEY` (long and random),
`CLIENT_URL`, the Cloudinary keys, and `BREVO_API_KEY` with `EMAIL_FROM` for
email (Render's free plan blocks Gmail's SMTP). Optional:
`PAYSTACK_SECRET_KEY`, `ADMIN_NOTIFY_EMAIL` for new-order alerts,
`DELIVERY_FEE`, `NODE_VERSION=22`. **Vercel environment:** `VITE_BASE_URL`, the
API's address. The first version's names (`MONGO_URL`, `JWT_SECRET`,
`FRONTEND_URL`, `CLOUD_NAME`, `VITE_AUTH_BASE_URL`) still work.

**Paystack:** set the webhook to `https://<api>/api/payments/paystack/webhook`.

**Data from the first version** (products, orders, users) is converted when
the API starts, so the same MongoDB database carries over.

A Vercel address other than `gadget-hub*.vercel.app` must be set as
`CLIENT_URL` on Render, or the API won't accept requests from it.
`/api/health` reports whether the database and Paystack are connected.

A free Render API sleeps when idle; open `/api/health` a minute before a demo.

# Store Backend (Node.js · Express · MongoDB · Mongoose)

REST API for the **customer shop** and the **admin dashboard**.

| Topic | Where |
|---|---|
| Express REST + routers | `src/routes/*` (generic CRUD router in `crud.js`) |
| MongoDB Atlas + Mongoose | `src/models/index.js`, queries: filter, sort, pagination, regex search, populate, aggregate |
| Auth | bcrypt hashing, JWT in **httpOnly cookie**, **Passport** (`passport-jwt`), roles `admin` / `customer` (separate cookies) |
| Security | `helmet`, CORS allow-list with credentials, rate-limit on login/register, input whitelisting, server-side price/amount |
| Protected routes / middleware | `src/middleware/auth.js`, `error.js` |
| Multer + Cloudinary | `src/routes/upload.js` (images only, 5 MB) |
| Node core modules | `fs` access log (`src/app.js`), `http` request example (`npm run ping`) |

## 1. Setup
```bash
npm install
cp .env.example .env     # fill MONGO_URI, JWT_SECRET, CLIENT_ORIGINS, CLOUDINARY_*
npm run seed             # creates the admin login (see SEED_ADMIN_* in .env)
npm run seed:sample      # optional: starter products/customers/orders/invoices so dashboards aren't empty
npm run dev
```
Check it: `npm run ping` → `200 {"ok":true,...}`.

**MongoDB Atlas:** create a free cluster → Database Access (user + password) → Network Access (allow `0.0.0.0/0` for Render) → Connect → Drivers → copy the URI into `MONGO_URI`.
**Cloudinary:** free account → Dashboard → copy cloud name, API key, API secret.

## 2. Deploy (Render)
New **Web Service** → connect the repo → Build `npm install`, Start `npm start` → add every variable from `.env.example` with `NODE_ENV=production` and `CLIENT_ORIGINS=https://your-shop.vercel.app,https://your-admin.vercel.app`.
Then run the seed once (Render Shell, or locally with the production `MONGO_URI`). After you have your admin account, set `ALLOW_ADMIN_SIGNUP=false` if you do not want public admin sign-ups.

## 3. Connecting the frontends (important for cookies)
Both frontends contain a `vercel.json` that proxies `/api/*` to this server, so the browser sees one origin and cookies work in every browser. Edit the `destination` in each `vercel.json` to your Render URL, and keep `VITE_API_URL=/api` in Vercel's environment variables.

## 4. API
- Customer: `POST /api/auth/register|login|logout`, `GET/PUT /api/auth/me`, `GET /api/shop/categories|products|products/:id`, `POST /api/shop/orders`, `GET /api/shop/orders/mine`
- Admin: `/api/admin/auth/*` (same shape), then (admin cookie required) `/api/orders|products|customers|invoices` (CRUD, `?page&limit&search&status&category&sort`), `/api/dashboard`, `/api/analytics`, `/api/invoices/summary`, `/api/billing`, `POST /api/upload`

## SQL vs NoSQL (why MongoDB here)
SQL: fixed tables/schemas, joins, strong relational integrity. NoSQL (MongoDB): flexible JSON documents, easy horizontal scaling, no joins (use references + `populate`). Orders here reference a customer and a product, so Mongoose `populate` plays the role of a join; billing history is embedded because it is always read with its owner.

## Honest limitations
- Billing keeps plan/card details in the database only (brand, last 4, expiry). There is no real payment gateway (e.g. Stripe).
- Stock updates are not wrapped in a database transaction (Atlas free tier supports them, but this keeps the code simple).

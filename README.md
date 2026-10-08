# QR Ordering System

Scan. Order. Serve. A multi-restaurant-ready QR table-ordering system with real-time order management.

**Stack:** Next.js 16 (App Router, JavaScript) · Tailwind CSS 4 · MongoDB Atlas + Mongoose · Socket.IO · qrcode · jose (JWT) + bcryptjs

## Quick start

```bash
npm install
cp .env.example .env.local      # then fill in the values (see below)
npm run seed                    # creates restaurant, admin, 5 tables, menu (safe to re-run)
npm run dev                     # Next.js + Socket.IO on http://localhost:3000
```

| URL | What |
|---|---|
| `/` | Landing page |
| `/admin/login` | Admin sign-in (`ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env.local`) |
| `/admin/dashboard` · `orders` · `menu` · `tables` · `settings` | Admin panel |
| `/table/1` … `/table/5` | Customer menu (demo shortcut, see "Table URLs") |
| `/order/:orderId` | Live order tracking |

### Environment variables (`.env.local`)

| Variable | Required | Notes |
|---|---|---|
| `MONGODB_URI` | yes | Atlas connection string |
| `AUTH_SECRET` | yes | ≥32 random chars: `openssl rand -base64 48` |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | for seed | Password ≥8 chars. Never hard-coded anywhere |
| `NEXT_PUBLIC_APP_URL` | yes | Encoded in QR codes, e.g. `http://localhost:3000` or your real domain |
| `SOCKET_URL` | no | Allowed CORS origin for Socket.IO (defaults to app URL) |
| `NEXT_PUBLIC_SOCKET_URL` | no | Only if Socket.IO is on a different origin than the web app |
| `ADMIN_NAME`, `SEED_RESTAURANT_NAME` | no | Seed display names |
| `APP_TIMEZONE` | no | Default `Asia/Kolkata`; defines "today"/"this month" |
| `PORT`, `HOST` | no | Default `3000` / `0.0.0.0` |

> Testing QR codes on a phone: set `NEXT_PUBLIC_APP_URL=http://<your-computer-LAN-IP>:3000`, restart, then download/view the QR again (QR URLs refresh automatically).

### Scripts

| Command | Does |
|---|---|
| `npm run dev` | `node server.js --dev` (Next dev + Socket.IO) |
| `npm run build` / `npm start` | Production build / `node server.js` (Next + Socket.IO) |
| `npm run seed` | Idempotent seed. `npm run seed -- --reset-admin-password` re-applies `ADMIN_PASSWORD` |
| `npm run test:smoke` | 95-check end-to-end test (HTTP + Socket.IO) against a running server |

## Architecture

```
API route (thin)  →  middleware/routeHandler.js  →  services/*  →  models/* (Mongoose)  →  MongoDB
                      (rate limit, DB, auth,         (all business     
                       error mapping)                 logic + validation)
```

```
app/            pages + API routes          services/    business logic
components/     ui/ admin/ customer/        models/      Restaurant Admin Category Product Table Order Counter
lib/            mongodb, token, auth,       middleware/  routeHandler (wrapper), auth (requireAdmin)
                socket (emit), socketServer utils/       validators, errors, money, time, constants...
server.js       Next + Socket.IO            proxy.js     admin page guard (Next 16 "proxy")
scripts/        seed.js, smoke-test.js
```

Every restaurant-owned document carries `restaurantId`; every admin query is scoped by the logged-in admin's `restaurantId`, so adding more restaurants needs no schema change.

### Table URLs

QR codes encode `${NEXT_PUBLIC_APP_URL}/table/{tableId}` where `tableId` is the table's database id (unambiguous across restaurants). For demos, `/table/1` also works: a plain number resolves by table number, but only while exactly one restaurant has that table; otherwise customers are asked to scan the QR.

## Security

- Passwords hashed with bcrypt (cost 12); hash is `select:false` and never returned.
- Session = signed JWT (HS256, 7 days) in an **HTTP-only, SameSite=Lax** cookie (`Secure` when the app URL is https). Nothing sensitive in localStorage.
- Every admin API is wrapped with `auth: true` (401 without a valid cookie **and** an active admin); pages are guarded by `proxy.js` + a server-side check in the admin layout.
- Admins can only touch their own restaurant's data (403 / 404 otherwise).
- Orders: client sends only `productId` + `quantity`. Names, prices, tax, service charge and total are taken from MongoDB and computed on the server in integer minor units. Order items store a **snapshot** of name/price.
- All inputs validated (ObjectIds, email, phone, numbers, enums, URLs `http(s)` only); unknown errors return a generic 500 and are logged server-side only.
- Rate limits: login (10/15 min), order creation (15/10 min), public reads. In-memory, fine for a single Node process.
- Socket.IO: admin room joined only with a valid session cookie; customers can only join the room of the single order id they are tracking.

## Business rules

- **Statuses:** `NEW → ACCEPTED → PREPARING → READY → COMPLETED`; `CANCELLED` allowed until completed. Other transitions are rejected (409). Updates use compare-and-set so two admins can't race.
- **Revenue** = sum of `totalAmount` of orders with status **`COMPLETED`**, bucketed by `completedAt`. Cancelled and in-progress orders never count. Computed with MongoDB aggregation (`GET /api/dashboard/stats`).
- **Today / This month** use calendar boundaries in `APP_TIMEZONE`.
- **Today's orders** = orders created today, excluding cancelled. **Pending** = `NEW`, `ACCEPTED`, `PREPARING`, `READY` (any date).
- Completing an order sets `paymentStatus = PAID` (pay-at-table/counter model). There is no online payment gateway.
- Tax / service charge are percentages of the subtotal from Settings and apply to new orders only.

## How real-time works

`server.js` creates one HTTP server, hands it to Next.js **and** attaches Socket.IO (`lib/socketServer.js`). The `io` instance is stored on `globalThis`, which is how Next route handlers/services emit events (`lib/socket.js`).

```
Customer  POST /api/orders ─► orderService ─► MongoDB ─► emit "new-order" ─► room admin:{restaurantId} ─► dashboard (no refresh)
Admin     PATCH /api/orders/:id/status ─► MongoDB ─► emit "order-status-changed" ─► room order:{orderId} ─► customer tracking page
                                                   └► also "order-status-changed" + "order-updated" to the admin room
```

Events: `new-order`, `order-updated`, `order-status-changed`. Clients re-sync via REST after any reconnect, so a dropped connection never leaves stale data.

## Deployment

Socket.IO needs a **persistent Node process**, so deploy to Railway, Render, Fly.io, a VPS, etc. **Not** serverless Vercel functions.

1. Set the env vars above on the host (`NEXT_PUBLIC_APP_URL` must be your public https URL **at build time**).
2. Build: `npm run build` · Start: `npm start` (listens on `PORT`).
3. Run `npm run seed` once against the production database.
4. Run a **single instance**: the rate limiter and Socket.IO rooms are in-process. To scale out, add the Socket.IO Redis adapter and a shared rate-limit store.
5. Atlas: allow your host's IP in Network Access.

## Images

Products take an image **URL**. To use Cloudinary/S3 later, change only `lib/imageStorage.js`; services and UI already treat `image` as an opaque URL.

## Notes on the original starter

- `models/Resturant.js` and `app/api/resturants/` were misspelled and didn't match the `@/models/Restaurant` import; they are renamed to the correct spelling. The model itself and `lib/mongodb.js` are unchanged.
- The unauthenticated `POST /api/restaurants` was removed (anyone could create restaurants). `GET` now returns only the logged-in admin's restaurant; use the seed script to create restaurants.

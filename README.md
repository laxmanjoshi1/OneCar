# OneCar — React + Express + MongoDB

Premium cab-booking site for India. The original React/Vite landing page and map booking UI are unchanged; the backend is now **Node.js + Express + MongoDB (Mongoose)**, prices are in **₹ INR**, times are **IST**, and the admin works orders like a real operator.

## What it does

**Customers**
- Book a city / airport / outstation ride on a map (OpenStreetMap + OSRM). The fare is **always recalculated on the server**.
- Indian mobile validation (`98XXXXXXXX`, `+91…`), pickup must be ≥ 30 min away, availability is checked against your fleet.
- Pay **cash to driver**, or **UPI / card / netbanking via Razorpay** when you add Razorpay keys (signature verified server-side).
- Optional customer accounts (bcrypt-hashed passwords, HTTP-only session cookies).

**Admin (`/admin/login`)**
- **Accept or reject orders.** Accept assigns a free vehicle (auto, or pick one) and locks it for that time slot. Reject needs a reason. Accepted orders can be marked completed or cancelled. Online orders can only be accepted once paid; rejecting/cancelling a paid order flags *Refund due* (refund it from the Razorpay dashboard).
- **Cars:** add, edit, deactivate and **delete** vehicles (registration no., fuel, seats) and **edit their prices** (base fare, ₹/km, airport and outstation surcharges). A vehicle with upcoming accepted orders can't be deleted.
- **Commission:** set your commission % (default 15%). Each accepted order records *expected* commission; completing it makes it *earned*. Reports by period and category, ride-by-ride, plus owner/driver share.
- Customers list, live pending-order counter (auto-refreshes every 30 s), password change API.

## Run locally

Requirements: Node 18+, MongoDB (local Community Server, or a free MongoDB Atlas cluster).

```bash
# 1. API
cd backend
cp .env.example .env          # set MONGODB_URI, SESSION_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm install
npm run seed                  # creates the admin + 3 starter cars (safe to re-run)
npm run dev                   # http://localhost:5000/api/health

# 2. Website (new terminal, project root)
cp .env.example .env
npm install
npm run dev                   # http://localhost:5173
```

Windows: use `copy` instead of `cp`. Then open `/admin/login`, sign in, and remove `ADMIN_PASSWORD` from `.env`.

Unit tests for fares, commission, Indian phone/registration validation, IST parsing and payment signatures: `cd backend && npm test`.

## Order workflow

```
customer books ──► pending ──Accept──► confirmed ──Complete──► completed   (commission: expected → earned)
                      │                    └──Cancel──► cancelled          (commission voided)
                      └──Reject (reason)──► rejected                        (commission voided)
```

## Settings (`backend/.env`)

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | Local or Atlas connection string |
| `SESSION_SECRET` | ≥ 32 random chars (required in production) |
| `FRONTEND_ORIGINS` | Exact website origin(s) allowed by CORS |
| `COMMISSION_PERCENT` | Initial commission %; later edited in Admin → Commission |
| `MIN_LEAD_MINUTES` | Minimum time before pickup (default 30) |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Enables online payments; leave blank for cash-only |

## Deploy

- **Database:** MongoDB Atlas (allow your API host's IP, use a restricted DB user).
- **API:** Render/Railway/any Node host — root `backend`, build `npm install`, start `npm start`, set the env vars above with `NODE_ENV=production`, then run `npm run seed` once. Health check: `/api/health`.
- **Website:** Vercel (Vite preset). Set `VITE_API_BASE_URL=https://<your-api>/api`. Add the Vercel domain to `FRONTEND_ORIGINS`.

## API summary (`/api`)

Public: `GET /health`, `GET /pricing/config`, `GET /vehicles`, `POST /bookings`, `POST /bookings/payment/verify`, `POST /auth/register|login|logout`, `GET /auth/me`, `GET /auth/bookings`.
Admin (session): `POST /admin/login|logout`, `GET /admin/me|dashboard|bookings|vehicles|commission|customers`, `POST /admin/bookings/:id/accept|reject|complete|cancel`, `POST|PATCH|DELETE /admin/vehicles[/:id]`, `PATCH /admin/settings`, `POST /admin/password`.

## Before real launch

Not included: driver app / dispatch, OTP verification of phone numbers, Razorpay webhooks and automated refunds, SMS/WhatsApp/email notifications to customers on accept/reject, GST invoices, multi-admin roles, and an integration test suite against a live MongoDB. Public OSRM/Nominatim are rate-limited — use a paid map provider at scale.

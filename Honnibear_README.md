# Honnibear 🐻🎨

The brand site + order system for **Honnibear** — custom hand-drawn portrait commissions and custom-built love letter & wedding websites.

**Live site:** _add your deployed URL here once live_
**Etsy shop:** https://www.etsy.com/shop/Honnibear
**Instagram:** https://www.instagram.com/honnibear_

---

## What this is

A full-stack commission storefront:

- Customers buy through a **Stripe Payment Link**.
- A **Stripe webhook** hits our own backend, which creates an order record in Postgres.
- The customer is sent to an **intake form** (reference photos for art, letter text or wedding details for a website) tied to that order.
- Honnibear manages every order from an **auth-protected admin dashboard** — view submitted details and reference photos, and move each order through `paid → details_submitted → in_progress → delivered`.
- Customers can check their own order status any time with their order code + email, no account needed.

This replaces the old "Stripe → static thank-you page with a download link" model (fine for instant PDF downloads, not for made-to-order work).

## Repo layout

```
website/                 # Static frontend — plain HTML/CSS/JS, no build step
├── index.html            # Homepage: commissions + custom websites, Buy Now buttons
├── order-received.html   # Post-payment intake form (reads ?session_id= from Stripe redirect)
├── commission-status.html# Public order status lookup (order code + email)
├── admin/
│   ├── login.html         # Admin sign-in
│   └── dashboard.html     # Order list, detail view, status updates
├── js/
│   ├── config.js           # Points the frontend at the backend API URL
│   └── formFields.js       # Shared per-product intake field definitions
├── css/shared.css        # Styles for the new pages (index.html keeps its own inline styles)
├── images/                # Logo
└── SETUP_GUIDE.md         # Full walkthrough: Stripe, Render deploy, env vars

server/                  # Backend API — Node/Express + PostgreSQL
├── src/
│   ├── app.js              # Express app, middleware, route mounting
│   ├── server.js            # Entry point
│   ├── db.js                 # Postgres connection pool
│   ├── db/
│   │   ├── schema.sql          # Table definitions
│   │   ├── migrate.js          # Runs schema.sql against DATABASE_URL
│   │   └── seedAdmin.js        # Creates/updates the admin login from .env
│   ├── routes/
│   │   ├── webhooks.js          # POST /api/webhooks/stripe
│   │   ├── orders.js             # Customer-facing: lookup, intake, status
│   │   └── admin.js               # Admin-only: list/detail/status/files
│   ├── services/
│   │   ├── catalog.js              # Product slug -> name/price/type
│   │   ├── orderCode.js            # Short public order codes (HB-XXXXXX)
│   │   └── email.js                 # Order confirmation + admin alert emails
│   └── middleware/auth.js         # JWT verification for admin routes
├── .env.example
└── package.json
```

## Tech stack

- **Frontend:** plain HTML, CSS, vanilla JS — no framework, no build step. Fonts from Google Fonts.
- **Backend:** Node.js + Express 5, PostgreSQL (`pg`), JWT auth (`jsonwebtoken` + `bcryptjs`), file uploads (`multer`), Stripe SDK for webhook verification, Nodemailer for email (optional — logs to console if SMTP isn't configured).

## How checkout maps to a product

All five products currently share **one Stripe Payment Link**. Each "Buy Now" button appends `?client_reference_id=<product-slug>` to that link (e.g. `...?client_reference_id=full-body-commission`) — Stripe stores that on the Checkout Session and echoes it back in the webhook, which is how the backend knows what was purchased without needing five separate Payment Links. See `server/src/services/catalog.js` for the slug list.

## Local development

```bash
# 1. Backend
cd server
cp .env.example .env         # fill in your local Postgres URL, a JWT secret, etc.
npm install
npm run migrate              # creates tables
npm run seed:admin           # creates your admin login from ADMIN_EMAIL/ADMIN_PASSWORD in .env
npm run dev                  # http://localhost:4000

# 2. Frontend (separate terminal)
cd website
python3 -m http.server 8080  # or any static file server
# edit website/js/config.js if your API runs somewhere other than localhost:4000
```

Visit `http://localhost:8080/index.html`. To test the full flow locally without a real Stripe payment, you can POST a signed fake `checkout.session.completed` event straight to `/api/webhooks/stripe` (see `SETUP_GUIDE.md` for a ready-made example), then open `order-received.html?session_id=<the session id>`.

## Deployment

See **[SETUP_GUIDE.md](website/SETUP_GUIDE.md)** for the full walkthrough: creating the Stripe webhook, deploying the backend + Postgres (Render is the suggested free-tier target), deploying the static site, and the go-live checklist.

## License

All Honnibear artwork, designs, and branding are © Honnibear. Site and server code may be reused/modified for your own Honnibear deployment.

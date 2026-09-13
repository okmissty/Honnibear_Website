# Honnibear

Brand site and order system for Honnibear: custom hand-drawn portrait commissions and custom-built love letter and wedding websites, made by one artist, MissTy.

**Live site:** https://honnibear.netlify.app/
**Backend API:** https://honnibear-website.onrender.com
**Etsy shop:** https://www.etsy.com/shop/Honnibear
**Instagram:** https://www.instagram.com/honnibear_

## Deployment status

Complete:
- Backend deployed on Render (Node/Express + Postgres), auto-migrating its schema and provisioning the admin login on every boot. No shell access required.
- Frontend deployed on Netlify.

Outstanding:
- Stripe Payment Link redirect URLs and the webhook still need to be pointed at the URLs above (see `website/SETUP_GUIDE.md`) before real purchases flow end to end.
- Real SMTP credentials are not yet configured. Order and admin emails currently log to the Render server console instead of sending.
- Real commission photos are not yet in the gallery or product cards.

---

## What this is

A full-stack commission storefront:

- Customers buy through a Stripe Payment Link.
- A Stripe webhook hits the backend, which creates an order record in Postgres.
- The customer is sent to an intake form (reference photos for art, letter text or wedding details for a website) tied to that order.
- Every order is managed from an auth-protected admin dashboard: view submitted details and reference photos, and move each order through `paid -> details_submitted -> in_progress -> delivered`.
- Customers can check their own order status any time with their order code and email, no account needed.

This replaces the earlier "Stripe -> static thank-you page with a download link" model, which worked for instant PDF downloads but not for made-to-order work.

## Repo layout

```
website/                  Static frontend: plain HTML/CSS/JS, no build step
  index.html                Homepage: commissions, custom websites, Buy Now buttons
  gallery.html               Portfolio page for past commission work
  order-received.html        Post-payment intake form (reads ?session_id= from Stripe redirect)
  commission-status.html     Public order status lookup (order code + email)
  admin/
    login.html                 Admin sign-in
    dashboard.html              Order list, detail view, status updates
  js/
    config.js                   Points the frontend at the backend API URL
    formFields.js                Shared per-product intake field definitions
  css/shared.css              Styles for the utility pages (index.html and gallery.html keep their own inline styles)
  images/                      Logo
  SETUP_GUIDE.md               Full walkthrough: Stripe, Render deploy, environment variables

server/                   Backend API: Node/Express + PostgreSQL
  src/
    app.js                     Express app, middleware, route mounting
    server.js                   Entry point
    bootstrap.js                 Runs the schema and provisions the admin login on boot
    db.js                         Postgres connection pool
    db/
      schema.sql                   Table definitions
      migrate.js                    Runs schema.sql against DATABASE_URL (manual/local use)
      seedAdmin.js                   Creates or updates the admin login (manual/local use)
    routes/
      webhooks.js                    POST /api/webhooks/stripe
      orders.js                       Customer-facing: lookup, intake, status
      admin.js                         Admin-only: list, detail, status, files
    services/
      catalog.js                       Product slug to name/price/type
      orderCode.js                      Short public order codes (HB-XXXXXX)
      email.js                           Order confirmation and admin alert emails
    middleware/auth.js                JWT verification for admin routes
  .env.example
  package.json
```

## Tech stack

- **Frontend:** plain HTML, CSS, and vanilla JS. No framework, no build step. Fonts from Google Fonts.
- **Backend:** Node.js and Express 5, PostgreSQL (`pg`), JWT authentication (`jsonwebtoken` and `bcryptjs`), file uploads (`multer`), the Stripe SDK for webhook verification, and Nodemailer for email (optional; logs to console if SMTP isn't configured).

## How checkout maps to a product

Each product has its own Stripe Payment Link. Each "Buy Now" button also appends `?client_reference_id=<product-slug>` to its link (for example, `...?client_reference_id=full-body-commission`). Stripe stores that value on the Checkout Session and echoes it back in the webhook, which is how the backend confirms exactly which product was purchased. See `server/src/services/catalog.js` for the slug list, and the Buy Now buttons in `website/index.html` for the link-to-slug mapping.

## Local development

```bash
# 1. Backend
cd server
cp .env.example .env    # fill in your local Postgres URL, a JWT secret, etc.
npm install
npm run dev              # http://localhost:4000, auto-creates tables and admin login on boot

# 2. Frontend (separate terminal)
cd website
python3 -m http.server 8080   # or any static file server
# edit website/js/config.js to point at http://localhost:4000 instead of the
# deployed Render URL it defaults to
```

Visit `http://localhost:8080/index.html`. To test the full flow locally without a real Stripe payment, POST a signed fake `checkout.session.completed` event straight to `/api/webhooks/stripe` (see `SETUP_GUIDE.md` for a ready-made example), then open `order-received.html?session_id=<the session id>`.

## Deployment

The backend is on Render and the frontend is on Netlify (see URLs above). See [SETUP_GUIDE.md](website/SETUP_GUIDE.md) for the full walkthrough. What remains is pointing the Stripe Payment Links and webhook at these live URLs, per the "Deployment status" section above.

## License

All Honnibear artwork, designs, and branding are copyright Honnibear. Site and server code may be reused or modified for your own Honnibear deployment.

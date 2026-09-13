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

A full-stack commission storefront built around an inquire-first workflow, not an instant checkout:

- A customer sends an inquiry (no payment yet) with their name, email, reference photos, and commission details, tied to a product.
- MissTy reviews it from the admin dashboard and approves or declines, typically within 24 hours.
- Approving generates a personalized Stripe payment link (that product's Payment Link plus the order's own code as `client_reference_id`) and emails it to the customer.
- Once paid, a Stripe webhook matches the payment back to that exact order by its code and marks it `paid`.
- Every order is managed from an auth-protected admin dashboard, moving through `pending_review -> approved -> paid -> in_progress -> delivered` (or `pending_review -> declined`).
- Customers can check their own order status any time with their order code and email, no account needed.

This replaces an earlier "buy first, ask questions later" model: going straight to checkout skipped the conversation a commission artist needs to have before committing to custom work.

## Repo layout

```
website/                  Static frontend: plain HTML/CSS/JS, no build step
  index.html                Homepage: commissions, custom websites, Send Inquiry buttons
  inquiry.html               Pre-payment inquiry form (name, email, details, reference photos)
  gallery.html               Portfolio page for past commission work
  order-received.html        Post-payment confirmation (reads ?session_id= from Stripe redirect)
  commission-status.html     Public order status lookup (order code + email)
  admin/
    login.html                 Admin sign-in
    dashboard.html              Order list, detail view, approve/decline, status updates
  js/
    config.js                   Points the frontend at the backend API URL
    formFields.js                Client-side product catalog: name/type/fields per slug
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
      inquiries.js                    POST /api/inquiries (public, rate-limited)
      webhooks.js                      POST /api/webhooks/stripe
      orders.js                         Customer-facing: by-session lookup, status
      admin.js                           Admin-only: list, detail, approve, decline, status, files
    services/
      catalog.js                         Product slug to name/price/type/Stripe link
      orderCode.js                        Short public order codes (HB-XXXXXX)
      email.js                             Inquiry, approval, decline, and payment emails
    middleware/
      auth.js                              JWT verification for admin routes
      rateLimit.js                          In-memory per-IP rate limit for the inquiry form
  .env.example
  package.json
```

## Tech stack

- **Frontend:** plain HTML, CSS, and vanilla JS. No framework, no build step. Fonts from Google Fonts.
- **Backend:** Node.js and Express 5, PostgreSQL (`pg`), JWT authentication (`jsonwebtoken` and `bcryptjs`), file uploads (`multer`), the Stripe SDK for webhook verification, and Nodemailer for email (optional; logs to console if SMTP isn't configured).

## How a payment maps back to an order

Each product has its own Stripe Payment Link, used only after an inquiry is approved. The admin approve action builds that product's link with the order's own code attached as `client_reference_id` (for example, `...?client_reference_id=HB-7K3QF9`) and emails it to the customer. Stripe echoes that value back on the webhook, which is how the backend matches the payment to the exact order that was approved, rather than just knowing which product was bought. See `server/src/services/catalog.js` for the product-to-link mapping.

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

Visit `http://localhost:8080/index.html`, send an inquiry, then log into `/admin/login.html` to approve or decline it. To test payment locally without a real Stripe transaction, POST a signed fake `checkout.session.completed` event straight to `/api/webhooks/stripe` with `client_reference_id` set to the approved order's code (see `SETUP_GUIDE.md` for a ready-made example), then open `order-received.html?session_id=<the session id>`.

## Deployment

The backend is on Render and the frontend is on Netlify (see URLs above). See [SETUP_GUIDE.md](website/SETUP_GUIDE.md) for the full walkthrough. What remains is pointing the Stripe Payment Links and webhook at these live URLs, per the "Deployment status" section above.

## License

All Honnibear artwork, designs, and branding are copyright Honnibear. Site and server code may be reused or modified for your own Honnibear deployment.

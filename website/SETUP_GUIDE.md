# Honnibear Setup Guide

This covers everything to get the full-stack commission system live: the Stripe side, deploying the backend + database, deploying the static site, and testing the whole flow before sharing it.

---

## 1. How the order flow works

```
Customer clicks "Buy Now"
  -> Stripe Payment Link (?client_reference_id=<product-slug>)
  -> customer pays
  -> Stripe sends a "checkout.session.completed" webhook to our backend
  -> backend creates an order row in Postgres (status: paid) + emails the customer
  -> Stripe redirects the customer to order-received.html?session_id=...
  -> customer fills out the intake form (reference photos / letter / wedding details)
  -> backend saves those details + files, order status -> details_submitted
  -> Honnibear works the order from the admin dashboard, updating status as it goes
  -> customer can check status any time on commission-status.html
```

Each product has its own **Stripe Payment Link** — see `index.html`'s Buy Now buttons. Each link also has `?client_reference_id=<slug>` appended (e.g. `full-body-commission`); Stripe echoes that back on the webhook, which is how the backend confirms exactly which product was purchased. The current link-to-product mapping:

| Product | Slug | Payment Link |
|---|---|---|
| Full Body Commission | `full-body-commission` | https://buy.stripe.com/3cIdR90j36X1eYL5C75gc05 |
| Half Body Commission | `half-body-commission` | https://buy.stripe.com/9B66oH6Hr815aIve8D5gc06 |
| Headshot Commission | `headshot-commission` | https://buy.stripe.com/00w7sL3vfftx5ob9Sn5gc07 |
| Virtual Love Letter Website | `love-letter-website` | https://buy.stripe.com/14A28r4zj5SXcQD0hN5gc08 |
| Wedding RSVP Website | `wedding-rsvp-website` | https://buy.stripe.com/8x24gz9TD3KP4k77Kf5gc09 |

If a link ever needs to change, update the `href` on that product's Buy Now button in `index.html` — no backend changes needed as long as the `client_reference_id` still matches a slug in `server/src/services/catalog.js`.

---

## 2. Stripe setup

1. In your Stripe Dashboard, open **each of the five Payment Links above** (Payment Links → find it → Edit) and confirm **"After payment" -> "Don't show a confirmation page"** is *not* selected — instead choose **"Redirect customers to your website"** and set the redirect URL to:
   ```
   https://yourdomain.com/order-received.html?session_id={CHECKOUT_SESSION_ID}
   ```
   (Stripe substitutes `{CHECKOUT_SESSION_ID}` automatically.) This has to be set on all five links individually — it's a per-link setting.
2. Go to **Developers -> Webhooks -> Add endpoint**, set the URL to your deployed backend:
   ```
   https://your-backend.onrender.com/api/webhooks/stripe
   ```
   Subscribe to the `checkout.session.completed` event. This is a single account-level endpoint — it receives events from all five Payment Links automatically, no per-link webhook setup needed.
3. Copy the endpoint's **Signing secret** (`whsec_...`) into your backend's `STRIPE_WEBHOOK_SECRET` env var.
4. Copy your **Secret key** (`sk_test_...` while testing, `sk_live_...` when live) into `STRIPE_SECRET_KEY`.

---

## 3. Deploy the backend + database

**Render** (suggested, has a free tier for both a web service and Postgres):

1. Push this repo to GitHub if you haven't already.
2. In Render: **New -> PostgreSQL** — create a free database, copy its **Internal Database URL**.
3. In Render: **New -> Web Service** — point it at this repo, set:
   - Root directory: `server`
   - Build command: `npm install`
   - Start command: `npm start`
4. Add environment variables (see `server/.env.example` for the full list): `DATABASE_URL` (the one from step 2), `FRONTEND_ORIGIN` (your deployed static site's URL), `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `JWT_SECRET` (any long random string), `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and optionally the `SMTP_*` vars for real email delivery.
5. Deploy. No shell access or manual migration step needed — the server creates its tables and provisions the admin login automatically on every boot (see `server/src/bootstrap.js`). Check the deploy logs for `Database schema is up to date.` and `Admin login ready: ...` to confirm it worked.

Railway or Fly.io work the same way (Node web service + managed Postgres + the same env vars).

---

## 4. Deploy the static site

The `website/` folder is still plain HTML/CSS/JS — no build step:

1. Edit `website/js/config.js` and set `window.HONNIBEAR_API_BASE` to your deployed backend URL.
2. Drag the `website` folder onto [netlify.com](https://netlify.com) (or Vercel, or GitHub Pages), or connect the repo for auto-deploys.
3. Make sure the backend's `FRONTEND_ORIGIN` env var includes this deployed site's URL (comma-separated if you have more than one, e.g. a preview URL + your real domain) so the browser's CORS check passes.

**Status:** done — backend is live at https://honnibear-website.onrender.com, frontend at https://honnibear.netlify.app/. `FRONTEND_ORIGIN` on Render still needs updating to the Netlify URL (see checklist below).

---

## 5. Your admin login

Nothing to run — the backend provisions the admin account automatically on every boot from the `ADMIN_EMAIL` / `ADMIN_PASSWORD` env vars you set in step 3. Log in at `yourdomain.com/admin/login.html`. To change the password, update `ADMIN_PASSWORD` in Render and redeploy.

---

## 6. Test before sharing publicly

1. Use Stripe **test mode** and a test card (`4242 4242 4242 4242`, any future expiry/CVC) to make a full purchase.
2. Confirm you land on `order-received.html` with the right product's intake form, submit it, and confirm the order shows up in `/admin/dashboard.html`.
3. Confirm `commission-status.html` returns the right status for that order code + email.
4. Only then switch Stripe to **live mode**, and re-point the Payment Link / webhook secret / secret key at your live Stripe keys.

---

## Environment variables reference

See `server/.env.example` — every variable the backend needs, with comments on where each one comes from.

## Quick checklist

- [ ] Stripe Payment Link redirects to `order-received.html?session_id={CHECKOUT_SESSION_ID}`
- [ ] Stripe webhook configured for `checkout.session.completed`, pointed at `/api/webhooks/stripe`
- [ ] Backend deployed with all required env vars set (schema + admin login provision themselves on boot — check the deploy logs)
- [ ] `website/js/config.js` points at the deployed backend URL
- [ ] Static site deployed, and its URL is in the backend's `FRONTEND_ORIGIN`
- [ ] Full test-mode purchase walked through end to end
- [ ] Switched to live Stripe keys and re-tested

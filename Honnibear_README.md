# Honnibear 🐻🌻

The brand website for **Honnibear** — cute, honey-toned printable planners, trackers, digital stickers, and custom art commissions.

**Live site:** _add your deployed URL here once live_
**Etsy shop:** https://www.etsy.com/shop/Honnibear

---

## What's in this repo

```
website/
├── index.html              # Main site: hero, about, shop, how-it-works
├── commissions.html        # Custom art commissions page + request form
├── thank-you-planner.html  # Post-purchase download page (Planner Set)
├── thank-you-budget.html   # Post-purchase download page (Budget Tracker)
├── thank-you-meal.html     # Post-purchase download page (Meal Planning Set)
├── thank-you-fitness.html  # Post-purchase download page (Fitness Tracker)
├── thank-you-stickers.html # Post-purchase download page (Sticker Pack)
├── images/                 # Logo + product mockup images
└── SETUP_GUIDE.md          # Full walkthrough: Stripe, file hosting, deployment
```

## Tech stack

Plain HTML, CSS, and vanilla JS — no build step, no framework, no dependencies. Fonts are loaded from Google Fonts (Fredoka, Quicksand, Caveat).

## Payments

Product purchases go through **Stripe Payment Links** (no backend required). After payment, customers are redirected to a matching `thank-you-*.html` page containing their download link.

⚠️ Stripe Payment Links handle payment only — they don't auto-deliver files. See `SETUP_GUIDE.md` for the full explanation and the exact steps to wire everything up, including an optional upgrade path (SendOwl) for secure, automated file delivery.

## Commissions form

The request form on `commissions.html` submits via **Formspree** (free tier, no backend needed). Setup steps are in `SETUP_GUIDE.md`.

## Setup & deployment

See **[SETUP_GUIDE.md](website/SETUP_GUIDE.md)** for the complete step-by-step: creating Stripe Payment Links, hosting product files, configuring the commissions form, and deploying to Netlify/Vercel/GitHub Pages.

Quick version:
1. Replace all placeholder text (`STRIPE_LINK_*`, `ETSY_LINK_*`, `DOWNLOAD_LINK_*`, `FORMSPREE_ENDPOINT`) with your real URLs
2. Drag the `website` folder onto [netlify.com](https://netlify.com) (or similar) to deploy
3. Test a full purchase in Stripe test mode before going live

## License

All Honnibear designs, artwork, and branding are © Honnibear. Site code may be reused/modified for your own Honnibear deployment.

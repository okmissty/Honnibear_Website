# Honnibear Website — Setup Guide

Your site is fully built and ready. Here's exactly what to do to make it live and take real payments.

---

## 1. Understand how the payment flow works

**Important honest note:** Stripe Payment Links process the *payment* but do not automatically deliver your PDF files. This site is built with the simplest possible workaround:

`Customer clicks Buy Now → pays via Stripe → Stripe redirects to your Thank You page → Thank You page has the download link`

This is free and simple, but the download link on that Thank You page isn't truly "locked" — anyone with the URL could technically access it. For your price point ($5-12) this is a completely normal and common approach used by many small shops. If you later want automatic, secure, session-locked delivery (so links can't be shared), look into **SendOwl** — it integrates directly with Stripe Payment Links with no coding required, for a small monthly fee.

---

## 1.5. Stripe sandbox API keys

Your sandbox (test) publishable and secret keys are stored in `.stripe-keys.local.md` at the project root — that file is git-ignored and will never be committed or pushed. Don't paste the actual key values into this guide or any other tracked file.

---

## 2. Create your Stripe account (if you haven't)

1. Go to stripe.com and sign up (free, no monthly fee)
2. Complete their business verification (they'll ask for basic info about you/your shop)
3. You'll pay Stripe's standard processing fee (2.9% + $0.30 per transaction) — no extra cost for using Payment Links

---

## 3. Create a Payment Link for each product

Repeat this for all 5 products:

1. In your Stripe Dashboard, go to **Payment Links** > **Create payment link**
2. Add a new product: name (e.g. "Printable Planner Set"), price (e.g. $5.50), and upload the product image if you'd like
3. Under **After payment**, choose **"Redirect customers to your website"** and paste in the matching thank-you page URL (see table below — you'll fill in the real domain once hosted)
4. Click **Create link** — Stripe gives you a URL like `https://buy.stripe.com/abc123`
5. Copy that URL

| Product | Placeholder in index.html | Redirect to |
|---|---|---|
| Printable Planner Set | STRIPE_LINK_PLANNER | yourdomain.com/thank-you-planner.html |
| Budget Tracker Set | STRIPE_LINK_BUDGET | yourdomain.com/thank-you-budget.html |
| Meal Planning & Grocery System | STRIPE_LINK_MEAL | yourdomain.com/thank-you-meal.html |
| Fitness & Wellness Tracker | STRIPE_LINK_FITNESS | yourdomain.com/thank-you-fitness.html |
| Digital Sticker Pack | STRIPE_LINK_STICKERS | yourdomain.com/thank-you-stickers.html |

---

## 4. Replace the placeholders in the code

Open `index.html` in any text editor (even Notepad or TextEdit works) and use Find & Replace for each:

- STRIPE_LINK_PLANNER -> your real Stripe Payment Link URL for the planner
- STRIPE_LINK_BUDGET, STRIPE_LINK_MEAL, STRIPE_LINK_FITNESS, STRIPE_LINK_STICKERS -> same idea
- ETSY_LINK_PLANNER, ETSY_LINK_BUDGET, etc. -> the URL of each matching Etsy listing
- ETSY_SHOP_LINK -> your Etsy shop homepage URL
- PINTEREST_LINK, INSTAGRAM_LINK -> your social profile URLs
- YOUR_EMAIL -> your contact email (appears in the footer and on thank-you pages)

Then open each thank-you-*.html file and replace:
- DOWNLOAD_LINK_PLANNER (and the matching one in each file) -> a real, direct link to that PDF file

---

## 5. Host your product files somewhere downloadable

You need somewhere for the actual PDF/zip files to live so the download links work. Easiest free options:
- **Google Drive**: upload the file, right-click > Share > "Anyone with the link" > use that link
- **Dropbox**: similar process, use the shared link (change the ending `?dl=0` to `?dl=1` so it downloads directly instead of opening a preview page)
- Your own web host, if you have one, uploaded directly alongside the website files

---

## 6. Put the website online

The site is plain HTML/CSS/JS — no special server needed. Easiest free options to go live:

- **Netlify** (easiest): go to netlify.com, drag your whole `website` folder onto the deploy page, done in under a minute. Free tier is plenty for this.
- **Vercel**: similar drag-and-drop deploy flow at vercel.com
- **GitHub Pages**: free if you're comfortable with GitHub

Any of these will give you a free URL (like honnibear.netlify.app), and you can connect a custom domain (like honnibear.com) later through the same dashboard if you buy one.

---

## 7. Test before sharing publicly

1. Use Stripe's **test mode** first (toggle in the Stripe Dashboard) to make a fake purchase all the way through
2. Confirm you land on the correct thank-you page and the download link works
3. Only then switch Stripe to **live mode** and swap in your real (live) Payment Link URLs — test mode and live mode links are different!

---

## Quick checklist

- [ ] Stripe account created and verified
- [ ] 5 Payment Links created, one per product
- [ ] All STRIPE_LINK_* placeholders replaced in index.html
- [ ] All ETSY_LINK_* and ETSY_SHOP_LINK placeholders replaced
- [ ] All DOWNLOAD_LINK_* placeholders replaced in the thank-you pages
- [ ] Product files uploaded somewhere (Drive/Dropbox/host) and links work
- [ ] Site deployed (Netlify/Vercel/GitHub Pages)
- [ ] Tested a full purchase in Stripe test mode
- [ ] Switched to live mode and re-tested with real (small) purchase if desired

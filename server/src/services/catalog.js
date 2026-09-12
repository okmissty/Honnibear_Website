// Single source of truth for product info, keyed by the slug passed as
// Stripe's client_reference_id (see website/index.html buy buttons).
// All products currently route through one shared Stripe Payment Link;
// this catalog is what lets the webhook and intake form know what was
// actually purchased.
const CATALOG = {
  'full-body-commission': {
    name: 'Full Body Commission',
    priceCents: 6000,
    type: 'art',
  },
  'half-body-commission': {
    name: 'Half Body Commission',
    priceCents: 4500,
    type: 'art',
  },
  'headshot-commission': {
    name: 'Headshot Commission',
    priceCents: 2500,
    type: 'art',
  },
  'love-letter-website': {
    name: 'Virtual Love Letter Website',
    priceCents: 4000,
    type: 'website',
  },
  'wedding-rsvp-website': {
    name: 'Wedding RSVP Website',
    priceCents: 4000,
    type: 'website',
  },
};

function getProduct(slug) {
  return CATALOG[slug] || null;
}

module.exports = { CATALOG, getProduct };

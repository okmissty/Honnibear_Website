// Single source of truth for product info, keyed by the slug passed as
// Stripe's client_reference_id (see website/index.html buy buttons). Each
// product has its own Stripe Payment Link, but the webhook only gets a
// Checkout Session back — this catalog is what turns that session's
// client_reference_id into a product name/price/type.
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

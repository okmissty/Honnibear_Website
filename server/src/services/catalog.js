// Single source of truth for product info. The client_reference_id on a
// Stripe Checkout Session now carries an *order code*, not a product slug
// (see webhooks.js) — the product slug lives on the order row itself,
// recorded at inquiry time. This catalog turns that slug into a display
// name/price/type, and into the right Stripe Payment Link to send once an
// inquiry is approved.
const CATALOG = {
  'full-body-commission': {
    name: 'Full Body Commission',
    priceCents: 6000,
    type: 'art',
    stripeLink: 'https://buy.stripe.com/3cIdR90j36X1eYL5C75gc05',
  },
  'half-body-commission': {
    name: 'Half Body Commission',
    priceCents: 4500,
    type: 'art',
    stripeLink: 'https://buy.stripe.com/9B66oH6Hr815aIve8D5gc06',
  },
  'headshot-commission': {
    name: 'Headshot Commission',
    priceCents: 2500,
    type: 'art',
    stripeLink: 'https://buy.stripe.com/00w7sL3vfftx5ob9Sn5gc07',
  },
  'love-letter-website': {
    name: 'Virtual Love Letter Website',
    priceCents: 4000,
    type: 'website',
    stripeLink: 'https://buy.stripe.com/14A28r4zj5SXcQD0hN5gc08',
  },
  'wedding-rsvp-website': {
    name: 'Wedding RSVP Website',
    priceCents: 4000,
    type: 'website',
    stripeLink: 'https://buy.stripe.com/8x24gz9TD3KP4k77Kf5gc09',
  },
};

function getProduct(slug) {
  return CATALOG[slug] || null;
}

module.exports = { CATALOG, getProduct };

// Client-side mirror of server/src/services/catalog.js: enough product info
// (name, type, and which details to collect) for inquiry.html to render the
// right form instantly from a ?product= slug, with no backend round trip.
// The admin dashboard also reuses fieldsForSlug() to label submitted details.
window.HonnibearFields = (function(){
  const ART_FIELDS = [
    { name: 'subjectDescription', label: 'Who/what is this commission of?', type: 'textarea', required: true },
    { name: 'styleNotes', label: 'Style notes / requests', type: 'textarea', required: false },
  ];
  const LOVE_LETTER_FIELDS = [
    { name: 'recipientName', label: "Recipient's name", type: 'text', required: true },
    { name: 'occasion', label: 'Occasion', type: 'text', required: false },
    { name: 'letterText', label: 'Letter text', type: 'textarea', required: true },
  ];
  const WEDDING_FIELDS = [
    { name: 'partner1Name', label: 'Partner 1 name', type: 'text', required: true },
    { name: 'partner2Name', label: 'Partner 2 name', type: 'text', required: true },
    { name: 'weddingDate', label: 'Wedding date', type: 'date', required: true },
    { name: 'venue', label: 'Venue / location', type: 'text', required: false },
    { name: 'rsvpDeadline', label: 'RSVP deadline', type: 'date', required: false },
    { name: 'colorPalette', label: 'Colors / theme', type: 'text', required: false },
    { name: 'additionalNotes', label: 'Additional notes', type: 'textarea', required: false },
  ];

  const PRODUCTS = {
    'full-body-commission': { name: 'Full Body Commission', type: 'art', fields: ART_FIELDS, stripeLink: 'https://buy.stripe.com/3cIdR90j36X1eYL5C75gc05' },
    'half-body-commission': { name: 'Half Body Commission', type: 'art', fields: ART_FIELDS, stripeLink: 'https://buy.stripe.com/9B66oH6Hr815aIve8D5gc06' },
    'headshot-commission': { name: 'Headshot Commission', type: 'art', fields: ART_FIELDS, stripeLink: 'https://buy.stripe.com/00w7sL3vfftx5ob9Sn5gc07' },
    'love-letter-website': { name: 'Virtual Love Letter Website', type: 'website', fields: LOVE_LETTER_FIELDS, stripeLink: 'https://buy.stripe.com/14A28r4zj5SXcQD0hN5gc08' },
    'wedding-rsvp-website': { name: 'Wedding RSVP Website', type: 'website', fields: WEDDING_FIELDS, stripeLink: 'https://buy.stripe.com/8x24gz9TD3KP4k77Kf5gc09' },
  };

  function fieldsForSlug(slug){
    return (PRODUCTS[slug] || PRODUCTS['full-body-commission']).fields;
  }

  function productForSlug(slug){
    return PRODUCTS[slug] || null;
  }

  return { PRODUCTS, fieldsForSlug, productForSlug };
})();

// Shared field definitions for the commission intake form (order-received.html)
// and the admin order detail view (admin/dashboard.html), so both agree on
// what each product type collects without duplicating the list twice.
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

  function fieldsForSlug(slug){
    if (slug === 'love-letter-website') return LOVE_LETTER_FIELDS;
    if (slug === 'wedding-rsvp-website') return WEDDING_FIELDS;
    return ART_FIELDS;
  }

  return { fieldsForSlug };
})();

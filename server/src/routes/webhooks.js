const express = require('express');
const Stripe = require('stripe');
const { pool } = require('../db');
const { generateOrderCode } = require('../services/orderCode');
const { sendMail, paymentReceivedEmail, paymentReceivedAdminAlert } = require('../services/email');

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Fallback for a Checkout Session whose client_reference_id doesn't match
// any approved order (a stale link, a manual Stripe Dashboard test payment,
// etc.) - still record it instead of silently dropping real money.
async function insertManualReviewOrder(session) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const orderCode = generateOrderCode();
    try {
      const { rows } = await pool.query(
        `INSERT INTO orders
           (order_code, stripe_session_id, stripe_payment_intent, product_slug,
            product_name, amount_cents, currency, customer_email, status)
         VALUES ($1,$2,$3,'unknown','Unrecognized payment (needs manual review)',$4,$5,$6,'paid')
         RETURNING *`,
        [
          orderCode,
          session.id,
          session.payment_intent || null,
          session.amount_total,
          session.currency || 'usd',
          session.customer_details?.email || session.customer_email || null,
        ]
      );
      return rows[0];
    } catch (err) {
      if (err.code === '23505' && err.constraint === 'orders_order_code_key') {
        continue; // eslint-disable-line no-continue
      }
      throw err;
    }
  }
  throw new Error('Could not generate a unique order code after several attempts.');
}

// Mounted with express.raw() in app.js so Stripe's signature check sees the
// exact bytes it signed, ahead of the JSON body parser used everywhere else.
router.post('/stripe', async (req, res) => {
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers['stripe-signature'],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Stripe signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type !== 'checkout.session.completed') {
    return res.json({ received: true, ignored: event.type });
  }

  const session = event.data.object;
  // client_reference_id is set when an inquiry is approved (see
  // admin.js's /approve route) to that order's public order_code - not a
  // product slug, since the product is already known from the inquiry.
  const orderCode = (session.client_reference_id || '').trim().toUpperCase();

  let order;
  let isNewManualReview = false;
  try {
    const { rows } = await pool.query(
      "SELECT * FROM orders WHERE order_code = $1 AND status = 'approved'",
      [orderCode]
    );
    const approvedOrder = rows[0];

    if (approvedOrder) {
      const { rows: updatedRows } = await pool.query(
        `UPDATE orders
         SET status = 'paid', stripe_session_id = $1, stripe_payment_intent = $2,
             amount_cents = $3, currency = $4, updated_at = now()
         WHERE id = $5
         RETURNING *`,
        [
          session.id,
          session.payment_intent || null,
          session.amount_total,
          session.currency || 'usd',
          approvedOrder.id,
        ]
      );
      order = updatedRows[0];
    } else {
      console.warn(`Checkout session ${session.id} has client_reference_id "${orderCode}" that doesn't match an approved order - recording for manual review.`);
      order = await insertManualReviewOrder(session);
      isNewManualReview = true;
    }
  } catch (err) {
    if (err.code === '23505' && err.constraint === 'orders_stripe_session_id_key') {
      // Stripe retried a webhook already handled - that's fine, ack it.
      return res.json({ received: true, duplicate: true });
    }
    console.error('Failed to record payment from Stripe webhook:', err);
    return res.status(500).json({ error: 'Failed to record payment.' });
  }

  // Don't block Stripe's webhook ack on email delivery.
  res.json({ received: true, orderCode: order.order_code });

  if (!isNewManualReview && order.customer_email) {
    sendMail(paymentReceivedEmail(order)).catch((err) => console.error('Payment-received email failed:', err));
  }
  if (process.env.ADMIN_EMAIL) {
    sendMail(paymentReceivedAdminAlert(order)).catch((err) => console.error('Admin payment alert email failed:', err));
  }
  return undefined;
});

module.exports = router;

const express = require('express');
const Stripe = require('stripe');
const { pool } = require('../db');
const { getProduct } = require('../services/catalog');
const { generateOrderCode } = require('../services/orderCode');
const { sendMail, orderReceivedEmail, newOrderAdminAlert } = require('../services/email');

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function insertOrderWithRetry(session, product) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const orderCode = generateOrderCode();
    try {
      const { rows } = await pool.query(
        `INSERT INTO orders
           (order_code, stripe_session_id, stripe_payment_intent, product_slug,
            product_name, amount_cents, currency, customer_email, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'paid')
         RETURNING *`,
        [
          orderCode,
          session.id,
          session.payment_intent || null,
          product.slug,
          product.name,
          session.amount_total,
          session.currency || 'usd',
          session.customer_details?.email || session.customer_email || null,
        ]
      );
      return rows[0];
    } catch (err) {
      // order_code collision (extremely unlikely) -> retry with a fresh code.
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
  const slug = session.client_reference_id;
  const product = getProduct(slug);

  if (!product) {
    console.warn(`Checkout session ${session.id} has unknown/missing product slug "${slug}" — recording as a manual-review order.`);
  }

  const productForInsert = {
    slug: slug || 'unknown',
    name: product ? product.name : 'Unrecognized product (needs manual review)',
  };

  let order;
  try {
    order = await insertOrderWithRetry(session, productForInsert);
  } catch (err) {
    if (err.code === '23505' && err.constraint === 'orders_stripe_session_id_key') {
      // Stripe retried a webhook we already handled — that's fine, ack it.
      return res.json({ received: true, duplicate: true });
    }
    console.error('Failed to record order from Stripe webhook:', err);
    return res.status(500).json({ error: 'Failed to record order.' });
  }

  // Don't block Stripe's webhook ack on email delivery.
  res.json({ received: true, orderCode: order.order_code });

  if (order.customer_email) {
    sendMail(orderReceivedEmail(order)).catch((err) => console.error('Order-received email failed:', err));
  }
  if (process.env.ADMIN_EMAIL) {
    sendMail(newOrderAdminAlert(order)).catch((err) => console.error('Admin alert email failed:', err));
  }
  return undefined;
});

module.exports = router;

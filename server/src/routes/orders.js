const express = require('express');
const { pool } = require('../db');

const router = express.Router();

// Used by order-received.html right after a Stripe redirect, to confirm
// which order this payment belongs to and show its current status.
router.get('/by-session/:sessionId', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT order_code, product_slug, product_name, status FROM orders WHERE stripe_session_id = $1',
    [req.params.sessionId]
  );
  if (!rows[0]) {
    return res.status(404).json({ error: 'No order found for that Stripe session yet. If you just paid, wait a few seconds and refresh - the payment confirmation can take a moment to arrive.' });
  }
  return res.json(rows[0]);
});

// Public status lookup - requires both the order code AND the email it was
// placed under, so status can't be scraped by guessing codes alone.
router.get('/lookup', async (req, res) => {
  const { code, email } = req.query;
  if (!code || !email) {
    return res.status(400).json({ error: 'Both order code and email are required.' });
  }
  const { rows } = await pool.query(
    `SELECT order_code, product_name, status, notes, created_at, updated_at
     FROM orders
     WHERE order_code = $1 AND lower(customer_email) = lower($2)`,
    [code.trim().toUpperCase(), email.trim()]
  );
  if (!rows[0]) {
    return res.status(404).json({ error: 'No matching order found. Double check your order code and the email you used.' });
  }
  return res.json(rows[0]);
});

module.exports = router;

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const multer = require('multer');
const { pool } = require('../db');
const { getProduct } = require('../services/catalog');

const router = express.Router();

const UPLOAD_ROOT = path.join(__dirname, '..', '..', 'uploads');
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(UPLOAD_ROOT, req.params.orderCode.replace(/[^A-Z0-9-]/gi, '_'));
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const safeExt = path.extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, '');
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${safeExt}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024, files: 6 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG, or WEBP reference photos are allowed.'));
    }
    return cb(null, true);
  },
});

async function findOrderByCode(orderCode) {
  const { rows } = await pool.query('SELECT * FROM orders WHERE order_code = $1', [orderCode]);
  return rows[0] || null;
}

// Used by order-received.html right after a Stripe redirect to figure out
// which order/product this customer is filling details in for.
router.get('/by-session/:sessionId', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT order_code, product_slug, product_name, status FROM orders WHERE stripe_session_id = $1',
    [req.params.sessionId]
  );
  if (!rows[0]) {
    return res.status(404).json({ error: 'No order found for that Stripe session yet. If you just paid, wait a few seconds and refresh — the payment confirmation can take a moment to arrive.' });
  }
  return res.json(rows[0]);
});

// Customer-facing intake form submission: commission details + optional
// reference photos, tied to their order by its public order code.
router.post('/:orderCode/intake', upload.array('photos', 6), async (req, res) => {
  const order = await findOrderByCode(req.params.orderCode);
  if (!order) {
    return res.status(404).json({ error: 'Order not found.' });
  }
  if (order.status !== 'paid') {
    return res.status(409).json({ error: `This order's details were already submitted (status: ${order.status}). Email us if you need to change something.` });
  }

  let details;
  try {
    details = JSON.parse(req.body.details || '{}');
  } catch (err) {
    return res.status(400).json({ error: 'Invalid details payload.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      'INSERT INTO commission_details (order_id, details) VALUES ($1, $2)',
      [order.id, details]
    );
    for (const file of req.files || []) {
      await client.query(
        `INSERT INTO reference_files (order_id, original_name, stored_path, mime_type, size_bytes)
         VALUES ($1,$2,$3,$4,$5)`,
        [order.id, file.originalname, path.relative(UPLOAD_ROOT, file.path), file.mimetype, file.size]
      );
    }
    await client.query(
      "UPDATE orders SET status = 'details_submitted', updated_at = now() WHERE id = $1",
      [order.id]
    );
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Intake submission failed:', err);
    return res.status(500).json({ error: 'Something went wrong saving your details. Please try again.' });
  } finally {
    client.release();
  }

  return res.json({ success: true, orderCode: order.order_code });
});

// Public status lookup — requires both the order code AND the email it was
// placed under, so status can't be scraped by guessing codes alone.
router.get('/lookup', async (req, res) => {
  const { code, email } = req.query;
  if (!code || !email) {
    return res.status(400).json({ error: 'Both order code and email are required.' });
  }
  const { rows } = await pool.query(
    `SELECT order_code, product_name, status, created_at, updated_at
     FROM orders
     WHERE order_code = $1 AND lower(customer_email) = lower($2)`,
    [code.trim().toUpperCase(), email.trim()]
  );
  if (!rows[0]) {
    return res.status(404).json({ error: 'No matching order found. Double check your order code and the email you paid with.' });
  }
  return res.json(rows[0]);
});

// Small helper the intake form can call to know which fields to render for
// a given product slug (art vs. website), without hardcoding it twice.
router.get('/product/:slug', (req, res) => {
  const product = getProduct(req.params.slug);
  if (!product) return res.status(404).json({ error: 'Unknown product.' });
  return res.json(product);
});

module.exports = router;

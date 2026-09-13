const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const multer = require('multer');
const { pool } = require('../db');
const { getProduct } = require('../services/catalog');
const { generateOrderCode } = require('../services/orderCode');
const { sendMail, inquiryReceivedEmail, newInquiryAdminAlert } = require('../services/email');

const router = express.Router();
const UPLOAD_ROOT = path.join(__dirname, '..', '..', 'uploads');
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);

// Buffered in memory rather than written straight to disk, since the order
// (and the order code its upload folder is named after) doesn't exist yet
// until after validation passes.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 6 },
  fileFilter: (req, file, cb) => {
    if (!ALLOWED_MIME.has(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG, or WEBP reference photos are allowed.'));
    }
    return cb(null, true);
  },
});

async function insertInquiryWithRetry(client, { productSlug, productName, name, email }) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const orderCode = generateOrderCode();
    try {
      const { rows } = await client.query(
        `INSERT INTO orders
           (order_code, product_slug, product_name, customer_name, customer_email, status)
         VALUES ($1,$2,$3,$4,$5,'pending_review')
         RETURNING *`,
        [orderCode, productSlug, productName, name, email]
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

router.post('/', upload.array('photos', 6), async (req, res) => {
  // Honeypot: a real visitor never fills this hidden field in. Reply as if
  // everything worked so bots don't learn to look elsewhere.
  if (req.body.company) {
    return res.json({ success: true, orderCode: generateOrderCode() });
  }

  const { name, email, product } = req.body;
  if (!name || !email || !product) {
    return res.status(400).json({ error: 'Name, email, and product are required.' });
  }
  const catalogEntry = getProduct(product);
  if (!catalogEntry) {
    return res.status(400).json({ error: 'Unknown product.' });
  }

  let details;
  try {
    details = JSON.parse(req.body.details || '{}');
  } catch (err) {
    return res.status(400).json({ error: 'Invalid details payload.' });
  }

  const client = await pool.connect();
  let order;
  try {
    await client.query('BEGIN');
    order = await insertInquiryWithRetry(client, {
      productSlug: product,
      productName: catalogEntry.name,
      name,
      email,
    });
    await client.query(
      'INSERT INTO commission_details (order_id, details) VALUES ($1, $2)',
      [order.id, details]
    );
    if (req.files && req.files.length) {
      const dir = path.join(UPLOAD_ROOT, order.order_code);
      fs.mkdirSync(dir, { recursive: true });
      for (const file of req.files) {
        const safeExt = path.extname(file.originalname).toLowerCase().replace(/[^a-z0-9.]/g, '');
        const storedName = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${safeExt}`;
        fs.writeFileSync(path.join(dir, storedName), file.buffer);
        await client.query(
          `INSERT INTO reference_files (order_id, original_name, stored_path, mime_type, size_bytes)
           VALUES ($1,$2,$3,$4,$5)`,
          [order.id, file.originalname, path.join(order.order_code, storedName), file.mimetype, file.size]
        );
      }
    }
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Inquiry submission failed:', err);
    return res.status(500).json({ error: 'Something went wrong saving your inquiry. Please try again.' });
  } finally {
    client.release();
  }

  res.json({ success: true, orderCode: order.order_code });

  sendMail(inquiryReceivedEmail(order)).catch((err) => console.error('Inquiry-received email failed:', err));
  if (process.env.ADMIN_EMAIL) {
    sendMail(newInquiryAdminAlert(order)).catch((err) => console.error('Admin inquiry alert email failed:', err));
  }
  return undefined;
});

module.exports = router;

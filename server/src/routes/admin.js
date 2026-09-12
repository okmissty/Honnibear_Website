const path = require('path');
const fs = require('fs');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();
const UPLOAD_ROOT = path.join(__dirname, '..', '..', 'uploads');
const VALID_STATUSES = ['paid', 'details_submitted', 'in_progress', 'delivered'];

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  const { rows } = await pool.query('SELECT * FROM admins WHERE email = $1', [email.toLowerCase()]);
  const admin = rows[0];
  if (!admin || !(await bcrypt.compare(password, admin.password_hash))) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }
  const token = jwt.sign({ sub: admin.id, email: admin.email }, process.env.JWT_SECRET, { expiresIn: '12h' });
  return res.json({ token, email: admin.email });
});

router.use(requireAdmin);

// List orders, newest first, with optional status filter + search.
router.get('/orders', async (req, res) => {
  const { status, q } = req.query;
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const pageSize = Math.min(50, Math.max(1, parseInt(req.query.pageSize, 10) || 20));
  const offset = (page - 1) * pageSize;

  const conditions = [];
  const params = [];
  if (status && VALID_STATUSES.includes(status)) {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }
  if (q) {
    params.push(`%${q}%`);
    conditions.push(`(customer_email ILIKE $${params.length} OR order_code ILIKE $${params.length})`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const { rows: countRows } = await pool.query(`SELECT count(*)::int AS count FROM orders ${where}`, params);
  params.push(pageSize, offset);
  const { rows } = await pool.query(
    `SELECT id, order_code, product_slug, product_name, amount_cents, currency,
            customer_email, status, created_at, updated_at
     FROM orders ${where}
     ORDER BY created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return res.json({ orders: rows, total: countRows[0].count, page, pageSize });
});

// Single order with its submitted commission details + reference file list.
router.get('/orders/:id', async (req, res) => {
  const { rows: orderRows } = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
  const order = orderRows[0];
  if (!order) return res.status(404).json({ error: 'Order not found.' });

  const { rows: detailRows } = await pool.query(
    'SELECT details, submitted_at FROM commission_details WHERE order_id = $1 ORDER BY submitted_at DESC LIMIT 1',
    [order.id]
  );
  const { rows: fileRows } = await pool.query(
    'SELECT id, original_name, mime_type, size_bytes, uploaded_at FROM reference_files WHERE order_id = $1 ORDER BY uploaded_at ASC',
    [order.id]
  );

  return res.json({
    order,
    details: detailRows[0] || null,
    files: fileRows.map((f) => ({ ...f, url: `/api/admin/orders/${order.id}/files/${f.id}` })),
  });
});

router.get('/orders/:id/files/:fileId', async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM reference_files WHERE id = $1 AND order_id = $2',
    [req.params.fileId, req.params.id]
  );
  const file = rows[0];
  if (!file) return res.status(404).json({ error: 'File not found.' });

  const fullPath = path.join(UPLOAD_ROOT, file.stored_path);
  if (!fullPath.startsWith(UPLOAD_ROOT) || !fs.existsSync(fullPath)) {
    return res.status(404).json({ error: 'File not found.' });
  }
  res.type(file.mime_type || 'application/octet-stream');
  return fs.createReadStream(fullPath).pipe(res);
});

router.patch('/orders/:id/status', async (req, res) => {
  const { status } = req.body || {};
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ error: `Status must be one of: ${VALID_STATUSES.join(', ')}` });
  }
  const { rows } = await pool.query(
    'UPDATE orders SET status = $1, updated_at = now() WHERE id = $2 RETURNING *',
    [status, req.params.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Order not found.' });
  return res.json(rows[0]);
});

module.exports = router;

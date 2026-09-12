require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const multer = require('multer');

const webhooksRouter = require('./routes/webhooks');
const ordersRouter = require('./routes/orders');
const adminRouter = require('./routes/admin');

const app = express();

const allowedOrigins = (process.env.FRONTEND_ORIGIN || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS.`));
    },
  })
);
app.use(morgan('dev'));

// Stripe needs the raw, unparsed body to verify the webhook signature, so
// this is mounted before the global express.json() parser below.
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhooksRouter);

app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/orders', ordersRouter);
app.use('/api/admin', adminRouter);

app.use((req, res) => res.status(404).json({ error: 'Not found.' }));

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message?.includes('reference photos')) {
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: 'Internal server error.' });
});

module.exports = app;

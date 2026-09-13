require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool } = require('../db');

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in your .env before seeding.');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await pool.query(
    `INSERT INTO admins (email, password_hash)
     VALUES ($1, $2)
     ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
    [email.toLowerCase(), passwordHash]
  );
  console.log(`Admin user ready: ${email}`);
}

seedAdmin()
  .catch((err) => {
    console.error('Seeding admin failed:', err);
    process.exitCode = 1;
  })
  .finally(() => pool.end());

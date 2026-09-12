const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const { pool } = require('./db');

// Runs on every server boot instead of requiring a one-off shell command, so
// deploy targets without shell access (e.g. Render's free tier) still get
// their schema created and admin login provisioned automatically.
// schema.sql only uses CREATE TABLE/INDEX IF NOT EXISTS, so re-running it on
// every restart is a safe no-op once the schema already exists.
async function runBootstrap() {
  const schema = fs.readFileSync(path.join(__dirname, 'db', 'schema.sql'), 'utf8');
  await pool.query(schema);
  console.log('Database schema is up to date.');

  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) {
    const passwordHash = await bcrypt.hash(password, 12);
    await pool.query(
      `INSERT INTO admins (email, password_hash)
       VALUES ($1, $2)
       ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash`,
      [email.toLowerCase(), passwordHash]
    );
    console.log(`Admin login ready: ${email}`);
  } else {
    console.warn('ADMIN_EMAIL / ADMIN_PASSWORD not set — skipping admin account setup.');
  }
}

module.exports = { runBootstrap };

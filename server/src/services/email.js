const nodemailer = require('nodemailer');

let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

// Sends when SMTP is configured; otherwise logs to console so local/dev
// setups (and this environment, with no real inbox to hit) still work end
// to end without needing real email credentials.
async function sendMail({ to, subject, text }) {
  if (!transporter) {
    console.log(`[email:skipped, no SMTP configured] to=${to} subject="${subject}"\n${text}`);
    return;
  }
  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'Honnibear <hello@honnibear.example>',
    to,
    subject,
    text,
  });
}

function orderReceivedEmail(order) {
  const detailsUrl = `${process.env.FRONTEND_ORIGIN_PRIMARY || ''}/order-received.html?session_id=${order.stripe_session_id}`;
  return {
    to: order.customer_email,
    subject: `We got your order, ${order.order_code}! Let's get your details.`,
    text: `Thanks for commissioning ${order.product_name} from Honnibear!\n\nYour order code is ${order.order_code} — save it to check your status any time.\n\nOne more step: tell us the details so we can get started:\n${detailsUrl}\n\nWith honey and love,\nHonnibear`,
  };
}

function newOrderAdminAlert(order) {
  return {
    to: process.env.ADMIN_EMAIL,
    subject: `New order: ${order.product_name} (${order.order_code})`,
    text: `A new order just came in.\n\nOrder code: ${order.order_code}\nProduct: ${order.product_name}\nCustomer: ${order.customer_email || 'unknown'}\nAmount: $${((order.amount_cents || 0) / 100).toFixed(2)}\n\nView it in the admin dashboard.`,
  };
}

module.exports = { sendMail, orderReceivedEmail, newOrderAdminAlert };

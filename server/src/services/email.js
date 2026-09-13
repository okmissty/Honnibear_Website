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

function inquiryReceivedEmail(order) {
  return {
    to: order.customer_email,
    subject: `Got your inquiry, ${order.order_code}!`,
    text: `Thanks for reaching out about ${order.product_name}!\n\nYour reference code is ${order.order_code}, save it to check your status any time.\n\nI review every inquiry myself and typically respond within 24 hours to confirm or follow up. Once approved, I'll send you a secure payment link to lock in your spot; no payment is needed before then.\n\nTalk soon,\nMissTy`,
  };
}

function newInquiryAdminAlert(order) {
  return {
    to: process.env.ADMIN_EMAIL,
    subject: `New inquiry: ${order.product_name} (${order.order_code})`,
    text: `A new inquiry just came in.\n\nOrder code: ${order.order_code}\nProduct: ${order.product_name}\nFrom: ${order.customer_name || 'unknown'} <${order.customer_email || 'unknown'}>\n\nReview it in the admin dashboard and approve or decline within 24 hours.`,
  };
}

function approvedEmail(order, paymentLink) {
  return {
    to: order.customer_email,
    subject: `Your commission is approved, ${order.order_code}!`,
    text: `Good news! I've reviewed your inquiry for ${order.product_name} and I'm happy to take it on.\n\nTo lock in your spot, complete payment here:\n${paymentLink}\n\nPayment is required upfront before I begin work. Once you've paid, I'll get started and keep you posted.\n\nOrder code: ${order.order_code}\n\nWith honey and love,\nMissTy`,
  };
}

function declinedEmail(order) {
  const reasonLine = order.notes ? `\n\n${order.notes}` : '';
  return {
    to: order.customer_email,
    subject: `About your inquiry, ${order.order_code}`,
    text: `Thanks so much for thinking of me for ${order.product_name}. After reviewing your inquiry, I'm not able to take this one on.${reasonLine}\n\nI really appreciate you reaching out, and I hope you'll consider Honnibear again in the future.\n\nMissTy`,
  };
}

function paymentReceivedEmail(order) {
  return {
    to: order.customer_email,
    subject: `Payment received, ${order.order_code}!`,
    text: `Your payment for ${order.product_name} is confirmed. I'll begin working on it and email you when it's finished.\n\nYou can check your order status any time using order code ${order.order_code} at the Order Status page on the site.\n\nWith honey and love,\nMissTy`,
  };
}

function paymentReceivedAdminAlert(order) {
  return {
    to: process.env.ADMIN_EMAIL,
    subject: `Payment received: ${order.product_name} (${order.order_code})`,
    text: `Payment just came in.\n\nOrder code: ${order.order_code}\nProduct: ${order.product_name}\nCustomer: ${order.customer_email || 'unknown'}\nAmount: $${((order.amount_cents || 0) / 100).toFixed(2)}\n\nTime to get started. Update its status from the admin dashboard as you go.`,
  };
}

module.exports = {
  sendMail,
  inquiryReceivedEmail,
  newInquiryAdminAlert,
  approvedEmail,
  declinedEmail,
  paymentReceivedEmail,
  paymentReceivedAdminAlert,
};

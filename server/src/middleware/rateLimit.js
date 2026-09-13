// Minimal in-memory per-IP rate limiter. No external dependency, and no
// shared store needed: this app runs as a single instance, so an in-process
// Map is enough to blunt casual inquiry-form spam now that submitting one no
// longer requires a completed Stripe payment first.
function simpleRateLimit({ windowMs, max }) {
  const hits = new Map(); // ip -> array of request timestamps within the window

  return (req, res, next) => {
    const ip = req.ip || req.socket?.remoteAddress || 'unknown';
    const now = Date.now();
    const recent = (hits.get(ip) || []).filter((t) => now - t < windowMs);
    if (recent.length >= max) {
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }
    recent.push(now);
    hits.set(ip, recent);
    return next();
  };
}

module.exports = { simpleRateLimit };

const WINDOW_MS = Number(process.env.PROSPECT_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
const MAX_REQUESTS = Number(process.env.PROSPECT_RATE_LIMIT_MAX || 5);

const requestsByIp = new Map();

const getClientIp = (req) => req.ip || req.socket?.remoteAddress || "unknown";

const cleanupExpiredEntries = (now) => {
  for (const [ip, entry] of requestsByIp.entries()) {
    if (entry.resetAt <= now) {
      requestsByIp.delete(ip);
    }
  }
};

const rateLimitPublicProspectSubmissions = (req, res, next) => {
  const now = Date.now();
  cleanupExpiredEntries(now);

  const ip = getClientIp(req);
  const current = requestsByIp.get(ip);

  if (!current || current.resetAt <= now) {
    requestsByIp.set(ip, {
      count: 1,
      resetAt: now + WINDOW_MS,
    });

    return next();
  }

  if (current.count >= MAX_REQUESTS) {
    const retryAfterSeconds = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    res.set("Retry-After", String(retryAfterSeconds));
    return res.status(429).json({
      message: `Too many submissions from this device. Please wait ${retryAfterSeconds} seconds and try again.`,
    });
  }

  current.count += 1;
  requestsByIp.set(ip, current);
  return next();
};

module.exports = { rateLimitPublicProspectSubmissions };

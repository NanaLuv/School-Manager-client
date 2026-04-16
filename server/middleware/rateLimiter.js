// middleware/rateLimiter.js
const {rateLimit, ipKeyGenerator }= require("express-rate-limit");

// Store failed attempts in memory (you can also use Redis for production)
const failedAttempts = new Map();

// Clean up old entries every hour
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of failedAttempts.entries()) {
    if (now - data.timestamp > 3600000) {
      // 1 hour
      failedAttempts.delete(key);
    }
  }
}, 3600000);

// Login rate limiter
// const loginLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 5, // 5 attempts per window per IP
//   message: {
//     error: "Too many login attempts. Please try again after 15 minutes.",
//   },
//   standardHeaders: true,
//   legacyHeaders: false,
//   skipSuccessfulRequests: true, // Don't count successful logins

//   // FIXED: Proper key generator
//   keyGenerator: (req) => {
//     // Get IP address properly (handles IPv6 and proxies)
//     const ip =
//       req.ip ||
//       req.connection?.remoteAddress ||
//       req.socket?.remoteAddress ||
//       req.headers["x-forwarded-for"]?.split(",")[0] ||
//       "unknown";

//     // Get username safely
//     const username = req.body?.username || "anonymous";

//     // Clean IP address (remove IPv6 prefix if present)
//     const cleanIp = ip.replace("::ffff:", "");

//     return `${cleanIp}-${username}`;
//   },

//   // // Optional: Skip rate limiting for health checks
//   // skip: (req) => {
//   //   return req.path === "/health" || req.path === "/api/health";
//   // },
// });


const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window per IP
  message: {
    error: "Too many login attempts. Please try again after 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins

  // 2. Update your keyGenerator to use ipKeyGenerator
  keyGenerator: (req) => {
    // Get username safely (still useful for your combined key)
    const username = req.body?.username || "anonymous";

    // Get the IP address properly
    let ip =
      req.ip ||
      req.connection?.remoteAddress ||
      req.socket?.remoteAddress ||
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      "unknown";

    // Clean IPv6 prefix if present
    ip = ip.replace("::ffff:", "");

    // 3. Use ipKeyGenerator for the IP part to fix the vulnerability
    // You can optionally pass a subnet size as the second argument (default is 64)
    const safeIpKey = ipKeyGenerator(ip, 64);

    // Return the combined key
    return `${safeIpKey}-${username}`;
  },
});

// Stricter limiter for failed attempts
const failedLoginLimiter = async (req, res, next) => {
  const username = req.body?.username;
  const ip = req.ip;

  if (!username) return next();

  const key = `${ip}-${username}`;
  const now = Date.now();
  const attempt = failedAttempts.get(key) || { count: 0, timestamp: now };

  // Reset if older than 1 hour
  if (now - attempt.timestamp > 3600000) {
    attempt.count = 0;
    attempt.timestamp = now;
  }

  // Check if too many failed attempts
  if (attempt.count >= 5) {
    const minutesLeft = Math.ceil((attempt.timestamp + 3600000 - now) / 60000);
    return res.status(429).json({
      error: `Too many failed attempts. Please try again in ${minutesLeft} minutes.`,
    });
  }

  // Attach attempt info to request for later use
  req.failedAttempt = attempt;
  next();
};

// Track failed login attempts
const trackFailedAttempt = (req) => {
  const username = req.body?.username;
  const ip = req.ip;

  if (!username) return;

  const key = `${ip}-${username}`;
  const attempt = failedAttempts.get(key) || {
    count: 0,
    timestamp: Date.now(),
  };

  attempt.count += 1;
  attempt.timestamp = Date.now();
  failedAttempts.set(key, attempt);

  console.log(
    `⚠️ Failed login attempt #${attempt.count} for ${username} from ${ip}`,
  );
};

// Clear failed attempts on successful login
const clearFailedAttempts = (req) => {
  const username = req.body?.username;
  const ip = req.ip;

  if (!username) return;

  const key = `${ip}-${username}`;
  failedAttempts.delete(key);
  console.log(`✅ Cleared failed attempts for ${username} from ${ip}`);
};

// Get rate limit status for a user
const getRateLimitStatus = (req, res) => {
  const { username } = req.query;
  const ip = req.ip;

  if (!username) {
    return res.status(400).json({ error: "Username required" });
  }

  const key = `${ip}-${username}`;
  const attempt = failedAttempts.get(key);

  if (!attempt) {
    return res.json({
      locked: false,
      attempts: 0,
      remaining: 5,
    });
  }

  const now = Date.now();
  const timeElapsed = now - attempt.timestamp;
  const locked = attempt.count >= 5 && timeElapsed < 3600000;
  const minutesLeft = locked ? Math.ceil((3600000 - timeElapsed) / 60000) : 0;

  res.json({
    locked,
    attempts: attempt.count,
    remaining: Math.max(0, 5 - attempt.count),
    minutesLeft,
    resetIn: locked ? `${minutesLeft} minutes` : null,
  });
};

module.exports = {
  loginLimiter,
  failedLoginLimiter,
  trackFailedAttempt,
  clearFailedAttempts,
  getRateLimitStatus,
};

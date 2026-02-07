import rateLimit from 'express-rate-limit';

// General API rate limiter - generous for 100+ users/day
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per 15 min per IP
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
});

// Strict limiter for AI endpoints (expensive operations)
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 AI queries per minute per IP (generous for 100+ users)
  message: {
    success: false,
    error: 'Rate limit exceeded for AI queries. Maximum 20 queries per minute.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

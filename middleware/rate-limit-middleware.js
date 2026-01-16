const rateLimit = require('express-rate-limit');

// General API rate limiter - for most endpoints
const generalLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 100 requests per windowMs
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again later'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Strict rate limiter - for authentication endpoints (login, register, OTP)
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 5 requests per windowMs (to prevent brute force)
  message: {
    status: 'error',
    message: 'Too many authentication attempts, please try again after 15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Moderate rate limiter - for write operations (POST, PUT, DELETE)
const writeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 write requests per windowMs
  message: {
    status: 'error',
    message: 'Too many write requests from this IP, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Very strict rate limiter - for password reset, OTP resend
const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Limit each IP to 3 requests per hour
  message: {
    status: 'error',
    message: 'Too many requests, please try again after an hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  generalLimiter,
  authLimiter,
  writeLimiter,
  strictLimiter
};

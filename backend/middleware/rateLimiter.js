const { getRedis } = require('../config/redis');

/**
 * TODO (Scenario 3): allow only 5 requests per minute per IP.
 *
 * Hints:
 *  - Build a key per client, e.g. `rate:${req.ip}`
 *  - INCR the key on every request (Redis creates it at 1 if missing)
 *  - When the count is 1, EXPIRE the key after 60 seconds
 *  - If the count is above 5, respond 429 with a JSON message
 *  - If Redis is down (getRedis() returns null), just call next()
 *
 * Right now it lets every request through.
 */
async function rateLimiter(req, res, next) {
  next();
}

module.exports = rateLimiter;

const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 10 * 60 * 1000,   // 10 minutes
  max: 10,                    // 10 requêtes
});

module.exports = { limiter };
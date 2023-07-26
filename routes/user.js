const express = require('express');
const router = express.Router();
const rateLimit = require('../middleware/rate-limit');

const userCtrl = require('../controllers/user');

router.post('/signup', rateLimit.limiter, userCtrl.signup);
router.post('/login', rateLimit.limiter, userCtrl.login);

module.exports = router;
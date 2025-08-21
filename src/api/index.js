const express = require('express');
const authRoutes = require('./auth.routes');
const deviceRoutes = require('./device.routes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/devices', deviceRoutes);

module.exports = router;
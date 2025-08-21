const express = require('express');
const auth = require('../middleware/auth');
const { cacheMiddleware, invalidateCache } = require('../middleware/caching');
const Device = require('../models/device.model');
const exportQueue = require('../jobs/queue');
const { broadcastToOrganization } = require('../config/websocket');

const router = express.Router();

// Middleware to add response time logging
const responseTimeLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    // Only log when NOT in test environment
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[Response Time] ${req.method} ${req.originalUrl} - ${duration}ms`);
      if (duration > 500) {
        console.warn(`[Slow Endpoint] ${req.method} ${req.originalUrl} took ${duration}ms`);
      }
    }
  });
  next();
};

router.use(responseTimeLogger);
router.use(auth); // Apply auth middleware to all device routes

// Get all devices - CACHED for 15 minutes (900 seconds)
router.get('/', cacheMiddleware(900), async (req, res) => {
  const devices = await Device.find({ organization: req.user.organization });
  res.send(devices);
});

// Update a device - INVALIDATES CACHE
router.patch('/:id', async (req, res) => {
  try {
    const device = await Device.findOneAndUpdate(
        { _id: req.params.id, organization: req.user.organization },
        req.body,
        { new: true }
    );
    if (!device) {
        return res.status(404).send({ code: 404, message: "Device not found" });
    }
    
    // Create a pattern that correctly matches all cache entries for the device list.
    const cachePattern = `__express__${req.user.organization}__/api/devices*`;
    await invalidateCache(cachePattern);
    
    // Broadcast real-time update to the organization
    broadcastToOrganization(req.user.organization, { type: 'DEVICE_UPDATE', payload: device });

    res.send(device);
  } catch(error) {
      res.status(400).send({ code: 400, message: "Invalid update data provided", error: error.message });
  }
});

// Export device logs
router.post('/export', async (req, res) => {
    try {
        const job = await exportQueue.add({
            user: { id: req.user.id, username: req.user.username, organization: req.user.organization },
            dateRange: req.body.dateRange
        });
        res.status(202).send({ jobId: job.id, message: 'Export job has been queued. You will be notified when it is ready.' });
    } catch (error) {
        res.status(500).send({ code: 500, message: 'Failed to queue export job.' });
    }
});

module.exports = router;
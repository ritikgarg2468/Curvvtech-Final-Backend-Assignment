const redisClient = require('../config/redis');

const cacheMiddleware = (durationInSeconds) => async (req, res, next) => {
  // Create a unique key based on the original URL and user's organization
  const key = `__express__${req.user.organization}__${req.originalUrl}` || req.url;
  
  try {
    const cachedData = await redisClient.get(key);
    if (cachedData) {
      res.setHeader('X-Cache', 'HIT');
      res.setHeader('Content-Type', 'application/json');
      return res.send(cachedData); // Send the cached string
    }

    res.setHeader('X-Cache', 'MISS');
    // Monkey-patch res.send to cache the response before sending it
    const originalSend = res.send.bind(res);
    res.send = (body) => {
      // Only cache successful (2xx) responses with a body
      if (res.statusCode >= 200 && res.statusCode < 300 && body) {
        // **THE FINAL FIX IS HERE: Convert the object/array to a JSON string**
        redisClient.set(key, JSON.stringify(body), 'EX', durationInSeconds);
      }
      originalSend(body);
    };
    next();
  } catch (err) {
    console.error('Cache middleware error:', err);
    next(); // Proceed without cache on error
  }
};

const invalidateCache = (pattern) => {
  return new Promise((resolve, reject) => {
    const stream = redisClient.scanStream({
      match: pattern,
      count: 100
    });
    const keysToDelete = [];
    stream.on('data', (keys) => {
      if (keys.length) {
        keysToDelete.push(...keys);
      }
    });
    stream.on('end', async () => {
      if (keysToDelete.length > 0) {
        await redisClient.del(...keysToDelete);
      }
      resolve();
    });
    stream.on('error', (err) => reject(err));
  });
};

module.exports = { cacheMiddleware, invalidateCache };
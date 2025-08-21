const Redis = require('ioredis');
const config = require('./config');

const redisClient = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  // This helps prevent tests from hanging
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

redisClient.on('connect', () => console.log('Connected to Redis'));
redisClient.on('error', (err) => console.error('Redis Client Error', err));

module.exports = redisClient;
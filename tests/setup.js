const mongoose = require('mongoose');
const redisClient = require('../src/config/redis');
const exportQueue = require('../src/jobs/queue'); // Import the queue

const config = require('../src/config/config');
const testMongoUri = config.mongoose.url_tests;

beforeAll(async () => {
  await mongoose.connect(testMongoUri, config.mongoose.options);
});

afterAll(async () => {
  await mongoose.connection.close();
  await redisClient.quit();
  await exportQueue.close(); // Close the queue connection
});

beforeEach(async () => {
  // Clear all collections in the database
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
  // Clear Redis cache
  await redisClient.flushall();
});
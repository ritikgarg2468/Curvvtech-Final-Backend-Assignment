const Queue = require('bull');
const { processExportJob } = require('./export.worker');
const config = require('../config/config');

const exportQueue = new Queue('data-export', {
  redis: {
    host: config.redis.host,
    port: config.redis.port,
  },
});

exportQueue.process(processExportJob);

exportQueue.on('completed', (job, result) => {
    console.log(`Job ${job.id} (Export for user ${job.data.user.username}) completed successfully. File at ${result.filePath}`);
});

exportQueue.on('failed', (job, err) => {
    console.error(`Job ${job.id} (Export for user ${job.data.user.username}) failed with error: ${err.message}`);
});

module.exports = exportQueue;
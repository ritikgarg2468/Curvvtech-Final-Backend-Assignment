const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const apiRoutes = require('./api');
const redisClient = require('./config/redis');
const mongoose = require('mongoose');

const app = express();

// Set security HTTP headers
app.use(helmet());

// Parse json request body
app.use(express.json());

// Parse urlencoded request body
app.use(express.urlencoded({ extended: true }));

// Enable CORS
app.use(cors());
app.options('*', cors());

// Logging - only in non-test environments
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 20, // Limit each IP to 20 requests per window
	standardHeaders: true,
	legacyHeaders: false,
});

app.use('/api/auth', authLimiter);

// API routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const redisState = redisClient.status;
  
  const status = dbState === 1 && redisState === 'ready' ? 200 : 503;

  res.status(status).send({ 
    status: status === 200 ? 'UP' : 'DOWN',
    dependencies: { 
      database: mongoose.STATES[dbState], 
      redis: redisState 
    } 
  });
});

module.exports = app;
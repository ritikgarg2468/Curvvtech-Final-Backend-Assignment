const http = require('http');
const mongoose = require('mongoose');
const { WebSocketServer } = require('ws');
const app = require('./app');
const config = require('./config/config');
const { setupWebSocket } = require('./config/websocket');

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

let dbUri = process.env.NODE_ENV === 'test' ? config.mongoose.url_tests : config.mongoose.url;

mongoose.connect(dbUri, config.mongoose.options).then(() => {
  console.log('Connected to MongoDB');
  
  setupWebSocket(wss);

  server.listen(config.port, () => {
    console.log(`Server listening on port ${config.port}`);
  });
});

const exitHandler = () => {
  if (server) {
    server.close(() => {
      console.log('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  console.error(error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  console.log('SIGTERM received');
  if (server) {
    server.close();
  }
});
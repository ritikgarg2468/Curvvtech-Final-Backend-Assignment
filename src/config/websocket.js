const jwt = require('jsonwebtoken');
const config = require('./config');
const User = require('../models/user.model');

const clients = new Map();

const setupWebSocket = (wss) => {
  wss.on('connection', async (ws, req) => {
    // Authentication via query parameter: ws://localhost:3000?token=YOUR_JWT
    const token = req.url.split('token=')[1];
    if (!token) {
      return ws.close(1008, 'Token not provided');
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret);
      const user = await User.findById(decoded.sub);
      if (!user) {
        return ws.close(1008, 'Invalid user');
      }

      ws.user = user;
      clients.set(user.id, ws);

      console.log(`WebSocket Client connected: ${user.username} from organization ${user.organization}`);
      ws.send(JSON.stringify({ type: "CONNECTION_SUCCESS", message: "Successfully connected to real-time service." }));

      ws.on('message', (message) => {
        // Example of handling incoming messages, e.g., device heartbeats from a gateway
        console.log(`Received message from ${user.username}: ${message}`);
        try {
          const data = JSON.parse(message);
          if(data.type === 'HEARTBEAT') {
            broadcastToOrganization(user.organization, { type: 'DEVICE_HEARTBEAT', payload: data.payload });
          }
        } catch(e) {
          console.error("Invalid WS message format");
        }
      });

      ws.on('close', () => {
        clients.delete(user.id);
        console.log(`WebSocket Client disconnected: ${user.username}`);
      });
      
      ws.on('error', (error) => {
        console.error(`WebSocket error for ${user.username}:`, error);
      });

    } catch (error) {
      ws.close(1008, 'Invalid or expired token');
    }
  });
};

const broadcastToOrganization = (organization, message) => {
  for (const client of clients.values()) {
    if (client.user.organization === organization && client.readyState === client.OPEN) {
      client.send(JSON.stringify(message));
    }
  }
};

module.exports = { setupWebSocket, broadcastToOrganization };
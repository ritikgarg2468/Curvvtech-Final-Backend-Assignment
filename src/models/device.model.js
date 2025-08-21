const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  status: { type: String, enum: ['online', 'offline', 'error'], default: 'offline' },
  organization: { type: String, required: true, index: true },
  lastHeartbeat: { type: Date },
}, { timestamps: true });

const Device = mongoose.model('Device', deviceSchema);
module.exports = Device;
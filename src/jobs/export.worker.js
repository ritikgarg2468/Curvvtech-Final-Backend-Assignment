const { createObjectCsvWriter } = require('csv-writer').createObjectCsvWriter;
const fs = require('fs');
const Device = require('../models/device.model'); // Using Device model for simulation

const processExportJob = async (job) => {
  const { user, dateRange } = job.data;
  console.log(`Processing export for user ${user.username} from org ${user.organization}`);

  // 1. Fetch data from MongoDB based on organization and date range
  // Simulating finding "logs" by looking at device creation dates for this example
  const devices = await Device.find({ 
      organization: user.organization,
      createdAt: { $gte: new Date(dateRange.start), $lte: new Date(dateRange.end) }
  });

  if (devices.length === 0) {
      console.log("No data found for the selected range.");
      return { message: "No data to export." };
  }

  // 2. Generate CSV
  if (!fs.existsSync('./exports')) {
    fs.mkdirSync('./exports');
  }
  const filePath = `./exports/export-${user.id}-${Date.now()}.csv`;
  const csvWriter = createObjectCsvWriter({
    path: filePath,
    header: [
      { id: '_id', title: 'DeviceID' },
      { id: 'name', title: 'Name' },
      { id: 'status', title: 'Status' },
      { id: 'createdAt', title: 'CreationDate' },
    ],
  });

  await csvWriter.writeRecords(devices.map(d => d.toObject()));

  // 3. Simulate email notification
  console.log(`Export complete for user ${user.username}. File available at ${filePath}. Simulating email notification.`);

  return { filePath };
};

module.exports = { processExportJob };
const { cleanupOldEvents } = require('./manage-event-expiration');

// Get days to keep from command line argument, default to 30
const daysToKeep = parseInt(process.argv[2]) || 30;

console.log(`🧹 Cleaning up events older than ${daysToKeep} days...\n`);

cleanupOldEvents(daysToKeep); 
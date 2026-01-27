const mongoose = require('mongoose');

// Create logSchema
const logSchema = new mongoose.Schema({
    logId: {
        type: String,
        required: true,
        unique: true,
    },
    action: {
        type: String,
        required: true,
    },
    timestamp: {
        type: Date,
        required: true,
        default: Date.now,
    },
    userId: {
        type: String,
        required: false,
    },
});

// Add indexes for better query performance
logSchema.index({ timestamp: -1 });
logSchema.index({ action: 1 });
logSchema.index({ userId: 1 });
logSchema.index({ userId: 1, timestamp: -1 }); // Compound index for user's activity log
logSchema.index({ action: 1, timestamp: -1 }); // Compound index for action-based queries

const Log = mongoose.model('Log', logSchema);

module.exports = Log;
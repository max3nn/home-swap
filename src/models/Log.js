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

const Log = mongoose.model('Log', logSchema);

module.exports = Log;
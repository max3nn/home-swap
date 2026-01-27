const mongoose = require('mongoose');

const swapRequestsSchema = new mongoose.Schema({
    swapRequestId: {
        type: String,
        required: true,
        unique: true,
    },
    itemId: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    imageUrl: {
        type: String,
        required: false,
    },
    ownerId: {
        type: String,
        required: true,
    },
});

const SwapRequests = mongoose.model('SwapRequests', swapRequestsSchema);

module.exports = SwapRequests;
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
    offeredItemId: {
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
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'cancelled'],
        default: 'pending',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    acceptedAt: {
        type: Date,
    },
    rejectedAt: {
        type: Date,
    },
    cancelledAt: {
        type: Date,
    },
});

// Add compound indexes for better query performance
swapRequestsSchema.index({ itemId: 1, status: 1 }); // For filtering requests by item and status
swapRequestsSchema.index({ ownerId: 1, status: 1 }); // For filtering user's requests by status
swapRequestsSchema.index({ itemId: 1, createdAt: -1 }); // For chronological requests on items

// Add indexes for better query performance
swapRequestsSchema.index({ itemId: 1 });
swapRequestsSchema.index({ ownerId: 1 });
swapRequestsSchema.index({ status: 1 });
swapRequestsSchema.index({ createdAt: -1 });

// Instance method to check if request can be acted upon
swapRequestsSchema.methods.canBeActedUpon = function () {
    return this.status === 'pending';
};

// Static method to find requests for user's items
swapRequestsSchema.statics.findForUserItems = async function (userId) {
    const Item = require('./Item');
    const userItems = await Item.find({ ownerId: userId }).lean();
    const userItemIds = userItems.map(item => item.itemId);
    return this.find({ itemId: { $in: userItemIds } });
};

const SwapRequests = mongoose.model('SwapRequests', swapRequestsSchema);

module.exports = SwapRequests;
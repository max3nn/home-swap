const mongoose = require('mongoose');

const swapSchema = new mongoose.Schema({
    swapId: {
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

const Swap = mongoose.model('Swap', swapSchema);

module.exports = Swap;
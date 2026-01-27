const SwapRequest = require('../models/SwapRequests');
const mongoose = require('mongoose');

const seedSwapRequests = async () => {
  const swapRequests = [
    {
      swapRequestId: new mongoose.Types.ObjectId().toString(),
      itemId: '1',
      message:
        'I would like to swap my vintage camera for your Makita batteries.',
      imageUrl: 'https://example.com/images/vintage_camera.jpg',
      ownerId: '3',
    },
  ];
  await SwapRequest.deleteMany({});
  await SwapRequest.insertMany(swapRequests);
};

module.exports = seedSwapRequests;
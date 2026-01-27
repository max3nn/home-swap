const SwapRequest = require('../models/SwapRequests');
const mongoose = require('mongoose');

const seedSwapRequests = async () => {
  // Only seed if there are no swap requests
  const swapRequestCount = await SwapRequest.countDocuments();
  if (swapRequestCount === 0) {
    console.log('Seeding swap requests...');

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
};

module.exports = seedSwapRequests;
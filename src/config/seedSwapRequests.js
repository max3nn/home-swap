const SwapRequest = require('../models/SwapRequest');
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
        offeredItemId: '3',
        message: 'I would like to swap my vintage camera for your Makita batteries.',
        imageUrl: 'https://example.com/images/vintage_camera.jpg',
        requesterId: '3',
        receiverId: '1',
        ownerId: '3',
        status: 'pending',
        createdAt: new Date('2026-01-20'),
      },
      {
        swapRequestId: new mongoose.Types.ObjectId().toString(),
        itemId: '2',
        offeredItemId: '4',
        message: 'Would you be interested in trading your laptop for my guitar?',
        requesterId: '1',
        receiverId: '2',
        ownerId: '1',
        status: 'accepted',
        createdAt: new Date('2026-01-18'),
        acceptedAt: new Date('2026-01-19'),
      },
    ];
    await SwapRequest.deleteMany({});
    await SwapRequest.insertMany(swapRequests);
  };
};

module.exports = seedSwapRequests;
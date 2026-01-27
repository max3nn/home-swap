const Swap = require('../models/Swap');

const seedSwaps = async () => {
  const swaps = [
    {
      swapId: new mongoose.Types.ObjectId().toString(),
      itemId: '1',
      message:
        'I would like to swap my vintage camera for your Makita batteries.',
      imageUrl: 'https://example.com/images/vintage_camera.jpg',
      ownerId: '3',
    },
  ];
  await Swap.deleteMany({});
  await Swap.insertMany(swaps);
};

module.exports = seedSwaps;

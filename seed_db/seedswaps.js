import mongoose from 'mongoose';

// Create swapSchema
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

export default seedSwaps;

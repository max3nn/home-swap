const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    itemId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    imageUrl: {
      type: String,
      required: false,
      trim: true,
    },
    ownerId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    itemType: {
      type: String,
      required: false,
      trim: true,
      index: true,
    },
    wantedCategories: {
      type: [String],
      required: false,
      default: [],
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const Item = mongoose.model('Item', itemSchema);

module.exports = Item;

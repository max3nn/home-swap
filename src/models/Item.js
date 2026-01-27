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
    image: {
      data: {
        type: Buffer,
        required: false,
      },
      contentType: {
        type: String,
        required: false,
        trim: true,
      },
    },
    hasImage: {
      type: Boolean,
      required: false,
      default: false,
      index: true,
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
    status: {
      type: String,
      enum: ['available', 'swapped'],
      default: 'available',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Add compound indexes for better query performance (individual field indexes already exist in schema)
itemSchema.index({ ownerId: 1, itemType: 1 }); // Compound index for owner's items by type
itemSchema.index({ ownerId: 1, hasImage: 1 }); // Compound index for owner's items with/without images
itemSchema.index({ status: 1, itemType: 1 }); // Compound index for filtering by status and type
itemSchema.index({ status: 1, createdAt: -1 }); // Compound index for filtering by status and date

const Item = mongoose.model('Item', itemSchema);

module.exports = Item;

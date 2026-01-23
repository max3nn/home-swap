const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    senderId: { type: String, required: true },   // req.session.user.userId
    receiverId: { type: String, required: true }, // other user's userId
    text: { type: String, required: true, trim: true },
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Message', messageSchema);

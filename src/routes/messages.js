const express = require('express');
const Message = require('../models/Message');

const router = express.Router();

// Require login using your existing session-based auth
function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    return res.status(401).json({ success: false, message: 'Login required' });
  }
  next();
}

// GET /messages -> basic status / instructions (prevents 404 in browser)
router.get('/', requireAuth, (req, res) => {
  return res.status(200).json({
    success: true,
    message: 'Messaging API is running',
    endpoints: {
      send: 'POST /messages  { receiverId, text }',
      conversation: 'GET /messages/conversation/:userId',
      delete: 'DELETE /messages/:id'
    }
  });
});


// POST /messages -> send a message
router.post('/', requireAuth, async (req, res) => {
  try {
    const senderId = req.session.user.userId;
    const { receiverId, text } = req.body;

    // Input validation
    if (!receiverId || typeof receiverId !== 'string') {
      return res.status(400).json({ success: false, message: 'receiverId is required' });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty' });
    }

    const cleanText = text.trim();

    if (cleanText.length > 500) {
      return res.status(400).json({ success: false, message: 'Message too long (max 500 characters)' });
    }

    const msg = await Message.create({
      senderId,
      receiverId,
      text: cleanText,
    });

    return res.status(201).json({ success: true, message: 'Message sent', data: msg });
  } catch (err) {
    console.error('Send message error:', err);
    return res.status(500).json({ success: false, message: 'Server error while sending message' });
  }
});

// GET /messages/conversation/:userId -> get thread with another user
router.get('/conversation/:userId', requireAuth, async (req, res) => {
  try {
    const me = req.session.user.userId;
    const other = req.params.userId;

    // Only participants can view: messages where (me<->other)
    const messages = await Message.find({
      $or: [
        { senderId: me, receiverId: other },
        { senderId: other, receiverId: me },
      ],
    }).sort({ createdAt: 1 }); // correct order

    return res.status(200).json({ success: true, data: messages });
  } catch (err) {
    console.error('Fetch conversation error:', err);
    return res.status(500).json({ success: false, message: 'Server error while fetching messages' });
  }
});

// DELETE /messages/:id -> delete own message
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const me = req.session.user.userId;
    const msg = await Message.findById(req.params.id);

    if (!msg) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    // Only the sender can delete their own message
    if (msg.senderId !== me) {
      return res.status(403).json({ success: false, message: 'You can only delete your own message' });
    }

    msg.deleted = true;
    msg.text = '[deleted]';
    await msg.save();

    return res.status(200).json({ success: true, message: 'Message deleted' });
  } catch (err) {
    console.error('Delete message error:', err);
    return res.status(500).json({ success: false, message: 'Server error while deleting message' });
  }
});

module.exports = router;

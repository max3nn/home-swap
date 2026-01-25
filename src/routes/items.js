const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');

const Item = require('../models/Item');
const { ITEM_CATEGORIES, isValidCategory, normalizeCategory } = require('../config/itemCategories');

const router = express.Router();

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  // Keep under MongoDB's 16MB document limit; leave headroom for other fields
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    if (!file || !file.mimetype) return cb(null, true);
    if (file.mimetype.startsWith('image/')) return cb(null, true);
    return cb(new Error('Only image uploads are allowed'));
  },
});

const toBuffer = (value) => {
  if (!value) return null;
  if (Buffer.isBuffer(value)) return value;

  // MongoDB BSON Binary
  if (value && typeof value === 'object') {
    if (value._bsontype === 'Binary') {
      if (typeof value.value === 'function') {
        try {
          const buf = value.value(true);
          return Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
        } catch {
          // fall through
        }
      }

      if (Buffer.isBuffer(value.buffer)) {
        const end = typeof value.position === 'number' ? value.position : value.buffer.length;
        return value.buffer.slice(0, end);
      }
    }

    // Sometimes Binary-like values expose a Buffer under `.buffer`
    if (Buffer.isBuffer(value.buffer)) {
      return value.buffer;
    }
  }

  // Mongoose/lean can return { type: 'Buffer', data: [...] }
  if (value && value.type === 'Buffer' && Array.isArray(value.data)) {
    return Buffer.from(value.data);
  }

  // Extended JSON { $binary: { base64, subType } }
  if (value && value.$binary && typeof value.$binary.base64 === 'string') {
    return Buffer.from(value.$binary.base64, 'base64');
  }

  if (Array.isArray(value)) return Buffer.from(value);
  if (value instanceof Uint8Array) return Buffer.from(value);

  if (typeof value === 'string') {
    const trimmed = value.trim();
    const looksBase64 = /^[A-Za-z0-9+/]+={0,2}$/.test(trimmed) && trimmed.length % 4 === 0;
    return looksBase64 ? Buffer.from(trimmed, 'base64') : Buffer.from(trimmed);
  }

  try {
    return Buffer.from(value);
  } catch {
    return null;
  }
};

const sniffImageContentType = (buffer) => {
  if (!buffer || buffer.length < 12) return null;

  // JPEG
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'image/jpeg';
  // PNG
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return 'image/png';
  // GIF
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) return 'image/gif';
  // WEBP: RIFF....WEBP
  if (
    buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
    buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
  ) return 'image/webp';

  return null;
};

// GET /items/:itemId/image - Serve item image from MongoDB
router.get('/:itemId/image', async (req, res, next) => {
  try {
    if (process.env.NODE_ENV !== 'test' && mongoose.connection.readyState !== 1) {
      return res.status(503).end();
    }

    const itemId = (req.params.itemId || '').trim();
    if (!itemId) return res.status(400).end();

    const item = await Item.findOne({ itemId }).select('image').lean();
    if (!item || !item.image || !item.image.data) return res.status(404).end();

    const data = toBuffer(item.image.data);
    if (!data || data.length === 0) return res.status(404).end();

    const hintedType = (item.image && item.image.contentType) ? item.image.contentType : '';
    const sniffedType = sniffImageContentType(data);
    const contentType = (hintedType && hintedType.startsWith('image/'))
      ? hintedType
      : (sniffedType || 'application/octet-stream');

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', 'inline');
    res.setHeader('Cache-Control', 'private, max-age=3600');
    return res.status(200).send(data);
  } catch (err) {
    return next(err);
  }
});

// Everything else under /items requires authentication
router.use((req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  next();
});

// GET /items/new - Render posting form
router.get('/new', (req, res) => {
  return res.render('item-new', {
    title: 'Post Item',
    categories: ITEM_CATEGORIES,
    errors: [],
    values: {
      title: '',
      description: '',
      itemType: '',
      wantedCategories: [],
    },
  });
});

// POST /items/new - Create a new item
router.post('/new', upload.single('image'), async (req, res, next) => {
  try {
    if (process.env.NODE_ENV !== 'test' && mongoose.connection.readyState !== 1) {
      return res.status(503).render('error', {
        title: 'Posting Unavailable',
        message: 'Database connection unavailable. Please try again later.',
        error: {},
      });
    }

    const user = req.session.user;
    const errors = [];

    const title = (req.body.title || '').trim();
    const description = (req.body.description || '').trim();
    const itemTypeRaw = (req.body.itemType || '').trim();

    let wanted = req.body.wantedCategories || [];
    if (typeof wanted === 'string') wanted = [wanted];
    const wantedCategories = (wanted || [])
      .map((c) => normalizeCategory(c))
      .filter((c) => c && isValidCategory(c));

    const itemType = isValidCategory(itemTypeRaw) ? normalizeCategory(itemTypeRaw) : '';

    if (!title) errors.push('Title is required');
    if (!description) errors.push('Description is required');

    const image = req.file && req.file.buffer
      ? { data: req.file.buffer, contentType: req.file.mimetype || 'application/octet-stream' }
      : undefined;

    if (errors.length > 0) {
      return res.status(400).render('item-new', {
        title: 'Post Item',
        categories: ITEM_CATEGORIES,
        errors,
        values: { title, description, itemType: itemTypeRaw, wantedCategories: wanted || [] },
      });
    }

    const itemId = new mongoose.Types.ObjectId().toString();

    const imageUrl = image ? `/items/${itemId}/image` : '';

    await Item.create({
      itemId,
      title,
      description,
      imageUrl,
      image,
      hasImage: Boolean(image),
      ownerId: user.userId,
      itemType: itemType || undefined,
      wantedCategories,
    });

    return res.redirect('/search');
  } catch (err) {
    return next(err);
  }
});

// Multer / upload error handler
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).render('item-new', {
        title: 'Post Item',
        categories: ITEM_CATEGORIES,
        errors: ['Image file is too large (max 10MB). Please choose a smaller image.'],
        values: {
          title: (req.body && req.body.title) || '',
          description: (req.body && req.body.description) || '',
          itemType: (req.body && req.body.itemType) || '',
          wantedCategories: (req.body && req.body.wantedCategories) || [],
        },
      });
    }

    return res.status(400).render('item-new', {
      title: 'Post Item',
      categories: ITEM_CATEGORIES,
      errors: ['Upload failed. Please try again.'],
      values: {
        title: (req.body && req.body.title) || '',
        description: (req.body && req.body.description) || '',
        itemType: (req.body && req.body.itemType) || '',
        wantedCategories: (req.body && req.body.wantedCategories) || [],
      },
    });
  }

  return next(err);
});

module.exports = router;

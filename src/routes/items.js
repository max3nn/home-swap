const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

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

// Reusable function to create an item
const createItem = async (itemData, imageFile = null, imageUrl = null) => {
  const errors = [];

  // Validate required fields
  if (!itemData.title || itemData.title.trim().length < 1) {
    errors.push('Item title is required.');
  }
  if (itemData.title && itemData.title.length > 100) {
    errors.push('Item title must be less than 100 characters.');
  }
  if (!itemData.description || itemData.description.trim().length < 1) {
    errors.push('Item description is required.');
  }
  if (itemData.description && itemData.description.length > 1000) {
    errors.push('Item description must be less than 1000 characters.');
  }
  if (!itemData.itemType || itemData.itemType.trim().length < 1) {
    errors.push('Item category is required.');
  }

  // Validate category
  if (itemData.itemType && !ITEM_CATEGORIES.includes(itemData.itemType)) {
    errors.push('Invalid item category selected.');
  }

  // Validate image URL if provided
  if (imageUrl && imageUrl.trim().length > 0) {
    try {
      new URL(imageUrl.trim());
    } catch {
      errors.push('Please enter a valid image URL.');
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  // Prepare item data
  const itemId = uuidv4();
  const newItemData = {
    itemId,
    title: itemData.title.trim(),
    description: itemData.description.trim(),
    itemType: itemData.itemType.trim(),
    ownerId: itemData.ownerId,
    wantedCategories: itemData.wantedCategories || [],
    hasImage: false,
  };

  // Handle image
  if (imageFile) {
    newItemData.image = {
      data: imageFile.buffer,
      contentType: imageFile.mimetype
    };
    newItemData.hasImage = true;
    newItemData.imageUrl = `/items/${itemId}/image`;
  } else if (imageUrl && imageUrl.trim().length > 0) {
    newItemData.imageUrl = imageUrl.trim();
    newItemData.hasImage = true;
  }

  try {
    const item = new Item(newItemData);
    await item.save();
    return { success: true, item };
  } catch (err) {
    return { success: false, errors: ['Failed to create item: ' + err.message] };
  }
};

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
    // Use no-cache to ensure updated images are shown immediately
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
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
    const { title, description, itemType, imageUrl } = req.body;

    let wanted = req.body.wantedCategories || [];
    if (typeof wanted === 'string') wanted = [wanted];
    const wantedCategories = (wanted || [])
      .map((c) => normalizeCategory(c))
      .filter((c) => c && isValidCategory(c));

    const itemData = {
      title,
      description,
      itemType,
      ownerId: user.userId,
      wantedCategories
    };

    const result = await createItem(itemData, req.file, imageUrl);

    if (!result.success) {
      return res.status(400).render('item-new', {
        title: 'Post Item',
        categories: ITEM_CATEGORIES,
        errors: result.errors,
        values: { title, description, itemType, wantedCategories: wanted || [] },
      });
    }

    console.log(`[ITEM_CREATE] User ${user.userId} created item ${result.item.itemId}`);
    return res.redirect('/search');
  } catch (err) {
    return next(err);
  }
});

// GET /items/:itemId - View individual item with swap requests
router.get('/:itemId', async (req, res, next) => {
  try {
    const { itemId } = req.params;

    if (process.env.NODE_ENV !== 'test' && mongoose.connection.readyState !== 1) {
      return res.status(503).render('error', {
        title: 'Service Unavailable',
        message: 'Database connection unavailable. Please try again later.',
        error: {},
      });
    }

    // Get the item
    const item = await Item.findOne({ itemId }).lean();
    if (!item) {
      return res.status(404).render('error', {
        title: 'Item Not Found',
        message: 'The item you are looking for does not exist.',
        error: {},
      });
    }

    // Get swap requests for this item (if user is the owner)
    let swapRequests = [];
    if (req.session.user.userId === item.ownerId) {
      const SwapRequests = require('../models/SwapRequest');
      const User = require('../models/User');

      const requests = await SwapRequests.find({ itemId }).lean();

      // Get offered items and requester info
      const offeredItemIds = requests.map(r => r.offeredItemId);
      const requesterIds = [...new Set(requests.map(r => r.ownerId))];

      const offeredItems = await Item.find({ itemId: { $in: offeredItemIds } }).lean();
      const requesters = await User.find({ userId: { $in: requesterIds } }, { password: 0 }).lean();

      const offeredItemsMap = offeredItems.reduce((acc, item) => {
        acc[item.itemId] = item;
        return acc;
      }, {});

      const requestersMap = requesters.reduce((acc, user) => {
        acc[user.userId] = user;
        return acc;
      }, {});

      swapRequests = requests.map(request => ({
        ...request,
        offeredItem: offeredItemsMap[request.offeredItemId],
        requester: requestersMap[request.ownerId]
      }));
    }

    return res.render('item-detail', {
      title: item.title,
      item,
      swapRequests,
      isOwner: req.session.user.userId === item.ownerId
    });
  } catch (err) {
    return next(err);
  }
});

// GET /items/:itemId/edit - Render edit form
router.get('/:itemId/edit', async (req, res, next) => {
  try {
    if (process.env.NODE_ENV !== 'test' && mongoose.connection.readyState !== 1) {
      return res.status(503).render('error', {
        title: 'Edit Unavailable',
        message: 'Database connection unavailable. Please try again later.',
        error: {},
      });
    }

    const itemId = (req.params.itemId || '').trim();
    if (!itemId) {
      return res.status(400).render('error', {
        title: 'Invalid Item',
        message: 'Item ID is required.',
        error: {},
      });
    }

    const user = req.session.user;
    const item = await Item.findOne({ itemId }).lean();

    if (!item) {
      return res.status(404).render('error', {
        title: 'Item Not Found',
        message: 'The item you are trying to edit does not exist.',
        error: {},
      });
    }

    // Verify that the user is the owner
    if (item.ownerId !== user.userId) {
      console.log(`[ITEM_EDIT_ATTEMPT] User ${user.userId} attempted to edit item ${itemId} owned by ${item.ownerId}`);
      return res.status(403).render('error', {
        title: 'Access Denied',
        message: 'You can only edit your own items.',
        error: {},
      });
    }


    return res.render('item-edit', {
      title: 'Edit Item',
      categories: ITEM_CATEGORIES,
      item,
      errors: [],
      values: {
        title: item.title || '',
        description: item.description || '',
        itemType: item.itemType || '',
        wantedCategories: item.wantedCategories || [],
      },
    });
  } catch (err) {
    return next(err);
  }
});

// POST /items/:itemId/edit - Update an item
router.post('/:itemId/edit', upload.single('image'), async (req, res, next) => {
  try {
    if (process.env.NODE_ENV !== 'test' && mongoose.connection.readyState !== 1) {
      return res.status(503).render('error', {
        title: 'Edit Unavailable',
        message: 'Database connection unavailable. Please try again later.',
        error: {},
      });
    }

    const itemId = (req.params.itemId || '').trim();
    if (!itemId) {
      return res.status(400).render('error', {
        title: 'Invalid Item',
        message: 'Item ID is required.',
        error: {},
      });
    }

    const user = req.session.user;
    // Fetch item without lean() to get a Mongoose document
    const item = await Item.findOne({ itemId });

    if (!item) {
      return res.status(404).render('error', {
        title: 'Item Not Found',
        message: 'The item you are trying to edit does not exist.',
        error: {},
      });
    }

    // Verify that the user is the owner
    if (item.ownerId !== user.userId) {
      console.log(`[ITEM_EDIT_ATTEMPT] User ${user.userId} attempted to edit item ${itemId} owned by ${item.ownerId}`);
      return res.status(403).render('error', {
        title: 'Access Denied',
        message: 'You can only edit your own items.',
        error: {},
      });
    }

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

    if (errors.length > 0) {
      return res.status(400).render('item-edit', {
        title: 'Edit Item',
        categories: ITEM_CATEGORIES,
        item,
        errors,
        values: { title, description, itemType: itemTypeRaw, wantedCategories: wanted || [] },
      });
    }

    // Update using the document directly - this is more reliable for Buffer types
    item.title = title;
    item.description = description;
    item.itemType = itemType || undefined;
    item.wantedCategories = wantedCategories;

    // Update image if a new one was uploaded
    if (req.file && req.file.buffer) {
      // Ensure image object exists
      if (!item.image) {
        item.image = {};
      }

      // Set nested fields directly
      item.image.data = req.file.buffer;
      item.image.contentType = req.file.mimetype || 'application/octet-stream';
      item.hasImage = true;
      // Add timestamp to imageUrl to force browser cache refresh
      item.imageUrl = `/items/${itemId}/image?v=${Date.now()}`;

      // Mark the entire image object as modified
      item.markModified('image');
    }

    // Save the document
    await item.save();

    console.log(`[ITEM_EDIT] User ${user.userId} updated item ${itemId}`);

    return res.redirect('/search');
  } catch (err) {
    return next(err);
  }
});

// Multer / upload error handler
router.use(async (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const isEditRoute = req.path.includes('/edit');
    const viewName = isEditRoute ? 'item-edit' : 'item-new';
    const title = isEditRoute ? 'Edit Item' : 'Post Item';

    let item = null;
    if (isEditRoute && req.params.itemId) {
      try {
        item = await Item.findOne({ itemId: req.params.itemId }).lean();
      } catch {
        // Ignore error, item will be null
      }
    }

    const renderData = {
      title,
      categories: ITEM_CATEGORIES,
      errors: err.code === 'LIMIT_FILE_SIZE'
        ? ['Image file is too large (max 10MB). Please choose a smaller image.']
        : ['Upload failed. Please try again.'],
      values: {
        title: (req.body && req.body.title) || '',
        description: (req.body && req.body.description) || '',
        itemType: (req.body && req.body.itemType) || '',
        wantedCategories: (req.body && req.body.wantedCategories) || [],
      },
    };
    if (isEditRoute && item) {
      renderData.item = item;
    }
    return res.status(400).render(viewName, renderData);
  }

  return next(err);
});

module.exports = {
  router,
  createItem
};

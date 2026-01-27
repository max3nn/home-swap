const express = require('express');
const mongoose = require('mongoose');
const Item = require('../models/Item');
const User = require('../models/User');
const { ITEM_CATEGORIES, normalizeCategory, isValidCategory } = require('../config/itemCategories');

const router = express.Router();

router.use((req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  next();
});

// GET /search - Search/browse items
router.get('/', async (req, res, next) => {
  try {
    const q = (req.query.q || '').toString().trim();
    // Back-compat: `type` was the original query param for the offered category
    const offer = normalizeCategory(req.query.offer || req.query.type || '');
    const want = normalizeCategory(req.query.want || '');
    const includeSwapped = req.query.includeSwapped === 'true';

    if (process.env.NODE_ENV !== 'test' && mongoose.connection.readyState !== 1) {
      return res.status(503).render('error', {
        title: 'Search Unavailable',
        message: 'Database connection unavailable. Please try again later.',
        error: {},
      });
    }

    const filter = {};

    const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // By default, exclude swapped items unless explicitly requested
    if (!includeSwapped) {
      filter.status = { $ne: 'swapped' };
    }

    if (q) {
      const regex = new RegExp(escapeRegex(q), 'i');
      filter.$or = [{ title: regex }, { description: regex }];
    }

    if (offer && isValidCategory(offer)) {
      filter.itemType = new RegExp(`^${escapeRegex(offer)}$`, 'i');
    }

    if (want && isValidCategory(want)) {
      filter.wantedCategories = new RegExp(`^${escapeRegex(want)}$`, 'i');
    }

    const items = await Item.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Get unique owner IDs and fetch user information
    const ownerIds = [...new Set(items.map(item => item.ownerId))];
    const owners = await User.find({ userId: { $in: ownerIds } }, { username: 1, userId: 1 }).lean();
    const ownerMap = owners.reduce((map, owner) => {
      map[owner.userId] = owner.username;
      return map;
    }, {});

    // Add owner names to items
    const itemsWithOwnerNames = items.map(item => ({
      ...item,
      ownerName: ownerMap[item.ownerId] || 'Unknown User'
    }));

    return res.render('search', {
      title: 'Search Items',
      items: itemsWithOwnerNames,
      q,
      offer,
      want,
      includeSwapped,
      categories: ITEM_CATEGORIES,
      resultCount: itemsWithOwnerNames.length,
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;

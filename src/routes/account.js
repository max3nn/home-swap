const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');

const router = express.Router();

router.use((req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  next();
});

// GET /account - Profile/account details
router.get('/', async (req, res, next) => {
  try {
    const user = req.session.user;

    if (process.env.NODE_ENV !== 'test' && mongoose.connection.readyState !== 1) {
      return res.status(503).render('error', {
        title: 'Account Unavailable',
        message: 'Database connection unavailable. Please try again later.',
        error: {},
      });
    }

    return res.render('account', {
      title: 'My Account',
      profile: user,
    });
  } catch (err) {
    return next(err);
  }
});

// GET /account/edit - Render edit account page
router.get('/edit', async (req, res, next) => {
  try {
    if (process.env.NODE_ENV !== 'test' && mongoose.connection.readyState !== 1) {
      return res.status(503).render('error', {
        title: 'Account Unavailable',
        message: 'Database connection unavailable. Please try again later.',
        error: {},
      });
    }

    return res.render('account-edit', {
      title: 'Edit Account',
      profile: req.session.user,
      errors: [],
    });
  } catch (err) {
    return next(err);
  }
});

// POST /account/edit - Update account details
router.post('/edit', async (req, res, next) => {
  try {
    if (process.env.NODE_ENV !== 'test' && mongoose.connection.readyState !== 1) {
      return res.status(503).render('error', {
        title: 'Account Unavailable',
        message: 'Database connection unavailable. Please try again later.',
        error: {},
      });
    }

    const { username, password, confirmPassword } = req.body;
    const errors = [];

    const trimmedUsername = (username || '').trim();

    if (!trimmedUsername) errors.push('Username is required');

    const nextPassword = (password || '').trim();
    const nextConfirm = (confirmPassword || '').trim();
    if (nextPassword) {
      if (nextPassword.length < 6) errors.push('Password must be at least 6 characters');
      if (nextPassword !== nextConfirm) errors.push('Passwords do not match');
    }

    if (errors.length > 0) {
      return res.status(400).render('account-edit', {
        title: 'Edit Account',
        profile: { ...req.session.user, username: trimmedUsername || req.session.user.username },
        errors,
      });
    }

    const userDoc = await User.findOne({ userId: req.session.user.userId });
    if (!userDoc) {
      return res.status(404).render('error', {
        title: 'Not Found',
        message: 'User account not found.',
        error: {},
      });
    }

    userDoc.username = trimmedUsername;
    if (nextPassword) {
      userDoc.password = nextPassword;
    }

    await userDoc.save();

    // Keep session in sync
    req.session.user.username = userDoc.username;

    return res.redirect('/account');
  } catch (err) {
    // Handle duplicate keys cleanly
    if (err && err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || 'field';
      return res.status(409).render('account-edit', {
        title: 'Edit Account',
        profile: req.session.user,
        errors: [`That ${field} is already in use`],
      });
    }
    return next(err);
  }
});

module.exports = router;

const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const router = express.Router();

// GET /auth/register - Render registration page
router.get('/register', (req, res) => {
  res.render('register', { title: 'Register' });
});

// GET /auth/login - Render login page
router.get('/login', (req, res) => {
  // Redirect to home if already logged in
  if (req.session.user) {
    return res.redirect('/');
  }
  res.render('login', { title: 'Login' });
});

// POST /auth/register - User registration endpoint
router.post('/register', async (req, res) => {
  try {
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database connection unavailable. Please try again later.',
      });
    }

    const { name, email, password } = req.body;

    // Validation: Check if all required fields are provided
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password',
      });
    }

    // Trim and normalize inputs
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    // Validation: Check if name is not empty after trimming
    if (!trimmedName) {
      return res.status(400).json({
        success: false,
        message: 'Name cannot be empty',
      });
    }

    // Validation: Check if email is valid format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    // Validation: Check password length (minimum 8 characters)
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long',
      });
  }

    // Check password strength
    const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

    if (!strongPasswordRegex.test(password)) {
      return res.status(400).json({
        success: false,
        message:
          'Password must include at least one uppercase letter, one lowercase letter, and one number',
     });
  }

    // Generic error response - always return JSON
    return res.status(500).json({
      success: false,
      message: 'An error occurred during registration. Please try again.',
      ...(process.env.NODE_ENV === 'development' && { error: error.message }),
    });

    // Check if user already exists (case-insensitive for email)
    const existingUser = await User.findOne({
      $or: [
        { email: trimmedEmail },
        { username: trimmedName }
      ],
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email or username already exists',
      });
    }

    // Generate unique userId
    const userId = new mongoose.Types.ObjectId().toString();

    // Create new user
    const user = new User({
      userId,
      username: trimmedName,
      email: trimmedEmail,
      password,
      userrole: 'user', // Default role for new registrations
    });

    // Save user to database (password will be hashed by pre-save middleware)
    await user.save();

    // Return success response
    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      data: {
        userId: user.userId,
        username: user.username,
        email: user.email,
        userrole: user.userrole,
      },
    });
  } catch (error) {
    console.error('Registration error:', error.message);

    // Ensure we always return JSON, not HTML
    res.setHeader('Content-Type', 'application/json');

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'field';
      return res.status(409).json({
        success: false,
        message: `User with this ${field} already exists`,
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const errorMessages = Object.values(error.errors || {}).map((e) => e.message);
      return res.status(400).json({
        success: false,
        message: errorMessages.length > 0 ? errorMessages.join(', ') : 'Validation failed',
      });
    }

    // Handle mongoose connection errors
    if (error.name === 'MongoServerError' || error.message && error.message.includes('Mongo')) {
      return res.status(503).json({
        success: false,
        message: 'Database connection error. Please try again later.',
      });
    }

    // Generic error response - always return JSON
    return res.status(500).json({
      success: false,
      message: 'An error occurred during registration. Please try again.',
      ...(process.env.NODE_ENV === 'development' && { error: error.message }),
    });
  }
});

// POST /auth/login - User login endpoint
router.post('/login', async (req, res) => {
  try {
    // Check if database is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: 'Database connection unavailable. Please try again later.',
      });
    }

    const { email, password } = req.body;

    // Validation: Check if all required fields are provided
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Trim and normalize email
    const trimmedEmail = email.trim().toLowerCase();

    // Validation: Check if email is valid format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    // Find user by email
    const user = await User.findOne({ email: trimmedEmail });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Create user session
    req.session.user = {
      userId: user.userId,
      username: user.username,
      email: user.email,
      userrole: user.userrole,
    };

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        userId: user.userId,
        username: user.username,
        email: user.email,
        userrole: user.userrole,
      },
    });
  } catch (error) {
    console.error('Login error:', error.message);

    // Ensure we always return JSON, not HTML
    res.setHeader('Content-Type', 'application/json');

    // Handle mongoose connection errors
    if (error.name === 'MongoServerError' || (error.message && error.message.includes('Mongo'))) {
      return res.status(503).json({
        success: false,
        message: 'Database connection error. Please try again later.',
      });
    }

    // Generic error response - always return JSON
    return res.status(500).json({
      success: false,
      message: 'An error occurred during login. Please try again.',
      ...(process.env.NODE_ENV === 'development' && { error: error.message }),
    });
  }
});

module.exports = router;


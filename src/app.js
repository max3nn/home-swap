const express = require('express');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const connectDB = require('./config/database');
const Item = require('./models/Item');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to database
connectDB();

// Set up EJS templating with layouts
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layout');

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-here-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Middleware to make session data available to all views
app.use((req, res, next) => {
  res.locals.currentPage = req.path;
  res.locals.user = req.session.user || null;
  res.locals.success = req.session.success || null;
  if (req.session.success) {
    delete req.session.success;
  }
  next();
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Basic route
app.get('/', async (req, res) => {
  try {
    // Fetch a sample of available items with images (limit 6 for display)
    const sampleItems = await Item.find({ status: 'available' })
      .select('itemId title description imageUrl hasImage itemType')
      .limit(6)
      .sort({ createdAt: -1 }); // Get most recent items

    res.render('home', {
      title: 'Home Swap Platform',
      sampleItems: sampleItems
    });
  } catch (error) {
    console.error('Error fetching sample items:', error);
    res.render('home', {
      title: 'Home Swap Platform',
      sampleItems: []
    });
  }
});

// Auth routes
const authRoutes = require('./routes/auth');
app.use('/auth', authRoutes);

// Search routes (requires login in the router)
const searchRoutes = require('./routes/search');
app.use('/search', searchRoutes);

// Account routes (requires login in the router)
const accountRoutes = require('./routes/account');
app.use('/account', accountRoutes);

// Item routes (requires login in the router)
const itemRoutes = require('./routes/items');
app.use('/items', itemRoutes.router);

// Swap routes (requires login in the router)
const swapRoutes = require('./routes/swaps');
app.use('/swaps', swapRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', {
    title: 'Error',
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Page Not Found',
    message: 'The page you are looking for does not exist.',
    error: {}
  });
});

// Start server (only when run directly, not during tests)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
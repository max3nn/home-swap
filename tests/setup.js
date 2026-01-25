const mongoose = require('mongoose');

// Set test environment
process.env.NODE_ENV = 'test';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Setup test database connection (only if MongoDB is available)
beforeAll(async () => {
  const mongoURI =
    process.env.MONGODB_TEST_URI ||
    'mongodb://admin:password@localhost:27018/homeswap_test?authSource=admin';
  
  try {
    // Only connect if MongoDB is available
    await mongoose.connect(mongoURI, { serverSelectionTimeoutMS: 2000 });
  } catch (error) {
    // MongoDB not available, tests will run without database
    console.warn('MongoDB not available for testing. Database-dependent tests may be skipped.');
  }
}, 15000);

// Clean up after each test
afterEach(async () => {
  if (mongoose.connection.readyState === 1) {
    try {
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        const collection = collections[key];
        await collection.deleteMany({});
      }
    } catch (error) {
      // Ignore cleanup errors
    }
  }
});

// Close database connection after all tests
afterAll(async () => {
  if (mongoose.connection.readyState !== 0) {
    try {
      await mongoose.connection.close();
    } catch (error) {
      // Ignore close errors
    }
  }
}, 15000);
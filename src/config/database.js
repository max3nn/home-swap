const mongoose = require('mongoose');
const seedDatabase = require('./seedDatabase');

const connectDB = async () => {
  try {
    // docker-compose enables MongoDB authentication by default.
    // If you don't provide MONGODB_URI, fall back to the application user created in docker/mongo-init.js.
    const mongoURI =
      process.env.MONGODB_URI ||
      'mongodb://localhost:27017/homeswap';

    const conn = await mongoose.connect(mongoURI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Seed database if required
    await seedDatabase();

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('Database connection failed:', error);
    // Don't exit in test environment
    if (process.env.NODE_ENV !== 'test') {
      process.exit(1);
    }
  }
};

module.exports = connectDB;
const mongoose = require('mongoose');
const seedUsers = require('./seedUsers');
const seedItems = require('./seedItems');
const seedSwapRequests = require('./seedSwapRequests');
const seedLogs = require('./seedLogs');

async function seedDatabase() {
  try {
    console.log('Seeding users...');
    await seedUsers();

    console.log('Seeding items...');
    await seedItems();

    console.log('Seeding swap requests...');
    await seedSwapRequests();

    console.log('Seeding logs...');
    await seedLogs();

    console.log('Database seeding completed successfully!');
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

module.exports = seedDatabase;
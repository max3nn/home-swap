import mongoose from 'mongoose';
import seedUsers from './seedusers.js';
import seedItems from './seeditems.js';
import seedSwaps from './seedswaps.js';
import seedLogs from './seedlogs.js';

async function seedDatabase() {
  try {
    console.log('Seeding users...');
    await seedUsers();

    console.log('Seeding items...');
    await seedItems();

    console.log('Seeding swaps...');
    await seedSwaps();

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

mongoose
  .connect('mongodb://localhost:27017/homeswapDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log('Database connected');
    await seedDatabase();
  })
  .catch(err => {
    console.error('Database connection error:', err);
    process.exit(1);
  });

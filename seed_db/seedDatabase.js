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
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();

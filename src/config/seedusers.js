const User = require('../models/User');

const seedUsers = async () => {
  const users = [
    {
      userId: 1,
      username: 'Antheis',
      email: 'antheis@example.com',
      password: 'password123',
      userrole: 'sample',
    },
    {
      userId: 2,
      username: 'Joshua',
      email: 'joshua@example.com',
      password: 'password123',
      userrole: 'sample',
    },
    {
      userId: 3,
      username: 'Rana',
      email: 'rana@example.com',
      password: 'password123',
      userrole: 'sample',
    },
    {
      userId: 4,
      username: 'Sheibha',
      email: 'sheibha@example.com',
      password: 'password123',
      userrole: 'sample',
    },
  ];
  await User.deleteMany({});
  await User.insertMany(users);
};

module.exports = seedUsers;

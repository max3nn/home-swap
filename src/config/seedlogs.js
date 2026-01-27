const Log = require('../models/Log');

const seedLogs = async () => {
  const logs = [
    {
      logId: new mongoose.Types.ObjectId().toString(),
      action: 'user_created',
      timestamp: new Date(),
      userId: '1',
    },
    {
      logId: new mongoose.Types.ObjectId().toString(),
      action: 'item_created',
      timestamp: new Date(),
      userId: '2',
    },
    {
      logId: new mongoose.Types.ObjectId().toString(),
      action: 'swap_created',
      timestamp: new Date(),
      userId: '3',
    },
  ];
  await Log.deleteMany({});
  await Log.insertMany(logs);
};

module.exports = seedLogs;

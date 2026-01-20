import mongoose from 'mongoose';

// Create logSchema
const logSchema = new mongoose.Schema({
  logId: {
    type: String,
    required: true,
    unique: true,
  },
  action: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now,
  },
  userId: {
    type: String,
    required: false,
  },
});

const Log = mongoose.model('Log', logSchema);

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

mongoose
  .connect('mongodb://localhost:27017/homeswapDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log('Database connected');
    await seedLogs();
    console.log('Database seeded with logs');
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Database connection error:', err);
  });

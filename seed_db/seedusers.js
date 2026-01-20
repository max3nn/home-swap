import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

// Create userSchema
const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  userrole: {
    type: String,
    required: true,
  },
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Hash password before insertMany
userSchema.pre('insertMany', async function (next, docs) {
  try {
    const salt = await bcrypt.genSalt(10);
    for (let doc of docs) {
      doc.password = await bcrypt.hash(doc.password, salt);
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

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

mongoose
  .connect('mongodb://localhost:27017/homeswapDB', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(async () => {
    console.log('Database connected');
    await seedUsers();
    console.log('Database seeded with users');
    mongoose.connection.close();
  })
  .catch(err => {
    console.error('Database connection error:', err);
  });

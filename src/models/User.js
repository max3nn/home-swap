const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

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
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },
  userrole: {
    type: String,
    required: true,
    default: 'user',
  },
}, {
  timestamps: true,
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    return next();
  } catch (error) {
    return next(error);
  }
});

// Hash password before insertMany
userSchema.pre('insertMany', async function (next, docs) {
  try {
    const salt = await bcrypt.genSalt(10);
    for (let doc of docs) {
      if (doc.password) {
        doc.password = await bcrypt.hash(doc.password, salt);
      }
    }
  } catch (error) {
    throw error;
    return next();
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;


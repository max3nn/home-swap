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

// Add indexes for better query performance (userId, username, email already have unique indexes)
userSchema.index({ userrole: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ userrole: 1, createdAt: -1 }); // Compound index for admin queries

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  } catch (error) {
    throw error;
  }
});

// Hash password before insertMany
userSchema.pre('insertMany', async function (docs) {
  try {
    const salt = await bcrypt.genSalt(10);
    for (let doc of docs) {
      if (doc.password) {
        doc.password = await bcrypt.hash(doc.password, salt);
      }
    }
  } catch (error) {
    throw error;
  }
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;


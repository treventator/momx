const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // LINE Profile - Primary authentication
  lineProfile: {
    lineUserId: {
      type: String,
      unique: true,
      sparse: true,
      index: true
    },
    displayName: {
      type: String,
      trim: true
    },
    pictureUrl: {
      type: String
    },
    statusMessage: {
      type: String
    }
  },
  // Authentication provider
  authProvider: {
    type: String,
    enum: ['email', 'line'],
    default: 'line'
  },
  // Email - optional for LINE users
  email: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    lowercase: true
  },
  // Password - optional for LINE users
  password: {
    type: String,
    minlength: 6
  },
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['customer', 'admin', 'staff'],
    default: 'customer'
  },
  membership: {
    type: String,
    enum: ['none', 'basic', 'premium'],
    default: 'none'
  },
  // ระบบสะสมแต้ม
  points: {
    type: Number,
    default: 0
  },
  pointsHistory: [{
    amount: { type: Number, required: true }, // + หรือ -
    type: { type: String, enum: ['earn', 'redeem', 'expire', 'bonus'], required: true },
    description: { type: String },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    createdAt: { type: Date, default: Date.now }
  }],
  subscription: {
    isActive: { type: Boolean, default: false },
    plan: { type: String, enum: ['monthly', 'quarterly', 'yearly'], default: 'monthly' },
    nextDeliveryDate: { type: Date },
    startDate: { type: Date },
    items: [{
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantity: { type: Number, default: 1 }
    }],
    shippingAddress: {
      addressLine1: { type: String },
      addressLine2: { type: String },
      city: { type: String },
      state: { type: String },
      postalCode: { type: String },
      country: { type: String, default: 'Thailand' }
    },
    payment: {
      method: { type: String },
      last4: { type: String },
      expiryDate: { type: String }
    }
  },
  addresses: [{
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true, default: 'Thailand' },
    isDefault: { type: Boolean, default: false }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// ก่อนบันทึก - เข้ารหัสรหัสผ่าน
userSchema.pre('save', async function(next) {
  const user = this;
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 10);
  }
  next();
});

// เมธอดสำหรับตรวจสอบรหัสผ่าน
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User; 
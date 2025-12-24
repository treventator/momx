const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: { type: String, required: true }, // Denormalized for quick access
  price: { type: Number, required: true }, // Denormalized for quick access
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  variant: { type: String }, // Optional variant identifier
  image: { type: String } // Denormalized for quick access
}, { _id: false });

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  guestId: {
    type: String,
    required: false
  },
  items: [cartItemSchema],
  totalQuantity: {
    type: Number,
    default: 0
  },
  subtotal: {
    type: Number,
    default: 0
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

// Middleware to calculate totalQuantity and subtotal before saving
cartSchema.pre('save', function(next) {
  if (!this.user && !this.guestId) {
    next(new Error('ต้องระบุ user หรือ guestId อย่างน้อย 1 อย่าง'));
  } else {
    this.totalQuantity = this.items.reduce((sum, item) => sum + item.quantity, 0);
    this.subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    this.updatedAt = Date.now();
    next();
  }
});

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart; 
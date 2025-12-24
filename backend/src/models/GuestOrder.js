const mongoose = require('mongoose');

const guestOrderSchema = new mongoose.Schema({
  guestId: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    price: {
      type: Number,
      required: true
    },
    image: {
      type: String
    }
  }],
  shippingAddress: {
    addressLine1: {
      type: String,
      required: true
    },
    addressLine2: {
      type: String
    },
    city: {
      type: String,
      required: true
    },
    state: {
      type: String,
      required: true
    },
    postalCode: {
      type: String,
      required: true
    },
    country: {
      type: String,
      default: 'Thailand',
      required: true
    }
  },
  billingAddress: {
    sameAsShipping: {
      type: Boolean,
      default: true
    },
    addressLine1: {
      type: String
    },
    addressLine2: {
      type: String
    },
    city: {
      type: String
    },
    state: {
      type: String
    },
    postalCode: {
      type: String
    },
    country: {
      type: String,
      default: 'Thailand'
    }
  },
  paymentMethod: {
    type: {
      type: String,
      enum: ['credit_card', 'bank_transfer', 'prompt_pay', 'cash_on_delivery'],
      required: true
    },
    details: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  subtotal: {
    type: Number,
    required: true
  },
  shippingFee: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    required: true,
    enum: ['Pending Payment', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'],
    default: 'Pending Payment'
  },
  trackingNumber: {
    type: String
  },
  notes: {
    type: String
  },
  convertToMember: {
    type: Boolean,
    default: false
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  paidAt: {
    type: Date
  },
  isDelivered: {
    type: Boolean,
    default: false
  },
  deliveredAt: {
    type: Date
  },
  isStockDecremented: {
    type: Boolean,
    default: false
  },
  convertedUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Middleware สำหรับการคำนวณยอดรวม
guestOrderSchema.pre('save', function(next) {
  // ถ้า billingAddress.sameAsShipping เป็น true ให้ใช้ shippingAddress
  if (this.billingAddress && this.billingAddress.sameAsShipping) {
    this.billingAddress.addressLine1 = this.shippingAddress.addressLine1;
    this.billingAddress.addressLine2 = this.shippingAddress.addressLine2;
    this.billingAddress.city = this.shippingAddress.city;
    this.billingAddress.state = this.shippingAddress.state;
    this.billingAddress.postalCode = this.shippingAddress.postalCode;
    this.billingAddress.country = this.shippingAddress.country;
  }
  
  // คำนวณยอดรวม
  this.subtotal = this.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
  
  this.total = this.subtotal + this.shippingFee - this.discount;
  
  this.updatedAt = Date.now();
  next();
});

const GuestOrder = mongoose.model('GuestOrder', guestOrderSchema);

module.exports = GuestOrder; 
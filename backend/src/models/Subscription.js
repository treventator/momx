const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'paused', 'cancelled'],
    default: 'active'
  },
  plan: {
    type: String,
    enum: ['monthly', 'quarterly', 'yearly'],
    required: true
  },
  items: [{
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1
    },
    price: {
      type: Number,
      required: true
    }
  }],
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  nextDeliveryDate: {
    type: Date,
    required: true
  },
  lastDeliveryDate: {
    type: Date
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  shippingAddress: {
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true, default: 'Thailand' }
  },
  paymentMethod: {
    type: {
      type: String,
      enum: ['credit_card', 'bank_transfer', 'prompt_pay'],
      required: true
    },
    details: {
      type: mongoose.Schema.Types.Mixed
    }
  },
  deliveryHistory: [{
    deliveryDate: { type: Date },
    status: { 
      type: String, 
      enum: ['pending', 'processing', 'shipped', 'delivered', 'failed'],
      default: 'pending'
    },
    trackingNumber: { type: String },
    notes: { type: String }
  }],
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

// เพิ่ม method สำหรับคำนวณวันที่ส่งสินค้าครั้งถัดไป
subscriptionSchema.methods.calculateNextDeliveryDate = function() {
  const currentDate = this.nextDeliveryDate || new Date();
  let nextDate = new Date(currentDate);
  
  switch (this.plan) {
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + 1);
      break;
    case 'quarterly':
      nextDate.setMonth(nextDate.getMonth() + 3);
      break;
    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + 1);
      break;
    default:
      nextDate.setMonth(nextDate.getMonth() + 1);
  }
  
  this.nextDeliveryDate = nextDate;
  return nextDate;
};

// ก่อนบันทึกให้คำนวณราคารวม
subscriptionSchema.pre('save', function(next) {
  // คำนวณราคารวม
  this.totalAmount = this.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
  
  // ถ้าไม่มีวันที่ส่งของครั้งถัดไป ให้ตั้งค่าเริ่มต้น
  if (!this.nextDeliveryDate) {
    this.calculateNextDeliveryDate();
  }
  
  this.updatedAt = Date.now();
  next();
});

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription; 
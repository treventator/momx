const mongoose = require('mongoose');

const orderSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    orderItems: [
      {
        name: { type: String, required: true },
        qty: { type: Number, required: true },
        image: { type: String },
        price: { type: Number, required: true },
        subtotal: { type: Number, required: true },
        product: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: 'Product',
        },
      },
    ],
    shippingAddress: {
      fullName: { type: String, required: true },
      addressLine1: { type: String, required: true },
      addressLine2: { type: String },
      city: { type: String, required: true },
      province: { type: String, required: true },
      postalCode: { type: String, required: true },
      phoneNumber: { type: String, required: true },
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['credit_card', 'bank_transfer', 'promptpay', 'cash_on_delivery'],
    },
    paymentResult: {
      id: { type: String },
      status: { type: String },
      update_time: { type: String },
      email_address: { type: String },
    },
    shippingMethod: {
      type: String,
      required: true,
      enum: ['standard', 'express'],
    },
    shippingInfo: {
      trackingNumber: { type: String },
      carrier: { type: String },
      shippedAt: { type: Date },
    },
    itemsPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    taxPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    shippingPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    totalPrice: {
      type: Number,
      required: true,
      default: 0.0,
    },
    status: {
      type: String,
      required: true,
      enum: ['Pending Payment', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'],
      default: 'Pending Payment',
    },
    isPaid: {
      type: Boolean,
      required: true,
      default: false,
    },
    paidAt: {
      type: Date,
    },
    isDelivered: {
      type: Boolean,
      required: true,
      default: false,
    },
    deliveredAt: {
      type: Date,
    },
    isRestocked: {
      type: Boolean,
      default: false,
    },
    isStockDecremented: {
      type: Boolean,
      default: false,
    },
    note: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual for order number (for display purposes)
orderSchema.virtual('orderNumber').get(function() {
  // Format: TY + year + month + day + 4-digit counter
  const createdAt = this.createdAt || new Date();
  const year = createdAt.getFullYear().toString().slice(-2);
  const month = ('0' + (createdAt.getMonth() + 1)).slice(-2);
  const day = ('0' + createdAt.getDate()).slice(-2);
  
  // Use the last 4 digits of the ObjectId as the counter
  const idStr = this._id.toString();
  const counter = idStr.substring(idStr.length - 4);
  
  return `TY${year}${month}${day}${counter}`;
});

// Add order number to JSON output
orderSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order; 
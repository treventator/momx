const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'ชื่อสินค้าเป็นฟิลด์บังคับ'],
    trim: true,
    maxlength: [100, 'ชื่อสินค้าต้องไม่เกิน 100 ตัวอักษร']
  },
  slug: {
    type: String,
    unique: true,
    lowercase: true
  },
  description: {
    type: String,
    required: [true, 'คำอธิบายสินค้าเป็นฟิลด์บังคับ'],
    maxlength: [2000, 'คำอธิบายสินค้าต้องไม่เกิน 2000 ตัวอักษร']
  },
  shortDescription: {
    type: String,
    maxlength: [200, 'คำอธิบายสั้นต้องไม่เกิน 200 ตัวอักษร']
  },
  price: {
    type: Number,
    required: [true, 'ราคาสินค้าเป็นฟิลด์บังคับ'],
    min: [0, 'ราคาสินค้าต้องไม่ต่ำกว่า 0'],
    max: [1000000, 'ราคาสินค้าต้องไม่เกิน 1,000,000']
  },
  salePrice: {
    type: Number,
    default: 0,
    validate: {
      validator: function (value) {
        return value <= this.price;
      },
      message: 'ราคาส่วนลดต้องน้อยกว่าหรือเท่ากับราคาปกติ'
    }
  },
  memberPrice: {
    type: Number,
    default: 0,
    validate: {
      validator: function (value) {
        return value <= this.price;
      },
      message: 'ราคาสำหรับสมาชิกต้องน้อยกว่าหรือเท่ากับราคาปกติ'
    }
  },
  isSubscribable: {
    type: Boolean,
    default: false
  },
  subscriptionPlans: [{
    name: { type: String, required: true },
    frequency: { type: String, enum: ['weekly', 'monthly', 'quarterly', 'yearly'], required: true },
    price: { type: Number, required: true },
    description: { type: String }
  }],
  images: [
    {
      url: {
        type: String,
        required: true
      },
      alt: {
        type: String,
        default: ''
      },
      isMain: {
        type: Boolean,
        default: false
      }
    }
  ],
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category'
    // Optional - ไม่บังคับใส่หมวดหมู่
  },
  tags: [{
    type: String,
    trim: true
  }],
  stock: {
    type: Number,
    required: [true, 'จำนวนสินค้าคงเหลือเป็นฟิลด์บังคับ'],
    min: [0, 'จำนวนสินค้าคงเหลือต้องไม่ต่ำกว่า 0'],
    default: 0
  },
  sku: {
    type: String,
    required: [true, 'รหัสสินค้าเป็นฟิลด์บังคับ'],
    unique: true,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  salesCount: {
    type: Number,
    default: 0
  },
  viewCount: {
    type: Number,
    default: 0
  },
  metadata: {
    type: Map,
    of: String,
    default: {}
  },
  ingredients: {
    type: String
  },
  weight: {
    type: Number,
    min: [0, 'น้ำหนักต้องไม่ต่ำกว่า 0']
  },
  dimensions: {
    length: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 }
  },
  reviews: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      name: {
        type: String,
        required: true
      },
      rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
      },
      comment: {
        type: String,
        required: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  rating: {
    type: Number,
    required: true,
    default: 0
  },
  numReviews: {
    type: Number,
    required: true,
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
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ส่วนลดเป็นเปอร์เซ็นต์
productSchema.virtual('discountPercentage').get(function () {
  if (this.salePrice === 0 || this.salePrice >= this.price) {
    return 0;
  }
  return Math.round(((this.price - this.salePrice) / this.price) * 100);
});

// เพิ่ม virtual field ส่วนลดสำหรับสมาชิกเป็นเปอร์เซ็นต์
productSchema.virtual('memberDiscountPercentage').get(function () {
  if (this.memberPrice === 0 || this.memberPrice >= this.price) {
    return 0;
  }
  return Math.round(((this.price - this.memberPrice) / this.price) * 100);
});

// สร้าง slug จากชื่อสินค้า (unique by adding timestamp)
productSchema.pre('save', function (next) {
  if (!this.slug) {
    const baseSlug = this.name
      .toLowerCase()
      .replace(/[^\w\sก-๙]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 50); // Limit length
    // Add timestamp suffix to ensure uniqueness
    this.slug = `${baseSlug}-${Date.now()}`;
  }
  this.updatedAt = Date.now();
  next();
});

// สร้าง index สำหรับการค้นหา
productSchema.index({ name: 'text', description: 'text', tags: 'text', 'metadata.color': 'text', 'metadata.material': 'text', 'metadata.size': 'text' });
productSchema.index({ slug: 1 });
productSchema.index({ category: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ price: 1 });
productSchema.index({ salePrice: 1 });
productSchema.index({ createdAt: -1 });
productSchema.index({ salesCount: -1 });

// เพิ่ม main image helper method
productSchema.methods.getMainImage = function () {
  if (!this.images || this.images.length === 0) {
    return null;
  }

  const mainImage = this.images.find(image => image.isMain);
  return mainImage || this.images[0];
};

// เพิ่ม stock status helper method
productSchema.virtual('stockStatus').get(function () {
  if (this.stock <= 0) {
    return 'สินค้าหมด';
  } else if (this.stock < 5) {
    return 'สินค้าใกล้หมด';
  }
  return 'มีสินค้า';
});

const Product = mongoose.model('Product', productSchema);

module.exports = Product; 
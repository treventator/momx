const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'ชื่อหมวดหมู่เป็นฟิลด์บังคับ'],
    trim: true
  },
  slug: {
    type: String,
    required: [true, 'slug เป็นฟิลด์บังคับ'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  image: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Auto-create slug from name if not provided
categorySchema.pre('validate', function(next) {
  if (!this.slug && this.name) {
    this.slug = this.name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '');
  }
  next();
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
/**
 * Product Test Fixtures
 * ข้อมูลจำลองสำหรับทดสอบ Product
 */

const mongoose = require('mongoose');

const validProductId = new mongoose.Types.ObjectId();
const validCategoryId = new mongoose.Types.ObjectId();

const mockCategory = {
  _id: validCategoryId,
  name: 'ผลิตภัณฑ์บำรุงผิว',
  slug: 'skincare',
  description: 'ผลิตภัณฑ์บำรุงผิวหน้าและผิวกาย',
  isActive: true,
  image: 'https://example.com/category.jpg',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const mockProduct = {
  _id: validProductId,
  name: 'เซรั่มบำรุงผิว',
  slug: 'serum-product',
  description: 'เซรั่มบำรุงผิวหน้า สูตรเข้มข้น',
  shortDescription: 'เซรั่มบำรุงผิว',
  price: 1290,
  salePrice: 990,
  memberPrice: 890,
  category: validCategoryId,
  sku: 'SKU-001',
  stock: 50,
  images: [
    'https://example.com/product1.jpg',
    'https://example.com/product2.jpg',
  ],
  tags: ['serum', 'skincare', 'bestseller'],
  isActive: true,
  isFeatured: true,
  isSubscribable: false,
  rating: 4.5,
  numReviews: 10,
  reviews: [],
  viewCount: 100,
  salesCount: 25,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const mockProductInput = {
  name: 'ครีมบำรุงผิว',
  description: 'ครีมบำรุงผิวหน้า สูตรอ่อนโยน',
  price: 890,
  category: validCategoryId.toString(),
  sku: 'SKU-002',
  stock: 100,
};

const mockProducts = [
  mockProduct,
  {
    ...mockProduct,
    _id: new mongoose.Types.ObjectId(),
    name: 'โทนเนอร์',
    slug: 'toner-product',
    sku: 'SKU-002',
    price: 590,
    stock: 30,
  },
  {
    ...mockProduct,
    _id: new mongoose.Types.ObjectId(),
    name: 'มอยส์เจอร์ไรเซอร์',
    slug: 'moisturizer-product',
    sku: 'SKU-003',
    price: 790,
    stock: 40,
  },
];

const mockLowStockProducts = [
  {
    ...mockProduct,
    _id: new mongoose.Types.ObjectId(),
    name: 'สินค้าใกล้หมด',
    stock: 3,
  },
  {
    ...mockProduct,
    _id: new mongoose.Types.ObjectId(),
    name: 'สินค้าหมด',
    stock: 0,
  },
];

module.exports = {
  validProductId,
  validCategoryId,
  mockCategory,
  mockProduct,
  mockProductInput,
  mockProducts,
  mockLowStockProducts,
};


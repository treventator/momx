/**
 * Products API Integration Tests
 * ทดสอบ Products API endpoints
 */

const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');

// Mock models
jest.mock('../../src/models/Product');
jest.mock('../../src/models/Category');
jest.mock('../../src/utils/redis', () => require('../mocks/redis.mock'));

const Product = require('../../src/models/Product');
const Category = require('../../src/models/Category');

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/shop/products', require('../../src/routes/productRoutes'));
  
  // Error handler
  app.use((err, req, res, next) => {
    res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    });
  });
  
  return app;
};

describe('Products API', () => {
  let app;

  const mockProduct = {
    _id: new mongoose.Types.ObjectId(),
    name: 'เซรั่มบำรุงผิว',
    slug: 'serum-product',
    price: 1290,
    salePrice: 990,
    stock: 50,
    isActive: true,
    isFeatured: true,
    category: new mongoose.Types.ObjectId(),
    viewCount: 100,
    save: jest.fn(),
  };

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ================================================
  // GET /api/shop/products
  // ================================================
  describe('GET /api/shop/products', () => {
    it('ควรดึงรายการสินค้าทั้งหมดได้ - 200', async () => {
      Product.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([mockProduct]),
      });
      Product.countDocuments.mockResolvedValue(1);

      const res = await request(app).get('/api/shop/products');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.products).toBeDefined();
      expect(Array.isArray(res.body.products)).toBe(true);
    });

    it('ควร filter ตาม category ได้', async () => {
      const categoryId = new mongoose.Types.ObjectId();
      
      Product.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([mockProduct]),
      });
      Product.countDocuments.mockResolvedValue(1);

      const res = await request(app)
        .get('/api/shop/products')
        .query({ category: categoryId.toString() });

      expect(res.status).toBe(200);
    });

    it('ควร filter ตาม price range ได้', async () => {
      Product.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([mockProduct]),
      });
      Product.countDocuments.mockResolvedValue(1);

      const res = await request(app)
        .get('/api/shop/products')
        .query({ minPrice: 500, maxPrice: 1500 });

      expect(res.status).toBe(200);
    });

    it('ควร sort ตาม price ได้', async () => {
      Product.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([mockProduct]),
      });
      Product.countDocuments.mockResolvedValue(1);

      const res = await request(app)
        .get('/api/shop/products')
        .query({ sort: 'price_asc' });

      expect(res.status).toBe(200);
    });

    it('ควร paginate ได้', async () => {
      Product.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([mockProduct]),
      });
      Product.countDocuments.mockResolvedValue(25);

      const res = await request(app)
        .get('/api/shop/products')
        .query({ page: 2, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body.currentPage).toBe(2);
      expect(res.body.totalPages).toBe(3);
    });
  });

  // ================================================
  // GET /api/shop/products/:id
  // ================================================
  describe('GET /api/shop/products/:id', () => {
    it('ควรดึงสินค้าตาม ID ได้ - 200', async () => {
      const productId = new mongoose.Types.ObjectId();
      
      Product.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          ...mockProduct,
          _id: productId,
          save: jest.fn().mockResolvedValue(mockProduct),
        }),
      });

      const res = await request(app)
        .get(`/api/shop/products/${productId}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.product).toBeDefined();
    });

    it('ควร error ถ้า ID ไม่ถูกต้อง - 400', async () => {
      const res = await request(app)
        .get('/api/shop/products/invalid-id');

      expect(res.status).toBe(400);
    });

    it('ควร error ถ้าไม่พบสินค้า - 404', async () => {
      const productId = new mongoose.Types.ObjectId();
      
      Product.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      const res = await request(app)
        .get(`/api/shop/products/${productId}`);

      expect(res.status).toBe(404);
    });
  });

  // ================================================
  // GET /api/shop/products/featured
  // ================================================
  describe('GET /api/shop/products/featured', () => {
    it('ควรดึงสินค้าแนะนำได้ - 200', async () => {
      Product.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([mockProduct]),
      });

      const res = await request(app)
        .get('/api/shop/products/featured');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.products).toBeDefined();
    });
  });

  // ================================================
  // GET /api/shop/products/bestsellers
  // ================================================
  describe('GET /api/shop/products/bestsellers', () => {
    it('ควรดึงสินค้าขายดีได้ - 200', async () => {
      Product.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([mockProduct]),
      });

      const res = await request(app)
        .get('/api/shop/products/bestsellers');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ================================================
  // GET /api/shop/products/new-arrivals
  // ================================================
  describe('GET /api/shop/products/new-arrivals', () => {
    it('ควรดึงสินค้าใหม่ได้ - 200', async () => {
      Product.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([mockProduct]),
      });

      const res = await request(app)
        .get('/api/shop/products/new-arrivals');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  // ================================================
  // POST /api/shop/products/search
  // ================================================
  describe('POST /api/shop/products/search', () => {
    it('ควรค้นหาสินค้าได้ - 200', async () => {
      Product.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([mockProduct]),
      });
      Product.countDocuments.mockResolvedValue(1);

      const res = await request(app)
        .post('/api/shop/products/search')
        .send({ query: 'เซรั่ม' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('ควร error ถ้าไม่มี query - 400', async () => {
      const res = await request(app)
        .post('/api/shop/products/search')
        .send({});

      expect(res.status).toBe(400);
    });
  });

  // ================================================
  // GET /api/shop/products/:id/related
  // ================================================
  describe('GET /api/shop/products/:id/related', () => {
    it('ควรดึงสินค้าที่เกี่ยวข้องได้ - 200', async () => {
      const productId = new mongoose.Types.ObjectId();
      
      Product.findById.mockResolvedValue(mockProduct);
      Product.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([mockProduct]),
      });

      const res = await request(app)
        .get(`/api/shop/products/${productId}/related`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });
});


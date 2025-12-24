/**
 * Product Controller Unit Tests
 * ทดสอบ Product management functions
 */

const { mockRequest, mockResponse, mockNext } = require('../mocks/express.mock');
const { 
  mockProduct, 
  mockProducts, 
  mockProductInput, 
  validProductId, 
  validCategoryId 
} = require('../fixtures/products.fixture');

// Mock dependencies
jest.mock('../../src/models/Product');
jest.mock('../../src/models/Category');
jest.mock('../../src/utils/redis', () => require('../mocks/redis.mock'));

const Product = require('../../src/models/Product');
const Category = require('../../src/models/Category');
const productController = require('../../src/controllers/productController');

describe('Product Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    next = mockNext();
    jest.clearAllMocks();
  });

  // ================================================
  // Get Products Tests
  // ================================================
  describe('getProducts', () => {
    it('ควรดึงรายการสินค้าทั้งหมดได้', async () => {
      req.query = { page: 1, limit: 12 };

      Product.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockProducts),
      });
      Product.countDocuments.mockResolvedValue(mockProducts.length);

      await productController.getProducts(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          products: expect.any(Array),
        })
      );
    });

    it('ควร filter ตาม category ได้', async () => {
      req.query = { category: validCategoryId.toString() };

      Product.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue([mockProduct]),
      });
      Product.countDocuments.mockResolvedValue(1);

      await productController.getProducts(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('ควร filter ตาม price range ได้', async () => {
      req.query = { minPrice: 500, maxPrice: 1500 };

      Product.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockProducts),
      });
      Product.countDocuments.mockResolvedValue(mockProducts.length);

      await productController.getProducts(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ================================================
  // Get Product By ID Tests
  // ================================================
  describe('getProductById', () => {
    it('ควรดึงสินค้าตาม ID ได้', async () => {
      req.params = { id: validProductId.toString() };

      const mockProductDoc = {
        ...mockProduct,
        save: jest.fn().mockResolvedValue(mockProduct),
      };
      Product.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockProductDoc),
      });

      await productController.getProductById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          product: expect.any(Object),
        })
      );
    });

    it('ควร error ถ้า ID ไม่ถูกต้อง', async () => {
      req.params = { id: 'invalid-id' };

      await productController.getProductById(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('ควร error ถ้าไม่พบสินค้า', async () => {
      req.params = { id: validProductId.toString() };

      Product.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await productController.getProductById(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  // ================================================
  // Create Product Tests (Admin)
  // ================================================
  describe('createProduct', () => {
    it('ควรสร้างสินค้าใหม่สำเร็จ', async () => {
      req.body = mockProductInput;

      Product.findOne.mockResolvedValue(null); // ไม่มี SKU ซ้ำ
      Product.create.mockResolvedValue(mockProduct);

      await productController.createProduct(req, res, next);

      expect(Product.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('สำเร็จ'),
        })
      );
    });

    it('ควร error ถ้า SKU ซ้ำ', async () => {
      req.body = mockProductInput;

      Product.findOne.mockResolvedValue(mockProduct); // มี SKU อยู่แล้ว

      await productController.createProduct(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('ควร error ถ้าไม่มี required fields', async () => {
      req.body = { name: 'Test' }; // ขาด description, price, sku, category

      await productController.createProduct(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  // ================================================
  // Update Product Tests (Admin)
  // ================================================
  describe('updateProduct', () => {
    it('ควรอัพเดทสินค้าสำเร็จ', async () => {
      req.params = { id: validProductId.toString() };
      req.body = { name: 'ชื่อใหม่', price: 1500 };

      const mockProductDoc = {
        ...mockProduct,
        save: jest.fn().mockResolvedValue({ ...mockProduct, name: 'ชื่อใหม่' }),
      };
      Product.findById.mockResolvedValue(mockProductDoc);

      await productController.updateProduct(req, res, next);

      expect(mockProductDoc.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('ควร error ถ้าไม่พบสินค้า', async () => {
      req.params = { id: validProductId.toString() };
      req.body = { name: 'ชื่อใหม่' };

      Product.findById.mockResolvedValue(null);

      await productController.updateProduct(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  // ================================================
  // Delete Product Tests (Admin)
  // ================================================
  describe('deleteProduct', () => {
    it('ควรลบสินค้าสำเร็จ', async () => {
      req.params = { id: validProductId.toString() };

      Product.findById.mockResolvedValue(mockProduct);
      Product.findByIdAndDelete.mockResolvedValue(mockProduct);

      await productController.deleteProduct(req, res, next);

      expect(Product.findByIdAndDelete).toHaveBeenCalledWith(validProductId.toString());
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('ควร error ถ้าไม่พบสินค้า', async () => {
      req.params = { id: validProductId.toString() };

      Product.findById.mockResolvedValue(null);

      await productController.deleteProduct(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  // ================================================
  // Update Stock Tests (Admin)
  // ================================================
  describe('updateStock', () => {
    it('ควรตั้งค่า stock โดยตรงได้', async () => {
      req.params = { id: validProductId.toString() };
      req.body = { stock: 100, reason: 'เติมสินค้าใหม่' };

      const mockProductDoc = {
        ...mockProduct,
        stock: 50,
        save: jest.fn().mockResolvedValue({ ...mockProduct, stock: 100 }),
      };
      Product.findById.mockResolvedValue(mockProductDoc);

      await productController.updateStock(req, res, next);

      expect(mockProductDoc.stock).toBe(100);
      expect(mockProductDoc.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('ควรปรับ stock ด้วย adjustment ได้', async () => {
      req.params = { id: validProductId.toString() };
      req.body = { adjustment: 20 };

      const mockProductDoc = {
        ...mockProduct,
        stock: 50,
        save: jest.fn().mockResolvedValue({ ...mockProduct, stock: 70 }),
      };
      Product.findById.mockResolvedValue(mockProductDoc);

      await productController.updateStock(req, res, next);

      expect(mockProductDoc.stock).toBe(70);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('ควรลด stock ด้วย negative adjustment ได้', async () => {
      req.params = { id: validProductId.toString() };
      req.body = { adjustment: -10 };

      const mockProductDoc = {
        ...mockProduct,
        stock: 50,
        save: jest.fn().mockResolvedValue({ ...mockProduct, stock: 40 }),
      };
      Product.findById.mockResolvedValue(mockProductDoc);

      await productController.updateStock(req, res, next);

      expect(mockProductDoc.stock).toBe(40);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('ควร error ถ้า stock ติดลบ', async () => {
      req.params = { id: validProductId.toString() };
      req.body = { adjustment: -100 };

      const mockProductDoc = {
        ...mockProduct,
        stock: 50,
        save: jest.fn(),
      };
      Product.findById.mockResolvedValue(mockProductDoc);

      await productController.updateStock(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  // ================================================
  // Featured Products Tests
  // ================================================
  describe('getFeaturedProducts', () => {
    it('ควรดึงสินค้าแนะนำได้', async () => {
      req.query = { limit: 6 };

      Product.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        sort: jest.fn().mockResolvedValue(mockProducts.filter(p => p.isFeatured)),
      });

      await productController.getFeaturedProducts(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          products: expect.any(Array),
        })
      );
    });
  });

  // ================================================
  // Reviews Tests
  // ================================================
  describe('createProductReview', () => {
    it('ควรสร้างรีวิวสำเร็จ', async () => {
      req.params = { id: validProductId.toString() };
      req.body = { rating: 5, comment: 'สินค้าดีมาก' };
      req.user = { _id: 'user123', name: 'ทดสอบ' };

      const mockProductDoc = {
        ...mockProduct,
        reviews: [],
        save: jest.fn().mockResolvedValue(mockProduct),
      };
      Product.findById.mockResolvedValue(mockProductDoc);

      await productController.createProductReview(req, res, next);

      expect(mockProductDoc.reviews).toHaveLength(1);
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('ควร error ถ้ารีวิวซ้ำ', async () => {
      req.params = { id: validProductId.toString() };
      req.body = { rating: 5, comment: 'สินค้าดีมาก' };
      req.user = { _id: 'user123', name: 'ทดสอบ' };

      const mockProductDoc = {
        ...mockProduct,
        reviews: [{ user: 'user123', rating: 4, comment: 'เคยรีวิวแล้ว' }],
      };
      Product.findById.mockResolvedValue(mockProductDoc);

      await productController.createProductReview(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});


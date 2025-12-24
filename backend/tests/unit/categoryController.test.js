/**
 * Category Controller Unit Tests
 * ทดสอบ Category management functions
 */

const { mockRequest, mockResponse, mockNext } = require('../mocks/express.mock');
const { mockCategory, validCategoryId } = require('../fixtures/products.fixture');

// Mock dependencies
jest.mock('../../src/models/Category');
jest.mock('../../src/models/Product');
jest.mock('../../src/utils/redis', () => require('../mocks/redis.mock'));

const Category = require('../../src/models/Category');
const Product = require('../../src/models/Product');
const categoryController = require('../../src/controllers/categoryController');

describe('Category Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    next = mockNext();
    jest.clearAllMocks();
  });

  // ================================================
  // Get All Categories Tests
  // ================================================
  describe('getAllCategories', () => {
    it('ควรดึงรายการประเภทสินค้าทั้งหมดได้', async () => {
      const mockCategories = [mockCategory];
      
      Category.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockCategories),
      });

      await categoryController.getAllCategories(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          categories: mockCategories,
        })
      );
    });
  });

  // ================================================
  // Get All Admin Categories Tests
  // ================================================
  describe('getAllAdminCategories', () => {
    it('ควรดึงรายการประเภทพร้อมจำนวนสินค้าได้', async () => {
      req.query = {};
      
      const mockCategories = [mockCategory];
      Category.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue(mockCategories),
      });
      Product.countDocuments.mockResolvedValue(5);

      await categoryController.getAllAdminCategories(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          categories: expect.arrayContaining([
            expect.objectContaining({
              productCount: 5,
            }),
          ]),
        })
      );
    });

    it('ควร filter ตาม search ได้', async () => {
      req.query = { search: 'บำรุง' };
      
      Category.find.mockReturnValue({
        sort: jest.fn().mockResolvedValue([mockCategory]),
      });
      Product.countDocuments.mockResolvedValue(3);

      await categoryController.getAllAdminCategories(req, res, next);

      expect(Category.find).toHaveBeenCalledWith(
        expect.objectContaining({
          name: expect.any(Object),
        })
      );
    });
  });

  // ================================================
  // Get Category By ID Tests
  // ================================================
  describe('getCategoryById', () => {
    it('ควรดึงประเภทสินค้าตาม ID ได้', async () => {
      req.params = { id: validCategoryId.toString() };

      Category.findById.mockResolvedValue(mockCategory);
      Product.countDocuments.mockResolvedValue(10);

      await categoryController.getCategoryById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          category: expect.objectContaining({
            productCount: 10,
          }),
        })
      );
    });

    it('ควร error ถ้า ID ไม่ถูกต้อง', async () => {
      req.params = { id: 'invalid-id' };

      await categoryController.getCategoryById(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('ควร error ถ้าไม่พบประเภทสินค้า', async () => {
      req.params = { id: validCategoryId.toString() };

      Category.findById.mockResolvedValue(null);

      await categoryController.getCategoryById(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  // ================================================
  // Create Category Tests
  // ================================================
  describe('createCategory', () => {
    it('ควรสร้างประเภทสินค้าใหม่สำเร็จ', async () => {
      req.body = { name: 'ประเภทใหม่', description: 'รายละเอียด' };

      Category.findOne.mockResolvedValue(null);
      Category.create.mockResolvedValue({ ...mockCategory, name: 'ประเภทใหม่' });

      await categoryController.createCategory(req, res, next);

      expect(Category.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining('สำเร็จ'),
        })
      );
    });

    it('ควร error ถ้าชื่อซ้ำ', async () => {
      req.body = { name: 'ผลิตภัณฑ์บำรุงผิว' };

      Category.findOne.mockResolvedValue(mockCategory);

      await categoryController.createCategory(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('ควร error ถ้าไม่มีชื่อ', async () => {
      req.body = { description: 'รายละเอียดอย่างเดียว' };

      await categoryController.createCategory(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  // ================================================
  // Update Category Tests
  // ================================================
  describe('updateCategory', () => {
    it('ควรอัพเดทประเภทสินค้าสำเร็จ', async () => {
      req.params = { id: validCategoryId.toString() };
      req.body = { name: 'ชื่อใหม่', description: 'รายละเอียดใหม่' };

      const mockCategoryDoc = {
        ...mockCategory,
        save: jest.fn().mockResolvedValue({ ...mockCategory, name: 'ชื่อใหม่' }),
      };
      Category.findById.mockResolvedValue(mockCategoryDoc);
      Category.findOne.mockResolvedValue(null);

      await categoryController.updateCategory(req, res, next);

      expect(mockCategoryDoc.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('ควร error ถ้าชื่อใหม่ซ้ำกับประเภทอื่น', async () => {
      req.params = { id: validCategoryId.toString() };
      req.body = { name: 'ชื่อที่มีอยู่แล้ว' };

      const mockCategoryDoc = {
        ...mockCategory,
        save: jest.fn(),
      };
      Category.findById.mockResolvedValue(mockCategoryDoc);
      Category.findOne.mockResolvedValue({ ...mockCategory, _id: 'other-id' });

      await categoryController.updateCategory(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  // ================================================
  // Delete Category Tests
  // ================================================
  describe('deleteCategory', () => {
    it('ควรลบประเภทที่ไม่มีสินค้าได้', async () => {
      req.params = { id: validCategoryId.toString() };
      req.query = {};

      Category.findById.mockResolvedValue(mockCategory);
      Product.countDocuments.mockResolvedValue(0);
      Category.findByIdAndDelete.mockResolvedValue(mockCategory);

      await categoryController.deleteCategory(req, res, next);

      expect(Category.findByIdAndDelete).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('ควร error ถ้ามีสินค้าอยู่และไม่ได้ force delete', async () => {
      req.params = { id: validCategoryId.toString() };
      req.query = {};

      Category.findById.mockResolvedValue(mockCategory);
      Product.countDocuments.mockResolvedValue(5);

      await categoryController.deleteCategory(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('ควรลบได้ถ้า force delete', async () => {
      req.params = { id: validCategoryId.toString() };
      req.query = { forceDelete: 'true' };

      Category.findById.mockResolvedValue(mockCategory);
      Product.countDocuments.mockResolvedValue(5);
      Product.updateMany.mockResolvedValue({ modifiedCount: 5 });
      Category.findByIdAndDelete.mockResolvedValue(mockCategory);

      await categoryController.deleteCategory(req, res, next);

      expect(Product.updateMany).toHaveBeenCalled();
      expect(Category.findByIdAndDelete).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ================================================
  // Toggle Status Tests
  // ================================================
  describe('toggleCategoryStatus', () => {
    it('ควร toggle สถานะได้', async () => {
      req.params = { id: validCategoryId.toString() };

      const mockCategoryDoc = {
        ...mockCategory,
        isActive: true,
        save: jest.fn().mockResolvedValue({ ...mockCategory, isActive: false }),
      };
      Category.findById.mockResolvedValue(mockCategoryDoc);

      await categoryController.toggleCategoryStatus(req, res, next);

      expect(mockCategoryDoc.isActive).toBe(false);
      expect(mockCategoryDoc.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});


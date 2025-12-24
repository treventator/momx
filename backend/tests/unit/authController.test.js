/**
 * Auth Controller Unit Tests
 * ทดสอบ Authentication functions
 */

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { mockRequest, mockResponse, mockNext } = require('../mocks/express.mock');
const { mockUser, mockUserInput, mockLoginCredentials } = require('../fixtures/users.fixture');

// Mock dependencies
jest.mock('../../src/models/User');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

const User = require('../../src/models/User');
const authController = require('../../src/controllers/authController');

describe('Auth Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    next = mockNext();
    jest.clearAllMocks();
  });

  // ================================================
  // Register Tests
  // ================================================
  describe('register', () => {
    it('ควรสมัครสมาชิกสำเร็จด้วยข้อมูลที่ถูกต้อง', async () => {
      req.body = mockUserInput;

      User.findOne.mockResolvedValue(null); // ไม่มี email ซ้ำ
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashedPassword');
      User.create.mockResolvedValue({ ...mockUser, ...mockUserInput });
      jwt.sign.mockReturnValue('mock-token');

      await authController.register(req, res, next);

      expect(User.findOne).toHaveBeenCalledWith({ email: mockUserInput.email });
      expect(User.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          token: 'mock-token',
        })
      );
    });

    it('ควร error ถ้า email ซ้ำ', async () => {
      req.body = mockUserInput;

      User.findOne.mockResolvedValue(mockUser); // มี email อยู่แล้ว

      await authController.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
        })
      );
    });

    it('ควร error ถ้าไม่มี required fields', async () => {
      req.body = { email: 'test@test.com' }; // ขาด name, password

      await authController.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ================================================
  // Login Tests
  // ================================================
  describe('login', () => {
    it('ควร login สำเร็จด้วยข้อมูลที่ถูกต้อง', async () => {
      req.body = mockLoginCredentials;

      const mockUserWithPassword = {
        ...mockUser,
        select: jest.fn().mockReturnThis(),
      };
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          ...mockUser,
          password: 'hashedPassword',
        }),
      });
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('mock-token');

      await authController.login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          token: 'mock-token',
        })
      );
    });

    it('ควร error ถ้า email ไม่ถูกต้อง', async () => {
      req.body = mockLoginCredentials;

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await authController.login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'error',
        })
      );
    });

    it('ควร error ถ้า password ไม่ถูกต้อง', async () => {
      req.body = mockLoginCredentials;

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          ...mockUser,
          password: 'hashedPassword',
        }),
      });
      bcrypt.compare.mockResolvedValue(false);

      await authController.login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('ควร error ถ้าบัญชีถูกระงับ', async () => {
      req.body = mockLoginCredentials;

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          ...mockUser,
          password: 'hashedPassword',
          isActive: false,
        }),
      });
      bcrypt.compare.mockResolvedValue(true);

      await authController.login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  // ================================================
  // Get Current User Tests
  // ================================================
  describe('getCurrentUser', () => {
    it('ควรดึงข้อมูล user ปัจจุบันได้', async () => {
      req.user = mockUser;

      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      await authController.getCurrentUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data: expect.objectContaining({
            user: expect.any(Object),
          }),
        })
      );
    });

    it('ควร error ถ้าไม่พบ user', async () => {
      req.user = mockUser;

      User.findById.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await authController.getCurrentUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});


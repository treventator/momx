/**
 * Auth API Integration Tests
 * ทดสอบ Authentication API endpoints
 */

const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');

// Mock models before requiring routes
jest.mock('../../src/models/User');
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

const User = require('../../src/models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Create test app
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', require('../../src/routes/authRoutes'));
  
  // Error handler
  app.use((err, req, res, next) => {
    res.status(err.statusCode || 500).json({
      status: 'error',
      message: err.message,
    });
  });
  
  return app;
};

describe('Auth API', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ================================================
  // POST /api/auth/register
  // ================================================
  describe('POST /api/auth/register', () => {
    const validUserData = {
      name: 'ทดสอบ ผู้ใช้',
      email: 'test@example.com',
      password: 'password123',
      phone: '0812345678',
    };

    it('ควรสมัครสมาชิกสำเร็จ - 201', async () => {
      User.findOne.mockResolvedValue(null);
      bcrypt.genSalt.mockResolvedValue('salt');
      bcrypt.hash.mockResolvedValue('hashedPassword');
      User.create.mockResolvedValue({
        _id: new mongoose.Types.ObjectId(),
        ...validUserData,
        role: 'customer',
      });
      jwt.sign.mockReturnValue('mock-jwt-token');

      const res = await request(app)
        .post('/api/auth/register')
        .send(validUserData);

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('success');
      expect(res.body.token).toBeDefined();
    });

    it('ควร error ถ้า email ซ้ำ - 400', async () => {
      User.findOne.mockResolvedValue({ email: validUserData.email });

      const res = await request(app)
        .post('/api/auth/register')
        .send(validUserData);

      expect(res.status).toBe(400);
      expect(res.body.status).toBe('error');
    });

    it('ควร error ถ้าไม่มี required fields - 400', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@test.com' });

      expect(res.status).toBe(400);
    });
  });

  // ================================================
  // POST /api/auth/login
  // ================================================
  describe('POST /api/auth/login', () => {
    const credentials = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('ควร login สำเร็จ - 200', async () => {
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          _id: new mongoose.Types.ObjectId(),
          email: credentials.email,
          password: 'hashedPassword',
          isActive: true,
          role: 'customer',
        }),
      });
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('mock-jwt-token');

      const res = await request(app)
        .post('/api/auth/login')
        .send(credentials);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('success');
      expect(res.body.token).toBeDefined();
    });

    it('ควร error ถ้า email ไม่ถูกต้อง - 401', async () => {
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send(credentials);

      expect(res.status).toBe(401);
    });

    it('ควร error ถ้า password ไม่ถูกต้อง - 401', async () => {
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          _id: new mongoose.Types.ObjectId(),
          email: credentials.email,
          password: 'hashedPassword',
          isActive: true,
        }),
      });
      bcrypt.compare.mockResolvedValue(false);

      const res = await request(app)
        .post('/api/auth/login')
        .send(credentials);

      expect(res.status).toBe(401);
    });

    it('ควร error ถ้าบัญชีถูกระงับ - 403', async () => {
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          _id: new mongoose.Types.ObjectId(),
          email: credentials.email,
          password: 'hashedPassword',
          isActive: false,
        }),
      });
      bcrypt.compare.mockResolvedValue(true);

      const res = await request(app)
        .post('/api/auth/login')
        .send(credentials);

      expect(res.status).toBe(403);
    });
  });

  // ================================================
  // GET /api/auth/me
  // ================================================
  describe('GET /api/auth/me', () => {
    it('ควร error ถ้าไม่มี token - 401', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.status).toBe(401);
    });

    it('ควร error ถ้า token ไม่ถูกต้อง - 401', async () => {
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
    });
  });
});


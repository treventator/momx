/**
 * User Test Fixtures
 * ข้อมูลจำลองสำหรับทดสอบ User
 */

const mongoose = require('mongoose');

const validUserId = new mongoose.Types.ObjectId();
const validAdminId = new mongoose.Types.ObjectId();

const mockUser = {
  _id: validUserId,
  name: 'ทดสอบ ผู้ใช้',
  email: 'test@example.com',
  password: '$2a$10$hashedpassword123456789', // hashed: password123
  phone: '0812345678',
  role: 'customer',
  isActive: true,
  points: 100,
  pointsHistory: [],
  addresses: [
    {
      _id: new mongoose.Types.ObjectId(),
      name: 'บ้าน',
      address: '123 หมู่ 1',
      district: 'เมือง',
      province: 'กรุงเทพฯ',
      postalCode: '10100',
      phone: '0812345678',
      isDefault: true,
    },
  ],
  lineProfile: {
    lineUserId: 'U1234567890abcdef',
    displayName: 'Test User',
    pictureUrl: 'https://example.com/pic.jpg',
  },
  authProvider: 'email',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const mockAdmin = {
  _id: validAdminId,
  name: 'แอดมิน ทดสอบ',
  email: 'admin@example.com',
  password: '$2a$10$hashedpassword123456789',
  phone: '0899999999',
  role: 'admin',
  isActive: true,
  points: 0,
  pointsHistory: [],
  addresses: [],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const mockUserInput = {
  name: 'ผู้ใช้ใหม่',
  email: 'newuser@example.com',
  password: 'password123',
  phone: '0811111111',
};

const mockLoginCredentials = {
  email: 'test@example.com',
  password: 'password123',
};

const mockLineProfile = {
  lineUserId: 'U1234567890abcdef',
  displayName: 'Test LINE User',
  pictureUrl: 'https://profile.line-scdn.net/test',
  statusMessage: 'Hello!',
};

module.exports = {
  validUserId,
  validAdminId,
  mockUser,
  mockAdmin,
  mockUserInput,
  mockLoginCredentials,
  mockLineProfile,
};


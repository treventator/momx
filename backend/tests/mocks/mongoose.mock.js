/**
 * Mongoose Mock
 * Mock สำหรับ Mongoose operations
 */

const mongoose = require('mongoose');

// Mock ObjectId
const mockObjectId = () => new mongoose.Types.ObjectId();

// Mock Model methods
const createMockModel = (modelName) => {
  const mockModel = {
    find: jest.fn().mockReturnThis(),
    findOne: jest.fn().mockReturnThis(),
    findById: jest.fn().mockReturnThis(),
    findByIdAndUpdate: jest.fn().mockReturnThis(),
    findByIdAndDelete: jest.fn().mockReturnThis(),
    findOneAndUpdate: jest.fn().mockReturnThis(),
    findOneAndDelete: jest.fn().mockReturnThis(),
    create: jest.fn(),
    save: jest.fn(),
    deleteOne: jest.fn(),
    deleteMany: jest.fn(),
    updateOne: jest.fn(),
    updateMany: jest.fn(),
    countDocuments: jest.fn(),
    aggregate: jest.fn(),
    populate: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    sort: jest.fn().mockReturnThis(),
    skip: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    lean: jest.fn().mockReturnThis(),
    exec: jest.fn(),
  };

  return mockModel;
};

// Reset all mocks
const resetAllMocks = () => {
  jest.clearAllMocks();
};

module.exports = {
  mockObjectId,
  createMockModel,
  resetAllMocks,
};


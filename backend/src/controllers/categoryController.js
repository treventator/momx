const Category = require('../models/Category');
const Product = require('../models/Product');
const redis = require('../utils/redis');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const mongoose = require('mongoose');

// Cache settings
const CACHE_TTL = 60 * 5; // 5 minutes
const CACHE_ENABLED = process.env.CACHE_ENABLED === 'true';

// Helper function to clear category cache
const clearCategoryCache = async () => {
  if (CACHE_ENABLED) {
    await redis.del('categories:*');
    await redis.del('active-categories');
  }
};

/**
 * @desc    ดึงรายการประเภทสินค้าทั้งหมด (Public)
 * @route   GET /api/categories
 * @access  Public
 */
exports.getAllCategories = async (req, res, next) => {
  try {
    const cacheKey = 'categories:all';
    
    if (CACHE_ENABLED) {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        return res.status(200).json(JSON.parse(cachedData));
      }
    }
    
    const categories = await Category.find({ isActive: true })
      .sort({ name: 1 });
    
    const response = {
      success: true,
      count: categories.length,
      categories
    };
    
    if (CACHE_ENABLED) {
      await redis.set(cacheKey, JSON.stringify(response), 'EX', CACHE_TTL);
    }
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error in getAllCategories:', error);
    next(error);
  }
};

/**
 * @desc    ดึงรายการประเภทสินค้าทั้งหมด (Admin - รวม inactive)
 * @route   GET /api/admin/categories
 * @access  Private/Admin
 */
exports.getAllAdminCategories = async (req, res, next) => {
  try {
    const { search, isActive } = req.query;
    
    const queryObject = {};
    
    if (search) {
      queryObject.name = { $regex: search, $options: 'i' };
    }
    
    if (isActive !== undefined) {
      queryObject.isActive = isActive === 'true';
    }
    
    const categories = await Category.find(queryObject)
      .sort({ createdAt: -1 });
    
    // Add product count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const productCount = await Product.countDocuments({ category: category._id });
        return {
          ...category.toObject(),
          productCount
        };
      })
    );
    
    res.status(200).json({
      success: true,
      count: categoriesWithCount.length,
      categories: categoriesWithCount
    });
  } catch (error) {
    console.error('Error in getAllAdminCategories:', error);
    next(error);
  }
};

/**
 * @desc    ดึงประเภทสินค้าตาม ID
 * @route   GET /api/categories/:id
 * @access  Public
 */
exports.getCategoryById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('รหัสประเภทสินค้าไม่ถูกต้อง');
    }
    
    const category = await Category.findById(id);
    
    if (!category) {
      throw new NotFoundError('ไม่พบประเภทสินค้าที่ต้องการ');
    }
    
    // Get product count
    const productCount = await Product.countDocuments({ category: id });
    
    res.status(200).json({
      success: true,
      category: {
        ...category.toObject(),
        productCount
      }
    });
  } catch (error) {
    console.error('Error in getCategoryById:', error);
    next(error);
  }
};

/**
 * @desc    ดึงประเภทสินค้าตาม Slug
 * @route   GET /api/categories/slug/:slug
 * @access  Public
 */
exports.getCategoryBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    
    const category = await Category.findOne({ slug, isActive: true });
    
    if (!category) {
      throw new NotFoundError('ไม่พบประเภทสินค้าที่ต้องการ');
    }
    
    // Get product count
    const productCount = await Product.countDocuments({ category: category._id });
    
    res.status(200).json({
      success: true,
      category: {
        ...category.toObject(),
        productCount
      }
    });
  } catch (error) {
    console.error('Error in getCategoryBySlug:', error);
    next(error);
  }
};

/**
 * @desc    สร้างประเภทสินค้าใหม่
 * @route   POST /api/admin/categories
 * @access  Private/Admin
 */
exports.createCategory = async (req, res, next) => {
  try {
    const { name, slug, description, isActive, image } = req.body;
    
    if (!name) {
      throw new BadRequestError('กรุณาระบุชื่อประเภทสินค้า');
    }
    
    // Check if name already exists
    const existingName = await Category.findOne({ name: { $regex: new RegExp(`^${name}$`, 'i') } });
    if (existingName) {
      throw new BadRequestError('ชื่อประเภทสินค้านี้มีอยู่แล้ว');
    }
    
    // Check if slug already exists (if provided)
    if (slug) {
      const existingSlug = await Category.findOne({ slug });
      if (existingSlug) {
        throw new BadRequestError('Slug นี้มีอยู่แล้ว');
      }
    }
    
    const category = await Category.create({
      name,
      slug: slug || undefined, // Will be auto-generated if not provided
      description: description || '',
      isActive: isActive !== undefined ? isActive : true,
      image: image || ''
    });
    
    await clearCategoryCache();
    
    res.status(201).json({
      success: true,
      message: 'สร้างประเภทสินค้าใหม่สำเร็จ',
      category
    });
  } catch (error) {
    console.error('Error in createCategory:', error);
    next(error);
  }
};

/**
 * @desc    อัพเดทประเภทสินค้า
 * @route   PUT /api/admin/categories/:id
 * @access  Private/Admin
 */
exports.updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, slug, description, isActive, image } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('รหัสประเภทสินค้าไม่ถูกต้อง');
    }
    
    const category = await Category.findById(id);
    
    if (!category) {
      throw new NotFoundError('ไม่พบประเภทสินค้าที่ต้องการ');
    }
    
    // Check if name is being changed and already exists
    if (name && name !== category.name) {
      const existingName = await Category.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: id }
      });
      if (existingName) {
        throw new BadRequestError('ชื่อประเภทสินค้านี้มีอยู่แล้ว');
      }
      category.name = name;
    }
    
    // Check if slug is being changed and already exists
    if (slug && slug !== category.slug) {
      const existingSlug = await Category.findOne({ slug, _id: { $ne: id } });
      if (existingSlug) {
        throw new BadRequestError('Slug นี้มีอยู่แล้ว');
      }
      category.slug = slug;
    }
    
    if (description !== undefined) category.description = description;
    if (isActive !== undefined) category.isActive = isActive;
    if (image !== undefined) category.image = image;
    
    await category.save();
    await clearCategoryCache();
    
    res.status(200).json({
      success: true,
      message: 'อัพเดทประเภทสินค้าสำเร็จ',
      category
    });
  } catch (error) {
    console.error('Error in updateCategory:', error);
    next(error);
  }
};

/**
 * @desc    ลบประเภทสินค้า
 * @route   DELETE /api/admin/categories/:id
 * @access  Private/Admin
 */
exports.deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { forceDelete } = req.query;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('รหัสประเภทสินค้าไม่ถูกต้อง');
    }
    
    const category = await Category.findById(id);
    
    if (!category) {
      throw new NotFoundError('ไม่พบประเภทสินค้าที่ต้องการ');
    }
    
    // Check if category has products
    const productCount = await Product.countDocuments({ category: id });
    
    if (productCount > 0 && forceDelete !== 'true') {
      throw new BadRequestError(
        `ไม่สามารถลบประเภทสินค้านี้ได้ เนื่องจากมีสินค้าอยู่ ${productCount} รายการ ` +
        `หากต้องการลบ กรุณาย้ายสินค้าไปประเภทอื่นก่อน หรือใช้ ?forceDelete=true`
      );
    }
    
    // If force delete, unset category from all products
    if (forceDelete === 'true' && productCount > 0) {
      await Product.updateMany(
        { category: id },
        { $unset: { category: 1 } }
      );
    }
    
    await Category.findByIdAndDelete(id);
    await clearCategoryCache();
    
    res.status(200).json({
      success: true,
      message: 'ลบประเภทสินค้าสำเร็จ',
      productsAffected: productCount
    });
  } catch (error) {
    console.error('Error in deleteCategory:', error);
    next(error);
  }
};

/**
 * @desc    Toggle สถานะ Active ของประเภทสินค้า
 * @route   PATCH /api/admin/categories/:id/toggle
 * @access  Private/Admin
 */
exports.toggleCategoryStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('รหัสประเภทสินค้าไม่ถูกต้อง');
    }
    
    const category = await Category.findById(id);
    
    if (!category) {
      throw new NotFoundError('ไม่พบประเภทสินค้าที่ต้องการ');
    }
    
    category.isActive = !category.isActive;
    await category.save();
    await clearCategoryCache();
    
    res.status(200).json({
      success: true,
      message: `${category.isActive ? 'เปิดใช้งาน' : 'ปิดใช้งาน'}ประเภทสินค้าสำเร็จ`,
      category
    });
  } catch (error) {
    console.error('Error in toggleCategoryStatus:', error);
    next(error);
  }
};


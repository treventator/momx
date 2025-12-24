const Product = require('../models/Product');
const Category = require('../models/Category');
const redis = require('../utils/redis');
const { NotFoundError, BadRequestError } = require('../utils/errors');
const mongoose = require('mongoose');

// Cache settings
const CACHE_TTL = 60 * 5; // 5 minutes in seconds
const CACHE_ENABLED = process.env.CACHE_ENABLED === 'true';

/**
 * @desc    ดึงรายการสินค้าทั้งหมด
 * @route   GET /api/shop/products
 * @access  Public
 */
exports.getProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    
    // Query params
    const { category, search, minPrice, maxPrice, sort, tags } = req.query;
    
    // Cache key
    const cacheKey = `products:${JSON.stringify({page, limit, category, search, minPrice, maxPrice, sort, tags})}`;
    
    // Try to get from cache
    if (CACHE_ENABLED) {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        return res.status(200).json(JSON.parse(cachedData));
      }
    }
    
    // Build query
    const queryObject = { isActive: true };
    
    if (category) {
      // Check if it's a category ID or slug
      if (mongoose.Types.ObjectId.isValid(category)) {
        queryObject.category = category;
      } else {
        const categoryDoc = await Category.findOne({ slug: category });
        if (categoryDoc) {
          queryObject.category = categoryDoc._id;
        }
      }
    }
    
    if (search) {
      queryObject.$text = { $search: search };
    }
    
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      queryObject.tags = { $in: tagArray };
    }
    
    // Price filters
    if (minPrice !== undefined && maxPrice !== undefined) {
      queryObject.price = { $gte: Number(minPrice), $lte: Number(maxPrice) };
    } else if (minPrice !== undefined) {
      queryObject.price = { $gte: Number(minPrice) };
    } else if (maxPrice !== undefined) {
      queryObject.price = { $lte: Number(maxPrice) };
    }
    
    // Analytics: Store search query for later analysis
    if (search) {
      // Could store in DB or another analytics system
      console.log(`Search query: ${search}`);
    }
    
    // Execute query
    let query = Product.find(queryObject)
      .populate('category', 'name slug')
      .skip(skip)
      .limit(limit);
    
    // Add text score for relevance if using text search
    if (search) {
      query = query.select({ score: { $meta: 'textScore' } });
    }
    
    // Sorting
    if (sort) {
      const sortOrder = {};
      
      if (sort === 'price_asc') {
        sortOrder.price = 1;
      } else if (sort === 'price_desc') {
        sortOrder.price = -1;
      } else if (sort === 'newest') {
        sortOrder.createdAt = -1;
      } else if (sort === 'rating') {
        sortOrder.rating = -1;
      } else if (sort === 'popular') {
        sortOrder.salesCount = -1;
      } else if (sort === 'discount') {
        // Using aggregation for discount sorting is more complex and would be done differently
        query = query.sort({ salePrice: 1 });
      } else if (search && sort === 'relevance') {
        // Sort by text search relevance
        query = query.sort({ score: { $meta: 'textScore' } });
      } else {
        // Parse custom sort format (field,direction)
        const sortFields = sort.split(',');
        for (const field of sortFields) {
          if (field.startsWith('-')) {
            sortOrder[field.substring(1)] = -1;
          } else {
            sortOrder[field] = 1;
          }
        }
      }
      
      if (Object.keys(sortOrder).length > 0) {
        query = query.sort(sortOrder);
      }
    } else {
      // Default sort by newest
      query = query.sort({ createdAt: -1 });
    }
    
    // Execute query
    const products = await query;
    
    // Get total documents
    const total = await Product.countDocuments(queryObject);
    
    // Prepare response
    const response = {
      success: true,
      count: products.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      products
    };
    
    // Cache results
    if (CACHE_ENABLED) {
      await redis.set(cacheKey, JSON.stringify(response), 'EX', CACHE_TTL);
    }
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error in getProducts:', error);
    next(error);
  }
};

/**
 * @desc    ดึงรายการสินค้าตาม Slug
 * @route   GET /api/shop/products/slug/:slug
 * @access  Public
 */
exports.getProductBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    
    // Cache key
    const cacheKey = `product:slug:${slug}`;
    
    // Try to get from cache
    if (CACHE_ENABLED) {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        return res.status(200).json(JSON.parse(cachedData));
      }
    }
    
    const product = await Product.findOne({ slug, isActive: true })
      .populate('category', 'name slug');
    
    if (!product) {
      throw new NotFoundError('ไม่พบสินค้าที่ต้องการ');
    }
    
    // Increment view count
    product.viewCount += 1;
    await product.save();
    
    const response = {
      success: true,
      product
    };
    
    // Cache result
    if (CACHE_ENABLED) {
      await redis.set(cacheKey, JSON.stringify(response), 'EX', CACHE_TTL);
    }
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error in getProductBySlug:', error);
    next(error);
  }
};

/**
 * @desc    ดึงรายละเอียดสินค้าตาม ID
 * @route   GET /api/shop/products/:id
 * @access  Public
 */
exports.getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('รหัสสินค้าไม่ถูกต้อง');
    }
    
    // Cache key
    const cacheKey = `product:id:${id}`;
    
    // Try to get from cache
    if (CACHE_ENABLED) {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        return res.status(200).json(JSON.parse(cachedData));
      }
    }
    
    const product = await Product.findById(id)
      .populate('category', 'name slug');
    
    if (!product) {
      throw new NotFoundError('ไม่พบสินค้าที่ต้องการ');
    }
    
    // Increment view count
    product.viewCount += 1;
    await product.save();
    
    const response = {
      success: true,
      product
    };
    
    // Cache result
    if (CACHE_ENABLED) {
      await redis.set(cacheKey, JSON.stringify(response), 'EX', CACHE_TTL);
    }
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error in getProductById:', error);
    next(error);
  }
};

/**
 * @desc    ดึงรายการสินค้าแนะนำ
 * @route   GET /api/shop/products/featured
 * @access  Public
 */
exports.getFeaturedProducts = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    
    // Cache key
    const cacheKey = `products:featured:${limit}`;
    
    // Try to get from cache
    if (CACHE_ENABLED) {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        return res.status(200).json(JSON.parse(cachedData));
      }
    }
    
    const featuredProducts = await Product.find({ 
      isActive: true,
      isFeatured: true
    })
      .populate('category', 'name slug')
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const response = {
      success: true,
      count: featuredProducts.length,
      products: featuredProducts
    };
    
    // Cache results
    if (CACHE_ENABLED) {
      await redis.set(cacheKey, JSON.stringify(response), 'EX', CACHE_TTL);
    }
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error in getFeaturedProducts:', error);
    next(error);
  }
};

/**
 * @desc    ดึงรายการสินค้าที่เกี่ยวข้อง
 * @route   GET /api/shop/products/:id/related
 * @access  Public
 */
exports.getRelatedProducts = async (req, res, next) => {
  try {
    const { id } = req.params;
    const limit = parseInt(req.query.limit) || 4;
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('รหัสสินค้าไม่ถูกต้อง');
    }
    
    // Find product to get its category
    const product = await Product.findById(id);
    if (!product) {
      throw new NotFoundError('ไม่พบสินค้าที่ต้องการ');
    }
    
    // Cache key
    const cacheKey = `products:related:${id}:${limit}`;
    
    // Try to get from cache
    if (CACHE_ENABLED) {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        return res.status(200).json(JSON.parse(cachedData));
      }
    }
    
    // Find related products (same category, excluding current product)
    const relatedProducts = await Product.find({
      _id: { $ne: id },
      category: product.category,
      isActive: true
    })
      .populate('category', 'name slug')
      .limit(limit)
      .sort({ salesCount: -1 });
    
    const response = {
      success: true,
      count: relatedProducts.length,
      products: relatedProducts
    };
    
    // Cache results
    if (CACHE_ENABLED) {
      await redis.set(cacheKey, JSON.stringify(response), 'EX', CACHE_TTL);
    }
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error in getRelatedProducts:', error);
    next(error);
  }
};

/**
 * @desc    ดึงรายการหมวดหมู่ที่มีสินค้า
 * @route   GET /api/shop/products/categories
 * @access  Public
 */
exports.getActiveCategories = async (req, res, next) => {
  try {
    // Cache key
    const cacheKey = 'active-categories';
    
    // Try to get from cache
    if (CACHE_ENABLED) {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        return res.status(200).json(JSON.parse(cachedData));
      }
    }
    
    // Get categories that have active products using aggregation
    const categories = await Product.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category' } },
      { $lookup: {
          from: 'categories',
          localField: '_id',
          foreignField: '_id',
          as: 'category'
        }
      },
      { $unwind: '$category' },
      { $replaceRoot: { newRoot: '$category' } },
      { $project: { _id: 1, name: 1, slug: 1, image: 1 } }
    ]);
    
    const response = {
      success: true,
      count: categories.length,
      categories
    };
    
    // Cache results
    if (CACHE_ENABLED) {
      await redis.set(cacheKey, JSON.stringify(response), 'EX', CACHE_TTL);
    }
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error in getActiveCategories:', error);
    next(error);
  }
};

/**
 * @desc    ดึงสินค้าขายดี
 * @route   GET /api/shop/products/bestsellers
 * @access  Public
 */
exports.getBestSellers = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    
    // Cache key
    const cacheKey = `products:bestsellers:${limit}`;
    
    // Try to get from cache
    if (CACHE_ENABLED) {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        return res.status(200).json(JSON.parse(cachedData));
      }
    }
    
    const bestSellers = await Product.find({
      isActive: true,
      salesCount: { $gt: 0 }
    })
      .populate('category', 'name slug')
      .limit(limit)
      .sort({ salesCount: -1 });
    
    const response = {
      success: true,
      count: bestSellers.length,
      products: bestSellers
    };
    
    // Cache results
    if (CACHE_ENABLED) {
      await redis.set(cacheKey, JSON.stringify(response), 'EX', CACHE_TTL);
    }
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error in getBestSellers:', error);
    next(error);
  }
};

/**
 * @desc    ดึงสินค้าใหม่
 * @route   GET /api/shop/products/new-arrivals
 * @access  Public
 */
exports.getNewArrivals = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit) || 8;
    
    // Cache key
    const cacheKey = `products:new-arrivals:${limit}`;
    
    // Try to get from cache
    if (CACHE_ENABLED) {
      const cachedData = await redis.get(cacheKey);
      if (cachedData) {
        return res.status(200).json(JSON.parse(cachedData));
      }
    }
    
    const newArrivals = await Product.find({
      isActive: true
    })
      .populate('category', 'name slug')
      .limit(limit)
      .sort({ createdAt: -1 });
    
    const response = {
      success: true,
      count: newArrivals.length,
      products: newArrivals
    };
    
    // Cache results
    if (CACHE_ENABLED) {
      await redis.set(cacheKey, JSON.stringify(response), 'EX', CACHE_TTL);
    }
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error in getNewArrivals:', error);
    next(error);
  }
};

/**
 * @desc    ค้นหาสินค้า
 * @route   POST /api/shop/products/search
 * @access  Public
 */
exports.searchProducts = async (req, res, next) => {
  try {
    const { query, filters = {}, page = 1, limit = 12, sort = 'relevance' } = req.body;
    
    if (!query) {
      throw new BadRequestError('โปรดระบุคำค้นหา');
    }
    
    const skip = (page - 1) * limit;
    
    // Build query
    const queryObject = { 
      isActive: true,
      $text: { $search: query }
    };
    
    // Apply filters
    if (filters.categories && filters.categories.length > 0) {
      queryObject.category = { $in: filters.categories };
    }
    
    if (filters.priceRange) {
      queryObject.price = { 
        $gte: filters.priceRange.min || 0, 
        $lte: filters.priceRange.max || Number.MAX_SAFE_INTEGER 
      };
    }
    
    if (filters.tags && filters.tags.length > 0) {
      queryObject.tags = { $in: filters.tags };
    }
    
    // Execute query
    let productQuery = Product.find(queryObject)
      .populate('category', 'name slug')
      .select({ score: { $meta: 'textScore' } })
      .skip(skip)
      .limit(limit);
    
    // Sorting
    if (sort === 'relevance') {
      productQuery = productQuery.sort({ score: { $meta: 'textScore' } });
    } else if (sort === 'price_asc') {
      productQuery = productQuery.sort({ price: 1 });
    } else if (sort === 'price_desc') {
      productQuery = productQuery.sort({ price: -1 });
    } else if (sort === 'newest') {
      productQuery = productQuery.sort({ createdAt: -1 });
    } else if (sort === 'popular') {
      productQuery = productQuery.sort({ salesCount: -1 });
    }
    
    // Execute query
    const products = await productQuery;
    
    // Get total documents
    const total = await Product.countDocuments(queryObject);
    
    // Analytics: Store search query
    console.log(`Search performed: ${query}, Found: ${total} results`);
    
    res.status(200).json({
      success: true,
      count: products.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      products
    });
  } catch (error) {
    console.error('Error in searchProducts:', error);
    next(error);
  }
};

/**
 * @desc    ดึงรายการรีวิวสินค้า
 * @route   GET /api/shop/products/:id/reviews
 * @access  Public
 */
exports.getProductReviews = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('รหัสสินค้าไม่ถูกต้อง');
    }
    
    const product = await Product.findById(id);
    
    if (!product) {
      throw new NotFoundError('ไม่พบสินค้าที่ต้องการ');
    }
    
    // Sort reviews by newest first
    const reviews = product.reviews.sort((a, b) => b.createdAt - a.createdAt);
    
    res.status(200).json({
      success: true,
      count: reviews.length,
      rating: product.rating,
      reviews
    });
  } catch (error) {
    console.error('Error in getProductReviews:', error);
    next(error);
  }
};

/**
 * @desc    สร้างรีวิวสินค้า
 * @route   POST /api/shop/products/:id/reviews
 * @access  Private
 */
exports.createProductReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('รหัสสินค้าไม่ถูกต้อง');
    }
    
    if (!rating || !comment) {
      throw new BadRequestError('โปรดระบุคะแนนและความคิดเห็น');
    }
    
    const product = await Product.findById(id);
    
    if (!product) {
      throw new NotFoundError('ไม่พบสินค้าที่ต้องการ');
    }
    
    // Check if user already reviewed
    const alreadyReviewed = product.reviews.find(
      review => review.user.toString() === req.user._id.toString()
    );
    
    if (alreadyReviewed) {
      throw new BadRequestError('คุณได้รีวิวสินค้านี้ไปแล้ว');
    }
    
    // Create review
    const review = {
      user: req.user._id,
      name: req.user.name,
      rating: Number(rating),
      comment,
      createdAt: Date.now()
    };
    
    // Add review
    product.reviews.push(review);
    
    // Update product rating
    product.numReviews = product.reviews.length;
    product.rating = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;
    
    // Save product
    await product.save();
    
    // If cache is enabled, clear the product cache
    if (CACHE_ENABLED) {
      await redis.del(`product:id:${id}`);
      await redis.del(`product:slug:${product.slug}`);
    }
    
    res.status(201).json({
      success: true,
      message: 'เพิ่มรีวิวสำเร็จ',
      review
    });
  } catch (error) {
    console.error('Error in createProductReview:', error);
    next(error);
  }
};

/**
 * @desc    ลบรีวิวสินค้า
 * @route   DELETE /api/shop/products/:id/reviews
 * @access  Private
 */
exports.deleteProductReview = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reviewId } = req.body;
    
    // Validate ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('รหัสสินค้าไม่ถูกต้อง');
    }
    
    const product = await Product.findById(id);
    
    if (!product) {
      throw new NotFoundError('ไม่พบสินค้าที่ต้องการ');
    }
    
    // Find review
    const review = product.reviews.id(reviewId);
    
    if (!review) {
      throw new NotFoundError('ไม่พบรีวิวที่ต้องการ');
    }
    
    // Check if user is owner of review or admin
    if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      throw new BadRequestError('คุณไม่มีสิทธิ์ลบรีวิวนี้');
    }
    
    // Remove review
    product.reviews.pull(reviewId);
    
    // Update product rating
    if (product.reviews.length > 0) {
      product.rating = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;
    } else {
      product.rating = 0;
    }
    
    product.numReviews = product.reviews.length;
    
    // Save product
    await product.save();
    
    // If cache is enabled, clear the product cache
    if (CACHE_ENABLED) {
      await redis.del(`product:id:${id}`);
      await redis.del(`product:slug:${product.slug}`);
    }
    
    res.status(200).json({
      success: true,
      message: 'ลบรีวิวสำเร็จ'
    });
  } catch (error) {
    console.error('Error in deleteProductReview:', error);
    next(error);
  }
};

// =====================================================
// ADMIN PRODUCT MANAGEMENT
// =====================================================

/**
 * @desc    ดึงรายการสินค้าทั้งหมด (Admin)
 * @route   GET /api/admin/products
 * @access  Private/Admin
 */
exports.getAllAdminProducts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Query params
    const { category, search, isActive, isFeatured, lowStock } = req.query;
    
    // Build query
    const queryObject = {};
    
    if (category) {
      if (mongoose.Types.ObjectId.isValid(category)) {
        queryObject.category = category;
      }
    }
    
    if (search) {
      queryObject.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (isActive !== undefined) {
      queryObject.isActive = isActive === 'true';
    }
    
    if (isFeatured !== undefined) {
      queryObject.isFeatured = isFeatured === 'true';
    }
    
    if (lowStock === 'true') {
      queryObject.stock = { $lte: 5 };
    }
    
    // Execute query
    const products = await Product.find(queryObject)
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Product.countDocuments(queryObject);
    
    res.status(200).json({
      success: true,
      count: products.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      products
    });
  } catch (error) {
    console.error('Error in getAllAdminProducts:', error);
    next(error);
  }
};

/**
 * @desc    สร้างสินค้าใหม่
 * @route   POST /api/admin/products
 * @access  Private/Admin
 */
exports.createProduct = async (req, res, next) => {
  try {
    const {
      name,
      description,
      shortDescription,
      price,
      salePrice,
      memberPrice,
      category,
      stock,
      sku,
      images,
      tags,
      isActive,
      isFeatured,
      isSubscribable,
      subscriptionPlans,
      ingredients,
      weight,
      dimensions
    } = req.body;
    
    // Validate required fields
    if (!name || !description || !price || !category || !sku) {
      throw new BadRequestError('กรุณากรอกข้อมูลที่จำเป็น: ชื่อ, รายละเอียด, ราคา, หมวดหมู่, รหัสสินค้า');
    }
    
    // Check if SKU already exists
    const existingSku = await Product.findOne({ sku });
    if (existingSku) {
      throw new BadRequestError('รหัสสินค้า (SKU) นี้มีอยู่แล้ว');
    }
    
    // Create product
    const product = await Product.create({
      name,
      description,
      shortDescription: shortDescription || '',
      price,
      salePrice: salePrice || 0,
      memberPrice: memberPrice || 0,
      category,
      stock: stock || 0,
      sku,
      images: images || [],
      tags: tags || [],
      isActive: isActive !== undefined ? isActive : true,
      isFeatured: isFeatured || false,
      isSubscribable: isSubscribable || false,
      subscriptionPlans: subscriptionPlans || [],
      ingredients: ingredients || '',
      weight: weight || 0,
      dimensions: dimensions || {}
    });
    
    // Clear cache
    if (CACHE_ENABLED) {
      await redis.del('products:*');
    }
    
    res.status(201).json({
      success: true,
      message: 'สร้างสินค้าใหม่สำเร็จ',
      product
    });
  } catch (error) {
    console.error('Error in createProduct:', error);
    next(error);
  }
};

/**
 * @desc    อัพเดทสินค้า
 * @route   PUT /api/admin/products/:id
 * @access  Private/Admin
 */
exports.updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('รหัสสินค้าไม่ถูกต้อง');
    }
    
    const product = await Product.findById(id);
    
    if (!product) {
      throw new NotFoundError('ไม่พบสินค้าที่ต้องการ');
    }
    
    // Fields that can be updated
    const allowedUpdates = [
      'name', 'description', 'shortDescription', 'price', 'salePrice', 
      'memberPrice', 'category', 'stock', 'sku', 'images', 'tags',
      'isActive', 'isFeatured', 'isSubscribable', 'subscriptionPlans',
      'ingredients', 'weight', 'dimensions'
    ];
    
    // Update only provided fields
    for (const field of allowedUpdates) {
      if (req.body[field] !== undefined) {
        product[field] = req.body[field];
      }
    }
    
    // Check if SKU is being changed and already exists
    if (req.body.sku && req.body.sku !== product.sku) {
      const existingSku = await Product.findOne({ sku: req.body.sku, _id: { $ne: id } });
      if (existingSku) {
        throw new BadRequestError('รหัสสินค้า (SKU) นี้มีอยู่แล้ว');
      }
    }
    
    await product.save();
    
    // Clear cache
    if (CACHE_ENABLED) {
      await redis.del(`product:id:${id}`);
      await redis.del(`product:slug:${product.slug}`);
      await redis.del('products:*');
    }
    
    res.status(200).json({
      success: true,
      message: 'อัพเดทสินค้าสำเร็จ',
      product
    });
  } catch (error) {
    console.error('Error in updateProduct:', error);
    next(error);
  }
};

/**
 * @desc    ลบสินค้า
 * @route   DELETE /api/admin/products/:id
 * @access  Private/Admin
 */
exports.deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('รหัสสินค้าไม่ถูกต้อง');
    }
    
    const product = await Product.findById(id);
    
    if (!product) {
      throw new NotFoundError('ไม่พบสินค้าที่ต้องการ');
    }
    
    await Product.findByIdAndDelete(id);
    
    // Clear cache
    if (CACHE_ENABLED) {
      await redis.del(`product:id:${id}`);
      await redis.del(`product:slug:${product.slug}`);
      await redis.del('products:*');
    }
    
    res.status(200).json({
      success: true,
      message: 'ลบสินค้าสำเร็จ'
    });
  } catch (error) {
    console.error('Error in deleteProduct:', error);
    next(error);
  }
};

/**
 * @desc    ปรับจำนวนสินค้าคงเหลือ (Stock)
 * @route   PUT /api/admin/products/:id/stock
 * @access  Private/Admin
 */
exports.updateStock = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { stock, adjustment, reason } = req.body;
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new BadRequestError('รหัสสินค้าไม่ถูกต้อง');
    }
    
    const product = await Product.findById(id);
    
    if (!product) {
      throw new NotFoundError('ไม่พบสินค้าที่ต้องการ');
    }
    
    let newStock;
    let changeType;
    
    if (stock !== undefined) {
      // ตั้งค่า stock โดยตรง
      newStock = parseInt(stock);
      changeType = 'set';
    } else if (adjustment !== undefined) {
      // ปรับ stock (+ หรือ -)
      newStock = product.stock + parseInt(adjustment);
      changeType = adjustment > 0 ? 'increase' : 'decrease';
    } else {
      throw new BadRequestError('กรุณาระบุ stock หรือ adjustment');
    }
    
    if (newStock < 0) {
      throw new BadRequestError('จำนวนสินค้าไม่สามารถติดลบได้');
    }
    
    const oldStock = product.stock;
    product.stock = newStock;
    await product.save();
    
    // Log stock change (could be saved to a separate collection for history)
    console.log(`Stock updated for ${product.name}: ${oldStock} -> ${newStock} (${changeType}, reason: ${reason || 'not specified'})`);
    
    // Clear cache
    if (CACHE_ENABLED) {
      await redis.del(`product:id:${id}`);
      await redis.del(`product:slug:${product.slug}`);
    }
    
    res.status(200).json({
      success: true,
      message: 'อัพเดทจำนวนสินค้าสำเร็จ',
      data: {
        productId: id,
        productName: product.name,
        oldStock,
        newStock,
        changeType,
        reason: reason || null
      }
    });
  } catch (error) {
    console.error('Error in updateStock:', error);
    next(error);
  }
};

/**
 * @desc    อัพเดท Stock หลายสินค้าพร้อมกัน
 * @route   PUT /api/admin/products/bulk-stock
 * @access  Private/Admin
 */
exports.bulkUpdateStock = async (req, res, next) => {
  try {
    const { updates } = req.body;
    
    if (!updates || !Array.isArray(updates) || updates.length === 0) {
      throw new BadRequestError('กรุณาระบุข้อมูลการอัพเดท');
    }
    
    const results = [];
    
    for (const update of updates) {
      const { productId, stock, adjustment } = update;
      
      if (!mongoose.Types.ObjectId.isValid(productId)) {
        results.push({ productId, success: false, error: 'รหัสสินค้าไม่ถูกต้อง' });
        continue;
      }
      
      const product = await Product.findById(productId);
      
      if (!product) {
        results.push({ productId, success: false, error: 'ไม่พบสินค้า' });
        continue;
      }
      
      let newStock;
      if (stock !== undefined) {
        newStock = parseInt(stock);
      } else if (adjustment !== undefined) {
        newStock = product.stock + parseInt(adjustment);
      } else {
        results.push({ productId, success: false, error: 'ไม่ได้ระบุ stock หรือ adjustment' });
        continue;
      }
      
      if (newStock < 0) {
        results.push({ productId, success: false, error: 'จำนวนไม่สามารถติดลบได้' });
        continue;
      }
      
      const oldStock = product.stock;
      product.stock = newStock;
      await product.save();
      
      results.push({
        productId,
        productName: product.name,
        success: true,
        oldStock,
        newStock
      });
    }
    
    // Clear cache
    if (CACHE_ENABLED) {
      await redis.del('products:*');
    }
    
    res.status(200).json({
      success: true,
      message: 'อัพเดทจำนวนสินค้าหลายรายการสำเร็จ',
      results
    });
  } catch (error) {
    console.error('Error in bulkUpdateStock:', error);
    next(error);
  }
}; 
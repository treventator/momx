const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const categoryController = require('../controllers/categoryController');
const userController = require('../controllers/userController');
const orderController = require('../controllers/orderController');
const { auth, adminAuth } = require('../middlewares/authMiddleware');
const authController = require('../controllers/authController');

// Authentication
router.post('/login', authController.login);

// Product Management
router.route('/products')
  .get(auth, adminAuth, productController.getAllAdminProducts)
  .post(auth, adminAuth, productController.createProduct);

router.route('/products/:id')
  .get(auth, adminAuth, productController.getProductById)
  .put(auth, adminAuth, productController.updateProduct)
  .delete(auth, adminAuth, productController.deleteProduct);

// Stock Management
router.put('/products/:id/stock', auth, adminAuth, productController.updateStock);
router.put('/products/bulk-stock', auth, adminAuth, productController.bulkUpdateStock);

// Category Management
router.route('/categories')
  .get(auth, adminAuth, categoryController.getAllAdminCategories)
  .post(auth, adminAuth, categoryController.createCategory);

router.route('/categories/:id')
  .get(auth, adminAuth, categoryController.getCategoryById)
  .put(auth, adminAuth, categoryController.updateCategory)
  .delete(auth, adminAuth, categoryController.deleteCategory);

router.patch('/categories/:id/toggle', auth, adminAuth, categoryController.toggleCategoryStatus);

// Order Management
router.route('/orders')
  .get(auth, adminAuth, orderController.getAllOrders);

router.route('/orders/:id')
  .get(auth, adminAuth, orderController.getOrderById)
  .put(auth, adminAuth, orderController.updateOrderStatus);

// User Management
router.route('/users')
  .get(auth, adminAuth, userController.getAllUsers);

router.route('/users/:id')
  .get(auth, adminAuth, userController.getUserById)
  .put(auth, adminAuth, userController.updateUser)
  .delete(auth, adminAuth, userController.deleteUser);

// Dashboard Statistics
router.get('/statistics', auth, adminAuth, async (req, res) => {
  try {
    const Order = require('../models/Order');
    const User = require('../models/User');
    const Product = require('../models/Product');
    const Contact = require('../models/Contact');
    
    // วันนี้
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // เดือนนี้
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    
    // ยอดขายวันนี้
    const todaySalesResult = await Order.aggregate([
      { 
        $match: { 
          createdAt: { $gte: today, $lt: tomorrow },
          isPaid: true 
        } 
      },
      { $group: { _id: null, total: { $sum: '$totalPrice' }, count: { $sum: 1 } } }
    ]);
    
    // ยอดขายเดือนนี้
    const monthSalesResult = await Order.aggregate([
      { 
        $match: { 
          createdAt: { $gte: thisMonth, $lt: nextMonth },
          isPaid: true 
        } 
      },
      { $group: { _id: null, total: { $sum: '$totalPrice' }, count: { $sum: 1 } } }
    ]);
    
    // ออเดอร์รอดำเนินการ
    const pendingOrders = await Order.countDocuments({ 
      status: { $in: ['Pending Payment', 'Processing'] } 
    });
    
    // ออเดอร์ใหม่วันนี้
    const newOrdersToday = await Order.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow }
    });
    
    // ข้อความติดต่อที่ยังไม่อ่าน
    const unreadContacts = await Contact.countDocuments({ isRead: false });
    
    // ผู้ใช้ทั้งหมด
    const totalUsers = await User.countDocuments();
    
    // ผู้ใช้ใหม่วันนี้
    const newUsersToday = await User.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow }
    });
    
    // สมาชิก LINE
    const lineUsers = await User.countDocuments({ 
      'lineProfile.lineUserId': { $exists: true, $ne: null } 
    });
    
    // สินค้าทั้งหมด
    const totalProducts = await Product.countDocuments({ isActive: true });
    
    // สินค้าใกล้หมด (stock < 5)
    const lowStockProducts = await Product.find({ 
      stock: { $lt: 5, $gt: 0 }, 
      isActive: true 
    }).select('name stock sku').limit(10);
    
    // สินค้าหมด
    const outOfStockCount = await Product.countDocuments({ stock: 0, isActive: true });
    
    // สินค้าขายดี 5 อันดับ
    const topSellingProducts = await Product.find({ isActive: true })
      .sort({ salesCount: -1 })
      .limit(5)
      .select('name salesCount price images');
    
    // ออเดอร์ล่าสุด 5 รายการ
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'firstName lastName lineProfile.displayName')
      .select('totalPrice status createdAt orderItems');
    
    res.json({
      success: true,
      data: {
        // ยอดขาย
        sales: {
          today: todaySalesResult[0]?.total || 0,
          todayCount: todaySalesResult[0]?.count || 0,
          thisMonth: monthSalesResult[0]?.total || 0,
          thisMonthCount: monthSalesResult[0]?.count || 0
        },
        // ออเดอร์
        orders: {
          pending: pendingOrders,
          newToday: newOrdersToday,
          recent: recentOrders
        },
        // ผู้ใช้
        users: {
          total: totalUsers,
          newToday: newUsersToday,
          lineUsers: lineUsers
        },
        // สินค้า
        products: {
          total: totalProducts,
          lowStock: lowStockProducts,
          outOfStock: outOfStockCount,
          topSelling: topSellingProducts
        },
        // ติดต่อ
        contacts: {
          unread: unreadContacts
        }
      }
    });
  } catch (error) {
    console.error('Error in statistics:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสถิติ',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
});

// Sales Report
router.get('/reports/sales', auth, adminAuth, async (req, res) => {
  try {
    const Order = require('../models/Order');
    
    const { startDate, endDate, groupBy = 'day' } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);
    
    let groupFormat;
    if (groupBy === 'day') {
      groupFormat = { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
    } else if (groupBy === 'month') {
      groupFormat = { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
    } else {
      groupFormat = { $dateToString: { format: '%Y', date: '$createdAt' } };
    }
    
    const salesReport = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          isPaid: true
        }
      },
      {
        $group: {
          _id: groupFormat,
          totalSales: { $sum: '$totalPrice' },
          orderCount: { $sum: 1 },
          avgOrderValue: { $avg: '$totalPrice' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    const summary = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: start, $lte: end },
          isPaid: true
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$totalPrice' },
          totalOrders: { $sum: 1 },
          avgOrderValue: { $avg: '$totalPrice' }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        period: { start, end, groupBy },
        summary: summary[0] || { totalRevenue: 0, totalOrders: 0, avgOrderValue: 0 },
        report: salesReport
      }
    });
  } catch (error) {
    console.error('Error in sales report:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสร้างรายงานยอดขาย'
    });
  }
});

// Top Products Report
router.get('/reports/products', auth, adminAuth, async (req, res) => {
  try {
    const Product = require('../models/Product');
    
    const { limit = 20, sortBy = 'salesCount' } = req.query;
    
    const sortOptions = {
      salesCount: { salesCount: -1 },
      viewCount: { viewCount: -1 },
      revenue: { revenue: -1 },
      rating: { rating: -1 }
    };
    
    const products = await Product.find({ isActive: true })
      .sort(sortOptions[sortBy] || sortOptions.salesCount)
      .limit(parseInt(limit))
      .select('name price salePrice salesCount viewCount rating stock images category')
      .populate('category', 'name');
    
    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    console.error('Error in products report:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสร้างรายงานสินค้า'
    });
  }
});

// Customers Report
router.get('/reports/customers', auth, adminAuth, async (req, res) => {
  try {
    const User = require('../models/User');
    const Order = require('../models/Order');
    
    const { limit = 20 } = req.query;
    
    // Top customers by total spent
    const topCustomers = await Order.aggregate([
      { $match: { isPaid: true } },
      {
        $group: {
          _id: '$user',
          totalSpent: { $sum: '$totalPrice' },
          orderCount: { $sum: 1 },
          avgOrderValue: { $avg: '$totalPrice' },
          lastOrder: { $max: '$createdAt' }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: parseInt(limit) },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 1,
          totalSpent: 1,
          orderCount: 1,
          avgOrderValue: 1,
          lastOrder: 1,
          'user.firstName': 1,
          'user.lastName': 1,
          'user.email': 1,
          'user.phoneNumber': 1,
          'user.lineProfile.displayName': 1,
          'user.points': 1,
          'user.membership': 1
        }
      }
    ]);
    
    res.json({
      success: true,
      data: topCustomers
    });
  } catch (error) {
    console.error('Error in customers report:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการสร้างรายงานลูกค้า'
    });
  }
});

// Send LINE message to customer (Admin)
router.post('/send-line-message', auth, adminAuth, async (req, res) => {
  try {
    const { userId, message, messageType = 'text' } = req.body;
    const User = require('../models/User');
    const lineBotService = require('../services/lineBotService');
    
    if (!userId || !message) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุ userId และ message'
      });
    }
    
    // หา LINE User ID
    const user = await User.findById(userId);
    if (!user || !user.lineProfile?.lineUserId) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบผู้ใช้หรือผู้ใช้ไม่ได้เชื่อมต่อ LINE'
      });
    }
    
    let lineMessage;
    if (messageType === 'text') {
      lineMessage = lineBotService.createTextMessage(message);
    } else {
      lineMessage = message; // Custom flex message
    }
    
    const result = await lineBotService.pushMessage(user.lineProfile.lineUserId, lineMessage);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'ส่งข้อความ LINE สำเร็จ'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'ส่งข้อความ LINE ไม่สำเร็จ',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error sending LINE message:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการส่งข้อความ LINE'
    });
  }
});

// Broadcast LINE message to all users
router.post('/broadcast-line', auth, adminAuth, async (req, res) => {
  try {
    const { message, messageType = 'text' } = req.body;
    const lineBotService = require('../services/lineBotService');
    
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุ message'
      });
    }
    
    let lineMessage;
    if (messageType === 'text') {
      lineMessage = lineBotService.createTextMessage(message);
    } else {
      lineMessage = message;
    }
    
    const result = await lineBotService.broadcastMessage(lineMessage);
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Broadcast สำเร็จ'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Broadcast ไม่สำเร็จ',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Error broadcasting LINE message:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการ Broadcast'
    });
  }
});

// Low stock alert
router.get('/inventory/low-stock', auth, adminAuth, async (req, res) => {
  try {
    const Product = require('../models/Product');
    const { threshold = 5 } = req.query;
    
    const lowStockProducts = await Product.find({
      stock: { $lte: parseInt(threshold) },
      isActive: true
    })
    .sort({ stock: 1 })
    .select('name sku stock price images category')
    .populate('category', 'name');
    
    res.json({
      success: true,
      count: lowStockProducts.length,
      threshold: parseInt(threshold),
      products: lowStockProducts
    });
  } catch (error) {
    console.error('Error in low stock alert:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสินค้าใกล้หมด'
    });
  }
});

module.exports = router; 
const User = require('../models/User');
const Cart = require('../models/Cart');
const jwt = require('jsonwebtoken');
const { info, error, withSpan } = require('../utils/logger');

/**
 * Generate JWT token for authentication
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phoneNumber } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น',
      });
    }

    // Create new user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
    });

    if (user) {
      // Check if there's a guest cart to migrate
      const guestId = req.cookies.guestId;
      if (guestId) {
        await migrateGuestCart(guestId, user._id);
        // Clear the guest ID cookie
        res.clearCookie('guestId');
      }

      res.status(201).json({
        success: true,
        user: {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          token: generateToken(user._id),
        },
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'ข้อมูลผู้ใช้ไม่ถูกต้อง',
      });
    }
  } catch (error) {
    console.error('Error in register:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการลงทะเบียน',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
};

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
      });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'บัญชีนี้ถูกระงับการใช้งาน โปรดติดต่อผู้ดูแลระบบ',
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
      });
    }

    // Check if there's a guest cart to migrate
    const guestId = req.cookies.guestId;
    if (guestId) {
      await migrateGuestCart(guestId, user._id);
      // Clear the guest ID cookie
      res.clearCookie('guestId');
    }

    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
};

/**
 * Helper function to migrate guest cart to user cart
 * @param {string} guestId - Guest ID from cookie
 * @param {string} userId - User ID to migrate cart to
 */
const migrateGuestCart = async (guestId, userId) => {
  try {
    // Find guest cart
    const guestCart = await Cart.findOne({ guestId });
    if (!guestCart || guestCart.items.length === 0) {
      return; // No guest cart or empty cart, nothing to migrate
    }

    // Find user cart or create one
    let userCart = await Cart.findOne({ user: userId });
    
    if (!userCart) {
      // If no user cart exists, change the guest cart's ownership
      guestCart.user = userId;
      guestCart.guestId = null;
      await guestCart.save();
      info(`Guest cart ${guestId} converted to user cart for user ${userId}`);
      return;
    }

    // Merge items from guest cart to user cart
    for (const item of guestCart.items) {
      const existingItemIndex = userCart.items.findIndex(
        i => i.product.toString() === item.product.toString()
      );

      if (existingItemIndex > -1) {
        // If item already exists in user cart, update quantity
        userCart.items[existingItemIndex].quantity += item.quantity;
      } else {
        // If item doesn't exist in user cart, add it
        userCart.items.push(item);
      }
    }

    // Save updated user cart
    await userCart.save();
    
    // Delete guest cart
    await Cart.findByIdAndDelete(guestCart._id);
    
    info(`Successfully migrated guest cart ${guestId} to user ${userId}`);
  } catch (err) {
    error(`Error migrating guest cart: ${err.message}`, { guestId, userId });
    // We don't throw the error here to avoid disrupting the login/register process
    // Just log it and continue
  }
};

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลผู้ใช้',
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Error in getCurrentUser:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
};

/**
 * @desc    Create a seed admin user (for development)
 * @route   POST /api/auth/seed-admin
 * @access  Public (but can be restricted in production)
 */
exports.seedAdmin = async (req, res) => {
  try {
    // Check if we're running in production
    if (process.env.NODE_ENV === 'production' && res) {
      return res.status(403).json({
        success: false,
        message: 'This endpoint is disabled in production',
      });
    }

    // Check if admin already exists
    const adminExists = await User.findOne({ email: 'kai@tanyarat.online' });
    if (adminExists) {
      console.log('Admin user already exists');
      if (res) {
        return res.status(400).json({
          success: false,
          message: 'Admin user already exists',
        });
      }
      return { success: false, message: 'Admin user already exists' };
    }

    // Create admin user
    const adminUser = await User.create({
      email: 'kai@tanyarat.online',
      password: 'Kai_[hkog]-muj114174',
      firstName: 'Kai',
      lastName: 'Admin',
      phoneNumber: '0888888888',
      role: 'admin',
    });
    
    console.log('Admin user created successfully!');
    
    const result = {
      success: true,
      message: 'Admin user created successfully',
      user: {
        _id: adminUser._id,
        email: adminUser.email,
        firstName: adminUser.firstName,
        lastName: adminUser.lastName,
        role: adminUser.role,
      },
    };

    if (res) {
      res.status(201).json(result);
    }
    
    return result;
  } catch (error) {
    console.error('Error in seedAdmin:', error);
    
    const errorResult = {
      success: false,
      message: 'Error creating admin user',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message,
    };
    
    if (res) {
      res.status(500).json(errorResult);
    }
    
    return errorResult;
  }
}; 
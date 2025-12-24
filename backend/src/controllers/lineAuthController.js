const User = require('../models/User');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const { info, error } = require('../utils/logger');

/**
 * Generate JWT token for authentication
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

/**
 * Verify LINE Access Token and get user profile
 * @param {string} accessToken - LINE Access Token from LIFF
 */
const verifyLineToken = async (accessToken) => {
  try {
    // Verify token
    const verifyResponse = await axios.get(
      `https://api.line.me/oauth2/v2.1/verify?access_token=${accessToken}`
    );
    
    if (verifyResponse.data.client_id !== process.env.LINE_CHANNEL_ID) {
      throw new Error('Invalid LINE channel');
    }
    
    // Get user profile
    const profileResponse = await axios.get('https://api.line.me/v2/profile', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    
    return {
      success: true,
      profile: profileResponse.data
    };
  } catch (err) {
    error('LINE token verification failed', { error: err.message });
    return {
      success: false,
      error: err.message
    };
  }
};

/**
 * @desc    Login/Register ผ่าน LINE LIFF
 * @route   POST /api/line/auth
 * @access  Public
 */
exports.lineAuth = async (req, res) => {
  try {
    const { accessToken, idToken } = req.body;
    
    if (!accessToken) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุ LINE Access Token'
      });
    }
    
    // Verify LINE token and get profile
    const lineResult = await verifyLineToken(accessToken);
    
    if (!lineResult.success) {
      return res.status(401).json({
        success: false,
        message: 'การยืนยันตัวตนกับ LINE ล้มเหลว',
        error: lineResult.error
      });
    }
    
    const { userId, displayName, pictureUrl, statusMessage } = lineResult.profile;
    
    // Find or create user
    let user = await User.findOne({ 'lineProfile.lineUserId': userId });
    
    if (!user) {
      // Create new user with LINE profile
      user = await User.create({
        lineProfile: {
          lineUserId: userId,
          displayName: displayName,
          pictureUrl: pictureUrl,
          statusMessage: statusMessage
        },
        authProvider: 'line',
        firstName: displayName,
        isActive: true
      });
      
      info(`New LINE user registered: ${userId}`, { displayName });
    } else {
      // Update LINE profile if changed
      user.lineProfile.displayName = displayName;
      user.lineProfile.pictureUrl = pictureUrl;
      user.lineProfile.statusMessage = statusMessage;
      await user.save();
      
      info(`LINE user logged in: ${userId}`, { displayName });
    }
    
    // Generate JWT token
    const token = generateToken(user._id);
    
    res.status(200).json({
      success: true,
      message: user.createdAt === user.updatedAt ? 'ลงทะเบียนสำเร็จ' : 'เข้าสู่ระบบสำเร็จ',
      user: {
        _id: user._id,
        lineUserId: user.lineProfile.lineUserId,
        displayName: user.lineProfile.displayName,
        pictureUrl: user.lineProfile.pictureUrl,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        email: user.email,
        role: user.role,
        membership: user.membership,
        authProvider: user.authProvider,
        token
      }
    });
  } catch (err) {
    error('LINE auth error', { error: err.message });
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบผ่าน LINE',
      error: process.env.NODE_ENV === 'production' ? undefined : err.message
    });
  }
};

/**
 * @desc    อัพเดทข้อมูลโปรไฟล์ผู้ใช้ LINE
 * @route   PUT /api/line/profile
 * @access  Private
 */
exports.updateLineProfile = async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber, email } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลผู้ใช้'
      });
    }
    
    // Update fields if provided
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (email) user.email = email;
    
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'อัพเดทข้อมูลสำเร็จ',
      user: {
        _id: user._id,
        lineUserId: user.lineProfile?.lineUserId,
        displayName: user.lineProfile?.displayName,
        pictureUrl: user.lineProfile?.pictureUrl,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        email: user.email,
        role: user.role,
        membership: user.membership
      }
    });
  } catch (err) {
    error('Update LINE profile error', { error: err.message });
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัพเดทข้อมูล',
      error: process.env.NODE_ENV === 'production' ? undefined : err.message
    });
  }
};

/**
 * @desc    ดึงข้อมูลผู้ใช้ LINE ปัจจุบัน
 * @route   GET /api/line/me
 * @access  Private
 */
exports.getLineProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลผู้ใช้'
      });
    }
    
    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        lineProfile: user.lineProfile,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        email: user.email,
        role: user.role,
        membership: user.membership,
        addresses: user.addresses,
        subscription: user.subscription,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    error('Get LINE profile error', { error: err.message });
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้',
      error: process.env.NODE_ENV === 'production' ? undefined : err.message
    });
  }
};

/**
 * @desc    Verify ID Token (alternative method)
 * @route   POST /api/line/verify
 * @access  Public
 */
exports.verifyIdToken = async (req, res) => {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุ ID Token'
      });
    }
    
    // Verify ID Token with LINE
    const response = await axios.post(
      'https://api.line.me/oauth2/v2.1/verify',
      new URLSearchParams({
        id_token: idToken,
        client_id: process.env.LINE_CHANNEL_ID
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    const { sub: userId, name, picture, email } = response.data;
    
    res.status(200).json({
      success: true,
      profile: {
        userId,
        displayName: name,
        pictureUrl: picture,
        email
      }
    });
  } catch (err) {
    error('ID Token verification error', { error: err.message });
    res.status(401).json({
      success: false,
      message: 'ID Token ไม่ถูกต้อง',
      error: process.env.NODE_ENV === 'production' ? undefined : err.message
    });
  }
};


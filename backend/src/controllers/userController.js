const User = require('../models/User');

/**
 * @desc    Get user profile
 * @route   GET /api/users/profile
 * @access  Private
 */
exports.getUserProfile = async (req, res) => {
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
    console.error('Error in getUserProfile:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
};

/**
 * @desc    Update user profile
 * @route   PUT /api/users/profile
 * @access  Private
 */
exports.updateUserProfile = async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลผู้ใช้',
      });
    }

    // Update fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    
    // Save changes
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'อัปเดตข้อมูลผู้ใช้เรียบร้อยแล้ว',
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลผู้ใช้',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
};

/**
 * @desc    Change password
 * @route   PUT /api/users/password
 * @access  Private
 */
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'โปรดระบุรหัสผ่านปัจจุบันและรหัสผ่านใหม่',
      });
    }
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลผู้ใช้',
      });
    }
    
    // Check if current password is correct
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'รหัสผ่านปัจจุบันไม่ถูกต้อง',
      });
    }
    
    // Update password
    user.password = newPassword;
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว',
    });
  } catch (error) {
    console.error('Error in changePassword:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
};

/**
 * @desc    Get all addresses for the user
 * @route   GET /api/users/addresses
 * @access  Private
 */
exports.getUserAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('addresses');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลผู้ใช้',
      });
    }
    
    res.status(200).json({
      success: true,
      addresses: user.addresses || [],
    });
  } catch (error) {
    console.error('Error in getUserAddresses:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลที่อยู่',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
};

/**
 * @desc    Add a new address
 * @route   POST /api/users/addresses
 * @access  Private
 */
exports.addAddress = async (req, res) => {
  try {
    const { addressLine1, addressLine2, city, state, postalCode, country, isDefault } = req.body;
    
    if (!addressLine1 || !city || !state || !postalCode) {
      return res.status(400).json({
        success: false,
        message: 'โปรดระบุข้อมูลที่อยู่ให้ครบถ้วน',
      });
    }
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลผู้ใช้',
      });
    }
    
    // Create new address
    const newAddress = {
      addressLine1,
      addressLine2: addressLine2 || '',
      city,
      state,
      postalCode,
      country: country || 'Thailand',
      isDefault: isDefault || false,
    };
    
    // If this is the first address or isDefault is true, make it the default
    if (isDefault || user.addresses.length === 0) {
      // Set all other addresses to non-default
      user.addresses.forEach(addr => {
        addr.isDefault = false;
      });
      newAddress.isDefault = true;
    }
    
    // Add new address to array
    user.addresses.push(newAddress);
    
    // Save changes
    await user.save();
    
    res.status(201).json({
      success: true,
      message: 'เพิ่มที่อยู่ใหม่เรียบร้อยแล้ว',
      addresses: user.addresses,
    });
  } catch (error) {
    console.error('Error in addAddress:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการเพิ่มที่อยู่',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
};

/**
 * @desc    Update an address
 * @route   PUT /api/users/addresses/:id
 * @access  Private
 */
exports.updateAddress = async (req, res) => {
  try {
    const addressId = req.params.id;
    const { addressLine1, addressLine2, city, state, postalCode, country, isDefault } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลผู้ใช้',
      });
    }
    
    // Find address to update
    const address = user.addresses.id(addressId);
    
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบที่อยู่ที่ต้องการแก้ไข',
      });
    }
    
    // Update address fields
    if (addressLine1) address.addressLine1 = addressLine1;
    if (addressLine2 !== undefined) address.addressLine2 = addressLine2;
    if (city) address.city = city;
    if (state) address.state = state;
    if (postalCode) address.postalCode = postalCode;
    if (country) address.country = country;
    
    // Handle default address flag
    if (isDefault) {
      // Set all addresses to non-default
      user.addresses.forEach(addr => {
        addr.isDefault = false;
      });
      // Set this address as default
      address.isDefault = true;
    }
    
    // Save changes
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'อัปเดตที่อยู่เรียบร้อยแล้ว',
      addresses: user.addresses,
    });
  } catch (error) {
    console.error('Error in updateAddress:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัปเดตที่อยู่',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
};

/**
 * @desc    Delete an address
 * @route   DELETE /api/users/addresses/:id
 * @access  Private
 */
exports.deleteAddress = async (req, res) => {
  try {
    const addressId = req.params.id;
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลผู้ใช้',
      });
    }
    
    // Check if address exists
    if (!user.addresses.id(addressId)) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบที่อยู่ที่ต้องการลบ',
      });
    }
    
    // Get info about the address being deleted
    const addressToDelete = user.addresses.id(addressId);
    const wasDefault = addressToDelete.isDefault;
    
    // Remove address
    user.addresses.pull(addressId);
    
    // If the deleted address was the default and there are other addresses, make the first one the default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }
    
    // Save changes
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'ลบที่อยู่เรียบร้อยแล้ว',
      addresses: user.addresses,
    });
  } catch (error) {
    console.error('Error in deleteAddress:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการลบที่อยู่',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
};

/**
 * @desc    Set an address as default
 * @route   PUT /api/users/addresses/:id/default
 * @access  Private
 */
exports.setDefaultAddress = async (req, res) => {
  try {
    const addressId = req.params.id;
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลผู้ใช้',
      });
    }
    
    // Find address to set as default
    const address = user.addresses.id(addressId);
    
    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบที่อยู่ที่ต้องการตั้งค่า',
      });
    }
    
    // Set all addresses to non-default
    user.addresses.forEach(addr => {
      addr.isDefault = false;
    });
    
    // Set selected address as default
    address.isDefault = true;
    
    // Save changes
    await user.save();
    
    res.status(200).json({
      success: true,
      message: 'ตั้งค่าเป็นที่อยู่หลักเรียบร้อยแล้ว',
      addresses: user.addresses,
    });
  } catch (error) {
    console.error('Error in setDefaultAddress:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการตั้งค่าที่อยู่หลัก',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
};

// Add admin user management functions
/**
 * @desc    Get all users (admin)
 * @route   GET /api/admin/users
 * @access  Private/Admin
 */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({ success: true, count: users.length, users });
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้ทั้งหมด',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
};

/**
 * @desc    Get user by ID (admin)
 * @route   GET /api/admin/users/:id
 * @access  Private/Admin
 */
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้ที่ระบุ' });
    }
    res.status(200).json({ success: true, user });
  } catch (error) {
    console.error('Error in getUserById:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
};

/**
 * @desc    Update user (admin)
 * @route   PUT /api/admin/users/:id
 * @access  Private/Admin
 */
exports.updateUser = async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber, role, isActive } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้ที่ระบุ' });
    }
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (role) user.role = role;
    if (typeof isActive !== 'undefined') user.isActive = isActive;
    await user.save();
    res.status(200).json({
      success: true,
      message: 'อัปเดตผู้ใช้เรียบร้อยแล้ว',
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error('Error in updateUser:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัปเดตผู้ใช้',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
};

/**
 * @desc    Delete user (admin)
 * @route   DELETE /api/admin/users/:id
 * @access  Private/Admin
 */
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้ที่ระบุ' });
    }
    await user.remove();
    res.status(200).json({ success: true, message: 'ลบผู้ใช้เรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Error in deleteUser:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการลบผู้ใช้',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message,
    });
  }
}; 
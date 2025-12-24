const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { info, error, withSpan } = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

// Helper function to get or create a cart for a user
const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = new Cart({ user: userId, items: [] });
    await cart.save();
  }
  return cart;
};

// สร้างหรือดึงข้อมูลตะกร้าสินค้า
const getCart = async (req, res) => {
  await withSpan('controllers.cart.getCart', async () => {
    try {
      let cart;
      
      // ตรวจสอบว่ามีการล็อกอิน
      if (req.user) {
        // กรณีล็อกอิน ดึงตะกร้าตาม user
        cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
        
        // ถ้ามี guest cart ให้รวมเข้ากับ user cart
        const guestId = req.cookies.guestId || req.body.guestId;
        if (guestId) {
          const guestCart = await Cart.findOne({ guestId });
          if (guestCart) {
            // ถ้าไม่มีตะกร้าของ user ให้เปลี่ยน guest cart เป็น user cart
            if (!cart) {
              guestCart.user = req.user.id;
              guestCart.guestId = null;
              await guestCart.save();
              cart = guestCart;
            } else {
              // ถ้ามีตะกร้าของ user แล้ว ให้รวมรายการสินค้าจาก guest cart
              for (const item of guestCart.items) {
                const existingItem = cart.items.find(i => 
                  i.product.toString() === item.product.toString()
                );
                
                if (existingItem) {
                  existingItem.quantity += item.quantity;
                } else {
                  cart.items.push(item);
                }
              }
              await cart.save();
              await Cart.findByIdAndDelete(guestCart._id);
            }
            
            // ลบ cookie guestId
            res.clearCookie('guestId');
          }
        }
      } else {
        // กรณีไม่ล็อกอิน ตรวจสอบ guestId จาก cookie
        let guestId = req.cookies.guestId || req.body.guestId;
        
        // ถ้าไม่มี guestId ให้สร้างใหม่
        if (!guestId) {
          guestId = uuidv4();
          // เก็บค่า guestId ใน cookie (หมดอายุ 30 วัน)
          res.cookie('guestId', guestId, { 
            maxAge: 30 * 24 * 60 * 60 * 1000, 
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production'
          });
        }
        
        // ดึงตะกร้า
        cart = await Cart.findOne({ guestId }).populate('items.product');
      }
      
      // ถ้าไม่มีตะกร้า ให้สร้างใหม่
      if (!cart) {
        cart = new Cart({
          user: req.user ? req.user.id : null,
          guestId: !req.user ? (req.cookies.guestId || req.body.guestId) : null,
          items: []
        });
        await cart.save();
      }
      
      res.status(200).json({
        status: 'success',
        data: cart
      });
    } catch (err) {
      error('Error getting cart', { error: err.message });
      res.status(500).json({
        status: 'error',
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลตะกร้าสินค้า',
        error: process.env.NODE_ENV === 'production' ? undefined : err.message
      });
    }
  });
};

// เพิ่มสินค้าลงตะกร้า
const addToCart = async (req, res) => {
  await withSpan('controllers.cart.addToCart', async () => {
    try {
      const { productId, quantity } = req.body;
      
      // ตรวจสอบข้อมูลสินค้า
      if (!productId || !quantity || quantity < 1) {
        return res.status(400).json({
          status: 'error',
          message: 'กรุณาระบุรหัสสินค้าและจำนวนสินค้า'
        });
      }
      
      // ดึงข้อมูลสินค้า
      const product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({
          status: 'error',
          message: 'ไม่พบสินค้า'
        });
      }
      
      // ตรวจสอบสินค้าคงเหลือ
      if (product.stock < quantity) {
        return res.status(400).json({
          status: 'error',
          message: `สินค้าคงเหลือไม่เพียงพอ (เหลือ ${product.stock} ชิ้น)`
        });
      }
      
      let cart;
      
      // ตรวจสอบว่ามีการล็อกอิน
      if (req.user) {
        cart = await Cart.findOne({ user: req.user.id });
        if (!cart) {
          cart = new Cart({ user: req.user.id, items: [] });
        }
      } else {
        let guestId = req.cookies.guestId || req.body.guestId;
        
        if (!guestId) {
          guestId = uuidv4();
          res.cookie('guestId', guestId, { 
            maxAge: 30 * 24 * 60 * 60 * 1000, 
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production'
          });
        }
        
        cart = await Cart.findOne({ guestId });
        if (!cart) {
          cart = new Cart({ guestId, items: [] });
        }
      }
      
      // ตรวจสอบว่ามีสินค้านี้ในตะกร้าอยู่แล้วหรือไม่
      const existingItemIndex = cart.items.findIndex(item => 
        item.product.toString() === productId
      );
      
      // กำหนดราคาตามสถานะของผู้ใช้
      let price = product.price;
      
      // ถ้าล็อกอินและเป็นสมาชิกให้ใช้ราคาสมาชิก (ถ้ามี)
      if (req.user && req.user.membership !== 'none' && product.memberPrice > 0) {
        price = product.memberPrice;
      } else if (product.salePrice > 0) { // ถ้าไม่ใช่สมาชิกให้ใช้ราคาโปรโมชั่น (ถ้ามี)
        price = product.salePrice;
      }
      
      if (existingItemIndex > -1) {
        // ถ้ามีสินค้านี้อยู่แล้ว ให้เพิ่มจำนวน
        cart.items[existingItemIndex].quantity += quantity;
      } else {
        // ถ้ายังไม่มีสินค้านี้ ให้เพิ่มรายการใหม่
        cart.items.push({
          product: productId,
          quantity,
          price
        });
      }
      
      await cart.save();
      
      res.status(200).json({
        status: 'success',
        message: 'เพิ่มสินค้าลงตะกร้าเรียบร้อยแล้ว',
        data: cart
      });
    } catch (err) {
      error('Error adding to cart', { error: err.message });
      res.status(500).json({
        status: 'error',
        message: 'เกิดข้อผิดพลาดในการเพิ่มสินค้าลงตะกร้า',
        error: process.env.NODE_ENV === 'production' ? undefined : err.message
      });
    }
  });
};

// อัพเดทจำนวนสินค้าในตะกร้า
const updateCartItem = async (req, res) => {
  await withSpan('controllers.cart.updateCartItem', async () => {
    try {
      const { itemId } = req.params;
      const { quantity } = req.body;
      
      if (!quantity || quantity < 0) {
        return res.status(400).json({
          status: 'error',
          message: 'กรุณาระบุจำนวนสินค้าที่ถูกต้อง'
        });
      }
      
      let cart;
      
      // ดึงตะกร้า
      if (req.user) {
        cart = await Cart.findOne({ user: req.user.id });
      } else {
        const guestId = req.cookies.guestId || req.body.guestId;
        if (!guestId) {
          return res.status(400).json({
            status: 'error',
            message: 'ไม่พบข้อมูลตะกร้าสินค้า'
          });
        }
        cart = await Cart.findOne({ guestId });
      }
      
      if (!cart) {
        return res.status(404).json({
          status: 'error',
          message: 'ไม่พบตะกร้าสินค้า'
        });
      }
      
      // หาสินค้าในตะกร้า
      const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
      
      if (itemIndex === -1) {
        return res.status(404).json({
          status: 'error',
          message: 'ไม่พบสินค้าในตะกร้า'
        });
      }
      
      // ตรวจสอบสินค้าคงเหลือ
      const product = await Product.findById(cart.items[itemIndex].product);
      if (!product) {
        return res.status(404).json({
          status: 'error',
          message: 'ไม่พบข้อมูลสินค้า'
        });
      }
      
      if (quantity > product.stock) {
        return res.status(400).json({
          status: 'error',
          message: `สินค้าคงเหลือไม่เพียงพอ (เหลือ ${product.stock} ชิ้น)`
        });
      }
      
      // ถ้าจำนวน = 0 ให้ลบสินค้าออกจากตะกร้า
      if (quantity === 0) {
        cart.items.splice(itemIndex, 1);
      } else {
        cart.items[itemIndex].quantity = quantity;
      }
      
      await cart.save();
      
      res.status(200).json({
        status: 'success',
        message: 'อัพเดทตะกร้าสินค้าเรียบร้อยแล้ว',
        data: cart
      });
    } catch (err) {
      error('Error updating cart item', { error: err.message });
      res.status(500).json({
        status: 'error',
        message: 'เกิดข้อผิดพลาดในการอัพเดทสินค้าในตะกร้า',
        error: process.env.NODE_ENV === 'production' ? undefined : err.message
      });
    }
  });
};

// ลบสินค้าออกจากตะกร้า
const removeFromCart = async (req, res) => {
  await withSpan('controllers.cart.removeFromCart', async () => {
    try {
      const { itemId } = req.params;
      
      let cart;
      
      // ดึงตะกร้า
      if (req.user) {
        cart = await Cart.findOne({ user: req.user.id });
      } else {
        const guestId = req.cookies.guestId || req.body.guestId;
        if (!guestId) {
          return res.status(400).json({
            status: 'error',
            message: 'ไม่พบข้อมูลตะกร้าสินค้า'
          });
        }
        cart = await Cart.findOne({ guestId });
      }
      
      if (!cart) {
        return res.status(404).json({
          status: 'error',
          message: 'ไม่พบตะกร้าสินค้า'
        });
      }
      
      // หาสินค้าในตะกร้า
      const itemIndex = cart.items.findIndex(item => item._id.toString() === itemId);
      
      if (itemIndex === -1) {
        return res.status(404).json({
          status: 'error',
          message: 'ไม่พบสินค้าในตะกร้า'
        });
      }
      
      // ลบสินค้า
      cart.items.splice(itemIndex, 1);
      
      await cart.save();
      
      res.status(200).json({
        status: 'success',
        message: 'ลบสินค้าออกจากตะกร้าเรียบร้อยแล้ว',
        data: cart
      });
    } catch (err) {
      error('Error removing from cart', { error: err.message });
      res.status(500).json({
        status: 'error',
        message: 'เกิดข้อผิดพลาดในการลบสินค้าออกจากตะกร้า',
        error: process.env.NODE_ENV === 'production' ? undefined : err.message
      });
    }
  });
};

// ล้างตะกร้า
const clearCart = async (req, res) => {
  await withSpan('controllers.cart.clearCart', async () => {
    try {
      let cart;
      
      // ดึงตะกร้า
      if (req.user) {
        cart = await Cart.findOne({ user: req.user.id });
      } else {
        const guestId = req.cookies.guestId || req.body.guestId;
        if (!guestId) {
          return res.status(400).json({
            status: 'error',
            message: 'ไม่พบข้อมูลตะกร้าสินค้า'
          });
        }
        cart = await Cart.findOne({ guestId });
      }
      
      if (!cart) {
        return res.status(404).json({
          status: 'error',
          message: 'ไม่พบตะกร้าสินค้า'
        });
      }
      
      // ล้างตะกร้า
      cart.items = [];
      
      await cart.save();
      
      res.status(200).json({
        status: 'success',
        message: 'ล้างตะกร้าเรียบร้อยแล้ว',
        data: cart
      });
    } catch (err) {
      error('Error clearing cart', { error: err.message });
      res.status(500).json({
        status: 'error',
        message: 'เกิดข้อผิดพลาดในการล้างตะกร้า',
        error: process.env.NODE_ENV === 'production' ? undefined : err.message
      });
    }
  });
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
}; 
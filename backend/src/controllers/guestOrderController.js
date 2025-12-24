const GuestOrder = require('../models/GuestOrder');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const { info, error, withSpan } = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

// สร้างคำสั่งซื้อสำหรับลูกค้าที่ไม่ได้ล็อกอิน
const createGuestOrder = async (req, res) => {
  await withSpan('controllers.guestOrder.createGuestOrder', async () => {
    try {
      const {
        email,
        firstName,
        lastName,
        phoneNumber,
        shippingAddress,
        billingAddress,
        paymentMethod,
        guestId,
        convertToMember,
        notes
      } = req.body;
      
      // ตรวจสอบข้อมูลที่จำเป็น
      if (!email || !firstName || !lastName || !phoneNumber || !shippingAddress || !paymentMethod) {
        return res.status(400).json({
          status: 'error',
          message: 'กรุณากรอกข้อมูลให้ครบถ้วน'
        });
      }
      
      // ตรวจสอบรูปแบบอีเมล
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          status: 'error',
          message: 'รูปแบบอีเมลไม่ถูกต้อง'
        });
      }
      
      // ตรวจสอบตะกร้าสินค้า
      let cartGuestId = guestId || req.cookies.guestId;
      
      if (!cartGuestId) {
        return res.status(400).json({
          status: 'error',
          message: 'ไม่พบข้อมูลตะกร้าสินค้า'
        });
      }
      
      const cart = await Cart.findOne({ guestId: cartGuestId }).populate('items.product');
      
      if (!cart || !cart.items || cart.items.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'ตะกร้าสินค้าว่างเปล่า'
        });
      }
      
      // แปลงข้อมูลรายการสินค้าให้อยู่ในรูปแบบที่ต้องการ
      const orderItems = [];
      let subtotal = 0;
      
      for (const item of cart.items) {
        // ตรวจสอบสินค้าคงเหลือ
        if (item.product.stock < item.quantity) {
          return res.status(400).json({
            status: 'error',
            message: `สินค้า ${item.product.name} มีไม่เพียงพอ (คงเหลือ ${item.product.stock} ชิ้น)`
          });
        }
        
        orderItems.push({
          product: item.product._id,
          name: item.product.name,
          quantity: item.quantity,
          price: item.price,
          image: item.product.images && item.product.images.length > 0 ? item.product.images[0].url : null
        });
        
        subtotal += item.price * item.quantity;
      }
      
      // กำหนดค่าขนส่ง (ตัวอย่าง: ค่าขนส่งฟรีเมื่อซื้อสินค้ามากกว่า 1,000 บาท)
      const shippingFee = subtotal >= 1000 ? 0 : 50;
      
      // สร้างคำสั่งซื้อ
      const guestOrder = new GuestOrder({
        guestId: cartGuestId,
        email,
        firstName,
        lastName,
        phoneNumber,
        items: orderItems,
        shippingAddress,
        billingAddress: billingAddress || { sameAsShipping: true },
        paymentMethod,
        subtotal,
        shippingFee,
        discount: 0, // ส่วนลดสามารถคำนวณได้ตามโปรโมชันต่างๆ
        total: subtotal + shippingFee,
        notes,
        convertToMember: convertToMember || false,
        status: 'Pending Payment' // Set new initial status
      });
      
      // --- START: Save Order and Clear Cart (No Stock Decrement Here) --- 
      try {
          // Save the order FIRST
          await guestOrder.save();

          // Clear the guest cart
          // Note: Cart clearing might also be deferred depending on business logic.
          await Cart.updateOne({ guestId: cartGuestId }, { $set: { items: [] } });

          res.status(201).json({
            status: 'success',
            message: 'สั่งซื้อสินค้าเรียบร้อยแล้ว (รอการชำระเงิน)',
            data: {
              orderId: guestOrder._id,
              total: guestOrder.total,
              orderDate: guestOrder.createdAt
            }
          });

      } catch (saveError) {
            error('Error saving guest order', { error: saveError.message });
            return res.status(500).json({
                 status: 'error',
                 message: 'เกิดข้อผิดพลาดในการบันทึกคำสั่งซื้อ',
                 error: process.env.NODE_ENV === 'production' ? undefined : saveError.message
             });
      }
      // --- END: Save Order and Clear Cart --- 
    } catch (err) {
      // General error handling (e.g., error finding cart)
      error('Error in createGuestOrder process', { error: err.message });
      res.status(500).json({
        status: 'error',
        message: 'เกิดข้อผิดพลาดในการสั่งซื้อสินค้า',
        error: process.env.NODE_ENV === 'production' ? undefined : err.message
      });
    }
  });
};

// ดึงข้อมูลคำสั่งซื้อจาก ID
const getGuestOrderById = async (req, res) => {
  await withSpan('controllers.guestOrder.getGuestOrderById', async () => {
    try {
      const { orderId } = req.params;
      const { email, phoneNumber } = req.query;
      
      if (!orderId || !email || !phoneNumber) {
        return res.status(400).json({
          status: 'error',
          message: 'กรุณาระบุรหัสคำสั่งซื้อ อีเมล และเบอร์โทรศัพท์'
        });
      }
      
      const order = await GuestOrder.findOne({
        _id: orderId,
        email,
        phoneNumber
      }).populate('items.product');
      
      if (!order) {
        return res.status(404).json({
          status: 'error',
          message: 'ไม่พบข้อมูลคำสั่งซื้อ'
        });
      }
      
      res.status(200).json({
        status: 'success',
        data: order
      });
    } catch (err) {
      error('Error getting guest order', { error: err.message });
      res.status(500).json({
        status: 'error',
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำสั่งซื้อ',
        error: process.env.NODE_ENV === 'production' ? undefined : err.message
      });
    }
  });
};

// ดึงข้อมูลคำสั่งซื้อทั้งหมดจากอีเมลและเบอร์โทรศัพท์
const getGuestOrdersByContact = async (req, res) => {
  await withSpan('controllers.guestOrder.getGuestOrdersByContact', async () => {
    try {
      const { email, phoneNumber } = req.query;
      
      if (!email || !phoneNumber) {
        return res.status(400).json({
          status: 'error',
          message: 'กรุณาระบุอีเมลและเบอร์โทรศัพท์'
        });
      }
      
      const orders = await GuestOrder.find({
        email,
        phoneNumber
      }).sort({ createdAt: -1 });
      
      res.status(200).json({
        status: 'success',
        results: orders.length,
        data: orders
      });
    } catch (err) {
      error('Error getting guest orders by contact', { error: err.message });
      res.status(500).json({
        status: 'error',
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำสั่งซื้อ',
        error: process.env.NODE_ENV === 'production' ? undefined : err.message
      });
    }
  });
};

// ยกเลิกคำสั่งซื้อ
const cancelGuestOrder = async (req, res) => {
  await withSpan('controllers.guestOrder.cancelGuestOrder', async () => {
    try {
      const { orderId } = req.params;
      const { email, phoneNumber, reason } = req.body;
      
      if (!orderId || !email || !phoneNumber) {
        return res.status(400).json({
          status: 'error',
          message: 'กรุณาระบุรหัสคำสั่งซื้อ อีเมล และเบอร์โทรศัพท์'
        });
      }
      
      const order = await GuestOrder.findOne({
        _id: orderId,
        email,
        phoneNumber
      });
      
      if (!order) {
        return res.status(404).json({
          status: 'error',
          message: 'ไม่พบข้อมูลคำสั่งซื้อ'
        });
      }
      
      // ตรวจสอบว่าสถานะเป็น pending หรือ processing เท่านั้น
      // Allow cancellation if pending payment as well
      if (!['Pending Payment', 'Processing'].includes(order.status)) {
        return res.status(400).json({
          status: 'error',
          message: 'ไม่สามารถยกเลิกคำสั่งซื้อได้ เนื่องจากคำสั่งซื้ออาจกำลังจัดส่งหรือจัดส่งแล้ว'
        });
      }
      
      // Check if stock was already decremented (important for restocking logic)
      const needsRestock = order.isStockDecremented;

      // อัพเดทสถานะเป็น cancelled
      order.status = 'Cancelled';
      order.notes = order.notes ? `${order.notes}\n\nยกเลิกเพราะ: ${reason || 'ไม่ได้ระบุเหตุผล'}` : `ยกเลิกเพราะ: ${reason || 'ไม่ได้ระบุเหตุผล'}`;
      // Reset flags if cancelled
      order.isPaid = false; 
      order.isDelivered = false;
      // isStockDecremented remains true if it was already decremented, until restock happens
      
      await order.save();
      
      // คืนสินค้าเข้าสต็อก (only if stock was previously decremented)
      if (needsRestock) {
          info('Restocking products for cancelled guest order', { orderId: order._id });
          for (const item of order.items) {
            await Product.findByIdAndUpdate(item.product, {
              $inc: { stock: item.quantity }
            });
          }
          // Update order again to mark as restocked (optional, could rely on status)
           await GuestOrder.findByIdAndUpdate(order._id, { isStockDecremented: false }); // Reset flag after restock
      } else {
           info('Guest order cancelled before stock decrement, no restocking needed', { orderId: order._id });
      }
      
      res.status(200).json({
        status: 'success',
        message: 'ยกเลิกคำสั่งซื้อเรียบร้อยแล้ว',
        data: order
      });
    } catch (err) {
      error('Error cancelling guest order', { error: err.message });
      res.status(500).json({
        status: 'error',
        message: 'เกิดข้อผิดพลาดในการยกเลิกคำสั่งซื้อ',
        error: process.env.NODE_ENV === 'production' ? undefined : err.message
      });
    }
  });
};

module.exports = {
  createGuestOrder,
  getGuestOrderById,
  getGuestOrdersByContact,
  cancelGuestOrder
}; 
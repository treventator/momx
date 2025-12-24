const Subscription = require('../models/Subscription');
const Product = require('../models/Product');
const User = require('../models/User');
const { info, error, withSpan } = require('../utils/logger');

// สร้าง subscription ใหม่
const createSubscription = async (req, res) => {
  await withSpan('controllers.subscription.createSubscription', async () => {
    try {
      // ตรวจสอบการล็อกอิน
      if (!req.user) {
        return res.status(401).json({
          status: 'error',
          message: 'กรุณาเข้าสู่ระบบก่อนสมัครสมาชิก Subscription'
        });
      }
      
      const { 
        plan, 
        items, 
        shippingAddress,
        paymentMethod
      } = req.body;
      
      // ตรวจสอบข้อมูลที่จำเป็น
      if (!plan || !items || !items.length || !shippingAddress || !paymentMethod) {
        return res.status(400).json({
          status: 'error',
          message: 'กรุณาระบุข้อมูลให้ครบถ้วน'
        });
      }
      
      // ตรวจสอบว่าผู้ใช้มี subscription อยู่แล้วหรือไม่
      const existingSubscription = await Subscription.findOne({ 
        user: req.user.id,
        status: 'active'
      });
      
      if (existingSubscription) {
        return res.status(400).json({
          status: 'error',
          message: 'คุณมี subscription ที่ยังใช้งานอยู่ กรุณายกเลิกหรือแก้ไข subscription เดิมก่อน'
        });
      }
      
      // ตรวจสอบสินค้าและคำนวณราคา
      const validatedItems = [];
      let totalAmount = 0;
      
      for (const item of items) {
        const product = await Product.findById(item.productId);
        
        if (!product) {
          return res.status(404).json({
            status: 'error',
            message: `ไม่พบสินค้ารหัส ${item.productId}`
          });
        }
        
        if (!product.isSubscribable) {
          return res.status(400).json({
            status: 'error',
            message: `สินค้า ${product.name} ไม่สามารถสมัคร subscription ได้`
          });
        }
        
        // หาแผนการสมัครสมาชิกที่เลือก
        const subscriptionPlan = product.subscriptionPlans.find(p => p.frequency === plan);
        
        if (!subscriptionPlan) {
          return res.status(400).json({
            status: 'error',
            message: `สินค้า ${product.name} ไม่มีแผนการสมัครแบบ ${plan}`
          });
        }
        
        // คำนวณราคาสำหรับ subscription
        const price = subscriptionPlan.price;
        
        validatedItems.push({
          product: product._id,
          quantity: item.quantity || 1,
          price
        });
        
        totalAmount += price * (item.quantity || 1);
      }
      
      // คำนวณวันที่จัดส่งสินค้า
      const startDate = new Date();
      let nextDeliveryDate = new Date();
      
      switch (plan) {
        case 'monthly':
          nextDeliveryDate.setMonth(nextDeliveryDate.getMonth() + 1);
          break;
        case 'quarterly':
          nextDeliveryDate.setMonth(nextDeliveryDate.getMonth() + 3);
          break;
        case 'yearly':
          nextDeliveryDate.setFullYear(nextDeliveryDate.getFullYear() + 1);
          break;
        default:
          nextDeliveryDate.setMonth(nextDeliveryDate.getMonth() + 1);
      }
      
      // สร้าง subscription ใหม่
      const subscription = new Subscription({
        user: req.user.id,
        status: 'active',
        plan,
        items: validatedItems,
        startDate,
        nextDeliveryDate,
        totalAmount,
        shippingAddress,
        paymentMethod
      });
      
      await subscription.save();
      
      // อัพเดทสถานะ subscription ในข้อมูลผู้ใช้
      await User.findByIdAndUpdate(req.user.id, {
        'subscription.isActive': true,
        'subscription.plan': plan,
        'subscription.startDate': startDate,
        'subscription.nextDeliveryDate': nextDeliveryDate,
        'subscription.items': items.map(item => ({
          productId: item.productId,
          quantity: item.quantity || 1
        })),
        'subscription.shippingAddress': shippingAddress,
        'subscription.payment': {
          method: paymentMethod.type,
          last4: paymentMethod.details?.last4 || '',
          expiryDate: paymentMethod.details?.expiryDate || ''
        }
      });
      
      res.status(201).json({
        status: 'success',
        message: 'สมัครสมาชิก subscription เรียบร้อยแล้ว',
        data: subscription
      });
    } catch (err) {
      error('Error creating subscription', { error: err.message });
      res.status(500).json({
        status: 'error',
        message: 'เกิดข้อผิดพลาดในการสมัครสมาชิก subscription',
        error: process.env.NODE_ENV === 'production' ? undefined : err.message
      });
    }
  });
};

// ดึงข้อมูล subscription ของผู้ใช้
const getMySubscription = async (req, res) => {
  await withSpan('controllers.subscription.getMySubscription', async () => {
    try {
      if (!req.user) {
        return res.status(401).json({
          status: 'error',
          message: 'กรุณาเข้าสู่ระบบก่อน'
        });
      }
      
      const subscription = await Subscription.findOne({
        user: req.user.id,
        status: { $ne: 'cancelled' }
      }).populate('items.product');
      
      if (!subscription) {
        return res.status(404).json({
          status: 'error',
          message: 'ไม่พบข้อมูลการสมัครสมาชิก subscription'
        });
      }
      
      res.status(200).json({
        status: 'success',
        data: subscription
      });
    } catch (err) {
      error('Error getting subscription', { error: err.message });
      res.status(500).json({
        status: 'error',
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูล subscription',
        error: process.env.NODE_ENV === 'production' ? undefined : err.message
      });
    }
  });
};

// ยกเลิก subscription
const cancelSubscription = async (req, res) => {
  await withSpan('controllers.subscription.cancelSubscription', async () => {
    try {
      if (!req.user) {
        return res.status(401).json({
          status: 'error',
          message: 'กรุณาเข้าสู่ระบบก่อน'
        });
      }
      
      const subscription = await Subscription.findOne({
        user: req.user.id,
        status: 'active'
      });
      
      if (!subscription) {
        return res.status(404).json({
          status: 'error',
          message: 'ไม่พบข้อมูลการสมัครสมาชิก subscription ที่ยังใช้งานอยู่'
        });
      }
      
      // อัพเดทสถานะ subscription
      subscription.status = 'cancelled';
      await subscription.save();
      
      // อัพเดทสถานะ subscription ในข้อมูลผู้ใช้
      await User.findByIdAndUpdate(req.user.id, {
        'subscription.isActive': false
      });
      
      res.status(200).json({
        status: 'success',
        message: 'ยกเลิกการสมัครสมาชิก subscription เรียบร้อยแล้ว',
        data: subscription
      });
    } catch (err) {
      error('Error cancelling subscription', { error: err.message });
      res.status(500).json({
        status: 'error',
        message: 'เกิดข้อผิดพลาดในการยกเลิก subscription',
        error: process.env.NODE_ENV === 'production' ? undefined : err.message
      });
    }
  });
};

// อัพเดท subscription
const updateSubscription = async (req, res) => {
  await withSpan('controllers.subscription.updateSubscription', async () => {
    try {
      if (!req.user) {
        return res.status(401).json({
          status: 'error',
          message: 'กรุณาเข้าสู่ระบบก่อน'
        });
      }
      
      const { 
        plan,
        items,
        shippingAddress,
        paymentMethod
      } = req.body;
      
      const subscription = await Subscription.findOne({
        user: req.user.id,
        status: 'active'
      });
      
      if (!subscription) {
        return res.status(404).json({
          status: 'error',
          message: 'ไม่พบข้อมูลการสมัครสมาชิก subscription ที่ยังใช้งานอยู่'
        });
      }
      
      // อัพเดทแผนการสมัคร
      if (plan && plan !== subscription.plan) {
        subscription.plan = plan;
        subscription.calculateNextDeliveryDate();
      }
      
      // อัพเดทรายการสินค้า
      if (items && items.length) {
        const validatedItems = [];
        let totalAmount = 0;
        
        for (const item of items) {
          const product = await Product.findById(item.productId);
          
          if (!product) {
            return res.status(404).json({
              status: 'error',
              message: `ไม่พบสินค้ารหัส ${item.productId}`
            });
          }
          
          if (!product.isSubscribable) {
            return res.status(400).json({
              status: 'error',
              message: `สินค้า ${product.name} ไม่สามารถสมัคร subscription ได้`
            });
          }
          
          // หาแผนการสมัครสมาชิกที่เลือก
          const subscriptionPlan = product.subscriptionPlans.find(p => p.frequency === (plan || subscription.plan));
          
          if (!subscriptionPlan) {
            return res.status(400).json({
              status: 'error',
              message: `สินค้า ${product.name} ไม่มีแผนการสมัครแบบ ${plan || subscription.plan}`
            });
          }
          
          // คำนวณราคาสำหรับ subscription
          const price = subscriptionPlan.price;
          
          validatedItems.push({
            product: product._id,
            quantity: item.quantity || 1,
            price
          });
          
          totalAmount += price * (item.quantity || 1);
        }
        
        subscription.items = validatedItems;
        subscription.totalAmount = totalAmount;
      }
      
      // อัพเดทที่อยู่จัดส่ง
      if (shippingAddress) {
        subscription.shippingAddress = shippingAddress;
      }
      
      // อัพเดทวิธีการชำระเงิน
      if (paymentMethod) {
        subscription.paymentMethod = paymentMethod;
      }
      
      await subscription.save();
      
      // อัพเดทข้อมูลในโมเดลผู้ใช้
      const updateData = {};
      
      if (plan) {
        updateData['subscription.plan'] = plan;
        updateData['subscription.nextDeliveryDate'] = subscription.nextDeliveryDate;
      }
      
      if (items && items.length) {
        updateData['subscription.items'] = items.map(item => ({
          productId: item.productId,
          quantity: item.quantity || 1
        }));
      }
      
      if (shippingAddress) {
        updateData['subscription.shippingAddress'] = shippingAddress;
      }
      
      if (paymentMethod) {
        updateData['subscription.payment'] = {
          method: paymentMethod.type,
          last4: paymentMethod.details?.last4 || '',
          expiryDate: paymentMethod.details?.expiryDate || ''
        };
      }
      
      if (Object.keys(updateData).length > 0) {
        await User.findByIdAndUpdate(req.user.id, updateData);
      }
      
      res.status(200).json({
        status: 'success',
        message: 'อัพเดทข้อมูล subscription เรียบร้อยแล้ว',
        data: subscription
      });
    } catch (err) {
      error('Error updating subscription', { error: err.message });
      res.status(500).json({
        status: 'error',
        message: 'เกิดข้อผิดพลาดในการอัพเดท subscription',
        error: process.env.NODE_ENV === 'production' ? undefined : err.message
      });
    }
  });
};

// ดึงข้อมูลสินค้าที่สามารถสมัคร subscription ได้
const getSubscribableProducts = async (req, res) => {
  await withSpan('controllers.subscription.getSubscribableProducts', async () => {
    try {
      const products = await Product.find({
        isSubscribable: true,
        isActive: true
      });
      
      res.status(200).json({
        status: 'success',
        results: products.length,
        data: products
      });
    } catch (err) {
      error('Error getting subscribable products', { error: err.message });
      res.status(500).json({
        status: 'error',
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสินค้าสำหรับ subscription',
        error: process.env.NODE_ENV === 'production' ? undefined : err.message
      });
    }
  });
};

module.exports = {
  createSubscription,
  getMySubscription,
  cancelSubscription,
  updateSubscription,
  getSubscribableProducts
}; 
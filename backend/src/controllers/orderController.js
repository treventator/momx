const Order = require('../models/Order');
const User = require('../models/User');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const { info, error, withSpan } = require('../utils/logger');
const lineBotService = require('../services/lineBotService');

/**
 * @desc    Create a new order
 * @route   POST /api/shop/orders
 * @access  Private
 */
exports.createOrder = async (req, res) => {
  await withSpan('controllers.order.createOrder', async () => {
    try {
      const { 
        shippingAddress, 
        paymentMethod, 
        shippingMethod,
        note
      } = req.body;
      
      // Validate required fields
      if (!shippingAddress || !paymentMethod || !shippingMethod) {
        return res.status(400).json({
          status: 'error',
          message: 'กรุณาระบุที่อยู่จัดส่ง วิธีการชำระเงิน และวิธีการจัดส่ง'
        });
      }
      
      // Get user's cart
      const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
      
      if (!cart || cart.items.length === 0) {
        return res.status(400).json({
          status: 'error',
          message: 'ตะกร้าสินค้าว่างเปล่า ไม่สามารถสร้างคำสั่งซื้อได้'
        });
      }
      
      // --- START: Add Stock Check --- 
      const orderItems = [];
      let itemsPrice = 0;

      // Validate stock and prepare orderItems array simultaneously
      for (const item of cart.items) {
        // Check if product exists and has enough stock
        if (!item.product) {
             return res.status(400).json({
                status: 'error',
                message: `ไม่พบข้อมูลสินค้าสำหรับรายการในตะกร้า (ID: ${item.product})`,
             });
        }
        if (item.product.stock < item.quantity) {
          return res.status(400).json({
            status: 'error',
            message: `สินค้า ${item.product.name} มีไม่เพียงพอ (คงเหลือ ${item.product.stock} ชิ้น)`
          });
        }

        // If stock is sufficient, add to orderItems and calculate price
        orderItems.push({
          product: item.product._id,
          name: item.product.name,
          qty: item.quantity,
          image: item.product.images && item.product.images.length > 0 ? item.product.images[0].url : '',
          price: item.price, // Use price from cart item (might include discounts later)
          subtotal: item.price * item.quantity
        });
        itemsPrice += item.price * item.quantity;
      }
       // --- END: Add Stock Check --- 

      // Calculate shipping cost based on shipping method
      let shippingCost = 0;
      if (shippingMethod === 'standard') {
        shippingCost = 60;
      } else if (shippingMethod === 'express') {
        shippingCost = 100;
      }
      
      // Calculate final prices (itemsPrice is already calculated in the loop)
      // const itemsPrice = orderItems.reduce((acc, item) => acc + item.subtotal, 0); // No longer needed
      const taxPrice = Math.round(itemsPrice * 0.07); // 7% VAT
      const totalPrice = itemsPrice + taxPrice + shippingCost;
      
      // Create order object
      const order = new Order({
        user: req.user.id,
        orderItems, // Use the validated and prepared orderItems
        shippingAddress,
        paymentMethod,
        shippingMethod,
        itemsPrice,
        taxPrice,
        shippingPrice: shippingCost,
        totalPrice,
        note: note || '',
        status: 'Pending Payment' // Set new initial status
      });
      
      // --- START: Save Order and Clear Cart (No Stock Decrement Here) --- 
      try {
          // Save the order
          const createdOrder = await order.save();

          // Clear the user's cart
          // Note: Cart clearing might also be deferred until payment confirmation depending on business logic.
          // For now, clear it upon order creation.
          await Cart.updateOne({ user: req.user.id }, { $set: { items: [] } });

          // --- START: Send LINE notification ---
          // ส่งข้อความแจ้งเตือนกลับไปยัง LINE ถ้าผู้ใช้เป็นสมาชิก LINE
          const user = await User.findById(req.user.id);
          if (user?.lineProfile?.lineUserId) {
            const lineUserId = user.lineProfile.lineUserId;
            
            // สร้าง Flex Message สำหรับยืนยันออเดอร์
            const orderConfirmMessage = {
              type: 'flex',
              altText: `✅ รับคำสั่งซื้อ #${createdOrder._id.toString().slice(-8)}`,
              contents: {
                type: 'bubble',
                header: {
                  type: 'box',
                  layout: 'vertical',
                  contents: [
                    {
                      type: 'text',
                      text: '🛒 รับคำสั่งซื้อแล้ว!',
                      weight: 'bold',
                      size: 'lg',
                      color: '#1DB446'
                    }
                  ],
                  backgroundColor: '#F0FFF0'
                },
                body: {
                  type: 'box',
                  layout: 'vertical',
                  contents: [
                    {
                      type: 'text',
                      text: `หมายเลขคำสั่งซื้อ`,
                      size: 'sm',
                      color: '#666666'
                    },
                    {
                      type: 'text',
                      text: `#${createdOrder._id.toString().slice(-8).toUpperCase()}`,
                      weight: 'bold',
                      size: 'xl',
                      margin: 'sm'
                    },
                    {
                      type: 'separator',
                      margin: 'lg'
                    },
                    {
                      type: 'box',
                      layout: 'vertical',
                      margin: 'lg',
                      spacing: 'sm',
                      contents: orderItems.slice(0, 3).map(item => ({
                        type: 'box',
                        layout: 'horizontal',
                        contents: [
                          {
                            type: 'text',
                            text: item.name.length > 20 ? item.name.substring(0, 20) + '...' : item.name,
                            size: 'sm',
                            color: '#555555',
                            flex: 3
                          },
                          {
                            type: 'text',
                            text: `x${item.qty}`,
                            size: 'sm',
                            color: '#111111',
                            align: 'end',
                            flex: 1
                          }
                        ]
                      }))
                    },
                    ...(orderItems.length > 3 ? [{
                      type: 'text',
                      text: `...และอีก ${orderItems.length - 3} รายการ`,
                      size: 'xs',
                      color: '#888888',
                      margin: 'sm'
                    }] : []),
                    {
                      type: 'separator',
                      margin: 'lg'
                    },
                    {
                      type: 'box',
                      layout: 'horizontal',
                      margin: 'lg',
                      contents: [
                        {
                          type: 'text',
                          text: 'ยอดรวม',
                          size: 'md',
                          color: '#555555',
                          weight: 'bold'
                        },
                        {
                          type: 'text',
                          text: `฿${totalPrice.toLocaleString()}`,
                          size: 'md',
                          color: '#1DB446',
                          align: 'end',
                          weight: 'bold'
                        }
                      ]
                    },
                    {
                      type: 'text',
                      text: '⏳ รอการชำระเงิน',
                      size: 'sm',
                      color: '#FF8C00',
                      margin: 'lg',
                      align: 'center'
                    }
                  ]
                },
                footer: {
                  type: 'box',
                  layout: 'vertical',
                  spacing: 'sm',
                  contents: [
                    {
                      type: 'button',
                      action: {
                        type: 'uri',
                        label: 'ชำระเงิน',
                        uri: `https://yourdomain.com/checkout.html?order=${createdOrder._id}`
                      },
                      style: 'primary',
                      color: '#1DB446'
                    },
                    {
                      type: 'button',
                      action: {
                        type: 'uri',
                        label: 'ดูรายละเอียด',
                        uri: `https://liff.line.me/${process.env.LIFF_ID}`
                      },
                      style: 'secondary'
                    }
                  ]
                }
              }
            };
            
            // ส่งข้อความ (ไม่ต้องรอผลลัพธ์)
            lineBotService.pushMessage(lineUserId, orderConfirmMessage)
              .then(result => {
                if (result.success) {
                  info(`LINE notification sent for order ${createdOrder._id}`);
                }
              })
              .catch(err => {
                error('Failed to send LINE notification', { error: err.message });
              });
          }
          // --- END: Send LINE notification ---

          res.status(201).json({
              status: 'success',
              message: 'สร้างคำสั่งซื้อเรียบร้อยแล้ว (รอการชำระเงิน)',
              data: createdOrder
          });
      } catch (saveError) {
          error('Error saving order', { error: saveError.message });
          return res.status(500).json({
              status: 'error',
              message: 'เกิดข้อผิดพลาดในการบันทึกคำสั่งซื้อ',
              error: process.env.NODE_ENV === 'production' ? undefined : saveError.message
          });
      }
      // --- END: Save Order and Clear Cart --- 
    } catch (err) {
       // General error handling (e.g., error finding cart)
       error('Error in createOrder process', { error: err.message });
       res.status(500).json({
        status: 'error',
        message: 'เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ',
        error: process.env.NODE_ENV === 'production' ? undefined : err.message
      });
    }
  });
};

/**
 * @desc    Get all orders for a user
 * @route   GET /api/shop/orders
 * @access  Private
 */
exports.getUserOrders = async (req, res) => {
  await withSpan('controllers.order.getUserOrders', async () => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      
      const orders = await Order.find({ user: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      const total = await Order.countDocuments({ user: req.user.id });
      
      res.status(200).json({
        status: 'success',
        count: orders.length,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        data: orders
      });
    } catch (err) {
      error('Error getting user orders', { error: err.message });
      res.status(500).json({
        status: 'error',
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำสั่งซื้อ',
        error: process.env.NODE_ENV === 'production' ? undefined : err.message
      });
    }
  });
};

/**
 * @desc    Get order by ID
 * @route   GET /api/shop/orders/:id
 * @access  Private
 */
exports.getOrderById = async (req, res) => {
  await withSpan('controllers.order.getOrderById', async () => {
    try {
      const order = await Order.findById(req.params.id);
      
      if (!order) {
        return res.status(404).json({
          status: 'error',
          message: 'ไม่พบคำสั่งซื้อ'
        });
      }
      
      // Check if the logged-in user is the owner or an admin
      if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({
          status: 'error',
          message: 'ไม่มีสิทธิ์เข้าถึงคำสั่งซื้อนี้'
        });
      }
      
      res.status(200).json({
        status: 'success',
        data: order
      });
    } catch (err) {
      error('Error getting order by ID', { error: err.message });
      res.status(500).json({
        status: 'error',
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำสั่งซื้อ',
        error: process.env.NODE_ENV === 'production' ? undefined : err.message
      });
    }
  });
};

/**
 * @desc    Update order to paid
 * @route   PUT /api/shop/orders/:id/pay
 * @access  Private
 */
exports.updateOrderToPaid = async (req, res) => {
  await withSpan('controllers.order.updateOrderToPaid', async () => {
    try {
      const { paymentResult } = req.body;
      
      if (!paymentResult) {
        return res.status(400).json({
          status: 'error',
          message: 'กรุณาระบุข้อมูลการชำระเงิน'
        });
      }
      
      const order = await Order.findById(req.params.id);
      
      if (!order) {
        return res.status(404).json({
          status: 'error',
          message: 'ไม่พบคำสั่งซื้อ'
        });
      }
      
      // Check if the logged-in user is the owner
      if (order.user.toString() !== req.user.id) {
        return res.status(403).json({
          status: 'error',
          message: 'ไม่มีสิทธิ์เข้าถึงคำสั่งซื้อนี้'
        });
      }
      
      // Check if already paid to avoid reprocessing
      if (order.isPaid) {
          return res.status(400).json({
              status: 'error',
              message: 'คำสั่งซื้อนี้ได้รับการชำระเงินแล้ว'
          });
      }

      // --- START: Decrement Stock Logic --- 
      let stockDecrementError = null;
      if (!order.isStockDecremented) { // Check if stock hasn't been decremented yet
          // Check stock again before decrementing (important for concurrency)
          for (const item of order.orderItems) {
              const product = await Product.findById(item.product);
              if (!product || product.stock < item.qty) {
                  stockDecrementError = `สินค้า ${item.name} มีไม่เพียงพอ (คงเหลือ ${product?.stock || 0} ชิ้น) ไม่สามารถดำเนินการชำระเงินได้`;
                  break; // Exit loop on first stock issue
              }
          }

          if (!stockDecrementError) {
              // If all items have enough stock, proceed to decrement
              for (const item of order.orderItems) {
                  await Product.findByIdAndUpdate(item.product, {
                      $inc: { stock: -item.qty }
                  });
              }
              order.isStockDecremented = true; // Mark stock as decremented
          } else {
              // If there was a stock error, return error and DO NOT mark as paid
              error('Stock check failed during payment confirmation', { orderId: order._id, error: stockDecrementError });
              return res.status(400).json({
                  status: 'error',
                  message: stockDecrementError
              });
          }
      } else {
          info('Stock already decremented for order', { orderId: order._id });
      }
      // --- END: Decrement Stock Logic --- 

      // Update order payment details
      order.isPaid = true;
      order.paidAt = Date.now();
      order.status = 'Processing'; // Update status to Processing after payment
      order.paymentResult = {
        id: paymentResult.id,
        status: paymentResult.status,
        update_time: paymentResult.update_time,
        email_address: paymentResult.payer ? paymentResult.payer.email_address : ''
      };
      
      const updatedOrder = await order.save(); // Save all changes (isPaid, paidAt, status, paymentResult, isStockDecremented)
      
      res.status(200).json({
        status: 'success',
        message: 'อัปเดตสถานะการชำระเงินและสต็อกเรียบร้อยแล้ว',
        data: updatedOrder
      });
    } catch (err) {
      error('Error updating order to paid', { error: err.message });
      res.status(500).json({
        status: 'error',
        message: 'เกิดข้อผิดพลาดในการอัปเดตสถานะการชำระเงิน',
        error: process.env.NODE_ENV === 'production' ? undefined : err.message
      });
    }
  });
};

/**
 * @desc    Get all orders (admin)
 * @route   GET /api/shop/orders/admin/all
 * @access  Private/Admin
 */
exports.getAllOrders = async (req, res) => {
  await withSpan('controllers.order.getAllOrders', async () => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const skip = (page - 1) * limit;
      
      // Filter options
      const status = req.query.status;
      const startDate = req.query.startDate;
      const endDate = req.query.endDate;
      
      // Build query
      const query = {};
      
      if (status) {
        if (status === 'paid') {
          query.isPaid = true;
        } else if (status === 'unpaid') {
          query.isPaid = false;
        } else if (status === 'delivered') {
          query.isDelivered = true;
        } else if (status === 'processing') {
          query.isPaid = true;
          query.isDelivered = false;
        }
      }
      
      if (startDate && endDate) {
        query.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }
      
      const orders = await Order.find(query)
        .populate('user', 'id firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
      
      const total = await Order.countDocuments(query);
      
      res.status(200).json({
        status: 'success',
        count: orders.length,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        data: orders
      });
    } catch (err) {
      error('Error getting all orders', { error: err.message });
      res.status(500).json({
        status: 'error',
        message: 'เกิดข้อผิดพลาดในการดึงข้อมูลคำสั่งซื้อทั้งหมด',
        error: process.env.NODE_ENV === 'production' ? undefined : err.message
      });
    }
  });
};

/**
 * @desc    Update order status (admin)
 * @route   PUT /api/shop/orders/:id/status
 * @access  Private/Admin
 */
exports.updateOrderStatus = async (req, res) => {
  await withSpan('controllers.order.updateOrderStatus', async () => {
    try {
      const { status } = req.body;
      const validStatuses = ['Pending Payment', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Refunded'];
      
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({
          status: 'error',
          message: 'กรุณาระบุสถานะคำสั่งซื้อที่ถูกต้อง'
        });
      }
      
      const order = await Order.findById(req.params.id);
      
      if (!order) {
        return res.status(404).json({ status: 'error', message: 'ไม่พบคำสั่งซื้อ' });
      }

      const oldStatus = order.status;

      // --- START: Decrement Stock on Status Change (if needed) --- 
      // Decrement stock if moving to a processed state and stock hasn't been decremented
      if (['Processing', 'Shipped'].includes(status) && oldStatus === 'Pending Payment' && !order.isStockDecremented) {
          let stockDecrementError = null;
          info('Decrementing stock due to status change', { orderId: order._id, newStatus: status });

          // Check stock again before decrementing
          for (const item of order.orderItems) {
              const product = await Product.findById(item.product);
              if (!product || product.stock < item.qty) {
                  stockDecrementError = `สินค้า ${item.name} มีไม่เพียงพอ (คงเหลือ ${product?.stock || 0} ชิ้น) ไม่สามารถเปลี่ยนสถานะเป็น ${status} ได้`;
                  break;
              }
          }

          if (!stockDecrementError) {
              for (const item of order.orderItems) {
                  await Product.findByIdAndUpdate(item.product, {
                      $inc: { stock: -item.qty }
                  });
              }
              order.isStockDecremented = true; // Mark stock as decremented
          } else {
              error('Stock check failed during status update', { orderId: order._id, error: stockDecrementError });
              return res.status(400).json({
                  status: 'error',
                  message: stockDecrementError
              });
          }
      } else if (['Processing', 'Shipped'].includes(status) && order.isStockDecremented) {
          info('Stock already decremented, status change proceeds', { orderId: order._id, newStatus: status });
      } else if (status === 'Pending Payment' && order.isStockDecremented) {
           // Edge case: Trying to move back to Pending Payment after stock was decremented? Should this be allowed?
           // Might indicate an issue or need for restocking logic if it's a valid scenario.
           console.warn(`Order ${order._id} status changing to Pending Payment, but stock was already decremented.`);
      }
      // --- END: Decrement Stock on Status Change --- 
      
      // Update order status
      order.status = status;
      
      // If status is 'delivered', update isDelivered
      if (status === 'Delivered') {
        order.isDelivered = true;
        order.deliveredAt = Date.now();
        
        // --- เพิ่มแต้มสะสมเมื่อส่งสำเร็จ ---
        const orderUser = await User.findById(order.user);
        if (orderUser) {
          // คำนวณแต้ม: 1 แต้มต่อ 100 บาท
          const pointsEarned = Math.floor(order.totalPrice / 100);
          orderUser.points = (orderUser.points || 0) + pointsEarned;
          await orderUser.save();
          
          // ส่งแจ้งเตือน LINE เมื่อได้รับแต้ม
          if (orderUser?.lineProfile?.lineUserId) {
            lineBotService.pushMessage(orderUser.lineProfile.lineUserId, {
              type: 'flex',
              altText: `🎉 ได้รับ ${pointsEarned} แต้ม!`,
              contents: {
                type: 'bubble',
                body: {
                  type: 'box',
                  layout: 'vertical',
                  contents: [
                    {
                      type: 'text',
                      text: '🎉 ได้รับแต้มสะสม!',
                      weight: 'bold',
                      size: 'lg',
                      color: '#1DB446'
                    },
                    {
                      type: 'text',
                      text: `+${pointsEarned} แต้ม`,
                      size: 'xxl',
                      weight: 'bold',
                      align: 'center',
                      margin: 'lg',
                      color: '#FF6B35'
                    },
                    {
                      type: 'text',
                      text: `แต้มรวม: ${orderUser.points} แต้ม`,
                      size: 'sm',
                      color: '#666666',
                      align: 'center',
                      margin: 'md'
                    }
                  ]
                }
              }
            });
          }
        }
      }
      
      // --- ส่งแจ้งเตือน LINE เมื่อสถานะเปลี่ยน ---
      const orderOwner = await User.findById(order.user);
      if (orderOwner?.lineProfile?.lineUserId) {
        const statusEmoji = {
          'Processing': '📦',
          'Shipped': '🚚',
          'Delivered': '✅',
          'Cancelled': '❌',
          'Refunded': '💰'
        };
        const statusText = {
          'Processing': 'กำลังเตรียมสินค้า',
          'Shipped': 'จัดส่งแล้ว',
          'Delivered': 'จัดส่งสำเร็จ',
          'Cancelled': 'ยกเลิกแล้ว',
          'Refunded': 'คืนเงินแล้ว'
        };
        
        if (statusEmoji[status]) {
          lineBotService.pushMessage(orderOwner.lineProfile.lineUserId, {
            type: 'flex',
            altText: `${statusEmoji[status]} อัพเดทสถานะคำสั่งซื้อ`,
            contents: {
              type: 'bubble',
              body: {
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'text',
                    text: `${statusEmoji[status]} อัพเดทสถานะ`,
                    weight: 'bold',
                    size: 'lg'
                  },
                  {
                    type: 'text',
                    text: `#${order._id.toString().slice(-8).toUpperCase()}`,
                    size: 'sm',
                    color: '#666666',
                    margin: 'sm'
                  },
                  {
                    type: 'separator',
                    margin: 'lg'
                  },
                  {
                    type: 'text',
                    text: statusText[status] || status,
                    size: 'xl',
                    weight: 'bold',
                    align: 'center',
                    margin: 'lg',
                    color: status === 'Cancelled' ? '#FF0000' : '#1DB446'
                  },
                  ...(order.shippingInfo?.trackingNumber ? [{
                    type: 'text',
                    text: `เลขพัสดุ: ${order.shippingInfo.trackingNumber}`,
                    size: 'sm',
                    color: '#666666',
                    margin: 'md',
                    align: 'center'
                  }] : [])
                ]
              },
              footer: {
                type: 'box',
                layout: 'vertical',
                contents: [
                  {
                    type: 'button',
                    action: {
                      type: 'uri',
                      label: 'ดูรายละเอียด',
                      uri: `https://liff.line.me/${process.env.LIFF_ID}`
                    },
                    style: 'primary',
                    color: '#1DB446'
                  }
                ]
              }
            }
          });
        }
      }

      // If status is 'cancelled', restock products (if not already restocked and stock was decremented)
      if (status === 'Cancelled' && order.isStockDecremented && !order.isRestocked) {
        info('Restocking products for cancelled order', { orderId: order._id });
        for (const item of order.orderItems) {
          await Product.findByIdAndUpdate(item.product, {
             $inc: { stock: item.qty } // Use $inc for restock
          });
        }
        order.isRestocked = true; // Mark as restocked
        order.isStockDecremented = false; // Reset decrement flag after restocking?
      } else if (status === 'Cancelled' && !order.isStockDecremented) {
          info('Order cancelled before stock decrement, no restocking needed', { orderId: order._id });
          order.isRestocked = false; // Ensure isRestocked remains false
      }
      
      const updatedOrder = await order.save(); // Save all changes
      
      res.status(200).json({
        status: 'success',
        message: 'อัปเดตสถานะคำสั่งซื้อเรียบร้อยแล้ว',
        data: updatedOrder
      });
    } catch (err) {
      error('Error updating order status', { error: err.message });
      res.status(500).json({
        status: 'error',
        message: 'เกิดข้อผิดพลาดในการอัปเดตสถานะคำสั่งซื้อ',
        error: process.env.NODE_ENV === 'production' ? undefined : err.message
      });
    }
  });
};

/**
 * @desc    Update order shipping (admin)
 * @route   PUT /api/shop/orders/:id/shipping
 * @access  Private/Admin
 */
exports.updateOrderShipping = async (req, res) => {
  await withSpan('controllers.order.updateOrderShipping', async () => {
    try {
      const { trackingNumber, carrier } = req.body;
      
      if (!trackingNumber || !carrier) {
        return res.status(400).json({
          status: 'error',
          message: 'กรุณาระบุเลขพัสดุและผู้ให้บริการขนส่ง'
        });
      }
      
      const order = await Order.findById(req.params.id);
      
      if (!order) {
        return res.status(404).json({
          status: 'error',
          message: 'ไม่พบคำสั่งซื้อ'
        });
      }
      
      // Update shipping info
      order.shippingInfo = {
        trackingNumber,
        carrier,
        shippedAt: Date.now()
      };
      
      // Update order status to 'shipped'
      order.status = 'shipped';
      
      const updatedOrder = await order.save();
      
      res.status(200).json({
        status: 'success',
        message: 'อัปเดตข้อมูลการจัดส่งเรียบร้อยแล้ว',
        data: updatedOrder
      });
    } catch (err) {
      error('Error updating order shipping', { error: err.message });
      res.status(500).json({
        status: 'error',
        message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลการจัดส่ง',
        error: process.env.NODE_ENV === 'production' ? undefined : err.message
      });
    }
  });
}; 
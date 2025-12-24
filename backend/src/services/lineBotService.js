const axios = require('axios');
const crypto = require('crypto');
const { info, error } = require('../utils/logger');

const LINE_MESSAGING_API = 'https://api.line.me/v2/bot';

/**
 * ตรวจสอบ signature จาก LINE Webhook
 * @param {string} body - Request body as string
 * @param {string} signature - X-Line-Signature header
 * @returns {boolean}
 */
exports.verifySignature = (body, signature) => {
  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  const hash = crypto
    .createHmac('SHA256', channelSecret)
    .update(body)
    .digest('base64');
  return hash === signature;
};

/**
 * ส่งข้อความตอบกลับ (Reply)
 * @param {string} replyToken - Reply token จาก webhook event
 * @param {Array} messages - Array of message objects
 */
exports.replyMessage = async (replyToken, messages) => {
  try {
    const response = await axios.post(
      `${LINE_MESSAGING_API}/message/reply`,
      {
        replyToken,
        messages: Array.isArray(messages) ? messages : [messages]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
        }
      }
    );
    
    info('Reply message sent successfully');
    return { success: true, data: response.data };
  } catch (err) {
    error('Failed to send reply message', { error: err.message });
    return { success: false, error: err.message };
  }
};

/**
 * ส่งข้อความ Push ไปหาผู้ใช้
 * @param {string} userId - LINE User ID
 * @param {Array} messages - Array of message objects
 */
exports.pushMessage = async (userId, messages) => {
  try {
    const response = await axios.post(
      `${LINE_MESSAGING_API}/message/push`,
      {
        to: userId,
        messages: Array.isArray(messages) ? messages : [messages]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
        }
      }
    );
    
    info(`Push message sent to ${userId}`);
    return { success: true, data: response.data };
  } catch (err) {
    error(`Failed to push message to ${userId}`, { error: err.message });
    return { success: false, error: err.message };
  }
};

/**
 * ส่งข้อความ Multicast ไปหาหลายคน
 * @param {Array} userIds - Array of LINE User IDs
 * @param {Array} messages - Array of message objects
 */
exports.multicastMessage = async (userIds, messages) => {
  try {
    const response = await axios.post(
      `${LINE_MESSAGING_API}/message/multicast`,
      {
        to: userIds,
        messages: Array.isArray(messages) ? messages : [messages]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
        }
      }
    );
    
    info(`Multicast message sent to ${userIds.length} users`);
    return { success: true, data: response.data };
  } catch (err) {
    error('Failed to send multicast message', { error: err.message });
    return { success: false, error: err.message };
  }
};

/**
 * ส่งข้อความ Broadcast ไปหาทุกคนที่ add friend
 * @param {Array} messages - Array of message objects
 */
exports.broadcastMessage = async (messages) => {
  try {
    const response = await axios.post(
      `${LINE_MESSAGING_API}/message/broadcast`,
      {
        messages: Array.isArray(messages) ? messages : [messages]
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
        }
      }
    );
    
    info('Broadcast message sent');
    return { success: true, data: response.data };
  } catch (err) {
    error('Failed to send broadcast message', { error: err.message });
    return { success: false, error: err.message };
  }
};

/**
 * ดึงข้อมูลโปรไฟล์ผู้ใช้
 * @param {string} userId - LINE User ID
 */
exports.getProfile = async (userId) => {
  try {
    const response = await axios.get(
      `${LINE_MESSAGING_API}/profile/${userId}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
        }
      }
    );
    
    return { success: true, profile: response.data };
  } catch (err) {
    error(`Failed to get profile for ${userId}`, { error: err.message });
    return { success: false, error: err.message };
  }
};

/**
 * สร้าง Text Message Object
 * @param {string} text - ข้อความ
 */
exports.createTextMessage = (text) => ({
  type: 'text',
  text
});

/**
 * สร้าง Flex Message Object สำหรับแจ้งเตือนออเดอร์
 * @param {Object} order - Order data
 */
exports.createOrderNotificationFlex = (order) => ({
  type: 'flex',
  altText: `คำสั่งซื้อ #${order.orderNumber}`,
  contents: {
    type: 'bubble',
    hero: {
      type: 'image',
      url: 'https://yourdomain.com/assets/img/order-confirmation.png',
      size: 'full',
      aspectRatio: '20:13',
      aspectMode: 'cover'
    },
    body: {
      type: 'box',
      layout: 'vertical',
      contents: [
        {
          type: 'text',
          text: '🛒 ยืนยันคำสั่งซื้อ',
          weight: 'bold',
          size: 'xl',
          color: '#1DB446'
        },
        {
          type: 'text',
          text: `หมายเลขคำสั่งซื้อ: ${order.orderNumber}`,
          size: 'sm',
          color: '#666666',
          margin: 'md'
        },
        {
          type: 'separator',
          margin: 'lg'
        },
        {
          type: 'box',
          layout: 'vertical',
          margin: 'lg',
          contents: order.items.slice(0, 3).map(item => ({
            type: 'box',
            layout: 'horizontal',
            contents: [
              {
                type: 'text',
                text: item.name,
                size: 'sm',
                color: '#555555',
                flex: 3
              },
              {
                type: 'text',
                text: `x${item.quantity}`,
                size: 'sm',
                color: '#111111',
                align: 'end',
                flex: 1
              }
            ]
          }))
        },
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
              size: 'sm',
              color: '#555555',
              weight: 'bold'
            },
            {
              type: 'text',
              text: `฿${order.total.toLocaleString()}`,
              size: 'sm',
              color: '#1DB446',
              align: 'end',
              weight: 'bold'
            }
          ]
        }
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
            uri: `https://yourdomain.com/order/${order.orderNumber}`
          },
          style: 'primary',
          color: '#1DB446'
        }
      ]
    }
  }
});

/**
 * สร้าง Rich Menu
 * @param {Object} menuData - Menu configuration
 */
exports.createRichMenu = async (menuData) => {
  try {
    const response = await axios.post(
      `${LINE_MESSAGING_API}/richmenu`,
      menuData,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`
        }
      }
    );
    
    info('Rich menu created', { richMenuId: response.data.richMenuId });
    return { success: true, richMenuId: response.data.richMenuId };
  } catch (err) {
    error('Failed to create rich menu', { error: err.message });
    return { success: false, error: err.message };
  }
};

/**
 * ส่งข้อความต้อนรับสมาชิกใหม่
 * @param {string} userId - LINE User ID
 * @param {string} displayName - User's display name
 */
exports.sendWelcomeMessage = async (userId, displayName) => {
  const messages = [
    {
      type: 'text',
      text: `สวัสดีค่ะ คุณ ${displayName} 🎉\n\nยินดีต้อนรับสู่ TANYARAT Shop!\nขอบคุณที่เป็นสมาชิกกับเรานะคะ`
    },
    {
      type: 'flex',
      altText: 'เมนูหลัก',
      contents: {
        type: 'bubble',
        body: {
          type: 'box',
          layout: 'vertical',
          contents: [
            {
              type: 'text',
              text: '🏠 บริการของเรา',
              weight: 'bold',
              size: 'lg'
            },
            {
              type: 'text',
              text: 'เลือกเมนูที่ต้องการได้เลยค่ะ',
              size: 'sm',
              color: '#666666',
              margin: 'md'
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
                label: '🛍️ ดูสินค้า',
                uri: 'https://yourdomain.com/shop.html'
              },
              style: 'primary'
            },
            {
              type: 'button',
              action: {
                type: 'uri',
                label: '👤 บัญชีของฉัน',
                uri: `https://liff.line.me/${process.env.LIFF_ID}`
              },
              style: 'secondary'
            },
            {
              type: 'button',
              action: {
                type: 'uri',
                label: '📞 ติดต่อเรา',
                uri: 'https://yourdomain.com/contacts.html'
              },
              style: 'secondary'
            }
          ]
        }
      }
    }
  ];
  
  return await exports.pushMessage(userId, messages);
};

/**
 * ส่งข้อความแจ้งสถานะออเดอร์
 * @param {string} userId - LINE User ID
 * @param {Object} order - Order data
 * @param {string} status - Order status
 */
exports.sendOrderStatusUpdate = async (userId, order, status) => {
  const statusMessages = {
    'pending': '⏳ รอการยืนยัน',
    'confirmed': '✅ ยืนยันแล้ว',
    'processing': '📦 กำลังเตรียมสินค้า',
    'shipped': '🚚 จัดส่งแล้ว',
    'delivered': '✨ จัดส่งสำเร็จ',
    'cancelled': '❌ ยกเลิก'
  };
  
  const message = {
    type: 'flex',
    altText: `อัพเดทสถานะคำสั่งซื้อ #${order.orderNumber}`,
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '📋 อัพเดทสถานะ',
            weight: 'bold',
            size: 'lg',
            color: '#1DB446'
          },
          {
            type: 'text',
            text: `คำสั่งซื้อ #${order.orderNumber}`,
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
            text: statusMessages[status] || status,
            size: 'xl',
            weight: 'bold',
            align: 'center',
            margin: 'lg'
          }
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
              uri: `https://yourdomain.com/order/${order.orderNumber}`
            },
            style: 'primary',
            color: '#1DB446'
          }
        ]
      }
    }
  };
  
  return await exports.pushMessage(userId, message);
};


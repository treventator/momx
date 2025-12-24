const express = require('express');
const router = express.Router();
const User = require('../models/User');
const lineBotService = require('../services/lineBotService');
const { info, error } = require('../utils/logger');

/**
 * LINE Webhook Handler
 * @route POST /api/webhooks/line
 * @access Public (verified by LINE signature)
 */
router.post('/line', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // Get signature from header
    const signature = req.headers['x-line-signature'];
    
    // Verify signature
    const body = req.body.toString();
    if (!lineBotService.verifySignature(body, signature)) {
      error('Invalid LINE webhook signature');
      return res.status(401).json({ message: 'Invalid signature' });
    }
    
    // Parse body
    const webhookData = JSON.parse(body);
    const events = webhookData.events || [];
    
    info(`Received ${events.length} LINE webhook events`);
    
    // Process each event
    for (const event of events) {
      await handleLineEvent(event);
    }
    
    // Always return 200 to LINE
    res.status(200).json({ success: true });
  } catch (err) {
    error('LINE webhook error', { error: err.message });
    // Still return 200 to prevent LINE from retrying
    res.status(200).json({ success: false });
  }
});

/**
 * Handle LINE events
 * @param {Object} event - LINE webhook event
 */
async function handleLineEvent(event) {
  const { type, source, replyToken, message } = event;
  const userId = source?.userId;
  
  info(`Processing LINE event: ${type}`, { userId });
  
  switch (type) {
    case 'follow':
      // ผู้ใช้ add friend หรือ unblock
      await handleFollowEvent(userId, replyToken);
      break;
      
    case 'unfollow':
      // ผู้ใช้ block bot
      await handleUnfollowEvent(userId);
      break;
      
    case 'message':
      // ผู้ใช้ส่งข้อความ
      await handleMessageEvent(userId, message, replyToken);
      break;
      
    case 'postback':
      // ผู้ใช้กดปุ่มใน Flex Message
      await handlePostbackEvent(userId, event.postback, replyToken);
      break;
      
    default:
      info(`Unhandled event type: ${type}`);
  }
}

/**
 * Handle follow event (user adds friend)
 */
async function handleFollowEvent(userId, replyToken) {
  try {
    // Get user profile from LINE
    const profileResult = await lineBotService.getProfile(userId);
    
    if (!profileResult.success) {
      error('Failed to get LINE profile on follow', { userId });
      return;
    }
    
    const { displayName, pictureUrl, statusMessage } = profileResult.profile;
    
    // Check if user already exists
    let user = await User.findOne({ 'lineProfile.lineUserId': userId });
    
    if (!user) {
      // Create new user
      user = await User.create({
        lineProfile: {
          lineUserId: userId,
          displayName,
          pictureUrl,
          statusMessage
        },
        authProvider: 'line',
        firstName: displayName,
        isActive: true
      });
      
      info(`New user registered via follow: ${userId}`, { displayName });
    } else {
      // Update profile
      user.lineProfile.displayName = displayName;
      user.lineProfile.pictureUrl = pictureUrl;
      user.lineProfile.statusMessage = statusMessage;
      user.isActive = true;
      await user.save();
      
      info(`Existing user followed again: ${userId}`);
    }
    
    // Send welcome message
    await lineBotService.sendWelcomeMessage(userId, displayName);
    
  } catch (err) {
    error('Error handling follow event', { error: err.message, userId });
  }
}

/**
 * Handle unfollow event (user blocks bot)
 */
async function handleUnfollowEvent(userId) {
  try {
    // Optional: Mark user as inactive
    await User.findOneAndUpdate(
      { 'lineProfile.lineUserId': userId },
      { isActive: false }
    );
    
    info(`User unfollowed: ${userId}`);
  } catch (err) {
    error('Error handling unfollow event', { error: err.message, userId });
  }
}

/**
 * Handle message event
 */
async function handleMessageEvent(userId, message, replyToken) {
  try {
    const { type, text } = message;
    
    if (type !== 'text') {
      // Reply for non-text messages
      await lineBotService.replyMessage(replyToken, {
        type: 'text',
        text: 'ขออภัยค่ะ ระบบรองรับเฉพาะข้อความตัวอักษรเท่านั้น'
      });
      return;
    }
    
    // Process text commands
    const lowerText = text.toLowerCase().trim();
    
    // Command handlers
    if (lowerText === 'สินค้า' || lowerText === 'shop') {
      await replyShopMenu(replyToken);
    } else if (lowerText === 'ติดต่อ' || lowerText === 'contact') {
      await replyContactInfo(replyToken);
    } else if (lowerText === 'บัญชี' || lowerText === 'account') {
      await replyAccountMenu(replyToken, userId);
    } else if (lowerText === 'ออเดอร์' || lowerText === 'order' || lowerText === 'คำสั่งซื้อ') {
      await replyOrderStatus(replyToken, userId);
    } else if (lowerText === 'help' || lowerText === 'ช่วยเหลือ' || lowerText === 'เมนู') {
      await replyHelpMenu(replyToken);
    } else {
      // Default reply
      await lineBotService.replyMessage(replyToken, {
        type: 'text',
        text: `ขอบคุณสำหรับข้อความค่ะ 😊\n\nพิมพ์ "เมนู" เพื่อดูคำสั่งที่ใช้ได้\nหรือเข้าสู่ระบบผ่าน LIFF เพื่อใช้งานเต็มรูปแบบค่ะ`
      });
    }
  } catch (err) {
    error('Error handling message event', { error: err.message, userId });
  }
}

/**
 * Handle postback event
 */
async function handlePostbackEvent(userId, postback, replyToken) {
  try {
    const data = postback.data;
    const params = new URLSearchParams(data);
    const action = params.get('action');
    
    info(`Postback action: ${action}`, { userId });
    
    switch (action) {
      case 'view_orders':
        await replyOrderStatus(replyToken, userId);
        break;
      case 'contact':
        await replyContactInfo(replyToken);
        break;
      default:
        info(`Unhandled postback action: ${action}`);
    }
  } catch (err) {
    error('Error handling postback event', { error: err.message, userId });
  }
}

/**
 * Reply with shop menu
 */
async function replyShopMenu(replyToken) {
  const message = {
    type: 'flex',
    altText: 'เมนูสินค้า',
    contents: {
      type: 'bubble',
      hero: {
        type: 'image',
        url: 'https://yourdomain.com/assets/img/shop-banner.jpg',
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
            text: '🛍️ TANYARAT Shop',
            weight: 'bold',
            size: 'xl'
          },
          {
            type: 'text',
            text: 'ผลิตภัณฑ์ดูแลสุขภาพและความงาม',
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
              label: 'เข้าสู่ร้านค้า',
              uri: 'https://yourdomain.com/shop.html'
            },
            style: 'primary'
          },
          {
            type: 'button',
            action: {
              type: 'uri',
              label: 'สินค้าขายดี',
              uri: 'https://yourdomain.com/shop.html?sort=popular'
            },
            style: 'secondary'
          }
        ]
      }
    }
  };
  
  await lineBotService.replyMessage(replyToken, message);
}

/**
 * Reply with contact info
 */
async function replyContactInfo(replyToken) {
  const message = {
    type: 'flex',
    altText: 'ติดต่อเรา',
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '📞 ติดต่อเรา',
            weight: 'bold',
            size: 'xl'
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
            contents: [
              {
                type: 'text',
                text: '📍 ที่อยู่',
                weight: 'bold',
                size: 'sm'
              },
              {
                type: 'text',
                text: '114 หมู่ 8 ต.ค่ายบกหวาน\nอ.เมือง จ.หนองคาย 43100',
                size: 'sm',
                color: '#666666',
                wrap: true
              },
              {
                type: 'text',
                text: '📱 โทรศัพท์',
                weight: 'bold',
                size: 'sm',
                margin: 'md'
              },
              {
                type: 'text',
                text: '091-898-1595',
                size: 'sm',
                color: '#666666'
              },
              {
                type: 'text',
                text: '💬 LINE ID',
                weight: 'bold',
                size: 'sm',
                margin: 'md'
              },
              {
                type: 'text',
                text: 'kaii8-114',
                size: 'sm',
                color: '#666666'
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
              label: 'โทรหาเรา',
              uri: 'tel:0918981595'
            },
            style: 'primary'
          }
        ]
      }
    }
  };
  
  await lineBotService.replyMessage(replyToken, message);
}

/**
 * Reply with account menu
 */
async function replyAccountMenu(replyToken, userId) {
  const message = {
    type: 'flex',
    altText: 'บัญชีของฉัน',
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '👤 บัญชีของฉัน',
            weight: 'bold',
            size: 'xl'
          },
          {
            type: 'text',
            text: 'จัดการข้อมูลส่วนตัวและคำสั่งซื้อ',
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
              label: 'เข้าสู่บัญชี',
              uri: `https://liff.line.me/${process.env.LIFF_ID}`
            },
            style: 'primary'
          },
          {
            type: 'button',
            action: {
              type: 'postback',
              label: 'ดูคำสั่งซื้อ',
              data: 'action=view_orders'
            },
            style: 'secondary'
          }
        ]
      }
    }
  };
  
  await lineBotService.replyMessage(replyToken, message);
}

/**
 * Reply with order status
 */
async function replyOrderStatus(replyToken, userId) {
  try {
    // Find user's orders (implement your order lookup logic)
    const user = await User.findOne({ 'lineProfile.lineUserId': userId });
    
    if (!user) {
      await lineBotService.replyMessage(replyToken, {
        type: 'text',
        text: 'กรุณาเข้าสู่ระบบผ่าน LIFF ก่อนค่ะ'
      });
      return;
    }
    
    // TODO: Implement actual order lookup
    await lineBotService.replyMessage(replyToken, {
      type: 'text',
      text: `📦 คำสั่งซื้อของคุณ\n\nกรุณาเข้าสู่ระบบผ่าน LIFF เพื่อดูรายละเอียดคำสั่งซื้อทั้งหมดค่ะ`
    });
  } catch (err) {
    error('Error getting order status', { error: err.message });
    await lineBotService.replyMessage(replyToken, {
      type: 'text',
      text: 'ขออภัยค่ะ เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง'
    });
  }
}

/**
 * Reply with help menu
 */
async function replyHelpMenu(replyToken) {
  const message = {
    type: 'flex',
    altText: 'เมนูช่วยเหลือ',
    contents: {
      type: 'bubble',
      body: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '📋 คำสั่งที่ใช้ได้',
            weight: 'bold',
            size: 'xl'
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
            contents: [
              {
                type: 'text',
                text: '🛍️ "สินค้า" - ดูสินค้าทั้งหมด',
                size: 'sm'
              },
              {
                type: 'text',
                text: '👤 "บัญชี" - จัดการบัญชีของฉัน',
                size: 'sm'
              },
              {
                type: 'text',
                text: '📦 "ออเดอร์" - ดูสถานะคำสั่งซื้อ',
                size: 'sm'
              },
              {
                type: 'text',
                text: '📞 "ติดต่อ" - ข้อมูลติดต่อร้าน',
                size: 'sm'
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
              label: 'เข้าสู่เว็บไซต์',
              uri: 'https://yourdomain.com'
            },
            style: 'primary'
          }
        ]
      }
    }
  };
  
  await lineBotService.replyMessage(replyToken, message);
}

module.exports = router;

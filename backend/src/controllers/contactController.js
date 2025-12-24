const Contact = require('../models/Contact');
const webhookService = require('../services/webhookService');

/**
 * @desc    สร้างข้อมูลการติดต่อใหม่จากลูกค้า
 * @route   POST /api/contact
 * @access  Public
 */
exports.createContact = async (req, res) => {
  try {
    const { name, lineId, message } = req.body;
    
    // ตรวจสอบข้อมูลที่จำเป็น
    if (!name || !lineId || !message) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน'
      });
    }
    
    // สร้างข้อมูลการติดต่อใหม่
    const contact = await Contact.create({
      name,
      lineId,
      message
    });

    // ส่ง Webhook แจ้งเตือน (ถ้ามี webhook URL ใน config)
    const webhookUrl = process.env.WEBHOOK_URL;
    if (webhookUrl) {
      const notificationData = {
        type: 'new_contact',
        contact: {
          id: contact._id,
          name: contact.name,
          lineId: contact.lineId,
          message: contact.message.substring(0, 100) + (contact.message.length > 100 ? '...' : ''),
          createdAt: contact.createdAt
        }
      };
      
      webhookService.sendWebhookNotification(webhookUrl, notificationData)
        .catch(error => console.error('Failed to send webhook notification:', error));
    }
    
    // ส่ง Line Notify แจ้งเตือน Admin (ถ้ามี LINE_NOTIFY_TOKEN ใน config)
    const lineNotifyToken = process.env.LINE_NOTIFY_TOKEN;
    if (lineNotifyToken) {
      const notifyMessage = `
มีข้อความติดต่อใหม่!
ชื่อ: ${name}
Line ID: ${lineId}
ข้อความ: ${message.substring(0, 100) + (message.length > 100 ? '...' : '')}
      `;
      
      webhookService.sendLineNotify(lineNotifyToken, notifyMessage)
        .catch(error => console.error('Failed to send Line notification:', error));
    }
    
    res.status(201).json({
      success: true,
      message: 'ส่งข้อความติดต่อเรียบร้อยแล้ว เราจะรีบติดต่อกลับโดยเร็วที่สุด',
      contact
    });
  } catch (error) {
    console.error('Error in createContact:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการส่งข้อความติดต่อ',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
};

/**
 * @desc    ดึงข้อมูลการติดต่อทั้งหมด (สำหรับ Admin)
 * @route   GET /api/contact
 * @access  Private/Admin
 */
exports.getContacts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // อาจมีการกรองตาม status หรือ isRead
    const filter = {};
    if (req.query.status) {
      filter.status = req.query.status;
    }
    if (req.query.isRead !== undefined) {
      filter.isRead = req.query.isRead === 'true';
    }
    
    const contacts = await Contact.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
      
    const total = await Contact.countDocuments(filter);
    
    res.status(200).json({
      success: true,
      count: contacts.length,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      contacts
    });
  } catch (error) {
    console.error('Error in getContacts:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการติดต่อ',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
};

/**
 * @desc    ดึงข้อมูลการติดต่อโดย ID (สำหรับ Admin)
 * @route   GET /api/contact/:id
 * @access  Private/Admin
 */
exports.getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลการติดต่อที่ต้องการ'
      });
    }
    
    res.status(200).json({
      success: true,
      contact
    });
  } catch (error) {
    console.error('Error in getContactById:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการดึงข้อมูลการติดต่อ',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
};

/**
 * @desc    อัปเดตข้อมูลการติดต่อ (สำหรับ Admin)
 * @route   PUT /api/contact/:id
 * @access  Private/Admin
 */
exports.updateContact = async (req, res) => {
  try {
    const { status, adminNotes } = req.body;
    
    // ค้นหาข้อมูลการติดต่อที่ต้องการอัปเดต
    let contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลการติดต่อที่ต้องการอัปเดต'
      });
    }
    
    // อัปเดตข้อมูล
    if (status) contact.status = status;
    if (adminNotes !== undefined) contact.adminNotes = adminNotes;
    
    // บันทึกการเปลี่ยนแปลง
    contact = await contact.save();
    
    res.status(200).json({
      success: true,
      message: 'อัปเดตข้อมูลการติดต่อเรียบร้อยแล้ว',
      contact
    });
  } catch (error) {
    console.error('Error in updateContact:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูลการติดต่อ',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
};

/**
 * @desc    มาร์คข้อความติดต่อว่าอ่านแล้ว
 * @route   PUT /api/contact/:id/read
 * @access  Private/Admin
 */
exports.markAsRead = async (req, res) => {
  try {
    // ค้นหาข้อมูลการติดต่อที่ต้องการอัปเดต
    let contact = await Contact.findById(req.params.id);
    
    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'ไม่พบข้อมูลการติดต่อที่ต้องการอัปเดต'
      });
    }
    
    // อัปเดตสถานะการอ่าน
    contact.isRead = true;
    
    // บันทึกการเปลี่ยนแปลง
    contact = await contact.save();
    
    res.status(200).json({
      success: true,
      message: 'มาร์คว่าอ่านแล้วเรียบร้อย',
      contact
    });
  } catch (error) {
    console.error('Error in markAsRead:', error);
    res.status(500).json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการอัปเดตสถานะการอ่าน',
      error: process.env.NODE_ENV === 'production' ? {} : error.message
    });
  }
}; 
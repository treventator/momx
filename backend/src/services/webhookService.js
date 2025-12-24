const axios = require('axios');

/**
 * ส่ง webhook notification ไปยัง endpoint ที่กำหนด
 * @param {string} webhookUrl - URL ของ webhook (เช่น LINE Notify, Discord, Slack)
 * @param {Object} data - ข้อมูลที่จะส่ง
 * @returns {Promise<Object>} - ผลลัพธ์การส่ง webhook
 */
exports.sendWebhookNotification = async (webhookUrl, data) => {
  try {
    // สำหรับ webhook ต่างๆ อาจต้องปรับ format ของ payload
    // ตัวอย่างนี้เป็นการส่ง generic JSON payload
    const response = await axios.post(webhookUrl, data);
    
    console.log(`Webhook sent successfully: ${response.status}`);
    return {
      success: true,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    console.error('Error sending webhook notification:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * ส่งข้อความแจ้งเตือนผ่าน Line Notify
 * @param {string} token - Line Notify Token
 * @param {string} message - ข้อความที่จะส่ง
 * @returns {Promise<Object>} - ผลลัพธ์การส่ง Line Notify
 */
exports.sendLineNotify = async (token, message) => {
  try {
    const response = await axios.post(
      'https://notify-api.line.me/api/notify',
      `message=${encodeURIComponent(message)}`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    console.log(`Line Notify sent successfully: ${response.status}`);
    return {
      success: true,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    console.error('Error sending Line Notify:', error);
    return {
      success: false,
      error: error.message
    };
  }
}; 
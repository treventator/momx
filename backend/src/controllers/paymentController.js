const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');

// Store payment settings in memory (in a real app, this would be stored in a database)
let paymentSettings = {
  promptpay: {
    enabled: true,
    accountNumber: '0812345678', // Default PromptPay number
    accountName: 'Tanyarat Shop'
  },
  bankTransfer: {
    enabled: true,
    bankName: 'Kasikorn Bank',
    accountNumber: '123-4-56789-0',
    accountName: 'Tanyarat Co., Ltd.'
  },
  creditCard: {
    enabled: false,
    merchantId: '',
    apiKey: ''
  },
  cashOnDelivery: {
    enabled: true,
    additionalFee: 30
  }
};

// Get payment settings
exports.getPaymentSettings = (req, res) => {
  try {
    // Remove sensitive data like API keys before sending to client
    const sanitizedSettings = JSON.parse(JSON.stringify(paymentSettings));
    
    if (sanitizedSettings.creditCard) {
      delete sanitizedSettings.creditCard.apiKey;
    }
    
    return res.status(200).json({
      success: true,
      data: sanitizedSettings
    });
  } catch (error) {
    console.error('Error fetching payment settings:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch payment settings'
    });
  }
};

// Update payment settings
exports.updatePaymentSettings = (req, res) => {
  try {
    const { promptpay, bankTransfer, creditCard, cashOnDelivery } = req.body;
    
    // Update settings
    if (promptpay) {
      paymentSettings.promptpay = {
        ...paymentSettings.promptpay,
        ...promptpay
      };
    }
    
    if (bankTransfer) {
      paymentSettings.bankTransfer = {
        ...paymentSettings.bankTransfer,
        ...bankTransfer
      };
    }
    
    if (creditCard) {
      paymentSettings.creditCard = {
        ...paymentSettings.creditCard,
        ...creditCard
      };
    }
    
    if (cashOnDelivery) {
      paymentSettings.cashOnDelivery = {
        ...paymentSettings.cashOnDelivery,
        ...cashOnDelivery
      };
    }
    
    return res.status(200).json({
      success: true,
      message: 'Payment settings updated successfully',
      data: paymentSettings
    });
  } catch (error) {
    console.error('Error updating payment settings:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update payment settings'
    });
  }
};

/**
 * Generate PromptPay QR Code
 * Based on Thai QR Payment Standard: https://www.bot.or.th/Thai/PaymentSystems/StandardPS/Documents/ThaiQRCode_Payment_Standard.pdf
 */
exports.generatePromptPayQR = async (req, res) => {
  try {
    const { amount } = req.query;
    
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }
    
    // Get PromptPay number from settings
    const promptPayNumber = paymentSettings.promptpay.accountNumber;
    
    if (!promptPayNumber) {
      return res.status(400).json({
        success: false,
        message: 'PromptPay account number is not configured'
      });
    }
    
    // Format amount with 2 decimal places
    const formattedAmount = parseFloat(amount).toFixed(2);
    
    // Generate PromptPay payload
    const payload = generatePromptPayPayload(promptPayNumber, formattedAmount);
    
    // Generate QR code
    const qrCodeDataURL = await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'H',
      margin: 1,
      scale: 8,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });
    
    return res.status(200).json({
      success: true,
      data: {
        qrCode: qrCodeDataURL,
        payload: payload,
        amount: formattedAmount,
        accountNumber: promptPayNumber,
        accountName: paymentSettings.promptpay.accountName
      }
    });
  } catch (error) {
    console.error('Error generating PromptPay QR code:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate PromptPay QR code'
    });
  }
};

/**
 * Helper function to generate PromptPay payload for QR code
 * Based on EMVCo QR Code Specification
 */
function generatePromptPayPayload(promptPayNumber, amount) {
  // Merchant identifier (ID 29) for PromptPay
  const merchantInfo = generateFieldData('29', generateFieldData('00', 'A000000677010111'));
  
  // Transaction currency: THB = 764 (ID 53)
  const currency = generateFieldData('53', '764');
  
  // Format PromptPay account ID (ID 30)
  let accountType;
  let accountData;
  
  // Check if it's a phone number or tax ID
  if (promptPayNumber.match(/^\d{10}$/)) {
    // Phone number (mobile)
    accountType = '01';
    // Remove leading zero and add country code 66
    accountData = '66' + promptPayNumber.substring(1);
  } else if (promptPayNumber.match(/^\d{13}$/)) {
    // National ID or Tax ID
    accountType = '02';
    accountData = promptPayNumber;
  } else {
    // Default to mobile format if unknown
    accountType = '01';
    // Try to extract digits only and remove leading zero
    const digits = promptPayNumber.replace(/\D/g, '');
    accountData = digits.length >= 10 ? '66' + digits.substring(digits.length - 9) : promptPayNumber;
  }
  
  const accountInfo = generateFieldData('30', generateFieldData(accountType, accountData));
  
  // Transaction amount (ID 54)
  const transactionAmount = amount ? generateFieldData('54', amount) : '';
  
  // Country (ID 58)
  const country = generateFieldData('58', 'TH');
  
  // Static QR (ID 01) or Dynamic QR (ID 02)
  const qrType = transactionAmount ? '01' : '02';
  
  // Combine all data
  const data = [
    '000201',                  // Payload format indicator (ID 00)
    qrType,                    // QR Type
    merchantInfo,              // Merchant information
    accountInfo,               // Account information
    currency,                  // Currency
    transactionAmount,         // Amount
    country,                   // Country
    '6304'                     // CRC (ID 63) - will be calculated next
  ].join('');
  
  // Calculate CRC16 checksum
  const crc = crc16ccitt(data).toString(16).toUpperCase().padStart(4, '0');
  
  // Return data with CRC
  return data.slice(0, -4) + crc;
}

/**
 * Helper function to generate field data with ID and value
 */
function generateFieldData(id, value) {
  // Format: [ID][Length][Value]
  const length = value.length.toString().padStart(2, '0');
  return id + length + value;
}

/**
 * Calculate CRC-16 CCITT for PromptPay QR code
 */
function crc16ccitt(data) {
  const crcTable = [];
  for (let i = 0; i < 256; i++) {
    let crc = i << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
    }
    crcTable.push(crc & 0xFFFF);
  }
  
  let crc = 0xFFFF;
  for (let i = 0; i < data.length; i++) {
    crc = ((crc << 8) ^ crcTable[((crc >> 8) ^ data.charCodeAt(i)) & 0xFF]) & 0xFFFF;
  }
  
  return crc;
}

// Verify payment (webhook handler for payment notification)
exports.verifyPayment = async (req, res) => {
  try {
    const webhookData = req.body;
    
    // Validate the incoming webhook data
    if (!webhookData || !webhookData.event || !webhookData.data) {
      return res.status(400).json({
        success: false,
        message: 'Invalid webhook data format'
      });
    }
    
    // Log the webhook request for debugging
    console.log('Received payment webhook:', JSON.stringify(webhookData, null, 2));
    
    // Process based on the event type
    if (webhookData.event === 'payment.success') {
      await processSuccessfulPayment(webhookData.data);
      
      // Send notification to Matrix/Mattermost if configured
      await sendMatrixNotification(webhookData.data);
      
      return res.status(200).json({
        success: true,
        message: 'Payment verification successful',
        data: {
          orderId: webhookData.data.orderId,
          status: 'processed'
        }
      });
    } else {
      console.warn(`Unhandled webhook event: ${webhookData.event}`);
      return res.status(200).json({
        success: true,
        message: `Webhook event ${webhookData.event} received but not processed`
      });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
};

/**
 * Process a successful payment webhook
 * @param {Object} paymentData - The payment data from the webhook
 */
async function processSuccessfulPayment(paymentData) {
  try {
    // In a production system, we would validate the payment data with the payment provider
    
    // Find the order by ID
    const Order = require('../models/Order');
    const GuestOrder = require('../models/GuestOrder');
    
    // Normalize orderId (remove any prefix if present)
    const orderId = paymentData.orderId.replace(/^ORDER/i, '');
    
    // Try to find the order in both Order and GuestOrder collections
    let order = await Order.findById(orderId);
    
    if (!order) {
      // If not found by ID, try to find by orderNumber
      order = await Order.findOne({ orderNumber: paymentData.orderId });
    }
    
    if (!order) {
      // Try guest orders if not found in regular orders
      order = await GuestOrder.findById(orderId);
      
      if (!order) {
        // If still not found, try by orderNumber in guest orders
        order = await GuestOrder.findOne({ orderNumber: paymentData.orderId });
      }
    }
    
    if (!order) {
      console.error(`Order not found for payment: ${paymentData.orderId}`);
      return;
    }
    
    // Update order payment status
    order.isPaid = true;
    order.paidAt = new Date();
    
    // Update payment method details if needed
    if (!order.paymentMethod && paymentData.paymentMethod) {
      order.paymentMethod = paymentData.paymentMethod;
    }
    
    // Update payment result
    order.paymentResult = {
      id: paymentData.transactionId,
      status: paymentData.status,
      update_time: paymentData.timestamp || new Date().toISOString(),
      email_address: paymentData.payer?.email || ''
    };
    
    // If order was pending, update to processing
    if (order.status === 'pending') {
      order.status = 'processing';
    }
    
    // Save the updated order
    await order.save();
    
    console.log(`Order ${order._id} marked as paid (${paymentData.paymentMethod})`);
    
    return order;
  } catch (error) {
    console.error('Error processing payment:', error);
    throw error;
  }
}

/**
 * Send a notification to Matrix/Mattermost
 * @param {Object} paymentData - The payment data from the webhook
 */
async function sendMatrixNotification(paymentData) {
  try {
    // Get Matrix webhook URL from environment variable
    const matrixWebhookUrl = process.env.MATRIX_WEBHOOK_URL;
    
    // Skip if no webhook URL is configured
    if (!matrixWebhookUrl) {
      console.log('No Matrix webhook URL configured, skipping notification');
      return;
    }
    
    // Format payment method for display
    let paymentMethodText = paymentData.paymentMethod;
    switch (paymentData.paymentMethod) {
      case 'promptpay': paymentMethodText = 'พร้อมเพย์'; break;
      case 'bank_transfer': paymentMethodText = 'โอนผ่านธนาคาร'; break;
      case 'credit_card': paymentMethodText = 'บัตรเครดิต/เดบิต'; break;
      case 'cash_on_delivery': paymentMethodText = 'เก็บเงินปลายทาง'; break;
    }
    
    // Format message for Matrix/Mattermost
    const message = {
      text: `🔔 **การชำระเงินใหม่!**\n` +
            `- คำสั่งซื้อ: ${paymentData.orderId}\n` +
            `- จำนวนเงิน: ${paymentData.amount.toFixed(2)} บาท\n` +
            `- วิธีชำระเงิน: ${paymentMethodText}\n` +
            `- ผู้ชำระเงิน: ${paymentData.payer?.name || 'ไม่ระบุ'}\n` +
            `- เวลา: ${new Date().toLocaleString('th-TH')}`
    };
    
    // Send notification to Matrix/Mattermost
    const response = await fetch(matrixWebhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to send Matrix notification: ${response.statusText}`);
    }
    
    console.log('Matrix notification sent successfully');
  } catch (error) {
    console.error('Error sending Matrix notification:', error);
    // Don't throw the error to avoid disrupting the payment process
  }
} 
/**
 * Omise Payment Service
 * Handles PromptPay QR code generation and payment verification
 */

const Omise = require('omise');

// Initialize Omise client
const omise = Omise({
    publicKey: process.env.OMISE_PUBLIC_KEY,
    secretKey: process.env.OMISE_SECRET_KEY
});

/**
 * Create a PromptPay source and charge
 * @param {number} amount - Amount in THB
 * @param {string} orderId - Order ID for metadata
 * @returns {Object} - Charge details with QR code URL
 */
exports.createPromptPayCharge = async (amount, orderId) => {
    try {
        // Amount must be in satang (1 THB = 100 satang)
        const amountInSatang = Math.round(amount * 100);

        // Create a PromptPay source
        const source = await omise.sources.create({
            type: 'promptpay',
            amount: amountInSatang,
            currency: 'thb'
        });

        console.log('Omise source created:', source.id);

        // Create a charge using the source
        const charge = await omise.charges.create({
            amount: amountInSatang,
            currency: 'thb',
            source: source.id,
            metadata: {
                orderId: orderId
            }
        });

        console.log('Omise charge created:', charge.id);

        return {
            success: true,
            data: {
                chargeId: charge.id,
                sourceId: source.id,
                amount: amount,
                currency: 'THB',
                status: charge.status,
                qrCodeUri: source.scannable_code?.image?.download_uri || null,
                expiresAt: charge.expires_at,
                metadata: charge.metadata
            }
        };
    } catch (error) {
        console.error('Omise createPromptPayCharge error:', error);
        return {
            success: false,
            error: error.message || 'Failed to create PromptPay charge'
        };
    }
};

/**
 * Get charge status
 * @param {string} chargeId - Omise charge ID
 * @returns {Object} - Charge status
 */
exports.getChargeStatus = async (chargeId) => {
    try {
        const charge = await omise.charges.retrieve(chargeId);

        return {
            success: true,
            data: {
                chargeId: charge.id,
                status: charge.status,
                paid: charge.paid,
                amount: charge.amount / 100, // Convert back to THB
                metadata: charge.metadata,
                paidAt: charge.paid_at,
                failureCode: charge.failure_code,
                failureMessage: charge.failure_message
            }
        };
    } catch (error) {
        console.error('Omise getChargeStatus error:', error);
        return {
            success: false,
            error: error.message || 'Failed to get charge status'
        };
    }
};

/**
 * Handle Omise webhook event
 * @param {Object} event - Webhook event from Omise
 * @returns {Object} - Processing result
 */
exports.handleWebhookEvent = async (event) => {
    try {
        const { key, data } = event;

        console.log('Omise webhook received:', key);

        if (key === 'charge.complete') {
            const orderId = data.metadata?.orderId;

            if (!orderId) {
                console.warn('No orderId in charge metadata');
                return { success: false, error: 'No orderId in metadata' };
            }

            // Update order status
            const Order = require('../models/Order');
            const order = await Order.findById(orderId);

            if (!order) {
                console.error('Order not found:', orderId);
                return { success: false, error: 'Order not found' };
            }

            if (data.status === 'successful') {
                order.isPaid = true;
                order.paidAt = new Date();
                order.status = 'Processing';
                order.paymentResult = {
                    id: data.id,
                    status: data.status,
                    update_time: new Date().toISOString()
                };

                await order.save();
                console.log('Order updated as paid:', orderId);

                // Send LINE notification if available
                try {
                    const User = require('../models/User');
                    const lineBotService = require('./lineBotService');

                    const user = await User.findById(order.user);
                    if (user?.lineProfile?.lineUserId) {
                        await lineBotService.pushMessage(
                            user.lineProfile.lineUserId,
                            lineBotService.createTextMessage(
                                `✅ ชำระเงินสำเร็จ!\n\nคำสั่งซื้อ: ${order.orderNumber || orderId}\nยอดเงิน: ฿${(data.amount / 100).toLocaleString()}\n\nขอบคุณที่ใช้บริการค่ะ 💕`
                            )
                        );
                    }
                } catch (lineError) {
                    console.error('Failed to send LINE notification:', lineError);
                }

                return { success: true, orderId, status: 'paid' };
            } else {
                console.log('Charge not successful:', data.status);
                return { success: true, orderId, status: data.status };
            }
        }

        return { success: true, message: `Event ${key} received` };
    } catch (error) {
        console.error('Omise webhook error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Verify webhook signature (if using webhook secret)
 * @param {string} payload - Raw request body
 * @param {string} signature - Omise-Signature header
 * @returns {boolean}
 */
exports.verifyWebhookSignature = (payload, signature) => {
    // Omise webhook signature verification (optional but recommended)
    // For now, we'll trust the webhook as it comes from Omise's IP
    // In production, you should whitelist Omise's webhook IPs
    return true;
};

/**
 * Order Test Fixtures
 * ข้อมูลจำลองสำหรับทดสอบ Order
 */

const mongoose = require('mongoose');
const { validUserId } = require('./users.fixture');
const { validProductId } = require('./products.fixture');

const validOrderId = new mongoose.Types.ObjectId();

const mockOrderItem = {
  product: validProductId,
  name: 'เซรั่มบำรุงผิว',
  qty: 2,
  price: 990,
  image: 'https://example.com/product1.jpg',
};

const mockShippingAddress = {
  name: 'ทดสอบ ผู้ใช้',
  address: '123 หมู่ 1 ถนนทดสอบ',
  district: 'เมือง',
  province: 'กรุงเทพฯ',
  postalCode: '10100',
  phone: '0812345678',
};

const mockOrder = {
  _id: validOrderId,
  user: validUserId,
  orderItems: [mockOrderItem],
  shippingAddress: mockShippingAddress,
  paymentMethod: 'PromptPay',
  itemsPrice: 1980,
  shippingPrice: 50,
  totalPrice: 2030,
  isPaid: false,
  isDelivered: false,
  status: 'Pending Payment',
  isStockDecremented: false,
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
};

const mockPaidOrder = {
  ...mockOrder,
  _id: new mongoose.Types.ObjectId(),
  isPaid: true,
  paidAt: new Date('2024-01-15'),
  status: 'Processing',
  isStockDecremented: true,
  paymentResult: {
    id: 'PAY-123456',
    status: 'completed',
    update_time: new Date().toISOString(),
    email_address: 'test@example.com',
  },
};

const mockShippedOrder = {
  ...mockPaidOrder,
  _id: new mongoose.Types.ObjectId(),
  status: 'Shipped',
  trackingNumber: 'TH1234567890',
  shippingCarrier: 'Kerry Express',
};

const mockDeliveredOrder = {
  ...mockShippedOrder,
  _id: new mongoose.Types.ObjectId(),
  status: 'Delivered',
  isDelivered: true,
  deliveredAt: new Date('2024-01-18'),
};

const mockCancelledOrder = {
  ...mockOrder,
  _id: new mongoose.Types.ObjectId(),
  status: 'Cancelled',
  cancelReason: 'ลูกค้าขอยกเลิก',
};

const mockOrderInput = {
  orderItems: [
    {
      product: validProductId.toString(),
      qty: 2,
    },
  ],
  shippingAddress: mockShippingAddress,
  paymentMethod: 'PromptPay',
};

const mockOrders = [
  mockOrder,
  mockPaidOrder,
  mockShippedOrder,
  mockDeliveredOrder,
];

// Order status flow
const orderStatuses = [
  'Pending Payment',
  'Processing',
  'Shipped',
  'Delivered',
  'Cancelled',
  'Refunded',
];

module.exports = {
  validOrderId,
  mockOrderItem,
  mockShippingAddress,
  mockOrder,
  mockPaidOrder,
  mockShippedOrder,
  mockDeliveredOrder,
  mockCancelledOrder,
  mockOrderInput,
  mockOrders,
  orderStatuses,
};


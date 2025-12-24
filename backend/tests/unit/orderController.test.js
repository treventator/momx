/**
 * Order Controller Unit Tests
 * ทดสอบ Order management functions
 */

const { mockRequest, mockResponse, mockNext } = require('../mocks/express.mock');
const {
  mockOrder,
  mockPaidOrder,
  mockShippedOrder,
  mockDeliveredOrder,
  mockOrderInput,
  validOrderId,
  orderStatuses,
} = require('../fixtures/orders.fixture');
const { mockUser, validUserId } = require('../fixtures/users.fixture');
const { mockProduct, validProductId } = require('../fixtures/products.fixture');

// Mock dependencies
jest.mock('../../src/models/Order');
jest.mock('../../src/models/Product');
jest.mock('../../src/models/User');
jest.mock('../../src/services/lineBotService', () => ({
  pushMessage: jest.fn().mockResolvedValue(true),
  generateOrderConfirmationFlexMessage: jest.fn().mockReturnValue({}),
  generateOrderStatusUpdateFlexMessage: jest.fn().mockReturnValue({}),
}));

const Order = require('../../src/models/Order');
const Product = require('../../src/models/Product');
const User = require('../../src/models/User');
const orderController = require('../../src/controllers/orderController');

describe('Order Controller', () => {
  let req, res, next;

  beforeEach(() => {
    req = mockRequest();
    res = mockResponse();
    next = mockNext();
    jest.clearAllMocks();
  });

  // ================================================
  // Create Order Tests
  // ================================================
  describe('createOrder', () => {
    it('ควรสร้างออเดอร์สำเร็จ', async () => {
      req.user = mockUser;
      req.body = mockOrderInput;

      Product.findById.mockResolvedValue({
        ...mockProduct,
        stock: 100,
      });
      Order.create.mockResolvedValue(mockOrder);
      User.findById.mockResolvedValue(mockUser);

      await orderController.createOrder(req, res);

      expect(Order.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('ควร error ถ้าไม่มี orderItems', async () => {
      req.user = mockUser;
      req.body = { shippingAddress: mockOrderInput.shippingAddress };

      await orderController.createOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('ควร error ถ้าสินค้าหมด', async () => {
      req.user = mockUser;
      req.body = mockOrderInput;

      Product.findById.mockResolvedValue({
        ...mockProduct,
        stock: 0,
      });

      await orderController.createOrder(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ================================================
  // Get User Orders Tests
  // ================================================
  describe('getUserOrders', () => {
    it('ควรดึงออเดอร์ของ user ได้', async () => {
      req.user = mockUser;
      req.query = { page: 1, limit: 10 };

      Order.find.mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockOrder, mockPaidOrder]),
      });
      Order.countDocuments.mockResolvedValue(2);

      await orderController.getUserOrders(req, res);

      expect(Order.find).toHaveBeenCalledWith({ user: mockUser._id });
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });

  // ================================================
  // Get Order By ID Tests
  // ================================================
  describe('getOrderById', () => {
    it('ควรดึงออเดอร์ตาม ID ได้', async () => {
      req.user = mockUser;
      req.params = { id: validOrderId.toString() };

      Order.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          ...mockOrder,
          user: mockUser,
        }),
      });

      await orderController.getOrderById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('ควร error ถ้าไม่พบออเดอร์', async () => {
      req.user = mockUser;
      req.params = { id: validOrderId.toString() };

      Order.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(null),
      });

      await orderController.getOrderById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('ควร error ถ้า user ไม่ใช่เจ้าของออเดอร์', async () => {
      req.user = { ...mockUser, _id: 'other-user-id', role: 'customer' };
      req.params = { id: validOrderId.toString() };

      Order.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue({
          ...mockOrder,
          user: { _id: validUserId },
        }),
      });

      await orderController.getOrderById(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
    });
  });

  // ================================================
  // Get All Orders Tests (Admin)
  // ================================================
  describe('getAllOrders', () => {
    it('ควรดึงออเดอร์ทั้งหมดได้ (Admin)', async () => {
      req.query = { page: 1, limit: 20 };

      Order.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockOrder, mockPaidOrder, mockShippedOrder]),
      });
      Order.countDocuments.mockResolvedValue(3);

      await orderController.getAllOrders(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'success',
          data: expect.objectContaining({
            orders: expect.any(Array),
          }),
        })
      );
    });

    it('ควร filter ตาม status ได้', async () => {
      req.query = { status: 'Processing' };

      Order.find.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([mockPaidOrder]),
      });
      Order.countDocuments.mockResolvedValue(1);

      await orderController.getAllOrders(req, res);

      expect(Order.find).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'Processing' })
      );
    });
  });

  // ================================================
  // Update Order Status Tests (Admin)
  // ================================================
  describe('updateOrderStatus', () => {
    it('ควรอัพเดทสถานะออเดอร์ได้', async () => {
      req.params = { id: validOrderId.toString() };
      req.body = { status: 'Processing' };

      const mockOrderDoc = {
        ...mockOrder,
        save: jest.fn().mockResolvedValue({ ...mockOrder, status: 'Processing' }),
        populate: jest.fn().mockResolvedValue(mockOrder),
      };
      Order.findById.mockResolvedValue(mockOrderDoc);
      Product.findById.mockResolvedValue(mockProduct);
      Product.findByIdAndUpdate.mockResolvedValue(mockProduct);
      User.findById.mockResolvedValue(mockUser);

      await orderController.updateOrderStatus(req, res);

      expect(mockOrderDoc.save).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('ควร error ถ้าไม่พบออเดอร์', async () => {
      req.params = { id: validOrderId.toString() };
      req.body = { status: 'Processing' };

      Order.findById.mockResolvedValue(null);

      await orderController.updateOrderStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('ควร error ถ้าสถานะไม่ถูกต้อง', async () => {
      req.params = { id: validOrderId.toString() };
      req.body = { status: 'InvalidStatus' };

      await orderController.updateOrderStatus(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ================================================
  // Update Order To Paid Tests
  // ================================================
  describe('updateOrderToPaid', () => {
    it('ควรอัพเดทเป็นชำระแล้วได้', async () => {
      req.params = { id: validOrderId.toString() };
      req.body = {
        paymentResult: {
          id: 'PAY-123',
          status: 'completed',
          update_time: new Date().toISOString(),
        },
      };

      const mockOrderDoc = {
        ...mockOrder,
        orderItems: [{ product: validProductId, qty: 2, name: 'Test' }],
        save: jest.fn().mockResolvedValue(mockPaidOrder),
        populate: jest.fn().mockResolvedValue(mockOrder),
      };
      Order.findById.mockResolvedValue(mockOrderDoc);
      Product.findById.mockResolvedValue({ ...mockProduct, stock: 100 });
      Product.findByIdAndUpdate.mockResolvedValue(mockProduct);
      User.findById.mockResolvedValue(mockUser);

      await orderController.updateOrderToPaid(req, res);

      expect(mockOrderDoc.isPaid).toBe(true);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('ควร error ถ้าสินค้าหมดตอนชำระ', async () => {
      req.params = { id: validOrderId.toString() };
      req.body = {
        paymentResult: {
          id: 'PAY-123',
          status: 'completed',
        },
      };

      const mockOrderDoc = {
        ...mockOrder,
        orderItems: [{ product: validProductId, qty: 100, name: 'Test' }],
        isStockDecremented: false,
      };
      Order.findById.mockResolvedValue(mockOrderDoc);
      Product.findById.mockResolvedValue({ ...mockProduct, stock: 5 }); // stock ไม่พอ

      await orderController.updateOrderToPaid(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  // ================================================
  // Update Order Shipping Tests
  // ================================================
  describe('updateOrderShipping', () => {
    it('ควรอัพเดทเลขพัสดุได้', async () => {
      req.params = { id: validOrderId.toString() };
      req.body = {
        trackingNumber: 'TH1234567890',
        shippingCarrier: 'Kerry Express',
      };

      const mockOrderDoc = {
        ...mockPaidOrder,
        save: jest.fn().mockResolvedValue({
          ...mockPaidOrder,
          trackingNumber: 'TH1234567890',
          status: 'Shipped',
        }),
      };
      Order.findById.mockResolvedValue(mockOrderDoc);
      User.findById.mockResolvedValue(mockUser);

      await orderController.updateOrderShipping(req, res);

      expect(mockOrderDoc.trackingNumber).toBe('TH1234567890');
      expect(mockOrderDoc.status).toBe('Shipped');
      expect(res.status).toHaveBeenCalledWith(200);
    });
  });
});


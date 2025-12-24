// MongoDB Initialization Script
// สร้าง indexes และข้อมูลเริ่มต้น

// Switch to the application database
db = db.getSiblingDB('momx_shop');

// Create indexes for better performance
print('Creating indexes...');

// Users collection indexes
db.users.createIndex({ email: 1 }, { unique: true, sparse: true });
db.users.createIndex({ 'lineProfile.lineUserId': 1 }, { unique: true, sparse: true });
db.users.createIndex({ phone: 1 }, { sparse: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ isActive: 1 });

// Products collection indexes
db.products.createIndex({ slug: 1 }, { unique: true });
db.products.createIndex({ sku: 1 }, { unique: true });
db.products.createIndex({ category: 1 });
db.products.createIndex({ isActive: 1 });
db.products.createIndex({ isFeatured: 1 });
db.products.createIndex({ price: 1 });
db.products.createIndex({ createdAt: -1 });
db.products.createIndex({ salesCount: -1 });
db.products.createIndex({ name: 'text', description: 'text', tags: 'text' });

// Orders collection indexes
db.orders.createIndex({ user: 1 });
db.orders.createIndex({ status: 1 });
db.orders.createIndex({ isPaid: 1 });
db.orders.createIndex({ createdAt: -1 });
db.orders.createIndex({ 'shippingAddress.phone': 1 });

// Categories collection indexes
db.categories.createIndex({ slug: 1 }, { unique: true });
db.categories.createIndex({ isActive: 1 });

// Contacts collection indexes
db.contacts.createIndex({ email: 1 });
db.contacts.createIndex({ isRead: 1 });
db.contacts.createIndex({ createdAt: -1 });

// Carts collection indexes
db.carts.createIndex({ user: 1 });
db.carts.createIndex({ guestId: 1 });
db.carts.createIndex({ updatedAt: 1 }, { expireAfterSeconds: 604800 }); // 7 days TTL

// Subscriptions collection indexes
db.subscriptions.createIndex({ user: 1 });
db.subscriptions.createIndex({ status: 1 });
db.subscriptions.createIndex({ nextDeliveryDate: 1 });

print('Indexes created successfully!');

// Insert default admin user (password: admin123)
// In production, change this immediately!
print('Checking for admin user...');
const adminExists = db.users.findOne({ role: 'admin' });
if (!adminExists) {
  print('Creating default admin user...');
  db.users.insertOne({
    name: 'Admin',
    email: 'admin@momx.com',
    // Hashed password for 'admin123' - CHANGE IN PRODUCTION!
    password: '$2a$10$rPXzGQT9iGXKKHdpLh5xG.vIEJz.0Y0G0aUPYG8JLqGJqnPLFzXMy',
    phone: '0800000000',
    role: 'admin',
    isActive: true,
    points: 0,
    pointsHistory: [],
    addresses: [],
    authProvider: 'email',
    createdAt: new Date(),
    updatedAt: new Date()
  });
  print('Default admin created: admin@momx.com / admin123');
} else {
  print('Admin user already exists.');
}

print('MongoDB initialization complete!');


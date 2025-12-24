const mongoose = require('mongoose');
require('dotenv').config({ path: './config/.env' });
const authController = require('./controllers/authController');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tanyarat_shop');
    console.log('MongoDB connected successfully');
    
    // Create admin user
    await authController.seedAdmin();
    
    // Close connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    
    // Exit process
    process.exit(0);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

connectDB(); 
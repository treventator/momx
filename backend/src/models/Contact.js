const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'กรุณากรอกชื่อ'],
    trim: true
  },
  lineId: {
    type: String,
    required: [true, 'กรุณากรอก Line ID'],
    trim: true
  },
  message: {
    type: String,
    required: [true, 'กรุณากรอกข้อความ'],
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'processed', 'completed'],
    default: 'pending'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  adminNotes: {
    type: String,
    default: ''
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Contact', ContactSchema); 
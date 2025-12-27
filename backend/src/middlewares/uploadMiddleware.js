/**
 * Upload Middleware - Multer configuration for product images
 * LINE Shopping + Facebook Marketplace style
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if not exists
const uploadDir = path.join(__dirname, '../../uploads/products');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename with timestamp
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, `product-${uniqueSuffix}${ext}`);
    }
});

// File filter - only allow images
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('ไฟล์ต้องเป็นรูปภาพ (JPEG, PNG, WebP, GIF) เท่านั้น'), false);
    }
};

// Multer configuration
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB max per file
        files: 5 // Max 5 files per product
    }
});

// Single image upload
const uploadSingle = upload.single('image');

// Multiple images upload (for products)
const uploadMultiple = upload.array('images', 5);

// Error handler middleware
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'ไฟล์มีขนาดใหญ่เกินไป (สูงสุด 10MB)'
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'อัพโหลดได้สูงสุด 5 รูปต่อสินค้า'
            });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                message: 'Field name ไม่ถูกต้อง'
            });
        }
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }

    if (err) {
        return res.status(400).json({
            success: false,
            message: err.message || 'เกิดข้อผิดพลาดในการอัพโหลด'
        });
    }

    next();
};

// Delete image file helper
const deleteImageFile = (filename) => {
    const filepath = path.join(uploadDir, filename);
    if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
        return true;
    }
    return false;
};

// Get image URL from filename
const getImageUrl = (filename) => {
    return `/uploads/products/${filename}`;
};

module.exports = {
    upload,
    uploadSingle,
    uploadMultiple,
    handleUploadError,
    deleteImageFile,
    getImageUrl,
    uploadDir
};

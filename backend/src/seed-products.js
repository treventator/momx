const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('./models/Product');
const Category = require('./models/Category');

// Load environment variables
dotenv.config();

// Sample product data
const products = [
    {
        name: "แชมพูออแกนิค สูตรบำรุงเส้นผม",
        description: "แชมพูออแกนิคที่อุดมไปด้วยสารสกัดธรรมชาติ 12 ชนิด ช่วยบำรุงเส้นผมและหนังศีรษะ ลดผมร่วง ป้องกันรังแค",
        price: 299,
        salePrice: 249,
        memberPrice: 229,
        images: [{ url: "assets/img/IMG_5759%202.jpg", alt: "แชมพูออแกนิค" }],
        stock: 45,
        sku: "SHMP-001",
        isActive: true,
        isFeatured: true
    },
    {
        name: "ครีมอาบน้ำออแกนิค สูตรให้ความชุ่มชื้น",
        description: "ครีมอาบน้ำออแกนิคสูตรพิเศษที่ช่วยให้ผิวชุ่มชื้น ด้วยสารสกัดจากธรรมชาติ ปราศจากสารเคมีที่อาจก่อให้เกิดการระคายเคือง",
        price: 359,
        salePrice: 0,
        memberPrice: 329,
        images: [{ url: "assets/img/S__10067985_0.jpg", alt: "ครีมอาบน้ำออแกนิค" }],
        stock: 30,
        sku: "BTCR-001",
        isActive: true,
        isFeatured: true
    },
    {
        name: "เซรั่มบำรุงผิวหน้า สูตรวิตามินซี",
        description: "เซรั่มบำรุงผิวหน้าที่อุดมไปด้วยวิตามินซีเข้มข้น ช่วยให้ผิวกระจ่างใส ลดเลือนริ้วรอย จุดด่างดำ และรอยสิว",
        price: 450,
        salePrice: 399,
        memberPrice: 379,
        images: [{ url: "assets/img/S__10067976_0.jpg", alt: "เซรั่มบำรุงผิวหน้า" }],
        stock: 15,
        sku: "SRM-001",
        isActive: true,
        isFeatured: true
    },
    {
        name: "แชมพูออแกนิค สูตรผมแห้งเสีย",
        description: "แชมพูออแกนิคสูตรพิเศษสำหรับผมแห้งเสีย ช่วยฟื้นฟูเส้นผมให้นุ่มสลวย มีน้ำหนัก ไม่พันกัน",
        price: 329,
        salePrice: 289,
        memberPrice: 269,
        images: [{ url: "assets/img/IMG_5762.jpg", alt: "แชมพูออแกนิคสูตรผมแห้งเสีย" }],
        stock: 20,
        sku: "SHMP-002",
        isActive: true,
        isFeatured: true
    },
    {
        name: "ครีมอาบน้ำออแกนิค สูตรสำหรับผิวแพ้ง่าย",
        description: "ครีมอาบน้ำออแกนิคสูตรอ่อนโยนพิเศษสำหรับผิวแพ้ง่าย ปราศจากสารก่อภูมิแพ้ น้ำหอม และสารกันเสีย",
        price: 389,
        salePrice: 0,
        memberPrice: 359,
        images: [{ url: "assets/img/products/Firefly%2020240319173240.jpg", alt: "ครีมอาบน้ำออแกนิคสำหรับผิวแพ้ง่าย" }],
        stock: 0,
        sku: "BTCR-002",
        isActive: true,
        isFeatured: true
    },
    {
        name: "เซรั่มบำรุงผิวหน้า สูตรสำหรับผิวมัน",
        description: "เซรั่มบำรุงผิวหน้าสูตรพิเศษสำหรับผิวมัน ช่วยควบคุมความมัน ลดการอุดตันของรูขุมขน และป้องกันการเกิดสิว",
        price: 490,
        salePrice: 450,
        memberPrice: 430,
        images: [{ url: "assets/img/219112_0.jpg", alt: "เซรั่มบำรุงผิวหน้าสำหรับผิวมัน" }],
        stock: 10,
        sku: "SRM-002",
        isActive: true,
        isFeatured: true
    }
];

// Categories
const categories = [
    { name: "แชมพู", slug: "shampoo" },
    { name: "ครีมอาบน้ำ", slug: "bath-cream" },
    { name: "เซรั่ม", slug: "serum" }
];

// Connect to MongoDB and seed data
const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tanyarat_shop');
        console.log('MongoDB connected successfully');

        // Clear existing data
        await Category.deleteMany({});
        await Product.deleteMany({});
        console.log('Cleared existing categories and products');

        // Seed categories
        const createdCategories = await Category.insertMany(categories);
        console.log(`${createdCategories.length} categories created`);

        // Map products to include category references
        const productsWithCategories = products.map((product, index) => {
            const categoryIndex = index % 3; // เพื่อกระจายสินค้าให้อยู่ในแต่ละหมวดหมู่
            return {
                ...product,
                category: createdCategories[categoryIndex]._id
            };
        });

        // Seed products
        const createdProducts = await Product.insertMany(productsWithCategories);
        console.log(`${createdProducts.length} products created`);

        // Close connection
        await mongoose.connection.close();
        console.log('MongoDB connection closed');

        // Exit process
        process.exit(0);
    } catch (error) {
        console.error('Seeding error:', error);
        process.exit(1);
    }
};

// Run the seeding
seedData(); 
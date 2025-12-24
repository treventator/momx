# Tanyarat E-commerce Platform

ระบบร้านค้าออนไลน์สำหรับธุรกิจ Tanyarat ที่จำหน่ายผลิตภัณฑ์ออแกนิคและบำรุงผิว

## โครงสร้างโปรเจค

```
tanyarat-project/
├── frontend/               # Frontend (HTML, CSS, JavaScript)
│   ├── public/             # Static assets และไฟล์ HTML
│   ├── src/                # Source code สำหรับ JavaScript components
│   ├── Dockerfile          # Docker configuration สำหรับ frontend
│   ├── nginx.conf          # Nginx configuration
│   └── package.json        # Dependencies และ scripts
│
├── backend/                # Backend (Node.js/Express)
│   ├── src/                # Source code
│   │   ├── controllers/    # Request handlers
│   │   ├── models/         # Data models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Utility functions
│   │   ├── middlewares/    # Custom middlewares
│   │   └── index.js        # Express application
│   ├── config/             # Configuration files
│   ├── Dockerfile          # Docker configuration สำหรับ backend
│   └── package.json        # Dependencies และ scripts
│
├── database/               # Database scripts และ migrations
│
├── docker-compose.yml      # Docker Compose configuration
└── README.md               # โปรเจคหลัก README
```

## การติดตั้งและการใช้งาน

### วิธีการติดตั้งด้วย Docker (แนะนำ)

1. ติดตั้ง [Docker](https://www.docker.com/get-started) และ [Docker Compose](https://docs.docker.com/compose/install/)

2. Clone โปรเจค
   ```bash
   git clone https://github.com/yourusername/tanyarat-project.git
   cd tanyarat-project
   ```

3. สร้างและเริ่มต้น containers
   ```bash
   docker-compose up --build
   ```

4. เข้าถึงแอปพลิเคชัน
   - Frontend: http://localhost:66
   - Backend API: http://localhost:4455/api
   - API Documentation: http://localhost:4455/api/docs

### การติดตั้งสำหรับการพัฒนา (ไม่ใช้ Docker)

1. ติดตั้ง dependencies
   
   **Frontend:**
   ```bash
   cd frontend
   npm install
   ```
   
   **Backend:**
   ```bash
   cd backend
   npm install
   ```

2. ตั้งค่าไฟล์ environment (`.env`) ใน `backend/config/.env`

3. เริ่มต้นระบบ
   
   **Frontend:**
   ```bash
   cd frontend
   npm run dev
   ```
   
   **Backend:**
   ```bash
   cd backend
   npm run dev
   ```

## API Endpoints

### สินค้า
- `GET /api/shop/products` - รายการสินค้าทั้งหมด
- `GET /api/shop/products/:id` - รายละเอียดสินค้า
- `GET /api/shop/categories` - รายการหมวดหมู่สินค้า

### ตระกร้าสินค้า
- `GET /api/shop/cart` - ดูตระกร้าสินค้า
- `POST /api/shop/cart` - เพิ่มสินค้าลงตระกร้า
- `PUT /api/shop/cart/:itemId` - แก้ไขจำนวนสินค้าในตระกร้า
- `DELETE /api/shop/cart/:itemId` - ลบสินค้าจากตระกร้า

### ผู้ใช้งาน
- `POST /api/auth/register` - สมัครสมาชิก
- `POST /api/auth/login` - เข้าสู่ระบบ
- `GET /api/users/me` - ข้อมูลผู้ใช้ที่ล็อกอินอยู่

## เทคโนโลยีที่ใช้

### Frontend
- HTML, CSS, JavaScript
- Bootstrap 5
- Nginx

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication

### DevOps
- Docker
- Docker Compose
- Nginx

## การขออนุญาตและลิขสิทธิ์

© 2024 Tanyarat. All Rights Reserved. 
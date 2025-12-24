# 🛒 MomX E-Commerce Platform

ระบบร้านค้าออนไลน์ครบวงจร พร้อมระบบสมาชิกผ่าน **LINE LIFF** และ **LINE Bot** รองรับการจัดการสินค้า, ออเดอร์, สต็อก และ CRM

[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7+-47A248?logo=mongodb&logoColor=white)](https://mongodb.com/)
[![Redis](https://img.shields.io/badge/Redis-7+-DC382D?logo=redis&logoColor=white)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://docker.com/)
[![LINE LIFF](https://img.shields.io/badge/LINE-LIFF%20v2-00B900?logo=line&logoColor=white)](https://developers.line.biz/)
[![Jest](https://img.shields.io/badge/Jest-Testing-C21325?logo=jest&logoColor=white)](https://jestjs.io/)

---

## 📋 สารบัญ

- [✨ ฟีเจอร์](#-ฟีเจอร์)
- [🏗️ สถาปัตยกรรม](#️-สถาปัตยกรรม)
- [🛠️ Tech Stack](#️-tech-stack)
- [🚀 Quick Start](#-quick-start)
- [⚙️ Environment Variables](#️-environment-variables)
- [📱 LINE LIFF Setup](#-line-liff-setup)
- [📡 API Endpoints](#-api-endpoints)
- [🧪 Testing](#-testing)
- [🐳 Docker Deployment](#-docker-deployment)
- [☁️ Production Deployment](#️-production-deployment)
- [🔍 Troubleshooting](#-troubleshooting)
- [📄 License](#-license)

---

## ✨ ฟีเจอร์

### 🛍️ ระบบร้านค้า (E-Commerce)
| ฟีเจอร์ | รายละเอียด |
|---------|-----------|
| แคตตาล็อกสินค้า | แสดงสินค้า, กรอง, ค้นหา, เรียงลำดับ |
| ประเภทสินค้า | CRUD หมวดหมู่สินค้า |
| ตะกร้าสินค้า | รองรับ Guest และ Member |
| ระบบรีวิว | คะแนนและความคิดเห็น |
| สินค้าแนะนำ | Featured, Bestsellers, New Arrivals |

### 📦 ระบบจัดการออเดอร์
| ฟีเจอร์ | รายละเอียด |
|---------|-----------|
| 6 สถานะ | Pending → Processing → Shipped → Delivered → Cancelled → Refunded |
| เลขพัสดุ | บันทึกและแจ้งเตือน Tracking Number |
| ตัด/คืน Stock | อัตโนมัติเมื่อชำระเงิน/ยกเลิก |
| Guest Order | สั่งซื้อโดยไม่ต้องสมัครสมาชิก |

### 🔐 ระบบสมาชิก LINE LIFF
| ฟีเจอร์ | รายละเอียด |
|---------|-----------|
| Auto-Login | ไม่ต้องกรอก Username/Password |
| LINE Profile | ดึงข้อมูลจาก LINE อัตโนมัติ |
| Seamless UX | เปิดใน LINE App โดยตรง |
| JWT Token | Authentication ที่ปลอดภัย |

### 🤖 LINE Bot (Messaging API)
| ฟีเจอร์ | รายละเอียด |
|---------|-----------|
| แจ้งเตือนออเดอร์ | Push message เมื่อสร้าง/อัพเดทออเดอร์ |
| Flex Message | ข้อความสวยงามแบบ Card |
| Auto-Reply | ตอบกลับอัตโนมัติ |
| Admin Broadcast | ส่งข้อความถึงลูกค้าทุกคน |

### ⭐ ระบบสะสมแต้ม (Points)
| ฟีเจอร์ | รายละเอียด |
|---------|-----------|
| สะสมแต้ม | 1 แต้มต่อ 100 บาท |
| ประวัติแต้ม | ดู earn/redeem history |
| แลกส่วนลด | ใช้แต้มแลกส่วนลด |

### 📊 Admin Dashboard
| ฟีเจอร์ | รายละเอียด |
|---------|-----------|
| Statistics | ยอดขาย, ออเดอร์, ผู้ใช้, สินค้า |
| Sales Report | รายงานยอดขายตามช่วงเวลา |
| Products Report | สินค้าขายดี |
| Customers Report | ลูกค้าซื้อมากที่สุด |
| Low Stock Alert | แจ้งเตือนสินค้าใกล้หมด |
| Inbox | จัดการข้อความติดต่อ |

---

## 🏗️ สถาปัตยกรรม

```
┌─────────────────────────────────────────────────────────────────────┐
│                         MomX Architecture                           │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│    ┌──────────┐     ┌──────────┐     ┌──────────┐                  │
│    │   LINE   │     │  Browser │     │  Mobile  │                  │
│    │   App    │     │          │     │   App    │                  │
│    └────┬─────┘     └────┬─────┘     └────┬─────┘                  │
│         │                │                │                         │
│         └────────────────┼────────────────┘                         │
│                          │                                          │
│                    ┌─────▼─────┐                                    │
│                    │   Nginx   │  (Reverse Proxy + SSL)             │
│                    │   :8080   │                                    │
│                    └─────┬─────┘                                    │
│                          │                                          │
│         ┌────────────────┼────────────────┐                         │
│         │                │                │                         │
│   ┌─────▼─────┐    ┌─────▼─────┐    ┌─────▼─────┐                  │
│   │  Frontend │    │  Backend  │    │   LINE    │                  │
│   │  (Static) │    │  (API)    │    │  Webhook  │                  │
│   │           │    │   :4455   │    │           │                  │
│   └───────────┘    └─────┬─────┘    └───────────┘                  │
│                          │                                          │
│              ┌───────────┼───────────┐                              │
│              │           │           │                              │
│        ┌─────▼─────┐ ┌───▼───┐ ┌─────▼─────┐                       │
│        │  MongoDB  │ │ Redis │ │   LINE    │                       │
│        │  :27017   │ │ :6379 │ │    API    │                       │
│        └───────────┘ └───────┘ └───────────┘                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 📁 โครงสร้างโปรเจค

```
momx/
├── backend/                          # Backend API (Node.js/Express)
│   ├── src/
│   │   ├── controllers/              # Business Logic
│   │   │   ├── authController.js     # Authentication
│   │   │   ├── lineAuthController.js # LINE LIFF Authentication
│   │   │   ├── productController.js  # Product CRUD + Admin
│   │   │   ├── categoryController.js # Category CRUD
│   │   │   ├── orderController.js    # Order Management
│   │   │   ├── userController.js     # User Management
│   │   │   ├── cartController.js     # Shopping Cart
│   │   │   └── contactController.js  # Contact/Inbox
│   │   ├── models/                   # MongoDB Models
│   │   │   ├── User.js               # User + LINE Profile + Points
│   │   │   ├── Product.js            # Product + Reviews
│   │   │   ├── Category.js           # Product Categories
│   │   │   ├── Order.js              # Orders
│   │   │   ├── Cart.js               # Shopping Cart
│   │   │   └── Contact.js            # Contact Messages
│   │   ├── routes/                   # API Routes
│   │   │   ├── authRoutes.js         # /api/auth/*
│   │   │   ├── lineRoutes.js         # /api/line/*
│   │   │   ├── productRoutes.js      # /api/shop/products/*
│   │   │   ├── categoryRoutes.js     # /api/categories/*
│   │   │   ├── orderRoutes.js        # /api/shop/orders/*
│   │   │   ├── adminRoutes.js        # /api/admin/*
│   │   │   └── webhookRoutes.js      # /api/webhooks/*
│   │   ├── services/
│   │   │   └── lineBotService.js     # LINE Messaging API
│   │   ├── middlewares/
│   │   │   └── authMiddleware.js     # JWT Authentication
│   │   ├── utils/
│   │   │   ├── errors.js             # Custom Error Classes
│   │   │   ├── logger.js             # Logging (Pino)
│   │   │   └── redis.js              # Redis Client
│   │   └── index.js                  # App Entry Point
│   ├── tests/                        # Unit & Integration Tests
│   │   ├── unit/
│   │   ├── integration/
│   │   ├── mocks/
│   │   └── fixtures/
│   ├── Dockerfile
│   ├── jest.config.js
│   └── package.json
│
├── frontend/                         # Frontend (Static HTML/JS)
│   ├── public/
│   │   ├── index.html                # หน้าหลัก
│   │   ├── liff.html                 # หน้า LINE LIFF
│   │   ├── assets/
│   │   │   ├── js/
│   │   │   │   └── liff-app.js       # LIFF JavaScript
│   │   │   └── css/
│   │   └── admin/                    # Admin Dashboard
│   ├── nginx.conf
│   └── Dockerfile
│
├── docker/
│   └── mongo-init/                   # MongoDB Initialization
│       └── 01-init.js
│
├── docker-compose.yml                # Development
├── docker-compose.prod.yml           # Production
├── env-template.txt                  # Environment Template
├── ENV_SETUP.md                      # Environment Setup Guide
├── LINE_SETUP_GUIDE.md               # LINE Configuration Guide
└── README.md
```

---

## 🛠️ Tech Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20 LTS | Runtime |
| Express.js | 4.x | Web Framework |
| MongoDB | 7.x | Database |
| Mongoose | 7.x | ODM |
| Redis | 7.x | Caching |
| JWT | - | Authentication |
| Pino | - | Logging |
| Jest | 29.x | Testing |
| Supertest | - | API Testing |

### Frontend
| Technology | Purpose |
|------------|---------|
| HTML5/CSS3 | Structure & Styling |
| JavaScript | Interactivity |
| LINE LIFF SDK | LINE Integration |
| Nginx | Static File Server |

### DevOps
| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| Docker Compose | Orchestration |
| GitHub Actions | CI/CD (optional) |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ หรือ Docker
- LINE Developers Account
- (Optional) MongoDB local หรือ Atlas

### Option 1: Docker (แนะนำ)

```bash
# 1. Clone repository
git clone https://github.com/your-username/momx.git
cd momx

# 2. Copy environment template
cp env-template.txt .env

# 3. แก้ไข .env (ใส่ LINE credentials)
nano .env

# 4. รัน Docker Compose
docker-compose up -d

# 5. เปิด browser
# Frontend: http://localhost:8080
# Backend:  http://localhost:4455/health
```

### Option 2: Manual Installation

```bash
# 1. Clone repository
git clone https://github.com/your-username/momx.git
cd momx

# 2. Install Backend
cd backend
npm install
cp ../env-template.txt .env
# แก้ไข .env

# 3. Start Backend
npm run dev

# 4. (Terminal ใหม่) Start Frontend
cd ../frontend
# ใช้ Live Server หรือ http-server
npx http-server public -p 8080
```

---

## ⚙️ Environment Variables

สร้างไฟล์ `.env` จาก `env-template.txt`:

```env
# ===========================================
# Application
# ===========================================
NODE_ENV=development
PORT=4455
FRONTEND_URL=http://localhost:8080

# ===========================================
# JWT (Required)
# ===========================================
JWT_SECRET=your-super-secret-key-minimum-32-characters
JWT_EXPIRE=30d

# ===========================================
# MongoDB
# ===========================================
MONGO_URI=mongodb://mongo:27017/momx_shop

# ===========================================
# Redis
# ===========================================
CACHE_ENABLED=true
REDIS_HOST=redis
REDIS_PORT=6379

# ===========================================
# LINE Configuration (Required for LINE features)
# ===========================================
LINE_CHANNEL_ID=your-line-channel-id
LINE_CHANNEL_SECRET=your-line-channel-secret
LINE_CHANNEL_ACCESS_TOKEN=your-messaging-api-token
LIFF_ID=your-liff-id
```

📖 ดูรายละเอียดเพิ่มเติมที่ [ENV_SETUP.md](./ENV_SETUP.md)

---

## 📱 LINE LIFF Setup

### Step 1: สร้าง LINE Login Channel

1. ไปที่ [LINE Developers Console](https://developers.line.biz/console/)
2. สร้าง Provider → Create Channel → **LINE Login**
3. Copy **Channel ID** และ **Channel Secret**

### Step 2: สร้าง LIFF App

1. ไปที่ LINE Login Channel → tab **LIFF**
2. กด **Add** และกรอก:
   - **Endpoint URL**: `https://yourdomain.com/liff.html`
   - **Scopes**: ☑️ profile, ☑️ openid, ☑️ email
   - **Bot link feature**: On (Aggressive)
3. Copy **LIFF ID**

### Step 3: สร้าง Messaging API Channel

1. สร้าง Channel ใหม่ → **Messaging API**
2. ไปที่ tab **Messaging API**
3. **Webhook URL**: `https://yourdomain.com/api/webhooks/line`
4. กด **Issue** ที่ Channel access token

### Step 4: เชื่อมต่อ LIFF กับ Bot

1. กลับไป LINE Login Channel → LIFF
2. เลือก LIFF app → **Linked OA** → เลือก Bot

📖 ดูรายละเอียดเพิ่มเติมที่ [LINE_SETUP_GUIDE.md](./LINE_SETUP_GUIDE.md)

---

## 📡 API Endpoints

### 🔐 Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/register` | สมัครสมาชิก | - |
| POST | `/api/auth/login` | เข้าสู่ระบบ | - |
| GET | `/api/auth/me` | ข้อมูล User ปัจจุบัน | ✅ |

### 📱 LINE Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/line/auth` | Login/Register ผ่าน LINE | - |
| POST | `/api/line/verify` | Verify ID Token | - |
| GET | `/api/line/me` | ดึง LINE Profile | ✅ |
| PUT | `/api/line/profile` | อัพเดท Profile | ✅ |

### 🛍️ Products (Public)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/shop/products` | รายการสินค้า (filter, search, sort) |
| GET | `/api/shop/products/:id` | รายละเอียดสินค้า |
| GET | `/api/shop/products/slug/:slug` | สินค้าตาม Slug |
| GET | `/api/shop/products/featured` | สินค้าแนะนำ |
| GET | `/api/shop/products/bestsellers` | สินค้าขายดี |
| GET | `/api/shop/products/new-arrivals` | สินค้าใหม่ |
| GET | `/api/shop/products/:id/related` | สินค้าที่เกี่ยวข้อง |
| GET | `/api/shop/products/:id/reviews` | รีวิวสินค้า |
| POST | `/api/shop/products/:id/reviews` | สร้างรีวิว | ✅ |
| POST | `/api/shop/products/search` | ค้นหาสินค้า |

### 🏷️ Categories (Public)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | รายการประเภททั้งหมด |
| GET | `/api/categories/:id` | ประเภทตาม ID |
| GET | `/api/categories/slug/:slug` | ประเภทตาม Slug |

### 🛒 Cart

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/cart` | ดูตะกร้า | Optional |
| POST | `/api/cart` | เพิ่มสินค้า | Optional |
| PUT | `/api/cart/:itemId` | แก้ไขจำนวน | Optional |
| DELETE | `/api/cart/:itemId` | ลบสินค้า | Optional |
| DELETE | `/api/cart` | ล้างตะกร้า | Optional |

### 📦 Orders

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/shop/orders` | สร้างออเดอร์ | ✅ |
| GET | `/api/shop/orders` | ประวัติออเดอร์ | ✅ |
| GET | `/api/shop/orders/:id` | รายละเอียดออเดอร์ | ✅ |
| PUT | `/api/shop/orders/:id/pay` | ยืนยันชำระเงิน | ✅ |

### 👤 User Profile

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/users/profile` | ดูโปรไฟล์ | ✅ |
| PUT | `/api/users/profile` | แก้ไขโปรไฟล์ | ✅ |
| PUT | `/api/users/password` | เปลี่ยนรหัสผ่าน | ✅ |
| GET | `/api/users/addresses` | ที่อยู่ทั้งหมด | ✅ |
| POST | `/api/users/addresses` | เพิ่มที่อยู่ | ✅ |
| PUT | `/api/users/addresses/:id` | แก้ไขที่อยู่ | ✅ |
| DELETE | `/api/users/addresses/:id` | ลบที่อยู่ | ✅ |

### 📩 Contact

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/contact` | ส่งข้อความติดต่อ | - |

### 🔧 Admin

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| **Products** |
| GET | `/api/admin/products` | รายการสินค้า (Admin) | Admin |
| POST | `/api/admin/products` | สร้างสินค้า | Admin |
| PUT | `/api/admin/products/:id` | แก้ไขสินค้า | Admin |
| DELETE | `/api/admin/products/:id` | ลบสินค้า | Admin |
| PUT | `/api/admin/products/:id/stock` | ปรับ Stock | Admin |
| PUT | `/api/admin/products/bulk-stock` | ปรับ Stock หลายรายการ | Admin |
| **Categories** |
| GET | `/api/admin/categories` | รายการประเภท | Admin |
| POST | `/api/admin/categories` | สร้างประเภท | Admin |
| PUT | `/api/admin/categories/:id` | แก้ไขประเภท | Admin |
| DELETE | `/api/admin/categories/:id` | ลบประเภท | Admin |
| PATCH | `/api/admin/categories/:id/toggle` | Toggle สถานะ | Admin |
| **Orders** |
| GET | `/api/admin/orders` | ออเดอร์ทั้งหมด | Admin |
| GET | `/api/admin/orders/:id` | รายละเอียดออเดอร์ | Admin |
| PUT | `/api/admin/orders/:id` | อัพเดทสถานะ | Admin |
| PUT | `/api/shop/orders/:id/shipping` | อัพเดทเลขพัสดุ | Admin |
| **Users** |
| GET | `/api/admin/users` | ผู้ใช้ทั้งหมด | Admin |
| GET | `/api/admin/users/:id` | รายละเอียดผู้ใช้ | Admin |
| PUT | `/api/admin/users/:id` | แก้ไขผู้ใช้ | Admin |
| DELETE | `/api/admin/users/:id` | ลบผู้ใช้ | Admin |
| **Dashboard** |
| GET | `/api/admin/statistics` | สถิติ Dashboard | Admin |
| GET | `/api/admin/reports/sales` | รายงานยอดขาย | Admin |
| GET | `/api/admin/reports/products` | รายงานสินค้าขายดี | Admin |
| GET | `/api/admin/reports/customers` | รายงานลูกค้า | Admin |
| GET | `/api/admin/inventory/low-stock` | สินค้าใกล้หมด | Admin |
| **Contact** |
| GET | `/api/contact` | ข้อความทั้งหมด | Admin |
| GET | `/api/contact/:id` | รายละเอียดข้อความ | Admin |
| PUT | `/api/contact/:id` | อัพเดทข้อความ | Admin |
| PUT | `/api/contact/:id/read` | Mark as read | Admin |
| **LINE Messaging** |
| POST | `/api/admin/send-line-message` | ส่งข้อความถึงลูกค้า | Admin |
| POST | `/api/admin/broadcast-line` | Broadcast ทุกคน | Admin |

### 🤖 Webhooks

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/webhooks/line` | LINE Bot Webhook |

### ❤️ Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Docker Health Check |
| GET | `/api/health` | API Health Check |

---

## 🧪 Testing

### รัน Unit Tests

```bash
cd backend

# รันทุก tests
npm test

# รันแบบ watch mode
npm run test:watch

# รันพร้อม coverage
npm run test:coverage

# รันเฉพาะ unit tests
npm run test:unit

# รันเฉพาะ integration tests
npm run test:integration
```

### Test Structure

```
tests/
├── unit/                    # Unit Tests
│   ├── authController.test.js
│   ├── productController.test.js
│   ├── categoryController.test.js
│   └── orderController.test.js
├── integration/             # Integration Tests
│   ├── auth.test.js
│   └── products.test.js
├── mocks/                   # Mock Objects
│   ├── mongoose.mock.js
│   ├── redis.mock.js
│   └── express.mock.js
├── fixtures/                # Test Data
│   ├── users.fixture.js
│   ├── products.fixture.js
│   └── orders.fixture.js
└── setup.js                 # Jest Setup
```

---

## 🐳 Docker Deployment

### Development

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down

# Rebuild and start
docker-compose up -d --build
```

### Production

```bash
# Start with production config
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f backend

# Scale backend (if needed)
docker-compose -f docker-compose.prod.yml up -d --scale backend=3

# Stop
docker-compose -f docker-compose.prod.yml down
```

### Docker Services

| Service | Port | Description |
|---------|------|-------------|
| frontend | 8080 | Nginx (Static Files) |
| backend | 4455 | Node.js API |
| mongo | 27017 | MongoDB Database |
| redis | 6379 | Redis Cache |

---

## ☁️ Production Deployment

### Option 1: VPS (Ubuntu)

```bash
# 1. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 2. Install Docker Compose
sudo apt install docker-compose-plugin

# 3. Clone and configure
git clone https://github.com/your-username/momx.git
cd momx
cp env-template.txt .env
nano .env  # Configure production values

# 4. Start services
docker-compose -f docker-compose.prod.yml up -d

# 5. Setup Nginx reverse proxy + SSL
sudo apt install nginx certbot python3-certbot-nginx
# Configure nginx...
sudo certbot --nginx -d yourdomain.com
```

### Option 2: Cloud Platforms

**Railway / Render:**
1. Connect GitHub repository
2. Set environment variables
3. Deploy

**Vercel (Frontend) + Railway (Backend):**
1. Deploy frontend to Vercel
2. Deploy backend to Railway
3. Configure CORS

### Production Checklist

- [ ] เปลี่ยน `JWT_SECRET` เป็น random string ที่ปลอดภัย (32+ chars)
- [ ] ตั้งค่า `NODE_ENV=production`
- [ ] เปิด HTTPS (required for LIFF)
- [ ] ตั้งค่า MongoDB authentication
- [ ] อัพเดท LINE Webhook URL เป็น production domain
- [ ] อัพเดท LIFF Endpoint URL
- [ ] ตั้งค่า Firewall (เปิดเฉพาะ port 80, 443)
- [ ] ตั้งค่า Rate Limiting
- [ ] Setup monitoring และ logging

---

## 🔍 Troubleshooting

### ❌ LIFF ไม่โหลด

**สาเหตุ:** LIFF ID ไม่ถูกต้อง หรือ URL ไม่ใช่ HTTPS

**แก้ไข:**
1. ตรวจสอบ LIFF ID ใน `liff-app.js`
2. ตรวจสอบ Endpoint URL เป็น HTTPS
3. ตรวจสอบ domain ตรงกับที่ลงทะเบียน

### ❌ LINE Webhook ไม่ทำงาน

**สาเหตุ:** Signature verification failed

**แก้ไข:**
1. ตรวจสอบ `LINE_CHANNEL_SECRET` (จาก Messaging API Channel)
2. ตรวจสอบ Webhook URL ถูกต้อง
3. กด Verify ใน LINE Developers Console

### ❌ Bot ไม่ส่งข้อความ

**สาเหตุ:** Channel Access Token หมดอายุ

**แก้ไข:**
1. ไป Messaging API Channel
2. กด **Issue** เพื่อสร้าง token ใหม่
3. อัพเดท `.env` และ restart

### ❌ MongoDB Connection Error

**สาเหตุ:** MongoDB ยังไม่พร้อม

**แก้ไข:**
```bash
# ตรวจสอบ MongoDB
docker-compose logs mongo

# Restart MongoDB
docker-compose restart mongo
```

### ❌ Redis Connection Error

**สาเหตุ:** Redis ไม่ได้รัน

**แก้ไข:**
```bash
# ตรวจสอบ Redis
docker exec -it momx-redis redis-cli ping

# หรือปิด cache
# ใน .env: CACHE_ENABLED=false
```

---

## 📚 Documentation

- [ENV_SETUP.md](./ENV_SETUP.md) - คู่มือตั้งค่า Environment Variables
- [LINE_SETUP_GUIDE.md](./LINE_SETUP_GUIDE.md) - คู่มือตั้งค่า LINE LIFF & Bot

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📄 License

© 2024 MomX. All Rights Reserved.

---

## 👥 Contact

- **Developer**: Teemmer
- **Email**: support@momx.com
- **LINE**: @momx

---

## 🙏 Acknowledgments

- [LINE Developers](https://developers.line.biz/)
- [MongoDB](https://www.mongodb.com/)
- [Express.js](https://expressjs.com/)
- [Jest](https://jestjs.io/)

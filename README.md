# 🛒 TANYARAT E-commerce Platform

ระบบร้านค้าออนไลน์พร้อมระบบสมาชิกผ่าน **LINE LIFF** และ **LINE Bot** สำหรับธุรกิจ Tanyarat

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6+-green.svg)](https://mongodb.com/)
[![LINE LIFF](https://img.shields.io/badge/LINE-LIFF%20v2-00B900.svg)](https://developers.line.biz/en/docs/liff/)

---

## 📋 สารบัญ

- [ฟีเจอร์หลัก](#-ฟีเจอร์หลัก)
- [โครงสร้างโปรเจค](#-โครงสร้างโปรเจค)
- [การติดตั้ง](#-การติดตั้ง)
- [การตั้งค่า LINE LIFF (สำคัญ)](#-การตั้งค่า-line-liff-สำคัญ)
- [การ Deploy Production](#-การ-deploy-production)
- [API Endpoints](#-api-endpoints)
- [การทดสอบ](#-การทดสอบ)
- [Troubleshooting](#-troubleshooting)

---

## ✨ ฟีเจอร์หลัก

### 🔐 ระบบสมาชิก LINE LIFF
- **Auto-Login** - ลูกค้าไม่ต้องกรอก username/password
- **LINE Profile Integration** - ดึงข้อมูลจาก LINE อัตโนมัติ
- **Seamless UX** - เปิดใน LINE App โดยตรง

### 🤖 LINE Bot (Messaging API)
- แจ้งเตือนเมื่อสร้างออเดอร์
- อัพเดทสถานะการจัดส่ง
- ตอบคำถามอัตโนมัติ
- Rich Menu / Flex Message

### ⭐ ระบบสะสมแต้ม
- 1 แต้มต่อ 100 บาท
- ดูประวัติแต้ม
- แลกส่วนลด

### 🛍️ E-commerce
- แคตตาล็อกสินค้า
- ตะกร้าสินค้า
- ระบบชำระเงิน
- ติดตามคำสั่งซื้อ

---

## 📁 โครงสร้างโปรเจค

```
momx/
├── backend/                    # Backend API (Node.js/Express)
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── lineAuthController.js    # LINE authentication
│   │   │   ├── orderController.js       # Order + LINE notifications
│   │   │   └── ...
│   │   ├── models/
│   │   │   └── User.js                  # User model + LINE profile
│   │   ├── routes/
│   │   │   ├── lineRoutes.js            # LINE auth routes
│   │   │   └── webhookRoutes.js         # LINE Bot webhook
│   │   ├── services/
│   │   │   └── lineBotService.js        # LINE Messaging API
│   │   └── index.js
│   ├── config/
│   │   └── .env                         # Environment variables
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   ├── liff.html                    # หน้า LIFF หลัก
│   │   ├── assets/js/
│   │   │   └── liff-app.js              # LIFF JavaScript
│   │   └── ...
│   └── package.json
│
├── LINE_SETUP_GUIDE.md                  # คู่มือตั้งค่า LINE
├── docker-compose.yml
└── README.md
```

---

## 🚀 การติดตั้ง

### Prerequisites

- Node.js 18+
- MongoDB 6+
- LINE Developers Account
- Domain พร้อม SSL (สำหรับ Production)

### 1. Clone Repository

```bash
git clone https://github.com/treventator/momx.git
cd momx
```

### 2. ติดตั้ง Dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3. ตั้งค่า Environment Variables

สร้างไฟล์ `backend/config/.env`:

```env
# ===========================================
# Server Configuration
# ===========================================
NODE_ENV=development
PORT=4455

# ===========================================
# Database
# ===========================================
MONGODB_URI=mongodb://localhost:27017/tanyarat_shop

# ===========================================
# JWT
# ===========================================
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters

# ===========================================
# Frontend URL (for CORS)
# ===========================================
FRONTEND_URL=http://localhost:3000

# ===========================================
# LINE Configuration (สำคัญมาก!)
# ===========================================

# LINE Login Channel ID (จาก LINE Developers Console)
LINE_CHANNEL_ID=your_line_login_channel_id

# LINE Login Channel Secret
LINE_CHANNEL_SECRET=your_line_login_channel_secret

# LIFF ID (สร้างจาก LINE Login Channel > LIFF tab)
LIFF_ID=your_liff_id

# LINE Messaging API Channel Access Token
# (จาก Messaging API Channel ที่สร้างแยก)
LINE_CHANNEL_ACCESS_TOKEN=your_very_long_channel_access_token

# ===========================================
# Optional: Redis (for caching)
# ===========================================
REDIS_HOST=localhost
REDIS_PORT=6379
CACHE_ENABLED=false
```

### 4. รันระบบ (Development)

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

---

## 🔧 การตั้งค่า LINE LIFF (สำคัญ)

### ขั้นตอนที่ 1: สร้าง LINE Login Channel

1. ไปที่ [LINE Developers Console](https://developers.line.biz/console/)
2. สร้าง **Provider** ใหม่ (ถ้ายังไม่มี)
3. กด **Create a new channel** → เลือก **LINE Login**
4. กรอกข้อมูล:

| Field | Value |
|-------|-------|
| Channel name | `TANYARAT Member` |
| Channel description | `ระบบสมาชิกร้าน TANYARAT` |
| App types | ☑️ Web app |
| Email | อีเมลของคุณ |

5. กด **Create**

### ขั้นตอนที่ 2: ดึง Credentials

ไปที่ tab **Basic settings**:

```
Channel ID     → ใส่ใน .env เป็น LINE_CHANNEL_ID
Channel secret → ใส่ใน .env เป็น LINE_CHANNEL_SECRET
```

### ขั้นตอนที่ 3: สร้าง LIFF App

1. ไปที่ tab **LIFF**
2. กด **Add**
3. กรอกข้อมูล:

| Field | Value |
|-------|-------|
| LIFF app name | `TANYARAT Member` |
| Size | `Full` |
| Endpoint URL | `https://yourdomain.com/liff.html` |
| Scopes | ☑️ profile, ☑️ openid, ☑️ email |
| Bot link feature | `On (Aggressive)` |

4. กด **Add**
5. Copy **LIFF ID** → ใส่ใน:
   - `.env` เป็น `LIFF_ID`
   - `frontend/public/assets/js/liff-app.js` บรรทัดที่ 7

### ขั้นตอนที่ 4: สร้าง Messaging API Channel (สำหรับ Bot)

1. กลับไปหน้า Provider
2. กด **Create a new channel** → เลือก **Messaging API**
3. กรอกข้อมูล:

| Field | Value |
|-------|-------|
| Channel name | `TANYARAT Bot` |
| Channel description | `บอทแจ้งเตือนร้าน TANYARAT` |
| Category | Shopping |

4. กด **Create**

### ขั้นตอนที่ 5: ตั้งค่า Webhook

ไปที่ tab **Messaging API**:

1. **Webhook URL**: `https://yourdomain.com/api/webhooks/line`
2. **Use webhook**: ☑️ เปิด
3. กด **Verify** เพื่อทดสอบ
4. กด **Issue** ที่ Channel access token → Copy ใส่ `.env`

### ขั้นตอนที่ 6: ปิด Auto-reply

1. กดลิงก์ไป **LINE Official Account Manager**
2. ไปที่ **ตอบกลับอัตโนมัติ** → ปิดทั้งหมด
3. ไปที่ **ข้อความต้อนรับ** → ปิด

### ขั้นตอนที่ 7: เชื่อมต่อ LIFF กับ Bot

1. กลับไป LINE Login Channel
2. ไปที่ **LIFF** → เลือก LIFF app
3. ที่ **Linked OA** → เลือก Bot ที่สร้าง
4. บันทึก

---

## 🌐 การ Deploy Production

### Option 1: VPS (Recommended)

#### 1. เตรียม Server

```bash
# Ubuntu 22.04
sudo apt update && sudo apt upgrade -y

# ติดตั้ง Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# ติดตั้ง MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt update && sudo apt install -y mongodb-org
sudo systemctl start mongod && sudo systemctl enable mongod

# ติดตั้ง Nginx
sudo apt install -y nginx

# ติดตั้ง Certbot (SSL)
sudo apt install -y certbot python3-certbot-nginx
```

#### 2. Clone และติดตั้ง

```bash
cd /var/www
sudo git clone https://github.com/treventator/momx.git
cd momx

# Backend
cd backend
sudo npm install --production
sudo cp config/.env.example config/.env
sudo nano config/.env  # แก้ไขค่าต่างๆ

# Frontend
cd ../frontend
sudo npm install --production
```

#### 3. ตั้งค่า PM2

```bash
sudo npm install -g pm2

# รัน Backend
cd /var/www/momx/backend
pm2 start src/index.js --name "tanyarat-api"
pm2 save
pm2 startup
```

#### 4. ตั้งค่า Nginx

สร้างไฟล์ `/etc/nginx/sites-available/tanyarat`:

```nginx
# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/momx/frontend/public;
    index index.html;

    # LIFF route
    location /liff.html {
        try_files $uri $uri/ =404;
    }

    # Static files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API Proxy
    location /api {
        proxy_pass http://localhost:4455;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/tanyarat /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 5. ติดตั้ง SSL (สำคัญ - LIFF ต้องใช้ HTTPS)

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

#### 6. อัพเดท LINE Settings

กลับไป LINE Developers Console:

1. **LIFF Endpoint URL**: `https://yourdomain.com/liff.html`
2. **Webhook URL**: `https://yourdomain.com/api/webhooks/line`
3. กด **Verify** อีกครั้ง

---

### Option 2: Docker Compose

#### 1. สร้าง `.env` สำหรับ Production

```env
NODE_ENV=production
MONGODB_URI=mongodb://mongo:27017/tanyarat_shop
# ... (เหมือนข้างบน)
```

#### 2. รัน Docker Compose

```bash
docker-compose -f docker-compose.yml up -d --build
```

#### 3. ตั้งค่า Reverse Proxy (Nginx/Traefik)

ใช้ Nginx หรือ Traefik เป็น reverse proxy พร้อม SSL

---

### Option 3: Cloud Platform

#### Vercel + MongoDB Atlas

**Frontend (Vercel):**
```bash
cd frontend
vercel deploy --prod
```

**Backend (Railway/Render):**
1. สร้าง Project ใน Railway/Render
2. เชื่อมต่อ GitHub repo
3. ตั้งค่า Environment Variables
4. Deploy

---

## 📡 API Endpoints

### LINE Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/line/auth` | Login/Register ผ่าน LINE LIFF |
| POST | `/api/line/verify` | Verify ID Token |
| GET | `/api/line/me` | ดึงข้อมูลโปรไฟล์ (ต้อง auth) |
| PUT | `/api/line/profile` | อัพเดทโปรไฟล์ (ต้อง auth) |

### LINE Bot Webhook

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/webhooks/line` | รับ events จาก LINE |

### Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/shop/products` | รายการสินค้าทั้งหมด |
| GET | `/api/shop/products/:id` | รายละเอียดสินค้า |
| GET | `/api/shop/products/featured` | สินค้าแนะนำ |

### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/shop/orders` | สร้างคำสั่งซื้อ |
| GET | `/api/shop/orders` | ประวัติคำสั่งซื้อ |
| GET | `/api/shop/orders/:id` | รายละเอียดคำสั่งซื้อ |

### Cart

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/shop/cart` | ดูตะกร้า |
| POST | `/api/shop/cart` | เพิ่มสินค้า |
| PUT | `/api/shop/cart/:id` | แก้ไขจำนวน |
| DELETE | `/api/shop/cart/:id` | ลบสินค้า |

---

## 🧪 การทดสอบ

### ทดสอบ LIFF (Browser)

```
https://liff.line.me/YOUR_LIFF_ID
```

### ทดสอบ LIFF (LINE App)

1. เปิด LINE → แชทกับ Bot
2. พิมพ์ `บัญชี` หรือกดปุ่มใน Rich Menu
3. หน้า LIFF จะเปิดใน LINE App

### ทดสอบ Webhook

```bash
curl -X POST https://yourdomain.com/api/webhooks/line \
  -H "Content-Type: application/json" \
  -H "X-Line-Signature: test" \
  -d '{"events":[]}'
```

### ทดสอบ LINE Auth API

```bash
# ใช้ Access Token จาก LIFF
curl -X POST https://yourdomain.com/api/line/auth \
  -H "Content-Type: application/json" \
  -d '{"accessToken": "YOUR_LINE_ACCESS_TOKEN"}'
```

---

## 🔍 Troubleshooting

### ❌ LIFF ไม่โหลด

**สาเหตุ:** LIFF ID ไม่ถูกต้อง หรือ Endpoint URL ไม่ใช่ HTTPS

**แก้ไข:**
1. ตรวจสอบ LIFF ID ใน `liff-app.js`
2. ตรวจสอบว่า Endpoint URL เป็น HTTPS
3. ตรวจสอบว่า domain ตรงกับที่ลงทะเบียน

### ❌ Webhook ไม่ทำงาน

**สาเหตุ:** Signature verification failed

**แก้ไข:**
1. ตรวจสอบ `LINE_CHANNEL_SECRET` ใน `.env`
2. ใช้ Channel Secret จาก **Messaging API Channel** (ไม่ใช่ LINE Login)
3. กด Verify ใน LINE Developers Console

### ❌ ได้ Error "Invalid LINE channel"

**สาเหตุ:** Channel ID ไม่ตรงกัน

**แก้ไข:**
1. ใช้ Channel ID จาก **LINE Login Channel**
2. ตรวจสอบว่า `.env` บันทึกถูกต้อง

### ❌ Bot ไม่ส่งข้อความ

**สาเหตุ:** Channel Access Token หมดอายุ หรือไม่ถูกต้อง

**แก้ไข:**
1. ไป Messaging API Channel
2. กด **Issue** เพื่อสร้าง token ใหม่
3. อัพเดท `.env` และ restart server

### ❌ ผู้ใช้ไม่ได้รับแจ้งเตือน

**สาเหตุ:** ผู้ใช้ยังไม่ได้ add Bot เป็นเพื่อน

**แก้ไข:**
1. ตรวจสอบว่า LIFF เชื่อมกับ Bot แล้ว (Linked OA)
2. ตั้ง Bot link feature เป็น `On (Aggressive)`

---

## 📚 เอกสารอ้างอิง

- [LINE LIFF Documentation](https://developers.line.biz/en/docs/liff/)
- [LINE Messaging API](https://developers.line.biz/en/docs/messaging-api/)
- [LINE Login](https://developers.line.biz/en/docs/line-login/)

---

## 📄 License

© 2024 TANYARAT. All Rights Reserved.

---

## 👥 Contributors

- **Teemmer** - Developer

---

## 🆘 Support

หากพบปัญหา กรุณาสร้าง [Issue](https://github.com/treventator/momx/issues) หรือติดต่อ:
- LINE: @tanyarat
- Email: support@tanyarat.com

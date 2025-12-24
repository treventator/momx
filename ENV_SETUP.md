# 🔧 Environment Variables Setup

สร้างไฟล์ `.env` ที่ root ของ project แล้วกำหนดค่าตามนี้:

## 📝 สร้างไฟล์ .env

```bash
touch .env
```

## ⚙️ ค่าที่ต้องตั้ง

```env
# ===========================================
# Application Settings
# ===========================================
NODE_ENV=development
PORT=4455
FRONTEND_URL=http://localhost:8080

# ===========================================
# JWT Configuration (Required)
# ===========================================
# ต้องเปลี่ยนใน Production! ใช้ string ยาวอย่างน้อย 32 ตัวอักษร
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_EXPIRE=30d

# ===========================================
# MongoDB Configuration
# ===========================================
# Development (Docker)
MONGO_URI=mongodb://mongo:27017/momx_shop

# Production with authentication
# MONGO_URI=mongodb://username:password@mongo:27017/momx_shop?authSource=admin
# MONGO_ROOT_USER=admin
# MONGO_ROOT_PASSWORD=your-secure-password

# ===========================================
# Redis Configuration
# ===========================================
CACHE_ENABLED=true
REDIS_HOST=redis
REDIS_PORT=6379

# ===========================================
# LINE Configuration (Required for LINE features)
# ===========================================
# 1. ไปที่ https://developers.line.biz/console/
# 2. สร้าง Provider และ Channel

# LINE Login Channel (สำหรับ LIFF)
LINE_CHANNEL_ID=1234567890
LINE_CHANNEL_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# LINE Messaging API Channel (สำหรับ Bot)
LINE_CHANNEL_ACCESS_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# LIFF App ID (สร้างใน LINE Developers Console > LIFF)
LIFF_ID=1234567890-xxxxxxxx

# ===========================================
# Optional: Email Configuration
# ===========================================
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASS=your-app-password
# EMAIL_FROM=noreply@momx.com

# ===========================================
# Optional: Payment Configuration
# ===========================================
# STRIPE_SECRET_KEY=sk_test_xxxxx
# PROMPTPAY_ID=0812345678
```

## 🚀 การใช้งาน

### Development
```bash
# รัน Docker Compose
docker-compose up -d

# ดู logs
docker-compose logs -f backend
```

### Production
```bash
# รัน Production compose
docker-compose -f docker-compose.prod.yml up -d

# ตรวจสอบสถานะ
docker-compose -f docker-compose.prod.yml ps
```

## 🔒 Security Checklist สำหรับ Production

- [ ] เปลี่ยน `JWT_SECRET` เป็น random string ที่ปลอดภัย
- [ ] ตั้งค่า `MONGO_ROOT_PASSWORD` ที่ซับซ้อน
- [ ] ใช้ HTTPS สำหรับ Frontend
- [ ] ตั้งค่า `FRONTEND_URL` เป็น domain จริง
- [ ] เปิด firewall และจำกัด port ที่เปิดใช้งาน
- [ ] ตั้งค่า rate limiting
- [ ] เปิด SSL สำหรับ MongoDB (ถ้าใช้ cloud)

## 📱 LINE Developer Console Setup

1. **สร้าง Provider**
   - ไปที่ https://developers.line.biz/console/
   - กด "Create new provider"

2. **สร้าง LINE Login Channel**
   - เลือก Provider ที่สร้าง
   - กด "Create new channel" > "LINE Login"
   - Copy `Channel ID` และ `Channel Secret`

3. **สร้าง Messaging API Channel**
   - กด "Create new channel" > "Messaging API"
   - ไปที่ tab "Messaging API"
   - Copy `Channel access token`

4. **สร้าง LIFF App**
   - ไปที่ LINE Login Channel
   - กด tab "LIFF"
   - กด "Add" เพื่อสร้าง LIFF App
   - ตั้งค่า Endpoint URL เป็น URL ของ frontend
   - Copy `LIFF ID`

## 🧪 ทดสอบ Configuration

```bash
# ทดสอบ Backend
curl http://localhost:4455/health

# ทดสอบ MongoDB connection
docker exec -it momx-mongo mongosh --eval "db.adminCommand('ping')"

# ทดสอบ Redis
docker exec -it momx-redis redis-cli ping
```


# 📱 คู่มือการตั้งค่า LINE LIFF สำหรับ TANYARAT Shop

## 📋 สิ่งที่ต้องเตรียม

1. LINE Developers Account (https://developers.line.biz/)
2. Domain ที่ใช้งานจริง (ต้องเป็น HTTPS)
3. SSL Certificate

---

## 🔧 ขั้นตอนการตั้งค่า

### ขั้นตอนที่ 1: สร้าง Provider

1. ไปที่ https://developers.line.biz/console/
2. กด **Create** เพื่อสร้าง Provider ใหม่
3. ตั้งชื่อ Provider เช่น `TANYARAT Shop`

---

### ขั้นตอนที่ 2: สร้าง LINE Login Channel (สำหรับ LIFF)

1. เลือก Provider ที่สร้างไว้
2. กด **Create a new channel** → เลือก **LINE Login**
3. กรอกข้อมูล:
   - **Channel name**: `TANYARAT Member`
   - **Channel description**: `ระบบสมาชิกร้าน TANYARAT`
   - **App types**: ☑️ Web app
   - **Email address**: อีเมลของคุณ
4. กด **Create**

#### ตั้งค่า Channel:
1. ไปที่ tab **Basic settings**
   - Copy **Channel ID** → ใส่ใน `.env` เป็น `LINE_CHANNEL_ID`
   - Copy **Channel secret** → ใส่ใน `.env` เป็น `LINE_CHANNEL_SECRET`

2. ไปที่ tab **LINE Login**
   - เปิด **Email address permission** (ถ้าต้องการ)

---

### ขั้นตอนที่ 3: สร้าง LIFF App

1. ไปที่ tab **LIFF**
2. กด **Add**
3. กรอกข้อมูล:
   - **LIFF app name**: `TANYARAT Member`
   - **Size**: `Full` (แนะนำ)
   - **Endpoint URL**: `https://yourdomain.com/liff.html`
   - **Scopes**: 
     - ☑️ `profile`
     - ☑️ `openid`
     - ☑️ `email` (ถ้าต้องการ)
   - **Bot link feature**: `On (Aggressive)` หรือ `On (Normal)`
4. กด **Add**
5. Copy **LIFF ID** → ใส่ใน:
   - `.env` เป็น `LIFF_ID`
   - `frontend/public/assets/js/liff-app.js` บรรทัด `const LIFF_ID = 'YOUR_LIFF_ID_HERE'`

---

### ขั้นตอนที่ 4: สร้าง Messaging API Channel (สำหรับ Bot)

1. กลับไปที่หน้า Provider
2. กด **Create a new channel** → เลือก **Messaging API**
3. กรอกข้อมูล:
   - **Channel name**: `TANYARAT Bot`
   - **Channel description**: `บอทแจ้งเตือนร้าน TANYARAT`
   - **Category**: `Shopping`
   - **Subcategory**: เลือกที่เหมาะสม
4. กด **Create**

#### ตั้งค่า Channel:
1. ไปที่ tab **Messaging API**
2. **Webhook settings**:
   - **Webhook URL**: `https://yourdomain.com/api/webhooks/line`
   - **Use webhook**: เปิด ☑️
   - **Webhook redelivery**: เปิด ☑️ (แนะนำ)
3. กด **Verify** เพื่อทดสอบ webhook
4. **Channel access token**:
   - กด **Issue** เพื่อสร้าง token
   - Copy token → ใส่ใน `.env` เป็น `LINE_CHANNEL_ACCESS_TOKEN`

#### ตั้งค่า Auto-reply:
1. ไปที่ **LINE Official Account Manager** (กดลิงก์ในหน้า)
2. ปิด **Auto-reply messages** (ให้ Bot จัดการเอง)
3. ปิด **Greeting messages** (ให้ Bot จัดการเอง)

---

### ขั้นตอนที่ 5: เชื่อมต่อ LIFF กับ Bot

1. กลับไปที่ LINE Login Channel
2. ไปที่ tab **LIFF** → เลือก LIFF app ที่สร้าง
3. ที่ **Linked OA** → เลือก Bot ที่สร้างไว้
4. บันทึก

---

## 📝 ไฟล์ที่ต้องแก้ไข

### 1. Backend `.env`

```env
# LINE Configuration
LINE_CHANNEL_ID=1234567890
LINE_CHANNEL_SECRET=abcdef1234567890
LIFF_ID=1234567890-abcdefgh
LINE_CHANNEL_ACCESS_TOKEN=very_long_token_here
```

### 2. Frontend `liff-app.js`

```javascript
const LIFF_ID = '1234567890-abcdefgh'; // เปลี่ยนเป็น LIFF ID จริง
```

### 3. อัพเดท Domain URLs

ค้นหาและเปลี่ยน `https://yourdomain.com` ในไฟล์เหล่านี้:
- `backend/src/services/lineBotService.js`
- `backend/src/routes/webhookRoutes.js`
- `frontend/public/assets/js/liff-app.js`

---

## 🧪 การทดสอบ

### ทดสอบ LIFF (บน Browser)

1. เปิด URL: `https://liff.line.me/YOUR_LIFF_ID`
2. จะถูก redirect ไปหน้า LINE Login
3. Login สำเร็จจะเห็นหน้า Member

### ทดสอบ LIFF (บน LINE App)

1. เปิด LINE Chat กับ Bot
2. พิมพ์ `บัญชี` หรือกดปุ่มใน Rich Menu
3. จะเปิดหน้า LIFF ใน LINE App

### ทดสอบ Webhook

```bash
curl -X POST https://yourdomain.com/api/webhooks/line \
  -H "Content-Type: application/json" \
  -H "X-Line-Signature: test" \
  -d '{"events":[]}'
```

---

## 🔒 Security Checklist

- [ ] ใช้ HTTPS เท่านั้น
- [ ] เก็บ secrets ใน `.env` (อย่า commit ลง git)
- [ ] Verify LINE signature ทุกครั้งใน webhook
- [ ] ตั้ง CORS ให้ถูกต้อง
- [ ] Rate limiting สำหรับ API

---

## 🐛 Troubleshooting

### LIFF ไม่โหลด
- ตรวจสอบว่า LIFF ID ถูกต้อง
- ตรวจสอบว่า Endpoint URL ถูกต้องและเป็น HTTPS

### Webhook ไม่ทำงาน
- ตรวจสอบว่า webhook URL ถูกต้อง
- ตรวจสอบว่า Channel Secret ถูกต้อง
- ดู logs ใน server

### ได้ Error "Invalid LINE channel"
- ตรวจสอบว่า Channel ID ใน `.env` ตรงกับ LINE Login Channel

---

## 📞 ความช่วยเหลือ

- LINE Developers Documentation: https://developers.line.biz/en/docs/
- LIFF Documentation: https://developers.line.biz/en/docs/liff/
- LINE Messaging API: https://developers.line.biz/en/docs/messaging-api/


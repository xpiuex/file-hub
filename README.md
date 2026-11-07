# AskFile

เว็บจัดเก็บและแชร์ไฟล์งาน (HTML + JavaScript ล้วน) ใช้ Supabase เก็บข้อมูลและไฟล์ และ Firebase Auth สำหรับล็อกอินด้วย Google

## ไฟล์
- `index.html` โครงสร้างหน้า
- `app.js` ตรรกะหลัก (การเชื่อมฐานข้อมูล สิทธิ์ ไฟล์ โน้ต การดาวน์โหลด)
- `i18n.js` ข้อความไทยและอังกฤษ
- `styles.css` สไตล์ (กระจก พื้นหลังไล่สี อนิเมชัน)
- `dots.js` พื้นหลังจุดของหน้าแรก
- `theme.js` ธีมมืด/สว่าง
- `tailwind-config.js` การตั้งค่าสีและฟอนต์

## การตั้งค่าก่อนใช้งาน
1. **Firebase:** เปิด Google ใน Sign-in method เพิ่มโดเมนใน Authorized domains และใส่ค่า `FIREBASE_CONFIG` ใน `app.js`
2. **Supabase:** เพิ่ม Firebase เป็น Third-Party Auth โดยใส่ Project ID ของ Firebase
3. **ฐานข้อมูล:** รันชุด SQL ของตาราง `files`, `projects`, `share_links`, `notes`, `allowed_emails` และ policy ที่เกี่ยวข้อง
4. **สิทธิ์:** เพิ่มอีเมลใน `allowed_emails` พร้อมระดับ `admin` หรือ `uploader`

## การรัน
เปิดผ่าน `https://` หรือ `http://localhost` เท่านั้น เพราะใช้ ES module และ `crypto.subtle`

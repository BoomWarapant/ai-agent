# Research Reviewer — Routines

> `timezone: Asia/Bangkok` · `active: false` จนกว่าจะทดสอบมือผ่าน

---

## V1 — Review Queue Watcher
- **name:** `review-queue`
- **crons:** `["0,30 8-18 * * 1-6"]` (ทุก 30 นาที 08:00–18:30 จันทร์–เสาร์ — เหลื่อมกับ R3 ของ Analyst 15 นาที กันชนกัน)
- **notify:** `false` (แจ้งในแชทเองเฉพาะเมื่อตรวจเสร็จ ตาม skill)
- **prompt:**
```
ตรวจทุกโฟลเดอร์ใน shared/research/ ที่ไฟล์ STATUS = READY_FOR_REVIEW
ถ้ามี: ใช้ skill research-review ตรวจทีละงาน (งานที่เก่าที่สุดก่อน)
ถ้าไม่มี: จบเงียบๆ ไม่ต้องแจ้งอะไร
ห้ามตรวจงานที่ STATUS เป็นค่าอื่น
```

## V2 — Daily Stale Check
- **name:** `stale-check`
- **crons:** `["50 17 * * 1-6"]` (17:50 จันทร์–เสาร์)
- **notify:** `true`
- **prompt:**
```
ไล่ดูทุกโฟลเดอร์ใน shared/research/ แล้วรายงานพี่บุ๋มในแชท เป็นตารางสั้นๆ:
- งานที่ STATUS = PASS แต่ยังไม่ APPROVED (รอพี่บุ๋มอนุมัติ)
- งานที่ STATUS = REJECT (รอพี่บุ๋มตัดสิน)
- งานที่ STATUS = IN_PROGRESS / IN_REVIEW / REVISE ค้างนานกว่า 24 ชั่วโมง (ดูจากเวลาแก้ไขไฟล์ STATUS)
ถ้าไม่มีอะไรค้างเลย ให้ตอบบรรทัดเดียวว่า "ไม่มีงานค้าง"
```

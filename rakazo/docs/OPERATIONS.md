# OPERATIONS — ใช้งานประจำวัน, สำรอง, กู้คืน, แก้ปัญหา

## เปิด / ปิด
| งาน | คำสั่ง |
|---|---|
| เปิดแอป | ดับเบิลคลิกไอคอน **Rakazo** (ปลุก WSL + `up -d` + เปิดหน้าต่าง) |
| สถานะ (หน้าต่าง A) | `dc ps` · `bash $REPO/scripts/wsl/verify.sh` |
| หยุดชั่วคราว | `dc stop` (ข้อมูลอยู่ครบ — แต่จะไม่เปิดเองจนกว่าจะ `dc up -d` หรือกดไอคอน) |
| log | `dc logs --tail 200 worker` (หรือ api / supervisor / web) |

ระบบเปิดเองอัตโนมัติเมื่อ WSL บูต: docker (systemd enabled) → container (`restart: unless-stopped`) — แต่ **Windows ไม่ปลุก WSL ให้เอง** ต้องกดไอคอน หรือใช้ `create-shortcut.ps1 -Startup`

## ⛔ ห้ามทำ
- `docker compose down -v` / `docker volume rm` / `docker system prune` → ลบฐานข้อมูลและบอททั้งหมด
- `bash install-images.sh` เพื่อเปิดระบบ → ไม่โหลด override (hotfix + ฟอนต์ไทยหาย)
- เปิด port 5173/3100 ออก LAN/internet โดยไม่มี HTTPS + การยืนยันตัวตน (R2)
- `wsl --shutdown` โดยไม่ตรวจบริการอื่นใน WSL

## สำรองข้อมูล (หน้าต่าง A)
```bash
bash $REPO/scripts/wsl/backup.sh            # → ~/backups/rakazo-<เวลา>/
```
ได้: `rakazo.dump` (pg_dump) · `appdata.tgz` (home บอท/ไฟล์) · `env.backup` (มี ENCRYPTION_KEY — ต้องใช้คู่กับ dump) · override
**เก็บในเครื่อง/ที่เข้ารหัสเท่านั้น ห้าม commit ห้ามแชร์**

## กู้คืน (R2 — เขียนทับฐานข้อมูลทั้งหมด, ทำบนระบบที่หยุดแล้ว)
> ยังไม่ได้ทดสอบกู้คืนจริงใน pilot — ทดสอบบนเครื่องทดลองก่อนใช้จริง
```bash
B=~/backups/rakazo-<ชุด>
cp $B/env.backup ~/rakazo/.env          # ใช้ secret ชุดเดียวกับตอนสำรอง
dc stop
dc up -d --wait postgres
docker exec -i rakazo-postgres-1 pg_restore -U rakazo -d rakazo --clean --if-exists < $B/rakazo.dump
docker run --rm -v rakazo_appdata:/data -v "$B":/in:ro busybox:1 sh -c 'rm -rf /data/* && tar xzf /in/appdata.tgz -C /data'
dc up -d --wait
bash $REPO/scripts/wsl/verify.sh
```

## ย้ายไปเครื่องใหม่
1. เครื่องเดิม: `backup.sh` → คัดลอกโฟลเดอร์ backup ไปเครื่องใหม่ด้วยช่องทางที่ปลอดภัย
2. เครื่องใหม่: ทำ INSTALL.md ขั้น 0–7 ครบ (ยังไม่สร้างบัญชีในหน้าเว็บ)
3. กู้คืนตามหัวข้อด้านบน → login ด้วยบัญชีเดิม → ทดสอบตาม BOT-SETUP.md ข้อ 4
- ถ้าเครื่องเดิมมีแค่บอททดสอบ: ติดตั้งใหม่แบบสะอาดง่ายกว่า (ข้ามขั้น 1 และ 3)

## อัปเกรด Rakazo (ถามก่อนทุกครั้ง)
1. `backup.sh`
2. อ่าน release notes: แก้ #808 / #875 / #876 แล้วหรือยัง → ถ้าแก้แล้ว ถอด hotfix ออกจาก override · รองรับแนบไฟล์ .xlsx/.docx/.pptx แล้วหรือยัง (ดู `packages/contracts/src/attachments.ts`) → ถ้ารองรับ ถอด mount `contracts-attachments.ts`/`core-attachments.ts`, บล็อก `web:` (image `crd/app:*-office`) ใน override และขั้น 4b/5b ใน `30-install-rakazo.sh`
3. แก้ `RAKAZO_TAG` ใน `scripts/wsl/common.sh`, build `crd/computer:<tag>-th` ใหม่ (แก้ `FROM` ใน `computer-th/Dockerfile`)
4. hotfix ผูกกับ v0.1.6 — **ห้ามใช้ hotfix เดิมกับเวอร์ชันใหม่โดยไม่ตรวจ**
5. ทดสอบด้วย `verify.sh` + ชุดทดสอบ

## แก้ปัญหา
| อาการ | ตรวจ/แก้ |
|---|---|
| เปิดไอคอนแล้วไม่มีอะไรขึ้น | รัน `powershell -ExecutionPolicy Bypass -File <repo>\scripts\windows\rakazo-start.ps1` เพื่อดู error |
| บอทใช้ web_search/web_fetch แล้ว error `invalid onRequestStart` | override ไม่ถูกโหลด → `dc up -d` แล้ว `verify.sh` |
| เว็บไทยในจอบอทเป็นกล่อง | `docker exec rakazo-supervisor-1 printenv RAKAZO_COMPUTER_IMAGE` ต้องเป็น `crd/computer:v0.1.6-th` |
| ชื่อบัญชีผิด (หน้าเว็บแก้ไม่ได้) | สำรอง DB ก่อน แล้ว `UPDATE "user" SET name='...' WHERE email='...' RETURNING name;` ผ่าน `docker exec -i rakazo-postgres-1 psql -U rakazo -d rakazo` (ตาราง `"user"` ยืนยันจาก schema v0.1.6) |
| บอทรายงานว่าทำแล้วแต่ไม่จริง | ดู BOT-SETUP.md — กติกาการรายงาน + Thinking high + ตรวจจากจอสด |

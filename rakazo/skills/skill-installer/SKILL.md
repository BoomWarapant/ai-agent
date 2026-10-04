---
name: skill-installer
description: ติดตั้งหรืออัปเดต skill (Claude Agent Skill แบบโฟลเดอร์ที่มี SKILL.md + scripts/references/assets) ให้บอททุกตัวใช้ได้ ใช้เมื่อผู้ใช้ขอ ติดตั้ง skill, เพิ่ม skill, อัปเดต skill, install skill, หรือให้ลิงก์ repo/โฟลเดอร์ของ skill
---
# skill-installer — ติดตั้ง skill แบบโฟลเดอร์

Skill ใน Rakazo เก็บได้แค่ข้อความ SKILL.md ไฟล์ประกอบ (scripts/, references/, assets/) จึงเก็บไว้ที่ `~/shared/skills/<ชื่อ>/`
แล้วลงทะเบียน "skill ตัวชี้" ที่บอกให้บอทอ่านไฟล์เต็มจากโฟลเดอร์นั้น

## 0. skill ที่ติดตั้งมากับระบบ
- skill ของ CRD ถูกฝังไว้ใน `/opt/crd-skills/<ชื่อ>/` และขึ้นเป็น built-in ให้ทุกบัญชีแล้ว (อ่านอย่างเดียว) — ไม่ต้องติดตั้งซ้ำ
- จะอัปเดตหรือเพิ่ม skill ถาวรให้ทุกเครื่อง → แจ้งผู้ดูแลรัน `CRD_SKILLS_DIR=... bash scripts/wsl/build-skills.sh --apply` (ชุดติดตั้ง rakazo)

## 1. หาไฟล์ skill (ติดตั้งเพิ่มเฉพาะ workspace นี้)
- มีอยู่แล้วใน `~/shared/skills/<ชื่อ>/` → ข้ามไปข้อ 2
- ผู้ใช้ให้ลิงก์ GitHub แบบ public → `curl -fsSL https://codeload.github.com/<owner>/<repo>/tar.gz/<branch> | tar -xz -C /tmp` แล้วคัดลอกโฟลเดอร์ที่มี SKILL.md ไป `~/shared/skills/<ชื่อ>/`
- ผู้ใช้แนบไฟล์ SKILL.md (และไฟล์ .md/.csv/.json/.xlsx ประกอบ) ในแชต → บันทึกลง `~/shared/skills/<ชื่อ>/` ตามโครงสร้างที่ผู้ใช้บอก
- repo ส่วนตัว / ลิงก์เปิดไม่ได้ → ตอบว่า "ยังไม่สำเร็จ" พร้อม error จริง แล้วแนะนำให้ผู้ดูแลใช้ `build-skills.sh` ห้ามเดาเนื้อหา

## 2. ตรวจก่อนลงทะเบียน
- ต้องมี `SKILL.md` ที่มี frontmatter `name` (≤ 80 ตัวอักษร) และ `description` (≤ 2,000 ตัวอักษร)
- หา path ของ Windows (`C:\`, `D:\`) และ import ของ Python ใน `scripts/*.py` → ลอง `python3 -c "import <lib>"` แจ้งผู้ใช้ถ้าไลบรารีไหนไม่มี (ติดตั้งเองไม่ได้ ต้องให้ผู้ดูแลเพิ่มใน image `crd/computer`)
- ถ้ามีไฟล์ที่ดูเป็นข้อมูลลับ (รายชื่อพนักงาน, เลขผู้ขาย, รหัสผ่าน, API key) → หยุดและถามผู้ใช้ก่อน

## 3. ลงทะเบียน
- ใช้ `skill_list` ดูก่อนว่ามีชื่อนี้แล้วหรือยัง: ยังไม่มี → `skill_create` · มีแล้ว → `skill_update`
- ส่ง `name` และ `description` ตาม frontmatter เดิม และ `body` เป็นตัวชี้ทางตามแม่แบบนี้ (แทน <ชื่อ>):
  "ไฟล์ทั้งหมดของ skill นี้อยู่ที่ ~/shared/skills/<ชื่อ>/ · ก่อนเริ่มงานให้ `cat ~/shared/skills/<ชื่อ>/SKILL.md` แล้วทำตาม ·
   path relative นับจากโฟลเดอร์นี้ · path Windows เป็นตัวอย่าง ให้ใช้ไฟล์ที่ผู้ใช้แนบ · แปลง PowerShell เป็น bash/python3 ·
   ห้ามแก้ไฟล์ในโฟลเดอร์ skill · ผลลัพธ์ที่เป็นไฟล์ให้แนบด้วย attach_file"
- ห้ามใส่เนื้อหา SKILL.md ทั้งก้อนลงใน skill (ยาวและอัปเดตยาก)

## 4. รายงาน
สรุป: ชื่อ skill, สร้างใหม่/อัปเดต, ไฟล์ที่พบ, ไลบรารีที่ขาด, ข้อควรระวัง แล้วปิดด้วยบรรทัด "หลักฐาน:" ตามกติกา

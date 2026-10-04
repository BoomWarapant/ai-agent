# ระบบ Research (2 บอท) — Rakazo

> Draft v0.1 · 2026-10-04 · ใช้กับ Rakazo self-hosted (อิงโครงสร้างจาก source `elie222/rakazo`)

## โครงสร้าง

| บอท | หน้าที่ | ไฟล์ |
|---|---|---|
| **Research Analyst** | ค้นคว้า → วิเคราะห์ → สรุป insight → ทำรายงาน (4 ขั้นใน skill เดียว) | `research-analyst/` |
| **Research Reviewer** | ตรวจอิสระ: แหล่งอ้างอิง, ตัวเลข, ตรรกะ insight แล้วตัดสิน PASS / REVISE / REJECT | `research-reviewer/` |

## สิ่งที่ยืนยันจาก source code ของ Rakazo

| องค์ประกอบ | ข้อเท็จจริงใน Rakazo | ใช้ในชุดนี้ยังไง |
|---|---|---|
| Bot | มี `name`, `title`, `description`, `instructions` (ยาวได้ไม่เกิน 20,000 ตัวอักษร) | `*/instructions.md` → paste ลงช่อง Instructions |
| Skill | สร้างจาก `SKILL.md` ได้ (ไม่เกิน 100,000 ตัวอักษร) | `*/skills/*/SKILL.md` |
| Routine | = scheduled prompt: `name`, `prompt`, `crons`, `timezone` + trigger แบบ webhook / GitHub / message | `*/routines.md` |
| Team Computer | บอทใน workspace เดียวกันใช้ไฟล์ร่วมกันได้ — ของแต่ละบอทอยู่ใน `bots/<bot-id>/`, งานที่แชร์ใส่ `shared/` | ใช้ `shared/research/` เป็นจุดส่งต่องาน |

⚠️ **ข้อควรรู้:** โฟลเดอร์ใน Team Computer **ไม่ใช่** security boundary (ทุกบอทใน Team เข้าถึงได้ทั้งหมด) ห้ามเอาข้อมูลลับที่บอทอื่นไม่ควรเห็นใส่ใน workspace นี้

## Handoff Protocol (ส่งต่องานผ่าน `shared/`)

```
shared/research/<YYYYMMDD>-<slug>/
├── 00_brief.md          ← โจทย์ (คน หรือ Analyst เขียนจากที่ทวนกับคนแล้ว)
├── 01_sources.md        ← Analyst ขั้น 1
├── 02_analysis.md       ← Analyst ขั้น 2 (+ analysis/*.py, *.csv, charts/*.png)
├── 03_insights.md       ← Analyst ขั้น 3
├── 04_report.md         ← Analyst ขั้น 4 (+ ไฟล์ .docx/.pdf ถ้าสั่ง)
├── review.md            ← Reviewer เขียนผลตรวจ
└── STATUS               ← ไฟล์บรรทัดเดียว: สถานะงานปัจจุบัน
```

**ค่าใน `STATUS`** (เขียนค่าเดียว ตัวพิมพ์ใหญ่):

| ค่า | ใครเขียน | ความหมาย |
|---|---|---|
| `IN_PROGRESS` | Analyst | กำลังทำ |
| `READY_FOR_REVIEW` | Analyst | ทำครบ 4 ขั้นแล้ว รอตรวจ |
| `IN_REVIEW` | Reviewer | กำลังตรวจ (กันตรวจซ้ำ) |
| `REVISE` | Reviewer | ตีกลับ ให้ดู `review.md` |
| `PASS` | Reviewer | ผ่าน รอคนอนุมัติ |
| `REJECT` | Reviewer | โจทย์หรือข้อมูลใช้ไม่ได้ ต้องให้คนตัดสิน |
| `APPROVED` | **คนเท่านั้น** | อนุมัติส่งออก |

กติกา: ตีกลับได้ไม่เกิน **2 รอบ** ถ้ารอบที่ 3 ยังไม่ผ่าน Reviewer ตั้งเป็น `REJECT` แล้วแจ้งคน (กันวนไม่จบ)

## ขั้นตอน Setup

1. สร้าง workspace เดียวสำหรับ 2 บอทนี้ ใช้ **Team Computer**
2. สร้างบอท **Research Analyst** → paste `research-analyst/instructions.md` → เพิ่ม skill จาก `research-analyst/skills/research-report/SKILL.md`
3. สร้างบอท **Research Reviewer** → paste `research-reviewer/instructions.md` → เพิ่ม skill จาก `research-reviewer/skills/research-review/SKILL.md`
4. ตั้ง routine ตาม `routines.md` ของแต่ละบอท (timezone `Asia/Bangkok`) — ตั้ง `active: false` ไว้ก่อน เปิดหลังทดสอบมือผ่าน
5. Approval rules: Analyst ให้ขออนุมัติก่อน **ส่งอะไรออกนอก workspace** (อีเมล, โพสต์, อัปโหลด) · Reviewer ไม่ต้องใช้สิทธิ์ส่งออกเลย
6. Model: ทั้งสองบอทใช้ GPT ได้ ถ้าเลือกได้ ให้ Reviewer ใช้คนละรุ่นหรือคนละ provider กับ Analyst จะจับจุดบอดได้ดีกว่า (ไม่บังคับ)

## เกณฑ์ผ่าน Pilot (ต้องผ่านก่อนเปิด routine อัตโนมัติ)

| # | เกณฑ์ | วิธีวัด |
|---|---|---|
| 1 | Handoff ผ่าน `shared/` ทำงานได้จริง | Analyst เขียน `STATUS=READY_FOR_REVIEW` → Reviewer เห็นและตรวจได้ |
| 2 | ไม่มีตัวเลขที่ไม่มีแหล่งรองรับ | พี่สุ่มตรวจ 3 รายงาน ตรวจทุกตัวเลข = 0 ข้อผิด |
| 3 | Reviewer จับข้อผิดที่ตั้งใจฝังไว้ได้ | ฝังข้อผิด 5 จุดในรายงานทดสอบ (ตัวเลขผิด, ลิงก์ไม่ตรง, insight เกินข้อมูล) → จับได้ ≥ 4/5 |
| 4 | ไม่วนตีกลับเกิน 2 รอบ | ดู `review.md` ของงานทดสอบ |
| 5 | เครื่องรับไหว | ดู RAM ของ WSL ระหว่าง 2 บอทรันพร้อม oracle fleet |

## สมมติฐานที่ยังต้องทดสอบ

- Reviewer ใช้ routine แบบ cron ไล่เช็ก `STATUS` ทุก 30 นาที — ถ้าใน Rakazo ของพี่ใช้ group chat แล้ว @mention บอทได้ แบบนั้นจะเร็วกว่า (ไอ้ฟูยังไม่ได้ยืนยันว่า mention ทำให้บอทเริ่มทำงาน)
- การสร้าง `.docx`/`.pdf` ต้องมี `python-docx` / `pandoc` ใน computer — ถ้ายังไม่มี ให้ Analyst ติดตั้งครั้งแรก (Team Computer แชร์เครื่องมือที่ติดตั้งแล้ว)

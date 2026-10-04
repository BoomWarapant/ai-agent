# ai-agent

คลังชุดติดตั้ง เอกสาร และสคริปต์ของ **AI agent ที่ใช้กับงาน CRD** (บริษัท เชียงใหม่ริมดอย จำกัด (มหาชน))
เป้าหมาย: ติดตั้งซ้ำหรือย้ายไปเครื่องใหม่ได้ทีละขั้น โดยทุกขั้นมีจุดตรวจที่พิสูจน์ได้

## Agent ในคลังนี้

| โฟลเดอร์ | Agent | สถานะ | เริ่มอ่าน |
|---|---|---|---|
| [`rakazo/`](rakazo/README.md) | **Rakazo v0.1.6** — แพลตฟอร์ม AI teammate แบบ self-host (บอทมีเครื่องของตัวเอง, งานตั้งเวลา, กฎอนุมัติ) บน Windows 11 + WSL2 | ✅ Pilot ผ่าน (4 ต.ค. 2569) บนโน้ตบุ๊ก · แผนย้ายไปเครื่อง 24 ชม. ในออฟฟิศ | [INSTALL](rakazo/docs/INSTALL.md) |

## เริ่มต้นเร็ว (Rakazo)

```powershell
# PowerShell บน Windows
cd $env:USERPROFILE
git clone https://github.com/BoomWarapant/ai-agent.git
powershell -ExecutionPolicy Bypass -File .\ai-agent\rakazo\scripts\windows\check-machine.ps1
```
จากนั้นทำตาม [`rakazo/docs/INSTALL.md`](rakazo/docs/INSTALL.md) ตั้งแต่ขั้น 1

| เอกสาร | ใช้เมื่อ |
|---|---|
| [INSTALL.md](rakazo/docs/INSTALL.md) | ติดตั้งบนเครื่องใหม่ (ขั้น 0–8 + ปัญหาที่เจอจริง) |
| [BOT-SETUP.md](rakazo/docs/BOT-SETUP.md) | ตั้งโมเดล, instructions ของบอท, ชุดทดสอบ |
| [OPERATIONS.md](rakazo/docs/OPERATIONS.md) | เปิด/ปิด, สำรอง, กู้คืน, ย้ายเครื่อง, อัปเกรด, แก้ปัญหา |
| [DECISIONS.md](rakazo/docs/DECISIONS.md) | เหตุผลของการตั้งค่า + ตัวเลขที่วัดได้ |

## หลักการของคลังนี้

1. **ไม่มี secret ใน repo** — `.env`, API key, รหัสผ่าน, backup (`*.dump`, `*.tgz`) ถูกกันด้วย [`.gitignore`](.gitignore) · ตรวจ `git status` ก่อน commit ทุกครั้ง
2. **ทุกขั้นต้องมีจุดตรวจ** — สคริปต์แสดง `[PASS]/[FAIL]` · ห้ามสรุปว่า "น่าจะใช้ได้"
3. **ระบุระดับความเสี่ยง** — R0 อ่านอย่างเดียว · R1 แก้ได้ ย้อนกลับได้ · R2 กระทบข้อมูล ความลับ หรือระบบเดิม (ต้องอนุมัติก่อน)
4. **ไฟล์จากภายนอกไม่เก็บไว้ใน repo** — ดาวน์โหลดตอนติดตั้งจาก commit/tag ที่ล็อกไว้ + ตรวจ SHA-256 (ดู [`rakazo/NOTICE.md`](rakazo/NOTICE.md))
5. **ข้อมูลลับของ CRD ห้ามผ่านบัญชี AI ส่วนตัว** — ใช้ข้อมูลตัวอย่างหรือข้อมูลที่ตัดส่วนลับออกจนกว่าจะมีบัญชีระดับองค์กร

## รูปแบบไฟล์ (สำคัญเมื่อแก้บน Windows)

| ชนิด | รูปแบบ | เหตุผล |
|---|---|---|
| `*.sh`, `*.yml`, `checksums/*` | LF | CRLF ทำให้ bash และ checksum พัง ([`.gitattributes`](.gitattributes) บังคับให้แล้ว) |
| `*.ps1` | UTF-8 **with BOM** + CRLF | Windows PowerShell 5.1 อ่านภาษาไทยเพี้ยนถ้าไม่มี BOM |

## เพิ่ม agent ใหม่

สร้างโฟลเดอร์ระดับบนสุดตามชื่อ agent โดยใช้โครงเดียวกับ `rakazo/`:
```
<agent>/
├─ README.md        สรุป + สถานะการทดสอบ
├─ NOTICE.md        เครดิต/license ของสิ่งที่นำมาใช้
├─ docs/            INSTALL · OPERATIONS · DECISIONS
├─ config/          ไฟล์ตั้งค่า (ไม่มี secret)
├─ scripts/         wsl/ · windows/
└─ checksums/       SHA-256 ของไฟล์ที่ดึงจากภายนอก
```
แล้วเพิ่มแถวในตาราง "Agent ในคลังนี้" ด้านบน

## ข้อจำกัดที่ควรรู้

- สคริปต์ของ Rakazo รวบรวมจากคำสั่งที่ทำผ่านด้วยมือ ผ่าน `shellcheck` แล้ว แต่**ยังไม่เคยรันในรูปแบบสคริปต์บนเครื่องใหม่** และการกู้คืนจาก backup ยังไม่ได้ทดสอบ
- Hotfix ของ Rakazo ใช้ได้กับ **v0.1.6 เท่านั้น** — อัปเกรดแล้วต้องทบทวนตาม OPERATIONS.md

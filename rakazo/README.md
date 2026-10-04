# rakazo — ชุดติดตั้ง Rakazo สำหรับ CRD

ชุดติดตั้ง **Rakazo** (แพลตฟอร์ม AI teammate แบบ open source) สำหรับงาน CRD บน Windows 11 + WSL2
สรุปจากการติดตั้ง pilot จริง (4 ต.ค. 2569) — ใช้ย้าย/ติดตั้งซ้ำบนเครื่องใหม่ได้ทีละขั้นพร้อมจุดตรวจ

> ⚠️ ไม่มี secret ใด ๆ อยู่ใน repo (`.env`, backup, API key ถูกกันด้วย `.gitignore` ที่ root) · ถ้า repo เป็น public ข้อมูลโครงสร้างระบบในเอกสารนี้จะเปิดเผยต่อสาธารณะ

## เริ่มที่ไหน
| ต้องการ | อ่าน |
|---|---|
| ติดตั้งบนเครื่องใหม่ | [docs/INSTALL.md](docs/INSTALL.md) |
| ตั้งโมเดล + บอทแรก + ชุดทดสอบ | [docs/BOT-SETUP.md](docs/BOT-SETUP.md) |
| เปิด/ปิด สำรอง กู้คืน ย้ายเครื่อง แก้ปัญหา | [docs/OPERATIONS.md](docs/OPERATIONS.md) |
| ทำไมตั้งค่าแบบนี้ + ตัวเลขที่วัดได้ | [docs/DECISIONS.md](docs/DECISIONS.md) |

## สรุปขั้นตอน
| ขั้น | ทำอะไร | ที่ไหน / ใคร |
|---|---|---|
| 0 | clone repo | PowerShell |
| 1 | ตรวจเครื่อง + merge `.wslconfig` | `scripts/windows/check-machine.ps1`, `merge-wslconfig.ps1` |
| 2 | Docker Engine | WSL root · `scripts/wsl/10-install-docker.sh` |
| 3 | user `rakazo` | WSL root · `scripts/wsl/20-create-user.sh` |
| 4 | Rakazo v0.1.6 + ฟอนต์ไทย + hotfix + skill CRD | WSL rakazo · `CRD_SKILLS_DIR=… scripts/wsl/30-install-rakazo.sh` |
| 5 | กันบอทเข้า LAN | WSL root · `scripts/wsl/40-lan-block.sh` |
| 6 | ตรวจรวม | WSL rakazo · `scripts/wsl/verify.sh` |
| 7 | ไอคอนแอปบน Desktop | `scripts/windows/create-shortcut.ps1` |
| 8 | บัญชี + โมเดล + บอท + ทดสอบ | หน้าเว็บ · `docs/BOT-SETUP.md` |

## โครงสร้าง
```
config/     docker-compose.override.yml, wslconfig.example, Dockerfile ของ image ที่ build ในเครื่อง
scripts/    wsl/ (bash, LF)  windows/ (PowerShell)
skills/     skill-installer (skill ของ CRD ไม่อยู่ใน repo — ดึงจาก CRD_SKILLS_DIR ตอนติดตั้ง)
checksums/  sha256 ของไฟล์ที่ดึงจากภายนอกตอนติดตั้ง
docs/       INSTALL, BOT-SETUP, OPERATIONS, DECISIONS
```

## สถานะการทดสอบ
- ขั้นตอนทั้งหมดผ่านการทำจริงด้วยมือบนเครื่อง pilot (ดูจุดตรวจใน INSTALL.md)
- สคริปต์ใน `scripts/` **รวบรวมจากคำสั่งที่ผ่านแล้ว** ผ่าน `bash -n` + `shellcheck` แต่ **ยังไม่ได้รันจริงในรูปสคริปต์** → ครั้งแรกบนเครื่องใหม่ให้รันทีละขั้นและดูจุดตรวจ
- การกู้คืนจาก backup ยังไม่ได้ทดสอบจริง

เครดิต: ดู [NOTICE.md](NOTICE.md)

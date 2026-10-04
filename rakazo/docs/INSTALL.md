# INSTALL — ติดตั้ง Rakazo สำหรับ CRD บนเครื่องใหม่

ขั้นตอนนี้สรุปจากการติดตั้ง pilot จริงบนโน้ตบุ๊ก (4 ต.ค. 2569) ทุกขั้นมี **จุดตรวจ (ผ่านเมื่อ)** — ห้ามข้ามขั้นถ้ายังไม่ผ่าน

> **ระดับความเสี่ยง:** R0 = อ่านอย่างเดียว · R1 = แก้ได้ ย้อนกลับได้ · R2 = กระทบข้อมูล ความลับ หรือระบบเดิม

## ภาพรวม

```
Windows 11
└─ WSL2 Ubuntu-24.04 (systemd)
   ├─ Docker Engine (ไม่ใช่ Docker Desktop)
   ├─ user "rakazo" → ~/rakazo  (Rakazo v0.1.6, compose project "rakazo")
   │    web 127.0.0.1:5173 · api 127.0.0.1:3100 · postgres · worker · supervisor
   │    เครื่องบอท = container ละตัว (image crd/computer:v0.1.6-th มีฟอนต์ไทย)
   └─ rakazo-lan-block.service  (กันบอทเข้า LAN)
โมเดล: ตั้งใน Rakazo (pilot ใช้ ChatGPT subscription — ดู DECISIONS.md)
```

## กติกาก่อนเริ่ม

1. **คำสั่ง PowerShell vs bash:** บล็อก `powershell` วางใน `PS C:\...>` · บล็อก `bash` วางใน WSL เท่านั้น
2. **ดู prompt ก่อนวางทุกครั้ง:** `root@...#` = root · `rakazo@...$` = user rakazo · สคริปต์ตรวจให้แล้วว่ารันด้วย user ถูกหรือไม่
3. ใช้ **2 หน้าต่าง** จะสะดวก: A = `wsl -d Ubuntu-24.04 -u rakazo` · B = `wsl -d Ubuntu-24.04 -u root`
4. ถ้า WSL มีบริการอื่นเปิดอยู่ (เช่น oracle fleet / `maw-serve`) **ห้าม `wsl --shutdown` โดยไม่ตรวจก่อน** (ดูขั้น 1.2)
5. ห้ามวาง API key / รหัสผ่านในแชต ไฟล์ หรือ repo

---

## ขั้น 0 — เอา repo ลงเครื่อง (R0)

Clone ลงฝั่ง Windows (ต้องมี Git for Windows) — `.gitattributes` บังคับไฟล์ `.sh` เป็น LF ให้แล้ว
```powershell
cd $env:USERPROFILE
git clone https://github.com/BoomWarapant/ai-agent.git
```
ใน WSL path นี้คือ `/mnt/c/Users/<windows-user>/ai-agent/rakazo` (เรียกว่า `$REPO` ด้านล่าง)

ในทุกหน้าต่าง WSL ให้ตั้งตัวแปรก่อน:
```bash
REPO=/mnt/c/Users/<windows-user>/ai-agent/rakazo
```
ถ้า user `rakazo` อ่านไฟล์ใน `/mnt/c` ไม่ได้ (Permission denied) ให้ clone ซ้ำใน WSL ด้วย root ที่ `/opt/ai-agent` แล้วใช้ `REPO=/opt/ai-agent/rakazo`

## ขั้น 1 — ตรวจเครื่อง + ตั้ง WSL

**1.1 ตรวจเครื่อง (R0)**
```powershell
powershell -ExecutionPolicy Bypass -File .\ai-agent\rakazo\scripts\windows\check-machine.ps1
```
**ผ่านเมื่อ:** RAM ≥ 16 GB · มี "A hypervisor has been detected" · ไม่มี Docker Desktop · WSL default version 2
- ถ้ายังไม่มี Ubuntu-24.04: `wsl --install -d Ubuntu-24.04` (R1)
- `VirtualizationFirmwareEnabled : False` **เป็นเรื่องปกติ** เมื่อ Hyper-V ทำงานอยู่แล้ว (ยึดผล hypervisor แทน)

**1.2 ตรวจบริการที่รันอยู่ใน WSL ก่อน shutdown (R0)**
```powershell
wsl -d Ubuntu-24.04 -u root -- bash -c 'ps -eo user,pid,rss,cmd | grep -Ei "tmux|maw|oracle" | grep -v grep; systemctl list-units --type=service --state=running --no-pager | head -40'
```
ถ้าพบบริการสำคัญ ให้ตรวจว่าเป็น systemd service ที่ `enabled` หรือไม่ (`systemctl is-enabled <ชื่อ>`) — ถ้าใช่ จะเปิดเองหลัง shutdown

**1.3 เพิ่มค่า .wslconfig โดยไม่เขียนทับ (R1)**
```powershell
powershell -ExecutionPolicy Bypass -File .\ai-agent\rakazo\scripts\windows\merge-wslconfig.ps1
wsl --shutdown
```
รอ 10 วินาที แล้ว:
```powershell
wsl -d Ubuntu-24.04 -u root -- bash -c 'sleep 5; free -g | head -2; nproc; ps -p 1 -o comm='
```
**ผ่านเมื่อ:** total ≈ 15–16 · nproc = 8 · บรรทัดสุดท้าย `systemd` (+ บริการเดิมกลับมา active)
- ถ้าไม่ใช่ `systemd`: `wsl -d Ubuntu-24.04 -u root -- bash -c "printf '[boot]\nsystemd=true\n' >> /etc/wsl.conf"` แล้ว `wsl --shutdown`
- ย้อนกลับ: `Copy-Item "$env:USERPROFILE\.wslconfig.bak" "$env:USERPROFILE\.wslconfig" -Force; wsl --shutdown`

## ขั้น 2 — Docker Engine ใน WSL (หน้าต่าง B: root, R1)
```bash
bash $REPO/scripts/wsl/10-install-docker.sh
```
**ผ่านเมื่อ:** `[PASS] hello-world ทำงาน` และ `[PASS] docker เปิดเองตอนบูต`

## ขั้น 3 — สร้าง user `rakazo` (หน้าต่าง B: root, R1)
```bash
bash $REPO/scripts/wsl/20-create-user.sh
```
**ผ่านเมื่อ:** `[PASS] rakazo อยู่ใน group docker`

## ขั้น 4 — ติดตั้ง Rakazo + ฟอนต์ไทย + hotfix (หน้าต่าง A: rakazo, R1)
```bash
bash $REPO/scripts/wsl/30-install-rakazo.sh
```
สคริปต์ทำ: ตรวจ port → ดาวน์โหลด installer/compose ที่ pin ไว้ที่ v0.1.6 (`--prepare-only`) → pin image tag → ดึง hotfix + Dockerfile พร้อม **ตรวจ checksum** → สร้าง hotfix แนบไฟล์ Office จาก image `app:v0.1.6` (ตรวจ checksum ก่อน/หลัง patch) → build `crd/computer:v0.1.6-th` → build `crd/app:v0.1.6-office` (หน้าเว็บที่รับอัปโหลด Office, ~1 นาที) → ใส่ override → เพิ่มคำสั่ง `dc` → `dc up -d --wait`

**ผ่านเมื่อ:** ทุกบรรทัดเป็น `[PASS]` และจบด้วย "Rakazo ทำงาน" — ถ้า checksum `FAILED` ให้หยุด (ไฟล์ต้นทางถูกเปลี่ยน)

> ห้ามใช้ `bash install-images.sh` เพื่อเปิดระบบอีก — installer ไม่โหลด override ให้ใช้ `dc up -d` หรือไอคอน Rakazo

## ขั้น 5 — กันบอทเข้า LAN (หน้าต่าง B: root, R1)
```bash
bash $REPO/scripts/wsl/40-lan-block.sh
```
**ผ่านเมื่อ:** `DNS=OK` `PUBLIC=OK` `LAN=BLOCKED` และ `[PASS] กฎ DROP 192.168.0.0/16 ดัก packet จริง (x → y)`
(ผล "timed out" อย่างเดียวพิสูจน์ไม่ได้ — สคริปต์จึงเทียบตัวนับ iptables ก่อน/หลัง)
ย้อนกลับ: `systemctl disable --now rakazo-lan-block`

## ขั้น 6 — ตรวจรวม (หน้าต่าง A, R0)
```bash
bash $REPO/scripts/wsl/verify.sh
```
**ผ่านเมื่อ:** ไม่มี `[FAIL]` · RAM ของ WSL ยังเหลือพอ (pilot วัดได้: แกน Rakazo ≈ 1.35 GB, บอทตัวละ ≈ 0.7 GB เพดาน 2 GB)

## ขั้น 7 — ไอคอนเปิดแอปบน Desktop (PowerShell, R1)
```powershell
powershell -ExecutionPolicy Bypass -File .\ai-agent\rakazo\scripts\windows\create-shortcut.ps1
# เปิดเองตอน login Windows (เลือกได้): เพิ่ม -Startup
```
สคริปต์จะ: สร้าง/ทับไอคอน Rakazo บน Desktop ให้ชี้ไปที่ `rakazo-start.ps1` ใน repo · อัปเดตไอคอนใน Startup ถ้ามีอยู่แล้ว · ย้ายสคริปต์เก่า `%USERPROFILE%\rakazo-start.ps1` (ถ้ามี) เป็น `.bak`

**ผ่านเมื่อ:** ขึ้น `[PASS] ... -> ...\rakazo\scripts\windows\rakazo-start.ps1` และดับเบิลคลิก "Rakazo" → ภายใน 10–60 วินาที เปิดหน้าต่าง Rakazo ไม่มีแถบ URL และไม่มีแท็บอื่นติดมา
> ถ้าย้ายโฟลเดอร์ repo ไปที่อื่น ให้รันสคริปต์นี้ซ้ำ ไอคอนจะชี้ไปที่ใหม่
(ใช้ Edge profile แยก `%LOCALAPPDATA%\RakazoEdge` → ครั้งแรกต้อง login Rakazo 1 ครั้ง)

(เลือกได้) ไม่ให้เครื่อง sleep ตอนเสียบปลั๊ก: `powercfg /change standby-timeout-ac 0`

## ขั้น 8 — บัญชีเจ้าของ + โมเดล + บอทแรก

ทำตาม [BOT-SETUP.md](BOT-SETUP.md) — สร้างบัญชี owner, เชื่อมโมเดล, สร้างบอททดสอบ และชุดทดสอบ T1–T3 + กับดัก

---

## ปัญหาที่เจอจริงตอนติดตั้ง pilot (และวิธีเลี่ยง)

| อาการ | สาเหตุ | วิธีเลี่ยง/แก้ |
|---|---|---|
| วางค่า `[wsl2]` / `memory=16GB` แล้ว PowerShell error | เป็น "เนื้อหาไฟล์" ไม่ใช่คำสั่ง | ใช้ `merge-wslconfig.ps1` |
| เกือบเขียนทับ `.wslconfig` ที่มี `vmIdleTimeout=-1` ของ fleet | ไม่ได้อ่านไฟล์เดิมก่อน | สคริปต์ merge เพิ่มเฉพาะค่าที่ขาด + สำรอง `.bak` |
| `if/elseif/else` หลายบรรทัดใน PowerShell error | console รันทีละบรรทัด | ใช้สคริปต์ไฟล์ ไม่วาง if/else ข้ามบรรทัด |
| `\$(...)` ใน `wsl -- bash -c "..."` ถูก PowerShell ตีความ | double quote ของ PowerShell ขยาย `$()` | ห่อคำสั่ง bash ด้วย single quote `'...'` |
| `curl: (23) Failure writing output` / `iptables: Permission denied` | รันงานระบบด้วย user rakazo | งานระบบใช้ root (หน้าต่าง B) |
| บรรทัดคำสั่ง copy ติดกัน (`...ps1"$lnk = ...`) | ขึ้นบรรทัดหายตอน copy | ใช้สคริปต์ไฟล์ หรือคำสั่งบรรทัดเดียว |
| เปิดแอปแล้วมีหน้า claude.ai login เด้งมาด้วย | Edge เปิดแท็บค้างจาก session เดิม | ใช้ Edge profile แยก (อยู่ใน `rakazo-start.ps1` แล้ว) · อย่า login OAuth ที่ไม่ได้เริ่มเอง |
| ชื่อบัญชีมีสระไทยติดหน้า | พิมพ์ตอนแป้นเป็นภาษาไทย | สลับแป้นเป็นอังกฤษก่อนสมัคร (แก้ทีหลังต้องแก้ใน DB — ดู OPERATIONS.md) |

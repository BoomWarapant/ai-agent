# DECISIONS — การตัดสินใจและเหตุผล (pilot 4 ต.ค. 2569)

| # | การตัดสินใจ | เหตุผล / หลักฐาน |
|---|---|---|
| D1 | Pin Rakazo **v0.1.6** (ไม่ใช้ `edge`) | `edge` = build จาก main ที่เปลี่ยนตลอด · v0.1.6 เป็น release stable ล่าสุด ณ วันติดตั้ง และเป็นเวอร์ชันเดียวกับที่ BotTeam ทดสอบ · repo นี้ pin ทั้ง installer และ compose ไว้ที่ tag v0.1.6 (pilot ใช้ installer จาก main ซึ่ง compose ต่างจาก v0.1.6 แค่ env `SANDBOX_COMPUTER_EGRESS` 1 บรรทัด) |
| D2 | ใช้ hotfix web_fetch / remote MCP จาก BotTeam | diff กับ source v0.1.6 แล้ว แก้แค่ให้ใช้ fetch ของ undici · ดึงตอนติดตั้งจาก commit `b539632` + ตรวจ sha256 (ไม่เก็บไฟล์ไว้ใน repo) |
| D3 | **ไม่ใช้** hotfix ของ Gemma (computer-tools, pi-openai-compatible-provider) | ใช้เฉพาะเมื่อสมองเป็น Gemma บน llama.cpp |
| D4 | Docker Engine ใน WSL (ไม่ใช่ Docker Desktop) | ตามแนวทาง BotTeam · เลี่ยงชนกัน · ไม่มี Docker Desktop บนเครื่อง |
| D5 | รัน Rakazo ด้วย user `rakazo` (ไม่ใช่ root) | user เริ่มต้นของ WSL เป็น root · แยกสิทธิ์จาก fleet และระบบ |
| D6 | `.wslconfig` 16 GB / 8 CPU / swap 8 GB (merge ไม่เขียนทับ) | คืน RAM/CPU ครึ่งหนึ่งให้ Windows · คง `vmIdleTimeout=-1` ของ oracle fleet |
| D7 | กันบอทเข้า LAN ด้วย iptables `DOCKER-USER` | ยืนยันด้วยตัวนับ DROP (192.168.0.0/16 = 4 pkts) · ไม่กระทบ process บน host |
| D8 | ใช้ค่า `SANDBOX_IDLE_MS` default (10 นาที) | ไม่ให้เครื่องบอทกิน RAM ตลอดบนโน้ตบุ๊กที่ใช้ทำงาน (BotTeam ตั้ง 30 วัน) |
| D9 | สมองบอท = **ChatGPT subscription** (GPT-5.6 Sol) | ไม่มีค่าใช้จ่ายเพิ่ม · ข้อจำกัด: บัญชีส่วนตัว → ห้ามข้อมูลลับ CRD · ใช้งานจริงกับทีมต้องย้ายไปบัญชีองค์กร |
| D10 | **ห้าม** Claude Pro/Max subscription กับ Rakazo | เอกสาร Legal & Compliance ของ Claude Code: OAuth ใช้ได้เฉพาะแอปของ Anthropic, ผู้สร้างเครื่องมืออื่นต้องใช้ API key |
| D11 | Thinking = high + กติกาการรายงาน + บรรทัด "หลักฐาน:" | ก่อนแก้ บอทรายงานเท็จ 2 ครั้ง · หลังแก้ผ่านทุกข้อรวมกับดัก |
| D12 | เปิดแอปด้วย Edge `--app` + profile แยก | ไม่มีแถบ URL · ไม่เปิดแท็บเก่าของ Edge หลัก · cookie แยก |
| D13 | บอทตัวแรก = DR → %progress เทียบ BOQ (**BOQ ตัดราคาออก**) | ข้อมูลอ่อนไหวน้อยกว่า PR · ตรวจผลง่าย · ต่อยอดจาก skill `crd-boq-progress-check` |
| D14 | ระยะยาว: ย้ายไปเครื่อง 24 ชม. ในออฟฟิศ (Ubuntu Server) | โน้ตบุ๊ก sleep = บอท/งานตั้งเวลาหยุด · ต้องผ่าน IT + บัญชี AI ระดับองค์กร + HTTPS ภายใน |
| D15 | hotfix ให้บอทแนบไฟล์ .xlsx/.docx/.pptx ในแชต (api/worker) | v0.1.6 และ upstream main (4 ต.ค. 2569) อนุญาตแค่ 9 ชนิด (รูป, pdf, txt, md, csv, json) → `attach_file` ขึ้น `unsupported attachment type` · patch จาก image ตอนติดตั้ง ไม่เก็บซอร์สใน repo · ทดสอบ: atlas แนบ xlsx ได้ มีสูตรจริง · ฝั่งผู้ใช้อัปโหลดได้ด้วย D16 |
| D16 | web ใช้ image `crd/app:v0.1.6-office` (build หน้าเว็บใหม่ด้วยไฟล์ hotfix D15) + `pull_policy: never` | หน้าเว็บเป็น build สำเร็จ (`vite preview` จาก `dist`) แก้ด้วย mount ไม่ได้ · build จาก image upstream ในเครื่อง (~41 วิ) แบบเดียวกับ `crd/computer:*-th` · ทดสอบ: อัปโหลด .xlsx ผ่านปุ่มแนบไฟล์ → atlas อ่านสูตรและจับยอดรวมผิดได้ |
| D17 | เครื่องบอทใช้ image `crd/computer:v0.1.6-crd` = `-th` + Python libs (pin เวอร์ชัน) + skill ที่ `/opt/crd-skills` | image upstream มี Python 3.11 แต่ไม่มี pip/sudo และไม่มี openpyxl/python-docx ที่ skill ต้องใช้ · ติดตั้งใน image = ถาวร ทุกเครื่องบอท (team/private) ได้เท่ากัน · home ของบอทไม่ถูกแตะ |
| D18 | skill CRD เป็น built-in (hotfix `builtin-skills.ts`) แบบ "ตัวชี้" ให้บอท `cat /opt/crd-skills/<ชื่อ>/SKILL.md` · **ไม่เก็บ skill ใน repo** — ดึงจาก `CRD_SKILLS_DIR` ตอนติดตั้ง | Agent Skill ของ Rakazo เก็บได้แค่ข้อความ SKILL.md ≤ 100,000 ตัวอักษร ไม่มีไฟล์ประกอบ · built-in = บัญชีใหม่ใช้ได้ทันทีไม่ต้องลงทะเบียน · skill มีข้อมูลราคาต่อหน่วยจริง (crd-estimation, BOM-Template) — เจ้าของอนุมัติให้ติดตั้งในบอทแม้ใช้ ChatGPT บัญชีส่วนตัว (4 ต.ค. 2569) แต่ไม่ใส่ลง git · `crd-advance-clearing` ไม่ติดตั้ง (ข้อมูลพนักงาน/ผู้ขาย) · ทดสอบ: atlas เลือก skill เองจากคำสั่งภาษาไทย และสร้าง .docx/.xlsx ได้ |
| D19 | อวตารบอท = หุ่นยนต์ใส่หมวกนิรภัยแบบ 3 มิติ (SVG + CSS) แทนหุ่นยนต์เดิม · หมวกขาวเมื่อสีบอทโทนร้อน / หมวกเหลืองเมื่อโทนเย็น | Rakazo ไม่มีช่องอัปโหลดรูปอวตาร (มีแค่ `color`) → patch `bot-avatar.tsx` + `styles.css` ตอน build web (ขั้น 5b) · ไม่ใช้ WebGL: จำกัด ~16 context ต่อหน้า แต่อวตารแสดงในรายชื่อ + ทุกข้อความ · คงคลาส/animation เดิม (ตา, วงแหวนตอนทำงาน, reduced-motion) + เพิ่มลอย, ไฟหน้าหมวกกะพริบตอนทำงาน, เอียง 3 มิติตอน hover |
| D20 | ชื่อแอป **crd-bot**: ไอคอน Desktop `crd-bot.lnk` + `crd-bot.ico` (รูป atlas, เก็บที่ `%LOCALAPPDATA%\crd-bot`) · หน้าเว็บ: `<title>`, `site.webmanifest` และ favicon ทุกขนาด (`config/app-office/branding/`) เป็น crd-bot | เจ้าของขอเปลี่ยนชื่อ/โลโก้ (4 ต.ค. 2569) · ไอคอน Desktop อยู่นอก repo จึงไม่หายเมื่อย้าย/ลบโฟลเดอร์ repo · ชื่อหน้าต่างและไอคอน taskbar ของหน้าต่าง Edge `--app` มาจาก title/favicon ของหน้าเว็บ จึงแก้ตอน build web (ขั้น 5b) · ข้อความ "Rakazo" ที่ผู้ใช้เห็นเปลี่ยนเป็น crd-bot ด้วย: หน้าเว็บ (แทนคำทั้งในโค้ดและไฟล์คำแปล `.po` ทุกภาษาตอน build เพื่อให้คำแปลยังจับคู่ได้ — แทนเฉพาะคำ "Rakazo" ตัวใหญ่ทั้งคำ, key ภายใน `rakazo.*` ไม่ถูกแตะ) และฝั่งเซิร์ฟเวอร์ 3 ไฟล์ (`pi-models.ts`, `pi-oauth.ts` = คำอธิบายค่าใช้จ่ายในหน้า Models · `pi-runtime.ts` = คำสั่งระบบสำรองของบอทที่ไม่มี Description และ subagent) ขั้น 4c · ข้อความภายในอื่นของเซิร์ฟเวอร์ (log, prompt ภายใน, ชื่อ OAuth client) คงเดิม |

## ตัวเลขที่วัดได้จริง (โน้ตบุ๊ก i5-13450HX / 32 GB, WSL 16 GB)
- แกน Rakazo: worker 469 MB · api 487 MB · supervisor 130 MB · web 188 MB · postgres 78 MB (≈ 1.35 GB)
- เครื่องบอท 1 ตัว: 702–714 MB (เพดาน 2 GB) · WSL used รวม 2 GB
- ประมาณการ: กรณีแย่สุด (ทุกตัวชนเพดาน) ≈ 5 บอท · แนะนำ pilot 3–4 บอท

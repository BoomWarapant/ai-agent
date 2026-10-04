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

## ตัวเลขที่วัดได้จริง (โน้ตบุ๊ก i5-13450HX / 32 GB, WSL 16 GB)
- แกน Rakazo: worker 469 MB · api 487 MB · supervisor 130 MB · web 188 MB · postgres 78 MB (≈ 1.35 GB)
- เครื่องบอท 1 ตัว: 702–714 MB (เพดาน 2 GB) · WSL used รวม 2 GB
- ประมาณการ: กรณีแย่สุด (ทุกตัวชนเพดาน) ≈ 5 บอท · แนะนำ pilot 3–4 บอท

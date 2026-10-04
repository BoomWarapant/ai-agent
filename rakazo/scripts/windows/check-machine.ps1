# Step 1: machine readiness check (read-only, R0). Run in PowerShell:
#   powershell -ExecutionPolicy Bypass -File .\scripts\windows\check-machine.ps1
$cs  = Get-CimInstance Win32_ComputerSystem
$cpu = Get-CimInstance Win32_Processor | Select-Object -First 1
$c   = Get-PSDrive C
"Model          : $($cs.Model)"
"RAM (GB)       : $([math]::Round($cs.TotalPhysicalMemory/1GB))"
"CPU            : $($cpu.Name)"
"Cores/Threads  : $($cpu.NumberOfCores) / $($cpu.NumberOfLogicalProcessors)"
"Free C: (GB)   : $([math]::Round($c.Free/1GB))"
""
"--- Hypervisor (ต้องเห็น 'A hypervisor has been detected'; ค่า VirtualizationFirmwareEnabled=False เป็นเรื่องปกติเมื่อ Hyper-V ทำงาน)"
systeminfo | Select-String -Pattern 'hypervisor'
""
"--- WSL"
wsl --status
wsl -l -v
""
"--- Docker Desktop (ต้องไม่มี; ถ้ามีให้หยุดและตัดสินใจก่อน เพราะจะชนกับ Docker Engine ใน WSL)"
if (Get-Command docker -ErrorAction SilentlyContinue) { "พบคำสั่ง docker บน Windows" } else { "ไม่พบ docker บน Windows (ถูกต้อง)" }
""
"--- .wslconfig เดิม (ถ้ามี) — ต้องอ่านก่อนแก้"
$cfg = "$env:USERPROFILE\.wslconfig"
if (Test-Path $cfg) { Get-Content $cfg } else { "(ยังไม่มีไฟล์)" }

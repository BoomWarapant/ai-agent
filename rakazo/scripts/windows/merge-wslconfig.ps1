# Step 1.3: add memory/processors/swap to .wslconfig WITHOUT overwriting existing lines (R1).
# Backs up to .wslconfig.bak. Does NOT run "wsl --shutdown" — do that yourself after checking
# that nothing important is running in WSL (e.g. oracle fleet / maw-serve).
param([string]$Memory = "16GB", [int]$Processors = 8, [string]$Swap = "8GB")
$cfg = "$env:USERPROFILE\.wslconfig"
if (Test-Path $cfg) {
  $lines = @(Get-Content $cfg)
  $sections = @($lines | Where-Object { $_ -match '^\s*\[.+\]\s*$' })
  if ($sections.Count -ne 1 -or $sections[0].Trim() -ne '[wsl2]') {
    Write-Host "STOP: ไฟล์มี section อื่นนอกจาก [wsl2] — แก้ด้วยมือ (ยังไม่ได้แก้อะไร)" -ForegroundColor Red; exit 1
  }
  Copy-Item $cfg "$cfg.bak" -Force
} else {
  $lines = @('[wsl2]')
}
$want = [ordered]@{ memory = $Memory; processors = "$Processors"; swap = $Swap }
$added = @()
foreach ($k in $want.Keys) {
  if (-not ($lines | Where-Object { $_ -match "^\s*$k\s*=" })) { $lines += "$k=$($want[$k])"; $added += $k }
  else { Write-Host "มี $k อยู่แล้ว — ไม่แตะ" -ForegroundColor Yellow }
}
$lines | Set-Content $cfg -Encoding ascii
Write-Host "เพิ่ม: $($added -join ', ')" -ForegroundColor Green
Get-Content $cfg
Write-Host "`nย้อนกลับ: Copy-Item `"$cfg.bak`" `"$cfg`" -Force ; wsl --shutdown"
Write-Host "ขั้นต่อไป: ตรวจว่าไม่มีงานสำคัญใน WSL แล้วรัน wsl --shutdown"

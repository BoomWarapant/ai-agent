# Step 7: create/refresh the "crd-bot" desktop shortcut so it runs rakazo-start.ps1 from THIS repo (R1).
# - Icon: crd-bot.ico (3D hard-hat robot) copied to %LOCALAPPDATA%\crd-bot so it survives repo moves
# - Replaces an older Rakazo.lnk (Desktop / Startup) with crd-bot.lnk
# - Refreshes the Startup shortcut if one already exists (or creates it with -Startup)
# - Moves an old standalone %USERPROFILE%\rakazo-start.ps1 (from the pilot) to .bak — not deleted
param([switch]$Startup)
$script = Join-Path $PSScriptRoot 'rakazo-start.ps1'
if (-not (Test-Path $script)) { Write-Host "ไม่พบ $script" -ForegroundColor Red; exit 1 }

$iconDir = Join-Path $env:LOCALAPPDATA 'crd-bot'
New-Item -ItemType Directory -Force $iconDir | Out-Null
$icon = Join-Path $iconDir 'crd-bot.ico'
Copy-Item (Join-Path $PSScriptRoot 'crd-bot.ico') $icon -Force

function New-CrdBotShortcut([string]$path) {
  $s = (New-Object -ComObject WScript.Shell).CreateShortcut($path)
  $s.TargetPath = 'powershell.exe'
  $s.Arguments = '-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "' + $script + '"'
  $s.IconLocation = "$icon,0"
  $s.Description = 'crd-bot (Rakazo)'
  $s.Save()
  $check = (New-Object -ComObject WScript.Shell).CreateShortcut($path)
  if ($check.Arguments -like "*$script*") { Write-Host "[PASS] $path -> $script" -ForegroundColor Green }
  else { Write-Host "[FAIL] $path ไม่ได้ชี้ไปที่ $script" -ForegroundColor Red; exit 1 }
}

# 1) Desktop (replace an older Rakazo.lnk)
$desktop = [Environment]::GetFolderPath('Desktop')
New-CrdBotShortcut (Join-Path $desktop 'crd-bot.lnk')
$oldDesktop = Join-Path $desktop 'Rakazo.lnk'
if (Test-Path $oldDesktop) { Remove-Item $oldDesktop; Write-Host "[PASS] แทนที่ไอคอนเก่า $oldDesktop" -ForegroundColor Green }

# 2) Startup (refresh if present, or create when -Startup)
$startupDir = [Environment]::GetFolderPath('Startup')
$startupLnk = Join-Path $startupDir 'crd-bot.lnk'
$oldStartup = Join-Path $startupDir 'Rakazo.lnk'
if ($Startup -or (Test-Path $startupLnk) -or (Test-Path $oldStartup)) {
  New-CrdBotShortcut $startupLnk
  if (Test-Path $oldStartup) { Remove-Item $oldStartup }
  Write-Host "     (ยกเลิกการเปิดตอน login: ลบ $startupLnk)"
}

# 3) Old standalone script from the pilot -> .bak (reversible)
$old = Join-Path $env:USERPROFILE 'rakazo-start.ps1'
if ((Test-Path $old) -and ((Resolve-Path $old).Path -ne (Resolve-Path $script).Path)) {
  Move-Item $old "$old.bak" -Force
  Write-Host "[PASS] ย้ายสคริปต์เก่า $old -> $old.bak (ลบได้เมื่อมั่นใจว่าไอคอนใหม่ใช้งานได้)" -ForegroundColor Green
}
Write-Host "`nทดสอบ: ปิดหน้าต่าง Rakazo ทั้งหมด แล้วดับเบิลคลิกไอคอน crd-bot บน Desktop"

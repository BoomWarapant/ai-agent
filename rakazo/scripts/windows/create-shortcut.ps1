# Step 7: create/refresh the "Rakazo" desktop shortcut so it runs rakazo-start.ps1 from THIS repo (R1).
# - Replaces an existing Rakazo.lnk on the Desktop
# - Refreshes Rakazo.lnk in the Startup folder if one already exists (or creates it with -Startup)
# - Moves an old standalone %USERPROFILE%\rakazo-start.ps1 (from the pilot) to .bak — not deleted
param([switch]$Startup)
$script = Join-Path $PSScriptRoot 'rakazo-start.ps1'
if (-not (Test-Path $script)) { Write-Host "ไม่พบ $script" -ForegroundColor Red; exit 1 }

function New-RakazoShortcut([string]$path) {
  $s = (New-Object -ComObject WScript.Shell).CreateShortcut($path)
  $s.TargetPath = 'powershell.exe'
  $s.Arguments = '-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "' + $script + '"'
  $edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
  if (Test-Path $edge) { $s.IconLocation = "$edge,0" }
  $s.Save()
  $check = (New-Object -ComObject WScript.Shell).CreateShortcut($path)
  if ($check.Arguments -like "*$script*") { Write-Host "[PASS] $path -> $script" -ForegroundColor Green }
  else { Write-Host "[FAIL] $path ไม่ได้ชี้ไปที่ $script" -ForegroundColor Red; exit 1 }
}

# 1) Desktop
New-RakazoShortcut (Join-Path ([Environment]::GetFolderPath('Desktop')) 'Rakazo.lnk')

# 2) Startup (refresh if present, or create when -Startup)
$startupLnk = Join-Path ([Environment]::GetFolderPath('Startup')) 'Rakazo.lnk'
if ($Startup -or (Test-Path $startupLnk)) {
  New-RakazoShortcut $startupLnk
  Write-Host "     (ยกเลิกการเปิดตอน login: ลบ $startupLnk)"
}

# 3) Old standalone script from the pilot -> .bak (reversible)
$old = Join-Path $env:USERPROFILE 'rakazo-start.ps1'
if ((Test-Path $old) -and ((Resolve-Path $old).Path -ne (Resolve-Path $script).Path)) {
  Move-Item $old "$old.bak" -Force
  Write-Host "[PASS] ย้ายสคริปต์เก่า $old -> $old.bak (ลบได้เมื่อมั่นใจว่าไอคอนใหม่ใช้งานได้)" -ForegroundColor Green
}
Write-Host "`nทดสอบ: ปิดหน้าต่าง Rakazo ทั้งหมด แล้วดับเบิลคลิกไอคอน Rakazo บน Desktop"

param([string]$Distro='Ubuntu-24.04', [ValidateRange(1024,65535)][int]$WebPort=5173)
$ErrorActionPreference='Stop'
try {
 $linuxRoot=(& wsl.exe -d $Distro -u rakazo --exec wslpath -a $PSScriptRoot).Trim()
 if($LASTEXITCODE -ne 0){throw 'Cannot locate installation scripts.'}
 $saved=$ErrorActionPreference
 try {
  $ErrorActionPreference='Continue'
  $output=& wsl.exe -d $Distro -u rakazo --exec bash "$linuxRoot/rakazo/team-installer/start.sh" 2>&1
  $code=$LASTEXITCODE
 } finally {$ErrorActionPreference=$saved}
 if($code -ne 0){throw "Startup failed: $output"}
 $ready=$false
 for($i=0;$i -lt 30;$i++){
  try {$r=Invoke-WebRequest "http://127.0.0.1:$WebPort" -UseBasicParsing -TimeoutSec 3; if($r.StatusCode -eq 200){$ready=$true;break}} catch {}
  Start-Sleep -Seconds 2
 }
 if(-not $ready){throw 'Web is not ready.'}
 $profile=Join-Path $env:LOCALAPPDATA 'CrdBotTeamEdge'
 Start-Process -FilePath 'msedge.exe' -ArgumentList @("--app=http://127.0.0.1:$WebPort",('--user-data-dir="{0}"' -f $profile))
} catch {
 Add-Type -AssemblyName System.Windows.Forms
 [void][System.Windows.Forms.MessageBox]::Show($_.Exception.Message,'crd-bot startup')
 exit 1
}
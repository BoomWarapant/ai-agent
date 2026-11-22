param([string]$Distro='Ubuntu-24.04', [ValidateRange(1024,65535)][int]$WebPort=5173, [ValidateRange(1024,65535)][int]$ApiPort=3100, [switch]$Upgrade, [switch]$FromSetup)
$ErrorActionPreference='Stop'
function Invoke-WslChecked {
 param([string[]]$WslArgs)
 $saved=$ErrorActionPreference
 try { $ErrorActionPreference='Continue'; & wsl.exe @WslArgs; $code=$LASTEXITCODE }
 finally { $ErrorActionPreference=$saved }
 if($code -ne 0){throw "WSL command failed (exit $code). See output above."}
}
$manifest=Join-Path $PSScriptRoot 'crd-bot-package.SHA256SUMS'
if(-not (Test-Path -LiteralPath $manifest)){throw 'Missing package checksums.'}
foreach($line in Get-Content -LiteralPath $manifest){
 if($line -notmatch '^([a-f0-9]{64})  (.+)$'){throw 'Invalid checksum manifest.'}
 $expected=$Matches[1];$relative=$Matches[2]
 $full=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot $relative))
 if(-not $full.StartsWith($PSScriptRoot.TrimEnd('\')+'\',[StringComparison]::OrdinalIgnoreCase)){throw 'Unsafe package path.'}
 if((Get-FileHash -LiteralPath $full -Algorithm SHA256).Hash.ToLowerInvariant() -ne $expected){throw "Package checksum failed: $relative"}
}
Invoke-WslChecked @('-d',$Distro,'-u','root','--exec','true')
if($FromSetup -and -not $Upgrade){
 & wsl.exe -d $Distro -u root --exec test -f '/home/rakazo/crd-bot-team/.installed'
 if($LASTEXITCODE -eq 0){$Upgrade=$true}
 elseif($LASTEXITCODE -ne 1){throw 'Cannot check the existing team installation.'}
}
if($Upgrade){
 $teamDir='/home/rakazo/crd-bot-team'
 & wsl.exe -d $Distro -u root --exec test -f "$teamDir/.installed"
 if($LASTEXITCODE -ne 0){
  Write-Host "No completed team installation found at $teamDir in $Distro. Existing Compose projects:"
  & wsl.exe -d $Distro -u root --exec docker compose ls --all
  throw 'Upgrade stopped before changes. Identify the deployment from the project name and config paths above.'
 }
 foreach($portSpec in @(@('WebPort','web-port'),@('ApiPort','api-port'))){
  $setting,$filename=$portSpec
  $stored=& wsl.exe -d $Distro -u root --exec cat "$teamDir/$filename"
  if($LASTEXITCODE -ne 0 -or "$stored".Trim() -notmatch '^[0-9]{1,5}$'){throw "Invalid installed $setting in $teamDir/$filename"}
  $number=[int]("$stored".Trim())
  if($number -lt 1024 -or $number -gt 65535){throw "Invalid installed $setting value: $number"}
  if($PSBoundParameters.ContainsKey($setting) -and (Get-Variable -Name $setting -ValueOnly) -ne $number){throw "Installed $setting is $number. Retry -Upgrade without port arguments."}
  Set-Variable -Name $setting -Value $number
 }
 Write-Host "Upgrading team installation on web port $WebPort and API port $ApiPort."
}
if($WebPort -eq $ApiPort){throw 'WebPort and ApiPort must differ.'}
$linuxRoot=(& wsl.exe -d $Distro -u root --exec wslpath -a $PSScriptRoot).Trim()
if($LASTEXITCODE -ne 0 -or -not $linuxRoot.StartsWith('/')){throw 'Cannot map package directory to WSL.'}
& wsl.exe -d $Distro -u root --exec sh -c 'command -v docker >/dev/null'
if($LASTEXITCODE -ne 0){Invoke-WslChecked @('-d',$Distro,'-u','root','--exec','bash',"$linuxRoot/rakazo/scripts/wsl/10-install-docker.sh")}
Invoke-WslChecked @('-d',$Distro,'-u','root','--exec','systemctl','start','docker')
Invoke-WslChecked @('-d',$Distro,'-u','root','--exec','bash',"$linuxRoot/rakazo/scripts/wsl/20-create-user.sh")
$mode=if($Upgrade){'upgrade'}else{'install'}
Invoke-WslChecked @('-d',$Distro,'-u','rakazo','--exec','bash',"$linuxRoot/rakazo/team-installer/install.sh",'/home/rakazo/crd-bot-team','crd-bot-team',$WebPort.ToString(),$ApiPort.ToString(),$mode)
$launcher=Join-Path $PSScriptRoot 'Start-crd-bot.ps1'
$icon=Join-Path $PSScriptRoot 'rakazo\team-installer\app\branding\favicon.ico'
$shortcutPath=Join-Path ([Environment]::GetFolderPath('Desktop')) 'crd-bot-team.lnk'
$link=(New-Object -ComObject WScript.Shell).CreateShortcut($shortcutPath)
$link.TargetPath='powershell.exe'
$link.Arguments='-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "'+$launcher+'" -Distro "'+$Distro+'" -WebPort '+$WebPort
$link.IconLocation="$icon,0"
$link.Save()
Write-Host 'Installed. Open crd-bot-team on Desktop. Create your own account, then connect your model.'
& $launcher -Distro $Distro -WebPort $WebPort

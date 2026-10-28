param([string]$Distro='Ubuntu-24.04', [ValidateRange(1024,65535)][int]$WebPort=5173, [ValidateRange(1024,65535)][int]$ApiPort=3100)
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
if($WebPort -eq $ApiPort){throw 'WebPort and ApiPort must differ.'}
Invoke-WslChecked @('-d',$Distro,'-u','root','--exec','true')
$linuxRoot=(& wsl.exe -d $Distro -u root --exec wslpath -a $PSScriptRoot).Trim()
if($LASTEXITCODE -ne 0 -or -not $linuxRoot.StartsWith('/')){throw 'Cannot map package directory to WSL.'}
& wsl.exe -d $Distro -u root --exec sh -c 'command -v docker >/dev/null'
if($LASTEXITCODE -ne 0){Invoke-WslChecked @('-d',$Distro,'-u','root','--exec','bash',"$linuxRoot/rakazo/scripts/wsl/10-install-docker.sh")}
Invoke-WslChecked @('-d',$Distro,'-u','root','--exec','systemctl','start','docker')
Invoke-WslChecked @('-d',$Distro,'-u','root','--exec','bash',"$linuxRoot/rakazo/scripts/wsl/20-create-user.sh")
Invoke-WslChecked @('-d',$Distro,'-u','rakazo','--exec','bash',"$linuxRoot/rakazo/team-installer/install.sh",'/home/rakazo/crd-bot-team','crd-bot-team',$WebPort.ToString(),$ApiPort.ToString())
$launcher=Join-Path $PSScriptRoot 'Start-crd-bot.ps1'
$icon=Join-Path $PSScriptRoot 'rakazo\assets\robot-cats-v1\crd-bot-neo-cat-6f0d37c0.ico'
$shortcutPath=Join-Path ([Environment]::GetFolderPath('Desktop')) 'crd-bot-team.lnk'
$link=(New-Object -ComObject WScript.Shell).CreateShortcut($shortcutPath)
$link.TargetPath='powershell.exe'
$link.Arguments='-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "'+$launcher+'" -Distro "'+$Distro+'" -WebPort '+$WebPort
$link.IconLocation="$icon,0"
$link.Save()
Write-Host 'Installed. Open crd-bot-team on Desktop. Create your own account, then connect your model.'
& $launcher -Distro $Distro -WebPort $WebPort
$ErrorActionPreference='Stop'
$root=(Resolve-Path "$PSScriptRoot\..\..\..").Path
$global:crdTestCalls=@()
$global:crdTestOpened=0
function Join-Path {
 param([AllowEmptyString()][string]$Path,[string]$ChildPath)
 # The installer test mocks shortcut creation even on accounts without a Desktop.
 if(-not $Path -and $ChildPath -eq 'crd-bot-team.lnk'){$Path=$env:TEMP}
 Microsoft.PowerShell.Management\Join-Path -Path $Path -ChildPath $ChildPath
}
function wsl.exe {
 $global:crdTestCalls+=,@($args)
 $global:LASTEXITCODE=0
 if($args -contains '/home/rakazo/crd-bot-team/.installed' -and $global:crdTestFreshSetup){$global:LASTEXITCODE=1;return}
 if($args -contains '/home/rakazo/crd-bot-team/web-port'){return '5273'}
 if($args -contains '/home/rakazo/crd-bot-team/api-port'){return '3200'}
 if($args -contains 'wslpath'){return '/mock/package with spaces'}
}
function Invoke-WebRequest {return @{StatusCode=200}}
function Start-Process {
 param($FilePath,$ArgumentList)
 if($FilePath -ne 'msedge.exe' -or $ArgumentList[0] -ne '--app=http://127.0.0.1:5273'){throw 'Wrong app launch'}
 $global:crdTestOpened++
}
function New-Object {
 param($ComObject)
 if($ComObject -ne 'WScript.Shell'){throw 'Unexpected COM access'}
 $shell=[pscustomobject]@{}
 $shell | Add-Member ScriptMethod CreateShortcut {
  param($path)
  $global:crdTestShortcut=[pscustomobject]@{TargetPath='';Arguments='';IconLocation='';Saved=$false}
  $global:crdTestShortcut | Add-Member ScriptMethod Save {$this.Saved=$true}
  return $global:crdTestShortcut
 }
 return $shell
}
& "$root\Install-crd-bot.ps1" -WebPort 5273 -ApiPort 3200
if($global:crdTestOpened -ne 1 -or -not $global:crdTestShortcut.Saved){throw 'Launcher/shortcut not invoked'}
if($global:crdTestShortcut.IconLocation -notmatch 'branding\\favicon\.ico,0$'){throw 'Missing branded shortcut icon'}
if($global:crdTestShortcut.Arguments -notmatch '-WebPort 5273'){throw 'Shortcut port lost'}
$installCalls=@($global:crdTestCalls | Where-Object {$_ -contains '/mock/package with spaces/rakazo/team-installer/install.sh'})
if($installCalls.Count -ne 1){throw 'Installer arguments not forwarded intact'}
if($installCalls[0] -notcontains '3200'){throw 'API port lost'}
& "$root\Install-crd-bot.ps1" -Upgrade
$upgradeCalls=@($global:crdTestCalls | Where-Object {$_ -contains 'upgrade'})
if($upgradeCalls.Count -ne 1){throw 'Upgrade mode was not forwarded'}
$global:crdTestFreshSetup=$true
& "$root\Install-crd-bot.ps1" -FromSetup -WebPort 5273 -ApiPort 3200
if($global:crdTestOpened -ne 3 -or @($global:crdTestCalls | Where-Object {$_ -contains 'install'}).Count -ne 2){throw 'Setup did not select new installation'}
$global:crdTestFreshSetup=$false
& "$root\Install-crd-bot.ps1" -FromSetup
if($global:crdTestOpened -ne 4 -or @($global:crdTestCalls | Where-Object {$_ -contains 'upgrade'}).Count -ne 2){throw 'Setup did not resume the existing team deployment'}
'PASS Windows wrapper, fresh and existing Setup paths, branded shortcut and launcher (mocked WSL/COM/browser)'
'No machine prerequisites or GUI were changed by this test.'

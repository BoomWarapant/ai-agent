$ErrorActionPreference='Stop'
$root=(Resolve-Path "$PSScriptRoot\..\..\..").Path
$global:crdTestCalls=@()
$global:crdTestOpened=0
function wsl.exe {
 $global:crdTestCalls+=,@($args)
 $global:LASTEXITCODE=0
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
if($global:crdTestShortcut.IconLocation -notmatch 'crd-bot-neo-cat.*ico,0$'){throw 'Missing cat icon'}
if($global:crdTestShortcut.Arguments -notmatch '-WebPort 5273'){throw 'Shortcut port lost'}
$installCalls=@($global:crdTestCalls | Where-Object {$_ -contains '/mock/package with spaces/rakazo/team-installer/install.sh'})
if($installCalls.Count -ne 1){throw 'Installer arguments not forwarded intact'}
if($installCalls[0] -notcontains '3200'){throw 'API port lost'}
'PASS Windows wrapper forwarding, custom ports, cat shortcut and launcher (mocked WSL/COM/browser)'
'No machine prerequisites or GUI were changed by this test.'
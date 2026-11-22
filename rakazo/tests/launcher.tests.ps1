$ErrorActionPreference = "Stop"
. "$PSScriptRoot\..\scripts\windows\rakazo-start.ps1"
$script:opened = 0
$script:requests = 0
$script:mode = "success"
function wsl.exe {
 if ($script:mode -in @("native-stderr", "native-stderr-fail")) {
  & "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -EncodedCommand ([Convert]::ToBase64String([Text.Encoding]::Unicode.GetBytes('[Console]::Error.WriteLine("Container test Running"); exit 0')))
  $global:LASTEXITCODE = if ($script:mode -eq "native-stderr-fail") { 7 } else { $LASTEXITCODE }
  return
 }
 $global:LASTEXITCODE = if ($script:mode -eq "compose-fail") { 7 } else { 0 }; "compose-test" }
function Start-Process { param($FilePath,$ArgumentList,$ErrorAction) $script:opened++; if ($ArgumentList[1] -notmatch '^--user-data-dir=".*"$') { throw "Profile path must be quoted" } }
function Invoke-WebRequest {
 param($Uri,[switch]$UseBasicParsing,$TimeoutSec)
 $script:requests++
 if ($script:mode -eq "connection-fail") { throw "connection refused" }
 if ($script:mode -eq "web-fail" -and $Uri -notlike "*/health") { throw "web not ready" }
 if ($script:mode -eq "api-unhealthy") { return @{StatusCode=200;Content='{"ok":false}'} }
 if ($script:mode -eq "retry" -and $script:requests -eq 1) { throw "temporary failure" }
 return @{StatusCode=200;Content='{"ok":true}'}
}
foreach ($case in @("success","compose-fail","connection-fail","web-fail","api-unhealthy","retry","native-stderr","native-stderr-fail")) {
 $script:mode=$case; $script:opened=0; $script:requests=0; $caught=$null
 try { Start-RakazoApp -ReadyTimeoutSeconds 1 } catch { $caught=$_.Exception.Message }
 $expected = $case -in @("success","retry","native-stderr")
 if ($expected -and ($caught -or $script:opened -ne 1)) { throw "$case failed: $caught" }
 if (-not $expected -and (-not $caught -or $script:opened -ne 0)) { throw "$case opened Edge or did not fail" }
 if ($case -in @("compose-fail","native-stderr-fail") -and $script:requests -ne 0) { throw "HTTP called after compose failure" }
 Write-Output "PASS $case"
}

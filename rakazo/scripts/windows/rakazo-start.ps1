# Dot-source to test without starting services.
param([string]$Distro = "Ubuntu-24.04", [int]$ReadyTimeoutSeconds = 120)
function Start-RakazoApp {
    param([string]$Distro = "Ubuntu-24.04", [int]$ReadyTimeoutSeconds = 120)
    $ErrorActionPreference = "Stop"
    if ($ReadyTimeoutSeconds -lt 1) { throw "ReadyTimeoutSeconds must be positive." }
    # Windows PowerShell treats native stderr progress as an error record.
    # Docker Compose success is determined by its exit code.
    $savedErrorActionPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = "Continue"
        $composeOutput = & wsl.exe -d $Distro -u rakazo --exec docker compose --project-directory /home/rakazo/rakazo --env-file /home/rakazo/rakazo/.env -f /home/rakazo/rakazo/docker-compose.images.yml -f /home/rakazo/rakazo/docker-compose.override.yml up -d --wait --wait-timeout 300 2>&1
        $composeExitCode = $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $savedErrorActionPreference
    }
    if ($composeExitCode -ne 0) { throw "Docker Compose failed (exit $composeExitCode).`n$($composeOutput -join "`n")" }
    $timer = [Diagnostics.Stopwatch]::StartNew()
    $lastFailure = "API or web not ready"
    $ready = $false
    while ($timer.Elapsed.TotalSeconds -lt $ReadyTimeoutSeconds) {
        try {
            $api = Invoke-WebRequest -Uri "http://127.0.0.1:3100/health" -UseBasicParsing -TimeoutSec 3
            if ($api.StatusCode -ne 200 -or ($api.Content | ConvertFrom-Json).ok -ne $true) { throw "API health is not ok." }
            $web = Invoke-WebRequest -Uri "http://127.0.0.1:5173" -UseBasicParsing -TimeoutSec 3
            if ($web.StatusCode -ne 200) { throw "Web is not ready." }
            $ready = $true
            break
        } catch { $lastFailure = $_.Exception.Message }
        Start-Sleep -Milliseconds 500
    }
    if (-not $ready) { throw "Rakazo readiness timed out after $ReadyTimeoutSeconds seconds. $lastFailure" }
    $profile = Join-Path $env:LOCALAPPDATA "RakazoEdge"
    Start-Process -FilePath "msedge.exe" -ArgumentList @("--app=http://127.0.0.1:5173", ("--user-data-dir=`"{0}`"" -f $profile)) -ErrorAction Stop
}
if ($MyInvocation.InvocationName -ne ".") {
    try { Start-RakazoApp -Distro $Distro -ReadyTimeoutSeconds $ReadyTimeoutSeconds }
    catch {
        $message = $_.Exception.Message
        try { Add-Type -AssemblyName System.Windows.Forms; [void][System.Windows.Forms.MessageBox]::Show($message, "Rakazo startup failed") } catch { }
        Write-Error $message
        exit 1
    }
}

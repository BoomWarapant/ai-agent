# Start Rakazo and open it as an app window (used by the desktop shortcut).
# - wakes WSL, runs "docker compose up -d" (idempotent, always loads the override)
# - waits for API health, then opens Edge in app mode with a separate profile
#   (separate profile = no restored tabs from your main Edge, separate cookies)
$distro = "Ubuntu-24.04"
wsl -d $distro -u rakazo -- bash -c 'cd ~/rakazo && docker compose --env-file .env -f docker-compose.images.yml -f docker-compose.override.yml up -d --wait --wait-timeout 300' | Out-Null
for ($i = 0; $i -lt 60; $i++) { try { if ((Invoke-WebRequest http://127.0.0.1:3100/health -UseBasicParsing -TimeoutSec 3).StatusCode -eq 200) { break } } catch {}; Start-Sleep 2 }
Start-Process msedge "--app=http://127.0.0.1:5173 --user-data-dir=$env:LOCALAPPDATA\RakazoEdge"

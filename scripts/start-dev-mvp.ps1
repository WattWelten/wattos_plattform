# scripts/start-dev-mvp.ps1
# Startet pnpm dev:mvp mit geladenen .env Dateien

$ErrorActionPreference = "Continue"
$projectRoot = if ($PSScriptRoot) { Split-Path $PSScriptRoot -Parent } else { $PWD }
Set-Location $projectRoot

Write-Host "=== Stoppe laufende Services ===" -ForegroundColor Cyan
# Stoppe alle Node-Prozesse die auf unseren Ports laufen
$ports = @(3000, 3001, 3003, 3004, 3005, 3006, 3007, 3009, 3010, 3011, 3013, 3015, 3016, 3017, 3018)
foreach ($port in $ports) {
    $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($conn) {
        Write-Host "Stoppe Prozess auf Port $port (PID: $($conn.OwningProcess))" -ForegroundColor Yellow
        Stop-Process -Id $conn.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}
Start-Sleep -Seconds 2

Write-Host ""
Write-Host "=== Lade Environment-Variablen ===" -ForegroundColor Cyan

# Lade Gateway .env
if (Test-Path "apps\gateway\.env") {
    Write-Host "Lade apps\gateway\.env..." -ForegroundColor Yellow
    $envLines = Get-Content "apps\gateway\.env" | Where-Object { $_ -match "^\s*[^#]" -and $_ -match "=" }
    foreach ($line in $envLines) {
        if ($line -match "^([^=]+)=(.*)$") {
            $key = $Matches[1].Trim()
            $value = $Matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
    Write-Host "  ✅ Gateway .env geladen" -ForegroundColor Green
} else {
    Write-Host "  ⚠️ apps\gateway\.env nicht gefunden" -ForegroundColor Yellow
}

# Lade Web .env.local (falls vorhanden)
if (Test-Path "apps\web\.env.local") {
    Write-Host "Lade apps\web\.env.local..." -ForegroundColor Yellow
    $envLines = Get-Content "apps\web\.env.local" | Where-Object { $_ -match "^\s*[^#]" -and $_ -match "=" }
    foreach ($line in $envLines) {
        if ($line -match "^([^=]+)=(.*)$") {
            $key = $Matches[1].Trim()
            $value = $Matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
    Write-Host "  ✅ Web .env.local geladen" -ForegroundColor Green
}

# Prüfe kritische Variablen
Write-Host ""
Write-Host "=== Prüfe kritische Environment-Variablen ===" -ForegroundColor Cyan
if ($env:DATABASE_URL) {
    Write-Host "  ✅ DATABASE_URL gesetzt" -ForegroundColor Green
} else {
    Write-Host "  ❌ DATABASE_URL fehlt!" -ForegroundColor Red
}
if ($env:JWT_SECRET) {
    Write-Host "  ✅ JWT_SECRET gesetzt (Länge: $($env:JWT_SECRET.Length))" -ForegroundColor Green
} else {
    Write-Host "  ❌ JWT_SECRET fehlt!" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Starte Services mit pnpm dev:mvp ===" -ForegroundColor Cyan
Write-Host "Service-Ports:" -ForegroundColor Yellow
Write-Host "  - Web: http://localhost:3000" -ForegroundColor Green
Write-Host "  - Gateway: http://localhost:3001" -ForegroundColor Blue
Write-Host "  - Chat-Service: http://localhost:3006" -ForegroundColor Cyan
Write-Host "  - Agent-Service: http://localhost:3003" -ForegroundColor Magenta
Write-Host "  - RAG-Service: http://localhost:3005" -ForegroundColor Yellow
Write-Host "  - Dashboard-Service: http://localhost:3011" -ForegroundColor DarkCyan
Write-Host ""
Write-Host "Drücken Sie Ctrl+C zum Beenden" -ForegroundColor Yellow
Write-Host ""

# Starte pnpm dev:mvp
pnpm dev:mvp

# scripts/start-gateway-only.ps1
# Startet nur den Gateway-Service für Login-Tests

$ErrorActionPreference = "Continue"
$projectRoot = if ($PSScriptRoot) { Split-Path $PSScriptRoot -Parent } else { $PWD }
Set-Location $projectRoot

Write-Host "=== Starte Gateway-Service ===" -ForegroundColor Cyan

# Lade Gateway .env
if (Test-Path "apps\gateway\.env") {
    Write-Host "Lade apps\gateway\.env..." -ForegroundColor Yellow
    Get-Content "apps\gateway\.env" | Where-Object { $_ -match "^\s*[^#]" -and $_ -match "=" } | ForEach-Object {
        if ($_ -match "^([^=]+)=(.*)$") {
            $key = $Matches[1].Trim()
            $value = $Matches[2].Trim()
            [Environment]::SetEnvironmentVariable($key, $value, "Process")
        }
    }
    Write-Host "  ✅ Gateway .env geladen" -ForegroundColor Green
} else {
    Write-Host "  ❌ apps\gateway\.env nicht gefunden!" -ForegroundColor Red
    exit 1
}

# Prüfe kritische Variablen
Write-Host ""
Write-Host "=== Prüfe kritische Variablen ===" -ForegroundColor Cyan
if (-not $env:DATABASE_URL) {
    Write-Host "  ❌ DATABASE_URL fehlt!" -ForegroundColor Red
    exit 1
} else {
    Write-Host "  ✅ DATABASE_URL gesetzt" -ForegroundColor Green
}

if (-not $env:JWT_SECRET) {
    Write-Host "  ❌ JWT_SECRET fehlt!" -ForegroundColor Red
    exit 1
} else {
    Write-Host "  ✅ JWT_SECRET gesetzt (Länge: $($env:JWT_SECRET.Length))" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== Starte Gateway ===" -ForegroundColor Cyan
Write-Host "Gateway wird auf http://localhost:3001 gestartet" -ForegroundColor Yellow
Write-Host "Drücken Sie Ctrl+C zum Beenden" -ForegroundColor Yellow
Write-Host ""

# Starte Gateway direkt (blockiert)
cd apps\gateway
pnpm dev

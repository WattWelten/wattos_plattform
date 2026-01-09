# Seed Script mit Environment Variable Setup
# Verwendet DATABASE_URL aus Environment oder .env

$ErrorActionPreference = "Stop"

# Setze DATABASE_URL falls nicht gesetzt
if (-not $env:DATABASE_URL) {
    $env:DATABASE_URL = "postgresql://wattos:wattos_dev_password@localhost:5432/wattos_plattform"
    Write-Host "✅ DATABASE_URL gesetzt: $env:DATABASE_URL" -ForegroundColor Green
}

# Führe Seed-Script aus
Write-Host "🌱 Starte Seed-Script..." -ForegroundColor Cyan
Set-Location $PSScriptRoot\..
node --import tsx scripts/seed.ts

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Seed-Script erfolgreich abgeschlossen!" -ForegroundColor Green
} else {
    Write-Host "❌ Seed-Script fehlgeschlagen!" -ForegroundColor Red
    exit $LASTEXITCODE
}

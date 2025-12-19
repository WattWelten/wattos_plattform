# Start Mock-API Server Script
# Verwendet ts-node um TypeScript direkt auszuführen

$ErrorActionPreference = "Stop"

Write-Host "🚀 Starting Mock-API Server..." -ForegroundColor Cyan

# Prüfe ob Port 4001 bereits belegt ist
$portInUse = Get-NetTCPConnection -LocalPort 4001 -ErrorAction SilentlyContinue
if ($portInUse) {
    Write-Host "⚠️  Port 4001 is already in use. Stopping existing process..." -ForegroundColor Yellow
    $process = Get-Process -Id ($portInUse.OwningProcess) -ErrorAction SilentlyContinue
    if ($process) {
        Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }
}

# Start Mock-API Server
Set-Location $PSScriptRoot\..
try {
    pnpm mock:start
} catch {
    Write-Host "❌ Failed to start Mock-API Server: $_" -ForegroundColor Red
    exit 1
}


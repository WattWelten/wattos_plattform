# WattOS MVP Dev Stack Start-Script mit Logs
# Startet alle MVP-Services mit sichtbaren Logs

$ErrorActionPreference = "Continue"
$projectRoot = if ($PSScriptRoot) { Split-Path $PSScriptRoot -Parent } else { $PWD }
Set-Location $projectRoot

Write-Host "=== WattOS MVP Dev Stack Start ===" -ForegroundColor Cyan
Write-Host ""

# PrÃ¼fe Docker Services
Write-Host "=== 1. PrÃ¼fe Docker Services ===" -ForegroundColor Cyan
$dockerRunning = docker ps 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Docker lÃ¤uft" -ForegroundColor Green
    docker compose up -d postgres redis 2>&1 | Out-Null
    Start-Sleep -Seconds 3
} else {
    Write-Host "Docker scheint nicht zu laufen" -ForegroundColor Yellow
}

Write-Host ""

# Migrationen
Write-Host "=== 2. Datenbank-Migrationen ===" -ForegroundColor Cyan
pnpm db:migrate 2>&1 | Out-Null
Write-Host ""

# Environment-Variablen
$env:NODE_ENV = "development"
$env:DATABASE_URL = if ($env:DATABASE_URL) { $env:DATABASE_URL } else { "postgresql://postgres:postgres@localhost:5432/wattos" }
$env:REDIS_URL = if ($env:REDIS_URL) { $env:REDIS_URL } else { "redis://localhost:6379" }
$env:NEXT_PUBLIC_API_URL = if ($env:NEXT_PUBLIC_API_URL) { $env:NEXT_PUBLIC_API_URL } else { "http://localhost:3001/api" }
$env:NEXT_PUBLIC_WS_URL = if ($env:NEXT_PUBLIC_WS_URL) { $env:NEXT_PUBLIC_WS_URL } else { "http://localhost:3006" }

Write-Host "=== 3. Starte MVP-Services ===" -ForegroundColor Cyan
Write-Host "Service-Ports:" -ForegroundColor Yellow
Write-Host "  - Gateway: http://localhost:3001" -ForegroundColor Blue
Write-Host "  - Web: http://localhost:3000" -ForegroundColor Green
Write-Host "  - Chat-Service: http://localhost:3006" -ForegroundColor Yellow
Write-Host "  - Agent-Service: http://localhost:3003" -ForegroundColor Magenta
Write-Host "  - RAG-Service: http://localhost:3005" -ForegroundColor Cyan
Write-Host "  - Avatar-Service: http://localhost:3009" -ForegroundColor Red
Write-Host "  - Voice-Service: http://localhost:3016" -ForegroundColor White
Write-Host "  - Crawler-Service: http://localhost:3015" -ForegroundColor Gray
Write-Host ""
Write-Host "DrÃ¼cken Sie Ctrl+C zum Beenden" -ForegroundColor Yellow
Write-Host ""

# Starte mit concurrently
$concurrentlyCmd = "npx concurrently -n `"Gateway,Web,Chat,Agent,RAG,Avatar,Voice,Crawler`" -c `"blue,green,yellow,magenta,cyan,red,white,gray`" `"pnpm --filter @wattweiser/gateway dev`" `"pnpm --filter @wattweiser/web dev`" `"pnpm --filter @wattweiser/chat-service dev`" `"pnpm --filter @wattweiser/agent-service dev`" `"pnpm --filter @wattweiser/rag-service dev`" `"pnpm --filter @wattweiser/avatar-service dev`" `"pnpm --filter @wattweiser/voice-service dev`" `"pnpm --filter @wattweiser/crawler-service dev`""

Invoke-Expression $concurrentlyCmd

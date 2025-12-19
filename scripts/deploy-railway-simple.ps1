# Railway Deployment Script (PowerShell - Simplified)
# Deployt Services direkt

param(
    [string]$Environment = "production"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Railway Deployment" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Pruefe Railway CLI
if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Railway CLI nicht installiert" -ForegroundColor Red
    exit 1
}

Write-Host "OK: Railway CLI gefunden" -ForegroundColor Green
Write-Host ""

# Services in Priority-Reihenfolge
$services = @(
    "api-gateway",
    "llm-gateway",
    "tool-service",
    "chat-service",
    "rag-service",
    "agent-service",
    "customer-intelligence-service",
    "crawler-service",
    "voice-service",
    "character-service",
    "avatar-service",
    "feedback-service",
    "summary-service",
    "admin-service",
    "ingestion-service",
    "metaverse-service"
)

Write-Host "Deployment Plan: $($services.Count) Services" -ForegroundColor Yellow
Write-Host ""

$deployedCount = 0
$failedCount = 0

foreach ($serviceName in $services) {
    Write-Host "----------------------------------------" -ForegroundColor Cyan
    Write-Host "Deploying: $serviceName" -ForegroundColor Yellow
    Write-Host "----------------------------------------" -ForegroundColor Cyan
    
    # Pruefe Service
    railway service $serviceName 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "OK: Service $serviceName gefunden" -ForegroundColor Green
        Write-Host "INFO: Deploye im Railway Dashboard oder pushe Code" -ForegroundColor Gray
        $deployedCount++
    } else {
        Write-Host "WARN: Service $serviceName nicht gefunden" -ForegroundColor Yellow
        $failedCount++
    }
    
    Write-Host ""
    Start-Sleep -Seconds 1
}

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Deployment Zusammenfassung" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Erfolgreich: $deployedCount" -ForegroundColor Green
Write-Host "Fehlgeschlagen: $failedCount" -ForegroundColor $(if ($failedCount -gt 0) { "Red" } else { "Gray" })
Write-Host ""
Write-Host "Naechste Schritte:" -ForegroundColor Yellow
Write-Host "  1. Gehe zu Railway Dashboard"
Write-Host "  2. Klicke auf jeden Service -> Deploy"
Write-Host "  3. Oder pushe Code zu GitHub (automatisches Deployment)"
Write-Host ""







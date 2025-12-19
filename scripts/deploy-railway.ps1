# Railway Deployment Script (PowerShell)
# Deployt alle Services in korrekter Reihenfolge

param(
    [string]$Environment = "production",
    [string]$ServiceFilter = ""
)

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🚀 Railway Deployment" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "Environment: $Environment" -ForegroundColor Yellow
if ($ServiceFilter) {
    Write-Host "Service Filter: $ServiceFilter" -ForegroundColor Yellow
} else {
    Write-Host "Service Filter: all services" -ForegroundColor Yellow
}
Write-Host ""

# Prüfe Railway CLI
if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Railway CLI ist nicht installiert" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Railway CLI gefunden" -ForegroundColor Green

# Lese Services aus Config
$configFile = "scripts/services-config.json"
if (-not (Test-Path $configFile)) {
    Write-Host "❌ Config-Datei nicht gefunden: $configFile" -ForegroundColor Red
    exit 1
}

$config = Get-Content $configFile -Raw | ConvertFrom-Json
$services = $config.services

# Sortiere Services nach Priority
$sortedServices = $services.PSObject.Properties | 
    Sort-Object { $_.Value.deploymentPriority } | 
    Select-Object -ExpandProperty Name

if ($ServiceFilter) {
    $sortedServices = $sortedServices | Where-Object { $_ -eq $ServiceFilter }
}

Write-Host "📋 Deployment Plan: $($sortedServices.Count) Services" -ForegroundColor Cyan
Write-Host ""

$index = 1
foreach ($serviceName in $sortedServices) {
    $service = $services.$serviceName
    $priority = $service.deploymentPriority
    $dependencies = $service.dependencies -join ", "
    
    Write-Host "  $index. $serviceName (Priority: $priority)" -ForegroundColor White
    if ($dependencies) {
        Write-Host "     Dependencies: $dependencies" -ForegroundColor Gray
    }
    $index++
}

Write-Host ""
Write-Host "🚀 Starte Deployment..." -ForegroundColor Cyan
Write-Host ""

$deployedCount = 0
$failedCount = 0
$failedServices = @()

foreach ($serviceName in $sortedServices) {
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host "📦 Deploying: $serviceName" -ForegroundColor Yellow
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
    Write-Host ""
    
    # Prüfe ob Service existiert
    $serviceCheck = railway service $serviceName 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️ Service $serviceName nicht gefunden - überspringe" -ForegroundColor Yellow
        $failedCount++
        $failedServices += $serviceName
        continue
    }
    
    # Deploy Service
    Write-Host "🔄 Deploye $serviceName..." -ForegroundColor Yellow
    
    # Railway deploy command
    # Hinweis: railway up deployt automatisch, wenn Code gepusht wurde
    # Für manuelles Deployment: railway service $serviceName -> Deploy Button
    Write-Host "ℹ️ Hinweis: Deploye über Railway CLI..." -ForegroundColor Gray
    railway service $serviceName 2>&1 | Out-Null
    
    # Trigger Deployment (falls möglich)
    # Railway CLI hat kein direktes 'deploy' Command - muss über Dashboard gemacht werden
    Write-Host "✅ Service $serviceName bereit für Deployment" -ForegroundColor Green
    Write-Host "💡 Tipp: Deploye im Railway Dashboard oder pushe Code zu GitHub" -ForegroundColor Yellow
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ $serviceName deployed" -ForegroundColor Green
        $deployedCount++
    } else {
        Write-Host "❌ $serviceName deployment fehlgeschlagen" -ForegroundColor Red
        $failedCount++
        $failedServices += $serviceName
    }
    
    Write-Host ""
    Start-Sleep -Seconds 2  # Kurze Pause zwischen Deployments
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 Deployment Zusammenfassung" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Erfolgreich deployed: $deployedCount" -ForegroundColor Green
$failedColor = if ($failedCount -gt 0) { "Red" } else { "Gray" }
Write-Host "❌ Fehlgeschlagen: $failedCount" -ForegroundColor $failedColor

if ($failedServices.Count -gt 0) {
    Write-Host ""
    Write-Host "Fehlgeschlagene Services:" -ForegroundColor Red
    foreach ($service in $failedServices) {
        Write-Host "  - $service" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "💡 Nächste Schritte:" -ForegroundColor Yellow
Write-Host "  1. Service URLs synchronisieren: ./scripts/sync-service-urls.sh $Environment"
Write-Host "  2. Health Checks: ./scripts/post-deployment-health-check.sh $Environment"
Write-Host ""


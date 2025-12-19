# Railway Environment Variables Setup Script (PowerShell)
# Setzt alle Environment Variables automatisch basierend auf services-config.json

param(
    [string]$Environment = "production",
    [string]$ConfigFile = "scripts/services-config.json",
    [string]$SecretsFile = ".railway-secrets.env"
)

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "🔐 Railway Environment Variables Setup" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Prüfe Railway CLI
if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Railway CLI ist nicht installiert" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Railway CLI gefunden" -ForegroundColor Green

# Prüfe Node.js
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Node.js ist nicht installiert" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Node.js gefunden" -ForegroundColor Green

# Lade Secrets
if (Test-Path $SecretsFile) {
    Write-Host "📝 Lade Secrets aus $SecretsFile..." -ForegroundColor Yellow
    Get-Content $SecretsFile | Where-Object { $_ -match '^[^#].*=' } | ForEach-Object {
        $parts = $_ -split '=', 2
        if ($parts.Length -eq 2) {
            $key = $parts[0].Trim()
            $value = $parts[1].Trim()
            if ($key -and $value) {
                [Environment]::SetEnvironmentVariable($key, $value, "Process")
            }
        }
    }
    Write-Host "✅ Secrets geladen" -ForegroundColor Green
} else {
    Write-Host "⚠️ Secrets-Datei nicht gefunden: $SecretsFile" -ForegroundColor Yellow
}

Write-Host ""

# Lese Services aus Config
Write-Host "📋 Lese Services aus Config..." -ForegroundColor Yellow

$configJson = Get-Content $ConfigFile -Raw | ConvertFrom-Json
$services = $configJson.services

Write-Host "✅ $($services.PSObject.Properties.Count) Services gefunden" -ForegroundColor Green
Write-Host ""

# Setze Shared Variables (bereits im Dashboard gesetzt - überspringe)
Write-Host "ℹ️ Shared Variables (NODE_ENV, DEPLOYMENT_PLATFORM) bereits im Dashboard gesetzt" -ForegroundColor Gray
Write-Host ""

# Verarbeite jeden Service
Write-Host "🔧 Setze Service-spezifische Variables..." -ForegroundColor Yellow
Write-Host ""

$serviceCount = 0
$varCount = 0

foreach ($serviceKey in $services.PSObject.Properties.Name) {
    $service = $services.$serviceKey
    $serviceName = $service.name
    $serviceCount++
    
    Write-Host "📦 Verarbeite $serviceName..." -ForegroundColor Cyan
    
    # Verarbeite Environment Variables
    if ($service.environmentVariables) {
        foreach ($envVar in $service.environmentVariables) {
            $varName = $envVar.name
            $required = $envVar.required
            $defaultValue = $envVar.default
            
            # Überspringe DEPLOYMENT_PLATFORM und NODE_ENV (bereits als Shared gesetzt)
            if ($varName -eq "DEPLOYMENT_PLATFORM" -or $varName -eq "NODE_ENV") {
                continue
            }
            
            # Überspringe Service Discovery URLs (werden später synchronisiert)
            if ($varName -like "*_URL" -and $varName -ne "DATABASE_URL" -and $varName -ne "REDIS_URL") {
                Write-Host "  ℹ️ $varName wird später synchronisiert" -ForegroundColor Gray
                continue
            }
            
            # Hole Wert aus Environment oder Default
            $varValue = $null
            $envVarValue = [Environment]::GetEnvironmentVariable($varName, "Process")
            if ($envVarValue) {
                $varValue = $envVarValue
            } elseif ($defaultValue) {
                $varValue = $defaultValue
            }
            
            # Setze Variable
            if ($varValue) {
                try {
                    $result = railway variables --set "$varName=$varValue" --service $serviceName --environment $Environment 2>&1
                    if ($LASTEXITCODE -eq 0) {
                        Write-Host "  ✅ $varName" -ForegroundColor Green
                        $varCount++
                    } else {
                        Write-Host "  ⚠️ $varName (Fehler oder bereits gesetzt)" -ForegroundColor Yellow
                    }
                } catch {
                    Write-Host "  ⚠️ $varName (Fehler: $_)" -ForegroundColor Yellow
                }
            } elseif ($required -eq $true) {
                Write-Host "  ⚠️ $varName ist erforderlich, aber nicht gesetzt" -ForegroundColor Yellow
            }
        }
    }
    
    Write-Host ""
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 Zusammenfassung" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Verarbeitete Services: $serviceCount" -ForegroundColor Green
Write-Host "✅ Gesetzte Variables: $varCount" -ForegroundColor Green
Write-Host ""
Write-Host "✅ Environment Variables Setup abgeschlossen!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Nächste Schritte:" -ForegroundColor Yellow
Write-Host "  1. Service URLs synchronisieren (nach Deployment)"
Write-Host "  2. Deployment starten: ./scripts/deploy-railway.sh $Environment"
Write-Host ""

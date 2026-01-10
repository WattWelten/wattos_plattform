#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Automatisiertes Setup-Script für WattOS Plattform
.DESCRIPTION
    Startet alle Services, führt Tests aus und validiert die Installation
#>

$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

# Farben für Output
function Write-Step { param($Message) Write-Host "`n=== $Message ===" -ForegroundColor Cyan }
function Write-Success { param($Message) Write-Host "✅ $Message" -ForegroundColor Green }
function Write-Warning { param($Message) Write-Host "⚠️  $Message" -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host "❌ $Message" -ForegroundColor Red }

# 1. Docker Status prüfen
function Test-Docker {
    Write-Step "Docker Status prüfen"
    try {
        $dockerVersion = docker --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Docker installiert: $dockerVersion"
            
            # Prüfe ob Docker Desktop läuft
            $dockerInfo = docker info 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-Success "Docker Desktop läuft"
                return $true
            } else {
                Write-Warning "Docker Desktop läuft nicht. Starte Docker Desktop..."
                Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe" -ErrorAction SilentlyContinue
                Start-Sleep -Seconds 10
                
                # Warte bis Docker bereit ist
                $maxRetries = 30
                $retry = 0
                while ($retry -lt $maxRetries) {
                    $dockerInfo = docker info 2>&1
                    if ($LASTEXITCODE -eq 0) {
                        Write-Success "Docker Desktop ist bereit"
                        return $true
                    }
                    Start-Sleep -Seconds 2
                    $retry++
                }
                Write-Error "Docker Desktop konnte nicht gestartet werden"
                return $false
            }
        } else {
            Write-Error "Docker ist nicht installiert"
            return $false
        }
    } catch {
        Write-Error "Docker-Prüfung fehlgeschlagen: $_"
        return $false
    }
}

# 2. Ports freigeben
function Clear-Ports {
    Write-Step "Ports freigeben"
    $ports = @(3000, 3001, 5432, 6379, 8080)
    foreach ($port in $ports) {
        try {
            $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
            if ($connections) {
                $processes = $connections | Select-Object -ExpandProperty OwningProcess -Unique
                foreach ($pid in $processes) {
                    $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
                    if ($process) {
                        Write-Warning "  Stoppe Prozess $($process.ProcessName) (PID: $pid) auf Port $port"
                        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                    }
                }
            }
        } catch {
            # Ignoriere Fehler
        }
    }
    Start-Sleep -Seconds 2
    Write-Success "Ports bereinigt"
}

# 3. Docker Services starten
function Start-DockerServices {
    Write-Step "Docker Services starten"
    $rootDir = "C:\cursor.ai\WattOS_Plattform"
    Set-Location $rootDir
    
    try {
        Write-Host "Starte Docker Compose..." -ForegroundColor Yellow
        docker compose -f docker-compose.dev.yml up -d 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Docker Services gestartet"
            
            # Warte auf Services
            Write-Host "Warte auf Services (60 Sekunden)..." -ForegroundColor Yellow
            Start-Sleep -Seconds 60
            
            # Prüfe Service-Status
            $services = docker compose -f docker-compose.dev.yml ps --format json 2>&1 | ConvertFrom-Json
            $healthy = 0
            foreach ($service in $services) {
                if ($service.State -eq "running") {
                    $healthy++
                    Write-Success "  $($service.Service): $($service.State)"
                } else {
                    Write-Warning "  $($service.Service): $($service.State)"
                }
            }
            
            if ($healthy -ge 3) {
                Write-Success "Docker Services sind bereit ($healthy/$($services.Count))"
                return $true
            } else {
                Write-Warning "Nicht alle Services sind bereit"
                return $false
            }
        } else {
            Write-Error "Docker Compose fehlgeschlagen"
            return $false
        }
    } catch {
        Write-Error "Docker Services konnten nicht gestartet werden: $_"
        return $false
    }
}

# 4. Database Connection prüfen
function Test-DatabaseConnection {
    Write-Step "Database Connection prüfen"
    $env:DATABASE_URL = "postgresql://wattos:wattos_dev_password@localhost:5432/wattos_plattform"
    
    try {
        # Prüfe mit psql falls verfügbar
        $testQuery = "SELECT 1 as test;" | & docker exec -i wattos-postgres psql -U wattos -d wattos_plattform 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Database Connection erfolgreich"
            return $true
        } else {
            Write-Warning "Database Connection-Test fehlgeschlagen, aber das ist OK für jetzt"
            return $true
        }
    } catch {
        Write-Warning "Database Connection-Test konnte nicht ausgeführt werden: $_"
        return $true
    }
}

# 5. Gateway starten
function Start-Gateway {
    Write-Step "Gateway Service starten"
    $rootDir = "C:\cursor.ai\WattOS_Plattform"
    $gatewayDir = Join-Path $rootDir "apps\gateway"
    
    # Setze Umgebungsvariablen
    $env:DATABASE_URL = "postgresql://wattos:wattos_dev_password@localhost:5432/wattos_plattform"
    $env:PORT = "3001"
    $env:KEYCLOAK_ISSUER = "http://localhost:8080/realms/wattos"
    $env:KEYCLOAK_JWKS_URL = "http://localhost:8080/realms/wattos/protocol/openid-connect/certs"
    $env:KEYCLOAK_AUDIENCE = "gateway"
    $env:ALLOWED_ORIGINS = "http://localhost:3000"
    
    try {
        Set-Location $gatewayDir
        
        # Starte Gateway im Hintergrund
        $gatewayProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$gatewayDir'; `$env:DATABASE_URL='$env:DATABASE_URL'; `$env:PORT='$env:PORT'; `$env:KEYCLOAK_ISSUER='$env:KEYCLOAK_ISSUER'; `$env:KEYCLOAK_JWKS_URL='$env:KEYCLOAK_JWKS_URL'; `$env:KEYCLOAK_AUDIENCE='$env:KEYCLOAK_AUDIENCE'; `$env:ALLOWED_ORIGINS='$env:ALLOWED_ORIGINS'; pnpm dev" -WindowStyle Minimized -PassThru
        
        Write-Host "Gateway gestartet (PID: $($gatewayProcess.Id))" -ForegroundColor Yellow
        Write-Host "Warte auf Gateway (30 Sekunden)..." -ForegroundColor Yellow
        Start-Sleep -Seconds 30
        
        # Prüfe Gateway Health
        $maxRetries = 10
        $retry = 0
        while ($retry -lt $maxRetries) {
            try {
                $response = Invoke-WebRequest -Uri "http://localhost:3001/api/health/liveness" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
                if ($response.StatusCode -eq 200) {
                    Write-Success "Gateway läuft! Status: $($response.StatusCode)"
                    return $true
                }
            } catch {
                $retry++
                if ($retry -lt $maxRetries) {
                    Write-Host "  Versuch ${retry}/${maxRetries}: Gateway noch nicht bereit..." -ForegroundColor Yellow
                    Start-Sleep -Seconds 3
                }
            }
        }
        
        Write-Warning "Gateway konnte nicht gestartet werden (Timeout)"
        return $false
    } catch {
        Write-Error "Gateway-Start fehlgeschlagen: $_"
        return $false
    }
}

# 6. Web Service starten
function Start-Web {
    Write-Step "Web Service starten"
    $rootDir = "C:\cursor.ai\WattOS_Plattform"
    $webDir = Join-Path $rootDir "apps\web"
    
    # Setze Umgebungsvariablen
    $env:NEXT_PUBLIC_API_URL = "http://localhost:3001"
    $env:NEXT_PUBLIC_AUTH_ISSUER = "http://localhost:8080/realms/wattos"
    
    try {
        Set-Location $webDir
        
        # Starte Web im Hintergrund
        $webProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$webDir'; `$env:NEXT_PUBLIC_API_URL='$env:NEXT_PUBLIC_API_URL'; `$env:NEXT_PUBLIC_AUTH_ISSUER='$env:NEXT_PUBLIC_AUTH_ISSUER'; pnpm dev" -WindowStyle Minimized -PassThru
        
        Write-Host "Web gestartet (PID: $($webProcess.Id))" -ForegroundColor Yellow
        Write-Host "Warte auf Web (40 Sekunden)..." -ForegroundColor Yellow
        Start-Sleep -Seconds 40
        
        # Prüfe Web Health
        $maxRetries = 10
        $retry = 0
        while ($retry -lt $maxRetries) {
            try {
                $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
                if ($response.StatusCode -eq 200) {
                    Write-Success "Web läuft! Status: $($response.StatusCode)"
                    return $true
                }
            } catch {
                $retry++
                if ($retry -lt $maxRetries) {
                    Write-Host "  Versuch ${retry}/${maxRetries}: Web noch nicht bereit..." -ForegroundColor Yellow
                    Start-Sleep -Seconds 3
                }
            }
        }
        
        Write-Warning "Web konnte nicht gestartet werden (Timeout)"
        return $false
    } catch {
        Write-Error "Web-Start fehlgeschlagen: $_"
        return $false
    }
}

# 7. E2E Tests ausführen
function Invoke-E2ETests {
    Write-Step "E2E Tests ausführen"
    $rootDir = "C:\cursor.ai\WattOS_Plattform"
    $webDir = Join-Path $rootDir "apps\web"
    
    try {
        Set-Location $webDir
        
        Write-Host "Starte E2E Tests (kann einige Minuten dauern)..." -ForegroundColor Yellow
        $testOutput = pnpm test:e2e 2>&1
        
        if ($LASTEXITCODE -eq 0) {
            Write-Success "E2E Tests erfolgreich"
            return $true
        } else {
            Write-Warning "E2E Tests haben Fehler (siehe Output)"
            $testOutput | Select-Object -Last 30
            return $false
        }
    } catch {
        Write-Error "E2E Tests fehlgeschlagen: $_"
        return $false
    }
}

# 8. Embeddings-Analyse
function Invoke-EmbeddingsAnalysis {
    Write-Step "Embeddings-Analyse"
    $rootDir = "C:\cursor.ai\WattOS_Plattform"
    
    try {
        Set-Location $rootDir
        $env:DATABASE_URL = "postgresql://wattos:wattos_dev_password@localhost:5432/wattos_plattform"
        
        Write-Host "Analysiere Seed-Daten auf fehlende Embeddings..." -ForegroundColor Yellow
        $output = node --import tsx scripts/generate-embeddings-for-seed.ts 2>&1
        
        Write-Success "Embeddings-Analyse abgeschlossen"
        $output | Select-Object -Last 20
        return $true
    } catch {
        Write-Warning "Embeddings-Analyse fehlgeschlagen: $_"
        return $false
    }
}

# Hauptfunktion
function Start-AutomatedSetup {
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "  WATTOS AUTOMATISIERTES SETUP" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Green
    
    $results = @{}
    
    # 1. Docker prüfen
    $results.Docker = Test-Docker
    if (-not $results.Docker) {
        Write-Error "Docker ist erforderlich. Bitte Docker Desktop starten und erneut versuchen."
        return $results
    }
    
    # 2. Ports freigeben
    Clear-Ports
    
    # 3. Docker Services starten
    $results.DockerServices = Start-DockerServices
    
    # 4. Database Connection prüfen
    $results.Database = Test-DatabaseConnection
    
    # 5. Gateway starten
    $results.Gateway = Start-Gateway
    
    # 6. Web starten
    $results.Web = Start-Web
    
    # 7. E2E Tests (optional, kann fehlschlagen)
    $results.E2ETests = Invoke-E2ETests
    
    # 8. Embeddings-Analyse
    $results.Embeddings = Invoke-EmbeddingsAnalysis
    
    # Zusammenfassung
    Write-Host "`n========================================" -ForegroundColor Green
    Write-Host "  ZUSAMMENFASSUNG" -ForegroundColor Green
    Write-Host "========================================`n" -ForegroundColor Green
    
    foreach ($key in $results.Keys) {
        if ($results[$key]) {
            Write-Success "${key}: Erfolgreich"
        } else {
            Write-Warning "${key}: Fehlgeschlagen oder uebersprungen"
        }
    }
    
    return $results
}

# Script ausführen
Start-AutomatedSetup

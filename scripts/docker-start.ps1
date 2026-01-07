# scripts/docker-start.ps1
# Startet Docker Compose fÃ¼r MVP-Entwicklungsumgebung (Windows)
# Vollautomatisiert mit Admin-Rechte-PrÃ¼fung

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$ProjectRoot = Split-Path -Parent $ScriptDir

Set-Location $ProjectRoot

# PrÃ¼fe Admin-Rechte
function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

if (-not (Test-Administrator)) {
    Write-Host "âš ï¸  This script requires administrator privileges for Docker operations." -ForegroundColor Yellow
    Write-Host "   Attempting to restart with elevated privileges..." -ForegroundColor Yellow
    
    # Starte PowerShell mit Admin-Rechten
    $arguments = "-ExecutionPolicy Bypass -File `"$($MyInvocation.MyCommand.Path)`""
    Start-Process powershell -Verb RunAs -ArgumentList $arguments
    exit
}

Write-Host "ðŸ³ Starting Docker services for MVP development stack..." -ForegroundColor Cyan
Write-Host ""

# PrÃ¼fe ob Docker Desktop lÃ¤uft
try {
    docker info | Out-Null
    Write-Host "âœ… Docker is running" -ForegroundColor Green
} catch {
    Write-Host "âŒ Docker Desktop is not running." -ForegroundColor Red
    Write-Host "   Attempting to start Docker Desktop..." -ForegroundColor Yellow
    
    # Versuche Docker Desktop zu starten
    $dockerDesktopPath = "$env:ProgramFiles\Docker\Docker\Docker Desktop.exe"
    if (Test-Path $dockerDesktopPath) {
        Start-Process $dockerDesktopPath
        Write-Host "   Waiting for Docker Desktop to start (30s)..." -ForegroundColor Yellow
        $timeout = 30
        while ($timeout -gt 0) {
            Start-Sleep -Seconds 1
            try {
                docker info | Out-Null
                Write-Host "âœ… Docker Desktop is now running" -ForegroundColor Green
                break
            } catch {
                $timeout--
            }
        }
        if ($timeout -eq 0) {
            Write-Host "âŒ Docker Desktop did not start in time. Please start it manually." -ForegroundColor Red
            exit 1
        }
    } else {
        Write-Host "âŒ Docker Desktop not found. Please install Docker Desktop." -ForegroundColor Red
        exit 1
    }
}

# PrÃ¼fe ob docker-compose verfÃ¼gbar ist
$ComposeCmd = "docker compose"
try {
    docker compose version | Out-Null
    Write-Host "âœ… Docker Compose V2 detected" -ForegroundColor Green
} catch {
    $ComposeCmd = "docker-compose"
    try {
        docker-compose version | Out-Null
        Write-Host "âœ… Docker Compose V1 detected" -ForegroundColor Green
    } catch {
        Write-Host "âŒ Docker Compose is not available." -ForegroundColor Red
        exit 1
    }
}

# PrÃ¼fe ob Ports bereits belegt sind
function Test-Port {
    param([int]$Port, [string]$Service)
    $connection = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    if ($connection) {
        Write-Host "âš ï¸  Port $Port is already in use (may be from previous Docker container)" -ForegroundColor Yellow
    }
}

Test-Port -Port 5432 -Service "PostgreSQL"
Test-Port -Port 6379 -Service "Redis"

# Starte Services
Write-Host ""
Write-Host "ðŸ“¦ Starting PostgreSQL (with pgvector) and Redis..." -ForegroundColor Yellow
$composeArgs = $ComposeCmd.Split(' ')
& $composeArgs[0] $composeArgs[1] up -d

# Warte auf Healthchecks
Write-Host ""
Write-Host "â³ Waiting for services to be healthy (max 30s)..." -ForegroundColor Yellow

$timeout = 30
$healthy = $false
while ($timeout -gt 0) {
    $status = & $composeArgs[0] $composeArgs[1] ps 2>$null
    if ($status -match "healthy") {
        $healthy = $true
        break
    }
    Start-Sleep -Seconds 1
    Write-Host "." -NoNewline
    $timeout--
}
Write-Host ""

if ($healthy) {
    Write-Host "âœ… All services are healthy!" -ForegroundColor Green
} else {
    $status = & $composeArgs[0] $composeArgs[1] ps 2>$null
    if ($status -match "Up") {
        Write-Host "âš ï¸  Services are running but health checks may still be pending..." -ForegroundColor Yellow
        Write-Host "   Run 'docker compose ps' to check status"
    } else {
        Write-Host "âŒ Some services failed to start." -ForegroundColor Red
        Write-Host "   Check logs with: docker compose logs"
        & $composeArgs[0] $composeArgs[1] ps
        exit 1
    }
}

Write-Host ""
Write-Host "ðŸ“Š Service Status:" -ForegroundColor Cyan
& $composeArgs[0] $composeArgs[1] ps

Write-Host ""
Write-Host "ðŸ”— Service URLs:" -ForegroundColor Cyan
Write-Host "   PostgreSQL: localhost:5432"
Write-Host "   Redis: localhost:6379"
Write-Host ""
Write-Host "ðŸ“ Useful commands:" -ForegroundColor Cyan
Write-Host "   View logs:    docker compose logs -f"
Write-Host "   Stop:         docker compose down"
Write-Host "   Stop + Volumes: docker compose down -v"
Write-Host "   Status:       docker compose ps"
Write-Host ""
Write-Host "âœ… Docker stack is ready for development!" -ForegroundColor Green

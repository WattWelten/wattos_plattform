# WattOS Plattform - Lokales Setup-Skript (Windows PowerShell)
# Prüft Voraussetzungen, startet Docker Services und führt Setup aus

$ErrorActionPreference = "Stop"

# Farben für Terminal-Ausgabe
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

Write-ColorOutput Cyan "WattOS Plattform - Lokales Setup`n"

# Funktionen
function Test-Command {
    param([string]$Command)
    $exists = Get-Command $Command -ErrorAction SilentlyContinue
    if ($exists) {
        Write-ColorOutput Green "✓ $Command gefunden"
        return $true
    } else {
        Write-ColorOutput Red "✗ $Command nicht gefunden"
        return $false
    }
}

function Wait-ForService {
    param(
        [string]$Host,
        [int]$Port,
        [string]$Service,
        [int]$MaxAttempts = 30
    )
    
    Write-ColorOutput Blue "Warte auf $Service..."
    $attempt = 0
    while ($attempt -lt $MaxAttempts) {
        try {
            $connection = Test-NetConnection -ComputerName $Host -Port $Port -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
            if ($connection.TcpTestSucceeded) {
                Write-ColorOutput Green "✓ $Service ist bereit"
                return $true
            }
        } catch {
            # Ignoriere Fehler
        }
        $attempt++
        Start-Sleep -Seconds 1
    }
    
    Write-ColorOutput Red "✗ $Service ist nicht bereit nach $MaxAttempts Versuchen"
    return $false
}

# 1. Prüfe Voraussetzungen
Write-ColorOutput Blue "1. Prüfe Voraussetzungen..."
$missingDeps = @()

if (-not (Test-Command "node")) { $missingDeps += "Node.js" }
if (-not (Test-Command "pnpm")) { $missingDeps += "pnpm" }
if (-not (Test-Command "docker")) { $missingDeps += "Docker" }

# Prüfe docker-compose (kann docker compose sein)
$dockerComposeExists = $false
if (Get-Command "docker-compose" -ErrorAction SilentlyContinue) {
    $dockerComposeExists = $true
    Write-ColorOutput Green "✓ docker-compose gefunden"
} elseif (docker compose version 2>$null) {
    $dockerComposeExists = $true
    Write-ColorOutput Green "✓ docker compose gefunden"
} else {
    Write-ColorOutput Red "✗ docker-compose nicht gefunden"
    $missingDeps += "Docker Compose"
}

if ($missingDeps.Count -gt 0) {
    Write-ColorOutput Red "`nFehlende Abhängigkeiten gefunden!"
    Write-ColorOutput Yellow "Bitte installiere die fehlenden Tools:"
    Write-Output "  - Node.js >= 20.9.0: https://nodejs.org/"
    Write-Output "  - pnpm >= 9.0.0: npm install -g pnpm"
    Write-Output "  - Docker: https://docs.docker.com/get-docker/"
    exit 1
}

# Prüfe Node.js Version
$nodeVersion = (node -v).Substring(1) -replace '^(\d+\.\d+).*', '$1'
$requiredVersion = "20.9"
if ([version]$nodeVersion -lt [version]$requiredVersion) {
    Write-ColorOutput Red "✗ Node.js Version $nodeVersion gefunden, aber >= $requiredVersion erforderlich"
    exit 1
}
Write-ColorOutput Green "✓ Node.js Version: $(node -v)"

# Prüfe pnpm Version
$pnpmVersion = (pnpm -v).Split('.')[0]
if ([int]$pnpmVersion -lt 9) {
    Write-ColorOutput Red "✗ pnpm Version $(pnpm -v) gefunden, aber >= 9.0.0 erforderlich"
    exit 1
}
Write-ColorOutput Green "✓ pnpm Version: $(pnpm -v)`n"

# 2. Erstelle .env aus .env.example falls nicht vorhanden
Write-ColorOutput Blue "2. Prüfe .env Datei..."
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-ColorOutput Green "✓ .env aus .env.example erstellt"
        Write-ColorOutput Yellow "⚠ Bitte bearbeite .env und passe die Werte an (besonders JWT_SECRET und API Keys)"
    } else {
        Write-ColorOutput Yellow "⚠ .env.example nicht gefunden, erstelle .env manuell"
    }
} else {
    Write-ColorOutput Green "✓ .env bereits vorhanden"
}
Write-Output ""

# 3. Installiere Dependencies
Write-ColorOutput Blue "3. Installiere Dependencies..."
pnpm install
Write-ColorOutput Green "✓ Dependencies installiert`n"

# 4. Starte Docker Compose Services
Write-ColorOutput Blue "4. Starte Docker Compose Services..."
if (Test-Path "docker-compose.yml") {
    # Verwende docker compose oder docker-compose
    if (docker compose version 2>$null) {
        docker compose up -d
    } else {
        docker-compose up -d
    }
    Write-ColorOutput Green "✓ Docker Compose Services gestartet"
    
    # Warte auf Services
    Wait-ForService -Host "localhost" -Port 5432 -Service "PostgreSQL"
    Wait-ForService -Host "localhost" -Port 6379 -Service "Redis"
} else {
    Write-ColorOutput Yellow "⚠ docker-compose.yml nicht gefunden"
    Write-ColorOutput Yellow "⚠ Bitte starte PostgreSQL und Redis manuell"
}
Write-Output ""

# 5. Führe Datenbank-Migrationen aus
Write-ColorOutput Blue "5. Führe Datenbank-Migrationen aus..."
try {
    pnpm db:migrate
    Write-ColorOutput Green "✓ Migrationen erfolgreich"
} catch {
    Write-ColorOutput Yellow "⚠ Migrationen fehlgeschlagen, aber Setup wird fortgesetzt"
}
Write-Output ""

# 6. Type-Check (optional)
Write-ColorOutput Blue "6. Führe Type-Check aus..."
try {
    pnpm type-check
    Write-ColorOutput Green "✓ Type-Check erfolgreich"
} catch {
    Write-ColorOutput Yellow "⚠ Type-Check mit Fehlern, aber Setup wird fortgesetzt"
}
Write-Output ""

# Zusammenfassung
Write-ColorOutput Cyan "Setup abgeschlossen!`n"
Write-ColorOutput Green "Nächste Schritte:"
Write-Output "  1. Bearbeite .env und setze JWT_SECRET und API Keys"
Write-Output "  2. Starte die Services: pnpm dev:mvp"
Write-Output "  3. Prüfe Health: pnpm smoke"
Write-Output ""

# WattOS_Plattform Bereinigungsskript
# Bereinigt Build-Artefakte, Logs, Caches und optimiert Cursor Settings

param(
    [switch]$SkipCursorCheck = $false,
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

# Farben für Ausgabe
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Success($message) {
    Write-ColorOutput Green "✓ $message"
}

function Write-Info($message) {
    Write-ColorOutput Cyan "ℹ $message"
}

function Write-WarningMsg($message) {
    Write-ColorOutput Yellow "⚠ $message"
}

function Write-ErrorMsg($message) {
    Write-ColorOutput Red "✗ $message"
}

# Statistik
$stats = @{
    FilesDeleted = 0
    DirsDeleted = 0
    BytesDeleted = 0
    Errors = 0
}

function Get-Size($path) {
    if (Test-Path $path) {
        if ((Get-Item $path) -is [System.IO.DirectoryInfo]) {
            return (Get-ChildItem -Path $path -Recurse -File -ErrorAction SilentlyContinue | 
                    Measure-Object -Property Length -Sum).Sum
        } else {
            return (Get-Item $path).Length
        }
    }
    return 0
}

function Remove-Safe($path, $description) {
    if (-not (Test-Path $path)) {
        return $false
    }
    
    try {
        $size = Get-Size $path
        if ($DryRun) {
            Write-Info "[DRY RUN] Würde löschen: $path ($([math]::Round($size / 1MB, 2)) MB)"
            $stats.BytesDeleted += $size
            return $true
        }
        
        if ((Get-Item $path) -is [System.IO.DirectoryInfo]) {
            Remove-Item -Path $path -Recurse -Force -ErrorAction Stop
            $stats.DirsDeleted++
        } else {
            Remove-Item -Path $path -Force -ErrorAction Stop
            $stats.FilesDeleted++
        }
        
        $stats.BytesDeleted += $size
        Write-Success "$description gelöscht: $path ($([math]::Round($size / 1MB, 2)) MB)"
        return $true
    } catch {
        Write-ErrorMsg "Fehler beim Löschen von $path : $_"
        $stats.Errors++
        return $false
    }
}

# Projekt-Root
$projectRoot = "C:\cursor.ai\WattOS_Plattform"
if (-not (Test-Path $projectRoot)) {
    Write-ErrorMsg "Projekt-Root nicht gefunden: $projectRoot"
    exit 1
}

Set-Location $projectRoot

Write-Info "=== WattOS_Plattform Bereinigung ==="
Write-Info "Projekt-Root: $projectRoot"
Write-Info "Dry Run: $DryRun"
Write-Output ""

# 1. Prüfe ob Cursor läuft
if (-not $SkipCursorCheck) {
    Write-Info "Prüfe ob Cursor läuft..."
    $cursorProcesses = Get-Process -Name "Cursor" -ErrorAction SilentlyContinue
    if ($cursorProcesses) {
        Write-WarningMsg "Cursor läuft noch! Bitte schließen Sie Cursor vor der Bereinigung."
        Write-WarningMsg "Prozesse:"
        $cursorProcesses | ForEach-Object { Write-WarningMsg "  - PID $($_.Id) (gestartet: $($_.StartTime))" }
        Write-WarningMsg ""
        $continue = Read-Host "Möchten Sie trotzdem fortfahren? (j/n)"
        if ($continue -ne "j" -and $continue -ne "J" -and $continue -ne "y" -and $continue -ne "Y") {
            Write-Info "Bereinigung abgebrochen."
            exit 0
        }
    } else {
        Write-Success "Cursor läuft nicht."
    }
    Write-Output ""
}

# 2. Build-Artefakte bereinigen
Write-Info "=== 1. Build-Artefakte bereinigen ==="

$buildDirs = @(
    "dist",
    "build",
    ".next",
    ".turbo",
    ".output",
    ".svelte-kit",
    "out",
    ".cache"
)

foreach ($dir in $buildDirs) {
    # Im Root
    Remove-Safe "$projectRoot\$dir" "Build-Verzeichnis"
    
    # In allen Unterverzeichnissen
    Get-ChildItem -Path $projectRoot -Directory -Recurse -Filter $dir -ErrorAction SilentlyContinue | 
        Where-Object { $_.FullName -notlike "*\node_modules\*" -and $_.FullName -notlike "*\.git\*" } |
        ForEach-Object {
            Remove-Safe $_.FullName "Build-Verzeichnis"
        }
}

# TypeScript Build-Info Dateien
Write-Info "Lösche *.tsbuildinfo Dateien..."
Get-ChildItem -Path $projectRoot -Recurse -Filter "*.tsbuildinfo" -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -notlike "*\node_modules\*" -and $_.FullName -notlike "*\.git\*" } |
    ForEach-Object {
        Remove-Safe $_.FullName "TypeScript Build-Info"
    }

# Source Map Dateien
Write-Info "Lösche *.map Dateien..."
Get-ChildItem -Path $projectRoot -Recurse -Filter "*.map" -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -notlike "*\node_modules\*" -and $_.FullName -notlike "*\.git\*" } |
    ForEach-Object {
        Remove-Safe $_.FullName "Source Map"
    }

Write-Output ""

# 3. Log-Dateien bereinigen
Write-Info "=== 2. Log-Dateien bereinigen ==="

Get-ChildItem -Path $projectRoot -Recurse -Filter "*.log" -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -notlike "*\node_modules\*" -and $_.FullName -notlike "*\.git\*" } |
    ForEach-Object {
        Remove-Safe $_.FullName "Log-Datei"
    }

Write-Output ""

# 4. Projekt-Cache bereinigen
Write-Info "=== 3. Projekt-Cache bereinigen ==="

$projectCacheDirs = @(
    ".cursor",
    ".cursor-cache",
    ".cursor-index"
)

foreach ($dir in $projectCacheDirs) {
    # Im Root
    Remove-Safe "$projectRoot\$dir" "Projekt-Cache"
    
    # In allen Unterverzeichnissen
    Get-ChildItem -Path $projectRoot -Directory -Recurse -Filter $dir -ErrorAction SilentlyContinue |
        Where-Object { $_.FullName -notlike "*\node_modules\*" -and $_.FullName -notlike "*\.git\*" } |
        ForEach-Object {
            Remove-Safe $_.FullName "Projekt-Cache"
        }
}

Write-Output ""

# 5. Cursor-Cache bereinigen (SICHER - behält Chat-Daten)
Write-Info "=== 4. Cursor-Cache bereinigen (sicher) ==="

$cursorCacheDirs = @(
    "$env:APPDATA\Cursor\Cache",
    "$env:LOCALAPPDATA\Cursor\Cache",
    "$env:APPDATA\Cursor\CachedData",
    "$env:LOCALAPPDATA\Cursor\CachedData",
    "$env:APPDATA\Cursor\GPUCache",
    "$env:LOCALAPPDATA\Cursor\GPUCache",
    "$env:APPDATA\Cursor\Code Cache",
    "$env:LOCALAPPDATA\Cursor\Code Cache"
)

foreach ($dir in $cursorCacheDirs) {
    Remove-Safe $dir "Cursor-Cache"
}

Write-Info "Chat-Daten werden NICHT gelöscht (IndexedDB, Local Storage, Session Storage)"
Write-Output ""

# 6. Cursor Settings optimieren
Write-Info "=== 5. Cursor Settings optimieren ==="

$settingsPath = "$env:APPDATA\Cursor\User\settings.json"
$settingsDir = Split-Path $settingsPath -Parent

if (-not (Test-Path $settingsDir)) {
    New-Item -ItemType Directory -Path $settingsDir -Force | Out-Null
    Write-Success "Settings-Verzeichnis erstellt: $settingsDir"
}

$settings = @{}
if (Test-Path $settingsPath) {
    try {
        $settings = Get-Content $settingsPath -Raw | ConvertFrom-Json -AsHashtable
        Write-Info "Bestehende Settings geladen."
    } catch {
        Write-WarningMsg "Fehler beim Laden der Settings, erstelle neue Datei."
        $settings = @{}
    }
} else {
    Write-Info "Settings-Datei existiert nicht, erstelle neue."
}

# Settings aktualisieren (optimiert für bessere Performance)
$settingsToUpdate = @{
    "cursor.chat.maxContextFiles" = 20
    "cursor.chat.maxContextTokens" = 4000
    "cursor.indexing.maxFiles" = 50000
    "cursor.indexing.maxFileSize" = 1048576
    "cursor.general.enableHTTP2" = $false
    "http.timeout" = 120000
    "cursor.general.requestTimeout" = 120000
    "cursor.chat.requestTimeout" = 180000
}

$updated = 0
foreach ($key in $settingsToUpdate.Keys) {
    if ($settings.ContainsKey($key)) {
        if ($settings[$key] -ne $settingsToUpdate[$key]) {
            Write-Info "Aktualisiere: $key = $($settingsToUpdate[$key]) (vorher: $($settings[$key]))"
            $settings[$key] = $settingsToUpdate[$key]
            $updated++
        }
    } else {
        Write-Info "Hinzufüge: $key = $($settingsToUpdate[$key])"
        $settings[$key] = $settingsToUpdate[$key]
        $updated++
    }
}

if ($updated -gt 0 -and -not $DryRun) {
    try {
        # Konvertiere Hashtable zu JSON (mit korrekter Formatierung)
        $jsonContent = $settings | ConvertTo-Json -Depth 10
        $jsonContent | Set-Content $settingsPath -Encoding UTF8
        Write-Success "Settings aktualisiert: $updated Einstellungen geändert/hinzugefügt"
    } catch {
        Write-ErrorMsg "Fehler beim Speichern der Settings: $_"
        $stats.Errors++
    }
} elseif ($updated -eq 0) {
    Write-Info "Alle Settings sind bereits optimal konfiguriert."
} else {
    Write-Info "[DRY RUN] Würde $updated Settings aktualisieren."
}

Write-Output ""

# Zusammenfassung
Write-Info "=== Zusammenfassung ==="
Write-Output ""
Write-Info "Gelöschte Dateien: $($stats.FilesDeleted)"
Write-Info "Gelöschte Verzeichnisse: $($stats.DirsDeleted)"
Write-Info "Gesamtgröße: $([math]::Round($stats.BytesDeleted / 1MB, 2)) MB"
Write-Info "Fehler: $($stats.Errors)"
Write-Output ""

if ($DryRun) {
    Write-WarningMsg "Dies war ein DRY RUN - keine Dateien wurden tatsächlich gelöscht."
} else {
    Write-Success "Bereinigung abgeschlossen!"
    Write-Output ""
    Write-Info "Nächste Schritte:"
    Write-Info "1. Cursor komplett neu starten"
    Write-Info "2. Projekt erneut öffnen"
    Write-Info "3. Indexierung abwarten"
}


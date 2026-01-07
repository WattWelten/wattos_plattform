# WattOS_Plattform Bereinigungsskript - Optimiert
# Bereinigt Build-Artefakte, Logs, Caches und optimiert Cursor Settings
# Version: 3.0

param(
    [switch]$SkipCursorCheck = $false,
    [switch]$DryRun = $false
)

$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

# Statistik
$script:stats = @{
    FilesDeleted = 0
    DirsDeleted = 0
    BytesDeleted = 0
    Errors = 0
    SettingsUpdated = 0
}

function Write-ColorOutput {
    param(
        [string]$ForegroundColor,
        [string]$Message
    )
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    Write-Output $Message
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Success($message) {
    Write-ColorOutput -ForegroundColor Green "✓ $message"
}

function Write-Info($message) {
    Write-ColorOutput -ForegroundColor Cyan "ℹ $message"
}

function Write-WarningMsg($message) {
    Write-ColorOutput -ForegroundColor Yellow "⚠ $message"
}

function Write-ErrorMsg($message) {
    Write-ColorOutput -ForegroundColor Red "✗ $message"
}

function Get-Size($path) {
    if (Test-Path $path) {
        try {
            if ((Get-Item $path) -is [System.IO.DirectoryInfo]) {
                $size = (Get-ChildItem -Path $path -Recurse -File -ErrorAction SilentlyContinue | 
                        Measure-Object -Property Length -Sum -ErrorAction SilentlyContinue).Sum
                return if ($size) { $size } else { 0 }
            } else {
                return (Get-Item $path -ErrorAction SilentlyContinue).Length
            }
        } catch {
            return 0
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
            $sizeMB = [math]::Round($size / 1MB, 2)
            Write-Info "[DRY RUN] Würde löschen: $path ($sizeMB MB)"
            $script:stats.BytesDeleted += $size
            if ((Get-Item $path) -is [System.IO.DirectoryInfo]) {
                $script:stats.DirsDeleted++
            } else {
                $script:stats.FilesDeleted++
            }
            return $true
        }
        
        if ((Get-Item $path) -is [System.IO.DirectoryInfo]) {
            Remove-Item -Path $path -Recurse -Force -ErrorAction Stop
            $script:stats.DirsDeleted++
        } else {
            Remove-Item -Path $path -Force -ErrorAction Stop
            $script:stats.FilesDeleted++
        }
        
        $script:stats.BytesDeleted += $size
        $sizeMB = [math]::Round($size / 1MB, 2)
        Write-Success "$description gelöscht: $path ($sizeMB MB)"
        return $true
    } catch {
        Write-ErrorMsg "Fehler beim Löschen von $path : $_"
        $script:stats.Errors++
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

Write-Info "=== WattOS_Plattform Bereinigung (Optimiert) ==="
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
        $cursorProcesses | ForEach-Object { 
            Write-WarningMsg "  - PID $($_.Id) (gestartet: $($_.StartTime))" 
        }
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

$buildDirCount = 0
foreach ($dir in $buildDirs) {
    # Im Root
    if (Remove-Safe "$projectRoot\$dir" "Build-Verzeichnis") {
        $buildDirCount++
    }
    
    # In allen Unterverzeichnissen
    $foundDirs = Get-ChildItem -Path $projectRoot -Directory -Recurse -Filter $dir -ErrorAction SilentlyContinue | 
        Where-Object { 
            $_.FullName -notlike "*\node_modules\*" -and 
            $_.FullName -notlike "*\.git\*" 
        }
    
    foreach ($foundDir in $foundDirs) {
        if (Remove-Safe $foundDir.FullName "Build-Verzeichnis") {
            $buildDirCount++
        }
    }
}

if ($buildDirCount -eq 0) {
    Write-Info "Keine Build-Verzeichnisse gefunden."
}

# TypeScript Build-Info Dateien
Write-Info "Lösche *.tsbuildinfo Dateien..."
$tsbuildinfoCount = 0
$tsbuildinfoFiles = Get-ChildItem -Path $projectRoot -Recurse -Filter "*.tsbuildinfo" -ErrorAction SilentlyContinue |
    Where-Object { 
        $_.FullName -notlike "*\node_modules\*" -and 
        $_.FullName -notlike "*\.git\*" 
    }

foreach ($file in $tsbuildinfoFiles) {
    if (Remove-Safe $file.FullName "TypeScript Build-Info") {
        $tsbuildinfoCount++
    }
}

if ($tsbuildinfoCount -eq 0) {
    Write-Info "Keine *.tsbuildinfo Dateien gefunden."
} else {
    Write-Info "Gefunden: $tsbuildinfoCount *.tsbuildinfo Dateien"
}

# Source Map Dateien
Write-Info "Lösche *.map Dateien..."
$mapCount = 0
$mapFiles = Get-ChildItem -Path $projectRoot -Recurse -Filter "*.map" -ErrorAction SilentlyContinue |
    Where-Object { 
        $_.FullName -notlike "*\node_modules\*" -and 
        $_.FullName -notlike "*\.git\*" 
    }

foreach ($file in $mapFiles) {
    if (Remove-Safe $file.FullName "Source Map") {
        $mapCount++
    }
}

if ($mapCount -eq 0) {
    Write-Info "Keine *.map Dateien gefunden."
} else {
    Write-Info "Gefunden: $mapCount *.map Dateien"
}

Write-Output ""

# 3. Log-Dateien bereinigen
Write-Info "=== 2. Log-Dateien bereinigen ==="

$logCount = 0
$logFiles = Get-ChildItem -Path $projectRoot -Recurse -Filter "*.log" -ErrorAction SilentlyContinue |
    Where-Object { 
        $_.FullName -notlike "*\node_modules\*" -and 
        $_.FullName -notlike "*\.git\*" 
    }

foreach ($file in $logFiles) {
    if (Remove-Safe $file.FullName "Log-Datei") {
        $logCount++
    }
}

if ($logCount -eq 0) {
    Write-Info "Keine *.log Dateien gefunden."
} else {
    Write-Info "Gefunden: $logCount *.log Dateien"
}

Write-Output ""

# 4. Projekt-Cache bereinigen
Write-Info "=== 3. Projekt-Cache bereinigen ==="

$projectCacheDirs = @(
    ".cursor",
    ".cursor-cache",
    ".cursor-index"
)

$cacheDirCount = 0
foreach ($dir in $projectCacheDirs) {
    # Im Root
    if (Remove-Safe "$projectRoot\$dir" "Projekt-Cache") {
        $cacheDirCount++
    }
    
    # In allen Unterverzeichnissen
    $foundDirs = Get-ChildItem -Path $projectRoot -Directory -Recurse -Filter $dir -ErrorAction SilentlyContinue |
        Where-Object { 
            $_.FullName -notlike "*\node_modules\*" -and 
            $_.FullName -notlike "*\.git\*" 
        }
    
    foreach ($foundDir in $foundDirs) {
        if (Remove-Safe $foundDir.FullName "Projekt-Cache") {
            $cacheDirCount++
        }
    }
}

if ($cacheDirCount -eq 0) {
    Write-Info "Keine Projekt-Cache-Verzeichnisse gefunden."
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

$cursorCacheCount = 0
foreach ($dir in $cursorCacheDirs) {
    if (Remove-Safe $dir "Cursor-Cache") {
        $cursorCacheCount++
    }
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
        $content = Get-Content $settingsPath -Raw -ErrorAction Stop
        if ($content -and $content.Trim()) {
            # PowerShell 5.1 Kompatibilität: ConvertFrom-Json gibt PSCustomObject zurück
            $jsonObj = $content | ConvertFrom-Json -ErrorAction Stop
            # Konvertiere PSCustomObject zu Hashtable
            $settings = @{}
            $jsonObj.PSObject.Properties | ForEach-Object {
                $settings[$_.Name] = $_.Value
            }
            Write-Info "Bestehende Settings geladen."
        } else {
            $settings = @{}
            Write-Info "Settings-Datei ist leer, erstelle neue."
        }
    } catch {
        Write-WarningMsg "Fehler beim Laden der Settings: $_"
        Write-Info "Erstelle neue Settings-Datei."
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
$updatedSettings = @()
foreach ($key in $settingsToUpdate.Keys) {
    $newValue = $settingsToUpdate[$key]
    if ($settings.ContainsKey($key)) {
        $oldValue = $settings[$key]
        if ($oldValue -ne $newValue) {
            Write-Info "Aktualisiere: $key = $newValue (vorher: $oldValue)"
            $updatedSettings += "$key`: $oldValue -> $newValue"
            $settings[$key] = $newValue
            $updated++
        }
    } else {
        Write-Info "Hinzufüge: $key = $newValue"
        $updatedSettings += "$key`: (neu) -> $newValue"
        $settings[$key] = $newValue
        $updated++
    }
}

if ($updated -gt 0 -and -not $DryRun) {
    try {
        # Konvertiere Hashtable zu JSON (mit korrekter Formatierung)
        $jsonContent = $settings | ConvertTo-Json -Depth 10 -ErrorAction Stop
        $jsonContent | Set-Content $settingsPath -Encoding UTF8 -ErrorAction Stop
        $script:stats.SettingsUpdated = $updated
        Write-Success "Settings aktualisiert: $updated Einstellungen geändert/hinzugefügt"
        Write-Info "Geänderte Settings:"
        foreach ($setting in $updatedSettings) {
            Write-Info "  - $setting"
        }
    } catch {
        Write-ErrorMsg "Fehler beim Speichern der Settings: $_"
        $script:stats.Errors++
    }
} elseif ($updated -eq 0) {
    Write-Info "Alle Settings sind bereits optimal konfiguriert."
} else {
    Write-Info "[DRY RUN] Würde $updated Settings aktualisieren."
    foreach ($setting in $updatedSettings) {
        Write-Info "  - $setting"
    }
}

Write-Output ""

# 7. .cursorignore prüfen
Write-Info "=== 6. .cursorignore prüfen ==="

$cursorignorePath = "$projectRoot\.cursorignore"
$requiredPatterns = @(
    "*.tsbuildinfo",
    "**/*.tsbuildinfo",
    ".next/",
    "**/.next/",
    ".turbo/",
    "**/.turbo/",
    "dist/",
    "**/dist/",
    "build/",
    "**/build/",
    "*.map",
    "**/*.map",
    ".cache/",
    "**/.cache/"
)

if (Test-Path $cursorignorePath) {
    $existingContent = Get-Content $cursorignorePath -Raw
    $missingPatterns = @()
    
    foreach ($pattern in $requiredPatterns) {
        $normalizedPattern = $pattern.Trim()
        if ($existingContent -notmatch [regex]::Escape($normalizedPattern)) {
            $missingPatterns += $normalizedPattern
        }
    }
    
    if ($missingPatterns.Count -eq 0) {
        Write-Success ".cursorignore enthält alle erforderlichen Patterns."
    } else {
        Write-WarningMsg "Fehlende Patterns in .cursorignore gefunden: $($missingPatterns.Count)"
        if (-not $DryRun) {
            $newContent = $existingContent + "`n# Fehlende Patterns hinzugefügt`n"
            foreach ($pattern in $missingPatterns) {
                $newContent += "$pattern`n"
                Write-Info "Hinzufüge: $pattern"
            }
            Add-Content -Path $cursorignorePath -Value $newContent -Encoding UTF8
            Write-Success ".cursorignore erweitert."
        } else {
            Write-Info "[DRY RUN] Würde folgende Patterns hinzufügen:"
            foreach ($pattern in $missingPatterns) {
                Write-Info "  - $pattern"
            }
        }
    }
} else {
    Write-WarningMsg ".cursorignore existiert nicht."
    if (-not $DryRun) {
        $newContent = "# .cursorignore für WattOS_Plattform`n# Automatisch generiert`n`n"
        foreach ($pattern in $requiredPatterns) {
            $newContent += "$pattern`n"
        }
        Set-Content -Path $cursorignorePath -Value $newContent -Encoding UTF8
        Write-Success ".cursorignore erstellt mit allen erforderlichen Patterns."
    } else {
        Write-Info "[DRY RUN] Würde .cursorignore erstellen mit:"
        foreach ($pattern in $requiredPatterns) {
            Write-Info "  - $pattern"
        }
    }
}

Write-Output ""

# Zusammenfassung
Write-Info "=== Zusammenfassung ==="
Write-Output ""
Write-Info "Gelöschte Dateien: $($script:stats.FilesDeleted)"
Write-Info "Gelöschte Verzeichnisse: $($script:stats.DirsDeleted)"
$totalMB = [math]::Round($script:stats.BytesDeleted / 1MB, 2)
Write-Info "Gesamtgröße gelöscht: $totalMB MB"
Write-Info "Freigegebener Speicherplatz: $totalMB MB"
Write-Info "Fehler: $($script:stats.Errors)"
if ($script:stats.SettingsUpdated -gt 0) {
    Write-Info "Optimierte Settings: $($script:stats.SettingsUpdated)"
}
Write-Output ""

if ($DryRun) {
    Write-WarningMsg "Dies war ein DRY RUN - keine Dateien wurden tatsächlich gelöscht."
    Write-Output ""
    Write-Info "Um die Bereinigung durchzuführen, führen Sie das Skript ohne -DryRun aus:"
    Write-Info "  .\cleanup-wattos-optimized.ps1"
} else {
    Write-Success "Bereinigung abgeschlossen!"
    Write-Output ""
    Write-Info "Nächste Schritte:"
    Write-Info "1. Cursor komplett neu starten (alle Fenster schließen)"
    Write-Info "2. Projekt erneut öffnen: C:\cursor.ai\WattOS_Plattform"
    Write-Info "3. Indexierung abwarten (kann einige Minuten dauern)"
    Write-Info "4. Teste, ob Serialisierungsfehler behoben ist"
    Write-Output ""
    Write-Info "Best Practices:"
    Write-Info "- Neuer Agent/Chat für neue Aufgaben verwenden"
    Write-Info "- Lange Chat-Verläufe vermeiden (>100 Nachrichten)"
    Write-Info "- Separate Agents für verschiedene Projekte"
    Write-Info "- Regelmäßig neue Chats starten (alle 30-50 Nachrichten)"
}


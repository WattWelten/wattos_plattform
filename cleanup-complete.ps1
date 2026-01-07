# WattOS_Plattform - Umfassendes Cleanup und Optimierung
# Version: 4.0 - Vollständig überarbeitet

param(
    [switch]$SkipCursorCheck = $false
)

$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

# Statistik
$script:stats = @{
    FilesDeleted = 0
    DirsDeleted = 0
    BytesDeleted = 0
    Errors = 0
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

Write-Info "=== WattOS_Plattform - Umfassendes Cleanup ==="
Write-Info "Projekt-Root: $projectRoot"
Write-Output ""

# 1. Build-Artefakte bereinigen
Write-Info "=== 1. Build-Artefakte bereinigen ==="

$buildDirs = @("dist", "build", ".next", ".turbo", ".output", ".svelte-kit", "out", ".cache")

foreach ($dir in $buildDirs) {
    if (Remove-Safe "$projectRoot\$dir" "Build-Verzeichnis") { }
    
    Get-ChildItem -Path $projectRoot -Directory -Recurse -Filter $dir -ErrorAction SilentlyContinue | 
        Where-Object { 
            $_.FullName -notlike "*\node_modules\*" -and 
            $_.FullName -notlike "*\.git\*" 
        } | ForEach-Object {
            Remove-Safe $_.FullName "Build-Verzeichnis"
        }
}

# TypeScript Build-Info
$tsbuildinfoFiles = Get-ChildItem -Path $projectRoot -Recurse -Filter "*.tsbuildinfo" -ErrorAction SilentlyContinue |
    Where-Object { 
        $_.FullName -notlike "*\node_modules\*" -and 
        $_.FullName -notlike "*\.git\*" 
    }

foreach ($file in $tsbuildinfoFiles) {
    Remove-Safe $file.FullName "TypeScript Build-Info"
}

# Source Maps
$mapFiles = Get-ChildItem -Path $projectRoot -Recurse -Filter "*.map" -ErrorAction SilentlyContinue |
    Where-Object { 
        $_.FullName -notlike "*\node_modules\*" -and 
        $_.FullName -notlike "*\.git\*" 
    }

foreach ($file in $mapFiles) {
    Remove-Safe $file.FullName "Source Map"
}

Write-Output ""

# 2. Log-Dateien bereinigen
Write-Info "=== 2. Log-Dateien bereinigen ==="

$logFiles = Get-ChildItem -Path $projectRoot -Recurse -Filter "*.log" -ErrorAction SilentlyContinue |
    Where-Object { 
        $_.FullName -notlike "*\node_modules\*" -and 
        $_.FullName -notlike "*\.git\*" 
    }

foreach ($file in $logFiles) {
    Remove-Safe $file.FullName "Log-Datei"
}

Write-Output ""

# 3. Test-Artefakte bereinigen
Write-Info "=== 3. Test-Artefakte bereinigen ==="

$testDirs = @("playwright-report", "test-results", "coverage", ".nyc_output", "htmlcov")

foreach ($dir in $testDirs) {
    if (Remove-Safe "$projectRoot\$dir" "Test-Verzeichnis") { }
    
    Get-ChildItem -Path $projectRoot -Directory -Recurse -Filter $dir -ErrorAction SilentlyContinue | 
        Where-Object { 
            $_.FullName -notlike "*\node_modules\*" -and 
            $_.FullName -notlike "*\.git\*" 
        } | ForEach-Object {
            Remove-Safe $_.FullName "Test-Verzeichnis"
        }
}

Write-Output ""

# 4. Projekt-Cache bereinigen
Write-Info "=== 4. Projekt-Cache bereinigen ==="

$projectCacheDirs = @(".cursor", ".cursor-cache", ".cursor-index", ".eslintcache", ".stylelintcache", ".vite", ".rollup")

foreach ($dir in $projectCacheDirs) {
    if (Remove-Safe "$projectRoot\$dir" "Projekt-Cache") { }
    
    Get-ChildItem -Path $projectRoot -Directory -Recurse -Filter $dir -ErrorAction SilentlyContinue |
        Where-Object { 
            $_.FullName -notlike "*\node_modules\*" -and 
            $_.FullName -notlike "*\.git\*" 
        } | ForEach-Object {
            Remove-Safe $_.FullName "Projekt-Cache"
        }
}

Write-Output ""

# 5. pnpm Cache bereinigen
Write-Info "=== 5. pnpm Cache bereinigen ==="

try {
    $pnpmStore = "$env:LOCALAPPDATA\pnpm\store"
    if (Test-Path $pnpmStore) {
        $size = Get-Size $pnpmStore
        $sizeMB = [math]::Round($size / 1MB, 2)
        Write-Info "pnpm Store gefunden: $sizeMB MB"
        Write-Info "Hinweis: pnpm Store wird normalerweise nicht gelöscht (wird für alle Projekte geteilt)"
        Write-Info "Falls gewünscht, führen Sie manuell aus: pnpm store prune"
    }
    
    # pnpm Cache im Projekt
    $pnpmCacheDirs = @(".pnpm-store", ".pnpm")
    foreach ($dir in $pnpmCacheDirs) {
        if (Remove-Safe "$projectRoot\$dir" "pnpm Cache") { }
        
        Get-ChildItem -Path $projectRoot -Directory -Recurse -Filter $dir -ErrorAction SilentlyContinue |
            Where-Object { 
                $_.FullName -notlike "*\node_modules\*" -and 
                $_.FullName -notlike "*\.git\*" 
            } | ForEach-Object {
                Remove-Safe $_.FullName "pnpm Cache"
            }
    }
} catch {
    Write-WarningMsg "Fehler beim Bereinigen des pnpm Caches: $_"
}

Write-Output ""

# 6. Temporäre Dateien bereinigen
Write-Info "=== 6. Temporäre Dateien bereinigen ==="

$tempPatterns = @("*.tmp", "*.temp", "*.bak", "*.backup", "*.swp", "*.swo", "*~")

foreach ($pattern in $tempPatterns) {
    $tempFiles = Get-ChildItem -Path $projectRoot -Recurse -Filter $pattern -ErrorAction SilentlyContinue |
        Where-Object { 
            $_.FullName -notlike "*\node_modules\*" -and 
            $_.FullName -notlike "*\.git\*" 
        }
    
    foreach ($file in $tempFiles) {
        Remove-Safe $file.FullName "Temporäre Datei"
    }
}

Write-Output ""

# 7. Python Cache bereinigen
Write-Info "=== 7. Python Cache bereinigen ==="

$pythonCacheDirs = @("__pycache__", ".pytest_cache", ".mypy_cache", ".eggs", "*.egg-info")

foreach ($dir in $pythonCacheDirs) {
    Get-ChildItem -Path $projectRoot -Directory -Recurse -Filter $dir -ErrorAction SilentlyContinue | 
        Where-Object { 
            $_.FullName -notlike "*\node_modules\*" -and 
            $_.FullName -notlike "*\.git\*" -and
            $_.FullName -notlike "*\venv\*" -and
            $_.FullName -notlike "*\env\*"
        } | ForEach-Object {
            Remove-Safe $_.FullName "Python Cache"
        }
}

$pycFiles = Get-ChildItem -Path $projectRoot -Recurse -Filter "*.pyc" -ErrorAction SilentlyContinue |
    Where-Object { 
        $_.FullName -notlike "*\node_modules\*" -and 
        $_.FullName -notlike "*\.git\*" 
    }

foreach ($file in $pycFiles) {
    Remove-Safe $file.FullName "Python Bytecode"
}

Write-Output ""

# Zusammenfassung
Write-Info "=== Zusammenfassung ==="
Write-Output ""
Write-Info "Gelöschte Dateien: $($script:stats.FilesDeleted)"
Write-Info "Gelöschte Verzeichnisse: $($script:stats.DirsDeleted)"
$totalMB = [math]::Round($script:stats.BytesDeleted / 1MB, 2)
$totalGB = [math]::Round($script:stats.BytesDeleted / 1GB, 2)
Write-Info "Gesamtgröße gelöscht: $totalMB MB ($totalGB GB)"
Write-Info "Fehler: $($script:stats.Errors)"
Write-Output ""

Write-Success "Cleanup abgeschlossen!"
Write-Output ""
Write-Info "Nächste Schritte:"
Write-Info "1. Optional: pnpm store prune (bereinigt ungenutzte Pakete aus dem pnpm Store)"
Write-Info "2. Optional: pnpm install (neu installieren, falls nötig)"
Write-Info "3. Projekt neu öffnen für optimale Performance"



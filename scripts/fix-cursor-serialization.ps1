# Cursor Serialisierungsfehler beheben
# Dieses Skript fuehrt die automatisierten Schritte zur Behebung des Serialisierungsfehlers aus

Write-Host "=== Cursor Serialisierungsfehler beheben ===" -ForegroundColor Green
Write-Host ""

# Schritt 1: Pruefen, ob Cursor laeuft
Write-Host "[1/5] Pruefe, ob Cursor laeuft..." -ForegroundColor Yellow
$cursorProcesses = Get-Process -Name "Cursor" -ErrorAction SilentlyContinue
if ($cursorProcesses) {
    Write-Host "WARNUNG: Cursor laeuft noch! Bitte schliessen Sie alle Cursor-Fenster und fuehren Sie das Skript erneut aus." -ForegroundColor Red
    Write-Host "Druecken Sie eine Taste, um fortzufahren (Cursor wird NICHT automatisch geschlossen)..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
} else {
    Write-Host "OK: Cursor laeuft nicht." -ForegroundColor Green
}

# Schritt 2: Cache-Verzeichnisse loeschen
Write-Host ""
Write-Host "[2/5] Loesche Cursor-Cache-Verzeichnisse..." -ForegroundColor Yellow
$appData = $env:APPDATA
$cursorCachePath = Join-Path $appData "Cursor\Cache"
$cursorCachedDataPath = Join-Path $appData "Cursor\CachedData"
$cursorUserDataPath = Join-Path $appData "Cursor\User"

$deleted = @()

if (Test-Path $cursorCachePath) {
    try {
        Remove-Item -Path $cursorCachePath -Recurse -Force -ErrorAction Stop
        Write-Host "  OK: Cache-Verzeichnis geloescht: $cursorCachePath" -ForegroundColor Green
        $deleted += $cursorCachePath
    } catch {
        Write-Host "  FEHLER: Beim Loeschen von Cache: $_" -ForegroundColor Red
    }
} else {
    Write-Host "  Info: Cache-Verzeichnis nicht gefunden: $cursorCachePath" -ForegroundColor Gray
}

if (Test-Path $cursorCachedDataPath) {
    try {
        Remove-Item -Path $cursorCachedDataPath -Recurse -Force -ErrorAction Stop
        Write-Host "  OK: CachedData-Verzeichnis geloescht: $cursorCachedDataPath" -ForegroundColor Green
        $deleted += $cursorCachedDataPath
    } catch {
        Write-Host "  FEHLER: Beim Loeschen von CachedData: $_" -ForegroundColor Red
    }
} else {
    Write-Host "  Info: CachedData-Verzeichnis nicht gefunden: $cursorCachedDataPath" -ForegroundColor Gray
}

# Schritt 3: Workspace-spezifische Einstellungen pruefen
Write-Host ""
Write-Host "[3/5] Pruefe Workspace-Einstellungen..." -ForegroundColor Yellow
$workspacePath = "D:\WattOS_Plattform"
$vscodeSettingsPath = Join-Path $workspacePath ".vscode\settings.json"
$cursorDirPath = Join-Path $workspacePath ".cursor"

if (Test-Path $vscodeSettingsPath) {
    $settingsSize = (Get-Item $vscodeSettingsPath).Length
    Write-Host "  Info: .vscode/settings.json gefunden (Groesse: $settingsSize Bytes)" -ForegroundColor Gray
    if ($settingsSize -gt 100000) {
        Write-Host "  WARNUNG: settings.json ist sehr gross (>100KB). Dies koennte Probleme verursachen." -ForegroundColor Yellow
    }
} else {
    Write-Host "  OK: Kein .vscode/settings.json gefunden" -ForegroundColor Green
}

if (Test-Path $cursorDirPath) {
    Write-Host "  Info: .cursor/ Verzeichnis gefunden" -ForegroundColor Gray
    $cursorDirSize = (Get-ChildItem -Path $cursorDirPath -Recurse -File -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
    Write-Host "  Info: Gesamtgroesse: $cursorDirSize Bytes" -ForegroundColor Gray
    if ($cursorDirSize -gt 10000000) {
        Write-Host "  WARNUNG: .cursor/ Verzeichnis ist sehr gross (>10MB). Dies koennte Probleme verursachen." -ForegroundColor Yellow
    }
} else {
    Write-Host "  OK: Kein .cursor/ Verzeichnis gefunden" -ForegroundColor Green
}

# Schritt 4: Cursor-Einstellungen sichern (optional)
Write-Host ""
Write-Host "[4/5] Pruefe Cursor-Einstellungen..." -ForegroundColor Yellow
$settingsPath = Join-Path $cursorUserDataPath "settings.json"
if (Test-Path $settingsPath) {
    $settingsSize = (Get-Item $settingsPath).Length
    Write-Host "  Info: settings.json gefunden (Groesse: $settingsSize Bytes)" -ForegroundColor Gray
    if ($settingsSize -gt 100000) {
        Write-Host "  WARNUNG: settings.json ist sehr gross (>100KB). Dies koennte Probleme verursachen." -ForegroundColor Yellow
    }
    
    # Backup erstellen
    $backupPath = "$settingsPath.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    try {
        Copy-Item -Path $settingsPath -Destination $backupPath -ErrorAction Stop
        Write-Host "  OK: Backup erstellt: $backupPath" -ForegroundColor Green
    } catch {
        Write-Host "  FEHLER: Beim Erstellen des Backups: $_" -ForegroundColor Red
    }
} else {
    Write-Host "  Info: Keine settings.json gefunden" -ForegroundColor Gray
}

# Schritt 5: Zusammenfassung
Write-Host ""
Write-Host "[5/5] Zusammenfassung" -ForegroundColor Yellow
$separator = "=" * 60
Write-Host $separator -ForegroundColor Gray
if ($deleted.Count -gt 0) {
    Write-Host "Geloeschte Cache-Verzeichnisse:" -ForegroundColor Green
    foreach ($path in $deleted) {
        Write-Host "  - $path" -ForegroundColor Gray
    }
} else {
    Write-Host "Keine Cache-Verzeichnisse gefunden oder geloescht." -ForegroundColor Gray
}

Write-Host ""
Write-Host "Naechste Schritte:" -ForegroundColor Cyan
Write-Host "1. Starten Sie Cursor neu" -ForegroundColor White
Write-Host "2. Pruefen Sie, ob der Fehler weiterhin auftritt" -ForegroundColor White
Write-Host "3. Falls ja, oeffnen Sie die Developer Tools (Help > Toggle Developer Tools)" -ForegroundColor White
Write-Host "4. Pruefen Sie die Console auf weitere Fehlermeldungen" -ForegroundColor White
Write-Host ""
Write-Host "Falls der Fehler weiterhin auftritt:" -ForegroundColor Yellow
Write-Host "- Deaktivieren Sie alle Erweiterungen temporaer" -ForegroundColor White
Write-Host "- Pruefen Sie, ob der Fehler dann verschwindet" -ForegroundColor White
Write-Host "- Aktivieren Sie Erweiterungen einzeln wieder" -ForegroundColor White
Write-Host ""
Write-Host "Skript abgeschlossen!" -ForegroundColor Green

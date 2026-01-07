# PowerShell Wrapper fÃ¼r WSL Build Script
param([string]$Package = "")
$ErrorActionPreference = "Stop"
Write-Host "ðŸ”¨ Starte Build in WSL..." -ForegroundColor Cyan
if ($Package) {
    wsl bash scripts/build-wsl.sh $Package
} else {
    wsl bash scripts/build-wsl.sh
}
Write-Host "âœ… Build abgeschlossen." -ForegroundColor Green

# Pre-Build Check Script
# Prueft, ob @wattweiser/shared gebaut wurde, bevor andere Services gebaut werden

$sharedDist = Join-Path $PSScriptRoot "packages\shared\dist\index.d.ts"
$sharedPackageJson = Join-Path $PSScriptRoot "packages\shared\package.json"

# Pruefe ob shared-Package existiert
if (-not (Test-Path $sharedPackageJson)) {
    Write-Host "[ERROR] @wattweiser/shared Package nicht gefunden!" -ForegroundColor Red
    exit 1
}

# Pruefe ob shared-Package gebaut wurde
if (-not (Test-Path $sharedDist)) {
    Write-Host "[ERROR] @wattweiser/shared muss zuerst gebaut werden!" -ForegroundColor Red
    Write-Host "[INFO] Fuehre aus: pnpm --filter @wattweiser/shared build" -ForegroundColor Yellow
    Write-Host "       Oder im Root: pnpm build --filter @wattweiser/shared" -ForegroundColor Yellow
    exit 1
}

Write-Host "[OK] @wattweiser/shared ist gebaut" -ForegroundColor Green
exit 0

